'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Polymorphic `as` needs a permissive element type; the strict
// ElementType makes every forwarded prop resolve to `never`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTag = React.ElementType<any>;
import { gsap, SplitText, useGsap } from '@/lib/gsap';
import { useExperience } from '@/stores/useExperience';

type Common = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Start position for the ScrollTrigger, e.g. "top 82%". */
  start?: string;
  as?: AnyTag;
  /** Play immediately on mount instead of waiting for scroll. */
  immediate?: boolean;
};

/**
 * Line-by-line text reveal.
 *
 * Lines are masked by a wrapper with overflow hidden and rise from
 * beneath it, which is the difference between text that *arrives* and
 * text that merely fades. Split happens after fonts settle, otherwise
 * the line boxes are measured against the fallback face and the mask
 * ends up cropping descenders.
 */
export function RevealText({
  children,
  className,
  delay = 0,
  start = 'top 84%',
  as = 'div',
  immediate = false,
  stagger = 0.085,
}: Common & { stagger?: number }) {
  const Tag = as as 'div';
  const ref = useRef<HTMLElement>(null);
  const reduced = useExperience((s) => s.reduced);
  useGsap();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      el.style.visibility = 'visible';
      return;
    }

    let split: SplitText | null = null;
    let ctx: gsap.Context | null = null;
    let cancelled = false;

    const run = () => {
      if (cancelled || !el) return;
      split = new SplitText(el, {
        type: 'lines',
        linesClass: 'reveal-line',
        mask: 'lines',
      });

      ctx = gsap.context(() => {
        gsap.set(el, { visibility: 'visible' });
        gsap.from(split!.lines, {
          yPercent: 116,
          duration: 1.15,
          ease: 'expo.out',
          stagger,
          delay,
          scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
        });
      }, el);
    };

    // Wait for the real face before measuring line boxes, but never
    // let a stalled font load leave the text permanently hidden.
    if (document.fonts?.status === 'loaded') run();
    else document.fonts?.ready.then(run).catch(run);
    const failsafe = setTimeout(() => {
      if (el.style.visibility !== 'visible') el.style.visibility = 'visible';
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      ctx?.revert();
      split?.revert();
    };
  }, [delay, start, immediate, stagger, reduced]);

  return (
    <Tag
      ref={ref as never}
      className={className}
      data-reveal=""
      style={{ visibility: 'hidden' }}
    >
      {children}
    </Tag>
  );
}

/**
 * Per-character reveal, for short display lines only. Splitting a
 * paragraph into characters wrecks screen-reader output and costs a
 * layout pass per glyph, so this is deliberately not the default.
 */
export function RevealChars({
  children,
  className,
  delay = 0,
  start = 'top 84%',
  as = 'span',
  immediate = false,
}: Common) {
  const Tag = as as 'span';
  const ref = useRef<HTMLElement>(null);
  const reduced = useExperience((s) => s.reduced);
  useGsap();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      el.style.visibility = 'visible';
      return;
    }

    let split: SplitText | null = null;
    let ctx: gsap.Context | null = null;
    let cancelled = false;

    const run = () => {
      if (cancelled || !el) return;
      split = new SplitText(el, { type: 'chars,lines', mask: 'lines' });
      ctx = gsap.context(() => {
        gsap.set(el, { visibility: 'visible' });
        gsap.from(split!.chars, {
          yPercent: 108,
          rotate: 3,
          duration: 1.0,
          ease: 'expo.out',
          stagger: { each: 0.026, from: 'start' },
          delay,
          scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
        });
      }, el);
    };

    if (document.fonts?.status === 'loaded') run();
    else document.fonts?.ready.then(run).catch(run);
    const failsafe = setTimeout(() => {
      if (el.style.visibility !== 'visible') el.style.visibility = 'visible';
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      ctx?.revert();
      split?.revert();
    };
  }, [delay, start, immediate, reduced]);

  return (
    <Tag
      ref={ref as never}
      className={className}
      data-reveal=""
      style={{ visibility: 'hidden' }}
    >
      {children}
    </Tag>
  );
}

/** Generic element reveal: rise and fade, with an optional stagger over children. */
export function Reveal({
  children,
  className,
  delay = 0,
  start = 'top 86%',
  as = 'div',
  immediate = false,
  stagger = 0,
  distance = 26,
}: Common & { stagger?: number; distance?: number }) {
  const Tag = as as 'div';
  const ref = useRef<HTMLElement>(null);
  const reduced = useExperience((s) => s.reduced);
  useGsap();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      const targets = stagger ? Array.from(el.children) : [el];
      gsap.from(targets, {
        y: distance,
        autoAlpha: 0,
        duration: 1.15,
        ease: 'expo.out',
        stagger,
        delay,
        scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [delay, start, immediate, stagger, distance, reduced]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
