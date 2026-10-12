'use client';

import { Marble } from './Marble';
import { Reveal } from './Reveal';
import { PHILOSOPHY_PARAGRAPHS } from '@/lib/data';

export function Philosophy() {
  return (
    <section id="philosophy" className="relative overflow-hidden bg-noir-900 py-32 sm:py-44 lg:py-56">
      <Marble opacity={0.7} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 50% 50%, transparent, rgba(6,6,5,0.75))' }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-10">
        <Reveal>
          <span className="text-[0.68rem] uppercase tracking-[0.4em] text-silver-400">
            The Maison
          </span>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-10 font-display text-[1.6rem] italic leading-[1.3] text-ivory-100 sm:text-4xl lg:text-[2.75rem]">
            &ldquo;We do not compose fragrance to be smelled in a room.
            We compose it to be remembered in the dark.&rdquo;
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-silver-500">
            — The Perfumer, NOIR ATELIER
          </p>
        </Reveal>

        <div className="mx-auto mt-16 h-px w-16 bg-silver-500/60 sm:mt-20" />

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 text-left sm:mt-20 sm:grid-cols-2 sm:gap-12">
          {PHILOSOPHY_PARAGRAPHS.map((p, i) => (
            <Reveal key={i} delay={0.1 * i}>
              <p className="text-sm leading-relaxed text-silver-300 sm:text-base">{p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
