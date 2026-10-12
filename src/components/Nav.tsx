'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BRAND, NAV_LINKS } from '@/lib/data';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ${
        scrolled ? 'bg-noir-950/80 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
        <a
          href="#top"
          className="font-display text-sm tracking-[0.32em] text-ivory-100 sm:text-base"
        >
          {BRAND.name}
        </a>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative text-[0.72rem] uppercase tracking-[0.22em] text-silver-300 transition-colors hover:text-ivory-100"
            >
              {link.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-ivory-100 transition-all duration-500 ease-out group-hover:w-full" />
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0, y: open ? 6 : 0 }}
            className="block h-px w-6 bg-ivory-100"
          />
          <motion.span
            animate={{ opacity: open ? 0 : 1 }}
            className="block h-px w-6 bg-ivory-100"
          />
          <motion.span
            animate={{ rotate: open ? -45 : 0, y: open ? -6 : 0 }}
            className="block h-px w-6 bg-ivory-100"
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-graphite-600/60 bg-noir-950 md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-sm uppercase tracking-[0.2em] text-silver-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
