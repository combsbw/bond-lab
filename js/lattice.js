/* Bond Lab lattice: a flat water model on a triangular grid (a Bell-Lavis style model).
   Pure code, no DOM, tested in Node (tools/check-lattice.js).

   Each site of the grid is empty or holds a molecule. A molecule has three
   hands, 120 degrees apart, and can sit in one of two ways: pointing along the
   "even" grid directions (X) or the "odd" ones (Y). Two neighbors shake hands
   when the X one's hand points at the Y one (their hands meet end to end).
   Every pair of neighbors also gets a weak vdW stickiness. A molecule with all
   three hands shaken has the best deal, but the pattern that does that, a
   honeycomb, leaves a third of the sites empty: open and light.

   The grid exchanges molecules with a reservoir (chemical potential mu), the
   way water at a fixed pressure can change volume; the "density" is the fraction
   of sites that hold a molecule. Metropolis Monte Carlo at temperature T.
   Units: strength of one handshake = 1. */
(function (root) {
  'use strict';

  const DX = [1, 0, -1, -1, 0, 1], DY = [0, 1, 1, 0, -1, -1];       // six neighbors, axial coordinates, 60 degrees apart
  const AX = [1, 0.5, -0.5, -1, -0.5, 0.5], AY = [0, 0.8660254, 0.8660254, 0, -0.8660254, -0.8660254];

  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  const KINDS = {
    water: { id: 'water', eHb: 1.0, eVdw: 0.16, name: 'Water-like', note: 'three hands each' },
    plain: { id: 'plain', eHb: 0.0, eVdw: 0.45, name: 'No hands', note: 'only the weak, everywhere stickiness' },
  };

  function create(o) {
    o = Object.assign({ L: 24, kind: 'water', T: 0.4, mu: -1.4, seed: 5 }, o || {});
    const L = o.L, n = L * L, s = new Int8Array(n), rand = rng(o.seed);
    const nb = new Int32Array(n * 6);
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) for (let d = 0; d < 6; d++) nb[(y * L + x) * 6 + d] = ((y + DY[d] + L) % L) * L + ((x + DX[d] + L) % L);
    const G = { L, n, s, nb, kind: KINDS[o.kind], T: o.T, mu: o.mu, rand, sweeps: 0 };
    return G;
  }
  /* energy of site i given the state of everything else, with site i in state v */
  function siteEnergy(G, i, v) {
    if (v === 0) return 0;
    const { s, nb } = G, K = G.kind; let e = 0;
    for (let d = 0; d < 6; d++) {
      const j = nb[i * 6 + d], w = s[j]; if (!w) continue;
      e -= K.eVdw;
      // v = 1 (X): hand along even d; the partner must be Y (2). v = 2 (Y): hand along odd d; the partner must be X (1).
      if (v === 1 && (d & 1) === 0 && w === 2) e -= K.eHb;
      else if (v === 2 && (d & 1) === 1 && w === 1) e -= K.eHb;
      // the partner's hand must also point back: X at j reaches along even d' = d+3 ; Y at j along odd d'. d and d+3 have opposite parity, so a Y at j with d even IS reaching back. Covered by the checks above.
    }
    return e;
  }
  /* one sweep = n attempted changes */
  function sweep(G, times) {
    const { s, n, rand } = G, T = G.T, mu = G.mu;
    for (let t = 0; t < (times || 1); t++) {
      for (let k = 0; k < n; k++) {
        const i = (rand() * n) | 0, cur = s[i];
        let nxt = (rand() * 2) | 0; if (nxt >= cur) nxt++;             // one of the two other states
        const dE = siteEnergy(G, i, nxt) - siteEnergy(G, i, cur) - mu * ((nxt ? 1 : 0) - (cur ? 1 : 0));
        if (dE <= 0 || rand() < Math.exp(-dE / T)) s[i] = nxt;
      }
      G.sweeps++;
    }
  }
  function stats(G) {
    const { s, n, nb } = G; let m = 0, hb = 0;
    for (let i = 0; i < n; i++) { if (!s[i]) continue; m++; for (let d = 0; d < 6; d++) { const j = nb[i * 6 + d]; if (s[i] === 1 && (d & 1) === 0 && s[j] === 2) hb++; } }
    return { density: m / n, bonds: m ? hb / m : 0, molecules: m };           // bonds per molecule (each handshake counted once, so max 1.5)
  }
  /* position of a site in the plane, grid spacing 1 */
  const pos = (G, i) => { const x = i % G.L, y = (i / G.L) | 0; return [x + 0.5 * y, y * 0.8660254]; };

  const api = { KINDS, create, sweep, stats, siteEnergy, pos, DX, DY, AX, AY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.BL = root.BL || {}).lattice = api;
})(typeof window !== 'undefined' ? window : globalThis);
