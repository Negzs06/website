'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: 'div' | 'span';
};

/**
 * Standard scroll-triggered entrance: a soft rise with a long, editorial
 * ease. Reduced-motion visitors get an instant, undelayed fade.
 */
export function Reveal({ children, className, delay = 0, y = 28, as = 'div' }: RevealProps) {
  const reduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.01 : 1.1, delay: reduceMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const Comp = motion[as];

  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      variants={variants}
    >
      {children}
    </Comp>
  );
}
