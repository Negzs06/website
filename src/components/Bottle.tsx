'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * ÉCLIPSE flacon, rendered entirely in SVG/CSS: a faceted smoked-glass
 * silhouette with a brushed-silver collar and a liquid fill that breathes.
 * Avoids any dependency on external product photography.
 */
export function Bottle({ className = '' }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 220 440"
      className={className}
      role="img"
      aria-label="The ÉCLIPSE flacon: a faceted black glass bottle with a brushed-silver collar."
    >
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1b1a18" />
          <stop offset="45%" stopColor="#0a0908" />
          <stop offset="100%" stopColor="#020202" />
        </linearGradient>
        <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a1230" />
          <stop offset="100%" stopColor="#0d0509" />
        </linearGradient>
        <linearGradient id="collar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5b584f" />
          <stop offset="50%" stopColor="#d8d2c2" />
          <stop offset="100%" stopColor="#4a4740" />
        </linearGradient>
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="bottleClip">
          <path d="M70 110 L150 110 L166 150 L170 400 Q170 418 150 418 L70 418 Q50 418 50 400 L54 150 Z" />
        </clipPath>
      </defs>

      {/* Stopper */}
      <rect x="92" y="18" width="36" height="34" rx="3" fill="url(#collar)" />
      <rect x="88" y="48" width="44" height="14" rx="2" fill="#2a2824" />

      {/* Neck */}
      <path d="M96 62 L124 62 L128 98 L92 98 Z" fill="url(#glass)" />

      {/* Collar band */}
      <rect x="86" y="98" width="48" height="12" fill="url(#collar)" />

      {/* Body */}
      <path
        d="M70 110 L150 110 L166 150 L170 400 Q170 418 150 418 L70 418 Q50 418 50 400 L54 150 Z"
        fill="url(#glass)"
        stroke="#2d2a25"
        strokeWidth="1"
      />

      {/* Liquid, clipped to the body */}
      <g clipPath="url(#bottleClip)">
        <motion.rect
          x="40"
          width="150"
          height="260"
          fill="url(#liquid)"
          initial={{ y: 420 }}
          animate={{ y: 190 }}
          transition={{ duration: reduceMotion ? 0 : 1.8, delay: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.rect
          x="40"
          y="186"
          width="150"
          height="6"
          fill="#4a1a3c"
          opacity={0.6}
          animate={reduceMotion ? undefined : { y: [186, 190, 186] }}
          transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </g>

      {/* Facet sheen sweep */}
      <motion.rect
        x="50"
        y="110"
        width="120"
        height="308"
        fill="url(#sheen)"
        initial={{ x: -140 }}
        animate={reduceMotion ? { x: -20 } : { x: [-140, 160] }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 6, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }
        }
      />

      {/* Vertical facet lines */}
      <line x1="96" y1="112" x2="92" y2="416" stroke="#000" strokeOpacity="0.5" strokeWidth="1" />
      <line x1="124" y1="112" x2="128" y2="416" stroke="#fff" strokeOpacity="0.06" strokeWidth="1" />

      {/* Label */}
      <text
        x="110"
        y="300"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="13"
        letterSpacing="3"
        fill="#cfc9bc"
        opacity="0.9"
      >
        ÉCLIPSE
      </text>
      <line x1="90" y1="312" x2="130" y2="312" stroke="#8f887a" strokeWidth="0.5" />
    </svg>
  );
}
