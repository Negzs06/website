'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

let registered = false;

/** Registers plugins exactly once, on the client. */
export function useGsap() {
  if (!registered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    // Every default in the app, in one place. Individual tweens override
    // where the motion needs a different character.
    gsap.defaults({ ease: 'expo.out', duration: 1.05 });
    registered = true;
  }
  return { gsap, ScrollTrigger, SplitText };
}

export { gsap, ScrollTrigger, SplitText };

/**
 * Custom eases matching the CSS curves in tokens.css, so a transition
 * authored in CSS and one authored in GSAP feel like the same hand.
 */
export const EASE = {
  out: 'expo.out',
  inOut: 'expo.inOut',
  mask: 'power4.inOut',
  /** Overshoots very slightly — for magnetic snaps and cursor states. */
  spring: 'back.out(1.6)',
} as const;
