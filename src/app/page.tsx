import { SceneDriver } from '@/components/motion/SceneDriver';
import { Hero } from '@/components/sections/Hero';
import { Descent, Medium, Inscription } from '@/components/sections/Descent';
import { Sequence, Vault, Dispersal } from '@/components/sections/Sequence';
import { Mandate, Reader } from '@/components/sections/Mandate';
import { Footer } from '@/components/layout/Footer';

/**
 * The descent — ten scenes, one continuous move.
 *
 * The page plays the full 3D timeline (0 → 1). Every section is
 * transparent unless it is deliberately taking the screen, so the core
 * is visible through most of the descent and its disappearance in the
 * Vault and Mandate scenes is itself an event.
 */
export default function HomePage() {
  return (
    <>
      <SceneDriver from={0} to={1} />
      <main id="main" className="zone-deep">
        <Hero />
        <Descent />
        <Medium />
        <Inscription />
        <Sequence />
        <Vault />
        <Dispersal />
        <Mandate />
        <Reader />
      </main>
      <Footer />
    </>
  );
}
