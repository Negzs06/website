/* ============================================================
   CHRONOLITH — asset foundry.

   Renders every plate in scripts/lib/plates.mjs through a real
   WebGL2 context in headless Chromium, supersampled, then encodes
   AVIF + WebP responsive sets with sharp and emits a manifest
   (dimensions + an inline LQIP) for the app to consume.

     node scripts/generate-assets.mjs            # everything
     node scripts/generate-assets.mjs plate-core # one plate
   ============================================================ */

import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMON, frag } from './lib/glsl-common.mjs';
import { PLATES, TEXTURES } from './lib/plates.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'public/images');
const TEX_DIR = path.join(ROOT, 'public/textures');
const MANIFEST = path.join(ROOT, 'src/data/plates.generated.ts');

const WIDTHS = [640, 1280, 1920];
const MAX_SS_PIXELS = 15_000_000; // supersample budget per render
const MAX_SS_DIM = 4000; // keep the render inside a sane viewport

const argv = process.argv.slice(2);
const only = argv.filter((a) => !a.startsWith('-'));
const previewArg = argv.find((a) => a.startsWith('--preview'));
const PREVIEW = previewArg ? Number(previewArg.split('=')[1] || 620) : 0;
const PREVIEW_DIR = process.env.PREVIEW_DIR || '/tmp/plates';
const log = (...a) => console.log('  ', ...a);

/* ---------------------------------------------------------- */

function buildShader(plate) {
  if (plate.override) {
    return `#version 300 es\n${COMMON}\nout vec4 fragColor;\n${plate.override}\n`;
  }
  return frag(plate.body);
}

const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#000;overflow:hidden}
canvas{display:block}</style></head><body></body></html>`;

/** Runs inside the browser. Compiles and draws one fragment shader. */
const RENDER_FN = ({ source, width, height, seed, time }) => {
  const prev = document.querySelector('canvas');
  if (prev) prev.remove();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  document.body.appendChild(canvas);

  const gl = canvas.getContext('webgl2', {
    preserveDrawingBuffer: true,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return 'NO_WEBGL2';

  const vs = `#version 300 es
  in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      return { error: gl.getShaderInfoLog(s) };
    }
    return { shader: s };
  };

  const v = compile(gl.VERTEX_SHADER, vs);
  if (v.error) return 'VS: ' + v.error;
  const f = compile(gl.FRAGMENT_SHADER, source);
  if (f.error) return 'FS: ' + f.error;

  const prog = gl.createProgram();
  gl.attachShader(prog, v.shader);
  gl.attachShader(prog, f.shader);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    return 'LINK: ' + gl.getProgramInfoLog(prog);
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), width, height);
  gl.uniform1f(gl.getUniformLocation(prog, 'uSeed'), seed);
  gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), time || 0);

  gl.viewport(0, 0, width, height);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.finish();

  // Confirm the framebuffer is not uniformly black — catches silent
  // context loss under software rasterisation.
  const px = new Uint8Array(4);
  gl.readPixels(
    Math.floor(width / 2), Math.floor(height / 2), 1, 1,
    gl.RGBA, gl.UNSIGNED_BYTE, px,
  );
  return 'OK:' + px[0] + ',' + px[1] + ',' + px[2];
};

/* ---------------------------------------------------------- */

