// Checks for js/water2d.js. Run: node tools/check-water2d.js [--sweep]
const M = require('../js/water2d.js');
let bad = 0;
const ok = (c, msg) => { if (!c) { bad++; console.log('FAIL', msg); } else console.log('ok  ', msg); };

// 1. forces are the gradient of the energy (finite differences), including torques
{
  const W = M.create({ n: 3, w: 30, h: 30, type: 'water', K: 100, layout: 'pair', seed: 3 });
  W.x[0] = 10; W.y[0] = 10; W.th[0] = 0.3; W.x[1] = 11.1; W.y[1] = 10.2; W.th[1] = 3.0; W.x[2] = 10.4; W.y[2] = 11.0; W.th[2] = 1.9;
  M.forces(W);
  const F = [W.fx[1], W.fy[1], W.tq[1]];
  const h = 1e-6, U = () => M.forces(W);
  const num = [0, 0, 0];
  [[W.x, 1], [W.y, 1], [W.th, 1]].forEach(([arr, i], k) => { const o = arr[i]; arr[i] = o + h; const up = U(); arr[i] = o - h; const um = U(); arr[i] = o; num[k] = -(up - um) / (2 * h); });
  ok(Math.abs(F[0] - num[0]) < 1e-5 && Math.abs(F[1] - num[1]) < 1e-5 && Math.abs(F[2] - num[2]) < 1e-5, `force and torque match -dU/dq (${F.map((v) => v.toFixed(4))} vs ${num.map((v) => v.toFixed(4))})`);
}
// 2. the handshake: right distance and angle is a deep well, wrong angle is not, like ends push apart
{
  const best = M.pairEnergy('water', 1.12, 0.0 + (-52.25 * Math.PI / 180) * 0 + 0, Math.PI);   // A's axis points at B; B's axis points back at A
  // find the best energy over relative orientation and distance
  let min = 0, at = null;
  for (let r = 0.95; r < 1.6; r += 0.01) for (let a = 0; a < 6.283; a += 0.05) for (let b = 0; b < 6.283; b += 0.05) { const e = M.pairEnergy('water', r, a, b); if (e < min) { min = e; at = [r, a, b]; } }
  ok(min < -0.9, `a good handshake is deep (best ${min.toFixed(2)} at r=${at[0].toFixed(2)})`);
  ok(at[0] > 0.95 && at[0] < 1.25, 'and happens about one disk apart');
  const far = M.pairEnergy('water', 1.12, at[1] + Math.PI / 2, at[2]);        // turn one molecule a quarter turn
  ok(far > min * 0.35, `turned a quarter turn the well mostly goes away (${far.toFixed(2)} vs ${min.toFixed(2)})`);
  const none = M.pairEnergy('none', 1.12, at[1], at[2]);
  ok(none > -0.35 && none < 0, `with no hands only the weak stickiness remains (${none.toFixed(2)})`);
  const weak = M.pairEnergy('weak', at[0], at[1], at[2]);
  void weak;
  ok(weak < none && weak > min, `weak hands are in between (${weak.toFixed(2)})`);
}
// 3. energy conserved with the thermostat off
{
  const W = M.create({ n: 16, w: 10, h: 10, type: 'water', K: 250, g: 0, gamma: 0, seed: 11 });
  for (let i = 0; i < W.n; i++) { W.x[i] = 1.4 + (i % 4) * 2.0 + 0.2 * Math.sin(i); W.y[i] = 1.4 + Math.floor(i / 4) * 2.0 + 0.2 * Math.cos(i); }
  W.fresh = false;
  for (let k = 0; k < 4000; k++) M.step(W, 0.002);
  const E0 = M.kinetic(W) + W.pu; let emax = 0;
  for (let k = 0; k < 6000; k++) { M.step(W, 0.002); emax = Math.max(emax, Math.abs(M.kinetic(W) + W.pu - E0)); }
  ok(emax < 0.03 * Math.max(1, Math.abs(E0)) + 0.05, `energy drift small without thermostat (max ${emax.toFixed(4)} around E=${E0.toFixed(2)})`);
}
// 4. thermostat holds the temperature: kinetic energy per molecule = 1.5 kT (2 translational + 1 rotational dof)
{
  const W = M.create({ n: 30, w: 20, h: 14, type: 'water', K: 300, seed: 5 });
  for (let k = 0; k < 8000; k++) M.step(W, 0.005);
  let s = 0, m = 0; for (let k = 0; k < 6000; k++) { M.step(W, 0.005); if (k % 10 === 0) { s += M.kinetic(W) / W.n; m++; } }
  const want = 1.5 * W.kT;
  ok(Math.abs(s / m - want) / want < 0.06, `kinetic energy per molecule ${(s / m).toFixed(3)} vs 1.5 kT = ${want.toFixed(3)}`);
}
// 5. the experiment: how clingy are the crowds at different temperatures?
function crowd(type, K, N, seed, steps) {
  const W = M.create({ n: N || 40, w: 20, h: 14, type, K, seed: seed || 7 });
  const dt = 0.005; steps = steps || 30000;
  for (let k = 0; k < steps; k++) M.step(W, dt);
  let nb = 0, hb = 0, c = 0; for (let k = 0; k < 8000; k++) { M.step(W, dt); if (k % 400 === 0) { nb += M.neighbors(W, 1.3); hb += M.handshakes(W).perMolecule; c++; } }
  return { nb: nb / c, hb: hb / c };
}
if (process.argv.includes('--sweep')) {
  for (const type of ['water', 'weak', 'none']) {
    const row = [];
    for (const K of [60, 100, 150, 200, 250, 300, 350, 400, 500, 650]) { const r = crowd(type, K); row.push(`${K}K nb ${r.nb.toFixed(2)} hb ${r.hb.toFixed(2)}`); }
    console.log(type.padEnd(6), row.join(' | '));
  }
} else {
  const cold = crowd('water', 150), hot = crowd('water', 800), nohand = crowd('none', 300);
  ok(cold.nb > 3, `a cold water-like crowd clings together (${cold.nb.toFixed(2)} neighbors, ${cold.hb.toFixed(2)} handshakes each)`);
  ok(hot.nb < cold.nb - 1.5, `a hot one comes apart (${hot.nb.toFixed(2)} neighbors)`);
  ok(nohand.nb < cold.nb, `a no-hands crowd at the same temperature is looser (${nohand.nb.toFixed(2)} neighbors)`);
}
console.log(bad ? `\n${bad} check(s) failed` : '\nall water2d checks passed');
process.exitCode = bad ? 1 : 0;
