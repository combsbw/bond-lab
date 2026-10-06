/* Bond Lab atoms: the numbers behind Rungs, Cloud, Shells and Fill.
   Pure functions and plain data, no DOM, so they can be tested in Node
   (see tools/check-atoms.js).

   Everything is for the first twenty elements, which is all a first
   chemistry course needs and where the shell story is cleanest. */
(function (root) {
  'use strict';

  const RY = 13.605693;        // eV, hydrogen's binding energy
  const HC = 1239.84198;       // eV nm

  /* Z, symbol, name, first ionization energy (eV), electron affinity (eV; negative = an extra electron is not welcome,
     and the value is an estimate), Pauling electronegativity (null where undefined). */
  const ROWS = [
    [1, 'H', 'Hydrogen', 13.598, 0.754, 2.20],
    [2, 'He', 'Helium', 24.587, -0.5, null],
    [3, 'Li', 'Lithium', 5.392, 0.618, 0.98],
    [4, 'Be', 'Beryllium', 9.323, -0.5, 1.57],
    [5, 'B', 'Boron', 8.298, 0.280, 2.04],
    [6, 'C', 'Carbon', 11.260, 1.262, 2.55],
    [7, 'N', 'Nitrogen', 14.534, -0.07, 3.04],
    [8, 'O', 'Oxygen', 13.618, 1.461, 3.44],
    [9, 'F', 'Fluorine', 17.423, 3.401, 3.98],
    [10, 'Ne', 'Neon', 21.565, -1.2, null],
    [11, 'Na', 'Sodium', 5.139, 0.548, 0.93],
    [12, 'Mg', 'Magnesium', 7.646, -0.4, 1.31],
    [13, 'Al', 'Aluminium', 5.986, 0.433, 1.61],
    [14, 'Si', 'Silicon', 8.152, 1.390, 1.90],
    [15, 'P', 'Phosphorus', 10.487, 0.746, 2.19],
    [16, 'S', 'Sulfur', 10.360, 2.077, 2.58],
    [17, 'Cl', 'Chlorine', 12.968, 3.613, 3.16],
    [18, 'Ar', 'Argon', 15.760, -1.0, null],
    [19, 'K', 'Potassium', 4.341, 0.501, 0.82],
    [20, 'Ca', 'Calcium', 6.113, 0.025, 1.00],
  ];
  const EL = ROWS.map(([Z, sym, name, ie, ea, en]) => ({ Z, sym, name, ie, ea, en }));
  const bySym = {};
  EL.forEach((e) => { bySym[e.sym] = e; });

  /* Second ionization energy (eV): the cost of taking a second electron off. H has no second electron. */
  const IE2 = [null, 54.418, 75.640, 18.211, 25.155, 24.383, 29.601, 35.121, 34.971, 40.963, 47.286, 15.035, 18.829, 16.346, 19.770, 23.338, 23.814, 27.630, 31.63, 11.872];
  EL.forEach((e) => { e.ie2 = IE2[e.Z - 1]; });

  /* Pull on the outermost electron after the inner electrons have cancelled part of the nucleus (Slater's rules, s and p only). */
  function zeff(N, Z) {
    const sh = shellsN(N), k = sh.length;
    if (!k) return Z;
    const c = sh[k - 1], a = k > 1 ? sh[k - 2] : 0, b = sh.slice(0, Math.max(0, k - 2)).reduce((x, y) => x + y, 0);
    const S = (k === 1 ? 0.30 : 0.35) * (c - 1) + 0.85 * a + b;
    return Z - S;
  }

  /* Subshells in the order electrons fill them (for the first twenty elements). */
  const SUBSHELLS = [
    { n: 1, l: 0, name: '1s', cap: 2 }, { n: 2, l: 0, name: '2s', cap: 2 }, { n: 2, l: 1, name: '2p', cap: 6 },
    { n: 3, l: 0, name: '3s', cap: 2 }, { n: 3, l: 1, name: '3p', cap: 6 }, { n: 4, l: 0, name: '4s', cap: 2 },
  ];

  /* Fill N electrons into subshells, lowest first. Returns [{...subshell, count}]. */
  function configN(N) {
    let left = N;
    return SUBSHELLS.map((s) => {
      const c = Math.max(0, Math.min(s.cap, left));
      left -= c;
      return Object.assign({}, s, { count: c });
    });
  }
  /* Electrons per shell: {1: 2, 2: 8, ...}, as a list [2, 8, 1]. */
  function shellsN(N) {
    const tot = {};
    configN(N).forEach((s) => { tot[s.n] = (tot[s.n] || 0) + s.count; });
    const out = [];
    Object.keys(tot).map(Number).sort((a, b) => a - b).forEach((n) => { if (tot[n] > 0) out.push(tot[n]); });
    return out;
  }
  const shellCap = (n) => ({ 1: 2, 2: 8, 3: 8, 4: 2 }[n] || 2);
  /* Electrons in the outermost occupied shell. */
  function valenceN(N) { const s = shellsN(N); return s.length ? s[s.length - 1] : 0; }
  /* True when the outermost shell is exactly full: the electron counts of He, Ne, Ar. */
  const isFull = (N) => N === 2 || N === 10 || N === 18;

  /* ---------------- hydrogen-like energy levels ---------------- */
  const levelE = (n, Z) => -RY * (Z || 1) * (Z || 1) / (n * n);            // eV, negative = bound
  const gapE = (lo, hi, Z) => levelE(hi, Z) - levelE(lo, Z);              // eV to go from level lo up to hi
  const wavelength = (E) => HC / E;                                        // nm

  function wavelengthRGB(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 750) { r = 1; }
    let f = 1;
    if (nm < 420) f = 0.35 + 0.65 * (nm - 380) / 40; else if (nm > 700) f = 0.35 + 0.65 * (750 - nm) / 50;
    const c = (v) => Math.round(255 * Math.pow(Math.max(0, v) * f, 0.8));
    return [c(r), c(g), c(b)];
  }
  /* What a photon of this energy is: infrared, visible, or ultraviolet, plus a color to draw it in. */
  function photon(E) {
    const nm = wavelength(E);
    if (nm > 750) return { band: 'infrared', nm, rgb: [140, 30, 30] };
    if (nm < 380) return { band: 'ultraviolet', nm, rgb: [140, 70, 230] };
    return { band: 'visible', nm, rgb: wavelengthRGB(nm) };
  }

  /* ---------------- hydrogen-like orbitals ---------------- */
  /* Radial functions for Z = 1, r in Bohr radii (a0). */
  const RAD = {
    '1,0': (r) => 2 * Math.exp(-r),
    '2,0': (r) => (1 / (2 * Math.SQRT2)) * (2 - r) * Math.exp(-r / 2),
    '2,1': (r) => (1 / (2 * Math.sqrt(6))) * r * Math.exp(-r / 2),
    '3,0': (r) => (2 / (81 * Math.sqrt(3))) * (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3),
    '3,1': (r) => (8 / (27 * Math.sqrt(6))) * r * (1 - r / 6) * Math.exp(-r / 3),
    '3,2': (r) => (4 / (81 * Math.sqrt(30))) * r * r * Math.exp(-r / 3),
  };
  const radial = (n, l, r) => RAD[n + ',' + l](r);
  /* Probability of finding the electron at distance r (per a0): r^2 R^2. */
  const radialProb = (n, l, r) => { const R = radial(n, l, r); return r * r * R * R; };
  const rMax = (n) => ({ 1: 16, 2: 44, 3: 100 }[n]);

  /* Real angular shapes, as functions of a unit direction (x, y, z). */
  const ANG = {
    s: (x, y, z) => 1,
    px: (x, y, z) => x, py: (x, y, z) => y, pz: (x, y, z) => z,
    dz2: (x, y, z) => 0.5 * (3 * z * z - 1),
    dxy: (x, y, z) => Math.sqrt(3) * x * y, dxz: (x, y, z) => Math.sqrt(3) * x * z, dyz: (x, y, z) => Math.sqrt(3) * y * z,
    dx2y2: (x, y, z) => (Math.sqrt(3) / 2) * (x * x - y * y),
  };

  /* A sampler for one orbital: call s.next() to get one snapshot {x, y, z, sign, r}, in a0 / Z. */
  function sampler(n, l, shape, Z) {
    const M = 3000, rm = rMax(n), dr = rm / M;
    const cdf = new Float64Array(M + 1);
    for (let i = 1; i <= M; i++) cdf[i] = cdf[i - 1] + radialProb(n, l, (i - 0.5) * dr);
    const tot = cdf[M];
    const f = ANG[shape], zs = Z || 1;
    function pickR() {
      const u = Math.random() * tot;
      let lo = 0, hi = M;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid; else hi = mid; }
      const frac = (u - cdf[lo]) / Math.max(1e-12, cdf[hi] - cdf[lo]);
      return (lo + frac) * dr;
    }
    function pickDir() {
      for (let tries = 0; tries < 200; tries++) {
        const z = 2 * Math.random() - 1, ph = 2 * Math.PI * Math.random(), s = Math.sqrt(1 - z * z);
        const x = s * Math.cos(ph), y = s * Math.sin(ph);
        const v = f(x, y, z);
        if (Math.random() < v * v) return { x, y, z, v };
      }
      return { x: 0, y: 0, z: 1, v: f(0, 0, 1) };
    }
    return {
      next() {
        const r = pickR(), d = pickDir();
        const sg = (radial(n, l, r) >= 0 ? 1 : -1) * (d.v >= 0 ? 1 : -1);
        return { x: d.x * r / zs, y: d.y * r / zs, z: d.z * r / zs, sign: sg, r: r / zs };
      },
    };
  }
  /* Orbitals offered in Cloud. `shapes` are the real-valued versions that make up each subshell. */
  const ORBITALS = [
    { id: '1s', n: 1, l: 0, shapes: ['s'], names: ['1s'] },
    { id: '2s', n: 2, l: 0, shapes: ['s'], names: ['2s'] },
    { id: '2p', n: 2, l: 1, shapes: ['px', 'py', 'pz'], names: ['2px', '2py', '2pz'] },
    { id: '3s', n: 3, l: 0, shapes: ['s'], names: ['3s'] },
    { id: '3p', n: 3, l: 1, shapes: ['px', 'py', 'pz'], names: ['3px', '3py', '3pz'] },
    { id: '3d', n: 3, l: 2, shapes: ['dz2', 'dxy', 'dxz', 'dyz', 'dx2y2'], names: ['3dz²', '3dxy', '3dxz', '3dyz', '3dx²−y²'] },
  ];

  const api = {
    RY, HC, EL, bySym, SUBSHELLS, configN, shellsN, zeff, shellCap, valenceN, isFull,
    levelE, gapE, wavelength, wavelengthRGB, photon,
    radial, radialProb, rMax, ANG, sampler, ORBITALS,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.BL = root.BL || {}).atoms = api;
})(typeof window !== 'undefined' ? window : globalThis);
