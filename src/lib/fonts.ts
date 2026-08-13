import { Instrument_Serif, Archivo, JetBrains_Mono } from 'next/font/google';

/**
 * Three voices, and no more.
 *
 * Instrument Serif carries the statements — high contrast, slightly
 * archaic, the voice of something meant to outlast us. Archivo does the
 * structural work at tight tracking. JetBrains Mono handles every number
 * on the site: depths, epochs, coordinates, the clock.
 */

export const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument',
  preload: true,
});

export const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-archivo',
  preload: true,
});

export const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono-jb',
  preload: false,
});

export const fontVars = `${instrument.variable} ${archivo.variable} ${jetbrains.variable}`;
