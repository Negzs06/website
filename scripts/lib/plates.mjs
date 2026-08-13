/* ============================================================
   CHRONOLITH — the plate library.
   Each entry is an original image: a fragment shader, a seed and
   an output size. Nothing here is stock, and nothing is a
   gradient with noise thrown on top — the surfaces are built from
   height fields and lit, so they read as photographed matter.
   ============================================================ */

// Shared palette, matched to src/styles/tokens.css
const PAL = /* glsl */ `
  #define BONE    srgb(231.0,226.0,214.0)
  #define PAPER   srgb(215.0,208.0,193.0)
  #define ASH     srgb(168.0,160.0,145.0)
  #define GRAPH   srgb( 83.0, 80.0, 74.0)
  #define VOID_C  srgb( 10.0, 10.0, 11.0)
  #define OXIDE   srgb(194.0, 80.0, 42.0)
  #define OXIDED  srgb(143.0, 55.0, 28.0)
  #define HALITE  srgb(139.0,176.0,167.0)
  #define HALITED srgb( 74.0,109.0,102.0)
  #define FLARE   srgb(244.0,233.0,205.0)
`;

// Height-field lighting. Finite-difference the height, light it with a
// raking key plus a cool fill — this is what separates a rendered
// surface from a noise texture.
const LIGHTING = /* glsl */ `
  vec3 shadeHeight(vec2 uv, float h, float eps, float bumpScale,
                   vec3 albedo, vec3 keyDir, vec3 keyCol, vec3 fillCol,
                   float spec, float shine)
  {
    float hx = HEIGHT(uv + vec2(eps, 0.0));
    float hy = HEIGHT(uv + vec2(0.0, eps));
    vec3 n = normalize(vec3((h - hx) * bumpScale, (h - hy) * bumpScale, eps * 2.0));
    vec3 L = normalize(keyDir);
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 H = normalize(L + V);
    float diff = max(dot(n, L), 0.0);
    float wrap = max((dot(n, L) + 0.35) / 1.35, 0.0); // soft terminator
    float sp = pow(max(dot(n, H), 0.0), shine) * spec;
    float ao = smoothstep(0.0, 0.85, h * 0.55 + 0.45);
    vec3 c = albedo * (keyCol * mix(diff, wrap, 0.55) + fillCol * (0.35 + 0.3 * n.z));
    c *= mix(0.72, 1.0, ao);
    return c + keyCol * sp;
  }
`;

// Bedding. The wobble is expressed in *beds*, not coordinate units —
// getting this wrong is what turns strata into television static. Beds
// are also stretched laterally, because real bedding stays continuous
// across a frame while varying slowly along it.
const STRATA = /* glsl */ `
  float bedCoord(vec2 uv, float nBeds, float wobbleBeds, float lateral){
    float w1 = fbm(vec2(uv.x * lateral, uv.y * 1.25) + uSeed, 5, 0.5, 2.0) - 0.5;
    float w2 = fbm(vec2(uv.x * lateral * 3.3, uv.y * 2.4) + 17.0, 4, 0.5, 2.0) - 0.5;
    return uv.y * nBeds + (w1 + w2 * 0.32) * wobbleBeds;
  }

  // x = bed id, y = position within the bed (0 at base, 1 at top),
  // z = 1 inside the bed and 0 in the parting above it.
  vec3 bedInfo(float y){
    float id = floor(y);
    float f = fract(y);
    float t = 0.34 + 0.60 * hash11(id * 1.37 + uSeed);
    float inside = smoothstep(0.0, 0.035, f) * (1.0 - smoothstep(t, t + 0.055, f));
    return vec3(id, clamp(f / max(t, 1e-3), 0.0, 1.0), inside);
  }
`;

