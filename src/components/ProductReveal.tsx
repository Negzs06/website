'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Bottle } from './Bottle';
import { Reveal } from './Reveal';

export function ProductReveal() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const bottleY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [90, -90]);
  const bgY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-40, 40]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduceMotion ? [1, 1, 1] : [0.92, 1, 0.96]);

  return (
    <section id="reveal" ref={ref} className="relative overflow-hidden bg-noir-900 py-28 sm:py-36 lg:py-48">
      <motion.div
        aria-hidden
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 opacity-60"
          style={{
            background:
              'radial-gradient(38% 45% at 50% 48%, rgba(207,201,188,0.1), transparent 70%)',
          }}
        />
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" viewBox="0 0 800 800" fill="none">
          <path
            d="M400 120C340 220 260 260 220 360C180 460 260 560 400 680C540 560 620 460 580 360C540 260 460 220 400 120Z"
            stroke="#cfc9bc"
            strokeWidth="1"
          />
          <path
            d="M400 220C370 280 320 300 300 360C280 420 330 500 400 600C470 500 520 420 500 360C480 300 430 280 400 220Z"
            stroke="#cfc9bc"
            strokeWidth="1"
          />
        </svg>
      </motion.div>

      <div className="relative mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-16 px-6 sm:px-10 lg:grid-cols-12 lg:gap-6 lg:px-16">
        <div className="order-2 flex justify-center lg:order-1 lg:col-span-5">
          <motion.div style={{ y: bottleY, scale }} className="w-[min(70vw,320px)] lg:w-[min(22vw,340px)]">
            <Bottle className="h-auto w-full drop-shadow-[0_50px_70px_rgba(0,0,0,0.7)]" />
          </motion.div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-7 lg:col-start-6">
          <Reveal>
            <span className="text-[0.68rem] uppercase tracking-[0.4em] text-silver-400">
              The Flacon
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-ivory-100 sm:text-5xl lg:text-6xl">
              Cast in smoked glass,
              <br />
              <span className="italic text-silver-300">finished by hand.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-lg text-sm leading-relaxed text-silver-300 sm:text-base">
              Each flacon is blown from a single gather of smoked glass, faceted to
              catch light the way wet marble does beneath a streetlamp. The collar
              is brushed silver, cold to the touch, numbered by hand on the base.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-10 flex gap-10 border-t border-graphite-600/60 pt-6">
              <div>
                <p className="font-display text-2xl text-ivory-100">No. 0847</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.25em] text-silver-500">
                  of 2,000
                </p>
              </div>
              <div>
                <p className="font-display text-2xl text-ivory-100">100ml</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.25em] text-silver-500">
                  Atelier cast
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
