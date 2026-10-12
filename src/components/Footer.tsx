'use client';

import { useState } from 'react';
import { BRAND, FOOTER_LINKS } from '@/lib/data';

const columns = [
  { title: 'Maison', links: FOOTER_LINKS.maison, position: 'lg:col-span-2 lg:col-start-7' },
  { title: 'Collection', links: FOOTER_LINKS.collection, position: 'lg:col-span-2 lg:col-start-9' },
  { title: 'Client Care', links: FOOTER_LINKS.client, position: 'lg:col-span-2 lg:col-start-11' },
] as const;

export function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer className="relative border-t border-graphite-600/60 bg-noir-950 pt-20 sm:pt-28">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-14 pb-16 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <p className="font-display text-2xl tracking-[0.1em] text-ivory-100 sm:text-3xl">
              {BRAND.name}
            </p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-silver-400">
              {BRAND.tagline}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="mt-8 max-w-sm"
            >
              <label htmlFor="footer-email" className="text-[0.65rem] uppercase tracking-[0.25em] text-silver-500">
                Join the correspondence
              </label>
              <div className="mt-3 flex items-end gap-4 border-b border-graphite-500 pb-2">
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-transparent text-sm text-ivory-100 placeholder:text-graphite-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 text-xs uppercase tracking-[0.2em] text-silver-300 transition-colors hover:text-ivory-100"
                >
                  {submitted ? 'Sent' : 'Submit'}
                </button>
              </div>
            </form>
          </div>

          {columns.map((col) => (
            <div key={col.title} className={col.position}>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-silver-500">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-silver-300 transition-colors hover:text-ivory-100">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-graphite-600/60 py-8 text-[0.65rem] uppercase tracking-[0.15em] text-silver-500 sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p>Crafted in Paris &middot; Composed in the dark</p>
        </div>
      </div>
    </footer>
  );
}
