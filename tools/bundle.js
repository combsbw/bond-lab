/* Builds one self-contained file (CSS, JS and fonts inlined).
   Handy for emailing, a USB stick, or pasting into a page host.

   Run: node tools/bundle.js                    -> dist/bond-lab.html
        node tools/bundle.js --life             -> dist/life-lab.html
        node tools/bundle.js [--life] out.html  -> wherever you say */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), rd = (p) => fs.readFileSync(path.join(root, p));

const args = process.argv.slice(2);
const life = args.includes('--life');
const page = life ? 'life.html' : 'index.html';
const icon = life ? 'assets/life-icon.svg' : 'assets/icon.svg';

let html = rd(page).toString();
/* A single file has no sibling file to link to, so the other lab's card would
   point at nothing. Drop it before app.js builds the hub. */
html = html.replace('<script src="js/app.js"></script>',
  '<script>if (window.BL && BL.lab) delete BL.lab.sibling;</script>\n<script src="js/app.js"></script>');

let css = rd('css/style.css').toString().replace(/url\('\.\.\/(assets\/[^']+)'\)/g, (_, p) => "url('data:font/woff2;base64," + rd(p).toString('base64') + "')");
html = html.replace(/<link rel="stylesheet" href="css\/style\.css">/, () => '<style>\n' + css + '\n</style>');
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, p) => '<script>\n' + rd(p).toString().replace(/<\/script/gi, '<\\/script') + '\n</script>');

/* The links that would 404 come out, and the icon goes back in as a data URI. */
const iconData = 'data:image/svg+xml;base64,' + rd(icon).toString('base64');
html = html
  .replace(/\n<link rel="(icon|apple-touch-icon|manifest)"[^>]*>/g, '')
  .replace(/\n<script>\nif \('serviceWorker'[\s\S]*?\n<\/script>/, '')
  .replace(/\n<script>\n\/\* Installable[\s\S]*?\n<\/script>/, '')
  .replace('<meta name="color-scheme"', '<link rel="icon" href="' + iconData + '">\n<meta name="color-scheme"');

const named = args.find((a) => a !== '--life');
const out = named || path.join(root, 'dist', life ? 'life-lab.html' : 'bond-lab.html');
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
console.log('wrote', out, (html.length / 1024).toFixed(0) + ' KB');
