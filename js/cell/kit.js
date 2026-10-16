/* The Cell Lab's kit: what is in a cell, who has it, and how to draw it.

   Two halves.

   The first is plain data and has no DOM in it, so tools/check-cell.js can run
   it in Node. Every structure the chapter names is one row: which of the six
   jobs it belongs to, whether it is a ROOM (a membrane-bound compartment — the
   chapter's master boundary), which cell types have it, and what it does in a
   sentence. Three Cells, the challenges and the checks all read this table, so
   there is exactly one place where "does a bacterium have a Golgi?" is answered.

   The second half is drawing. A cell is a three-dimensional object and so is
   everything in it, so the pieces here are 3D primitives that go through the
   same depth-sorted list as every other solid in the lab (js/view3d.js):

     ball    a lit sphere, optionally see-through
     blob    an ellipsoid (a mitochondrion, a vacuole) from its long axis
     disc    a flat disc facing any way (one sheet of ER, one plate of Golgi)
     rod     a capsule (a bacterium, its wall, its capsule)
     fibre   a line in space

   Colour is the one-meaning-per-colour rule at work: the six jobs each have a
   token (css/style.css, --fn-*) and a structure is always drawn in its job's
   colour, in every instrument, so a learner who has met the Golgi once as blue
   knows the next blue thing is protein management. */
