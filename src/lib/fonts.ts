import { Bodoni_Moda, Inter } from 'next/font/google';

export const display = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const sans = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

export const fontVars = `${display.variable} ${sans.variable}`;
