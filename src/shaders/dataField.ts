import { glsl, NOISE } from './glsl';

/**
 * The data field: every particle is one record in the vault.
 *
 * Three target shapes are baked into attributes and blended by two
 * uniforms, so the morph costs nothing per frame beyond the mix:
 *
 *   aCore   — packed inside the cylinder, the state at rest
 *   aShell  — a sphere, deep time seen from outside
 *   aRibbon — a slow helix, the dispersal beat between the two
 *
 * The morph is staggered per particle by aSeed, which is the whole
 * trick: a synchronised morph reads as a single object stretching,
 * a staggered one reads as matter reorganising itself.
 */

export const dataFieldVert = glsl`
  ${NOISE}

  attribute vec3 aCore;
  attribute vec3 aShell;
  attribute vec3 aRibbon;
  attribute float aSeed;
  attribute float aScale;

  uniform float uTime;
  uniform float uMorph;     // 0 = core, 1 = shell
  uniform float uRibbon;    // blends the helix in over the middle
  uniform float uDrift;     // turbulence amount
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3  uPointer;

  varying float vSeed;
  varying float vDepth;
  varying float vGlow;

  void main(){
    vSeed = aSeed;

    // Stagger: each particle starts and finishes its morph at a
    // slightly different time, spread over 45% of the transition.
    float t = clamp((uMorph - aSeed * 0.45) / 0.55, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);

    vec3 pos = mix(aCore, aShell, t);
    pos = mix(pos, aRibbon, uRibbon * (0.55 + 0.45 * aSeed));

    // Turbulent drift, so the field is never static even at rest.
    float n = fbm3(pos * 0.55 + vec3(0.0, uTime * 0.045, aSeed * 4.0));
    vec3 dir = normalize(vec3(
      fbm3(pos * 0.7 + 11.0) - 0.5,
      fbm3(pos * 0.7 + 27.0) - 0.5,
      fbm3(pos * 0.7 + 43.0) - 0.5
    ) + 1e-5);
    pos += dir * n * uDrift * (0.4 + aSeed);

    // Pointer parallax — the field leans away from the cursor.
    pos.xy += uPointer.xy * (0.10 + aSeed * 0.16) * uPointer.z;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mv.z;

    // Particles crossing the morph glow, so the transformation itself
    // is visible rather than just its endpoints.
    vGlow = smoothstep(0.0, 0.35, t) * (1.0 - smoothstep(0.65, 1.0, t));

    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (14.0 / max(vDepth, 0.35));
  }
`;

export const dataFieldFrag = glsl`
  precision highp float;

  uniform vec3  uColdColor;
  uniform vec3  uWarmColor;
  uniform vec3  uHotColor;
  uniform float uOpacity;
  uniform float uFogNear;
  uniform float uFogFar;

  varying float vSeed;
  varying float vDepth;
  varying float vGlow;

  void main(){
    // Round, soft-edged points. A squared point sprite is the fastest
    // way to make a particle field look like a debug view.
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float alpha = smoothstep(0.25, 0.02, d);
    // A brighter core inside the falloff gives each point a real centre.
    alpha += smoothstep(0.045, 0.0, d) * 0.85;

    vec3 col = mix(uColdColor, uWarmColor, vSeed);
    col = mix(col, uHotColor, vGlow * 0.85);

    // Distance fade, so the far side of the field recedes instead of
    // filling in as a flat wall of dots.
    float fog = 1.0 - smoothstep(uFogNear, uFogFar, vDepth);

    gl_FragColor = vec4(col, alpha * uOpacity * fog);
    #include <colorspace_fragment>
  }
`;

/**
 * Builds the three target geometries once. Positions are generated with
 * a seeded PRNG so the field is identical between server and client
 * renders and between reloads — a field that reshuffles on refresh
 * makes the whole scene feel accidental.
 */
export function buildDataField(count: number) {
  const core = new Float32Array(count * 3);
  const shell = new Float32Array(count * 3);
  const ribbon = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const scale = new Float32Array(count);

  // xorshift — cheap, deterministic, good enough for point clouds.
  let x = 0x9e3779b9;
  const rnd = () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };

  const H = 7.0; // core height
  const R = 0.56; // core radius

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // --- core: a cylinder, denser toward the axis, with a thin halo
    // drifting outside it so the object sits in an atmosphere rather
    // than on bare black ---
    const a = rnd() * Math.PI * 2;
    const halo = rnd() > 0.72;
    const r = halo ? R + Math.pow(rnd(), 0.6) * 3.4 : Math.sqrt(rnd()) * R;
    const y = (rnd() - 0.5) * H * (halo ? 1.5 : 1);
    core[i3] = Math.cos(a) * r;
    core[i3 + 1] = y;
    core[i3 + 2] = Math.sin(a) * r;

    // --- shell: a sphere, thickened slightly so it has body ---
    const u = rnd() * 2 - 1;
    const th = rnd() * Math.PI * 2;
    const sr = 2.55 * (0.94 + rnd() * 0.06);
    const sp = Math.sqrt(1 - u * u);
    shell[i3] = Math.cos(th) * sp * sr;
    shell[i3 + 1] = u * sr;
    shell[i3 + 2] = Math.sin(th) * sp * sr;

    // --- ribbon: a slow double helix, the in-between state ---
    const t = i / count;
    const turns = 3.2;
    const ha = t * Math.PI * 2 * turns + (i % 2) * Math.PI;
    const hr = 1.5 + Math.sin(t * Math.PI) * 0.9 + rnd() * 0.22;
    ribbon[i3] = Math.cos(ha) * hr;
    ribbon[i3 + 1] = (t - 0.5) * H * 1.15 + (rnd() - 0.5) * 0.2;
    ribbon[i3 + 2] = Math.sin(ha) * hr;

    seed[i] = rnd();
    // A few large points carry the field; most are small. A uniform
    // size makes 40,000 particles read as noise.
    scale[i] = 0.45 + Math.pow(rnd(), 3.2) * 2.4;
  }

  return { core, shell, ribbon, seed, scale };
}
