'use client';

import { useEffect } from 'react';
import { useExperience, detectTier } from '@/stores/useExperience';
import { SmoothScroll } from '@/components/motion/SmoothScroll';

export function Providers({ children }: { children: React.ReactNode }) {
  const setEnv = useExperience((s) => s.setEnv);

  useEffect(() => {
    setEnv(detectTier());

    // Honour a change of preference mid-session rather than only at load.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setEnv(detectTier());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setEnv]);

  return <SmoothScroll>{children}</SmoothScroll>;
}
