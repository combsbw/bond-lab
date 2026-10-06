/* Measures energy per molecule against temperature for the three molecule kinds in the Slow box
   (40 molecules, 10 x 8, no gravity), averaged over a few seeds and smoothed, and prints the table
   that js/slow.js embeds. Run: node tools/gen-caloric.js [--check] */
const M = require('../js/water2d.js');
const KS = []; for (let K = 40; K <= 800; K += 40) KS.push(K);
function curve(type, seed) {
  const W = M.create({ n: 40, w: 10, h: 8, type, K: KS[0], g: 0, gamma: 1.5, layout: 'block', seed });
  return KS.map((K) => { W.setK(K); for (let k = 0; k < 4000; k++) M.step(W, 0.005); let e = 0; const m = 400; for (let s = 0; s < m; s++) { for (let k = 0; k < 8; k++) M.step(W, 0.005); e += (M.kinetic(W) + W.pu) / W.n; } return e / m; });
}
const out = {};
for (const type of ['water', 'weak', 'none']) {
  const runs = [5, 6, 7].map((s) => curve(type, s)), avg = KS.map((_, i) => runs.reduce((a, r) => a + r[i], 0) / runs.length);
  const sm = avg.map((v, i) => (i === 0 || i === avg.length - 1 ? v : (avg[i - 1] + 2 * v + avg[i + 1]) / 4));
  for (let i = 1; i < sm.length; i++) if (sm[i] < sm[i - 1] + 0.002) sm[i] = sm[i - 1] + 0.002;      // energy rises with temperature
  out[type] = sm.map((v) => +v.toFixed(3));
}
if (process.argv.includes('--check')) {
  const sl = (a, i, j) => (a[j] - a[i]) / (KS[j] - KS[i]) * 1560;
  const mid = (a) => sl(a, 5, 13);
  console.log('mid-range heat capacity  water', mid(out.water).toFixed(2), 'weak', mid(out.weak).toFixed(2), 'none', mid(out.none).toFixed(2));
  process.exit(mid(out.water) > 2 * mid(out.none) ? 0 : 1);
}
console.log('K: ' + JSON.stringify(KS)); for (const t in out) console.log(t + ': ' + JSON.stringify(out[t]));
