/* Checks for js/lattice.js: the water-like kind must be densest in the middle and OPEN when cold;
   the no-hands kind must only get denser as it cools. Run: node tools/check-lattice.js */
const M = require('../js/lattice.js');
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
function cool(kind, mu, seed) {
  const G = M.create({ L: 24, kind, T: 0.9, mu, seed });
  for (let i = 0; i < G.n; i++) G.s[i] = 1 + ((G.rand() * 2) | 0);
  M.sweep(G, 150); const r = {};
  for (let T = 0.9; T >= 0.099; T -= 0.1) { G.T = T; M.sweep(G, 50); let d = 0, b = 0; for (let k = 0; k < 20; k++) { M.sweep(G, 1); const s = M.stats(G); d += s.density; b += s.bonds; } r[T.toFixed(1)] = { d: d / 20, b: b / 20 }; }
  return r;
}
const w = cool('water', -1.4, 7), p = cool('plain', -1.2, 7);
let peakT = '0.9'; for (const T in w) if (w[T].d > w[peakT].d) peakT = T;
ok(+peakT >= 0.4 && +peakT <= 0.6, 'water-like density peaks mid-range, at T=' + peakT);
ok(w['0.1'].d < w[peakT].d - 0.1, 'water-like is much less dense when cold: ' + w['0.1'].d.toFixed(2) + ' vs peak ' + w[peakT].d.toFixed(2));
ok(w['0.1'].b > 1.25 && w['0.9'].b < 1.0, 'cold water-like has far more handshakes (' + w['0.1'].b.toFixed(2) + ' vs ' + w['0.9'].b.toFixed(2) + ')');
let mono = true, prev = 0; for (let T = 0.9; T >= 0.099; T -= 0.1) { const d = p[T.toFixed(1)].d; if (d < prev - 0.02) mono = false; prev = d; }
ok(mono && p['0.1'].d > 0.97, 'no-hands only gets denser as it cools (to ' + p['0.1'].d.toFixed(2) + ')');
ok(p['0.1'].d > w['0.1'].d + 0.15, 'cold no-hands is far denser than cold water-like');
process.exit(bad ? 1 : 0);
