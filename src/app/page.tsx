import { Hero } from '@/components/Hero';
import { ProductReveal } from '@/components/ProductReveal';
import { Notes } from '@/components/Notes';
import { Philosophy } from '@/components/Philosophy';
import { Showcase } from '@/components/Showcase';
import { Details } from '@/components/Details';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <main id="main">
        <Hero />
        <ProductReveal />
        <Notes />
        <Philosophy />
        <Showcase />
        <Details />
      </main>
      <Footer />
    </>
  );
}
