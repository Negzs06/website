'use client';

import { useEffect, useRef } from 'react';
import { gsap, useGsap } from '@/lib/gsap';
import { useExperience } from '@/stores/useExperience';
import s from './sections.module.css';

/**
 * The section slug: number, title, and a rule that draws itself across
 * the remaining width as the section arrives. It appears at the head of
 * every scene and is what makes the page read as a numbered sequence.
 */
export function Slug({ num, label, right }: { num: string; label: string; right?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useExperience((st) => st.reduced);
  useGsap();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelector(`.${s.slugRule}`), {
        scaleX: 0,
        duration: 1.5,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
      gsap.from(el.querySelectorAll('[data-slug-item]'), {
        autoAlpha: 0,
        y: 12,
        duration: 0.9,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={ref} className={`${s.slug} u-meta`}>
      <span className={s.slugNum} data-slug-item>
        {num}
      </span>
      <span data-slug-item>{label}</span>
      <span className={s.slugRule} />
      {right && <span data-slug-item>{right}</span>}
    </div>
  );
}
