import type { Metadata, Viewport } from 'next';
import { fontVars } from '@/lib/fonts';
import { Nav } from '@/components/Nav';
import { Cursor } from '@/components/Cursor';
import { BRAND } from '@/lib/data';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://noiratelier.com'),
  title: {
    default: `${BRAND.name} — ${BRAND.product}`,
    template: `%s — ${BRAND.name}`,
  },
  description:
    'ÉCLIPSE by NOIR ATELIER: an exclusive unisex fragrance inspired by midnight, rain-soaked marble, black orchids and the atmosphere of an abandoned opera house.',
  applicationName: BRAND.name,
  keywords: ['luxury fragrance', 'niche perfume', 'eau de parfum', 'black orchid', 'unisex fragrance'],
  authors: [{ name: `${BRAND.name}` }],
  openGraph: {
    type: 'website',
    title: `${BRAND.name} — ${BRAND.product}`,
    description: 'A fragrance for the hour between acts.',
    siteName: BRAND.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.product}`,
    description: 'A fragrance for the hour between acts.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#060605',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body className="relative min-h-screen overflow-x-hidden font-sans">
        <a className="u-skip" href="#main">
          Skip to content
        </a>

        <Nav />
        <Cursor />
        <span className="grain" aria-hidden="true" />

        <div className="relative">{children}</div>
      </body>
    </html>
  );
}
