'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Slug } from './Slug';
import { Plate } from '@/components/ui/Plate';
import { RevealText, Reveal } from '@/components/motion/Reveal';
import { gsap, useGsap } from '@/lib/gsap';
import { useExperience } from '@/stores/useExperience';
import { RECORDS, STATEMENTS } from '@/data/site';
import type { PlateName } from '@/data/plates.generated';
import s from './sections.module.css';

/* ==================================================================
   07 — THE MANDATE
   The one return to daylight. After four dark scenes a full paper
   ground reads as a cut to a white room, and the deep-time scale
   below it is the only chart on the site.
   ================================================================== */

/** Spans in years, log-scaled against the 10,000 year mandate. */
const ERAS = [
  { name: 'A printed book', span: 500, note: 'acid paper, indoors' },
  { name: 'Magnetic tape', span: 30, note: 'LTO, climate controlled' },
  { name: 'A civilisation', span: 3_000, note: 'Sumer to collapse' },
  { name: 'This mandate', span: 10_000, note: 'Vault 04', hot: true },
  { name: 'Since the last ice', span: 11_700, note: 'Holocene, to date' },
  { name: 'The formation', span: 250_000_000, note: 'bedded halite' },
];

const MAX = Math.log10(250_000_000);

export function Mandate() {
  const root = useRef<HTMLElement>(null);
  const reduced = useExperience((st) => st.reduced);
  useGsap();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-era-bar]', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.6,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-timeline]', start: 'top 76%', once: true },
      });
      gsap.from('[data-era-row]', {
        autoAlpha: 0,
        y: 18,
        duration: 0.9,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-timeline]', start: 'top 76%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      className={`${s.scene} ${s.mandate} zone-surface`}
      aria-labelledby="mandate-title"
    >
      <div className={s.mandateInner}>
        <Slug num="07" label="The Mandate" right="−688 m" />

        <RevealText as="h2" className={s.colossal} stagger={0.1}>
          <span id="mandate-title">
            {STATEMENTS.mandate[0]}{' '}
            <span className={s.colossalItalic}>{STATEMENTS.mandate[1]}</span>
            {STATEMENTS.mandate[2]}
          </span>
        </RevealText>

        <div className={s.timeline} data-timeline>
          {ERAS.map((e) => (
            <div key={e.name} className={s.era} data-era-row>
              <span className={s.eraName}>{e.name}</span>
              <span className={s.eraBar}>
                <span
                  className={s.eraBarFill}
                  data-era-bar
                  data-hot={e.hot ? 'true' : undefined}
                  style={{ transform: `scaleX(${(Math.log10(e.span) / MAX).toFixed(4)})` }}
                />
              </span>
              <span className="u-meta" style={{ textAlign: 'right' }}>
                {e.span.toLocaleString('en-US')} yr — {e.note}
              </span>
            </div>
          ))}
        </div>

        <Reveal className={s.body} distance={18}>
          <p style={{ maxWidth: '52ch' }}>
            Ten thousand years is not chosen for poetry. It is the shortest interval over
            which every assumption we are comfortable making — about language, about
            institutions, about electricity — has already failed at least once in the
            past. If the archive works over ten thousand years, it works.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ==================================================================
   08 — THE READER
   A horizontal pass through the register. The section pins and the
   track moves with the scroll, so the page changes axis without
   hijacking the wheel.
   ================================================================== */

export function Reader() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useExperience((st) => st.reduced);
  const touch = useExperience((st) => st.touch);
  const native = reduced || touch;
  useGsap();

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr || native) return;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, tr.scrollWidth - window.innerWidth);

      gsap.to(tr, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          // The section is exactly as tall as the track is wide, so the
          // horizontal travel matches the vertical scroll one-to-one and
          // never feels rubbery.
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.55,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [native]);

  return (
    <section
      ref={root}
      className={`${s.reader} zone-deep`}
      data-native={native ? 'true' : undefined}
      aria-labelledby="reader-title"
    >
      <div className={s.readerSticky}>
        <div ref={track} className={s.track}>
          <div className={s.readerIntro}>
            <Slug num="08" label="The Reader" right="−790 m" />
            <RevealText as="h2" className={s.statement}>
              <span id="reader-title">Six deposits, sealed.</span>
            </RevealText>
            <p className={s.body}>
              The register is public. Anyone may read what has been committed to the
              vault, and anyone may argue that something is missing.
            </p>
            <Link href="/register" className="link-inline" data-cursor="link">
              Open the register
            </Link>
          </div>

          {RECORDS.map((r) => (
            <article key={r.id} className={s.card}>
              <Plate
                name={r.plate as PlateName}
                sizes="(max-width: 860px) 62vw, 26vw"
                className={s.cardPlate}
                reveal={false}
                cursor="view"
              />
              <div className={`${s.cardMeta} u-meta`}>
                <span>{r.ref}</span>
                <span>{r.volume}</span>
              </div>
              <h3 className={s.cardTitle}>{r.title}</h3>
              <p className="u-meta" style={{ opacity: 0.75 }}>
                {r.kind} — deposited {r.deposited}
              </p>
            </article>
          ))}

          <div className={s.readerIntro}>
            <RevealText as="p" className={s.statement}>
              <span>And one shelf left empty, on purpose.</span>
            </RevealText>
            <p className={s.body}>
              Drift 7 holds 400 unwritten blanks. They are reserved for whatever the next
              century decides we failed to notice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
