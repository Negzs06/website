'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Magnetic } from '@/components/ui/Magnetic';
import { RevealText } from '@/components/motion/Reveal';
import { gsap, useGsap } from '@/lib/gsap';
import { useExperience } from '@/stores/useExperience';
import { SITE, NAV, STATEMENTS } from '@/data/site';
import s from './Footer.module.css';

/**
 * The close.
 *
 * A page that ends in a row of grey links tells the visitor the
 * interesting part is over. This one ends with the largest type on the
 * site and the only warm light in the palette, so leaving feels like
 * arriving somewhere rather than running out of page.
 *
 * The wordmark is SVG text with a viewBox, which makes it scale to the
 * exact width of the viewport at every size — the one reliable way to
 * set type edge-to-edge without a resize listener.
 */
export function Footer() {
  const root = useRef<HTMLElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const reduced = useExperience((st) => st.reduced);
  useGsap();

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: SITE.timezone,
    });
    const tick = () => {
      if (clock.current) clock.current.textContent = `${fmt.format(new Date())} MT`;
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-foot-mark]', {
        yPercent: 42,
        autoAlpha: 0,
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-foot-mark]', start: 'top 96%', once: true },
      });
      gsap.from('[data-foot-col]', {
        y: 22,
        autoAlpha: 0,
        duration: 1,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: `.${s.cols}`, start: 'top 90%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <footer ref={root} className={`${s.footer} zone-deep`} aria-labelledby="footer-title">
      <div className={s.glow} aria-hidden="true" />

      <div className={s.inner}>
        <div className={s.call}>
          <span className="u-meta">09 — Transmit / −{SITE.vaultDepth} m</span>

          <RevealText as="h2" className={s.callTitle} stagger={0.09}>
            <span id="footer-title">
              {STATEMENTS.closing[0]}{' '}
              <span className={s.callItalic}>{STATEMENTS.closing[1]}</span>
              {STATEMENTS.closing[2]}
            </span>
          </RevealText>

          <div className={s.callRow}>
            <Magnetic strength={14} field={110}>
              <Link href="/contact" className={s.cta} data-cursor="link">
                <span>Propose a deposit</span>
                <span className={s.ctaArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            </Magnetic>
            <a
              className={`${s.link} u-meta`}
              href={`mailto:${SITE.contact.general}`}
              data-cursor="link"
            >
              {SITE.contact.general}
            </a>
          </div>
        </div>

        <div className={s.cols}>
          <nav className={`${s.col} u-meta`} data-foot-col aria-label="Footer">
            <span className={s.colHead}>Index</span>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={s.link} data-cursor="link">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className={`${s.col} u-meta`} data-foot-col>
            <span className={s.colHead}>Contact</span>
            <a className={s.link} href={`mailto:${SITE.contact.deposit}`} data-cursor="link">
              Deposits
            </a>
            <a className={s.link} href={`mailto:${SITE.contact.press}`} data-cursor="link">
              Press
            </a>
            <a className={s.link} href={`tel:${SITE.contact.phone.replace(/\s/g, '')}`} data-cursor="link">
              {SITE.contact.phone}
            </a>
          </div>

          <address className={`${s.col} u-meta`} data-foot-col style={{ fontStyle: 'normal' }}>
            <span className={s.colHead}>Site</span>
            {SITE.address.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>

          <div className={`${s.col} u-meta`} data-foot-col>
            <span className={s.colHead}>Status</span>
            <span className={s.pulse}>
              <span className={s.pulseDot} aria-hidden="true" />
              Accepting deposits
            </span>
            <span>
              {SITE.coords.lat} {SITE.coords.lon}
            </span>
            <span ref={clock}>00:00 MT</span>
          </div>
        </div>

        <div className={s.wordmarkWrap}>
          <svg
            className={s.wordmark}
            viewBox="0 0 1000 132"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={SITE.name}
            data-foot-mark
          >
            <text x="0" y="106" fontSize="132" textLength="1000" lengthAdjust="spacingAndGlyphs">
              {SITE.name}
            </text>
          </svg>
        </div>

        <div className={`${s.baseline} u-meta`}>
          <span>
            © {SITE.founded}–{SITE.founded + SITE.mandate} {SITE.name} Institute
          </span>
          <span>Mandate expires {(SITE.founded + SITE.mandate).toLocaleString('en-US')} CE</span>
          <span>Fictional institute — a design work</span>
        </div>
      </div>
    </footer>
  );
}
