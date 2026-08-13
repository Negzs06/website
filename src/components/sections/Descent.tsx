'use client';

import { Slug } from './Slug';
import { Plate } from '@/components/ui/Plate';
import { RevealText, Reveal } from '@/components/motion/Reveal';
import { STATEMENTS, FACTS } from '@/data/site';
import s from './sections.module.css';

/* ==================================================================
   01 — DESCENT
   The argument. One tall plate against a column of type, with the
   core still turning in the gap between them.
   ================================================================== */

export function Descent() {
  return (
    <section className={`${s.scene} ${s.descent}`} aria-labelledby="descent-title">
      <div style={{ gridColumn: '1 / -1' }}>
        <Slug num="01" label="Descent" right="−062 m" />
      </div>

      <div className={s.descentPlate}>
        <Plate
          name="plate-shaft"
          sizes="(max-width: 860px) 100vw, 34vw"
          parallax={0.07}
          from="bottom"
          caption="Access bore, looking down"
          style={{ height: '100%' }}
        />
      </div>

      <div className={s.descentText}>
        <RevealText as="h2" className={s.statement}>
          <span id="descent-title">{STATEMENTS.descent}</span>
        </RevealText>

        <Reveal className={s.body} distance={18}>
          <p>
            CHRONOLITH is built on the opposite assumption. We do not expect to be
            remembered, funded, or understood. The vault is designed to survive our own
            institution failing — which, on the timescale we are working to, is the single
            most likely event.
          </p>
        </Reveal>

        <div className={`${s.facts} u-meta`}>
          {FACTS.map((f) => (
            <div key={f.k} className={s.fact}>
              <span className={s.factK}>{f.k}</span>
              <span className={s.factV}>{f.v}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================================================================
   02 — THE MEDIUM
   Three words, very large, with the glass shell filling the frame
   behind them. Almost nothing on screen except the object.
   ================================================================== */

export function Medium() {
  return (
    <section className={`${s.scene} ${s.medium}`} aria-labelledby="medium-title">
      <div style={{ width: '100%' }}>
        <Slug num="02" label="The Medium" right="−148 m" />
      </div>

      <RevealText as="h2" className={s.colossal} stagger={0.1}>
        <span id="medium-title">
          {STATEMENTS.medium[0]}
          <span className={s.colossalItalic}>{STATEMENTS.medium[1]}</span>
          {STATEMENTS.medium[2]}
        </span>
      </RevealText>

      <Reveal className={s.mediumNote} distance={20}>
        <p>
          A femtosecond pulse, focused inside a blank of fused silica, permanently alters
          the refractive index of the glass at that point. Not a mark on a surface. A
          change to the material itself, in three dimensions, with the orientation and
          size of each voxel carrying two dimensions more.
        </p>
      </Reveal>
    </section>
  );
}

/* ==================================================================
   03 — INSCRIPTION
   The write head runs the core in the 3D scene; the page annotates
   it like an instrument readout.
   ================================================================== */

const READOUTS = [
  { k: 'Pulse duration', v: '280 fs' },
  { k: 'Wavelength', v: '1030 nm' },
  { k: 'Voxel pitch', v: '1.2 µm' },
  { k: 'Layers per blank', v: '124' },
  { k: 'Capacity', v: '360 TB' },
  { k: 'Projected retention', v: '10¹⁴ yr' },
];

export function Inscription() {
  return (
    <section className={`${s.scene} ${s.inscription}`} aria-labelledby="inscription-title">
      <div style={{ gridColumn: '1 / -1' }}>
        <Slug num="03" label="Inscription" right="−236 m" />
      </div>

      <div className={s.specCol}>
        <RevealText as="h2" className={s.specHead}>
          <span id="inscription-title">
            Writing takes eleven days.
            <br />
            Reading takes a civilisation.
          </span>
        </RevealText>

        <Reveal className={s.body} distance={18}>
          <p>
            The hard problem was never storage density. It is that every encoding we have
            ever invented has assumed a reader who already knows the convention. Ours
            cannot. Each blank opens with a primer that teaches its own format using only
            physical constants and the night sky.
          </p>
        </Reveal>

        <dl className={`${s.readouts} u-meta`}>
          {READOUTS.map((r) => (
            <div key={r.k} className={s.readout}>
              <dt>{r.k}</dt>
              <dd className={s.readoutV}>{r.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
