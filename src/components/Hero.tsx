'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Bottle } from './Bottle';
import { Marble } from './Marble';
import { BRAND } from '@/lib/data';

const headline = 'ÉCLIPSE'.split('');

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="top" className="relative flex min-h-[100svh] items-end overflow-hidden bg-noir-950 pb-16 pt-32 sm:pb-24">
      <Marble />

      {/* Vignette + spotlight pooling behind the flacon */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(42% 55% at 78% 62%, rgba(207,201,188,0.14), transparent 70%), radial-gradient(100% 60% at 50% 100%, rgba(0,0,0,0.65), transparent)',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1600px] grid-cols-1 items-end gap-10 px-6 sm:px-10 lg:grid-cols-12 lg:gap-6 lg:px-16">
        <div className="lg:col-span-7 xl:col-span-6">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.9, delay: reduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 text-[0.68rem] uppercase tracking-[0.4em] text-silver-400 sm:mb-6"
          >
            {BRAND.name} &middot; Eau de Parfum
          </motion.p>

          <h1 className="flex flex-wrap font-display text-[16vw] italic leading-[0.88] text-ivory-100 sm:text-[11vw] lg:text-[7.4vw]">
            {headline.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: '0.6em' }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 1,
                  delay: reduceMotion ? 0 : 0.4 + i * 0.055,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.9, delay: reduceMotion ? 0 : 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-sm text-sm leading-relaxed text-silver-300 sm:mt-8 sm:max-w-md sm:text-base"
          >
            Midnight. Rain on black marble. The last light in an abandoned opera
            house. A scent for the hour between acts.
          </motion.p>
        </div>

        <div className="relative hidden items-end justify-center lg:col-span-5 lg:flex xl:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 1.4, delay: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-[clamp(180px,16vw,280px)]"
          >
            <Bottle className="h-auto w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]" />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 1, delay: reduceMotion ? 0 : 2 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
      >
        <span className="text-[0.62rem] uppercase tracking-[0.3em] text-silver-500">Scroll</span>
        <motion.span
          className="h-10 w-px bg-silver-500"
          animate={reduceMotion ? undefined : { scaleY: [0.3, 1, 0.3] }}
          style={{ transformOrigin: 'top' }}
          transition={reduceMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
