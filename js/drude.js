/* Bond Lab drude: two atoms whose electron clouds can slosh.
   Each atom is a nucleus with a cloud of charge on a spring (a "Drude oscillator").
   The cloud's offset from the nucleus is a tiny dipole that jiggles. Two jiggling
   dipoles near each other push on each other's clouds, and the way they line up
   on average is attractive. That average pull is the London (dispersion)
   force, the van der Waals force between atoms with no permanent charge split.

   2D, atoms on the x axis a distance r apart, offsets d1, d2 (each a 2-vector).
     U = k1|d1|^2/2 + k2|d2|^2/2 + (d1y d2y - 2 d1x d2x) / r^3,  k = 1/alpha
   The instantaneous force flickers in sign; the thermal average is exact:
     F(r) = -(kT/2) Tr[H^-1 dH/dr] with H the Hessian. Pure functions, Node-testable. */
(function (root) {
  'use strict';

  /* polarizability alpha (cubic angstroms), vdW radius (angstroms), LJ epsilon/k (K), boiling point (K) */
  const GASES = [
    { sym: 'He', name: 'Helium', alpha: 0.205, R: 1.40, epsK: 10.2, bp: 4.2 },
    { sym: 'Ne', name: 'Neon', alpha: 0.396, R: 1.54, epsK: 35.6, bp: 27.1 },
    { sym: 'Ar', name: 'Argon', alpha: 1.641, R: 1.88, epsK: 119.8, bp: 87.3 },
    { sym: 'Kr', name: 'Krypton', alpha: 2.484, R: 2.02, epsK: 171, bp: 119.9 },
    { sym: 'Xe', name: 'Xenon', alpha: 4.044, R: 2.16, epsK: 221, bp: 165.1 },
  ];
  const KT = 0.12;                        // default flicker strength (arbitrary units)

  /* thermal-average force along the line of centers; negative = pulling together */
  function meanForce(a1, a2, r, kT) {
    const k1 = 1 / a1, k2 = 1 / a2, r3 = r * r * r;
    let tot = 0;
    [-2 / r3, 1 / r3].forEach((t) => { const D = k1 * k2 - t * t; if (D <= 0) tot = NaN; else tot += 6 * t * t / (r * D); });
    return -(kT / 2) * tot;
  }
  /* free energy of the pair relative to far apart (negative = stuck) */
  function meanEnergy(a1, a2, r, kT) {
    const k1 = 1 / a1, k2 = 1 / a2, r3 = r * r * r; let e = 0;
    [-2 / r3, 1 / r3].forEach((t) => { const D = k1 * k2 - t * t; e += D > 0 ? Math.log(D / (k1 * k2)) : -Infinity; });
    return (kT / 2) * e;
  }

  function create(a1, a2, r, seed) {
    let s = (seed >>> 0) || 7;
    const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    const randn = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
    const D = { a1, a2, r, kT: KT, d: [0, 0, 0, 0], ext: null, Fi: 0, randn, t: 0 };
    return D;
  }
  /* advance by dt (overdamped Langevin, friction 1). Returns instantaneous radial force (+ pushes apart). */
  function step(D, dt) {
    const k1 = 1 / D.a1, k2 = 1 / D.a2, r3 = D.r * D.r * D.r, d = D.d;
    const tx = -2 / r3, ty = 1 / r3;
    // gradient of U
    let g0 = k1 * d[0] + tx * d[2], g1 = k1 * d[1] + ty * d[3], g2 = k2 * d[2] + tx * d[0], g3 = k2 * d[3] + ty * d[1];
    if (D.ext) { const e = D.ext, kk = 6; if (e.i === 0) { g0 += kk * (d[0] - e.x); g1 += kk * (d[1] - e.y); } else { g2 += kk * (d[2] - e.x); g3 += kk * (d[3] - e.y); } }
    const noise = Math.sqrt(2 * D.kT * dt);
    d[0] += -g0 * dt + noise * D.randn(); d[1] += -g1 * dt + noise * D.randn(); d[2] += -g2 * dt + noise * D.randn(); d[3] += -g3 * dt + noise * D.randn();
    const Uc = tx * d[0] * d[2] + ty * d[1] * d[3];
    D.Fi = 3 * Uc / D.r; D.t += dt;
    return D.Fi;
  }

  const api = { GASES, KT, meanForce, meanEnergy, create, step };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.BL = root.BL || {}).drude = api;
})(typeof window !== 'undefined' ? window : globalThis);
