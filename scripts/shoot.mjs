/* Screenshot harness for visual QA.
   node scripts/shoot.mjs <path> <outPrefix> [w] [h] [scrollFractions...] */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const [, , route = '/', prefix = 'shot', w = '1600', h = '1000', ...fracs] = process.argv;
const OUT = process.env.OUT_DIR || '/tmp/shots';
const positions = fracs.length ? fracs.map(Number) : [0];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 1,
  // REDUCED=1 skips WebGL and all scroll animation, which is the fast
  // path for checking layout. Leave it off to inspect the real scene.
  reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference',
  hasTouch: !!process.env.TOUCH,
  isMobile: !!process.env.TOUCH,
});
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE: ' + m.text());
});

await fs.mkdir(OUT, { recursive: true });
await page.goto(`http://localhost:3210${route}`, { waitUntil: 'networkidle', timeout: 60000 });

// Let the loader finish and the scene compile.
await page.waitForTimeout(Number(process.env.WAIT || 9000));

for (const f of positions) {
  await page.evaluate((frac) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * frac, behavior: 'instant' });
  }, f);
  // Lenis + scrub animations need frames to settle at the new offset.
  await page.waitForTimeout(Number(process.env.SETTLE || 2600));
  const tag = String(f).replace('.', '');
  await page.screenshot({ path: `${OUT}/${prefix}-${tag}.png` });
  console.log('shot', `${prefix}-${tag}`);
}

if (errors.length) console.log('\n--- errors ---\n' + [...new Set(errors)].slice(0, 12).join('\n'));
await browser.close();
