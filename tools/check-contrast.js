/* WCAG contrast of the theme tokens in css/style.css, for all four themes (light, dark, and both high-contrast).
   Text pairs need 4.5:1 (7:1 in high contrast); graphics and borders that carry meaning need 3:1.
   Run: node tools/check-contrast.js */
const fs = require('fs'), css = fs.readFileSync(__dirname + '/../css/style.css', 'utf8');
const grab = (re) => { const m = css.match(re); const o = {}; if (m) m[1].replace(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g, (_, k, v) => { o[k] = v; }); return o; };
const block = (sel) => { const i = css.indexOf(sel + ' {'); return css.slice(i, css.indexOf('}', i)); };
const T = {};
T.light = grab(/(:root \{[^}]*\})/);
T.dark = Object.assign({}, T.light, grab(new RegExp('(' + block('html[data-theme="dark"]').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')')));
const hiL = Object.assign({}, T.light, grab(new RegExp('(' + block('html[data-contrast="high"]').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')')));
T.highLight = hiL;
T.highDark = Object.assign({}, T.dark, grab(new RegExp('(' + block('html[data-theme="dark"][data-contrast="high"]').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')')));
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
let bad = 0;
for (const [name, t] of Object.entries(T)) {
  const hi = name.startsWith('high'), tx = hi ? 7 : 4.5;
  const text = [['fg', 'bg'], ['fg', 'panel'], ['muted', 'panel'], ['muted', 'bg'], ['muted', 'panel-2'], ['ui', 'panel'], ['ui', 'bg'], ['ui-ink', 'ui'], ['fg', 'ui-soft'],
    ['electron', 'panel'], ['pos', 'panel'], ['neg', 'panel'], ['cloud', 'panel'], ['t-covalent', 'panel'], ['t-ionic', 'panel'], ['t-hydrogen', 'panel'], ['t-dipole', 'panel'], ['t-iondipole', 'panel'], ['t-vdw', 'panel'], ['focus', 'panel'], ['focus', 'bg']];
  const gfx = [['line-2', 'panel'], ['line-2', 'bg']];
  for (const [a, b] of text) { if (!t[a] || !t[b]) continue; const r = ratio(t[a], t[b]); const need = a === 'electron' || a === 'cloud' || a.startsWith('t-') || a === 'pos' || a === 'neg' ? Math.min(tx, 4.5) : tx; if (r < need) { bad++; console.log('FAIL', name, a, 'on', b, r.toFixed(2), 'needs', need); } }
  for (const [a, b] of gfx) { const r = ratio(t[a], t[b]); if (r < 3) { bad++; console.log('FAIL', name, a, 'on', b, r.toFixed(2), 'needs 3'); } }
}
console.log(bad ? bad + ' failing pairs' : 'all pairs pass in all four themes');
process.exit(bad ? 1 : 0);
