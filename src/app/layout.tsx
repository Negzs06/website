import type { Metadata, Viewport } from 'next';
import { fontVars } from '@/lib/fonts';
import { Providers } from '@/components/layout/Providers';
import { Loader } from '@/components/layout/Loader';
import { Nav } from '@/components/layout/Nav';
import { Frame } from '@/components/layout/Frame';
import { Cursor } from '@/components/ui/Cursor';
import { StageMount } from '@/components/three/StageMount';
import { SITE } from '@/data/site';
import '@/styles/globals.css';

/* Film grain, as a single inline SVG turbulence tile. Cheaper than an
   image request and it never shows a decode flash. */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='190' height='190'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const metadata: Metadata = {
  metadataBase: new URL('https://chronolith.institute'),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description:
    'CHRONOLITH encodes the human record into fused silica and emplaces it in bedded salt, 847 metres down. Rated for ten thousand years.',
  applicationName: SITE.name,
  keywords: ['deep time', 'archive', 'fused silica', '5D optical storage', 'bedded salt'],
  authors: [{ name: `${SITE.name} Institute` }],
  openGraph: {
    type: 'website',
    title: `${SITE.name} — ${SITE.tagline}`,
    description:
      'An archive engineered for the deep future. Written in glass, buried in salt, rated for ten thousand years.',
    siteName: SITE.name,
    images: [{ url: '/images/plate-core-1280.webp', width: 1280, height: 1707, alt: 'A CHRONOLITH core in section.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: 'An archive engineered for the deep future.',
    images: ['/images/plate-core-1280.webp'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars} style={{ ['--grain-src' as string]: GRAIN }}>
      <head>
        {/* Text that animates in is rendered hidden and revealed by JS.
            Without this, a visitor with scripting off would get a page
            of empty boxes. */}
        <noscript>
          <style>{`[data-reveal]{visibility:visible!important}.gl-stage{display:none}`}</style>
        </noscript>
      </head>
      <body>
        <Providers>
          <a className="u-skip" href="#main">
            Skip to content
          </a>

          <Loader />
          <StageMount />
          <Nav />
          <Frame />
          <Cursor />
          <span className="grain" aria-hidden="true" />

          <div className="page-root">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
