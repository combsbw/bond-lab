// Checks for js/drude.js. Run: node tools/check-drude.js
const D = require('../js/drude.js');
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } else console.log('ok  ', m); };
const Xe = D.GASES[4], He = D.GASES[0], Ar = D.GASES[2];
// 1. the simulated, time-averaged force matches the exact thermal average
{
  const r = 4.6, W = D.create(Xe.alpha, Xe.alpha, r, 3); let s = 0, n = 0, sgn = 0;
  for (let k = 0; k < 400000; k++) { const f = D.step(W, 0.01); if (k > 2000) { s += f; n++; if (f > 0) sgn++; } }
  const exact = D.meanForce(Xe.alpha, Xe.alpha, r, W.kT), avg = s / n;
  ok(avg < 0 && Math.abs(avg - exact) / Math.abs(exact) < 0.25, `average of the flicker ${avg.toExponential(2)} vs exact ${exact.toExponential(2)}`);
  ok(sgn / n > 0.3 && sgn / n < 0.7, `and it flickers both ways (${(sgn / n * 100).toFixed(0)}% of the time it pushes apart)`);
}
// 2. falls off fast with distance (about r^-7), grows with size (about alpha^2)
{
  const f = (r) => -D.meanForce(Xe.alpha, Xe.alpha, r, D.KT);
  const slope = Math.log(f(6) / f(12)) / Math.log(2);
  ok(Math.abs(slope - 7) < 0.4, `force falls like r^-${slope.toFixed(2)}`);
  const ratio = D.meanForce(Xe.alpha, Xe.alpha, 6, D.KT) / D.meanForce(He.alpha, He.alpha, 6, D.KT);
  ok(Math.abs(Math.log(ratio) / Math.log(Xe.alpha / He.alpha) - 2) < 0.2, `strength grows like alpha^2 (ratio ${ratio.toFixed(0)})`);
  ok(D.meanForce(Ar.alpha, Ar.alpha, 5, 0) === -0 || D.meanForce(Ar.alpha, Ar.alpha, 5, 0) === 0, 'no flicker, no pull');
}
// 3. bigger atoms, stickier at touching distance, in the same order as real boiling points
{
  const touch = D.GASES.map((g) => -D.meanEnergy(g.alpha, g.alpha, 2 * g.R, D.KT));
  const bp = D.GASES.map((g) => g.bp);
  const rank = (a) => a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]).map((x) => x[1]).join();
  ok(rank(touch) === rank(bp), `stickiness at contact orders the gases like their boiling points (${rank(touch)})`);
  ok(touch.every((v, i) => i === 0 || v > touch[i - 1]), 'increasing He to Xe');
}
console.log(bad ? `\n${bad} check(s) failed` : '\nall drude checks passed');
process.exitCode = bad ? 1 : 0;
