import { smoothstep } from './story';

/**
 * The descent, as a camera move.
 *
 * Every visual parameter of the 3D scene is a function of one number:
 * how far down the page you are. Rather than scatter that logic across
 * components, the whole film is described here as keyframes and sampled
 * once per frame. Retiming a beat means editing one number in one file,
 * which is the only way a ten-scene sequence stays tunable.
 */

export type Beat = {
  /** Scroll progress at which this beat is fully in effect. */
  p: number;
  /** Camera position. */
  cam: [number, number, number];
  /** Camera target. */
  look: [number, number, number];
  /** Field of view — pulling focal length is cheaper drama than moving. */
  fov: number;
  /** Core spin speed, radians/sec. */
  spin: number;
  /** Y rotation offset, radians. */
  turn: number;
  /** 0 = solid core, 1 = discs fully separated. */
  separate: number;
  /** Discs shrink away as the particle field takes over. */
  dissolve: number;
  /** Particle field: 0 = packed in the core, 1 = sphere. */
  morph: number;
  /** Helix blend for the dispersal beat. */
  ribbon: number;
  /** Particle turbulence. */
  drift: number;
  /** Particle opacity. */
  particles: number;
  /** Glass shell opacity. */
  glass: number;
  /** Write-head intensity. */
  write: number;
  /** Bloom strength. */
  bloom: number;
  /** Overall exposure. */
  exposure: number;
};

/**
 * Ten beats, matched to the ten chapters in src/data/site.ts.
 * Positions assume a core 7 units tall centred on the origin.
 */
export const BEATS: Beat[] = [
  // 00 — SURFACE. The core hangs to the right of the headline, whole
  // and slowly turning, with its full 7-unit length inside the frame.
  {
    p: 0.0,
    cam: [-3.4, 0.3, 14.2], look: [-2.5, 0, 0], fov: 34,
    spin: 0.055, turn: 0, separate: 0, dissolve: 0, morph: 0, ribbon: 0,
    drift: 0.035, particles: 0.3, glass: 1, write: 0, bloom: 0.42, exposure: 1.0,
  },
  // 01 — DESCENT. Camera drops and closes; the core rises past frame.
  {
    p: 0.11,
    cam: [-2.2, -1.6, 10.2], look: [-1.3, 0.7, 0], fov: 38,
    spin: 0.08, turn: 0.5, separate: 0, dissolve: 0, morph: 0, ribbon: 0,
    drift: 0.05, particles: 0.4, glass: 1, write: 0, bloom: 0.46, exposure: 1.0,
  },
  // 02 — THE MEDIUM. Hard in on the glass; refraction does the work.
  {
    p: 0.22,
    cam: [1.9, -0.3, 3.4], look: [1.05, -0.1, 0], fov: 44,
    spin: 0.05, turn: 1.1, separate: 0, dissolve: 0, morph: 0, ribbon: 0,
    drift: 0.04, particles: 0.5, glass: 1, write: 0, bloom: 0.5, exposure: 1.05,
  },
  // 03 — INSCRIPTION. The write head runs the length of the core.
  {
    p: 0.33,
    cam: [-1.9, 0.2, 6.4], look: [0, 0, 0], fov: 40,
    spin: 0.2, turn: 2.1, separate: 0, dissolve: 0, morph: 0, ribbon: 0,
    drift: 0.06, particles: 0.6, glass: 1, write: 1, bloom: 0.8, exposure: 1.08,
  },
  // 04 — THE SEQUENCE. The stack comes apart; the frame has to grow
  // to hold roughly eleven units of separated beds.
  {
    p: 0.45,
    cam: [2.6, 0.1, 16.5], look: [1.7, 0, 0], fov: 38,
    spin: 0.12, turn: 3.0, separate: 1, dissolve: 0, morph: 0, ribbon: 0,
    drift: 0.09, particles: 0.7, glass: 0.16, write: 0.15, bloom: 0.6, exposure: 1.02,
  },
  // 05 — THE VAULT. Pull further back; the beds hang in the dark.
  {
    p: 0.55,
    cam: [-3.4, 1.2, 19.0], look: [-2.0, 0.2, 0], fov: 34,
    spin: 0.1, turn: 3.7, separate: 1, dissolve: 0.25, morph: 0.1, ribbon: 0.25,
    drift: 0.16, particles: 0.85, glass: 0.06, write: 0, bloom: 0.66, exposure: 1.0,
  },
  // 06 — DISPERSAL. The beds give way entirely to the record itself.
  {
    p: 0.66,
    cam: [0, 0, 12.0], look: [0, 0, 0], fov: 42,
    spin: 0.07, turn: 4.4, separate: 1, dissolve: 1, morph: 0.45, ribbon: 0.85,
    drift: 0.3, particles: 1, glass: 0, write: 0, bloom: 0.9, exposure: 1.04,
  },
  // 07 — THE MANDATE. The sphere, seen from outside. The page behind
  // this beat is daylight, so the field pulls right of the timeline.
  {
    p: 0.78,
    cam: [-2.6, 0, 9.4], look: [-1.9, 0, 0], fov: 44,
    spin: 0.05, turn: 5.0, separate: 1, dissolve: 1, morph: 1, ribbon: 0,
    drift: 0.1, particles: 1, glass: 0, write: 0, bloom: 0.72, exposure: 1.0,
  },
  // 08 — THE READER. It gathers itself back into a core.
  {
    p: 0.9,
    cam: [2.4, 0.2, 13.5], look: [1.5, 0, 0], fov: 36,
    spin: 0.09, turn: 5.6, separate: 0.12, dissolve: 0.12, morph: 0.08, ribbon: 0.1,
    drift: 0.05, particles: 0.5, glass: 0.85, write: 0, bloom: 0.5, exposure: 0.98,
  },
  // 09 — TRANSMIT. Small, whole, and waiting.
  {
    p: 1.0,
    cam: [-1.9, 0.1, 21.0], look: [-1.2, 0, 0], fov: 30,
    spin: 0.045, turn: 6.0, separate: 0, dissolve: 0, morph: 0, ribbon: 0,
    drift: 0.03, particles: 0.4, glass: 1, write: 0, bloom: 0.44, exposure: 0.95,
  },
];

