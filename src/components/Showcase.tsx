'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bottle } from './Bottle';
import { Reveal } from './Reveal';
import { RITUAL_STEPS } from '@/lib/data';

export function Showcase() {
  const [active, setActive] = useState(0);
  const step = RITUAL_STEPS[active];

  return (
    <section id="showcase" className="relative bg-noir-950 py-28 sm:py-36 lg:py-44">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-16">
        <div className="mb-16 max-w-xl sm:mb-24">
          <Reveal>
            <span className="text-[0.68rem] uppercase tracking-[0.4em] text-silver-400">
              The Ritual
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-ivory-100 sm:text-5xl lg:text-6xl">
              How to wear
              <br />
              <span className="italic text-silver-300">an éclipse.</span>
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-6">
          <div className="order-2 flex items-center justify-center lg:order-1 lg:col-span-5">
            <div className="relative w-[min(55vw,260px)] lg:w-[min(16vw,240px)]">
              <motion.div
                key={active}
                animate={{ opacity: [0.5, 1] }}
                transition={{ duration: 0.8 }}
              >
                <Bottle className="h-auto w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]" />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={active}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.12 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[7rem] italic text-ivory-100 sm:-right-10 sm:text-[9rem]"
                >
                  {step.index}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7">
            <div role="tablist" aria-label="The ÉCLIPSE ritual" className="divide-y divide-graphite-600/60 border-y border-graphite-600/60">
              {RITUAL_STEPS.map((s, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={s.index}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(i)}
                    className="flex w-full items-start gap-6 py-6 text-left transition-colors sm:py-8"
                  >
                    <span
                      className={`font-display text-lg transition-colors duration-500 sm:text-xl ${
                        isActive ? 'text-ivory-100' : 'text-graphite-500'
                      }`}
                    >
                      {s.index}
                    </span>
                    <div className="flex-1">
                      <h3
                        className={`font-display text-xl transition-colors duration-500 sm:text-2xl ${
                          isActive ? 'text-ivory-100 italic' : 'text-silver-400'
                        }`}
                      >
                        {s.title}
                      </h3>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden text-sm leading-relaxed text-silver-300 sm:text-base"
                          >
                            {s.body}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
