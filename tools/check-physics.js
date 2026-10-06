/* Sanity checks for js/physics.js. Run: node tools/check-physics.js */
const P = require('../js/physics.js');
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
for (const id of Object.keys(P.TYPES)) {
  const t = P.TYPES[id], U = t.pot.U, dU = t.pot.dU, r0 = t.r0, D = t.D;
  ok(Math.abs(U(r0) + D) < 1e-6 * D, id + ': well bottom is -D at r0');
  ok(Math.abs(dU(r0)) < 1e-6 * D, id + ': force is zero at r0');
  const tail = { ionic: 0.25, iondipole: 0.1 }[id] || 0.02;   // Coulomb and ion-dipole have long tails, and that is physics
  ok(U(r0 * 6) > -tail * D, id + ': pull far away is under ' + tail * 100 + '% of the well');
  const h = 1e-4, kNum = (U(r0 + h) - 2 * U(r0) + U(r0 - h)) / (h * h);
  ok(Math.abs(kNum - t.pot.k) / t.pot.k < 0.02, id + ': stiffness matches the curvature (' + t.pot.k.toFixed(1) + ')');
  const num = (U(r0 * 1.2 + h) - U(r0 * 1.2 - h)) / (2 * h);
  ok(Math.abs(num - dU(r0 * 1.2)) < 1e-3 * Math.max(1, Math.abs(num)), id + ': dU agrees with the slope of U');
}
// heat: bound share falls with temperature, and weaker wells let go at lower temperature
const half = (t) => { let lo = 1, hi = 5e4; for (let k = 0; k < 40; k++) { const mid = Math.sqrt(lo * hi); (P.boundFraction(t, mid) > 0.5 ? (lo = mid) : (hi = mid)); } return lo; };
for (const id of Object.keys(P.TYPES)) { const t = P.TYPES[id]; ok(P.boundFraction(t, 20) >= P.boundFraction(t, 300) && P.boundFraction(t, 300) >= P.boundFraction(t, 3000), id + ': hotter means less together'); }
const H = {}; for (const id of Object.keys(P.TYPES)) H[id] = half(P.TYPES[id]);
console.log('     half-bound temperatures (K):', Object.entries(H).map(([k, v]) => k + ' ' + Math.round(v)).join(', '));
ok(H.vdw < H.dipole && H.dipole < H.hydrogen && H.hydrogen < H.iondipole && H.iondipole < Math.min(H.covalent, H.ionic), 'weak wells let go first: vdw < dipole < hydrogen < ion-dipole < covalent/ionic');
process.exit(bad ? 1 : 0);
