/* Life Lab lipids: amphiphiles in implicit water.

   Pure physics, no DOM, so it can be tuned and tested in Node
   (tools/check-lipid.js). Two Faces draws whatever comes out of here.

   A molecule is one head bead and one, two or three tails of three beads
   each. There is no force in here that pulls molecules into a sheet or a
   ball — the only things in the model are:

     - the water will not have the greasy beads, which shows up as an
       attraction between any two of them — stronger when the two tails are
       lying parallel, because that is when they touch along their length,
       which is why a straight tail grips its neighbours and a kinked one
       does not;
     - a head will not sit down among tails, which shows up as a repulsion
       between a head and any tail that is not its own;
     - heads take up room and push each other apart;
     - nothing may sit on top of anything else.

   What shape falls out is then a matter of what shape the molecule is. Two
   tails under a big head is about as wide at the bottom as at the top, so a
   crowd of them lies flat and makes a sheet. One tail is a wedge, and wedges
   close into a ball. No head at all and there is nothing to face the water
   with, so it is a droplet and nothing else. */
(function (root) {
  'use strict';

  const HEAD_R = 0.82;           // a phosphate head is bulky and charged
  const TAIL_R = 0.5;
  const BOND = 0.95;

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  /* The three numbers that decide what shape a crowd settles into. Tuned
     against tools/check-lipid.js, which is the only reason they are these. */
  const P = { grease: 1.1, headTail: 6, headHead: 8, headHeadR: 3.0, greaseR: 2.6, align: 0.75 };

  function create(opts) {
    const o = Object.assign({ n: 40, tails: 2, head: true, w: 28, h: 17, T: 300, kink: 0, seed: 5 }, opts || {});
    const rand = rng(o.seed);
    const randn = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rand()))) * Math.cos(2 * Math.PI * rand());
    const W = { w: o.w, h: o.h, T: o.T, kink: o.kink, tails: o.tails, head: o.head, p: [], mol: [], rand, randn, t: 0 };
    for (let m = 0; m < o.n; m++) {
      const cx = 1.8 + rand() * (o.w - 3.6), cy = 1.8 + rand() * (o.h - 3.6);
      const a = rand() * Math.PI * 2;
      const mol = { head: W.p.length, tails: [] };
      W.p.push({ x: cx, y: cy, vx: 0, vy: 0, head: o.head, grease: !o.head, r: o.head ? HEAD_R : TAIL_R, m });
      for (let t = 0; t < o.tails; t++) {
        const off = (t - (o.tails - 1) / 2) * 0.55;
        const chain = [];
        for (let b = 0; b < 3; b++) {
          chain.push(W.p.length);
          W.p.push({
            x: cx + Math.cos(a) * (b + 1) * BOND + Math.cos(a + 1.5708) * off,
            y: cy + Math.sin(a) * (b + 1) * BOND + Math.sin(a + 1.5708) * off,
            vx: 0, vy: 0, head: false, grease: true, r: TAIL_R, m,
            // who it sits between along its own tail, so it can know which way it is pointing
            prev: b === 0 ? mol.head : W.p.length - 1, next: -1, dx: 1, dy: 0,
          });
        }
        for (let b = 0; b < 2; b++) W.p[chain[b]].next = chain[b + 1];
        W.p[chain[2]].next = chain[2];
        mol.tails.push(chain);
      }
      W.mol.push(mol);
    }
    return W;
  }

  function step(W, dt) {
    const p = W.p, n = p.length;
    const kT = Math.min(0.45, Math.max(0.004, (W.T - 255) / 520));
    for (let i = 0; i < n; i++) { p[i].fx = 0; p[i].fy = 0; }
    /* Which way each stretch of tail is running. Two stretches lying parallel
       touch along their whole length and grip; two crossing at an angle touch
       at a point and barely do. A kink in a tail means some of it is always at
       an angle to whatever it is lying against. */
    for (let i = 0; i < n; i++) {
      const a = p[i];
      if (!a.grease || a.prev == null) continue;
      const u = p[a.prev], v = p[a.next];
      let dx = v.x - u.x, dy = v.y - u.y;
      const L = Math.hypot(dx, dy) || 1e-6;
      a.dx = dx / L; a.dy = dy / L;
    }
    const spr = (i, j, L, k) => {
      const a = p[i], b = p[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6;
      const f = (k * (d - L)) / d;
      a.fx += f * dx; a.fy += f * dy; b.fx -= f * dx; b.fy -= f * dy;
    };
    W.mol.forEach((m) => {
      m.tails.forEach((ch) => {
        spr(m.head, ch[0], BOND, 70);
        spr(ch[0], ch[1], BOND, 70);
        spr(ch[1], ch[2], BOND, 70);
        // a saturated tail is straight: its two ends want to be far apart.
        // a double bond puts a kink in it and that stops being true.
        spr(m.head, ch[2], 2.85 - W.kink * 1.15, 11);
      });
      for (let t = 1; t < m.tails.length; t++) spr(m.tails[t - 1][0], m.tails[t][0], 0.66, 30);
    });
    for (let i = 0; i < n; i++) {
      const a = p[i];
      for (let j = i + 1; j < n; j++) {
        const b = p[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 9) continue;
        const d = Math.sqrt(d2) || 1e-6;
        const touch = a.r + b.r;
        let f = 0;
        if (d < touch) f = -60 * (touch - d);
        else if (a.m === b.m) f = 0;
        else if (a.grease && b.grease) {
          const cosang = Math.abs(a.dx * b.dx + a.dy * b.dy);
          f = d < P.greaseR ? P.grease * (1 - P.align + P.align * cosang) : 0;
        }
        else if (a.grease !== b.grease) f = d < 1.9 ? -P.headTail * (1.9 - d) : 0;
        else if (a.head && b.head) f = d < P.headHeadR ? -P.headHead * (P.headHeadR - d) / P.headHeadR * 2 : 0;
        if (!f) continue;
        const fx = (f * dx) / d, fy = (f * dy) / d;
        a.fx += fx; a.fy += fy; b.fx -= fx; b.fy -= fy;
      }
    }
    const g = 4.0, c0 = Math.exp(-g * dt), sg = Math.sqrt((1 - c0 * c0) * kT);
    for (let i = 0; i < n; i++) {
      const a = p[i];
      a.vx = c0 * a.vx + a.fx * dt + sg * W.randn();
      a.vy = c0 * a.vy + a.fy * dt + sg * W.randn();
      const sp = Math.hypot(a.vx, a.vy);
      if (sp > 9) { a.vx *= 9 / sp; a.vy *= 9 / sp; }
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.x < a.r) { a.x = a.r; a.vx = Math.abs(a.vx); }
      if (a.x > W.w - a.r) { a.x = W.w - a.r; a.vx = -Math.abs(a.vx); }
      if (a.y < a.r) { a.y = a.r; a.vy = Math.abs(a.vy); }
      if (a.y > W.h - a.r) { a.y = W.h - a.r; a.vy = -Math.abs(a.vy); }
    }
    W.t += dt;
  }

  /* How well the tails have got out of the water.

     Counting how many tails each tail is next to does not work: in 2D at this
     density they are next to each other from the start. What does tell the two
     states apart is whether the heads are still mixed in among the tails.
     Scattered, every head has other molecules' tails all round it. Sorted out,
     the heads are on the outside and the tails are in the middle, and a head
     has almost no foreign tail near it. Which is the same statement as "the
     tails are out of the water", seen from the other side. */
  function hidden(W) {
    if (!W.head) {
      // no heads to go by, so fall back on how much of one lump it has made
      return Math.min(1, shape(W).frac);
    }
    let tot = 0;
    W.mol.forEach((m) => {
      const a = W.p[m.head];
      let c = 0;
      for (const b of W.p) { if (!b.grease || b.m === a.m) continue; if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < 2.2 * 2.2) c++; }
      tot += Math.min(c, 12);
    });
    const mixed = tot / W.mol.length;
    return Math.min(1, Math.max(0, 1 - mixed / 7));
  }

  /* What the molecules actually made, worked out from where they are rather
     than from what they were supposed to make. Clusters are found over the
     greasy beads; the biggest one's two principal spreads say whether it is a
     strip or a blob. */
  function shape(W) {
    const t = W.p.filter((a) => a.grease);
    const seen = new Set(), groups = [];
    t.forEach((s0) => {
      if (seen.has(s0)) return;
      const g = [], q = [s0];
      seen.add(s0);
      while (q.length) {
        const a = q.pop();
        g.push(a);
        t.forEach((b) => { if (!seen.has(b) && (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < 2.3 * 2.3) { seen.add(b); q.push(b); } });
      }
      groups.push(g);
    });
    groups.sort((a, b) => b.length - a.length);
    const big = groups[0] || [];
    const mols = new Set(big.map((a) => a.m));
    let cx = 0, cy = 0;
    big.forEach((a) => { cx += a.x; cy += a.y; });
    cx /= Math.max(1, big.length); cy /= Math.max(1, big.length);
    let sxx = 0, syy = 0, sxy = 0;
    big.forEach((a) => { const dx = a.x - cx, dy = a.y - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    const nb = Math.max(1, big.length);
    sxx /= nb; syy /= nb; sxy /= nb;
    const tr = sxx + syy, det = sxx * syy - sxy * sxy;
    const d = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
    const l1 = tr / 2 + d, l2 = Math.max(1e-6, tr / 2 - d);
    const aspect = Math.sqrt(l1 / l2);
    const frac = mols.size / W.mol.length;
    let kind;
    if (!W.head) kind = 'droplet';
    else if (groups.length >= 3 && frac < 0.55) kind = 'micelles';
    else if (aspect >= 1.9) kind = 'sheet';
    else if (frac > 0.7) kind = 'vesicle';
    else kind = 'micelles';
    return { kind, groups: groups.length, biggest: mols.size, aspect, frac };
  }

  const api = { create, step, hidden, shape, HEAD_R, TAIL_R, P };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.BL = root.BL || {}).lipid = api;
})(typeof window !== 'undefined' ? window : globalThis);
