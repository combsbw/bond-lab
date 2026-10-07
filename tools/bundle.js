/* Builds one self-contained file (CSS, JS and fonts inlined) at dist/bond-lab.html.
   Handy for emailing, a USB stick, or pasting into a page host. Run: node tools/bundle.js [out.html] */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), rd = (p) => fs.readFileSync(path.join(root, p));
let html = rd('index.html').toString();
let css = rd('css/style.css').toString().replace(/url\('\.\.\/(assets\/[^']+)'\)/g, (_, p) => "url('data:font/woff2;base64," + rd(p).toString('base64') + "')");
html = html.replace(/<link rel="stylesheet" href="css\/style\.css">/, () => '<style>\n' + css + '\n</style>');
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, p) => '<script>\n' + rd(p).toString().replace(/<\/script/gi, '<\\/script') + '\n</script>');
/* The single file has no sibling files to point at, so the links that would
   404 come out and the icon goes back in as a data URI. */
const iconData = 'data:image/svg+xml;base64,' + rd('assets/icon.svg').toString('base64');
html = html
  .replace(/\n<link rel="(icon|apple-touch-icon|manifest)"[^>]*>/g, '')
  .replace(/\n<script>\n\/\* Installable[\s\S]*?\n<\/script>/, '')
  .replace('<meta name="color-scheme"', '<link rel="icon" href="' + iconData + '">\n<meta name="color-scheme"');

const out = process.argv[2] || path.join(root, 'dist', 'bond-lab.html');
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
console.log('wrote', out, (html.length / 1024).toFixed(0) + ' KB');
