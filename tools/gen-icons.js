/* Draws Bond Lab's icon and renders every size the web asks for.
   Run: NODE_PATH=<playwright> node tools/gen-icons.js

   The mark is the lab's one idea, at icon size: two atoms, one cloud of
   electrons between them, and the cloud is not in the middle. The atom on the
   right is bigger and pulls harder, so the shared cloud leans its way. That is
   the whole of The Spectrum in three shapes, and it still reads at 32 pixels.

   Chromium does the rasterising, because it is the renderer the icons will
   actually be seen in and it is already here for the smoke test. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'icons');

/* Brand colours, kept in step with the dark theme in css/style.css. */
const INK = '#08151a';          // background
const EDGE = '#ecf5f2';         // the atoms' outlines
const CLOUD = '#ffb84d';        // the shared electrons
const CLOUD_DEEP = '#e8870f';
const CLOUD_LIT = '#ffd79a';   // the light side, so the cloud reads as a body

/* One drawing, in a 512 box.
   o.round  : rounded corners (a normal app icon)
   o.bleed  : no corners at all, artwork pulled into the safe circle (maskable) */
function svg(o) {
  o = o || {};
  const S = 512;
  // Maskable icons get masked to as little as the middle 80%, so the artwork
  // shrinks to sit inside that circle while the background still bleeds out.
  const k = o.bleed ? 0.84 : 1;
  const T = (v) => (256 + (v - 256) * k).toFixed(1);
  const L = (v) => (v * k).toFixed(1);

  const aCx = 197, bCx = 295, cy = 256;
  const aR = 92, bR = 112, sw = 22;
  // the cloud sits 62% of the way toward the stronger puller
  const clCx = aCx + 0.62 * (bCx - aCx), clRx = 88, clRy = 57;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<defs>
<radialGradient id="c" cx="36%" cy="32%" r="78%">
<stop offset="0" stop-color="${CLOUD_LIT}"/>
<stop offset="0.38" stop-color="${CLOUD}"/>
<stop offset="1" stop-color="${CLOUD_DEEP}"/>
</radialGradient>
</defs>
<rect width="${S}" height="${S}"${o.round ? ' rx="112"' : ''} fill="${INK}"/>
<g fill="none" stroke="${EDGE}" stroke-width="${L(sw)}">
<circle cx="${T(aCx)}" cy="${T(cy)}" r="${L(aR)}"/>
<circle cx="${T(bCx)}" cy="${T(cy)}" r="${L(bR)}"/>
</g>
<ellipse cx="${T(clCx)}" cy="${T(cy)}" rx="${L(clRx)}" ry="${L(clRy)}" fill="url(#c)"/>
</svg>`;
}

/* Every size, and why each one exists. */
const SIZES = [
  { file: 'icon-192.png', px: 192, opts: { round: true } },
  { file: 'icon-512.png', px: 512, opts: { round: true } },
  { file: 'icon-maskable-192.png', px: 192, opts: { bleed: true } },
  { file: 'icon-maskable-512.png', px: 512, opts: { bleed: true } },
  { file: 'apple-touch-icon.png', px: 180, opts: {} },          // iOS rounds it itself
  { file: 'favicon-32.png', px: 32, opts: { round: true } },
  { file: 'favicon-16.png', px: 16, opts: { round: true } },
];

(async () => {
  const { chromium } = require('playwright');
  fs.mkdirSync(OUT, { recursive: true });

  // the scalable one, used as the page's favicon and as the source of truth
  fs.writeFileSync(path.join(ROOT, 'assets', 'icon.svg'), svg({ round: true }) + '\n');

  const b = await chromium.launch();
  for (const s of SIZES) {
    const page = await b.newPage({ viewport: { width: s.px, height: s.px }, deviceScaleFactor: 1 });
    await page.setContent(
      '<style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style>'
      + svg(s.opts), { waitUntil: 'load' });
    await page.screenshot({ path: path.join(OUT, s.file), omitBackground: true });
    await page.close();
    console.log('wrote', path.relative(ROOT, path.join(OUT, s.file)), s.px + 'px');
  }
  await b.close();
  console.log('wrote', 'assets/icon.svg');
})();
