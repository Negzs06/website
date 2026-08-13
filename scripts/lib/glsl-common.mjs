/* ============================================================
   Shared GLSL used by every generated plate.
   Domain-warped fBm is the workhorse: it is what turns flat
   banding into something that reads as deposited rock.
   ============================================================ */

export const COMMON = /* glsl */ `
precision highp float;

uniform vec2  uRes;
uniform float uSeed;
uniform float uTime;

#define PI 3.14159265359
#define TAU 6.28318530718

// ---------- hashing ----------
float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

float hash21(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

vec3 hash33(vec3 p){
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}

// ---------- value noise (quintic) ----------
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// ---------- gradient noise, smoother for large forms ----------
float gnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 ga = normalize(hash22(i) * 2.0 - 1.0);
  vec2 gb = normalize(hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0);
  vec2 gc = normalize(hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0);
  vec2 gd = normalize(hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0);
  float va = dot(ga, f - vec2(0.0, 0.0));
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  return 0.5 + 0.5 * mix(mix(va, vb, u.x), mix(vc, vd, u.x), u.y);
}

// ---------- fBm ----------
const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);

float fbm(vec2 p, int oct, float gain, float lac){
  float a = 0.5, s = 0.0, n = 0.0;
  for (int i = 0; i < 9; i++){
    if (i >= oct) break;
    s += a * gnoise(p);
    n += a;
    p = ROT * p * lac;
    a *= gain;
  }
  return s / max(n, 1e-4);
}

float fbm6(vec2 p){ return fbm(p, 6, 0.5, 2.02); }

// Ridged noise — fractures, crystal facets, scoured surfaces.
float ridged(vec2 p, int oct){
  float a = 0.5, s = 0.0, n = 0.0;
  for (int i = 0; i < 8; i++){
    if (i >= oct) break;
    float v = 1.0 - abs(gnoise(p) * 2.0 - 1.0);
    v *= v;
    s += a * v;
    n += a;
    p = ROT * p * 2.03;
    a *= 0.5;
  }
  return s / max(n, 1e-4);
}

// Domain warp: two chained fBm displacements. The whole geological
// read of these plates comes from this function.
vec2 warp(vec2 p, float amp, float freq){
  vec2 q = vec2(fbm6(p * freq + uSeed), fbm6(p * freq + vec2(5.2, 1.3) + uSeed));
  vec2 r = vec2(fbm6(p * freq + 4.0 * q + vec2(1.7, 9.2)),
                fbm6(p * freq + 4.0 * q + vec2(8.3, 2.8)));
  return p + amp * (r - 0.5);
}

// ---------- voronoi: crystal cells, grain boundaries ----------
// .x = distance to nearest, .y = edge proximity, .z = cell id
vec3 voronoi(vec2 p){
  vec2 n = floor(p), f = fract(p);
  vec2 mg, mr;
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
  return vec3(sqrt(md), mel, hash21(n + mg + uSeed));
}

// ---------- colour ----------
vec3 srgb(float r, float g, float b){ return vec3(r, g, b) / 255.0; }

// 5-stop ramp. Stops are chosen per plate; no generic gradients.
vec3 ramp5(float t, vec3 c0, vec3 c1, vec3 c2, vec3 c3, vec3 c4){
  t = clamp(t, 0.0, 1.0) * 4.0;
  if (t < 1.0) return mix(c0, c1, smoothstep(0.0, 1.0, t));
  if (t < 2.0) return mix(c1, c2, smoothstep(0.0, 1.0, t - 1.0));
  if (t < 3.0) return mix(c2, c3, smoothstep(0.0, 1.0, t - 2.0));
  return mix(c3, c4, smoothstep(0.0, 1.0, t - 3.0));
}

// ---------- film finishing ----------

// Per-channel lift/gamma/gain, applied after the image is formed.
vec3 grade(vec3 c, vec3 lift, vec3 gamma, vec3 gain){
  c = clamp(c, 0.0, 1.0);
  c = pow(c, gamma);
  return clamp(lift + c * gain, 0.0, 1.0);
}

// Filmic tonemap — keeps highlights from clipping to flat white.
vec3 tonemap(vec3 x){
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 filmGrain(vec3 c, vec2 uv, float amount){
  float g = hash21(uv * uRes + uSeed * 71.3);
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  // Grain sits in the mids, not the blacks — the way real film behaves.
  float mask = 4.0 * lum * (1.0 - lum);
  return c + (g - 0.5) * amount * mask;
}

float vignette(vec2 uv, float strength, float softness){
  vec2 d = (uv - 0.5) * vec2(1.0, uRes.y / uRes.x);
  float r = length(d) * 1.7;
  return 1.0 - strength * smoothstep(softness, 1.25, r);
}

// Anamorphic-ish highlight bleed approximated with a few taps.
float bleed(vec2 uv, float src, float radius){
  return src * radius;
}
`;

/** Wraps a plate body into a complete fragment shader. */
export function frag(body) {
  return `#version 300 es
${COMMON}
out vec4 fragColor;

${body}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 col = plate(uv);
  fragColor = vec4(col, 1.0);
}
`;
}
