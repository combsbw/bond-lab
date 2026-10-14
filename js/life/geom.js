/* Geometry for small organic molecules: where do the atoms go?

   Given just a list of elements and which are bonded to which, this puts every
   atom — hydrogens included — where a real molecule would hold it. Carbon's
   hands point at the corners of a tetrahedron, so everything follows from the
   angle between them:

     one neighbour    three spare hands, staggered against whatever the
                      neighbour is itself attached to (which is what makes a
                      chain zigzag instead of curl up)
     two neighbours   the two hands left over, either side of their plane
     three            the one gap that is left

   It is the same arithmetic Four Hands does on the fly as you build, lifted out
   so the isomer pairs, the amino acids and anything else fixed can be laid out
   once from a plain description. It does not relax anything: every bond is 1
   long and every angle is ideal, which is a model of what the hands allow and
   not of what a molecule settles into. */
(function () {
  'use strict';
  const K = BL.v3 || null;
  const { v, add, sub, mul, dot, cross, unit, perp, len } = K;
  const TAU = Math.PI * 2;
  const COS_T = -1 / 3, SIN_T = Math.sqrt(8) / 3;
  const VAL = { C: 4, N: 3, O: 2, H: 1, S: 2, P: 5 };
  const TETRA = [v(1, 1, 1), v(1, -1, -1), v(-1, 1, -1), v(-1, -1, 1)].map(unit);

  /* Directions for an atom's free hands.
     nb: unit vectors to neighbours already in place.
     gp: a position-free hint, the direction from the lone neighbour to ITS
         other neighbour, for staggering. */
  function slotDirs(nb, gp, n) {
    if (n <= 0) return [];
    if (nb.length === 0) return TETRA.slice(0, n);
    if (nb.length === 1) {
      const u = nb[0];
      let p;
      if (gp) {
        const gperp = sub(gp, mul(u, dot(gp, u)));
        p = len(gperp) > 1e-6 ? mul(unit(gperp), -1) : perp(u);
      } else p = perp(u);
      const q = cross(u, p), out = [];
      for (let k = 0; k < 3; k++) {
        const t = (k * TAU) / 3;
        out.push(unit(add(mul(u, COS_T), mul(add(mul(p, Math.cos(t)), mul(q, Math.sin(t))), SIN_T))));
      }
      return out.slice(0, n);
    }
    if (nb.length === 2) {
      const s = add(nb[0], nb[1]);
      let nrm = cross(nb[0], nb[1]);
      if (len(nrm) < 1e-5) nrm = perp(nb[0]);
      nrm = unit(nrm);
      const back = len(s) > 1e-6 ? mul(unit(s), -1) : perp(nrm);
      return [unit(add(mul(back, 0.58), mul(nrm, 0.816))), unit(sub(mul(back, 0.58), mul(nrm, 0.816)))].slice(0, n);
    }
    const s3 = nb.reduce(add, v(0, 0, 0));
    return (len(s3) > 1e-6 ? [mul(unit(s3), -1)] : [perp(nb[0])]).slice(0, n);
  }

  /* els: ['C','C','O', ...]   bonds: [[0,1,1],[1,2,1]]  (a, b, order)
     Returns { pos: heavy-atom positions, h: [{of, p}] hydrogens, mid, radius }. */
  function layout(els, bonds, o) {
    o = o || {};
    const n = els.length;
    const adj = els.map(() => []);
    bonds.forEach(([a, b, ord]) => { adj[a].push({ j: b, ord: ord || 1 }); adj[b].push({ j: a, ord: ord || 1 }); });
    const pos = new Array(n).fill(null);
    pos[0] = v(0, 0, 0);
    const queue = [0], parent = new Array(n).fill(-1);
    const freeOf = (i) => (VAL[els[i]] || 4) - adj[i].reduce((t, e) => t + e.ord, 0);
    const hs = [];
    while (queue.length) {
      const i = queue.shift();
      const placed = adj[i].filter((e) => pos[e.j]);
      const todo = adj[i].filter((e) => !pos[e.j]);
      const nb = placed.map((e) => unit(sub(pos[e.j], pos[i])));
      let gp = null;
      if (nb.length === 1) {
        const j = placed[0].j;
        const other = adj[j].find((e) => e.j !== i && pos[e.j]);
        if (other) gp = sub(pos[other.j], pos[j]);
      }
      const dirs = slotDirs(nb, gp, todo.length + Math.max(0, freeOf(i)));
      todo.forEach((e, k) => { pos[e.j] = add(pos[i], mul(dirs[k] || perp(nb[0] || v(1, 0, 0)), 1)); parent[e.j] = i; queue.push(e.j); });
      const hd = dirs.slice(todo.length);
      hd.forEach((d) => hs.push({ of: i, d }));
    }
    const all = pos.concat(hs.map((h2) => add(pos[h2.of], mul(h2.d, 0.72))));
    const mid = mul(all.reduce(add, v(0, 0, 0)), 1 / all.length);
    let radius = 0.8;
    all.forEach((p) => { radius = Math.max(radius, len(sub(p, mid))); });
    return { pos, h: hs, mid, radius, els, bonds };
  }

  BL.geom = { layout, slotDirs, VAL };
})();
