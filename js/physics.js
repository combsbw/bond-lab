/* Bond Lab physics: energy wells for the six kinds of attraction, and a
   thermostatted two-particle simulation. Pure functions, no DOM, so it can
   be tested in Node (see tools/check-physics.js).

   Units: energy kJ/mol, distance angstrom (A), temperature kelvin.
   Time is in "sim seconds" and is rescaled per bond type so that every
   pair vibrates at a speed the eye can follow. Stiffer wells still vibrate
   faster than soft ones. */
(function (root) {
  'use strict';

  const kB = 0.0083145; // kJ/(mol K)

  function randn() {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* Morse well: short-range, stiff. Minimum -D at r0, zero far away. */
  function morse(D, r0, a) {
    return {
      U(r) { const e = Math.exp(-a * (r - r0)); return D * ((1 - e) * (1 - e) - 1); },
      dU(r) { const e = Math.exp(-a * (r - r0)); return 2 * D * (1 - e) * a * e; },
      k: 2 * D * a * a,
    };
  }

  /* Mie well: attraction falls off as r^-m, repulsion as r^-n.
     m=1 is Coulomb's law (ions), m=6 is London dispersion (van der Waals). */
  function mie(D, r0, m, n) {
    const c = (m * n) / (n - m);
    return {
      U(r) { const x = r0 / r; return D * ((m / (n - m)) * Math.pow(x, n) - (n / (n - m)) * Math.pow(x, m)); },
      dU(r) { const x = r0 / r; return (D * c * (Math.pow(x, m) - Math.pow(x, n))) / r; },
      k: (D * m * n) / (r0 * r0),
    };
  }

  /* D = well depth (kJ/mol), r0 = resting distance (A), R = size of the
     "room" the pair can wander in (A). hz = how fast the pair is allowed to
     vibrate on screen. Real examples in `ex`. */
  const TYPES = {
    covalent: {
      id: 'covalent', name: 'Covalent', ex: 'H–H', front: true,
      D: 436, r0: 0.74, R: 9.0, hz: 3.2, pot: morse(436, 0.74, 1.94),
    },
    ionic: {
      id: 'ionic', name: 'Ionic', ex: 'Na⁺ Cl⁻', front: true,
      D: 500, r0: 2.36, R: 11.0, hz: 1.9, pot: mie(500, 2.36, 1, 9),
    },
    hydrogen: {
      id: 'hydrogen', name: 'Hydrogen', ex: 'O–H···O', front: true,
      D: 20, r0: 1.9, R: 9.0, hz: 2.5, pot: morse(20, 1.9, 1.7),
    },
    dipole: {
      id: 'dipole', name: 'Dipole–dipole', ex: 'HCl···HCl', front: false,
      D: 6, r0: 3.0, R: 10.0, hz: 1.6, pot: mie(6, 3.0, 3, 12),
    },
    iondipole: {
      id: 'iondipole', name: 'Ion–dipole', ex: 'Na⁺···OH₂', front: false,
      D: 100, r0: 2.4, R: 10.0, hz: 2.0, pot: mie(100, 2.4, 2, 9),
    },
    vdw: {
      id: 'vdw', name: 'van der Waals', ex: 'Ar···Ar', front: false,
      D: 1.0, r0: 3.8, R: 12.0, hz: 1.4, pot: mie(1.0, 3.8, 6, 12),
    },
  };

  function bisect(f, lo, hi) {
    // f(lo) and f(hi) have opposite signs
    let flo = f(lo);
    for (let i = 0; i < 60; i++) {
      const mid = 0.5 * (lo + hi);
      const fm = f(mid);
      if ((fm > 0) === (flo > 0)) { lo = mid; flo = fm; } else hi = mid;
    }
    return 0.5 * (lo + hi);
  }

  /* Derived numbers every type needs. */
  Object.values(TYPES).forEach((t) => {
    const U = t.pot.U;
    t.w0 = Math.sqrt(t.pot.k);                        // small-wiggle angular frequency (mass = 1)
    t.tscale = (2 * Math.PI * t.hz) / t.w0;           // sim seconds per real second
    t.rMin = bisect((r) => U(r) - 3 * t.D, 0.05, t.r0);       // hard inner turning point
    t.rShow0 = bisect((r) => U(r) - 0.5 * t.D, 0.05, t.r0);   // where the drawn curve leaves the top
    t.rCut = bisect((r) => U(r) + 0.5 * t.D, t.r0, 200);       // beyond this the pull has halved: call the pair "apart"
    let fmax = 0;
    for (let r = t.r0; r < t.R; r += (t.R - t.r0) / 600) fmax = Math.max(fmax, t.pot.dU(r));
    t.Fmax = fmax;                                    // strongest pull the well can resist (kJ/mol/A)
    // Chance of finding two unrelated particles that close just by wandering.
    t.f0 = (Math.pow(t.rCut, 3) - Math.pow(t.rMin, 3)) / (Math.pow(t.R, 3) - Math.pow(t.rMin, 3));
  });

  /* Long-run fraction of time a pair spends together at temperature T.
     Weights each distance by r^2 (there is more room far away) times the
     Boltzmann factor. Cheap enough to call 100x per frame. */
  function boundFraction(t, T) {
    const kT = kB * T;
    const n = 700;
    const a = t.rMin, b = t.R, dr = (b - a) / n;
    let zb = 0, zf = 0;
    for (let i = 0; i < n; i++) {
      const r = a + (i + 0.5) * dr;
      const w = r * r * Math.exp(-(t.pot.U(r) + t.D) / kT);
      if (r < t.rCut) zb += w; else zf += w;
    }
    return zb / (zb + zf);
  }

  /* Same idea, but with the by-chance share removed, so a pair that has
     really come apart reads 0 and a locked pair reads 1. */
  function togetherness(t, T) {
    return Math.max(0, Math.min(1, (boundFraction(t, T) - t.f0) / (1 - t.f0)));
  }
  const adjust = (t, f) => Math.max(0, Math.min(1, (f - t.f0) / (1 - t.f0)));

  function pairState(t) {
    return { r: t.r0, v: 0 };
  }

  /* One BAOAB Langevin step in the relative coordinate. hand(r) -> extra
     force from the learner's grip (0 when not dragging). */
  function advance(s, t, kT, dt, hand) {
    const g = 0.25 * t.w0;
    const c1 = Math.exp(-g * dt);
    const c2 = Math.sqrt((1 - c1 * c1) * kT);
    const F = (r) => -t.pot.dU(r) + (2 * kT) / r + (hand ? hand(r) : 0);
    s.v += 0.5 * dt * F(s.r);
    s.r += 0.5 * dt * s.v;
    s.v = c1 * s.v + c2 * randn();
    s.r += 0.5 * dt * s.v;
    if (s.r < t.rMin) { s.r = 2 * t.rMin - s.r; s.v = -s.v; }
    if (s.r > t.R) { s.r = 2 * t.R - s.r; s.v = -s.v; }
    s.v += 0.5 * dt * F(s.r);
  }

  /* Advance by `realDt` seconds of wall-clock time. `speed` multiplies the
     rate (time-lapse). */
  function run(s, t, T, realDt, speed, hand) {
    if (!(realDt > 0)) return;
    if (!isFinite(s.r) || !isFinite(s.v)) { s.r = t.r0; s.v = 0; }   // never let a bad frame poison the pair
    const kT = kB * T;
    const simDt = realDt * t.tscale * (speed || 1);
    const h = 0.03 / t.w0;
    const n = Math.min(4000, Math.max(1, Math.ceil(simDt / h)));
    const dt = simDt / n;
    for (let i = 0; i < n; i++) advance(s, t, kT, dt, hand);
  }

  /* Slider position (0..1) <-> temperature on a log scale, 20 K .. 30000 K. */
  const T_MIN = 20, T_MAX = 30000;
  const tempFromSlider = (u) => T_MIN * Math.pow(T_MAX / T_MIN, u);
  const sliderFromTemp = (T) => Math.log(T / T_MIN) / Math.log(T_MAX / T_MIN);

  const api = { kB, TYPES, boundFraction, togetherness, adjust, pairState, advance, run, tempFromSlider, sliderFromTemp, T_MIN, T_MAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.BL = root.BL || {}).physics = api;
})(typeof window !== 'undefined' ? window : globalThis);