(function () {
  'use strict';
  const BL = window.BL = window.BL || {};
  const K = BL.cell = {};

  /* ============================================================ DATA */

  /* The six jobs, in the order the chapter's function table gives them. */
  K.FN = [
    { id: 'struct', name: 'Structure and support', short: 'Shape', job: 'hold the shape and keep the contents in' },
    { id: 'energy', name: 'Energy production', short: 'Energy', job: 'make ATP, or capture light to make sugar' },
    { id: 'protein', name: 'Protein management', short: 'Proteins', job: 'build, process and ship proteins' },
    { id: 'store', name: 'Storage and maintenance', short: 'Clean-up', job: 'break down, detoxify and store' },
    { id: 'divide', name: 'Cellular division', short: 'Division', job: 'organise the machinery that pulls a cell in two' },
    { id: 'genetic', name: 'Genetic control', short: 'The plans', job: 'hold and regulate the DNA' },
  ];
  K.fn = (id) => K.FN.find((f) => f.id === id);

  /* kind:
       'room'      a membrane-bound compartment. This is the chapter's master
                   boundary: the rooms are what eukaryotes have and prokaryotes do not.
       'boundary'  the cell's own membrane. A membrane, but it is the outside of
                   the bag rather than a room inside it.
       'fitting'   everything else: no membrane of its own.
     animal / plant / bact: the chapter's own chart, "Where does it live?".
     charted:false marks the few things the chapter names that its chart leaves out. */
  K.STRUCTS = [
    { id: 'membrane', name: 'Plasma membrane', fn: 'struct', kind: 'boundary', animal: 1, plant: 1, bact: 1,
      job: 'A double layer of phospholipids around every cell. Heads face the water, tails hide in the middle, and the pieces drift about without ever coming apart: the fluid mosaic.' },
    { id: 'cytoplasm', name: 'Cytoplasm', fn: 'struct', kind: 'fitting', animal: 1, plant: 1, bact: 1,
      job: 'Everything inside the membrane. The gel that fills it is the cytosol, and every organelle floats in it.' },
    { id: 'cytoskeleton', name: 'Cytoskeleton', fn: 'struct', kind: 'fitting', animal: 1, plant: 1, bact: 0, charted: false,
      job: 'A scaffold of protein fibres inside the cytosol. It holds the cell’s shape and moves things — organelles included — from place to place.' },
    { id: 'wall', name: 'Cell wall', fn: 'struct', kind: 'fitting', animal: 0, plant: 1, bact: 1,
      job: 'An extra layer outside the membrane. Cellulose in a plant, peptidoglycan in a bacterium (Archaea have none).' },
    { id: 'capsule', name: 'Capsule', fn: 'struct', kind: 'fitting', animal: 0, plant: 0, bact: 1,
      job: 'A bacterium’s outermost coat, mostly carbohydrate. It stops the cell drying out and helps it stick to things.' },
    { id: 'pili', name: 'Pili', fn: 'struct', kind: 'fitting', animal: 0, plant: 0, bact: 1,
      job: 'Hair-like fibres that stick out through the capsule. They grip surfaces — and, as you will see in Rings, other bacteria.' },
    { id: 'cilia', name: 'Cilia', fn: 'struct', kind: 'fitting', animal: 1, plant: 0, bact: 0,
      job: 'Short beating hairs on the outside of some animal cells that sweep things past or move the cell.' },
    { id: 'flagella', name: 'Flagella', fn: 'struct', kind: 'fitting', animal: 1, plant: 1, bact: 1,
      job: 'A long whip that swims the cell along. Found in some cells of all three kinds.' },

    { id: 'mito', name: 'Mitochondrion', fn: 'energy', kind: 'room', animal: 1, plant: 1, bact: 0,
      job: 'Double-membrane room where cellular respiration turns glucose into ATP. The more energy a cell needs, the more it has.' },
    { id: 'chloro', name: 'Chloroplast', fn: 'energy', kind: 'room', animal: 0, plant: 1, bact: 0, charted: false,
      job: 'Where photosynthesis happens. Stacks of thylakoids hold chlorophyll, which catches sunlight to build glucose from CO₂ and water. Only autotrophs have them.' },

    { id: 'ribosome', name: 'Ribosome', fn: 'protein', kind: 'fitting', animal: 1, plant: 1, bact: 1,
      job: 'Builds protein. No membrane, so it is in all three kinds of cell — free in the cytosol or stuck to the ER.' },
    { id: 'er', name: 'Endoplasmic reticulum', fn: 'protein', kind: 'room', animal: 1, plant: 1, bact: 0,
      job: 'A maze of membrane sheets running out from the nucleus. Rough ER (ribosomes on it) processes protein; smooth ER has none.' },
    { id: 'vesicle', name: 'Vesicle', fn: 'protein', kind: 'room', animal: 1, plant: 1, bact: 0, charted: false,
      job: 'A small membrane bubble that carries protein from one room to the next — from the rough ER to the Golgi, and from the Golgi out.' },
    { id: 'golgi', name: 'Golgi apparatus', fn: 'protein', kind: 'room', animal: 1, plant: 1, bact: 0,
      job: 'Receives vesicles, finishes and sorts what is in them, repackages it and ships it. The factory’s shipping department.' },

    { id: 'lysosome', name: 'Lysosome', fn: 'store', kind: 'room', animal: 1, plant: 0, bact: 0,
      job: 'An acidic room that digests worn-out organelles and spare molecules. A recycling stomach, and almost only in animal cells.' },
    { id: 'peroxisome', name: 'Peroxisome', fn: 'store', kind: 'room', animal: 1, plant: 1, bact: 0,
      job: 'Breaks down fatty acids and amino acids, and turns the poisonous hydrogen peroxide that makes into water and oxygen.' },
    { id: 'vacuole', name: 'Vacuole', fn: 'store', kind: 'room', animal: 1, plant: 1, bact: 0,
      job: 'Stores and exports waste. A plant’s one big central vacuole can fill 80% of the cell, and its pressure holds the wall out.' },

    { id: 'centrosome', name: 'Centrosome', fn: 'divide', kind: 'fitting', animal: 1, plant: 0, bact: 0,
      job: 'Two centrioles standing at right angles. It copies itself before a cell divides and helps pull the two halves apart.' },

    { id: 'nucleus', name: 'Nucleus', fn: 'genetic', kind: 'room', animal: 1, plant: 1, bact: 0,
      job: 'The storehouse for a eukaryote’s DNA. A double membrane with pores in it, a fluid inside (nucleoplasm) and a dense patch (the nucleolus) where ribosome parts are made.' },
    { id: 'dna', name: 'DNA', fn: 'genetic', kind: 'fitting', animal: 1, plant: 1, bact: 1,
      job: 'The plans. In every cell; what differs is where it is kept and how it is packed.' },
    { id: 'nucleoid', name: 'Nucleoid', fn: 'genetic', kind: 'fitting', animal: 0, plant: 0, bact: 1,
      job: 'The region of a bacterium where its DNA sits — a ring, with no membrane around it at all.' },
    { id: 'plasmid', name: 'Plasmid', fn: 'genetic', kind: 'fitting', animal: 0, plant: 1, bact: 1,
      job: 'Small extra rings of DNA, apart from the main chromosome. Bacteria pass them to each other, and they can carry resistance to antibiotics.' },
  ];
  K.struct = (id) => K.STRUCTS.find((s) => s.id === id);

  K.TYPES = {
    animal: { id: 'animal', name: 'Animal cell', short: 'Animal', domain: 'Eukarya', rooms: true },
    plant: { id: 'plant', name: 'Plant cell', short: 'Plant', domain: 'Eukarya', rooms: true },
    bact: { id: 'bact', name: 'Bacterium', short: 'Bacterium', domain: 'Bacteria', rooms: false },
  };
  K.has = (s, type) => !!(typeof s === 'string' ? K.struct(s) : s)[type];

  /* How many rooms does each kind of cell have? Counts the structures the chart lists. */
  K.rooms = (type) => K.STRUCTS.filter((s) => s.kind === 'room' && s[type]);

  /* The master boundary as a prediction: would this structure need a room? */
  K.needsRoom = (s) => (typeof s === 'string' ? K.struct(s) : s).kind === 'room';

  /* ---- a seeded random, so a cell is the same cell every time it is drawn ---- */
  K.rng = function (seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };

  /* ============================================================ LAYOUTS
     Where everything sits, in the cell's own units (an animal cell is about 1 across,
     a bacterium is a rod about 2.4 long). Each entry is a thing to draw:
       s  which structure it is        p  where             r / a,b / R  how big
     Positions are generated from a seed so the cells look organic, not placed. */
  const v = (x, y, z) => ({ x, y, z });
  const norm = (a) => { const L = Math.hypot(a.x, a.y, a.z) || 1; return v(a.x / L, a.y / L, a.z / L); };
  function around(R, rand, minR) { // a random point in a shell
    for (let i = 0; i < 40; i++) {
      const p = v((rand() * 2 - 1) * R, (rand() * 2 - 1) * R, (rand() * 2 - 1) * R);
      const L = Math.hypot(p.x, p.y, p.z);
      if (L < R && L > (minR || 0)) return p;
    }
    return v(R * 0.5, 0, 0);
  }
  const far = (p, list, d) => list.every((q) => Math.hypot(p.x - q.p.x, p.y - q.p.y, p.z - q.p.z) > d + (q.r || 0.1));

  K.layout = function (type) {
    const rand = K.rng({ animal: 11, plant: 23, bact: 37 }[type]), out = [];
    const put = (o) => { out.push(o); return o; };
    const place = (s, R, count, a, b, keep) => {
      for (let i = 0; i < count; i++) {
        let p, tries = 0;
        do { p = around(R, rand, keep || 0); tries++; } while (!far(p, out, (a || 0.1) * 1.1) && tries < 60);
        const axis = norm(v(rand() - 0.5, rand() - 0.5, rand() - 0.5));
        put({ s, p, axis, a: a || 0.1, b: b || a || 0.1, r: b || a || 0.1 });
      }
    };

    if (type === 'animal') {
      const N = put({ s: 'nucleus', p: v(-0.14, 0.04, 0), r: 0.34, axis: v(1, 0, 0), a: 0.34, b: 0.34 });
      put({ s: 'er', p: v(N.p.x + 0.44, N.p.y + 0.02, N.p.z + 0.1), n: norm(v(1, 0.15, 0.2)), R: 0.3, count: 4, gap: 0.075, r: 0.3, a: 0.3, b: 0.3 });
      put({ s: 'golgi', p: v(0.46, -0.34, -0.12), n: norm(v(0.3, 1, 0.2)), R: 0.19, count: 5, gap: 0.06, r: 0.19, a: 0.19, b: 0.19 });
      put({ s: 'centrosome', p: v(-0.06, 0.5, 0.2), r: 0.07, a: 0.07, b: 0.07 });
      place('mito', 0.82, 5, 0.17, 0.08, 0.35);
      place('lysosome', 0.8, 4, 0.07, 0.07, 0.3);
      place('peroxisome', 0.8, 3, 0.06, 0.06, 0.3);
      place('vacuole', 0.78, 2, 0.1, 0.1, 0.3);
      for (let i = 0; i < 4; i++) put({ s: 'vesicle', p: v(0.5 + (rand() - 0.5) * 0.1, -0.12 + i * -0.05, -0.02 + (rand() - 0.5) * 0.15), r: 0.035, a: 0.035, b: 0.035 });
    } else if (type === 'plant') {
      put({ s: 'vacuole', p: v(0.12, -0.02, 0), r: 0.5, a: 0.78, b: 0.5, axis: v(1, 0, 0), big: true });
      put({ s: 'nucleus', p: v(-0.82, 0.38, 0.18), r: 0.2, axis: v(1, 0, 0), a: 0.2, b: 0.2 });
      put({ s: 'er', p: v(-0.82, 0.0, 0.3), n: norm(v(1, 0.2, 0.1)), R: 0.2, count: 3, gap: 0.06, r: 0.2, a: 0.2, b: 0.2 });
      put({ s: 'golgi', p: v(-0.78, -0.4, -0.2), n: norm(v(0.3, 1, 0.2)), R: 0.14, count: 4, gap: 0.05, r: 0.14, a: 0.14, b: 0.14 });
      // chloroplasts and mitochondria sit out along the wall, round the big vacuole
      const wall = [v(0.2, 0.66, 0.2), v(0.7, 0.62, -0.25), v(-0.3, 0.62, -0.35), v(0.5, -0.64, 0.3), v(0.0, -0.64, -0.3), v(-0.4, -0.6, 0.2)];
      wall.forEach((p, i) => put({ s: 'chloro', p, axis: norm(v(1, 0.1 * (i - 2), 0.3)), a: 0.18, b: 0.1, r: 0.12 }));
      [v(0.9, 0.1, 0.4), v(0.85, -0.3, -0.45), v(-0.5, 0.05, -0.55)].forEach((p) => put({ s: 'mito', p, axis: norm(v(rand() - 0.5, rand() - 0.5, rand() - 0.5)), a: 0.13, b: 0.065, r: 0.08 }));
      [v(-0.9, -0.1, -0.45), v(0.75, 0.45, 0.5)].forEach((p) => put({ s: 'peroxisome', p, a: 0.055, b: 0.055, r: 0.055 }));
      put({ s: 'plasmid', p: v(-0.45, -0.58, -0.1), r: 0.06, a: 0.06, b: 0.06, axis: v(0, 1, 0.3) });
    } else {
      // a rod lying along x: the nucleoid in the middle, rings and ribosomes round it
      put({ s: 'nucleoid', p: v(0, 0, 0), a: 0.46, b: 0.28, r: 0.28, axis: v(1, 0, 0) });
      [v(0.62, 0.2, 0.12), v(-0.62, -0.2, 0.15), v(0.28, -0.32, -0.2)].forEach((p, i) => put({ s: 'plasmid', p, r: 0.1, a: 0.1, b: 0.1, axis: norm(v(0.2 * i, 1, 0.4)) }));
    }
    return out;
  };

  /* ribosome dots and fibre end-points: lots of tiny things, so they get their own list */
  K.specks = function (type) {
    const rand = K.rng({ animal: 5, plant: 7, bact: 9 }[type]), out = [];
    const n = type === 'bact' ? 160 : 60;
    for (let i = 0; i < n; i++) {
      let p;
      if (type === 'bact') p = v((rand() * 2 - 1) * 0.95, (rand() * 2 - 1) * 0.5, (rand() * 2 - 1) * 0.5);
      else if (type === 'plant') p = v((rand() * 2 - 1) * 1.0, (rand() * 2 - 1) * 0.72, (rand() * 2 - 1) * 0.72);
      else p = around(0.9, rand, 0);
      if (type === 'bact' && (Math.hypot(p.y, p.z) > 0.5 || Math.abs(p.x) > 0.95 - Math.max(0, Math.hypot(p.y, p.z) * 0.9))) continue;
      if (type === 'bact' && Math.abs(p.x) < 0.52 && Math.hypot(p.y, p.z) < 0.3) continue;   // keep the nucleoid clear
      out.push(p);
    }
    return out;
  };

  /* ============================================================ DRAWING
     Everything below needs a canvas. It is only ever called from an instrument. */
  const TAU = Math.PI * 2;
  const col = (k) => BL.pal.fn[k];

  /* a see-through-able lit sphere at a point in the cell's own space */
  K.ball = function (ctx, V, p, R, color, o) {
    o = o || {};
    const q = V.project(p), r = R * V.scale * q.s;
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    BL.sphere3(ctx, q, r / (0.7 + 0.38 * q.d), color, null, o.ring ? { ring: o.ring } : null);
    ctx.restore();
    return { x: q.x, y: q.y, z: q.z, r };
  };

  /* an ellipsoid with half-length a along `axis` and radius b across it */
  K.blob = function (ctx, V, p, axis, a, b, color, o) {
    o = o || {};
    const q = V.project(p), tip = V.project(v(p.x + axis.x * a, p.y + axis.y * a, p.z + axis.z * a));
    const minor = Math.max(2, b * V.scale * q.s);
    let major = Math.hypot(tip.x - q.x, tip.y - q.y), ang = Math.atan2(tip.y - q.y, tip.x - q.x);
    if (major < minor) { major = minor; }
    const pal = BL.pal, c = BL.mixHex(color, pal.bg, (1 - q.d) * 0.22);
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.translate(q.x, q.y); ctx.rotate(ang);
    const g = ctx.createRadialGradient(-major * 0.25, -minor * 0.35, minor * 0.1, 0, 0, Math.max(major, minor));
    g.addColorStop(0, BL.mixHex(c, '#ffffff', o.flat ? 0.1 : 0.42)); g.addColorStop(0.6, c); g.addColorStop(1, BL.mixHex(c, '#000000', pal.dark ? 0.12 : 0.24));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, major, minor, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = o.line || 1.6; ctx.strokeStyle = o.stroke || BL.alpha(pal.fg, 0.3); ctx.stroke();
    if (o.inner) o.inner(ctx, major, minor);
    ctx.restore();
    return { x: q.x, y: q.y, z: q.z, r: Math.max(major, minor), ang, major, minor };
  };

  /* a flat disc of radius R standing in the plane spanned by unit vectors u and w */
  K.disc = function (ctx, V, p, u, w, R, color, o) {
    o = o || {};
    const q = V.project(p), a = V.project(v(p.x + u.x * R, p.y + u.y * R, p.z + u.z * R)), b = V.project(v(p.x + w.x * R, p.y + w.y * R, p.z + w.z * R));
    const pal = BL.pal, c = BL.mixHex(color, pal.bg, (1 - q.d) * 0.22);
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.transform(a.x - q.x, a.y - q.y, b.x - q.x, b.y - q.y, q.x, q.y);
    const g = ctx.createRadialGradient(-0.3, -0.35, 0.05, 0, 0, 1);
    g.addColorStop(0, BL.mixHex(c, '#ffffff', 0.35)); g.addColorStop(0.7, c); g.addColorStop(1, BL.mixHex(c, '#000000', pal.dark ? 0.1 : 0.2));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
    ctx.lineWidth = (o.line || 1.5) / Math.max(1, Math.hypot(a.x - q.x, a.y - q.y)); ctx.strokeStyle = o.stroke || BL.alpha(pal.fg, 0.32); ctx.stroke();
    ctx.restore();
    return { x: q.x, y: q.y, z: q.z, r: Math.max(Math.hypot(a.x - q.x, a.y - q.y), Math.hypot(b.x - q.x, b.y - q.y)) };
  };

  /* a capsule between two points, of radius R: a bacterium, its wall, its capsule */
  K.rod = function (ctx, V, A, B, R, color, o) {
    o = o || {};
    const a = V.project(A), b = V.project(B), r = R * V.scale * (a.s + b.s) / 2;
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.lineCap = 'round';
    if (o.fill !== false) { ctx.strokeStyle = color; ctx.lineWidth = r * 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    if (o.edge) { // an outline: the capsule's own boundary, stroked
      ctx.restore(); ctx.save();
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.strokeStyle = o.edge; ctx.lineWidth = o.edgeW || 4; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.arc(a.x, a.y, r, ang + Math.PI / 2, ang + Math.PI * 1.5); ctx.arc(b.x, b.y, r, ang - Math.PI / 2, ang + Math.PI / 2); ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, r };
  };

  K.fibre = function (ctx, V, A, B, w, color, alpha) {
    const a = V.project(A), b = V.project(B);
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
  };

  /* a ring (a plasmid, a pore) of radius R in the plane of u and w */
  K.ring = function (ctx, V, p, u, w, R, color, lw, alpha) {
    const q = V.project(p), a = V.project(v(p.x + u.x * R, p.y + u.y * R, p.z + u.z * R)), b = V.project(v(p.x + w.x * R, p.y + w.y * R, p.z + w.z * R));
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.transform(a.x - q.x, a.y - q.y, b.x - q.x, b.y - q.y, q.x, q.y);
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, lw) / Math.max(1, Math.hypot(a.x - q.x, a.y - q.y));
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.stroke(); ctx.restore();
    return { x: q.x, y: q.y, z: q.z, r: Math.hypot(a.x - q.x, a.y - q.y) };
  };

  /* A unit vector at right angles to n, and one at right angles to both. */
  K.frame = function (n) {
    const u = BL.v3.perp(n), w = BL.v3.unit(BL.v3.cross(n, u));
    return { u, w };
  };

  /* ---- one structure, drawn. inst is a layout entry; returns the screen circle it occupies ---- */
  K.drawInst = function (ctx, V, inst, o) {
    o = o || {};
    const pal = BL.pal, k = o.alpha == null ? 1 : o.alpha, fn = (id) => col(K.struct(id).fn), s = inst.s;
    const hl = o.hl === inst, dim = o.dim && !hl ? 0.28 : 1, A = k * dim;
    let info;
    if (s === 'nucleus') {
      info = K.ball(ctx, V, inst.p, inst.r, fn('nucleus'), { alpha: 0.62 * A, ring: BL.alpha(fn('nucleus'), 0.9) });
      K.ball(ctx, V, inst.p, inst.r * 0.38, BL.mixHex(fn('nucleus'), '#000000', 0.2), { alpha: A });          // the nucleolus
      // pores: little rings on whichever part of the envelope faces us
      const rand = K.rng(3);
      for (let i = 0; i < 14; i++) {
        const nrm = norm(v(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1)), pt = v(inst.p.x + nrm.x * inst.r, inst.p.y + nrm.y * inst.r, inst.p.z + nrm.z * inst.r), f = K.frame(nrm);
        K.ring(ctx, V, pt, f.u, f.w, inst.r * 0.09, BL.alpha(pal.fg, 0.7), 1.6, A);
      }
    } else if (s === 'mito') {
      info = K.blob(ctx, V, inst.p, inst.axis, inst.a, inst.b, fn('mito'), { alpha: A, inner: (c, ma, mi) => {
        c.strokeStyle = BL.alpha('#000000', 0.32); c.lineWidth = 1.3;
        for (let i = -2; i <= 2; i++) { const x = i * ma * 0.3; c.beginPath(); c.moveTo(x, -mi * 0.75); c.quadraticCurveTo(x + ma * 0.12, 0, x, mi * 0.75); c.stroke(); }
      } });
    } else if (s === 'chloro') {
      info = K.blob(ctx, V, inst.p, inst.axis, inst.a, inst.b, fn('chloro'), { alpha: A, inner: (c, ma, mi) => {
        c.fillStyle = BL.alpha('#000000', 0.28);
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j += 2) { c.beginPath(); c.ellipse(i * ma * 0.42, j * mi * 0.3, ma * 0.13, mi * 0.16, 0, 0, TAU); c.fill(); }
      } });
    } else if (s === 'er') {
      const f = K.frame(inst.n);
      for (let i = 0; i < inst.count; i++) {
        const c = v(inst.p.x + inst.n.x * (i - (inst.count - 1) / 2) * inst.gap, inst.p.y + inst.n.y * (i - (inst.count - 1) / 2) * inst.gap, inst.p.z + inst.n.z * (i - (inst.count - 1) / 2) * inst.gap);
        info = K.disc(ctx, V, c, f.u, f.w, inst.R * (1 - 0.07 * Math.abs(i - 1.5)), fn('er'), { alpha: 0.78 * A });
        if (i % 2 === 0) { // ribosomes on the rough sheets
          const rr = K.rng(40 + i);
          for (let j = 0; j < 9; j++) { const t = rr() * TAU, d = Math.sqrt(rr()) * inst.R * 0.85; K.ball(ctx, V, v(c.x + (f.u.x * Math.cos(t) + f.w.x * Math.sin(t)) * d + inst.n.x * 0.012, c.y + (f.u.y * Math.cos(t) + f.w.y * Math.sin(t)) * d + inst.n.y * 0.012, c.z + (f.u.z * Math.cos(t) + f.w.z * Math.sin(t)) * d + inst.n.z * 0.012), 0.014, BL.mixHex(fn('er'), '#000000', 0.45), { alpha: A }); }
        }
      }
    } else if (s === 'golgi') {
      const f = K.frame(inst.n);
      for (let i = 0; i < inst.count; i++) {
        const c = v(inst.p.x + inst.n.x * (i - (inst.count - 1) / 2) * inst.gap, inst.p.y + inst.n.y * (i - (inst.count - 1) / 2) * inst.gap, inst.p.z + inst.n.z * (i - (inst.count - 1) / 2) * inst.gap);
        info = K.disc(ctx, V, c, f.u, f.w, inst.R * (1 - 0.12 * Math.abs(i - (inst.count - 1) / 2)), fn('golgi'), { alpha: 0.85 * A });
      }
    } else if (s === 'centrosome') {
      const a1 = v(inst.p.x - 0.05, inst.p.y, inst.p.z), a2 = v(inst.p.x, inst.p.y + 0.05, inst.p.z);
      K.fibre(ctx, V, v(a1.x - 0.05, a1.y, a1.z), v(a1.x + 0.05, a1.y, a1.z), 4.4 * V.scale / 140, fn('centrosome'), A);
      K.fibre(ctx, V, v(a2.x, a2.y - 0.05, a2.z), v(a2.x, a2.y + 0.05, a2.z), 4.4 * V.scale / 140, fn('centrosome'), A);
      const q = V.project(inst.p); info = { x: q.x, y: q.y, z: q.z, r: 0.1 * V.scale * q.s };
    } else if (s === 'nucleoid') {
      info = K.blob(ctx, V, inst.p, inst.axis, inst.a, inst.b, fn('nucleoid'), { alpha: 0.35 * A, flat: true, stroke: BL.alpha(fn('nucleoid'), 0.6) });
      const rr = K.rng(8); let prev = null;
      for (let i = 0; i < 26; i++) { const t = i / 25, p = v(inst.p.x + (t * 2 - 1) * inst.a * 0.85, inst.p.y + (rr() - 0.5) * inst.b * 1.4, inst.p.z + (rr() - 0.5) * inst.b * 1.4); if (prev) K.fibre(ctx, V, prev, p, 2.2, fn('nucleoid'), A); prev = p; }
    } else if (s === 'plasmid') {
      const f = K.frame(inst.axis || v(0, 1, 0));
      info = K.ring(ctx, V, inst.p, f.u, f.w, inst.r, fn('plasmid'), 3.4, A);
    } else if (s === 'vacuole') {
      info = inst.big
        ? K.blob(ctx, V, inst.p, inst.axis, inst.a, inst.b, fn('vacuole'), { alpha: 0.5 * A, flat: true })
        : K.ball(ctx, V, inst.p, inst.r, fn('vacuole'), { alpha: 0.8 * A });
    } else if (s === 'lysosome') {
      info = K.ball(ctx, V, inst.p, inst.r, fn('lysosome'), { alpha: A });
      for (let i = 0; i < 3; i++) K.ball(ctx, V, v(inst.p.x + (i - 1) * inst.r * 0.35, inst.p.y + (i % 2 ? 1 : -1) * inst.r * 0.2, inst.p.z + inst.r * 0.55), inst.r * 0.17, BL.mixHex(fn('lysosome'), '#000000', 0.5), { alpha: A });
    } else if (s === 'peroxisome') {
      info = K.ball(ctx, V, inst.p, inst.r, BL.mixHex(fn('peroxisome'), '#ffffff', 0.12), { alpha: A });
      K.ball(ctx, V, v(inst.p.x, inst.p.y, inst.p.z + inst.r * 0.55), inst.r * 0.38, BL.mixHex(fn('peroxisome'), '#000000', 0.4), { alpha: A });
    } else if (s === 'vesicle') {
      info = K.ball(ctx, V, inst.p, inst.r, fn('vesicle'), { alpha: A });
    } else {
      info = K.ball(ctx, V, inst.p, inst.r || 0.05, fn(s), { alpha: A });
    }
    if (info) { inst._sx = info.x; inst._sy = info.y; inst._sz = info.z; inst._sr = info.r; }
    if (hl && info) {
      ctx.save(); ctx.strokeStyle = pal.fg; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(info.x, info.y, Math.max(info.r + 6, 14), 0, TAU); ctx.stroke(); ctx.restore();
    }
    return info;
  };

  /* the closest thing under a screen point, preferring whatever is in front */
  K.pick = function (list, p, slop) {
    let best = null, bz = -1e9;
    list.forEach((it) => {
      if (it._sr == null || it._hidden) return;
      const d = Math.hypot(p.x - it._sx, p.y - it._sy);
      if (d <= Math.max(it._sr, 12) + (slop || 4) && it._sz > bz) { best = it; bz = it._sz; }
    });
    return best;
  };

  /* The cell's own body: sphere, box or rod, drawn behind and in front of what is inside.
     t is how much of it to show (0..1) so one body can fade as another arrives. */
  K.body = function (ctx, V, type, t, o) {
    o = o || {};
    const pal = BL.pal, fnS = col('struct');
    if (t <= 0.01) return;
    if (type === 'animal') {
      V.add(-900, () => {
        const q = V.project(v(0, 0, 0)), r = V.scale * q.s * 1.0;
        ctx.save(); ctx.globalAlpha = t;
        const g = ctx.createRadialGradient(q.x - r * 0.25, q.y - r * 0.3, r * 0.1, q.x, q.y, r);
        g.addColorStop(0, BL.alpha(BL.mixHex(pal.panel, fnS, 0.04), 0.5)); g.addColorStop(0.8, BL.alpha(BL.mixHex(pal.panel, fnS, 0.14), 0.4)); g.addColorStop(1, BL.alpha(BL.mixHex(pal.panel, fnS, 0.34), 0.5));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill(); ctx.restore();
      });
      V.add(900, () => {
        const q = V.project(v(0, 0, 0)), r = V.scale * q.s;
        ctx.save(); ctx.globalAlpha = t; ctx.strokeStyle = fnS; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.stroke();
        // cilia, on the surface
        const rr = K.rng(21); ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (let i = 0; i < 26; i++) { const nrm = norm(v(rr() * 2 - 1, rr() * 2 - 1, rr() * 2 - 1)), a = V.project(v(nrm.x, nrm.y, nrm.z)), b = V.project(v(nrm.x * 1.09, nrm.y * 1.09, nrm.z * 1.09)); ctx.globalAlpha = t * (0.35 + 0.65 * a.d); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        ctx.restore();
      });
    } else if (type === 'plant') {
      const H = v(1.15, 0.82, 0.82), cs = [];
      for (let i = 0; i < 8; i++) cs.push(v(i & 1 ? H.x : -H.x, i & 2 ? H.y : -H.y, i & 4 ? H.z : -H.z));
      const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
      const P = cs.map((c) => V.project(c));
      V.add(-900, () => {
        // the six faces, faint, so the box reads as a body and not as a wireframe
        const faces = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
        ctx.save(); ctx.globalAlpha = t * 0.5; ctx.fillStyle = BL.alpha(BL.mixHex(pal.panel, fnS, 0.2), 0.34);
        faces.forEach((f) => { ctx.beginPath(); f.forEach((i, n) => (n ? ctx.lineTo(P[i].x, P[i].y) : ctx.moveTo(P[i].x, P[i].y))); ctx.closePath(); ctx.fill(); });
        ctx.restore();
      });
      edges.forEach(([a, b]) => {
        const z = (P[a].z + P[b].z) / 2;
        V.add(z < 0 ? -890 : 890, () => {
          ctx.save(); ctx.globalAlpha = t * (z < 0 ? 0.5 : 1); ctx.strokeStyle = fnS; ctx.lineWidth = 6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(P[a].x, P[a].y); ctx.lineTo(P[b].x, P[b].y); ctx.stroke(); ctx.restore();
        });
      });
    } else {
      const A = v(-0.75, 0, 0), B = v(0.75, 0, 0);
      V.add(-900, () => {
        ctx.save();
        K.rod(ctx, V, A, B, 0.78, BL.mixHex(pal.panel, fnS, 0.22), { alpha: t * 0.38 });        // the capsule
        K.rod(ctx, V, A, B, 0.6, BL.mixHex(pal.panel, fnS, 0.1), { alpha: t * 0.5 });           // the cell
        ctx.restore();
      });
      V.add(900, () => {
        ctx.save(); ctx.globalAlpha = t;
        K.rod(ctx, V, A, B, 0.6, fnS, { fill: false, edge: fnS, edgeW: 7 });                  // the wall
        K.rod(ctx, V, A, B, 0.78, fnS, { fill: false, edge: BL.alpha(fnS, 0.5), edgeW: 3 });   // the capsule's outer edge
        // pili
        const rr = K.rng(31); ctx.strokeStyle = fnS; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        for (let i = 0; i < 12; i++) { const x = (rr() * 2 - 1) * 0.75, th = rr() * TAU, a = V.project(v(x, Math.cos(th) * 0.78, Math.sin(th) * 0.78)), b = V.project(v(x + (rr() - 0.5) * 0.15, Math.cos(th) * 1.12, Math.sin(th) * 1.12)); ctx.globalAlpha = t * (0.4 + 0.6 * a.d); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        // the flagellum: a long wave off the end
        ctx.globalAlpha = t; ctx.lineWidth = 3.2; ctx.beginPath();
        const ph = (o.time || 0) * 5;
        for (let i = 0; i <= 28; i++) { const u = i / 28, p = V.project(v(1.56 + u * 1.5, Math.sin(u * 9 - ph) * 0.14 * u, Math.cos(u * 9 - ph) * 0.14 * u)); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
        ctx.stroke(); ctx.restore();
      });
    }
  };

  /* the cytoskeleton and the free ribosomes: many small things, drawn cheaply */
  K.specks_draw = function (ctx, V, type, pts, a) {
    const pal = BL.pal, c = col('protein');
    pts.forEach((p) => {
      const q = V.project(p);
      V.add(q.z, () => { ctx.save(); ctx.globalAlpha = a * (0.45 + 0.55 * q.d); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(1.6, 0.022 * V.scale * q.s), 0, TAU); ctx.fill(); ctx.restore(); });
    });
  };
  K.fibres_draw = function (ctx, V, type, a) {
    if (type === 'bact') return;
    const rand = K.rng({ animal: 77, plant: 78 }[type]), c = col('struct');
    const R = type === 'animal' ? 0.9 : 0.75;
    for (let i = 0; i < 16; i++) {
      const p0 = norm(v(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1)), s0 = type === 'animal' ? v(p0.x * R, p0.y * R, p0.z * R) : v(p0.x * 1.0, p0.y * 0.7, p0.z * 0.7);
      const e = type === 'animal' ? v(-0.12 + p0.x * 0.36, 0.04 + p0.y * 0.36, p0.z * 0.36) : v(-0.82 + p0.x * 0.1, 0.38 + p0.y * 0.1, 0.18 + p0.z * 0.1);
      const A = V.project(s0), B = V.project(e);
      V.add((A.z + B.z) / 2, () => K.fibre(ctx, V, s0, e, 1.4, c, a * 0.42 * (0.5 + 0.5 * A.d)));
    }
  };
})();