export const PLATES = [
  /* ----------------------------------------------------------
     01 — CORE. The surface of a extracted core, full bleed.
     Warped horizontal bedding, hairline fractures, cylindrical
     limb darkening so the crop always reads as curved rock.
     ---------------------------------------------------------- */
  {
    name: 'plate-core',
    alt: 'Macro scan of an extracted CHRONOLITH core: warped horizontal bedding in bone and iron oxide, crossed by hairline fractures.',
    w: 1500,
    h: 2000,
    seed: 3.17,
    body: /* glsl */ `
      ${PAL}
      ${STRATA}
      #define NBEDS 15.0

      float relief(vec2 uv){
        vec3 b = bedInfo(bedCoord(uv, NBEDS, 0.34, 0.62));
        float hard = hash11(b.x * 2.71 + uSeed);   // resistant vs friable
        // Partings recess; resistant beds stand slightly proud.
        return b.z * (0.35 + 0.65 * hard)
             + (1.0 - b.z) * 0.05
             + fbm(uv * vec2(6.0, 20.0) + uSeed, 4, 0.5, 2.0) * 0.055;
      }
      #define HEIGHT(q) relief(q)
      ${LIGHTING}

      vec3 plate(vec2 uv){
        vec2 p = uv;
        float h = HEIGHT(p);

        vec3 b = bedInfo(bedCoord(p, NBEDS, 0.34, 0.62));
        float id = hash11(b.x * 1.37 + uSeed);
        float id2 = hash11(b.x * 5.13 + uSeed * 3.0);

        // Composition per bed, plus fining-upward within each bed: grain
        // coarsens downward, so the base of a bed reads darker.
        vec3 albedo = ramp5(id, mix(GRAPH, ASH, 0.35), ASH, PAPER, BONE, mix(BONE, FLARE, 0.4));
        albedo = mix(albedo, mix(OXIDED, OXIDE, id2), step(0.68, id2) * 0.78);
        albedo *= mix(0.82, 1.12, b.y);

        // Clay partings between beds: dark, thin, faintly green.
        albedo = mix(albedo, mix(GRAPH, HALITED, 0.35) * 0.62, (1.0 - b.z) * 0.85);

        // Internal lamination, only in the coarser beds.
        float lam = 0.5 + 0.5 * sin(b.y * 18.0 + id * 30.0);
        albedo *= mix(1.0, 0.93 + 0.07 * lam, b.z * step(0.4, id));

        // Iron staining migrates across bedding rather than along it.
        float stain = smoothstep(0.56, 0.88, fbm(p * vec2(2.0, 4.2) + 31.0, 5, 0.5, 2.0));
        albedo = mix(albedo, OXIDE * 0.95, stain * 0.42);

        vec3 col = shadeHeight(p, h, 0.0026, 3.0, albedo,
                               vec3(-0.55, 0.70, 0.44), FLARE * 1.16,
                               HALITE * 0.15, 0.14, 24.0);

        // Fractures cutting the sequence; a few refilled with calcite.
        // Gated by a low-frequency mask so they occur in zones rather
        // than ruling the whole plate with straight lines.
        vec3 vor = voronoi(p * vec2(2.0, 3.6) + 5.0);
        float zone = smoothstep(0.44, 0.72, fbm(p * 1.7 + 60.0, 4, 0.5, 2.0));
        float frac = (1.0 - smoothstep(0.0, 0.013, vor.y)) * zone;
        col = mix(col, VOID_C * 2.2, frac * 0.45);
        col = mix(col, FLARE * 0.95, frac * 0.5 * step(0.82, vor.z));

        // Cylindrical limb darkening — the core is round.
        float limb = pow(sin(clamp(uv.x, 0.001, 0.999) * PI), 0.40);
        col *= mix(0.34, 1.07, limb);
        col += FLARE * 0.10 * exp(-pow((uv.x - 0.40) * 5.5, 2.0));

        col *= vignette(uv, 0.30, 0.44);
        col = tonemap(col * 1.18);
        col = grade(col, vec3(0.012, 0.010, 0.008), vec3(0.98, 1.0, 1.06), vec3(1.02, 0.99, 0.94));
        return filmGrain(col, uv, 0.045);
      }
    `,
  },

  /* ----------------------------------------------------------
     02 — VAULT. The salt chamber. Crystalline walls, one shaft
     of daylight from the access bore, cold halite palette.
     ---------------------------------------------------------- */
  {
    name: 'plate-vault',
    alt: 'Interior of a bedded-salt chamber: crystalline walls lit by a single shaft of daylight falling from the access bore.',
    w: 2400,
    h: 1350,
    seed: 8.42,
    body: /* glsl */ `
      ${PAL}
      // A frontal wall of hewn salt. No fake perspective: the drama is
      // a single hard-edged parallelogram of daylight thrown across a
      // rough surface from an opening out of frame.
      float wall(vec2 q){
        // Broad excavated form first; detail is deliberately faint, or
        // the lit patch dissolves into crumpled-foil noise.
        vec3 v1 = voronoi(q * 1.9);
        // Excavation tool marks: long diagonal gouges from the cutter.
        float gouge = sin((q.x * 0.5 + q.y * 2.2) * 11.0 + fbm(q * 1.6, 4, 0.5, 2.0) * 4.0);
        return fbm(q * 1.1 + uSeed, 5, 0.55, 2.0) * 0.62
             + (1.0 - v1.x) * 0.22
             + gouge * 0.045
             + fbm(q * 7.0, 4, 0.5, 2.0) * 0.05;
      }
      #define HEIGHT(q) wall((q) * vec2(1.7, 1.0))
      ${LIGHTING}

      vec3 plate(vec2 uv){
        vec2 p = uv;
        float h = HEIGHT(p);

        // Salt: pale, faintly green, with darker clay seams running
        // through it and rare pockets of clear crystal.
        vec3 v = voronoi(p * vec2(9.35, 5.5));
        float seam = smoothstep(0.42, 0.72, fbm(p * vec2(2.4, 5.0) + 9.0, 5, 0.5, 2.0));
        vec3 albedo = mix(mix(HALITE, FLARE, 0.42), HALITED, smoothstep(0.1, 0.75, v.x) * 0.5);
        albedo = mix(albedo, mix(GRAPH, HALITED, 0.5) * 0.8, seam * 0.55);
        albedo = mix(albedo, FLARE, step(0.93, v.z) * 0.5);

        // The light: a parallelogram projected from an opening high and
        // left of frame, softened at its edges by distance.
        float sx = p.x - 0.30 - (1.0 - p.y) * 0.30;   // shear with height
        float inX = smoothstep(-0.005, 0.045, sx) * (1.0 - smoothstep(0.26, 0.34, sx));
        float inY = smoothstep(0.04, 0.16, p.y) * (1.0 - smoothstep(0.62, 0.86, p.y));
        float pool = inX * inY;
        // A second, weaker rectangle: light spilling past the opening.
        float sx2 = p.x - 0.585 - (1.0 - p.y) * 0.30;
        float spill = smoothstep(0.0, 0.06, sx2) * (1.0 - smoothstep(0.10, 0.20, sx2)) * inY * 0.34;
        float lit = pool + spill;

        vec3 col = shadeHeight(p, h, 0.0038, 1.5, albedo,
                               normalize(vec3(-0.72, 0.34, 0.60)),
                               FLARE * (0.10 + lit * 1.85),
                               HALITE * 0.10, 0.16, 24.0);

        // Bounce: the lit patch throws soft light onto the wall around it.
        float bounce = exp(-pow((p.x - 0.42 - (1.0 - p.y) * 0.28) * 2.1, 2.0))
                     * exp(-pow((p.y - 0.46) * 1.9, 2.0));
        col += mix(HALITE, FLARE, 0.5) * bounce * 0.085 * albedo;

        // Airborne dust catching the beam above the lit patch.
        float dust = fbm(vec2(p.x * 7.0, p.y * 4.0) + 21.0, 5, 0.55, 2.05);
        col += FLARE * smoothstep(0.34, 0.0, p.y) * (0.02 + 0.05 * dust) * (0.4 + inX);

        // The chamber falls away into black at the edges of frame.
        col *= mix(0.30, 1.0, smoothstep(0.0, 0.24, p.y));
        col *= mix(0.34, 1.0, smoothstep(1.02, 0.72, p.y));
        col *= vignette(uv, 0.62, 0.20);
        col = tonemap(col * 1.62);
        col = grade(col, vec3(0.004, 0.010, 0.011), vec3(1.02, 0.97, 0.95), vec3(0.99, 1.02, 1.0));
        return filmGrain(col, uv, 0.05);
      }
    `,
  },

  /* ----------------------------------------------------------
     03 — WAFER. Macro of a written silica wafer. The data itself:
     a lattice of laser-formed voxels, refracting.
     ---------------------------------------------------------- */
  {
    name: 'plate-wafer',
    alt: 'Macro of a fused-silica wafer under dark-field illumination, showing the lattice of laser-written voxels that carries the record.',
    w: 1700,
    h: 1700,
    seed: 15.9,
    body: /* glsl */ `
      ${PAL}
      vec3 plate(vec2 uv){
        // Slight lens perspective on the lattice plane.
        vec2 p = uv - 0.5;
        p *= 1.0 + 0.16 * dot(p, p);
        float tilt = 0.14;
        p.y /= (1.0 + p.y * tilt);
        p += 0.5;

        vec3 col = srgb(5.0, 7.0, 9.0);

        // The voxel lattice. Rows are data tracks; some are dense,
        // some are empty — a written medium, not a decorative grid.
        const float N = 46.0;
        vec2 g = p * N;
        vec2 cell = floor(g);
        vec2 f = fract(g) - 0.5;

        float rowSeed = hash11(cell.y * 2.13 + uSeed);
        float density = 0.30 + 0.65 * fbm(vec2(cell.y * 0.09, uSeed), 4, 0.55, 2.0);
        float bit = step(1.0 - density, hash21(cell + uSeed * 3.0));

        // Depth layers: three planes of voxels at different focus.
        float acc = 0.0, chromo = 0.0;
        for (int L = 0; L < 3; L++){
          float fl = float(L);
          vec2 off = vec2(hash11(fl * 7.3 + uSeed), hash11(fl * 3.1 + uSeed)) * 0.5 - 0.25;
          vec2 fp = fract((p + off * 0.02) * N) - 0.5;
          vec2 cp = floor((p + off * 0.02) * N);
          float b = step(1.0 - density * (1.0 - fl * 0.22), hash21(cp + uSeed * (3.0 + fl)));
          float blur = 0.06 + fl * 0.16;            // out-of-plane voxels bloom
          float d = length(fp * vec2(1.0, 1.05));
          float pt = b * smoothstep(0.10 + blur, 0.0, d);
          acc += pt / (1.0 + fl * 1.9);
          chromo += pt * fl;
        }

        // Voxel cores: hot, tiny, with an oxide fringe.
        float core = bit * smoothstep(0.085, 0.0, length(f));
        col += FLARE * core * 1.25;
        col += OXIDE * bit * smoothstep(0.20, 0.02, length(f)) * 0.42;
        col += HALITE * acc * 0.55;
        // Chromatic separation on the defocused layers.
        col.r += chromo * 0.045;
        col.b += acc * 0.06;

        // Refraction caustics across the glass body.
        vec2 w = warp(p * 2.2, 0.55, 1.6);
        float caust = pow(max(0.0, 1.0 - abs(fbm(w * 4.0, 6, 0.5, 2.0) - 0.5) * 5.6), 4.0);
        col += mix(HALITE, FLARE, 0.5) * caust * 0.065;

        // Edge of the wafer catching the key light.
        float r = length((uv - 0.5) * vec2(1.0, 1.0));
        float rim = smoothstep(0.455, 0.485, r) * (1.0 - smoothstep(0.487, 0.50, r));
        col += FLARE * rim * (0.5 + 0.5 * sin(atan(uv.y - 0.5, uv.x - 0.5) * 3.0)) * 0.85;
        col *= 1.0 - smoothstep(0.487, 0.53, r) * 0.92;

        // A single specular sweep, as if the wafer were tilted to camera.
        float sweep = exp(-pow((uv.x + uv.y - 1.02) * 2.6, 2.0));
        col += mix(HALITE, FLARE, 0.7) * sweep * 0.14;

        col *= vignette(uv, 0.55, 0.30);
        col = tonemap(col * 1.35);
        col = grade(col, vec3(0.006, 0.009, 0.012), vec3(1.02, 1.0, 0.98), vec3(1.0, 1.0, 1.03));
        return filmGrain(col, uv, 0.045);
      }
    `,
  },

  /* ----------------------------------------------------------
     04 — SECTION. Ultrawide geological cross-section with a
     normal fault offsetting the sequence. The fault is the point.
     ---------------------------------------------------------- */
  {
    name: 'plate-section',
    alt: 'Ultrawide geological cross-section: a layered evaporite sequence displaced by a normal fault running from upper left to lower right.',
    w: 2800,
    h: 1200,
    seed: 22.6,
    body: /* glsl */ `
      ${PAL}
      // Fault geometry: everything right of the plane drops.
      float faultShift(vec2 p){
        float plane = 0.46 + (p.y - 0.5) * 0.38 + fbm(vec2(p.y * 3.0, uSeed), 4, 0.5, 2.0) * 0.03;
        return smoothstep(-0.004, 0.004, p.x - plane);
      }
      float faultDist(vec2 p){
        float plane = 0.46 + (p.y - 0.5) * 0.38 + fbm(vec2(p.y * 3.0, uSeed), 4, 0.5, 2.0) * 0.03;
        return abs(p.x - plane);
      }

      ${STRATA}
      #define NBEDS 22.0

      // The hanging wall drops across the fault; everything downstream
      // of this offset reads as one displaced sequence.
      vec2 faulted(vec2 p){ return vec2(p.x, p.y + faultShift(p) * 0.125); }

      float relief(vec2 uv){
        vec3 b = bedInfo(bedCoord(faulted(uv), NBEDS, 0.45, 0.28));
        float hard = hash11(b.x * 4.3 + uSeed);
        return b.z * (0.30 + 0.70 * hard) + (1.0 - b.z) * 0.04
             + fbm(uv * vec2(16.0, 34.0) + uSeed, 4, 0.5, 2.0) * 0.08;
      }
      #define HEIGHT(q) relief(q)
      ${LIGHTING}

      vec3 plate(vec2 uv){
        vec2 p = uv;
        float h = HEIGHT(p);
        vec3 b = bedInfo(bedCoord(faulted(p), NBEDS, 0.45, 0.28));
        float bedId = hash11(b.x * 1.71 + uSeed);
        float bedId2 = hash11(b.x * 6.29 + uSeed * 2.0);

        vec3 albedo = ramp5(bedId, GRAPH, ASH, PAPER, BONE, mix(OXIDE, FLARE, 0.45));
        albedo *= mix(0.86, 1.10, b.y);
        // Evaporite beds — the salt — read pale and faintly green.
        albedo = mix(albedo, mix(HALITE, FLARE, 0.62), step(0.78, bedId2) * 0.85);
        // Shale partings.
        albedo = mix(albedo, GRAPH * 0.7, (1.0 - b.z) * 0.8);

        vec3 col = shadeHeight(p, h, 0.0026, 2.6, albedo,
                               vec3(-0.42, 0.80, 0.45), FLARE * 1.12, HALITE * 0.14, 0.12, 26.0);

        // Drag folding and gouge along the fault plane.
        float fd = faultDist(p);
        col = mix(col, GRAPH * 0.55, (1.0 - smoothstep(0.0, 0.006, fd)) * 0.85);
        col = mix(col, OXIDE * 0.8, (1.0 - smoothstep(0.004, 0.022, fd)) * 0.22);

        // Weathered, lighter cap at the top of the section.
        col = mix(col, BONE * 1.02, smoothstep(0.22, 0.0, p.y) * 0.55);

        col *= vignette(uv, 0.40, 0.34);
        col = tonemap(col * 1.14);
        col = grade(col, vec3(0.014, 0.012, 0.009), vec3(0.99, 1.0, 1.05), vec3(1.02, 1.0, 0.95));
        return filmGrain(col, uv, 0.05);
      }
    `,
  },

  /* ----------------------------------------------------------
     05 — SHAFT. Looking straight down the access bore. Concentric
     lining rings receding to a point of oxide light.
     ---------------------------------------------------------- */
  {
    name: 'plate-shaft',
    alt: 'View straight down the access shaft: concentric lining rings receding toward a distant point of light.',
    w: 1400,
    h: 1900,
    seed: 41.3,
    body: /* glsl */ `
      ${PAL}
      vec3 plate(vec2 uv){
        vec2 p = (uv - vec2(0.5, 0.47)) * vec2(uRes.x / uRes.y, 1.0);
        float r = length(p);
        float a = atan(p.y, p.x);

        // Logarithmic depth: equal rings in log-space = true recession.
        float depth = -log(max(r, 0.0012)) * 1.55;
        float ring = fract(depth);
        float seg = floor(depth);

        // Lining segments: cast rings with a joint between each.
        float joint = smoothstep(0.0, 0.05, ring) * (1.0 - smoothstep(0.86, 0.95, ring));
        float wallLum = 0.30 + 0.55 * joint;

        // Longitudinal ribs and surface roughness on the lining.
        float ribs = 0.5 + 0.5 * sin(a * 34.0 + seg * 0.7);
        float rough = fbm(vec2(a * 6.0, depth * 4.0) + uSeed, 5, 0.5, 2.05);
        wallLum *= 0.62 + 0.38 * mix(rough, ribs, 0.35);

        // Light falls off with distance down the bore.
        float fall = smoothstep(0.0, 0.55, r);
        vec3 col = mix(VOID_C, mix(GRAPH, ASH, 0.35), wallLum) * (0.10 + 0.95 * fall);

        // Iron staining running down the lining.
        float run = smoothstep(0.55, 0.95, fbm(vec2(a * 3.2, depth * 1.2) + 12.0, 5, 0.55, 2.0));
        col = mix(col, OXIDED * 0.9, run * 0.42 * fall);

        // Service lamps at intervals — the only warm sources.
        float lampA = fract(a / TAU * 3.0 + 0.15);
        float lamp = smoothstep(0.03, 0.0, abs(lampA - 0.5)) * smoothstep(0.10, 0.0, abs(ring - 0.45));
        col += OXIDE * lamp * 2.4 * fall;
        col += FLARE * lamp * 0.7 * fall;

        // Daylight at the bottom of the bore, tiny and cold.
        float eye = smoothstep(0.055, 0.0, r);
        col += mix(HALITE, FLARE, 0.55) * eye * 2.6;
        col += mix(HALITE, FLARE, 0.4) * smoothstep(0.16, 0.0, r) * 0.30;

        // Cable and guide rails running the full depth.
        float cable = smoothstep(0.006, 0.0, abs(mod(a + PI, TAU / 2.0) - TAU / 4.0) * r);
        col += ASH * cable * 0.25 * fall;

        col *= vignette(uv, 0.80, 0.16);
        col = tonemap(col * 1.28);
        col = grade(col, vec3(0.005, 0.005, 0.007), vec3(1.02, 1.0, 0.99), vec3(1.02, 0.98, 0.96));
        return filmGrain(col, uv, 0.055);
      }
    `,
  },

  /* ----------------------------------------------------------
     06 — HALITE. Macro cluster of cubic salt crystals. Cold,
     translucent, high-key against black. Hopper faces.
     ---------------------------------------------------------- */
  {
    name: 'plate-halite',
    alt: 'Macro photograph of cubic halite crystals with stepped hopper faces, lit from behind so the salt glows.',
    w: 1600,
    h: 2000,
    seed: 63.1,
    body: /* glsl */ `
      ${PAL}
      // Faceted crystal. Shading a noise field will never read as a
      // crystal, because crystals are made of *flat* planes: each
      // voronoi cell is therefore given one constant, randomly tilted
      // normal, and lit analytically. Stepped hopper terraces sit on top.
      vec3 cellNormal(float id){
        vec3 r = hash33(vec3(id * 13.7, id * 7.1, id * 3.3));
        // Faces cluster around cube orientations, with scatter.
        vec3 n = normalize(vec3(r.x - 0.5, r.y - 0.5, 0.55 + r.z * 0.5));
        return n;
      }

      // Voronoi that also returns the offset to the cell centre, so
      // terraces can be stepped in the cell's own frame.
      // xy = offset to centre, z = edge distance, w = cell id
      vec4 cellOf(vec2 p){
        vec2 n = floor(p), f = fract(p);
        vec2 mg = vec2(0.0), mr = vec2(0.0);
        float md = 8.0;
        for (int j = -1; j <= 1; j++)
        for (int i = -1; i <= 1; i++){
          vec2 g = vec2(float(i), float(j));
          vec2 o = hash22(n + g + uSeed);
          vec2 r = g + o - f;
          float d = dot(r, r);
          if (d < md){ md = d; mr = r; mg = g; }
        }
        float mel = 8.0;
        for (int j = -2; j <= 2; j++)
        for (int i = -2; i <= 2; i++){
          vec2 g = mg + vec2(float(i), float(j));
          vec2 o = hash22(n + g + uSeed);
          vec2 r = g + o - f;
          if (dot(mr - r, mr - r) > 1e-5){
            mel = min(mel, dot(0.5 * (mr + r), normalize(r - mr)));
          }
        }
        return vec4(mr, mel, hash21(n + mg + uSeed));
      }

      vec3 plate(vec2 uv){
        vec2 p = uv;
        vec4 c = cellOf(p * vec2(3.6, 4.5));
        vec3 v = vec3(length(c.xy), c.z, c.w);
        float id = v.z;

        // Hopper stepping: halite grows as stepped *square* terraces, so
        // the steps are measured in Chebyshev distance inside each cell,
        // in a frame rotated by that crystal's own orientation.
        float ang = hash11(id * 21.7 + uSeed) * PI;
        float ca = cos(ang), sa = sin(ang);
        vec2 lc = mat2(ca, -sa, sa, ca) * c.xy;
        float cheb = max(abs(lc.x), abs(lc.y));
        const float STEPS = 5.0;
        float terr = floor((0.62 - cheb) * STEPS) / STEPS;
        float terrEdge = fract(max(0.62 - cheb, 0.0) * STEPS);

        vec3 n = cellNormal(id);
        // Tilt each terrace slightly so steps catch the light separately,
        // and cant the whole face along the terrace gradient.
        vec2 g = abs(lc.x) > abs(lc.y) ? vec2(sign(lc.x), 0.0) : vec2(0.0, sign(lc.y));
        n = normalize(n + vec3(g * 0.28, 0.0) + vec3(0.0, terr * 0.22 - 0.11, 0.0));

        vec3 L = normalize(vec3(-0.45, 0.60, 0.55));
        vec3 L2 = normalize(vec3(0.6, -0.2, 0.4));
        vec3 V = vec3(0.0, 0.0, 1.0);
        vec3 H = normalize(L + V);

        float diff = max(dot(n, L), 0.0);
        float fill = max(dot(n, L2), 0.0);
        float spec = pow(max(dot(n, H), 0.0), 90.0);
        float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);

        // Body colour: clear salt with a green cast that deepens with
        // the path length light takes through the crystal.
        float thick = 0.25 + 0.75 * v.x;
        vec3 body = mix(mix(FLARE, HALITE, 0.30), HALITED, thick * 0.75);

        vec3 col = body * (FLARE * (0.30 + diff * 1.15) + HALITE * fill * 0.28);
        col += FLARE * spec * 1.5;
        col += mix(HALITE, FLARE, 0.6) * fres * 0.35;

        // Transmission: light travelling through thin edges of the crystal.
        float thin = smoothstep(0.5, 0.02, v.x);
        col += mix(HALITE, FLARE, 0.75) * pow(thin, 1.5) * 0.65;

        // Internal fluid inclusions — tiny bright flecks trapped in growth.
        float incl = step(0.988, hash21(floor(p * 220.0) + uSeed));
        col += FLARE * incl * 0.7 * (0.3 + thin);

        // Cleavage: crisp dark boundaries with a bright catch on one side.
        float edge = 1.0 - smoothstep(0.0, 0.018, v.y);
        col = mix(col, srgb(6.0, 12.0, 12.0), edge * 0.70);
        col += FLARE * (1.0 - smoothstep(0.0, 0.005, v.y)) * 0.75;
        // Terrace risers: a dark drop and a lit nose on every step.
        col *= 1.0 - smoothstep(0.88, 1.0, terrEdge) * 0.40;
        col += FLARE * smoothstep(0.07, 0.0, terrEdge) * 0.28;

        // A single warm contamination — iron in the brine.
        float iron = smoothstep(0.76, 0.96, fbm(p * 2.4 + 40.0, 5, 0.55, 2.0));
        col = mix(col, OXIDE, iron * 0.26);

        // Macro depth of field: the cluster falls out of focus top and bottom.
        float dof = smoothstep(0.22, 0.60, abs(uv.y - 0.46));
        col = mix(col, mix(col, vec3(dot(col, vec3(0.33))) * 1.15, 0.5), dof * 0.8);

        col *= mix(0.14, 1.0, smoothstep(1.04, 0.30, uv.y));
        col *= vignette(uv, 0.62, 0.24);
        col = tonemap(col * 1.20);
        col = grade(col, vec3(0.004, 0.008, 0.009), vec3(1.04, 1.0, 0.98), vec3(0.99, 1.01, 1.0));
        return filmGrain(col, uv, 0.04);
      }
    `,
  },

  /* ----------------------------------------------------------
     07 — SURFACE. Aerial of the site: a scoured evaporite plain
     with a dendritic drainage network. Raking low sun.
     ---------------------------------------------------------- */
  {
    name: 'plate-surface',
    alt: 'Aerial view of the site: a wind-scoured evaporite plain incised by a dendritic drainage network under a low sun.',
    w: 2400,
    h: 1600,
    seed: 77.4,
    body: /* glsl */ `
      ${PAL}
      // Terrain = broad dunes + a carved drainage network.
      float channels(vec2 q){
        float r = ridged(q * 2.6, 6);
        // Invert and sharpen the ridge crests into incised valleys.
        return pow(smoothstep(0.58, 1.0, r), 1.7);
      }
      float terrain(vec2 q){
        float base = fbm(q * 2.2 + uSeed, 6, 0.52, 2.05);
        float dunes = ridged(q * vec2(7.0, 4.0), 5) * 0.22;
        return base * 0.8 + dunes - channels(q) * 0.34;
      }
      #define HEIGHT(q) ( terrain(q) + fbm((q) * 44.0, 4, 0.5, 2.0) * 0.035 )
      ${LIGHTING}

      vec3 plate(vec2 uv){
        vec2 p = uv * vec2(1.5, 1.0);
        float h = HEIGHT(p);
        float ch = channels(p);

        // Salt pans collect in the low ground and go blinding white.
        float pan = smoothstep(0.40, 0.24, terrain(p));
        vec3 albedo = ramp5(fbm(p * 3.4 + 2.0, 5, 0.5, 2.0) * 0.7 + h * 0.3,
          OXIDED * 0.85, OXIDE * 0.8, ASH, PAPER, BONE);
        albedo = mix(albedo, mix(BONE, FLARE, 0.5), pan * 0.85);
        // Damp, dark channel floors.
        albedo = mix(albedo, GRAPH * 0.9, smoothstep(0.35, 0.9, ch) * 0.6);

        // Very low sun from the west — long shadows are the whole image.
        vec3 col = shadeHeight(p, h, 0.0026, 6.5, albedo,
                               normalize(vec3(-0.92, 0.30, 0.26)), FLARE * 1.30,
                               HALITE * 0.20, 0.06, 12.0);

        // Atmospheric warm scatter toward the sun side.
        col = mix(col, OXIDE * 0.55 + FLARE * 0.30, smoothstep(0.6, 0.0, uv.x) * 0.14);

        col *= vignette(uv, 0.44, 0.32);
        col = tonemap(col * 1.20);
        col = grade(col, vec3(0.016, 0.012, 0.008), vec3(0.97, 1.0, 1.07), vec3(1.04, 1.0, 0.93));
        return filmGrain(col, uv, 0.05);
      }
    `,
  },

  /* ----------------------------------------------------------
     08 — INSCRIBE. The femtosecond write head at work. Hot
     points, beam streak, near-total black.
     ---------------------------------------------------------- */
  {
    name: 'plate-inscribe',
    alt: 'The femtosecond write head inscribing a silica blank: a hot focal point, a beam streak, and rows of completed voxels fading into black.',
    w: 2400,
    h: 1350,
    seed: 91.8,
    body: /* glsl */ `
      ${PAL}
      vec3 plate(vec2 uv){
        vec2 p = uv;
        vec3 col = srgb(4.0, 4.0, 5.0);

        // The blank: a faint slab edge catching rim light.
        float slab = smoothstep(0.30, 0.315, p.y) * (1.0 - smoothstep(0.855, 0.87, p.y));
        col += mix(HALITE, FLARE, 0.4) * slab * 0.045;
        col += FLARE * (smoothstep(0.303, 0.30, abs(p.y - 0.5825) ) ) * 0.0;
        float edgeT = 1.0 - smoothstep(0.0, 0.004, abs(p.y - 0.30));
        float edgeB = 1.0 - smoothstep(0.0, 0.004, abs(p.y - 0.87));
        col += mix(HALITE, FLARE, 0.6) * (edgeT * 0.55 + edgeB * 0.30);

        // Completed rows of voxels, receding to the left.
        const float ROWS = 22.0;
        vec2 g = vec2(p.x * 90.0, (p.y - 0.30) / 0.57 * ROWS);
        vec2 cell = floor(g);
        vec2 f = fract(g) - 0.5;
        float written = step(p.x, 0.62 + hash11(cell.y * 3.7 + uSeed) * 0.03);
        float on = step(0.42, hash21(cell + uSeed));
        float dot_ = written * on * slab * smoothstep(0.34, 0.0, length(f * vec2(1.0, 2.4)));
        col += mix(HALITE, FLARE, 0.55) * dot_ * 0.75;
        col += OXIDE * dot_ * 0.20;

        // The active focal point.
        vec2 fp = vec2(0.62, 0.58);
        float d = length((p - fp) * vec2(1.0, uRes.y / uRes.x * 1.0));
        col += FLARE * exp(-d * 46.0) * 3.4;
        col += OXIDE * exp(-d * 15.0) * 1.5;
        col += OXIDE * exp(-d * 6.0) * 0.35;

        // Beam column descending into the focal point.
        float beamX = 1.0 - smoothstep(0.0, 0.006 + (0.30 - min(p.y, 0.30)) * 0.05, abs(p.x - fp.x));
        col += mix(FLARE, HALITE, 0.25) * beamX * smoothstep(0.60, 0.0, p.y) * 0.55;

        // Anamorphic horizontal flare off the focal point.
        float ana = exp(-abs(p.y - fp.y) * 240.0) * exp(-abs(p.x - fp.x) * 4.5);
        col += mix(OXIDE, FLARE, 0.6) * ana * 1.1;

        // Heat shimmer in the silica around the focus.
        float shim = fbm(p * vec2(30.0, 60.0) + uTime, 4, 0.5, 2.0);
        col += OXIDE * exp(-d * 9.0) * shim * 0.25;

        // Scattered light inside the slab.
        col += mix(HALITE, FLARE, 0.4) * slab * exp(-abs(p.x - fp.x) * 3.2) * 0.06;

        col *= vignette(uv, 0.70, 0.22);
        col = tonemap(col * 1.15);
        col = grade(col, vec3(0.004, 0.005, 0.007), vec3(1.0, 1.0, 1.0), vec3(1.03, 0.99, 0.97));
        return filmGrain(col, uv, 0.05);
      }
    `,
  },

  /* ----------------------------------------------------------
     09 — VARVE. Extreme macro of annually-banded sediment.
     Each pair of laminae is one year. Used small, as a detail.
     ---------------------------------------------------------- */
  {
    name: 'plate-varve',
    alt: 'Extreme macro of varved sediment: paired light and dark laminae, one pair for each year of deposition.',
    w: 1500,
    h: 1500,
    seed: 108.2,
    body: /* glsl */ `
      ${PAL}
      ${STRATA}
      // Each light/dark couplet is one year: summer silt over winter clay.
      #define NPAIRS 26.0

      // A slow tilt plus real wobble — a core is never cut perfectly
      // square to bedding, and laminae are never dead straight.
      float laminaY(vec2 uv){
        return bedCoord(uv, NPAIRS * 2.0, 1.15, 0.55) + (uv.x - 0.5) * 1.9;
      }

      float relief(vec2 uv){
        float y = laminaY(uv);
        float f = fract(y);
        float dark = step(0.5, fract(y * 0.5));
        // Clay laminae are recessive; silt laminae stand proud.
        return mix(0.62, 0.28, dark) * (0.5 + 0.5 * sin(f * TAU - PI * 0.5))
             + fbm(uv * vec2(14.0, 44.0) + uSeed, 4, 0.5, 2.0) * 0.09;
      }
      #define HEIGHT(q) relief(q)
      ${LIGHTING}

      vec3 plate(vec2 uv){
        vec2 p = uv;
        float h = HEIGHT(p);
        float y = laminaY(p);
        float pairIdx = floor(y * 0.5);
        float dark = step(0.5, fract(y * 0.5));   // winter clay vs summer silt
        float yr = hash11(pairIdx * 1.93 + uSeed);

        vec3 albedo = mix(mix(BONE, PAPER, yr * 0.7), mix(GRAPH * 1.1, ASH, yr * 0.5), dark);
        // Rare oxide event beds — a flood, a fire, an eruption.
        albedo = mix(albedo, OXIDE, step(0.955, hash11(pairIdx * 5.1 + uSeed)) * 0.85);
        // Occasional thick year, so the rhythm is never mechanical.
        albedo *= mix(1.0, 1.08, step(0.85, hash11(pairIdx * 8.7 + uSeed)));

        vec3 col = shadeHeight(p, h, 0.0026, 2.4, albedo,
                               vec3(-0.5, 0.7, 0.45), FLARE * 1.10, HALITE * 0.16, 0.10, 20.0);

        // Shallow macro depth of field: only a band across the middle
        // is sharp, and the surface curves away from the lens.
        float dof = smoothstep(0.04, 0.46, abs(uv.y - 0.48));
        vec3 soft = mix(col, vec3(dot(col, vec3(0.33))), 0.42);
        col = mix(col, soft * 1.03, dof * 0.85);
        col *= 1.0 - dof * 0.28;

        // Cylindrical falloff across the width of the split core.
        col *= mix(0.55, 1.06, pow(sin(clamp(uv.x, 0.001, 0.999) * PI), 0.5));

        col *= vignette(uv, 0.46, 0.28);
        col = tonemap(col * 1.12);
        col = grade(col, vec3(0.012, 0.011, 0.009), vec3(0.99, 1.0, 1.04), vec3(1.02, 1.0, 0.96));
        return filmGrain(col, uv, 0.05);
      }
    `,
  },

  /* ----------------------------------------------------------
     10 — HORIZON. The far end of the mandate: a bleached plain
     under a long exposure. Almost nothing in it, on purpose.
     ---------------------------------------------------------- */
  {
    name: 'plate-horizon',
    alt: 'A bleached salt plain under a long exposure, the horizon dissolving into pale light.',
    w: 2400,
    h: 1350,
    seed: 133.7,
    body: /* glsl */ `
      ${PAL}
      vec3 plate(vec2 uv){
        vec2 p = uv;
        float hz = 0.58;

        // Sky: banded long-exposure gradient with a thin oxide seam.
        float sy = smoothstep(hz, 0.0, p.y);
        vec3 sky = ramp5(sy, mix(PAPER, BONE, 0.4), BONE, FLARE, mix(FLARE, BONE, 0.3), mix(BONE, ASH, 0.55));
        float seam = exp(-pow((p.y - hz * 0.80) * 44.0, 2.0));
        sky = mix(sky, mix(OXIDE, FLARE, 0.55), seam * 0.32);

        // Ground: mirror-wet salt flat reflecting the sky, polygon cracks.
        float gy = (p.y - hz) / (1.0 - hz);
        vec2 gp = vec2((p.x - 0.5) / max(gy * 1.4 + 0.06, 0.05), 1.0 / max(gy + 0.05, 0.05));
        vec3 vcell = voronoi(gp * 0.55);
        float crack = 1.0 - smoothstep(0.0, 0.05 + gy * 0.12, vcell.y);
        vec3 ground = mix(BONE, PAPER, 0.35 + 0.4 * vcell.z);
        ground = mix(ground, ASH * 0.9, crack * 0.55);
        // Reflection of the sky in standing brine.
        vec3 refl = ramp5(smoothstep(0.0, 1.0, gy * 1.6), FLARE, BONE, PAPER, ASH, mix(ASH, GRAPH, 0.4));
        ground = mix(ground, refl, smoothstep(0.35, 0.0, gy) * 0.72);
        ground *= 0.86 + 0.14 * fbm(gp * 0.9, 4, 0.5, 2.0);

        vec3 col = mix(sky, ground, smoothstep(hz - 0.004, hz + 0.004, p.y));

        // Heat haze dissolving the horizon line itself.
        float haze = exp(-pow((p.y - hz) * 26.0, 2.0));
        col = mix(col, FLARE, haze * 0.55);

        // A single vertical marker on the plain — the only man-made thing.
        float mx = 1.0 - smoothstep(0.0, 0.0016, abs(p.x - 0.735));
        float my = smoothstep(hz + 0.002, hz - 0.10, p.y) * step(hz - 0.10, p.y);
        col = mix(col, GRAPH * 0.75, mx * my * 0.9);

        col *= vignette(uv, 0.30, 0.42);
        col = tonemap(col * 1.06);
        col = grade(col, vec3(0.024, 0.021, 0.016), vec3(0.94, 0.97, 1.03), vec3(1.01, 0.995, 0.96));
        return filmGrain(col, uv, 0.05);
      }
    `,
  },
];

