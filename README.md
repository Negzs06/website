# CHRONOLITH

**An archive engineered for the deep future.**

A fictional institute that encodes the human record into fused silica and
emplaces it in bedded salt, 847 metres down, rated for ten thousand years.
Scrolling the home page is a descent: ten scenes driven by a single scroll
value, with a 3D core reacting continuously behind the type.

Live routes: `/` (the descent) · `/method` · `/register` · `/contact`

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run typecheck
```

## Regenerating the imagery

Every photograph on this site is an original render. There is no stock
photography and there are no placeholders.

```bash
npm run assets                          # all plates + textures
node scripts/generate-assets.mjs --preview=520   # fast previews, no encoding
node scripts/generate-assets.mjs plate-core      # one plate
```

The foundry (`scripts/`) runs custom GLSL through a real WebGL2 context in
headless Chromium at 2× supersample, then encodes AVIF + WebP responsive sets
with sharp and writes `src/data/plates.generated.ts` — dimensions, alt text and
an inline LQIP for each plate.

The plates are lit height fields rather than gradients with noise on top:
bedding planes with fining-upward grading, hopper-stepped halite crystals, a
salt chamber under a single shaft of light, a laser-written wafer. Two details
matter if you edit them:

- **Bedding wobble is expressed in *beds*, not coordinate units.** Getting this
  wrong turns strata into television static.
- **The normal-sampling epsilon is a fixed constant, not one pixel.** A
  per-pixel epsilon makes the lighting resolution-dependent, so previews stop
  predicting the final render and fine noise shreds into fibres.

---

## Architecture

```
src/
├── app/                 routes; each page owns its own CSS module
├── components/
│   ├── layout/          frame + depth rail, nav/index, loader, footer
│   ├── motion/          smooth scroll, reveals, scene driver
│   ├── sections/        the ten scenes of the descent
│   ├── three/           persistent canvas, core, data field, plate viewer
│   └── ui/              plate, cursor, magnetic
├── data/                all copy, and the generated plate manifest
├── lib/                 choreography, per-frame state, gsap, fonts
├── shaders/             GLSL as tagged template strings
├── stores/              zustand — discrete state only
└── styles/              tokens, base, globals
```

**Next.js 15 · React 19 · TypeScript · three / R3F / drei · GSAP + ScrollTrigger
· Lenis · zustand · CSS Modules.** No UI framework and no Tailwind — the design
is bespoke enough that a utility layer would have been overhead.

### Decisions worth knowing about

**Per-frame state is not React state.** Scroll offset, pointer position and
scroll velocity live in one mutable object (`lib/story.ts`) that ScrollTrigger
and pointer listeners write to and `useFrame` reads from. Routing them through
React would re-render the tree sixty times a second.

**The whole film is one file.** `lib/choreography.ts` describes all ten beats —
camera, fov, separation, morph, bloom, exposure — as keyframes, sampled once per
frame into a reused object. Retiming a beat is one number in one place.

**Lenis is driven by `gsap.ticker`, with `lagSmoothing(0)`.** Two independent
rAF loops means ScrollTrigger reads a scroll position one frame stale, which
shows up as pinned sections shivering against the content passing them.

**Everything that eases is time-based.** A per-frame chase rate (`x += (t-x) *
0.1`) crawls on exactly the slow devices where it is most visible. The loader
counter and the depth rail both use `1 - exp(-λ·dt)`.

**Capability tiering, not breakpoints.** `stores/useExperience.ts` resolves a
tier from cores, memory and pointer type, and one budget table drives particle
count, DPR, multisampling and whether transmission is enabled at all.

### Degradation

The experience is built to survive its own features failing:

- **Reduced motion** drops the canvas entirely and the pages stand as documents.
- **Reveals are always unhidden by their own effect**, with a font-stall
  failsafe and a `<noscript>` rule — text can never be stranded invisible.
- **The loader has a hard ceiling.** If WebGL is unavailable or a decode hangs,
  the visitor still gets in.
- **The horizontal register** pins on desktop and falls back to a native
  snap scroller on touch and reduced motion, where a pin would leave cards
  clipped and unreachable.
- **The contact form** validates, focuses the first real error, and composes a
  genuine `mailto:` — there is no server, and a form that silently pretends to
  submit is worse than no form.

Verified: clean build and typecheck; no horizontal overflow and no missing alt
text at 1920 / 1366 / 768 / 390 across all four routes; skip link first in tab
order, visible focus throughout, menu operable by keyboard with `Escape` to
close.

---

CHRONOLITH is a fictional institute invented for this project. The site is a
design work; the coordinates, deposits and dates are not real.
