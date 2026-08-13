import { glsl, NOISE } from './glsl';

/**
 * The strata: the beds inside the core, one instanced disc each.
 *
 * They need to survive being looked at through a refracting glass
 * shell, so the shading is deliberately high-contrast — a hard key, a
 * strong fresnel rim and a bright edge on the disc faces. Subtle
 * shading disappears entirely once it is behind the transmission pass.
 */

export const strataVert = glsl`
  ${NOISE}

  attribute vec3 aTint;
  attribute float aSeed;
  attribute float aBand;   // 0 → 1 along the core, base to top

  uniform float uTime;
  uniform float uSeparate; // 0 = solid core, 1 = fully exploded
  uniform float uDissolve; // discs shrink away as the field takes over
  uniform float uWrite;    // position of the write head, in band units
  uniform float uWriteOn;

  varying vec3 vTint;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vSeed;
  varying float vBand;
  varying float vWrite;
  varying float vEdge;

  void main(){
    vTint = aTint;
    vSeed = aSeed;
    vBand = aBand;

    vec3 pos = position;

    // The upward-facing cap of each bed. Measuring this by radius
    // lights the entire cylinder wall, because every point on the side
    // of a unit cylinder sits at the same radius — it has to come from
    // the normal instead.
    vEdge = smoothstep(0.55, 0.98, normal.y);

    // --- separation ---
    // Discs fly apart along the core axis, further the closer they are
    // to the ends, and tumble as they go. The spread is eased per disc
    // by its own seed so the stack comes apart raggedly.
    float away = (aBand - 0.5) * 2.0;
    float ease = 0.55 + 0.45 * aSeed;
    pos.y += away * uSeparate * 2.2 * ease;

    // Lateral drift and tumble, scaled by separation.
    float ang = uSeparate * (aSeed - 0.5) * 2.4;
    float ca = cos(ang), sa = sin(ang);
    pos.xz = mat2(ca, -sa, sa, ca) * pos.xz;
    pos.x += sin(aSeed * 24.0 + uTime * 0.35) * uSeparate * 0.42;
    pos.z += cos(aSeed * 17.0 + uTime * 0.29) * uSeparate * 0.42;

    // Tilt each disc off-axis as it separates.
    float tilt = uSeparate * (aSeed - 0.5) * 0.85;
    float ct = cos(tilt), st = sin(tilt);
    pos.yz = mat2(ct, -st, st, ct) * pos.yz;

    // --- dissolve into the particle field ---
    pos *= 1.0 - uDissolve;

    // --- the write head ---
    // A pulse of heat passing along the core during inscription.
    float d = abs(aBand - uWrite);
    vWrite = uWriteOn * exp(-d * 34.0);
    pos.xz *= 1.0 + vWrite * 0.05;

    vec4 world = instanceMatrix * vec4(pos, 1.0);
    vec4 mv = modelViewMatrix * world;

    vNormal = normalize(mat3(modelViewMatrix) * mat3(instanceMatrix) * normal);
    vView = normalize(-mv.xyz);

    gl_Position = projectionMatrix * mv;
  }
`;

export const strataFrag = glsl`
  precision highp float;

  uniform vec3  uKey;
  uniform vec3  uFill;
  uniform vec3  uHot;
  uniform float uOpacity;

  varying vec3 vTint;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vSeed;
  varying float vBand;
  varying float vWrite;
  varying float vEdge;

  void main(){
    vec3 n = normalize(vNormal);
    vec3 L = normalize(vec3(-0.55, 0.75, 0.42));
    vec3 L2 = normalize(vec3(0.7, -0.25, 0.55));

    float diff = max(dot(n, L), 0.0);
    float fill = max(dot(n, L2), 0.0);
    float fres = pow(1.0 - max(dot(n, vView), 0.0), 2.6);

    vec3 col = vTint * (uKey * (0.28 + diff * 0.95) + uFill * fill * 0.45);

    // The top face of each bed catches the key — this is what makes the
    // stack read as discrete beds rather than one continuous cylinder.
    col += uKey * vEdge * 0.34;
    col += mix(uFill, uKey, 0.5) * fres * 0.55;

    // Write head.
    col += uHot * vWrite * 2.6;

    gl_FragColor = vec4(col, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
