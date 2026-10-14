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
  const P = { grease: 1.6, headTail: 6, headHead: 8, headHeadR: 3.0, greaseR: 2.6, align: 0.8 };

  function create(opts) {
    const o = Object.assign({ n: 40, tails: 2, head: true, w: 28, h: 17, T: 300, kink: 0, seed: 5 }, opts || {});
    const rand = rng(o.seed);
    const randn = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rand()))) * Math.cos(2 * Math.PI * rand());
    const W = { w: o.w, h: o.h, T: o.T, kink: o.kink, tails: o.tails, head: o.head, p: [], mol: [], rand, randn, t: 0, grab: null };
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

  /* Half the neighbouring cells, so every pair is visited exactly once. */
  const NB = [[1, 0], [-1, 1], [0, 1], [1, 1]];
  const RC = 3;

  function bin(W) {
    const p = W.p, n = p.length;
    let g = W.grid;
    if (!g) {
      const cols = Math.max(1, Math.floor(W.w / RC)), rows = Math.max(1, Math.floor(W.h / RC));
      g = W.grid = { cols, rows, cw: W.w / cols, ch: W.h / rows, head: new Int32Array(cols * rows), next: new Int32Array(n) };
    }
    g.head.fill(-1);
    for (let i = 0; i < n; i++) {
      const cx2 = Math.min(g.cols - 1, Math.max(0, (p[i].x / g.cw) | 0));
      const cy2 = Math.min(g.rows - 1, Math.max(0, (p[i].y / g.ch) | 0));
      const c = cy2 * g.cols + cx2;
      g.next[i] = g.head[c];
      g.head[c] = i;
    }
  }

  /* One pair of particles, in whatever way those two kinds relate. */
  function pair(W, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > RC * RC) return;
    const d = Math.sqrt(d2) || 1e-6;
    const touch = a.r + b.r;
    let f = 0;
    if (d < touch) f = -60 * (touch - d);
    else if (a.m === b.m) return;
    else if (a.grease && b.grease) {
      const cosang = Math.abs(a.dx * b.dx + a.dy * b.dy);
      f = d < P.greaseR ? P.grease * (1 - P.align + P.align * cosang) : 0;
    } else if (a.grease !== b.grease) f = d < 1.9 ? -P.headTail * (1.9 - d) : 0;
    else if (a.head && b.head) f = d < P.headHeadR ? (-P.headHead * (P.headHeadR - d) * 2) / P.headHeadR : 0;
    if (!f) return;
    const fx = (f * dx) / d, fy = (f * dy) / d;
    a.fx += fx; a.fy += fy; b.fx -= fx; b.fy -= fy;
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
    /* Pairs, through a cell grid rather than every particle against every
       other. Nothing reaches further than RC, so a particle only ever has to
       look in its own cell and half of the ones touching it — which turns the
       cost from n² into something close to n and is the difference between
       this settling while you watch and this taking all afternoon. */
    bin(W);
    const { cols, rows, head, next, cw } = W.grid;
    for (let cy2 = 0; cy2 < rows; cy2++) {
      for (let cx2 = 0; cx2 < cols; cx2++) {
        const c0 = cy2 * cols + cx2;
        for (let i = head[c0]; i >= 0; i = next[i]) {
          for (let j = next[i]; j >= 0; j = next[j]) pair(W, p[i], p[j]);
          for (let k = 0; k < 4; k++) {
            const nx = cx2 + NB[k][0], ny = cy2 + NB[k][1];
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
            for (let j = head[ny * cols + nx]; j >= 0; j = next[j]) pair(W, p[i], p[j]);
          }
        }
      }
    }
    /* A bead somebody is holding is pulled toward the finger, capped so it can
       drag a lipid about but never fling one. */
    if (W.grab) {
      const a = p[W.grab.i];
      let gx = (W.grab.x - a.x) * 90, gy = (W.grab.y - a.y) * 90;
      const gm = Math.hypot(gx, gy), cap = 60;
      if (gm > cap) { gx *= cap / gm; gy *= cap / gm; }
      a.fx += gx - a.vx * 5; a.fy += gy - a.vy * 5;
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
    return Math.min(1, Math.max(0, 1 - mixed / 9));
  }

  /* How tightly the tails are packed: how many other molecules' tail beads
     each tail bead is actually touching. Straight tails lie against each other
     all the way down and this is high. A kink means a tail cannot lie flat
     against its neighbour anywhere along its length, and this drops — which is
     the real reason olive oil is liquid in a fridge and butter is not. */
  function packing(W) {
    const t = W.p.filter((a) => a.grease);
    if (!t.length) return 0;
    let tot = 0;
    for (const a of t) {
      let c = 0;
      for (const b of t) { if (a === b || a.m === b.m) continue; if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < 1.44) c++; }
      tot += Math.min(c, 7);
    }
    return tot / t.length;
  }

  /* What the molecules actually made, worked out from where they are rather
     than from what they were supposed to make.

     Clusters are found over the greasy beads. What tells a sheet from a ball
     is the shape of each cluster, not how many there are: a crowd that has
     settled into two separate strips has made a bilayer twice over, and
     calling that "micelles" because there are two of them would be wrong. So
     every cluster big enough to count gets its spread measured along its two
     axes, and the answer is weighted by how many molecules are in each.

     A ball of tails with heads all round the outside is a micelle. The same
     thing with heads on the inside as well is a closed bag — a vesicle, which
     is what a real bilayer does when its ends meet, and what a cell is. */
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

    const stat = (g) => {
      let cx = 0, cy = 0;
      g.forEach((a) => { cx += a.x; cy += a.y; });
      cx /= g.length; cy /= g.length;
      let sxx = 0, syy = 0, sxy = 0;
      g.forEach((a) => { const dx = a.x - cx, dy = a.y - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
      sxx /= g.length; syy /= g.length; sxy /= g.length;
      const tr = sxx + syy, det = sxx * syy - sxy * sxy;
      const d = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
      const l2 = Math.max(1e-6, tr / 2 - d);
      return { cx, cy, aspect: Math.sqrt((tr / 2 + d) / l2), mols: new Set(g.map((a) => a.m)) };
    };

    const big = groups.filter((g) => new Set(g.map((a) => a.m)).size >= 4).map(stat);
    const biggest = big[0] || { aspect: 1, mols: new Set(), cx: 0, cy: 0 };
    let wsum = 0, asum = 0;
    big.forEach((g) => { wsum += g.mols.size; asum += g.aspect * g.mols.size; });
    const aspect = wsum ? asum / wsum : 1;
    const frac = wsum / W.mol.length;

    /* Are any heads tucked inside the biggest cluster rather than all round
       its rim? If so its ends have met and it has closed into a bag. */
    let inside = 0;
    if (W.head && biggest.mols.size) {
      let rmax = 0;
      W.mol.forEach((m) => {
        if (!biggest.mols.has(m.head === undefined ? -1 : W.p[m.head].m)) return;
        rmax = Math.max(rmax, Math.hypot(W.p[m.head].x - biggest.cx, W.p[m.head].y - biggest.cy));
      });
      W.mol.forEach((m) => {
        const a = W.p[m.head];
        if (!biggest.mols.has(a.m)) return;
        if (Math.hypot(a.x - biggest.cx, a.y - biggest.cy) < rmax * 0.45) inside++;
      });
    }

    let kind;
    if (!W.head) kind = 'droplet';
    else if (aspect >= 1.75) kind = 'sheet';
    else if (inside >= 3 && frac > 0.6) kind = 'vesicle';
    else kind = 'micelles';
    return { kind, groups: big.length, biggest: biggest.mols.size, aspect, frac, inside };
  }

  const api = { create, step, hidden, shape, packing, HEAD_R, TAIL_R, P };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.BL = root.BL || {}).lipid = api;
})(typeof window !== 'undefined' ? window : globalThis);
