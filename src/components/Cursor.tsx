'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

/**
 * A minimal ring cursor for pointer devices. Hidden entirely on touch
 * and for visitors who prefer reduced motion.
 */
export function Cursor() {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { damping: 28, stiffness: 320, mass: 0.4 });
  const springY = useSpring(y, { damping: 28, stiffness: 320, mass: 0.4 });

  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setEnabled(canHover && !reduceMotion);
    if (!canHover || reduceMotion) return;

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      setHovering(Boolean(target.closest('a, button, [role="tab"]')));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
    };
  }, [reduceMotion, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ left: springX, top: springY }}
      animate={{ scale: hovering ? 2.2 : 1, opacity: hovering ? 0.9 : 0.6 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-none fixed z-[70] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ivory-100 mix-blend-difference"
    />
  );
}