/* ------------------------------------------------------------
   Utility textures consumed by the WebGL layer at runtime.
   ------------------------------------------------------------ */
export const TEXTURES = [
  {
    name: 'noise',
    w: 256,
    h: 256,
    // Only one channel is ever sampled, so this is written as greyscale.
    greyscale: true,
    seed: 5.0,
    format: 'png',
    body: /* glsl */ `
      vec3 plate(vec2 uv){ return vec3(0.0); }
      // Overridden below — see FRAG_OVERRIDE.
    `,
    // Tileable 4-channel noise: R/G = curl-ish flow, B = fbm, A = ridged.
    override: /* glsl */ `
      // Tileable value noise by sampling on a torus.
      float tnoise(vec2 p, float scale){
        p = fract(p);
        vec2 s = p * scale;
        vec2 i = floor(s), f = fract(s);
        vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        vec2 w = vec2(scale);
        float a = hash21(mod(i, w));
        float b = hash21(mod(i + vec2(1.0, 0.0), w));
        float c = hash21(mod(i + vec2(0.0, 1.0), w));
        float d = hash21(mod(i + vec2(1.0, 1.0), w));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      float tfbm(vec2 p, float base, int oct){
        float a = 0.5, s = 0.0, n = 0.0, sc = base;
        for (int i = 0; i < 6; i++){
          if (i >= oct) break;
          s += a * tnoise(p, sc); n += a; sc *= 2.0; a *= 0.5;
        }
        return s / n;
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        float r = tfbm(uv, 4.0, 5);
        float g = tfbm(uv + vec2(0.37, 0.11), 4.0, 5);
        float b = tfbm(uv + vec2(0.71, 0.83), 8.0, 4);
        float a = 1.0 - abs(tfbm(uv + vec2(0.19, 0.53), 6.0, 4) * 2.0 - 1.0);
        fragColor = vec4(r, g, b, a);
      }
    `,
  },
];