async function main() {
  await fs.mkdir(IMG_DIR, { recursive: true });
  await fs.mkdir(TEX_DIR, { recursive: true });
  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });

  console.log('\n  CHRONOLITH asset foundry\n  ' + '─'.repeat(46));

  // The environment ships a pinned Chromium; use it rather than letting
  // Playwright fetch its own (downloads are blocked here anyway).
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-gpu-sandbox',
      '--no-sandbox',
      '--max-old-space-size=4096',
    ],
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('     [browser]', m.text());
  });
  await page.setContent(PAGE_HTML);

  /** Renders one shader and returns a PNG buffer of exactly w×h pixels. */
  async function shoot(def, w, h) {
    // The screenshot path can only capture what the viewport can hold, so
    // the viewport is resized to match the drawing buffer for each render.
    await page.setViewportSize({ width: w, height: h });
    const res = await page.evaluate(RENDER_FN, {
      source: buildShader(def),
      width: w,
      height: h,
      seed: def.seed,
      time: def.time ?? 0,
    });
    if (!String(res).startsWith('OK')) {
      throw new Error(`${def.name} failed to render → ${res}`);
    }
    const png = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: w, height: h },
      animations: 'disabled',
    });
    const meta = await sharp(png).metadata();
    if (meta.width !== w || meta.height !== h) {
      throw new Error(`${def.name}: captured ${meta.width}×${meta.height}, expected ${w}×${h}`);
    }
    return png;
  }

  // ---------- preview mode: fast, unencoded, for art direction ----------
  if (PREVIEW) {
    await fs.mkdir(PREVIEW_DIR, { recursive: true });
    for (const plate of PLATES) {
      if (only.length && !only.includes(plate.name)) continue;
      const w = PREVIEW;
      const h = Math.round((w / plate.w) * plate.h);
      const t0 = Date.now();
      const png = await shoot(plate, w, h);
      await fs.writeFile(path.join(PREVIEW_DIR, `${plate.name}.png`), png);
      log(`preview ${plate.name}  ${w}×${h}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    }
    await browser.close();
    console.log(`  previews → ${PREVIEW_DIR}\n`);
    return;
  }

  const manifest = [];

  // ---------- plates ----------
  for (const plate of PLATES) {
    if (only.length && !only.includes(plate.name)) continue;
    const t0 = Date.now();

    const byPixels = Math.sqrt(MAX_SS_PIXELS / (plate.w * plate.h));
    const byDim = MAX_SS_DIM / Math.max(plate.w, plate.h);
    const scale = Math.max(1, Math.min(2, byPixels, byDim));
    const rw = Math.round(plate.w * scale);
    const rh = Math.round(plate.h * scale);

    log(`${plate.name}  ${plate.w}×${plate.h}  (render ${rw}×${rh})`);

    const png = await shoot(plate, rw, rh);
    const base = sharp(png).resize(plate.w, plate.h, { kernel: 'lanczos3' });
    const meta = { name: plate.name, alt: plate.alt, width: plate.w, height: plate.h };

    for (const w of WIDTHS) {
      if (w > plate.w * 1.02) continue;
      const h = Math.round((w / plate.w) * plate.h);
      const buf = await base.clone().resize(w, h, { kernel: 'lanczos3' }).toBuffer();
      await sharp(buf).avif({ quality: 62, effort: 5 }).toFile(path.join(IMG_DIR, `${plate.name}-${w}.avif`));
      await sharp(buf).webp({ quality: 80, effort: 5 }).toFile(path.join(IMG_DIR, `${plate.name}-${w}.webp`));
    }
    // Native-size fallback when the plate is smaller than the largest step.
    const largest = Math.max(...WIDTHS.filter((w) => w <= plate.w * 1.02), 0);
    if (largest === 0) {
      await base.clone().avif({ quality: 62, effort: 5 }).toFile(path.join(IMG_DIR, `${plate.name}-${plate.w}.avif`));
      await base.clone().webp({ quality: 80, effort: 5 }).toFile(path.join(IMG_DIR, `${plate.name}-${plate.w}.webp`));
      meta.sizes = [plate.w];
    } else {
      meta.sizes = WIDTHS.filter((w) => w <= plate.w * 1.02);
    }

    // LQIP: a genuinely tiny blurred WebP inlined into the markup so
    // every image has something real behind it while it decodes.
    const lqip = await base
      .clone()
      .resize(24, Math.max(1, Math.round((24 / plate.w) * plate.h)))
      .blur(1.1)
      .webp({ quality: 42 })
      .toBuffer();
    meta.lqip = `data:image/webp;base64,${lqip.toString('base64')}`;

    manifest.push(meta);
    log(`  ✓ ${((Date.now() - t0) / 1000).toFixed(1)}s   lqip ${(meta.lqip.length / 1024).toFixed(1)}kb`);
  }

  // ---------- utility textures ----------
  for (const tex of TEXTURES) {
    if (only.length && !only.includes(tex.name)) continue;
    log(`${tex.name}  ${tex.w}×${tex.h}  (texture)`);
    const png = await shoot(tex, tex.w, tex.h);
    await sharp(png).png({ compressionLevel: 9 }).toFile(path.join(TEX_DIR, `${tex.name}.png`));
    log('  ✓ written');
  }

  await browser.close();

  // ---------- manifest ----------
  if (manifest.length) {
    const existing = await readExistingManifest();
    const merged = [...existing.filter((e) => !manifest.some((m) => m.name === e.name)), ...manifest]
      .sort((a, b) => a.name.localeCompare(b.name));

    const ts = `// GENERATED by scripts/generate-assets.mjs — do not edit by hand.
// Every plate here is an original render; see scripts/lib/plates.mjs.

export type PlateMeta = {
  name: string;
  alt: string;
  width: number;
  height: number;
  sizes: number[];
  lqip: string;
};

export const PLATES = ${JSON.stringify(merged, null, 2)} as const satisfies readonly PlateMeta[];

export type PlateName = (typeof PLATES)[number]['name'];

const BY_NAME = new Map(PLATES.map((p) => [p.name, p] as const));

export function plate(name: PlateName): PlateMeta {
  const found = BY_NAME.get(name);
  if (!found) throw new Error(\`Unknown plate: \${name}\`);
  return found;
}
`;
    await fs.writeFile(MANIFEST, ts);
    log(`manifest → ${path.relative(ROOT, MANIFEST)} (${merged.length} plates)`);
  }

  console.log('  ' + '─'.repeat(46) + '\n  done\n');
}

async function readExistingManifest() {
  try {
    const src = await fs.readFile(MANIFEST, 'utf8');
    const m = src.match(/export const PLATES = (\[[\s\S]*?\]) as const/);
    return m ? JSON.parse(m[1]) : [];
  } catch {
    return [];
  }
}

main().catch((err) => {
  console.error('\n  FOUNDRY FAILED:', err.message, '\n');
  process.exit(1);
});
