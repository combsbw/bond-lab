/* Draws both labs' icons and renders every size the web asks for.
   Run: NODE_PATH=<playwright> node tools/gen-icons.js

   Each mark is its lab's one idea, at icon size.

   Bond Lab: two atoms, one cloud of electrons between them, and the cloud is
   not in the middle. The atom on the right is bigger and pulls harder, so the
   shared cloud leans its way. That is the whole of The Spectrum in three
   shapes, and it still reads at 32 pixels.

   Life Lab: two units joined by a bond, and one drop of water lifting off.
   That is the whole of The Template, and it reads at 32 pixels too.

   Cell Lab: a cell, which is a room with rooms in it. A membrane ring, a
   nucleus, one bean of an organelle. The three marks share a background and a
   weight so they look like one set of apps.

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
const UNIT = '#8ee28b';         // a monomer
const UNIT_DEEP = '#3f9b48';
const DROP = '#7ebaff';         // the water that leaves when the bond forms
const DROP_DEEP = '#2d6fc4';
const MEMBRANE = '#7fe0c9';     // the cell's outer wall
const NUC = '#b8aaff';          // the nucleus, in the genetic-control colour
const NUC_DEEP = '#5748a0';
const MITO = '#ffbe5c';         // an organelle, in the energy colour
const MITO_DEEP = '#c27a14';

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

/* The Life Lab's mark: two units, one bond, one water leaving. */
function lifeSvg(o) {
  o = o || {};
  const S = 512;
  const k = o.bleed ? 0.84 : 1;
  const T = (v) => (256 + (v - 256) * k).toFixed(1);
  const L = (v) => (v * k).toFixed(1);

  const cy = 320, aCx = 150, bCx = 362, r = 78, bar = 34;
  const dCx = 256, dCy = 136, dR = 56;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<defs>
<radialGradient id="u" cx="34%" cy="30%" r="80%">
<stop offset="0" stop-color="#d4f5cf"/>
<stop offset="0.4" stop-color="${UNIT}"/>
<stop offset="1" stop-color="${UNIT_DEEP}"/>
</radialGradient>
<radialGradient id="d" cx="34%" cy="28%" r="82%">
<stop offset="0" stop-color="#d6e9ff"/>
<stop offset="0.4" stop-color="${DROP}"/>
<stop offset="1" stop-color="${DROP_DEEP}"/>
</radialGradient>
</defs>
<rect width="${S}" height="${S}"${o.round ? ' rx="112"' : ''} fill="${INK}"/>
<rect x="${T(aCx)}" y="${T(cy - bar / 2)}" width="${L(bCx - aCx)}" height="${L(bar)}" rx="${L(bar / 2)}" fill="${EDGE}"/>
<circle cx="${T(aCx)}" cy="${T(cy)}" r="${L(r)}" fill="url(#u)"/>
<circle cx="${T(bCx)}" cy="${T(cy)}" r="${L(r)}" fill="url(#u)"/>
<path d="M ${T(dCx)} ${T(dCy - dR * 1.5)}
         C ${T(dCx + dR * 0.95)} ${T(dCy - dR * 0.3)}, ${T(dCx + dR)} ${T(dCy + dR * 0.75)}, ${T(dCx)} ${T(dCy + dR)}
         C ${T(dCx - dR)} ${T(dCy + dR * 0.75)}, ${T(dCx - dR * 0.95)} ${T(dCy - dR * 0.3)}, ${T(dCx)} ${T(dCy - dR * 1.5)} Z"
      fill="url(#d)"/>
</svg>`;
}

/* The Cell Lab's mark: a membrane, and the rooms inside it. */
function cellSvg(o) {
  o = o || {};
  const S = 512;
  const k = o.bleed ? 0.84 : 1;
  const T = (v) => (256 + (v - 256) * k).toFixed(1);
  const L = (v) => (v * k).toFixed(1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<defs>
<radialGradient id="n" cx="34%" cy="30%" r="80%">
<stop offset="0" stop-color="#e6dfff"/>
<stop offset="0.4" stop-color="${NUC}"/>
<stop offset="1" stop-color="${NUC_DEEP}"/>
</radialGradient>
<radialGradient id="m" cx="34%" cy="30%" r="80%">
<stop offset="0" stop-color="#ffe6b8"/>
<stop offset="0.45" stop-color="${MITO}"/>
<stop offset="1" stop-color="${MITO_DEEP}"/>
</radialGradient>
</defs>
<rect width="${S}" height="${S}"${o.round ? ' rx="112"' : ''} fill="${INK}"/>
<ellipse cx="${T(256)}" cy="${T(258)}" rx="${L(196)}" ry="${L(172)}" fill="none" stroke="${MEMBRANE}" stroke-width="${L(30)}"/>
<circle cx="${T(222)}" cy="${T(236)}" r="${L(82)}" fill="url(#n)"/>
<ellipse cx="${T(352)}" cy="${T(328)}" rx="${L(56)}" ry="${L(30)}" transform="rotate(-28 ${T(352)} ${T(328)})" fill="url(#m)"/>
<circle cx="${T(336)}" cy="${T(196)}" r="${L(20)}" fill="${EDGE}" opacity=".85"/>
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

/* The three labs, each with its own mark and its own file prefix. */
const MARKS = [
  { draw: svg, prefix: '', scalable: 'icon.svg' },
  { draw: lifeSvg, prefix: 'life-', scalable: 'life-icon.svg' },
  { draw: cellSvg, prefix: 'cell-', scalable: 'cell-icon.svg' },
];

(async () => {
  const { chromium } = require('playwright');
  fs.mkdirSync(OUT, { recursive: true });

  const b = await chromium.launch();
  for (const m of MARKS) {
    // the scalable one, used as the page's favicon and as the source of truth
    fs.writeFileSync(path.join(ROOT, 'assets', m.scalable), m.draw({ round: true }) + '\n');
    for (const s of SIZES) {
      const file = m.prefix + s.file;
      const page = await b.newPage({ viewport: { width: s.px, height: s.px }, deviceScaleFactor: 1 });
      await page.setContent(
        '<style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style>'
        + m.draw(s.opts), { waitUntil: 'load' });
      await page.screenshot({ path: path.join(OUT, file), omitBackground: true });
      await page.close();
      console.log('wrote', path.relative(ROOT, path.join(OUT, file)), s.px + 'px');
    }
    console.log('wrote', 'assets/' + m.scalable);
  }
  await b.close();
})();
