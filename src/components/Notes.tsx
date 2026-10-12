'use client';

import { Reveal } from './Reveal';
import { NOTES } from '@/lib/data';

const columns = [
  { key: 'top', data: NOTES.top, offset: 'lg:mt-0' },
  { key: 'heart', data: NOTES.heart, offset: 'lg:mt-20' },
  { key: 'base', data: NOTES.base, offset: 'lg:mt-4' },
] as const;

export function Notes() {
  return (
    <section id="notes" className="relative bg-noir-950 py-28 sm:py-36 lg:py-44">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-16">
        <div className="mb-16 max-w-xl sm:mb-24">
          <Reveal>
            <span className="text-[0.68rem] uppercase tracking-[0.4em] text-silver-400">
              Composition
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-ivory-100 sm:text-5xl lg:text-6xl">
              Three movements,
              <br />
              <span className="italic text-silver-300">one atmosphere.</span>
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
          {columns.map((col, i) => (
            <Reveal key={col.key} delay={i * 0.12} className={col.offset}>
              <div className="group relative border-t border-graphite-600/70 pt-7">
                <span className="font-display text-7xl italic text-graphite-500 transition-colors duration-500 group-hover:text-silver-500 sm:text-8xl">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display text-2xl text-ivory-100 sm:text-3xl">
                  {col.data.title}
                </h3>
                <ul className="mt-6 space-y-3">
                  {col.data.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-baseline gap-3 text-sm text-silver-300 sm:text-base"
                    >
                      <span className="h-px w-5 shrink-0 bg-silver-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
