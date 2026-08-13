'use client';

import { useEffect } from 'react';
import { story } from '@/lib/story';

/**
 * Maps this page's scroll onto a span of the 3D timeline.
 *
 * The home page plays the whole film (0 → 1). Secondary pages borrow a
 * slice of it, so the core is always in a state that suits the page you
 * are on — mid-inscription behind Method, dispersed behind Register —
 * rather than resetting to the same pose everywhere.
 */
export function SceneDriver({ from = 0, to = 1 }: { from?: number; to?: number }) {
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 8 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      story.progress = from + (to - from) * p;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [from, to]);

  return null;
}
