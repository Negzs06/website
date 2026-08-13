'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { plate as getPlate, type PlateName } from '@/data/plates.generated';
import { useExperience } from '@/stores/useExperience';
import { gsap, ScrollTrigger, useGsap } from '@/lib/gsap';
import s from './Plate.module.css';

type Props = {
  name: PlateName;
  /** Overrides the generated alt text where the context needs different words. */
  alt?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Clip-path wipe as the plate enters. */
  reveal?: boolean;
  /** Vertical drift, as a fraction of the plate height. 0 disables. */
  parallax?: number;
  /** Direction of the reveal wipe. */
  from?: 'bottom' | 'top' | 'left' | 'right';
  caption?: string;
  /** Multiply overlay, for plates that sit under text. */
  tint?: string;
  cursor?: string;
};

const CLIP = {
  bottom: 'inset(100% 0% 0% 0%)',
  top: 'inset(0% 0% 100% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
};

/**
 * Every image on the site goes through here.
 *
 * It renders AVIF with a WebP fallback from the generated manifest,
 * shows the inline LQIP underneath until the real file decodes, and —
 * because a plate dropping in at full opacity is the single clearest
 * tell of an unconsidered site — wipes in behind a clip-path and drifts
 * against the scroll.
 */
export function Plate({
  name,
  alt,
  sizes = '100vw',
  priority = false,
  className,
  style,
  reveal = true,
  parallax = 0,
  from = 'bottom',
  caption,
  tint,
  cursor,
}: Props) {
  const meta = getPlate(name);
  const [loaded, setLoaded] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const shift = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const reduced = useExperience((st) => st.reduced);

  useGsap();

  // An image restored from cache can finish before React attaches onLoad.
  useEffect(() => {
    if (img.current?.complete) setLoaded(true);
  }, []);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    if (reduced) return;

    const ctx = gsap.context(() => {
      if (reveal) {
        gsap.fromTo(
          el,
          { clipPath: CLIP[from] },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.5,
            ease: 'power4.inOut',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          },
        );
        // The picture counter-scales during the wipe so the subject does
        // not appear to slide — only the frame opens.
        gsap.fromTo(
          shift.current,
          { scale: 1.16 },
          {
            scale: 1,
            duration: 1.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          },
        );
      }

      if (parallax) {
        gsap.fromTo(
          shift.current,
          { yPercent: -parallax * 100 },
          {
            yPercent: parallax * 100,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }
    }, el);

    return () => ctx.revert();
  }, [reveal, parallax, from, reduced]);

  const srcFor = (ext: 'avif' | 'webp') =>
    meta.sizes.map((w) => `/images/${name}-${w}.${ext} ${w}w`).join(', ');
  const fallback = `/images/${name}-${meta.sizes[meta.sizes.length - 1]}.webp`;

  return (
    <div
      ref={frame}
      className={`${s.frame} ${className ?? ''}`}
      style={{ backgroundImage: `url(${meta.lqip})`, ...style }}
      data-cursor={cursor}
    >
      <div ref={shift} className={s.shift}>
        <picture>
          <source type="image/avif" srcSet={srcFor('avif')} sizes={sizes} />
          <source type="image/webp" srcSet={srcFor('webp')} sizes={sizes} />
          <img
            ref={img}
            className={s.img}
            src={fallback}
            alt={alt ?? meta.alt}
            width={meta.width}
            height={meta.height}
            loading={priority ? 'eager' : 'lazy'}
            // eslint-disable-next-line @next/next/no-img-element
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            data-loaded={loaded}
            onLoad={() => setLoaded(true)}
          />
        </picture>
      </div>
      {tint && <div className={s.tone} style={{ background: tint }} />}
      {caption && <figcaption className={`${s.caption} u-meta`}>{caption}</figcaption>}
    </div>
  );
}
