'use client';

import { useEffect, useRef } from 'react';
import { gsap, useGsap } from '@/lib/gsap';
import { useExperience } from '@/stores/useExperience';
import { SITE, STATEMENTS } from '@/data/site';
import s from './sections.module.css';

/**
 * 00 — SURFACE.
 *
 * The hero holds back: three lines of type, one paragraph, and the
 * core turning behind all of it. The restraint is the point — the
 * scene behind the text is doing the work, and crowding it with
 * badges and buttons would be arguing with your own best asset.
 *
 * The entrance waits for the loader to hand over, so the two
 * animations read as one continuous move rather than two that happen
 * to overlap.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const entered = useExperience((st) => st.entered);
  const reduced = useExperience((st) => st.reduced);
  useGsap();

  useEffect(() => {
    if (!entered || reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl.from('[data-hero-line] > span', {
        yPercent: 118,
        duration: 1.4,
        stagger: 0.11,
      })
        .from('[data-hero-meta]', { autoAlpha: 0, y: 16, duration: 1, stagger: 0.08 }, 0.35)
        .from('[data-hero-lede]', { autoAlpha: 0, y: 20, duration: 1.15 }, 0.5)
        .from('[data-hero-cue]', { autoAlpha: 0, duration: 0.9 }, 0.85);

      // The whole hero drifts up and dims as the descent begins, so
      // scrolling away from it feels like leaving rather than scrolling.
      gsap.to('[data-hero-parallax]', {
        yPercent: -18,
        autoAlpha: 0.15,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [entered, reduced]);

  return (
    <section ref={root} className={`${s.scene} ${s.hero}`} aria-labelledby="hero-title">
      <div className={s.heroTop} data-hero-parallax>
        <h1 id="hero-title" className={s.heroTitle}>
          <span className="u-sr">
            {STATEMENTS.hero.join(' ')} {SITE.tagline}
          </span>
          <span aria-hidden="true" style={{ display: 'block', overflow: 'hidden' }} data-hero-line>
            <span style={{ display: 'block' }}>{STATEMENTS.hero[0]}</span>
          </span>
          <span aria-hidden="true" style={{ display: 'block', overflow: 'hidden' }} data-hero-line>
            <span className={s.heroSerif}>{STATEMENTS.hero[1]}</span>
          </span>
          <span aria-hidden="true" style={{ display: 'block', overflow: 'hidden' }} data-hero-line>
            <span style={{ display: 'block' }}>{STATEMENTS.hero[2]}</span>
          </span>
        </h1>
      </div>

      <div className={s.heroBottom} data-hero-parallax>
        <p className={s.heroLede} data-hero-lede>
          {STATEMENTS.heroLede}
        </p>

        <div style={{ display: 'grid', gap: '0.9rem', justifyItems: 'start' }}>
          <span className="u-meta" data-hero-meta>
            Est. {SITE.founded} — {SITE.descriptor}
          </span>
          <span className="u-meta" data-hero-meta>
            {SITE.mandate.toLocaleString('en-US')} year mandate / {SITE.vaultDepth} m below datum
          </span>
          <span className={`${s.heroCue} u-meta`} data-hero-cue>
            <span className={s.heroCueLine} aria-hidden="true" />
            Scroll to descend
          </span>
        </div>
      </div>
    </section>
  );
}
