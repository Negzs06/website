'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { story } from '@/lib/story';
import { useExperience } from '@/stores/useExperience';

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/**
 * Smooth scroll, wired to GSAP properly.
 *
 * Two things matter here and are usually got wrong:
 *
 * 1. Lenis must be driven by gsap.ticker rather than its own rAF loop.
 *    Two independent loops means ScrollTrigger reads a scroll position
 *    that is one frame stale, which shows up as pinned sections
 *    shivering against the content that scrolls past them.
 *
 * 2. lagSmoothing must be off. GSAP's default behaviour on a dropped
 *    frame is to pretend less time passed, which desynchronises
 *    scrub animations from the actual scroll offset.
 *
 * The inertia is deliberately short. Long easing feels luxurious for
 * about four seconds and obstructive forever after.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useExperience((s) => s.reduced);

  useEffect(() => {
    if (reduced) return;

    gsap.registerPlugin(ScrollTrigger);

    const instance = new Lenis({
      duration: 0.95,
      easing: (t: number) => 1 - Math.pow(1 - t, 3.2),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false, // native momentum on touch feels better than emulated
      autoRaf: false,
    });
    lenis = instance;

    const onScroll = ({ scroll, velocity }: { scroll: number; velocity: number }) => {
      story.scrollY = scroll;
      // Normalised against the viewport so velocity means the same thing
      // on a phone and a 4K display.
      story.velocity = Math.max(-1, Math.min(1, velocity / (window.innerHeight * 0.55)));
      ScrollTrigger.update();
    };
    instance.on('scroll', onScroll);

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Velocity has to decay on its own: Lenis stops emitting once the
    // scroll settles, so without this the last value sticks forever.
    let raf = 0;
    const decay = () => {
      story.velocity *= 0.9;
      if (Math.abs(story.velocity) < 1e-4) story.velocity = 0;
      raf = requestAnimationFrame(decay);
    };
    raf = requestAnimationFrame(decay);

    return () => {
      cancelAnimationFrame(raf);
      gsap.ticker.remove(tick);
      instance.off('scroll', onScroll);
      instance.destroy();
      lenis = null;
    };
  }, [reduced]);

  // Every route change starts at the top with a clean ScrollTrigger
  // graph — stale triggers from the previous page are the classic cause
  // of "the second page scrolls wrong".
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
    story.scrollY = 0;
    story.progress = 0;
    story.velocity = 0;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}

/** Lock scrolling for the loader and the fullscreen menu. */
export function setScrollLocked(locked: boolean) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.locked = String(locked);
  }
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}
