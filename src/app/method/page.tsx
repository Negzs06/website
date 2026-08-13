import type { Metadata } from 'next';
import { SceneDriver } from '@/components/motion/SceneDriver';
import { Plate } from '@/components/ui/Plate';
import { RevealText, Reveal } from '@/components/motion/Reveal';
import { Footer } from '@/components/layout/Footer';
import { METHOD, SITE } from '@/data/site';
import type { PlateName } from '@/data/plates.generated';
import s from './method.module.css';

export const metadata: Metadata = {
  title: 'Method',
  description:
    'How CHRONOLITH selects, inscribes, proves, emplaces and makes legible a record intended to be read ten thousand years from now.',
};

/** A plate for each step of the process. */
const STEP_PLATES: PlateName[] = [
  'plate-varve',
  'plate-inscribe',
  'plate-wafer',
  'plate-vault',
  'plate-halite',
];

/**
 * The method, as a printed document.
 *
 * The page opens on the dark scene mid-inscription and then hands over
 * to paper. Giving the technical record its own tonal world — daylight,
 * a sticky column, real body copy at a real measure — is what stops the
 * site being ten variations of the same dark screen.
 */
export default function MethodPage() {
  return (
    <>
      {/* Parks the core in the inscription beat for the whole page. */}
      <SceneDriver from={0.26} to={0.38} presence={0.75} />

      <main id="main">
        <section className={`${s.hero} zone-deep`} aria-labelledby="method-title">
          <span className="u-meta">02 — Method / Public technical record</span>
          <RevealText as="h1" className={s.title} immediate stagger={0.09}>
            <span id="method-title">
              Written
              <span className={s.titleSerif}>with light,</span>
              into glass.
            </span>
          </RevealText>
          <Reveal className={s.lede} immediate delay={0.35}>
            <p>
              Five operations stand between a submission and a sealed canister. None of
              them is novel on its own. The difficulty is that all five have to hold for
              ten thousand years without anyone maintaining them.
            </p>
          </Reveal>
        </section>

        <div className={`${s.doc} zone-surface`}>
          <div className={`${s.docHead} u-meta`}>
            <span>Operations 01—05</span>
            <span>Revision 14 — {SITE.founded + 12}</span>
          </div>

          {METHOD.map((m, i) => (
            <article key={m.step} className={s.step}>
              <header className={s.stepHead}>
                <div className={s.stepHeadInner}>
                  <span className={`${s.stepNum} u-meta`}>Operation {m.step}</span>
                  <h2 className={s.stepTitle}>{m.title}</h2>
                  <p className={s.stepLede}>{m.lede}</p>
                </div>
              </header>

              <div className={s.stepBody}>
                <Plate
                  name={STEP_PLATES[i]}
                  sizes="(max-width: 860px) 92vw, 52vw"
                  className={s.stepPlate}
                  parallax={0.04}
                  from={i % 2 ? 'right' : 'left'}
                />
                <Reveal className={s.stepText} distance={18}>
                  <p>{m.body}</p>
                </Reveal>
                <div className={s.metric}>
                  <span className={s.metricV}>{m.metric}</span>
                  <span className={`${s.metricK} u-meta`}>{m.metricLabel}</span>
                </div>
              </div>
            </article>
          ))}

          <div className={s.spread}>
            <Plate
              name="plate-section"
              sizes="94vw"
              className={s.spreadPlate}
              caption="Vault 04 — section through the emplacement horizon"
            />
            <div className={s.spreadNote}>
              <RevealText as="p" className={s.spreadNoteText}>
                <span>
                  If every one of these operations succeeds and no one ever cuts down to
                  the horizon, the project has still failed. Legibility is not a property
                  of the archive. It is a property of the relationship between the archive
                  and whoever finds it.
                </span>
              </RevealText>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
