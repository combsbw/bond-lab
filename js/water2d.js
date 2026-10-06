/* Bond Lab water2d: a flat, rigid-body "handshake" molecule model.
   Pure physics, no DOM, so it can be tested in Node (tools/check-water2d.js).

   Each molecule is a disk with four sites on its rim:
     two hands that offer a hydrogen (H, positive end) and
     two hands that receive one (L, a lone pair, negative end).
   An H of one molecule and an L of another attract only when they meet:
   the pull is strongest when the two sites sit on top of each other, so the
   two molecules must be the right distance apart AND turned the right way.
   Like ends (H with H, L with L) push apart a little. Every pair of disks also
   has a weak, direction-free vdW stickiness (Lennard-Jones).

   Units: disk diameter = 1, strength of a perfect handshake = 1, mass = 1.
   Display temperature is scaled so that "water" starts to come apart near 373
   (see TEMP_SCALE). Rigid molecules, Langevin (BAOAB-style) thermostat. */
(function (root) {
  'use strict';

  const D_ARM = 0.56;                    // site distance from the center: two sites meet at 1.12, the LJ minimum
  const W_HB = 0.17;                     // how close the two sites must be (Gaussian width)
  const W_REP = 0.26;                    // reach of the like-end push
  const A_H = (52.25 * Math.PI) / 180;   // the two H hands, either side of the molecule's axis
  const A_L = (125 * Math.PI) / 180;     // the two lone-pair hands
  const SITE_ANG = [A_H, -A_H, A_L, -A_L];            // 0,1 = H ; 2,3 = L
  const INERTIA = 0.15, MASS = 1;
  const RC = 2.5;                        // LJ cutoff
  const RC_SITE2 = 1.95 * 1.95;          // skip site math when centers are farther than this

  /* What kinds of molecule exist. eHb: handshake strength. eLJ: sticky-everywhere strength. */
  const TYPES = {
    water: { id: 'water', eHb: 1.0, eLJ: 0.12, arms: true, name: 'Water-like', note: 'two hands that give, two that receive' },
    weak: { id: 'weak', eHb: 0.22, eLJ: 0.20, arms: true, name: 'Weak hands', note: 'hands, but they barely grip (like H₂S)' },
    none: { id: 'none', eHb: 0, eLJ: 0.13, arms: false, name: 'No hands', note: 'no handshake at all (like methane)' },
  };

  /* Temperature shown to the person = kT * TEMP_SCALE (set so water-like is liquid up to ~373 K). */
  let TEMP_SCALE = 1560;
  const kTfromK = (K) => K / TEMP_SCALE;
  const KfromkT = (kT) => kT * TEMP_SCALE;

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  function create(opts) {
    const o = Object.assign({ n: 40, w: 20, h: 14, type: 'water', K: 300, g: 0.04, gamma: 1.5, seed: 7, layout: 'block' }, opts || {});
    const n = o.n, rand = rng(o.seed);
    const randn = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rand()))) * Math.cos(2 * Math.PI * rand());
    const W = {
      n, w: o.w, h: o.h, type: TYPES[o.type], kT: kTfromK(o.K), g: o.g, gamma: o.gamma, t: 0,
      x: new Float64Array(n), y: new Float64Array(n), th: new Float64Array(n),
      vx: new Float64Array(n), vy: new Float64Array(n), om: new Float64Array(n),
      fx: new Float64Array(n), fy: new Float64Array(n), tq: new Float64Array(n),
      pu: 0, drag: null, randn, rand,
      gx: o.gx || 0,
      hs: new Float64Array(n).fill(1),         // each molecule's hand strength multiplier (pairs use the geometric mean)
      ls: new Float64Array(n).fill(1),         // ... and its stickiness multiplier
      fixed: new Uint8Array(n),                // 1 = nailed down (part of a wall)
      head: null, next: new Int32Array(n), gcols: 0, grows: 0,
      segs: [],                                // inner walls: {x0,y0,x1,y1, wa}  (wa = how strongly it grabs molecules)
      floorWa: 0,                              // adhesion of the floor
      floorFric: 0,                            // sideways drag where the floor grabs (grab strength x this x speed)
    };
    // place molecules in a block at the bottom, or spread in the middle for a pair
    if (o.layout === 'pair') {
      W.x[0] = o.w * 0.35; W.y[0] = o.h * 0.5; W.th[0] = 0;
      if (n > 1) { W.x[1] = o.w * 0.65; W.y[1] = o.h * 0.5; W.th[1] = Math.PI; }
    } else {
      const sp = 1.25, cols = Math.max(1, Math.floor((o.w - 1.4) / sp));
      for (let i = 0; i < n; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        W.x[i] = 0.7 + sp * (c + 0.5 * (r & 1)) + 0.1; W.y[i] = o.h - 0.7 - sp * 0.9 * r; W.th[i] = rand() * 6.2832;
      }
    }
    const s0 = Math.sqrt(W.kT / MASS), s1 = Math.sqrt(W.kT / INERTIA);
    for (let i = 0; i < n; i++) { W.vx[i] = randn() * s0; W.vy[i] = randn() * s0; W.om[i] = randn() * s1; }
    W.setK = (K) => { W.kT = kTfromK(K); };
    W.getK = () => KfromkT(W.kT);
    return W;
  }

  /* world position of site k on molecule i */
  function site(W, i, k, out) {
    const a = W.th[i] + SITE_ANG[k];
    out[0] = W.x[i] + D_ARM * Math.cos(a); out[1] = W.y[i] + D_ARM * Math.sin(a);
  }

  /* forces, torques and potential energy. If `bonds` is an array, bonded site pairs are pushed onto it.
     `acc.like` collects the push between like ends. Pairs are found with a cell grid, so cost grows with N, not N^2. */
  const sA = [0, 0], sB = [0, 0];
  function forces(W, bonds, acc) {
    const n = W.n, T = W.type, eLJ0 = T.eLJ, eHb0 = T.eHb, hs = W.hs, ls = W.ls, fixed = W.fixed;
    W.fx.fill(0); W.fy.fill(0); W.tq.fill(0);
    let U = 0;
    const rc2 = RC * RC;
    // grid
    const gc = Math.max(1, Math.floor(W.w / RC)), gr = Math.max(1, Math.floor(W.h / RC));
    if (!W.head || W.gcols !== gc || W.grows !== gr) { W.head = new Int32Array(gc * gr); W.gcols = gc; W.grows = gr; }
    const head = W.head, next = W.next; head.fill(-1);
    const cw = W.w / gc, chh = W.h / gr;
    for (let i = 0; i < n; i++) {
      const cx = Math.min(gc - 1, Math.max(0, (W.x[i] / cw) | 0)), cy = Math.min(gr - 1, Math.max(0, (W.y[i] / chh) | 0));
      const c = cy * gc + cx; next[i] = head[c]; head[c] = i;
    }
    for (let i = 0; i < n; i++) {
      const cx = Math.min(gc - 1, Math.max(0, (W.x[i] / cw) | 0)), cy = Math.min(gr - 1, Math.max(0, (W.y[i] / chh) | 0));
      for (let oy = -1; oy <= 1; oy++) {
        const yy = cy + oy; if (yy < 0 || yy >= gr) continue;
        for (let ox = -1; ox <= 1; ox++) {
          const xx = cx + ox; if (xx < 0 || xx >= gc) continue;
          for (let j = head[yy * gc + xx]; j !== -1; j = next[j]) {
            if (j <= i) continue;
            if (fixed[i] && fixed[j]) continue;
            const dx = W.x[j] - W.x[i], dy = W.y[j] - W.y[i], r2 = dx * dx + dy * dy;
            if (r2 > rc2) continue;
            const eLJ = eLJ0 * Math.sqrt(ls[i] * ls[j]);
            const ucut = 4 * eLJ * (Math.pow(1 / RC, 12) - Math.pow(1 / RC, 6));
            const ir2 = 1 / r2, ir6 = ir2 * ir2 * ir2, ir12 = ir6 * ir6;
            U += 4 * eLJ * (ir12 - ir6) - ucut;
            const f = 24 * eLJ * (2 * ir12 - ir6) * ir2;
            W.fx[i] -= f * dx; W.fy[i] -= f * dy; W.fx[j] += f * dx; W.fy[j] += f * dy;
            const eHb = eHb0 * Math.sqrt(hs[i] * hs[j]);
            if (!T.arms || eHb === 0 || r2 > RC_SITE2) continue;
            for (let a = 0; a < 4; a++) {
              site(W, i, a, sA);
              for (let b = 0; b < 4; b++) {
                const sameKind = (a < 2) === (b < 2);
                site(W, j, b, sB);
                const sx = sA[0] - sB[0], sy = sA[1] - sB[1], s2 = sx * sx + sy * sy;
                let e, fs;
                if (sameKind) {
                  const w2 = W_REP * W_REP; if (s2 > 9 * w2) continue;
                  const g = 0.28 * eHb * Math.exp(-s2 / (2 * w2)); e = g; fs = g / w2; if (acc) acc.like += g;
                } else {
                  const w2 = W_HB * W_HB; if (s2 > 9 * w2) continue;
                  const g = eHb * Math.exp(-s2 / (2 * w2)); e = -g; fs = -g / w2;
                  if (bonds && g > 0.3 * eHb) bonds.push([i, a, j, b, g / eHb0]);
                }
                U += e;
                const fxA = fs * sx, fyA = fs * sy;
                W.fx[i] += fxA; W.fy[i] += fyA; W.fx[j] -= fxA; W.fy[j] -= fyA;
                const rax = sA[0] - W.x[i], ray = sA[1] - W.y[i], rbx = sB[0] - W.x[j], rby = sB[1] - W.y[j];
                W.tq[i] += rax * fyA - ray * fxA; W.tq[j] += rbx * (-fyA) - rby * (-fxA);
              }
            }
          }
        }
      }
    }
    return U;
  }


  const WALL_L = 0.45;                       // reach of a wall's grab
  /* a thin wall segment (or the floor): rounded hard wall plus an exponential grab. Returns potential energy. */
  function wallForces(W) {
    let U = 0; const R = 0.5, n = W.n, fixed = W.fixed;
    for (let i = 0; i < n; i++) {
      if (fixed[i]) continue;
      for (let k = 0; k < W.segs.length; k++) {
        const sg = W.segs[k]; if (!sg.wa) continue;
        const px = Math.min(Math.max(W.x[i], Math.min(sg.x0, sg.x1)), Math.max(sg.x0, sg.x1)), py = Math.min(Math.max(W.y[i], Math.min(sg.y0, sg.y1)), Math.max(sg.y0, sg.y1));
        const dx = W.x[i] - px, dy = W.y[i] - py, d = Math.hypot(dx, dy);
        if (d < R || d > R + 4 * WALL_L) continue;
        const e = sg.wa * Math.exp(-(d - R) / WALL_L); U -= e;
        const f = e / WALL_L / d;                       // pulls toward the wall
        W.fx[i] -= f * dx; W.fy[i] -= f * dy;
      }
      if (W.floorWa) {
        const d = W.h - W.y[i];
        if (d > R && d < R + 4 * WALL_L) { const e = W.floorWa * Math.exp(-(d - R) / WALL_L); U -= e; W.fy[i] += e / WALL_L; if (W.floorFric) W.fx[i] -= W.floorFric * e * W.vx[i]; }
      }
    }
    return U;
  }
  function wallCollide(W) {
    const R = 0.5, n = W.n;
    for (let i = 0; i < n; i++) {
      if (W.fixed[i]) continue;
      for (let k = 0; k < W.segs.length; k++) {
        const sg = W.segs[k];
        const px = Math.min(Math.max(W.x[i], Math.min(sg.x0, sg.x1)), Math.max(sg.x0, sg.x1)), py = Math.min(Math.max(W.y[i], Math.min(sg.y0, sg.y1)), Math.max(sg.y0, sg.y1));
        let dx = W.x[i] - px, dy = W.y[i] - py, d = Math.hypot(dx, dy);
        if (d >= R) continue;
        if (d < 1e-9) { dx = sg.nx || 1; dy = sg.ny || 0; d = 1; }
        const nx = dx / d, ny = dy / d;
        W.x[i] = px + nx * R; W.y[i] = py + ny * R;
        const vn = W.vx[i] * nx + W.vy[i] * ny; if (vn < 0) { W.vx[i] -= 2 * vn * nx; W.vy[i] -= 2 * vn * ny; }
      }
    }
  }

  /* the user's hand: a spring from molecule d.i to the point (d.x, d.y) */
  function pullForce(W) {
    const d = W.drag; if (!d) return 0;
    const i = d.i;
    if (d.rot) {                                   // turn the molecule so that one of its sites points at the target angle
      let e = d.rot.target - (W.th[i] + SITE_ANG[d.rot.site]);
      e = Math.atan2(Math.sin(e), Math.cos(e));
      W.tq[i] += 6 * e - 1.2 * W.om[i]; d.fx = 0; d.fy = 0;
      return 0;
    }
    const k = d.k || 30, dx = d.x - W.x[i], dy = d.y - W.y[i];
    W.fx[i] += k * dx; W.fy[i] += k * dy;
    d.fx = k * dx; d.fy = k * dy;
    return 0.5 * k * (dx * dx + dy * dy);
  }

  /* one BAOAB step */
  function step(W, dt) {
    const n = W.n, hd = dt / 2, fixed = W.fixed, gx = W.gx || 0;
    if (W.fresh !== true) { W.pu = forces(W) + wallForces(W); pullForce(W); W.fresh = true; }
    for (let i = 0; i < n; i++) { if (fixed[i]) continue; W.vx[i] += (W.fx[i] / MASS + gx) * hd; W.vy[i] += (W.fy[i] / MASS + W.g) * hd; W.om[i] += W.tq[i] / INERTIA * hd; }
    for (let i = 0; i < n; i++) { if (fixed[i]) continue; W.x[i] += W.vx[i] * hd; W.y[i] += W.vy[i] * hd; W.th[i] += W.om[i] * hd; }
    if (W.gamma > 0 && !W.nve) {
      const c = Math.exp(-W.gamma * dt), s0 = Math.sqrt((1 - c * c) * W.kT / MASS), s1 = Math.sqrt((1 - c * c) * W.kT / INERTIA);
      for (let i = 0; i < n; i++) { if (fixed[i]) continue; W.vx[i] = c * W.vx[i] + s0 * W.randn(); W.vy[i] = c * W.vy[i] + s0 * W.randn(); W.om[i] = c * W.om[i] + s1 * W.randn(); }
    }
    for (let i = 0; i < n; i++) { if (fixed[i]) continue; W.x[i] += W.vx[i] * hd; W.y[i] += W.vy[i] * hd; W.th[i] += W.om[i] * hd; }
    // walls
    const R = 0.5, top = W.open ? -1e9 : R;
    for (let i = 0; i < n; i++) {
      if (fixed[i]) continue;
      if (W.x[i] < R) { W.x[i] = 2 * R - W.x[i]; W.vx[i] = Math.abs(W.vx[i]); } else if (W.x[i] > W.w - R) { W.x[i] = 2 * (W.w - R) - W.x[i]; W.vx[i] = -Math.abs(W.vx[i]); }
      if (W.y[i] < top) { W.y[i] = 2 * top - W.y[i]; W.vy[i] = Math.abs(W.vy[i]); } else if (W.y[i] > W.h - R) { W.y[i] = 2 * (W.h - R) - W.y[i]; W.vy[i] = -Math.abs(W.vy[i]); }
    }
    if (W.segs.length) wallCollide(W);
    W.pu = forces(W) + wallForces(W); pullForce(W);
    for (let i = 0; i < n; i++) { if (fixed[i]) continue; W.vx[i] += (W.fx[i] / MASS + gx) * hd; W.vy[i] += (W.fy[i] / MASS + W.g) * hd; W.om[i] += W.tq[i] / INERTIA * hd; }
    W.t += dt;
  }

  /* measurements */
  function neighbors(W, rcut) {
    const rc2 = (rcut || 1.5) * (rcut || 1.5); let c = 0;
    for (let i = 0; i < W.n; i++) for (let j = i + 1; j < W.n; j++) { const dx = W.x[i] - W.x[j], dy = W.y[i] - W.y[j]; if (dx * dx + dy * dy < rc2) c += 2; }
    return c / W.n;
  }
  function handshakes(W) {
    const b = [], acc = { like: 0 }; forces(W, b, acc); W.fresh = false;
    let c = 0, grip = 0; b.forEach((q) => { if (q[4] > 0.5) c++; grip += q[4]; });
    return { list: b, count: c, perMolecule: (2 * c) / W.n, grip, like: acc.like };
  }
  /* kinetic energy: translation + rotation, and the temperature it implies (should match kT) */
  function kinetic(W) { let k = 0; for (let i = 0; i < W.n; i++) if (!W.fixed[i]) k += 0.5 * MASS * (W.vx[i] * W.vx[i] + W.vy[i] * W.vy[i]) + 0.5 * INERTIA * W.om[i] * W.om[i]; return k; }
  /* energy of just two molecules held at the given placement, handy for the pair scene */
  function pairEnergy(type, r, thA, thB) {
    const W = create({ n: 2, w: 30, h: 30, type, K: 1, layout: 'pair' });
    W.x[0] = 10; W.y[0] = 10; W.th[0] = thA; W.x[1] = 10 + r; W.y[1] = 10; W.th[1] = thB;
    return forces(W);
  }
  function setTempScale(v) { TEMP_SCALE = v; }

  const api = { TYPES, SITE_ANG, D_ARM, W_HB, MASS, INERTIA, create, step, forces, site, neighbors, handshakes, kinetic, pairEnergy, kTfromK, KfromkT, setTempScale, pullForce };
  Object.defineProperty(api, 'TEMP_SCALE', { get: () => TEMP_SCALE });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.BL = root.BL || {}).water2d = api;
})(typeof window !== 'undefined' ? window : globalThis);
