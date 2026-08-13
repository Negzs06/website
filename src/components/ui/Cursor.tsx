'use client';

import { useEffect, useRef } from 'react';
import { story, damp } from '@/lib/story';
import { useExperience } from '@/stores/useExperience';
import s from './Cursor.module.css';

const LABELS: Record<string, string> = {
  view: 'View',
  drag: 'Drag',
  open: 'Open',
  close: 'Close',
};

/**
 * The cursor exists to do two jobs: tell you what a thing will do
 * before you click it, and carry the pointer position for the rest of
 * the experience. It is not decoration — if it were only decoration it
 * would be a downgrade from the native cursor, which is always
 * perfectly responsive and never lags.
 *
 * Targets opt in with `data-cursor="view|drag|open|close|link"`.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const labelEl = useRef<HTMLSpanElement>(null);
  const touch = useExperience((st) => st.touch);
  const reduced = useExperience((st) => st.reduced);

  useEffect(() => {
    if (touch || reduced) return;
    document.documentElement.dataset.cursor = 'custom';

    const el = root.current!;
    const ringEl = ring.current!;
    const dotEl = dot.current!;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...target };
    const dotPos = { ...target };
    let visible = false;
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      story.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      story.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);

      if (!visible) {
        visible = true;
        el.dataset.visible = 'true';
        // Jump rather than fly in from the last known position.
        ringPos.x = dotPos.x = e.clientX;
        ringPos.y = dotPos.y = e.clientY;
      }

      // Resolve the hover state from the element under the pointer.
      const hit = (e.target as HTMLElement | null)?.closest?.('[data-cursor]') as HTMLElement | null;
      const state = hit?.dataset.cursor ?? '';
      if (el.dataset.state !== state) {
        el.dataset.state = state;
        if (labelEl.current) labelEl.current.textContent = LABELS[state] ?? '';
      }
    };

    const onLeave = () => {
      visible = false;
      el.dataset.visible = 'false';
    };
    const onDown = () => (el.dataset.press = 'true');
    const onUp = () => (el.dataset.press = 'false');

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // The dot is nearly locked to the pointer; the ring lags just
      // enough to read as mass without feeling broken.
      dotPos.x = damp(dotPos.x, target.x, 42, dt);
      dotPos.y = damp(dotPos.y, target.y, 42, dt);
      ringPos.x = damp(ringPos.x, target.x, 15, dt);
      ringPos.y = damp(ringPos.y, target.y, 15, dt);

      dotEl.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0)`;
      ringEl.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      if (labelEl.current) {
        labelEl.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      delete document.documentElement.dataset.cursor;
    };
  }, [touch, reduced]);

  if (touch || reduced) return null;

  return (
    <div ref={root} className={s.root} aria-hidden="true" data-visible="false">
      <div ref={ring} className={s.ring} />
      <div ref={dot} className={s.dot} />
      <span ref={labelEl} className={s.label} />
    </div>
  );
}
