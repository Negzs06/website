/** Identity tag — exists so editors syntax-highlight the GLSL below. */
export const glsl = (strings: TemplateStringsArray, ...values: unknown[]) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');

/** Shared noise, used by several shaders. */
export const NOISE = glsl`
  vec3 hash33(vec3 p){
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453123);
  }

  float snoise(vec3 p){
    vec3 i = floor(p), f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float n = 0.0;
    for (int dz = 0; dz <= 1; dz++)
    for (int dy = 0; dy <= 1; dy++)
    for (int dx = 0; dx <= 1; dx++){
      vec3 o = vec3(float(dx), float(dy), float(dz));
      float h = hash33(i + o).x;
      vec3 w = mix(1.0 - u, u, o);
      n += h * w.x * w.y * w.z;
    }
    return n;
  }

  float fbm3(vec3 p){
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++){ s += a * snoise(p); p *= 2.03; a *= 0.5; }
    return s;
  }
`;
