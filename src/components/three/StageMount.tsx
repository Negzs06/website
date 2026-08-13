'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useExperience } from '@/stores/useExperience';

/**
 * Keeps three.js out of the initial bundle.
 *
 * The canvas is also deferred until after first paint, so the loader
 * animation gets the main thread to itself while ~450 KB of WebGL code
 * is still being parsed. The first thing the visitor sees is therefore
 * never competing with shader compilation.
 */
const Stage = dynamic(() => import('./Stage').then((m) => m.Stage), { ssr: false });

export function StageMount() {
  const [go, setGo] = useState(false);
  const reduced = useExperience((s) => s.reduced);

  useEffect(() => {
    if (reduced) {
      // Reduced motion gets no canvas at all. The pages are designed to
      // stand up as documents without it.
      window.dispatchEvent(new CustomEvent('chronolith:scene', { detail: 1 }));
      return;
    }
    const id = requestAnimationFrame(() => setGo(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  if (reduced || !go) return null;
  return <Stage />;
}
