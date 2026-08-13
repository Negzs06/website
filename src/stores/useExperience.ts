'use client';

import { create } from 'zustand';

export type Tier = 'high' | 'mid' | 'low';

type ExperienceState = {
  /** Loader has finished and the intro has handed off to the hero. */
  entered: boolean;
  /** Real asset-loading progress, 0 → 1. */
  progress: number;
  /** Fullscreen menu. */
  menuOpen: boolean;
  /** Ambient audio, off until the visitor asks for it. */
  audioOn: boolean;
  /** Device capability, resolved once on mount. */
  tier: Tier;
  /** True when the visitor has asked for reduced motion. */
  reduced: boolean;
  /** True on coarse-pointer devices — disables the custom cursor. */
  touch: boolean;
  /** The chapter label currently shown in the depth rail. */
  chapter: number;

  setProgress: (v: number) => void;
  enter: () => void;
  toggleMenu: (v?: boolean) => void;
  toggleAudio: (v?: boolean) => void;
  setEnv: (env: { tier: Tier; reduced: boolean; touch: boolean }) => void;
  setChapter: (i: number) => void;
};

export const useExperience = create<ExperienceState>((set) => ({
  entered: false,
  progress: 0,
  menuOpen: false,
  audioOn: false,
  tier: 'high',
  reduced: false,
  touch: false,
  chapter: 0,

  setProgress: (v) => set((s) => (v > s.progress ? { progress: v } : s)),
  enter: () => set({ entered: true }),
  toggleMenu: (v) => set((s) => ({ menuOpen: v ?? !s.menuOpen })),
  toggleAudio: (v) => set((s) => ({ audioOn: v ?? !s.audioOn })),
  setEnv: (env) => set(env),
  setChapter: (i) => set((s) => (s.chapter === i ? s : { chapter: i })),
}));

/**
 * Capability tiering. Deciding what to render from the device rather
 * than from the viewport width: a 13" laptop and a flagship phone want
 * very different things from a scene that costs the same in CSS pixels.
 */
export function detectTier(): { tier: Tier; reduced: boolean; touch: boolean } {
  if (typeof window === 'undefined') {
    return { tier: 'high', reduced: false, touch: false };
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 640;

  let tier: Tier = 'high';
  if (touch || smallViewport) tier = 'mid';
  if (cores <= 4 || mem <= 4) tier = touch || smallViewport ? 'low' : 'mid';
  if (cores <= 2 || mem <= 2) tier = 'low';

  // A visitor asking for reduced motion gets the cheapest scene too —
  // they are usually asking for calm, and calm is also cheap.
  if (reduced) tier = 'low';

  return { tier, reduced, touch };
}

/** Per-tier scene budget. Every WebGL cost in the app reads from here. */
export const BUDGET = {
  high: { particles: 42000, dpr: [1, 1.85] as [number, number], dof: true, transmission: true, samples: 3 },
  mid: { particles: 16000, dpr: [1, 1.5] as [number, number], dof: false, transmission: true, samples: 0 },
  low: { particles: 6000, dpr: [1, 1.25] as [number, number], dof: false, transmission: false, samples: 0 },
} as const;
