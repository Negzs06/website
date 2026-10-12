# NOIR ATELIER — ÉCLIPSE

**A fragrance for the hour between acts.**

A fictional luxury fragrance house. ÉCLIPSE is an exclusive unisex eau de
parfum inspired by midnight, rain-soaked black marble, black orchids, and
the atmosphere of an abandoned opera house. The site is a single, cinematic
landing page built as an art-directed editorial experience rather than a
conventional product page.

Built with Next.js (App Router), React, TypeScript, Tailwind CSS v4, and
Framer Motion. The flacon and every textured surface are rendered with SVG
and layered CSS gradients — there is no external imagery to break.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run typecheck
```

## Structure

- `src/app` — root layout, metadata, global styles
- `src/components` — one component per section (Hero, ProductReveal, Notes,
  Philosophy, Showcase, Details, Footer) plus shared primitives (`Bottle`,
  `Marble`, `Reveal`, `Nav`, `Cursor`)
- `src/lib/data.ts` — all copy and content data
- `src/lib/fonts.ts` — the display (Bodoni Moda) and sans (Inter) type pairing

Motion respects `prefers-reduced-motion` throughout: entrance choreography,
scroll reveals, parallax, and the film-grain overlay all degrade to static
or instant states.
