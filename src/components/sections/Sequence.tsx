'use client';

import { useEffect, useRef } from 'react';
import { Slug } from './Slug';
import { Plate } from '@/components/ui/Plate';
import { RevealText, Reveal } from '@/components/motion/Reveal';
import { gsap, useGsap } from '@/lib/gsap';
import { useExperience } from '@/stores/useExperience';
import s from './sections.module.css';

/* ==================================================================
   04 — THE SEQUENCE
   The core comes apart in the canvas. The page lists the beds it is
   coming apart into, so the two halves describe the same object.
   ================================================================== */

const BEDS = [
  { n: '01', name: 'Primer', tone: '#f4e9cd', depth: '0.0 m' },
  { n: '02', name: 'Sky survey', tone: '#8bb0a7', depth: '0.4 m' },
  { n: '03', name: 'Periodic key', tone: '#e7e2d6', depth: '0.9 m' },
  { n: '04', name: 'Languages', tone: '#a8a091', depth: '1.6 m' },
  { n: '05', name: 'Genomes', tone: '#c2502a', depth: '2.4 m' },
  { n: '06', name: 'Civic record', tone: '#6f6a61', depth: '3.1 m' },
  { n: '07', name: 'Failures', tone: '#c2502a', depth: '3.8 m' },
  { n: '08', name: 'Craft', tone: '#d7d0c1', depth: '4.6 m' },
  { n: '09', name: 'Terminus', tone: '#8bb0a7', depth: '5.2 m' },
];

export function Sequence() {
  const root = useRef<HTMLElement>(null);
  const reduced = useExperience((st) => st.reduced);
  useGsap();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      // The rows arrive one at a time as the discs separate on screen,
      // so the list feels like a readout of the thing that is happening
      // rather than a caption written afterwards.
      gsap.from('[data-bed]', {
        autoAlpha: 0,
        x: -24,
        duration: 0.85,
        stagger: 0.055,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 68%', once: true },
      });
      gsap.from('[data-bed-swatch]', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.1,
        stagger: 0.055,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 68%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className={`${s.scene} ${s.sequence}`} aria-labelledby="sequence-title">
      <div style={{ gridColumn: '1 / -1' }}>
        <Slug num="04" label="The Sequence" right="−341 m" />
      </div>

      <div className={s.bedList}>
        <h2 className="u-sr" id="sequence-title">
          The sequence, bed by bed
        </h2>
        {BEDS.map((b) => (
          <div key={b.n} className={`${s.bed} u-meta`} data-bed>
            <span>{b.n}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <span
                className={s.bedSwatch}
                style={{ background: b.tone }}
                data-bed-swatch
                aria-hidden="true"
              />
              {b.name}
            </span>
            <span className={s.bedDepth}>{b.depth}</span>
          </div>
        ))}
      </div>

      <div className={s.sequenceText}>
        <RevealText as="h3" className={s.statement}>
          <span>
            A canister is read from the bottom up, the way a geologist reads a cliff.
          </span>
        </RevealText>
        <Reveal className={s.body} distance={18}>
          <p>
            Order carries meaning. The primer is the deepest bed because it must be found
            first by anyone cutting down through the emplacement, and the terminus is at
            the top because it explains what has just been read. Nothing in the stack
            depends on a bed above it.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ==================================================================
   05 — THE VAULT
   The environment change. A full-bleed plate takes the screen and the
   canvas disappears entirely: the visitor is somewhere else.
   ================================================================== */

export function Vault() {
  const root = useRef<HTMLElement>(null);
  const reduced = useExperience((st) => st.reduced);
  useGsap();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      // The plate opens from a narrow slot to full bleed as the section
      // pins — the chamber revealing itself as your eyes adjust.
      gsap.fromTo(
        '[data-vault-plate]',
        { clipPath: 'inset(38% 22% 38% 22%)', scale: 1.25 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'top top',
            scrub: 0.5,
          },
        },
      );
      gsap.from('[data-vault-copy] > *', {
        yPercent: 60,
        autoAlpha: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 30%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className={`${s.vault} zone-vault`} aria-labelledby="vault-title">
      <div className={s.vaultSticky}>
        <div className={s.vaultPlate} data-vault-plate>
          <Plate
            name="plate-vault"
            sizes="100vw"
            reveal={false}
            style={{ position: 'absolute', inset: 0 }}
          />
        </div>
        <div className={s.vaultVeil} aria-hidden="true" />

        <div className={s.vaultCopy} data-vault-copy>
          <span className="u-meta">05 — The Vault / −468 m</span>
          <h2 id="vault-title" className={s.vaultTitle}>
            Salt closes behind you.
          </h2>
          <p className={s.body} style={{ color: 'var(--fg-muted)' }}>
            The formation has been geologically quiet for 250 million years. Salt creeps
            under its own weight: within fifty years of emplacement the chamber closes
            around each canister, and the deposit stops being a hole in the rock and
            becomes part of it.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================
   06 — DISPERSAL
   Back to the canvas: the beds give way to the record itself.
   ================================================================== */

export function Dispersal() {
  return (
    <section className={`${s.scene} ${s.dispersal}`} aria-labelledby="dispersal-title">
      <Slug num="06" label="Dispersal" right="−590 m" />

      <div className={s.dispersalGrid}>
        <div className={s.dispersalLead}>
          <RevealText as="h2" className={s.statement}>
            <span id="dispersal-title">
              One point of light for every thousand records. There are one million,
              two hundred and four thousand points.
            </span>
          </RevealText>
        </div>

        <div className={s.dispersalRight}>
          <Reveal className={s.body} distance={18}>
            <p>
              Nothing in the vault is stored once. Every deposit exists as three
              independent writes in three canisters, emplaced in three separate drifts, so
              that no single roof fall, no single flooding event and no single act of
              deliberate destruction can take a record out of the world.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
