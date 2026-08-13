import type { Metadata } from 'next';
import { SceneDriver } from '@/components/motion/SceneDriver';
import { RevealText, Reveal } from '@/components/motion/Reveal';
import { Footer } from '@/components/layout/Footer';
import { RegisterList } from './RegisterList';
import { RECORDS } from '@/data/site';
import s from './register.module.css';

export const metadata: Metadata = {
  title: 'Register',
  description:
    'The public register of everything committed to Vault 04 — six deposits, sealed or in inscription.',
};

export default function RegisterPage() {
  const sealed = RECORDS.filter((r) => r.status === 'sealed').length;

  return (
    <>
      {/* Holds the core in its dispersed state for the whole page. */}
      <SceneDriver from={0.6} to={0.72} presence={0.4} />

      <main id="main" className="zone-deep">
        <section className={s.hero} aria-labelledby="register-title">
          <span className="u-meta">
            03 — Register / {sealed} sealed, {RECORDS.length - sealed} in inscription
          </span>
          <RevealText as="h1" className={s.title} immediate stagger={0.09}>
            <span id="register-title">
              What is <span className={s.titleSerif}>already</span> down there
            </span>
          </RevealText>
          <Reveal className={s.lede} immediate delay={0.3}>
            <p>
              The register is public and always will be. Anyone may read what has been
              committed to the vault, and anyone may argue that something is missing.
            </p>
          </Reveal>
        </section>

        <RegisterList />
      </main>

      <Footer />
    </>
  );
}
