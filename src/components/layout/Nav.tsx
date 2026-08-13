'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { gsap, useGsap } from '@/lib/gsap';
import { useExperience } from '@/stores/useExperience';
import { setScrollLocked } from '@/components/motion/SmoothScroll';
import { Magnetic } from '@/components/ui/Magnetic';
import { SITE, NAV } from '@/data/site';
import { plate } from '@/data/plates.generated';
import { story } from '@/lib/story';
import s from './Nav.module.css';

/** A plate stands behind each index entry, revealed on hover. */
const PREVIEWS: Record<string, string> = {
  '/': 'plate-shaft',
  '/method': 'plate-inscribe',
  '/register': 'plate-halite',
  '/contact': 'plate-horizon',
};

export function Nav() {
  const pathname = usePathname();
  const open = useExperience((st) => st.menuOpen);
  const toggle = useExperience((st) => st.toggleMenu);
  const entered = useExperience((st) => st.entered);
  const reduced = useExperience((st) => st.reduced);

  const panel = useRef<HTMLDivElement>(null);
  const items = useRef<HTMLAnchorElement[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  useGsap();

  // Close on route change and on Escape.
  useEffect(() => {
    toggle(false);
  }, [pathname, toggle]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useExperience.getState().menuOpen) toggle(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  // Open / close choreography.
  useEffect(() => {
    const el = panel.current;
    if (!el) return;

    setScrollLocked(open);
    // The WebGL scene parks while the index is open — there is nothing
    // to see behind an opaque panel, and it hands the GPU back.
    story.suspended = open;

    if (reduced) {
      gsap.set(el, {
        visibility: open ? 'visible' : 'hidden',
        clipPath: open ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
      });
      gsap.set(items.current, { yPercent: 0 });
      return;
    }

    const tl = gsap.timeline();
    if (open) {
      tl.set(el, { visibility: 'visible' })
        .set(items.current, { yPercent: 118 })
        .to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'power4.inOut' }, 0)
        .to(
          items.current,
          { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.075 },
          0.34,
        )
        .from(
          '[data-menu-fade]',
          { autoAlpha: 0, y: 14, duration: 0.8, ease: 'expo.out', stagger: 0.06 },
          0.5,
        );
    } else {
      tl.to(items.current, { yPercent: -118, duration: 0.55, ease: 'power3.in', stagger: 0.03 }, 0)
        .to('[data-menu-fade]', { autoAlpha: 0, duration: 0.3 }, 0)
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'power4.inOut' }, 0.2)
        .set(el, { visibility: 'hidden' });
    }
    return () => {
      tl.kill();
    };
  }, [open, reduced]);

  const activePreview = hovered ?? pathname;

  return (
    <>
      <header className={s.bar} data-open={open}>
        <Magnetic strength={9}>
          <Link
            href="/"
            className={s.mark}
            data-cursor="link"
            aria-label={`${SITE.name} — home`}
            onClick={() => toggle(false)}
          >
            <span className={s.markGlyph} aria-hidden="true" />
            <span>{SITE.name}</span>
            <span className={s.markSub}>Vault 04</span>
          </Link>
        </Magnetic>

        <Magnetic strength={11}>
          <button
            type="button"
            className={s.toggle}
            data-cursor="link"
            aria-expanded={open}
            aria-controls="index-panel"
            onClick={() => toggle()}
          >
            <span className={s.toggleLabel} aria-hidden="true">
              <span>{open ? 'Close' : 'Index'}</span>
              <span>{open ? 'Close' : 'Index'}</span>
            </span>
            <span className="u-sr">{open ? 'Close index' : 'Open index'}</span>
            <span className={s.burger} aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </Magnetic>
      </header>

      <nav
        id="index-panel"
        ref={panel}
        className={s.panel}
        aria-label="Index"
        aria-hidden={!open}
        {...(!open ? { inert: '' as unknown as boolean } : {})}
      >
        <div className={s.preview} aria-hidden="true">
          {Object.entries(PREVIEWS).map(([href, name]) => {
            const meta = plate(name as never);
            return (
              <div
                key={href}
                className={s.previewItem}
                data-active={activePreview === href}
                style={{ backgroundImage: `url(${meta.lqip})`, backgroundSize: 'cover' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/${name}-1280.webp`} alt="" loading="lazy" decoding="async" />
              </div>
            );
          })}
          <div className={s.previewVeil} />
        </div>

        <div className={`${s.panelHead} u-meta`} data-menu-fade>
          <span>Index — four movements</span>
          <span>{SITE.descriptor}</span>
        </div>

        <ul className={s.list} onMouseLeave={() => setHovered(null)}>
          {NAV.map((item, i) => {
            const current = pathname === item.href;
            return (
              <li key={item.href} className={s.itemMask}>
                <Link
                  href={item.href}
                  className={s.item}
                  data-cursor="link"
                  aria-current={current ? 'page' : undefined}
                  onMouseEnter={() => setHovered(item.href)}
                  onFocus={() => setHovered(item.href)}
                  onClick={() => toggle(false)}
                  ref={(el) => {
                    if (el) items.current[i] = el;
                  }}
                >
                  <span className={s.itemIndex}>{item.index}</span>
                  <span className={s.itemWord}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={s.panelFoot}>
          <div className={`${s.footCol} u-meta`} data-menu-fade>
            <span>Deposit enquiries</span>
            <a
              className={s.footLink}
              href={`mailto:${SITE.contact.deposit}`}
              data-cursor="link"
            >
              {SITE.contact.deposit}
            </a>
          </div>
          <div className={`${s.footCol} ${s.footColHide} u-meta`} data-menu-fade>
            <span>Site</span>
            <span>
              {SITE.coords.lat} {SITE.coords.lon}
            </span>
          </div>
          <div className={`${s.footCol} u-meta`} data-menu-fade>
            <span>Mandate</span>
            <span>{SITE.mandate.toLocaleString('en-US')} years — {SITE.vaultDepth} m</span>
          </div>
        </div>
      </nav>
      {!entered && null}
    </>
  );
}
