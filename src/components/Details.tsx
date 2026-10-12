'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bottle } from './Bottle';
import { Marble } from './Marble';
import { Reveal } from './Reveal';
import { PRODUCT } from '@/lib/data';

export function Details() {
  const [volume, setVolume] = useState(0);
  const [added, setAdded] = useState(false);

  return (
    <section id="acquire" className="relative overflow-hidden bg-noir-900 py-28 sm:py-36 lg:py-44">
      <Marble opacity={0.5} />

      <div className="relative mx-auto grid max-w-[1600px] grid-cols-1 gap-16 px-6 sm:px-10 lg:grid-cols-12 lg:gap-10 lg:px-16">
        <div className="flex justify-center lg:col-span-5">
          <Reveal className="w-[min(60vw,280px)] lg:w-[min(20vw,300px)]">
            <Bottle className="h-auto w-full drop-shadow-[0_50px_70px_rgba(0,0,0,0.7)]" />
          </Reveal>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <Reveal>
            <span className="text-[0.68rem] uppercase tracking-[0.4em] text-silver-400">
              Acquire
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="mt-5 font-display text-4xl text-ivory-100 sm:text-5xl">
              {PRODUCT.name}
            </h2>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-silver-400">
              {PRODUCT.subtitle}
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 max-w-md text-sm leading-relaxed text-silver-300 sm:text-base">
              {PRODUCT.description}
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10">
              <p className="mb-3 text-[0.65rem] uppercase tracking-[0.25em] text-silver-500">
                Select volume
              </p>
              <div className="flex flex-wrap gap-3">
                {PRODUCT.volumes.map((v, i) => (
                  <button
                    key={v}
                    onClick={() => setVolume(i)}
                    className={`border px-4 py-2.5 text-xs uppercase tracking-[0.12em] transition-colors duration-300 sm:text-sm ${
                      volume === i
                        ? 'border-ivory-100 bg-ivory-100 text-noir-950'
                        : 'border-graphite-500 text-silver-300 hover:border-silver-400'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-10 flex flex-wrap items-center gap-8 border-t border-graphite-600/60 pt-8">
              <span className="font-display text-3xl text-ivory-100">{PRODUCT.price}</span>

              <button
                onClick={() => setAdded(true)}
                className="group relative overflow-hidden border border-ivory-100 px-8 py-3.5 text-xs uppercase tracking-[0.2em] text-ivory-100 sm:text-sm"
              >
                <span className="absolute inset-0 origin-left scale-x-0 bg-ivory-100 transition-transform duration-500 ease-out group-hover:scale-x-100" />
                <span className="relative transition-colors duration-500 group-hover:text-noir-950">
                  {added ? 'Added to Atelier Bag' : 'Add to Atelier Bag'}
                </span>
              </button>

              {added && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-silver-400"
                >
                  A reservation confirmation will follow by hand.
                </motion.span>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
