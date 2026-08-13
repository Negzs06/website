/**
 * Per-frame state, deliberately kept OUT of React.
 *
 * Scroll position, pointer position and scroll velocity change every
 * frame. Routing them through React state would re-render the tree 60
 * times a second and cost more than everything the GPU is doing. They
 * live here in one mutable object: ScrollTrigger and the pointer
 * listeners write to it, `useFrame` and rAF loops read from it.
 *
 * Discrete state — is the menu open, has the loader finished — belongs
 * in the zustand store instead, where re-rendering is the point.
 */

export type StoryState = {
  /** 0 → 1 across the whole home narrative. */
  progress: number;
  /** Index of the chapter currently occupying the viewport. */
  chapter: number;
  /** Per-chapter local progress, 0 → 1. */
  chapterProgress: number;
  /** Signed, normalised scroll velocity. Drives skew and aberration. */
  velocity: number;
  /** Raw pointer in normalised device coords, -1 → 1. */
  pointer: { x: number; y: number };
  /** Critically damped pointer, for anything that must not jitter. */
  smooth: { x: number; y: number };
  /** Absolute scroll offset in px. */
  scrollY: number;
  /** True while the fullscreen menu is open — WebGL parks itself. */
  suspended: boolean;
};

export const story: StoryState = {
  progress: 0,
  chapter: 0,
  chapterProgress: 0,
  velocity: 0,
  pointer: { x: 0, y: 0 },
  smooth: { x: 0, y: 0 },
  scrollY: 0,
  suspended: false,
};

/**
 * Frame-rate independent exponential smoothing.
 * `lambda` is roughly "how many e-foldings per second" — higher is
 * snappier. Using dt here means the feel is identical at 60 and 120Hz,
 * which a naive `current += (target - current) * 0.1` never is.
 */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return target + (current - target) * Math.exp(-lambda * dt);
}

export function clamp(v: number, min = 0, max = 1) {
  return v < min ? min : v > max ? max : v;
}

/** Maps v from [a,b] to [0,1], clamped. */
export function range(v: number, a: number, b: number) {
  return clamp((v - a) / (b - a));
}

/** Maps v from [a,b] to [c,d], clamped at the ends. */
export function remap(v: number, a: number, b: number, c: number, d: number) {
  return c + range(v, a, b) * (d - c);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Smootherstep — zero first AND second derivative at both ends. */
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
