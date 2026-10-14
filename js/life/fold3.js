/* Fold's chain, in three dimensions.

   Pure model, no DOM, so it can be tested in Node (tools/check-fold.js).

   Sixteen beads on a string. Every bead has an R-group that is greasy,
   water-loving, positive or negative, and nothing else about it is decided.
   The only forces are the ones the chapter names:

     - the backbone: a stiff spring between neighbours;
     - the backbone holding on to itself: a weaker spring between a bead and
       the one three along (hydrogen bonds, which is level two);
     - the water will not have the greasy beads, so greasy attracts greasy;
     - opposite charges pull, like charges push;
     - the water-loving beads would rather be out where the water is;
     - a thermostat, because everything is jostled.

   Nothing says what shape to be. Heat it and the secondary spring and the
   attractions fall away, and the shape goes with them. Two chains that were
   loose at the same moment can fasten to each other, and that stays. */
(function (root) {
  'use strict';
  const N = 16, L0 = 1.0, L3 = 2.1, T_COOK = 340;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  function create(o) {
    o = o || {};
    const rand = rng(o.seed || 7);
    const randn = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rand()))) * Math.cos(2 * Math.PI * rand());
    const W = { seq: o.seq.slice(), nch: o.nch || 1, T: o.T || 300, p: [], links: [], cooked: false, randn, rand, grab: null, t: 0,
      // radius of gyration of a folded ball and of a loose coil: where 'compact' runs from 1 to 0
      lo: 1.2, hi: 2.3 };
    for (let c = 0; c < W.nch; c++) {
      for (let i = 0; i < N; i++) {
        W.p.push({
          x: (i - N / 2) * L0 * 0.95 + (rand() - 0.5) * 0.3,
          y: (c ? 2.2 : -0.6) + Math.sin(i * 0.6) * 0.4 + (rand() - 0.5) * 0.3,
          z: (c ? 1.2 : -0.4) + (rand() - 0.5) * 0.5,
          vx: 0, vy: 0, vz: 0, fx: 0, fy: 0, fz: 0, c, i, k: W.seq[i],
        });
      }
    }
    return W;
  }
  const idx = (c, i) => c * N + i;

  function step(W, dt) {
    const p = W.p, n = p.length;
    const kT = clamp((W.T - 260) / 420, 0.02, 1.1) * (W.T > T_COOK ? 3 : 1);
    const hot = W.T > T_COOK;
    /* In 3D a bead has far more neighbours than on a page, so every pull is
       scaled down to keep a greasy ball from squeezing its beads together. And
       when it is hot the pulls nearly vanish, which is what unfolding is. */
    const sec = hot ? 0.08 : 1, grab = hot ? 0.03 : 0.55;
    for (const a of p) { a.fx = 0; a.fy = 0; a.fz = 0; }
    const pull = (a, b, L, k) => {
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1e-6;
      const f = (k * (d - L)) / d;
      a.fx += f * dx; a.fy += f * dy; a.fz += f * dz; b.fx -= f * dx; b.fy -= f * dy; b.fz -= f * dz;
    };
    for (let c = 0; c < W.nch; c++) {
      for (let i = 0; i < N - 1; i++) pull(p[idx(c, i)], p[idx(c, i + 1)], L0, 26);
      for (let i = 0; i < N - 3; i++) pull(p[idx(c, i)], p[idx(c, i + 3)], L3, 2.6 * sec);
    }
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = p[i], b = p[j];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > 16) continue;
        const d = Math.sqrt(d2) || 1e-6;
        let f = 0;
        if (d < 0.92) f = -34 * (0.92 - d);
        if (a.k === 'grease' && b.k === 'grease' && d < 3.2) f += 1.5 * grab;
        if ((a.k === 'plus' && b.k === 'minus') || (a.k === 'minus' && b.k === 'plus')) { if (d < 3.4) f += 1.3 * grab; }
        if (a.k === b.k && (a.k === 'plus' || a.k === 'minus') && d < 2.6) f -= 1.4;
        if (!f) continue;
        const fx = (f * dx) / d, fy = (f * dy) / d, fz = (f * dz) / d;
        a.fx += fx; a.fy += fy; a.fz += fz; b.fx -= fx; b.fy -= fy; b.fz -= fz;
      }
    }
    let cx = 0, cy = 0, cz = 0;
    for (const a of p) { cx += a.x; cy += a.y; cz += a.z; }
    cx /= n; cy /= n; cz /= n;
    for (const a of p) {
      const dx = a.x - cx, dy = a.y - cy, dz = a.z - cz, d = Math.hypot(dx, dy, dz) || 1e-6;
      if (a.k === 'wet') { a.fx += (dx / d) * 0.6 * grab; a.fy += (dy / d) * 0.6 * grab; a.fz += (dz / d) * 0.6 * grab; }
      const trap = W.T > T_COOK ? 0.006 : 0.04;
      a.fx -= dx * trap; a.fy -= dy * trap; a.fz -= dz * trap;
    }
    W.links.forEach(([i, j]) => pull(p[i], p[j], 1.0, 18));
    /* A bead somebody is holding is pulled toward the finger. The pull is
       capped, so it can stretch a chain but not tear it. And it is applied as
       an equal and opposite pair — the reaction is spread over every bead — so
       the chain as a whole stays where it is and the held bead has to stretch
       away from the rest. Without that the whole lump simply follows the
       finger, which is a drag across the water, not a pull on one end. */
    if (W.grab) {
      const a = p[W.grab.i];
      let gx = (W.grab.x - a.x) * 120, gy = (W.grab.y - a.y) * 120, gz = (W.grab.z - a.z) * 120;
      const gm = Math.hypot(gx, gy, gz), cap = 70;
      if (gm > cap) { gx *= cap / gm; gy *= cap / gm; gz *= cap / gm; }
      for (const b of p) { b.fx -= gx / n; b.fy -= gy / n; b.fz -= gz / n; }
      a.fx += gx - a.vx * 6; a.fy += gy - a.vy * 6; a.fz += gz - a.vz * 6;
    }
    const g = 3.0, c0 = Math.exp(-g * dt), sg = Math.sqrt((1 - c0 * c0) * kT);
    for (const a of p) {
      a.vx = c0 * a.vx + a.fx * dt + sg * W.randn();
      a.vy = c0 * a.vy + a.fy * dt + sg * W.randn();
      a.vz = c0 * a.vz + a.fz * dt + sg * W.randn();
      const sp = Math.hypot(a.vx, a.vy, a.vz);
      if (sp > 14) { const k = 14 / sp; a.vx *= k; a.vy *= k; a.vz *= k; }
      a.x += a.vx * dt; a.y += a.vy * dt; a.z += a.vz * dt;
    }
    if (hot && W.nch > 1 && W.links.length < 10) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (p[i].c === p[j].c || p[i].k !== 'grease' || p[j].k !== 'grease') continue;
          if (W.links.some(([a, b]) => a === i || b === i || a === j || b === j)) continue;
          if (Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y, p[i].z - p[j].z) < 1.5) { W.links.push([i, j]); W.cooked = true; }
        }
      }
    }
    if (hot) W.cooked = true;
    W.t += dt;
  }

  /* The four levels, measured from where the beads are. */
  function levels(W) {
    const p = W.p, n = p.length;
    let cx = 0, cy = 0, cz = 0;
    for (const a of p) { cx += a.x; cy += a.y; cz += a.z; }
    cx /= n; cy /= n; cz /= n;
    let rg = 0, gin = 0, ng = 0, win = 0, nw = 0;
    for (const a of p) {
      const d = Math.hypot(a.x - cx, a.y - cy, a.z - cz);
      rg += d * d;
      if (a.k === 'grease') { gin += d; ng++; }
      if (a.k === 'wet') { win += d; nw++; }
    }
    rg = Math.sqrt(rg / n);
    let holds = 0;
    for (let c = 0; c < W.nch; c++) {
      for (let i = 0; i < N - 3; i++) {
        const a = p[idx(c, i)], b = p[idx(c, i + 3)];
        if (Math.abs(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) - L3) < 0.35) holds++;
      }
    }
    // the backbone's hold on itself is switched off when it is hot, so say so
    if (W.T > T_COOK) holds = 0;
    return {
      rg, holds,
      buried: ng && nw ? clamp(1 - gin / ng / Math.max(0.3, win / nw), -1, 1) : 0,
      compact: clamp(1 - (rg - W.lo) / (W.hi - W.lo), 0, 1),
      joined: W.links.length,
    };
  }

  const api = { create, step, levels, idx, N, L0, L3, T_COOK };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.BL = root.BL || {}).fold3 = api;
})(typeof window !== 'undefined' ? window : globalThis);
