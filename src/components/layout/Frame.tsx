'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SITE, CHAPTERS } from '@/data/site';
import { useExperience } from '@/stores/useExperience';
import s from './Frame.module.css';

const TICKS = 11;

/**
 * The plate frame: hairline rules inset from the viewport, corner
 * registration ticks, live metadata, and the depth rail.
 *
 * The rail is the device that makes the whole site cohere. It converts
 * scroll position into metres below datum, so moving down the page is
 * legibly *descending* rather than paging. Everything in it is driven
 * from one rAF loop writing transforms and textContent — no React
 * state, because this updates every frame.
 */
export function Frame() {
  const pathname = usePathname();
  const head = useRef<HTMLDivElement>(null);
  const depth = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const chapterEl = useRef<HTMLSpanElement>(null);
  const setChapter = useExperience((st) => st.setChapter);

  // ---- depth rail + chapter readout ----
  useEffect(() => {
    let raf = 0;
    let lastChapter = -1;
    let shown = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      // Ease the readout toward the true value so the digits settle
      // instead of strobing on every wheel tick. Time-based, so the
      // depth never lags the section on screen on a slow device.
      shown += (p - shown) * (1 - Math.exp(-7 * dt));

      if (head.current) {
        head.current.style.transform = `translateY(${(shown * 100).toFixed(3)}%)`;
      }
      if (depth.current) {
        const m = shown * SITE.vaultDepth;
        depth.current.textContent = `−${m.toFixed(1).padStart(5, '0')} m`;
      }

      // Chapter is derived from true progress, not the eased value, so
      // the label never lags behind the section actually on screen.
      const idx = Math.min(CHAPTERS.length - 1, Math.floor(p * CHAPTERS.length));
      if (idx !== lastChapter) {
        lastChapter = idx;
        setChapter(idx);
        if (chapterEl.current && pathname === '/') {
          const c = CHAPTERS[idx];
          chapterEl.current.textContent = `${c.index} — ${c.label}`;
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [pathname, setChapter]);

  // ---- site clock ----
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: SITE.timezone,
    });
    const tick = () => {
      if (clock.current) clock.current.textContent = fmt.format(new Date());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const label =
    pathname === '/'
      ? '00 — Surface'
      : `${SITE.name} — ${pathname.replace('/', '').toUpperCase()}`;

  return (
    <div className={s.frame} aria-hidden="true">
      <span className={`${s.rule} ${s.ruleTop}`} />
      <span className={`${s.rule} ${s.ruleBottom}`} />
      <span className={`${s.rule} ${s.ruleLeft}`} />
      <span className={`${s.rule} ${s.ruleRight}`} />

      <span className={`${s.tick} ${s.tickTL}`} />
      <span className={`${s.tick} ${s.tickTR}`} />
      <span className={`${s.tick} ${s.tickBL}`} />
      <span className={`${s.tick} ${s.tickBR}`} />

      <div className={s.rail}>
        <div className={s.railTicks}>
          {Array.from({ length: TICKS }, (_, i) => (
            <span
              key={i}
              className={s.railTick}
              style={{
                top: `${(i / (TICKS - 1)) * 100}%`,
                width: i % 5 === 0 ? '15px' : '7px',
              }}
            />
          ))}
          <span ref={head} className={s.railHead} />
        </div>
        <div className={s.railRead}>
          <span ref={depth} className={s.railDepth}>
            −000.0 m
          </span>
        </div>
      </div>

      <div className={`${s.meta} ${s.metaBL}`}>
        <span>{SITE.coords.lat}</span>
        <span className={s.sep}>/</span>
        <span>{SITE.coords.lon}</span>
        <span className={s.sep}>/</span>
        <span ref={clock}>00:00:00</span>
      </div>

      <div className={`${s.meta} ${s.metaBR}`}>
        <span ref={chapterEl}>{label}</span>
      </div>
    </div>
  );
}