/** The scalar channels — everything on a Beat except p and the vectors. */
type NumKey = Exclude<keyof Beat, 'p' | 'cam' | 'look'>;

const NUM_KEYS: NumKey[] = [
  'fov', 'spin', 'turn', 'separate', 'dissolve', 'morph',
  'ribbon', 'drift', 'particles', 'glass', 'write', 'bloom', 'exposure',
];

export type Sampled = Omit<Beat, 'p'>;

const out: Sampled = { ...BEATS[0] } as Sampled;
const vec3a: [number, number, number] = [0, 0, 0];
const vec3b: [number, number, number] = [0, 0, 0];

/**
 * Samples the timeline at progress `p`.
 *
 * Reuses one object rather than allocating — this runs 60+ times a
 * second and the garbage from a fresh object per frame is exactly the
 * kind of thing that produces a stutter every few seconds.
 */
export function sampleBeats(p: number): Sampled {
  let i = 0;
  while (i < BEATS.length - 2 && p > BEATS[i + 1].p) i++;

  const a = BEATS[i];
  const b = BEATS[i + 1] ?? a;
  const span = b.p - a.p || 1;
  // Smoothstep between beats, so the cut between two camera positions
  // eases at both ends and never arrives with a visible corner.
  const t = smoothstep(0, 1, Math.min(1, Math.max(0, (p - a.p) / span)));

  for (let k = 0; k < 3; k++) {
    vec3a[k] = a.cam[k] + (b.cam[k] - a.cam[k]) * t;
    vec3b[k] = a.look[k] + (b.look[k] - a.look[k]) * t;
  }
  out.cam = vec3a;
  out.look = vec3b;

  for (const key of NUM_KEYS) {
    out[key] = a[key] + (b[key] - a[key]) * t;
  }
  return out;
}
