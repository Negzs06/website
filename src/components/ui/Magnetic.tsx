'use client';

import { useEffect, useRef, cloneElement, type ReactElement } from 'react';
import { damp } from '@/lib/story';
import { useExperience } from '@/stores/useExperience';

type Props = {
  children: ReactElement<{ ref?: React.Ref<HTMLElement> }>;
  /** How far the element is allowed to travel, in px. */
  strength?: number;
  /** Radius of influence beyond the element's own box, in px. */
  field?: number;
};

/**
 * Pulls its child toward the pointer while the pointer is nearby.
 *
 * The child's own transform is left alone — the offset is applied via a
 * CSS custom property the child's stylesheet composes into its
 * transform — so a magnetic element can still have its own hover scale
 * without the two fighting.
 */
export function Magnetic({ children, strength = 16, field = 90 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const touch = useExperience((s) => s.touch);
  const reduced = useExperience((s) => s.reduced);

  useEffect(() => {
    const el = ref.current;
    if (!el || touch || reduced) return;

    const pos = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let raf = 0;
    let last = performance.now();
    let active = false;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      // Distance measured from the element's edge, not its centre, so
      // wide buttons attract along their whole length.
      const ox = Math.max(0, Math.abs(dx) - r.width / 2);
      const oy = Math.max(0, Math.abs(dy) - r.height / 2);
      const dist = Math.hypot(ox, oy);

      if (dist > field) {
        target.x = 0;
        target.y = 0;
        if (active) {
          active = false;
          el.dataset.magnetic = 'false';
        }
        return;
      }

      const falloff = 1 - dist / field;
      target.x = (dx / (r.width / 2 + field)) * strength * falloff;
      target.y = (dy / (r.height / 2 + field)) * strength * falloff;
      if (!active) {
        active = true;
        el.dataset.magnetic = 'true';
      }
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      pos.x = damp(pos.x, target.x, 11, dt);
      pos.y = damp(pos.y, target.y, 11, dt);
      el.style.setProperty('--mx', `${pos.x.toFixed(2)}px`);
      el.style.setProperty('--my', `${pos.y.toFixed(2)}px`);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    };
  }, [strength, field, touch, reduced]);

  return cloneElement(children, { ref });
}
