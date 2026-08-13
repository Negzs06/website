'use client';

import { useEffect, useRef } from 'react';
import { SITE } from '@/data/site';
import s from './contact.module.css';

/**
 * Local time at the vault, ticking.
 *
 * Rendered client-side only after mount: formatting a live clock during
 * SSR guarantees a hydration mismatch, and a clock that is wrong for
 * the first second is worse than one that arrives a frame late.
 */
export function SiteClock() {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: SITE.timezone,
    });
    const tick = () => {
      if (el.current) el.current.textContent = fmt.format(new Date());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={s.clock}>
      <span ref={el} suppressHydrationWarning>
        --:--:--
      </span>
    </span>
  );
}
