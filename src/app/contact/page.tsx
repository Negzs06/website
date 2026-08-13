import type { Metadata } from 'next';
import { SceneDriver } from '@/components/motion/SceneDriver';
import { RevealText, Reveal } from '@/components/motion/Reveal';
import { Footer } from '@/components/layout/Footer';
import { DepositForm } from './DepositForm';
import { SiteClock } from './SiteClock';
import { SITE } from '@/data/site';
import s from './contact.module.css';

export const metadata: Metadata = {
  title: 'Deposit',
  description:
    'Propose a deposit to Vault 04. The committee sits four times a year and answers every proposal in writing.',
};

export default function ContactPage() {
  return (
    <>
      {/* The core, whole again and waiting — the closing beat. */}
      <SceneDriver from={0.92} to={1} presence={0.6} />

      <main id="main" className={`${s.page} zone-deep`}>
        <div className={s.head}>
          <span className="u-meta">04 — Deposit / Proposals open</span>
          <RevealText as="h1" className={s.title} immediate stagger={0.09}>
            <span>
              Tell us what
              <span className={s.titleSerif}>must not</span>
              be lost.
            </span>
          </RevealText>
          <Reveal className={s.lede} immediate delay={0.3}>
            <p>
              One proposal in nine hundred is admitted. The test is not importance — it is
              whether the thing could be reconstructed from first principles by someone
              who never had it. If it could, it does not need us.
            </p>
          </Reveal>
        </div>

        <div className={s.grid}>
          <DepositForm />

          <aside className={s.aside}>
            <div className={s.block}>
              <span className={`${s.blockHead} u-meta`}>Site time</span>
              <SiteClock />
            </div>

            <div className={s.block}>
              <span className={`${s.blockHead} u-meta`}>Direct</span>
              <a
                className={`${s.blockBig} ${s.aLink}`}
                href={`mailto:${SITE.contact.deposit}`}
                data-cursor="link"
              >
                {SITE.contact.deposit}
              </a>
              <a
                className={`${s.aLink} u-meta`}
                href={`mailto:${SITE.contact.press}`}
                data-cursor="link"
              >
                {SITE.contact.press}
              </a>
              <a
                className={`${s.aLink} u-meta`}
                href={`tel:${SITE.contact.phone.replace(/\s/g, '')}`}
                data-cursor="link"
              >
                {SITE.contact.phone}
              </a>
            </div>

            <address className={s.block} style={{ fontStyle: 'normal' }}>
              <span className={`${s.blockHead} u-meta`}>Surface facility</span>
              {SITE.address.map((line) => (
                <span key={line} className="u-meta">
                  {line}
                </span>
              ))}
              <span className="u-meta" style={{ marginTop: '0.4rem' }}>
                {SITE.coords.lat} {SITE.coords.lon}
              </span>
            </address>

            <div className={s.block}>
              <span className={`${s.blockHead} u-meta`}>Committee</span>
              <span className="u-meta">Sits February, May, August, November</span>
              <span className="u-meta">Every proposal answered in writing</span>
            </div>

            <div className={s.block}>
              <span className={`${s.blockHead} u-meta`}>Visiting</span>
              <span className="u-meta">
                The surface facility is open to the public on the first Saturday of each
                month. The vault itself is not, and will not be again after 2061.
              </span>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
