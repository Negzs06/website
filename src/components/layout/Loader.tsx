'use client';

import { useEffect, useRef } from 'react';
import { gsap, useGsap } from '@/lib/gsap';
import { useExperience } from '@/stores/useExperience';
import { setScrollLocked } from '@/components/motion/SmoothScroll';
import { SITE } from '@/data/site';
import s from './Loader.module.css';

const WORD = 'CHRONOLITH';

/** Phase captions, keyed to the progress at which each takes over. */
const PHASES: [number, string][] = [
  [0.0, 'Establishing datum'],
  [0.22, 'Mounting core 04'],
  [0.48, 'Reading strata'],
  [0.74, 'Equalising pressure'],
  [0.93, 'Opening vault'],
];

/** Plates that must be decoded before the descent begins. */
const CRITICAL = ['plate-core-1280.webp', 'plate-surface-1280.webp'];

/**
 * The intro.
 *
 * The counter tracks real work — fonts resolving, the hero plates
 * decoding, the WebGL scene compiling — rather than running a fixed
 * animation and hoping. It is allowed to *appear* to move smoothly
 * (the displayed number chases the true value) but it never reaches
 * 100 before the page is genuinely ready.
 */
export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const countEl = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const phase = useRef<HTMLSpanElement>(null);
  const aura = useRef<HTMLDivElement>(null);
  const chars = useRef<HTMLSpanElement[]>([]);

  const entered = useExperience((st) => st.entered);
  const enter = useExperience((st) => st.enter);
  const reduced = useExperience((st) => st.reduced);
  useGsap();

  // ---- real progress accounting ----
  useEffect(() => {
    let done = false;
    const weights = { fonts: 0.18, images: 0.42, scene: 0.4 };
    const state = { fonts: 0, images: 0, scene: 0 };

    const push = () => {
      const total =
        state.fonts * weights.fonts + state.images * weights.images + state.scene * weights.scene;
      useExperience.getState().setProgress(total);
    };

    // fonts
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      state.fonts = 1;
      push();
    });

    // critical plates
    let decoded = 0;
    CRITICAL.forEach((file) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        decoded += 1;
        state.images = decoded / CRITICAL.length;
        push();
      };
      img.src = `/images/${file}`;
    });

    // the WebGL stage announces itself once it has rendered a frame
    const onScene = (e: Event) => {
      state.scene = (e as CustomEvent<number>).detail ?? 1;
      push();
    };
    window.addEventListener('chronolith:scene', onScene);

    // A hard ceiling on the wait. If WebGL is unavailable or a decode
    // hangs, the visitor still gets in — the site works without the
    // canvas, and an intro that can trap someone is a broken intro.
    const failsafe = setTimeout(() => {
      if (done) return;
      state.scene = Math.max(state.scene, 1);
      state.images = 1;
      state.fonts = 1;
      push();
    }, 6500);

    return () => {
      done = true;
      clearTimeout(failsafe);
      window.removeEventListener('chronolith:scene', onScene);
    };
  }, []);

  // ---- intro animation + counter ----
  useEffect(() => {
    setScrollLocked(true);

    const ctx = gsap.context(() => {
      if (!reduced) {
        gsap.set(chars.current, { yPercent: 115 });
        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .to(aura.current, { opacity: 1, scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
          .to(chars.current, { yPercent: 0, duration: 1.25, stagger: 0.045 }, 0.15);
      }
    }, root);

    let shown = 0;
    let raf = 0;
    let phaseIdx = -1;
    let released = false;
    let last = performance.now();

    const frame = (now: number) => {
      // Time-based, not frame-based. A per-frame chase rate makes the
      // counter crawl on exactly the slow devices where the loader is
      // already the longest part of the visit.
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const target = useExperience.getState().progress;
      // Chase, so the number always feels like it is working rather
      // than jumping between the three checkpoints it actually has.
      shown += (target - shown) * (1 - Math.exp(-3.4 * dt));
      if (target >= 0.999 && target - shown < 0.004) shown = target;

      const pct = Math.min(100, Math.round(shown * 100));
      if (countEl.current) countEl.current.textContent = String(pct).padStart(3, '0');
      if (fill.current) fill.current.style.transform = `scaleX(${shown})`;

      let idx = 0;
      for (let i = 0; i < PHASES.length; i++) if (shown >= PHASES[i][0]) idx = i;
      if (idx !== phaseIdx && phase.current) {
        phaseIdx = idx;
        const el = phase.current;
        if (reduced) {
          el.textContent = PHASES[idx][1];
        } else {
          gsap.to(el, {
            yPercent: -100,
            duration: 0.34,
            ease: 'power2.in',
            onComplete: () => {
              el.textContent = PHASES[idx][1];
              gsap.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'expo.out' });
            },
          });
        }
      }

      if (!released && shown > 0.995) {
        released = true;
        exit();
      }
      raf = requestAnimationFrame(frame);
    };

    const exit = () => {
      const tl = gsap.timeline({
        delay: 0.35,
        onComplete: () => {
          enter();
          setScrollLocked(false);
        },
      });

      if (reduced) {
        tl.to(root.current, { autoAlpha: 0, duration: 0.3 });
        return;
      }

      tl.to(chars.current, { yPercent: -115, duration: 0.85, stagger: 0.028, ease: 'expo.in' }, 0)
        .to('[data-loader-fade]', { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0.1)
        .to(aura.current, { opacity: 0, scale: 1.35, duration: 1.1, ease: 'power2.inOut' }, 0.2)
        // The panel lifts away rather than fading: the hero is revealed
        // from the bottom edge upward, which reads as the shaft opening.
        .to(
          root.current,
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            duration: 1.25,
            ease: 'power4.inOut',
            onComplete: () => {
              if (root.current) root.current.style.display = 'none';
            },
          },
          0.55,
        );
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
      setScrollLocked(false);
    };
  }, [enter, reduced]);

  if (entered) return null;

  return (
    <div
      ref={root}
      className={s.root}
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      role="status"
      aria-live="polite"
      aria-label="Loading the archive"
    >
      <div ref={aura} className={s.aura} aria-hidden="true" />

      <div className={s.top} data-loader-fade>
        <div className={`${s.topCol} u-meta`}>
          <span>{SITE.name} Institute</span>
          <span>Vault 04 — Permian Basin</span>
        </div>
        <div className={`${s.topCol} u-meta`}>
          <span>Est. {SITE.founded}</span>
          <span>
            {SITE.coords.lat} {SITE.coords.lon}
          </span>
        </div>
      </div>

      <div className={s.mid}>
        <div className={s.wordmark} role="img" aria-label={SITE.name}>
          {WORD.split('').map((c, i) => (
            <span
              key={i}
              className={s.char}
              aria-hidden="true"
              ref={(el) => {
                if (el) chars.current[i] = el;
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className={s.bottom}>
        <div className={`${s.status} u-meta`} data-loader-fade>
          <span className={s.phase}>
            <span ref={phase} className={s.phaseInner}>
              Establishing datum
            </span>
          </span>
          <span>Mandate {SITE.mandate.toLocaleString('en-US')} years</span>
        </div>
        <div className={s.bar} data-loader-fade>
          <span ref={fill} className={s.fill} />
        </div>
        <div className={s.count}>
          <span ref={countEl}>000</span>
          <span className={s.countUnit} data-loader-fade>
            pct
          </span>
        </div>
      </div>
    </div>
  );
}
