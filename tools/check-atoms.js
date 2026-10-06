// Sanity checks for js/atoms.js. Run: node tools/check-atoms.js
const A = require('../js/atoms.js');
let bad = 0;
const ok = (c, msg) => { if (!c) { bad++; console.log('FAIL', msg); } else console.log('ok  ', msg); };

// 1. radial functions are normalised: integral of r^2 R^2 dr = 1
for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2]]) {
  const M = 20000, rm = A.rMax(n), dr = rm / M;
  let s = 0;
  for (let i = 0; i < M; i++) s += A.radialProb(n, l, (i + 0.5) * dr) * dr;
  ok(Math.abs(s - 1) < 2e-3, `radial ${n}${'spd'[l]} normalised (${s.toFixed(4)})`);
}

// 2. sampled mean distance matches <r> = (3n^2 - l(l+1)) / 2
for (const o of A.ORBITALS) {
  for (const shape of [o.shapes[0], o.shapes[o.shapes.length - 1]]) {
    const smp = A.sampler(o.n, o.l, shape, 1);
    let s = 0, K = 40000;
    for (let i = 0; i < K; i++) s += smp.next().r;
    const want = (3 * o.n * o.n - o.l * (o.l + 1)) / 2;
    ok(Math.abs(s / K - want) / want < 0.03, `${o.id} (${shape}) mean r ${(s / K).toFixed(2)} vs ${want}`);
  }
}
// 3. p orbitals point where they should: px has no weight in the yz plane
{
  const smp = A.sampler(2, 1, 'pz', 1);
  let on = 0, K = 20000;
  for (let i = 0; i < K; i++) { const p = smp.next(); if (Math.abs(p.z) < 0.15 * p.r) on++; }
  ok(on / K < 0.1, `2pz keeps out of its own equator (${(on / K * 100).toFixed(1)}% near it)`);
  // the three p orbitals together are round
  const sm = ['px', 'py', 'pz'].map((s) => A.sampler(2, 1, s, 1));
  let sx = 0, sy = 0, sz = 0; K = 30000;
  for (let i = 0; i < K; i++) { const p = sm[i % 3].next(); sx += p.x * p.x; sy += p.y * p.y; sz += p.z * p.z; }
  const m = (sx + sy + sz) / 3;
  ok(Math.abs(sx - m) / m < 0.05 && Math.abs(sy - m) / m < 0.05 && Math.abs(sz - m) / m < 0.05, 'px+py+pz together are spherical');
}
// 4. a 2s orbital has a node: an empty ring around 2 a0
{
  const smp = A.sampler(2, 0, 's', 1);
  let ring = 0, K = 40000;
  for (let i = 0; i < K; i++) { const r = smp.next().r; if (Math.abs(r - 2) < 0.15) ring++; }
  ok(ring / K < 0.004, `2s has a node near 2 a0 (${(ring / K * 100).toFixed(2)}% of snapshots there)`);
}
// 5. hydrogen levels and a few famous lines
ok(Math.abs(A.levelE(1, 1) + 13.6057) < 1e-3, 'E1 = -13.6 eV');
ok(Math.abs(A.wavelength(A.gapE(2, 3, 1)) - 656.1) < 0.6, `H-alpha ${A.wavelength(A.gapE(2, 3, 1)).toFixed(1)} nm`);
ok(Math.abs(A.wavelength(A.gapE(1, 2, 1)) - 121.5) < 0.3, `Lyman alpha ${A.wavelength(A.gapE(1, 2, 1)).toFixed(1)} nm`);
ok(Math.abs(A.levelE(1, 2) + 54.42) < 0.01, 'He+ ground level -54.4 eV (Z squared)');
ok(A.photon(A.gapE(2, 3, 1)).band === 'visible' && A.photon(10.2).band === 'ultraviolet' && A.photon(0.5).band === 'infrared', 'photon bands');

// 6. electron configurations
const cfg = (N) => A.shellsN(N).join(',');
ok(cfg(1) === '1' && cfg(2) === '2' && cfg(3) === '2,1' && cfg(10) === '2,8' && cfg(11) === '2,8,1' && cfg(17) === '2,8,7' && cfg(18) === '2,8,8' && cfg(19) === '2,8,8,1' && cfg(20) === '2,8,8,2', 'shell counts for H..Ca');
ok(A.valenceN(6) === 4 && A.valenceN(8) === 6 && A.valenceN(11) === 1 && A.valenceN(2) === 2, 'valence counts C=4, O=6, Na=1, He=2');
ok([2, 10, 18].every(A.isFull) && ![1, 3, 9, 11, 17].some(A.isFull), 'full-shell electron counts');
ok(A.isFull(A.bySym.Na.Z - 1) && A.isFull(A.bySym.Cl.Z + 1) && A.isFull(A.bySym.O.Z + 2) && A.isFull(A.bySym.Mg.Z - 2), 'Na+, Cl-, O2-, Mg2+ are full-shell');

// 7. the first ionization energy saw-tooth: noble gases are peaks, alkali metals are dips
const ie = (s) => A.bySym[s].ie;
ok(ie('He') > ie('H') && ie('Ne') > ie('F') && ie('Ar') > ie('Cl'), 'noble gases hold their outer electron hardest in their row');
ok(ie('Li') < ie('He') && ie('Na') < ie('Ne') && ie('K') < ie('Ar'), 'next alkali metal lets go much more easily');
ok(ie('Be') > ie('B') && ie('N') > ie('O') && ie('Mg') > ie('Al'), 'the small dips inside a row (Be>B, N>O, Mg>Al) are in the data');
// 8. the cliff: a full shell makes the next electron far harder to remove
const i2 = (s) => A.bySym[s].ie2;
ok(i2('Na') > 5 * ie('Na') && i2('Li') > 10 * ie('Li') && i2('K') > 6 * ie('K'), 'second electron off Li, Na, K costs many times the first');
ok(i2('Mg') < 2.1 * ie('Mg') && i2('Ca') < 2.1 * ie('Ca'), 'second electron off Mg and Ca is only about twice the first');
ok(A.zeff(11, 11) < 2.5 && A.zeff(9, 9) > 5 && A.zeff(10, 10) > A.zeff(9, 9) && A.zeff(3, 3) < A.zeff(4, 4), 'effective pull: small for Na, large for F and Ne');
console.log(bad ? `\n${bad} check(s) failed` : '\nall atoms checks passed');
process.exitCode = bad ? 1 : 0;
