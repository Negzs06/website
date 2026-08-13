import { glsl } from './glsl';

/**
 * Displacement wipe between two plates.
 *
 * A cross-fade says "two images". A noise-thresholded wipe with the
 * outgoing and incoming frames pulling in opposite directions says
 * "one surface changing", which is the difference between a slideshow
 * and a material.
 *
 * The RGB split is driven by the *rate* of the transition rather than
 * its position, so the fringing appears while the wipe is moving and
 * is completely gone once it settles.
 */

export const wipeVert = glsl`
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const wipeFrag = glsl`
  precision highp float;

  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform sampler2D uNoise;
  uniform float uProgress;   // 0 = A, 1 = B
  uniform float uVelocity;   // |d(progress)/dt|, drives the split
  uniform float uHover;      // pointer proximity, drives the lens bulge
  uniform float uTime;
  uniform vec2  uPointer;
  uniform vec2  uPlane;      // plane size in world units
  uniform vec2  uImageA;     // source pixel dimensions
  uniform vec2  uImageB;

  varying vec2 vUv;

  // object-fit: cover, in the shader.
  vec2 cover(vec2 uv, vec2 image){
    float planeAspect = uPlane.x / uPlane.y;
    float imgAspect = image.x / image.y;
    vec2 scale = imgAspect > planeAspect
      ? vec2(planeAspect / imgAspect, 1.0)
      : vec2(1.0, imgAspect / planeAspect);
    return (uv - 0.5) * scale + 0.5;
  }

  void main(){
    vec2 uv = vUv;

    // A slow lens bulge toward the pointer while hovering.
    vec2 toP = uv - (uPointer * 0.5 + 0.5);
    float bulge = exp(-dot(toP, toP) * 5.0) * uHover;
    uv -= toP * bulge * 0.045;

    // Threshold the wipe against tileable noise so the boundary is a
    // ragged front rather than a straight edge.
    float n = texture2D(uNoise, uv * 1.35 + vec2(uTime * 0.006, 0.0)).g;
    float m = smoothstep(n * 0.62, n * 0.62 + 0.38, uProgress);

    // Outgoing and incoming pull apart along the wipe axis.
    vec2 uvA = cover(uv + vec2(0.0, m * 0.055), uImageA);
    vec2 uvB = cover(uv - vec2(0.0, (1.0 - m) * 0.055), uImageB);

    // Split scales with how fast the wipe is moving right now.
    float split = clamp(uVelocity, 0.0, 1.0) * 0.012 + bulge * 0.004;

    vec3 a, b;
    a.r = texture2D(uTexA, uvA + vec2(split, 0.0)).r;
    a.g = texture2D(uTexA, uvA).g;
    a.b = texture2D(uTexA, uvA - vec2(split, 0.0)).b;
    b.r = texture2D(uTexB, uvB + vec2(split, 0.0)).r;
    b.g = texture2D(uTexB, uvB).g;
    b.b = texture2D(uTexB, uvB - vec2(split, 0.0)).b;

    vec3 col = mix(a, b, m);

    // A hot line along the wipe front — the record being rewritten.
    float front = smoothstep(0.0, 0.06, m) * (1.0 - smoothstep(0.06, 0.2, m));
    col += vec3(0.76, 0.31, 0.16) * front * clamp(uVelocity, 0.0, 1.0) * 1.6;

    // Slight grade so plates sit in the page rather than on it.
    col = pow(col, vec3(0.96, 1.0, 1.03));

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;
