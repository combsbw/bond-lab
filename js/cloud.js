/* Cloud: an orbital is a place where an electron is likely to be found.
   There is only ever one electron in this picture. Each dot is one snapshot of
   where it was caught. Take a few and you get scatter; take thousands and the
   scatter piles up into a shape: the orbital. Turn it around, change the
   pull of the nucleus, and watch how the shape (and the empty places in it)
   comes from the rungs you met in Rungs.

   Snapshots are drawn from the exact hydrogen-like probability distribution
   (see atoms.js and tools/check-atoms.js). */
(function () {
  'use strict';
  const { h, clamp, lerp } = BL;
  const A = BL.atoms;

  const CAP = 6000;                     // most snapshots the buffer can hold
  const SPEEDS = [['one', 'One at a time', 0.8], ['slow', 'Slow', 14], ['fast', 'Fast', 180], ['vfast', 'Very fast', 1400]];
  const KEEPS = [1, 10, 100, 1000, 6000];
  const BOHR = 0.529;                   // angstrom per a0
  const GOALS = [
    { id: 'snap', text: 'Take a single snapshot of the electron.' },
    { id: 'shape', text: 'Pile up enough snapshots to see a shape.' },
    { id: 'ring', text: 'Find a cloud with an empty ring inside it.' },
    { id: 'bell', text: 'Find a cloud shaped like a dumbbell.' },
    { id: 'round', text: 'Put all three p clouds together. What shape do they make?' },
    { id: 'slice', text: 'Slice a cloud open and look at the middle.' },
    { id: 'turn', text: 'Turn a cloud around to see it from another side.' },
    { id: 'shrink', text: 'Make a cloud shrink without changing its shape.' },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g fill="var(--cloud)">' +
    Array.from({ length: 120 }, (_, i) => {
      const a = (i * 2.399) % 6.283, r = 6 + ((i * 37) % 100) / 100 * 40, lobe = i % 2 ? 1 : -1;
      const x = 100 + Math.cos(a) * r * 0.5, y = 60 + lobe * (16 + Math.abs(Math.sin(a)) * 26) * (0.4 + ((i * 53) % 100) / 160) + Math.sin(a * 3) * 4;
      return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.2" opacity="' + (0.4 + ((i * 17) % 60) / 100).toFixed(2) + '"/>';
    }).join('') + '</g><circle cx="100" cy="60" r="3.5" fill="var(--fg)"/></svg>';

  BL.register({
    id: 'cloud', field: 'atoms', order: 2, name: 'Cloud',
    tagline: 'One electron, many catches, and a shape fills in.',
    lede: 'There is only one electron in this whole picture. Each sphere is one snapshot of where it happened to be caught — take enough of them and they fill in a shape, the region the electron actually occupies.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        orb: A.ORBITALS[0], shape: 's', all: false, Z: 1,
        speed: 'fast', keep: 3000, running: true, twoTone: false, fit: true, slice: false,
        show: 'both',
        yaw: 0.5, pitch: 0.35, spun: 0, userTurned: false,
        X: new Float32Array(CAP), Y: new Float32Array(CAP), Zc: new Float32Array(CAP), G: new Int8Array(CAP), R: new Float32Array(CAP),
        head: 0, count: 0, acc: 0, last: null, lastT: 0, total: 0, hist: null, histT: 0, hinted: false,
      };
      const samplers = new Map();
      const getSampler = (shape) => {
        const key = S.orb.n + ',' + S.orb.l + ',' + shape + ',' + S.Z;
        if (!samplers.has(key)) samplers.set(key, A.sampler(S.orb.n, S.orb.l, shape, S.Z));
        return samplers.get(key);
      };
      S.keep = 3000;

      const stage = BL.stage(stageHost, '4 / 3', {
        label: 'A three-dimensional cloud of dots. Each dot is one snapshot of where a single electron was found. Drag to turn the cloud around; arrow keys also turn it.',
        focusable: true,
      });
      stage.wrap.classList.add('cloud-stage');
      const ctx = stage.ctx;
      const say = h('div', { class: 'sr-only', 'aria-live': 'polite' });
      stageHost.appendChild(say);

      /* ---------------- dock ---------------- */
      const orbBtns = {};
      const orbRow = h('div', { class: 'chips', role: 'group', 'aria-label': 'Which orbital' });
      A.ORBITALS.forEach((o) => {
        const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => pickOrbital(o) }, o.id);
        orbBtns[o.id] = b; orbRow.appendChild(b);
      });
      const orientRow = h('div', { class: 'chips', role: 'group', 'aria-label': 'Which direction' });
      const orientNote = h('p', { class: 'note' });
      dock.appendChild(h('section', {}, h('h2', {}, 'Which cloud'), orbRow, orientRow, orientNote));

      const speedBtns = SPEEDS.map(([id, label]) => h('button', { type: 'button', 'aria-pressed': String(id === S.speed), onclick: () => { S.speed = id; sync(); } }, label));
      const keepBtns = KEEPS.map((k) => h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.keep = k; sync(); } }, String(k)));
      const shotBtn = h('button', { type: 'button', class: 'action', onclick: () => { oneShot(); goals.done('snap'); } }, 'Take one snapshot');
      const playBtn = h('button', { type: 'button', class: 'action ghost', 'aria-pressed': 'true', onclick: () => { S.running = !S.running; sync(); } }, 'Pause');
      const clearBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => { S.count = 0; S.head = 0; S.last = null; S.total = 0; } }, 'Start over');
      dock.appendChild(h('section', {},
        h('h2', {}, 'Snapshots'),
        h('div', { class: 'seg', role: 'group', 'aria-label': 'How fast to take snapshots' }, speedBtns),
        h('div', { class: 'actions' }, shotBtn, playBtn, clearBtn),
        h('h2', { class: 'sub-h' }, 'How many to keep on screen'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Snapshots kept' }, keepBtns)));

      const zBtns = [1, 2, 3].map((z) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(z === 1), onclick: () => setZ(z) }, '+' + z));
      const tonBtn = h('button', { type: 'button', class: 'chip soft', 'aria-pressed': 'false', onclick: () => { S.twoTone = !S.twoTone; sync(); } }, 'Show the two signs');
      const sliceBtn = h('button', { type: 'button', class: 'chip soft', 'aria-pressed': 'false', onclick: () => { S.slice = !S.slice; if (S.slice) goals.done('slice'); sync(); } }, 'Slice it open');
      const fitBtn = h('button', { type: 'button', class: 'chip soft', 'aria-pressed': 'true', onclick: () => { S.fit = !S.fit; sync(); } }, 'Zoom to fit');
      const SHOWS = [['both', 'Both'], ['region', 'The region'], ['dots', 'The catches']];
      const showBtns = SHOWS.map(([id, label]) =>
        h('button', { type: 'button', 'aria-pressed': String(id === S.show), onclick: () => { S.show = id; sync(); } }, label));
      dock.appendChild(h('section', {},
        h('h2', {}, 'Show'),
        h('div', { class: 'seg', role: 'group', 'aria-label': 'What to draw' }, showBtns),
        h('p', { class: 'hint' }, 'The catches are where the electron was actually found, one sphere each. The region is the whole body it occupies, stacked up and seen through — thickest where it spends most of its time, see-through at the edges, and empty where there is nothing. The region fills in as the catches pile up, because that is where it comes from.')));

      dock.appendChild(h('section', {},
        h('h2', {}, 'Pull of the nucleus'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Nucleus charge' }, zBtns),
        h('h2', { class: 'sub-h' }, 'Look'),
        h('div', { class: 'actions' }, fitBtn, tonBtn, sliceBtn),
        h('p', { class: 'hint' }, 'Turn the cloud by dragging it. “Slice it open” keeps only a thin sheet through the middle, so empty rings show up. “Two signs” colors the two sides of the wave: red and blue are just labels for opposite signs, not charges.')));

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'cloud', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- below the stage ---------------- */
      const facts = h('dl', { class: 'facts' });
      const hist = BL.stage(h('div'), '3.2 / 1', { label: 'Histogram of how far from the nucleus the snapshots fell, with the exact curve drawn over it.' });
      hist.wrap.classList.add('flat', 'hist');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'This cloud'), facts));
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'How far from the nucleus?'), hist.wrap,
        h('p', { class: 'hint' }, 'Bars are your snapshots. The line is what an endless number of them would give. Rings with nothing in them show up as dips down to zero.')));

      /* ---------------- state changes ---------------- */
      function pickOrbital(o) {
        S.orb = o; S.shape = o.shapes[0]; S.all = false; S.count = 0; S.head = 0; S.last = null; S.total = 0;
        sync();
      }
      function setZ(z) { S.Z = z; S.count = 0; S.head = 0; S.last = null; S.total = 0; if (z > 1) goals.done('shrink'); zBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === z))); sync(); }
      function sync() {
        A.ORBITALS.forEach((o) => orbBtns[o.id].setAttribute('aria-pressed', String(o === S.orb)));
        orientRow.textContent = '';
        if (S.orb.shapes.length > 1) {
          S.orb.shapes.forEach((sh, i) => orientRow.appendChild(h('button', { type: 'button', class: 'chip soft', 'aria-pressed': String(!S.all && S.shape === sh), onclick: () => { S.shape = sh; S.all = false; S.count = 0; S.head = 0; S.last = null; S.total = 0; sync(); } }, S.orb.names[i])));
          orientRow.appendChild(h('button', { type: 'button', class: 'chip soft', 'aria-pressed': String(S.all), onclick: () => { S.all = true; S.count = 0; S.head = 0; S.last = null; S.total = 0; sync(); } }, 'All ' + S.orb.shapes.length + ' together'));
        }
        const o = S.orb, nodesR = o.n - o.l - 1, nodesA = o.l;
        orientNote.textContent = o.shapes.length > 1 ? 'The ' + o.id + ' group has ' + o.shapes.length + ' clouds, one pointing each way. Pick one, or stack them all.' : '';
        showBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(SHOWS[i][0] === S.show)));
        speedBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(SPEEDS[i][0] === S.speed)));
        keepBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(KEEPS[i] === S.keep)));
        playBtn.textContent = S.running ? 'Pause' : 'Resume';
        tonBtn.setAttribute('aria-pressed', String(S.twoTone)); fitBtn.setAttribute('aria-pressed', String(S.fit)); sliceBtn.setAttribute('aria-pressed', String(S.slice));
        const E = A.levelE(o.n, S.Z), mean = (3 * o.n * o.n - o.l * (o.l + 1)) / 2 / S.Z;
        facts.textContent = '';
        const row = (k, v) => { facts.appendChild(h('div', { class: 'fact' }, h('dt', {}, k), h('dd', {}, v))); };
        row('Name', (S.all ? o.id + ' (all together)' : S.orb.names[o.shapes.indexOf(S.shape)]));
        row('Energy', (BL.nums ? E.toFixed(2) + ' eV · ' : '') + (o.l > 0 || o.n > 1 ? 'rung ' + o.n + ', so it is held more loosely than the bottom one' : 'the bottom rung, held as tightly as this electron ever is'));
        row('Typical distance', 'usually found ' + (mean * BOHR < 1 ? 'right up against' : mean * BOHR < 3 ? 'close to' : mean * BOHR < 7 ? 'well out from' : 'a long way out from') + ' the nucleus' + (BL.nums ? ' · ' + (mean * BOHR).toFixed(2) + ' Å' : ''));
        row('Empty places', (nodesR ? nodesR + (nodesR === 1 ? ' empty ring' : ' empty rings') : 'no empty rings') + (nodesA ? ' · ' + nodesA + (nodesA === 1 ? ' empty plane' : ' empty planes') : ''));
        row('Room for electrons', o.shapes.length + (o.shapes.length === 1 ? ' cloud' : ' clouds') + ' × 2 = up to ' + o.shapes.length * 2);
        S.hist = null;
      }
      function oneShot() {
        S.running = false; S.speed = S.speed === 'one' ? 'one' : S.speed; push(); S.lastT = performance.now(); sync();
      }
      function push() {
        const shape = S.all ? S.orb.shapes[(Math.random() * S.orb.shapes.length) | 0] : S.shape;
        const p = getSampler(shape).next();
        const i = S.head;
        S.X[i] = p.x; S.Y[i] = p.y; S.Zc[i] = p.z; S.G[i] = p.sign; S.R[i] = p.r;
        S.head = (i + 1) % CAP; S.count = Math.min(CAP, S.count + 1); S.total++; S.last = i;
        S.lastT = performance.now();
      }
      sync();

      /* ---------------- turning it ---------------- */
      BL.drag(stage.canvas, {
        pick: () => 'cloud',
        move: (_h, p, start) => {
          if (start) { S.px = p.x; S.py = p.y; return; }
          const dx = p.x - S.px, dy = p.y - S.py; S.px = p.x; S.py = p.y;
          S.yaw += dx * 0.011; S.pitch = clamp(S.pitch + dy * 0.011, -1.5, 1.5); S.spun += Math.abs(dx) * 0.011 + Math.abs(dy) * 0.011; S.userTurned = true; S.hinted = true;
          if (S.spun > 2.2) goals.done('turn');
        },
      });
      stage.canvas.addEventListener('keydown', (e) => {
        const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (!k) return; e.preventDefault();
        S.yaw += k[0] * 0.15; S.pitch = clamp(S.pitch + k[1] * 0.15, -1.5, 1.5); S.spun += 0.15; S.userTurned = true; S.hinted = true;
        if (S.spun > 2.2) goals.done('turn');
      });


      /* ---------------- the orbital as a filled body ----------------
         The catches say where the electron turns up. They do not, on their
         own, say "this is the region it occupies" — which is the thing worth
         walking away with. So behind the catches sits the orbital itself.

         For every pixel, walk a line straight back into the screen and add up
         how much electron is along it. Thin at the edges where the ray clips
         the outside of the cloud, solid through the middle where it goes the
         long way, and black-empty where there is a node. That is exactly what
         looking through something translucent does, which is why it reads as
         a body and not as a smear.

         It is drawn small and scaled up: at this size the eye wants a smooth
         body, and marching every screen pixel would cost more than it is
         worth. The picture is only redone when the view has actually moved,
         so turning the cloud stays at full frame rate. */
      const fld = {
        c: document.createElement('canvas'), w: 0, h: 0, img: null,
        pos: null, neg: null, scratch: null, key: '', ready: false, ref: 0,
      };
      fld.g = fld.c.getContext('2d');

      function fieldSize(W, H) {
        const w = clamp(Math.round(W / 4.6), 44, 150);
        const hh = Math.max(20, Math.round((w * H) / W));
        if (fld.w === w && fld.h === hh) return;
        fld.w = w; fld.h = hh;
        fld.c.width = w; fld.c.height = hh;
        fld.img = fld.g.createImageData(w, hh);
        fld.pos = new Float32Array(w * hh);
        fld.neg = new Float32Array(w * hh);
        fld.scratch = new Float32Array(w * hh);
        fld.key = '';
      }

      /* March the rays and fill the two sign buffers. */
      function marchField(W, H, cx, cy, sc, cyaw, syaw, cp, sp, slab) {
        const fw = fld.w, fh = fld.h;
        const pos = fld.pos, neg = fld.neg;
        pos.fill(0); neg.fill(0);

        const o = S.orb;
        const lut = A.radialTable(o.n, o.l);
        const ang = A.ANG[S.shape];
        const round = S.all;                        // a whole subshell is a sphere
        const reach = A.orbitalExtent(o.n) / S.Z;   // nothing outside this
        const reach2 = reach * reach;
        const STEPS = 34, dz = (2 * reach) / STEPS;

        // screen pixel -> the stage's own coordinates, then into the cloud's
        const sx = W / fw, sy = H / fh, isc = 1 / sc;
        const scratch = fld.scratch;
        let nz = 0;
        for (let fy = 0; fy < fh; fy++) {
          const y1 = ((fy + 0.5) * sy - cy) * isc;
          for (let fx = 0; fx < fw; fx++) {
            const x1 = ((fx + 0.5) * sx - cx) * isc;
            // the ray only passes through the cloud's sphere between these
            const half2 = reach2 - x1 * x1 - y1 * y1;
            if (half2 <= 0) continue;
            let zHalf = Math.sqrt(half2);
            if (S.slice) { if (zHalf > slab) zHalf = slab; }
            let p = 0, q = 0;
            const n = Math.max(2, Math.min(STEPS, Math.ceil((2 * zHalf) / dz)));
            const step = (2 * zHalf) / n;
            for (let k = 0; k < n; k++) {
              const z2 = -zHalf + (k + 0.5) * step;
              // undo the pitch, then the yaw, to get back to the cloud's own axes
              const y0 = y1 * cp + z2 * sp, z1 = -y1 * sp + z2 * cp;
              const x0 = x1 * cyaw - z1 * syaw, z0 = x1 * syaw + z1 * cyaw;
              const r = Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0);
              if (r < 1e-7) continue;
              const R = lut.at(r * S.Z);
              if (R === 0) continue;
              const Yv = round ? 1 : ang(x0 / r, y0 / r, z0 / r);
              const psi = R * Yv;
              const d = psi * psi * step;
              if (R * Yv >= 0) p += d; else q += d;
            }
            const i = fy * fw + fx;
            pos[i] = p; neg[i] = q;
            if (p + q > 0) scratch[nz++] = p + q;
          }
        }
        if (!nz) return 0;
        /* A dumbbell has a handful of rays that go the whole length of a lobe
           and are far brighter than anything else. Taking the brightest as the
           reference would leave the rest of the cloud nearly invisible, so the
           reference is a high percentile instead: a level most of the bright
           part reaches, with the few outliers simply saturating. */
        const use = scratch.subarray(0, nz);
        use.sort();
        return use[Math.min(nz - 1, Math.floor(nz * 0.97))];
      }

      /* Paint the two buffers into pixels. */
      function paintField(pal, peak) {
        if (peak <= 0) { fld.ready = false; return; }
        fld.ref = fld.ref > 0 ? fld.ref + (peak - fld.ref) * 0.4 : peak;
        /* Saturate well below the brightest ray, so the middle of the cloud
           reads as a solid body instead of a single blinding dot. */
        const ref = Math.max(1e-12, fld.ref * 0.22);
        const d = fld.img.data, pos = fld.pos, neg = fld.neg;
        const cloudRGB = BL.rgb(pal.cloud), posRGB = BL.rgb(pal.pos), negRGB = BL.rgb(pal.neg);
        /* The density of a 1s cloud runs over four orders of magnitude between
           the middle and the rim. Shown straight, everything but a dot in the
           centre would be invisible, so the scale is compressed hard — the same
           thing every photograph of a nebula does, and for the same reason. */
        const GAMMA = 0.34, top = pal.dark ? 0.95 : 0.92;
        /* A cloud has no edge — it only gets fainter forever. Drawn that way
           it fills the frame with haze and never looks like a thing. So the
           last whisper of it is dropped: below this, nothing is painted, and
           just above it the body fades in smoothly. The line that comes out
           sits near where a textbook draws its boundary surface, and for the
           same reason — it is where the electron has effectively stopped. */
        const LO = 0.2;
        for (let i = 0, p = 0; i < pos.length; i++, p += 4) {
          const a1 = pos[i], a2 = neg[i], tot = a1 + a2;
          if (tot <= 0) { d[p + 3] = 0; continue; }
          const u = Math.pow(tot / ref, GAMMA);
          if (u <= LO) { d[p + 3] = 0; continue; }
          const t = u >= 1 ? 1 : (u - LO) / (1 - LO);
          const a = t * t * (3 - 2 * t) * top;
          if (a <= 0.004) { d[p + 3] = 0; continue; }
          const rgb = (S.twoTone && !S.all) ? (a1 >= a2 ? posRGB : negRGB) : cloudRGB;
          d[p] = rgb[0]; d[p + 1] = rgb[1]; d[p + 2] = rgb[2];
          d[p + 3] = a > 1 ? 255 : (a * 255) | 0;
        }
        fld.g.putImageData(fld.img, 0, 0);
        fld.ready = true;
      }

      function drawField(pal, W, H, cx, cy, sc, cyaw, syaw, cp, sp, slab, fade) {
        if (fade <= 0.002) return;
        fieldSize(W, H);
        // redo it when the picture would actually be different, not every frame
        const key = [S.orb.id, S.shape, S.all, S.Z, S.slice, S.twoTone, S.fit, pal.dark,
          Math.round(S.yaw * 24), Math.round(S.pitch * 24), Math.round(sc)].join('|');
        if (key !== fld.key) {
          fld.key = key;
          paintField(pal, marchField(W, H, cx, cy, sc, cyaw, syaw, cp, sp, slab));
        }
        if (!fld.ready) return;
        const sm = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = true;
        if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
        ctx.globalAlpha = fade;
        ctx.drawImage(fld.c, 0, 0, fld.w, fld.h, 0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.imageSmoothingEnabled = sm;
      }

      /* ---------------- frame ---------------- */
      const extent = (n, Z) => ({ 1: 5.2, 2: 17, 3: 30 }[n]) / Z;
      function frame(dt) {
        const pal = BL.pal, W = stage.w, H = stage.h;
        // take snapshots
        if (S.running) {
          const rate = SPEEDS.find((s) => s[0] === S.speed)[2];
          S.acc += dt * rate;
          let n = Math.min(Math.floor(S.acc), 3000); S.acc -= Math.floor(S.acc);
          while (n-- > 0) push();
        }
        if (!S.userTurned && !BL.reduced) S.yaw += dt * 0.25;

        const o = S.orb, ext = S.fit ? extent(o.n, 1) / S.Z * (o.n === 3 ? 0.95 : 1) * (o.l === 2 ? 0.8 : 1) * 1.0 : 30;
        const sc = (Math.min(W, H) * 0.46) / (S.fit ? (o.n === 1 ? 4.2 : o.n === 2 ? (o.l === 1 ? 11 : 13) : o.l === 2 ? 16 : o.l === 1 ? 22 : 26) / S.Z : 26);
        const cx = W / 2, cy = H / 2, cyaw = Math.cos(S.yaw), syaw = Math.sin(S.yaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
        ctx.clearRect(0, 0, W, H);

        // a scale bar: 1 angstrom
        const barPx = sc * (1 / BOHR);
        const showBar = barPx > 18 && barPx < W * 0.6;

        const slab = (Math.min(W, H) * 0.46 / sc) * 0.09;
        const cnt = Math.min(S.count, S.keep);

        /* The body comes in as the snapshots pile up, so the story still runs
           the right way round: scatter first, then a shape out of the scatter. */
        if (S.show !== 'dots') {
          drawField(pal, W, H, cx, cy, sc, cyaw, syaw, cp, sp, slab, clamp(cnt / 260, 0, 1));
        }

        // the snapshots, each one a little sphere rather than a speck of dirt
        let lastXY = null;
        if (S.show !== 'region') {
          const blend = pal.dark ? 'lighter' : 'source-over';
          ctx.save(); ctx.globalCompositeOperation = blend;
          const base = cnt < 60 ? 3.1 : cnt < 400 ? 2.3 : cnt < 2000 ? 1.75 : 1.4;
          const aBase = cnt < 60 ? 1 : cnt < 400 ? 0.9 : cnt < 2000 ? 0.7 : 0.55;
          // past a couple of thousand the body carries the shape, so the
          // snapshots thin out into texture instead of becoming a solid mat
          const stride = cnt > 2600 ? Math.ceil(cnt / 2600) : 1;
          for (let k = 0; k < cnt; k += stride) {
            const i = (S.head - 1 - k + CAP * 2) % CAP;
            const x0 = S.X[i], y0 = S.Y[i], z0 = S.Zc[i];
            const x1 = x0 * cyaw + z0 * syaw, z1 = -x0 * syaw + z0 * cyaw;
            const y2 = y0 * cp - z1 * sp, z2 = y0 * sp + z1 * cp;
            const px = cx + x1 * sc, py = cy + y2 * sc;
            if (px < -6 || px > W + 6 || py < -6 || py > H + 6) continue;
            if (S.slice && Math.abs(z2) > slab) continue;
            const depth = clamp(0.5 + z2 / (ext * 2.2 || 1), 0, 1);       // 1 = near the viewer
            const a = clamp(aBase * (0.5 + 0.65 * depth), 0, 1);
            const col = S.twoTone ? (S.G[i] > 0 ? pal.pos : pal.neg) : pal.cloud;
            BL.ball(ctx, px, py, base * (0.78 + 0.45 * depth), col, Math.round(a * 20) / 20);
            if (k === 0) lastXY = [px, py];
          }
          ctx.restore();
        }

        // the nucleus, and the most recent snapshot
        BL.bigBall(ctx, cx, cy, 5.5, pal.fg, pal.panel);
        if (lastXY && (S.speed === 'one' || !S.running || cnt < 40)) {
          const age = (performance.now() - S.lastT) / 1000, pulse = BL.reduced ? 1 : 1 + 0.25 * Math.sin(age * 8);
          BL.ball(ctx, lastXY[0], lastXY[1], 4.5, pal.electron);
          ctx.strokeStyle = pal.electron; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(lastXY[0], lastXY[1], 11 * pulse, 0, 7); ctx.stroke();
          BL.label(ctx, 'the electron, caught right now', clamp(lastXY[0], 120, W - 120), lastXY[1] < H * 0.18 ? lastXY[1] + 28 : lastXY[1] - 24, { font: BL.font(700, 13), border: pal.electron });
        }
        // scale bar and counts
        const f = BL.fs(13);
        if (showBar) {
          const bx = 16, by = H - 16 - f * 1.3;
          ctx.strokeStyle = pal.fg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + barPx, by); ctx.moveTo(bx, by - 5); ctx.lineTo(bx, by + 5); ctx.moveTo(bx + barPx, by - 5); ctx.lineTo(bx + barPx, by + 5); ctx.stroke();
          ctx.fillStyle = pal.fg; ctx.font = BL.font(700, 13); ctx.textAlign = 'left'; ctx.fillText('1 Å', bx, by + f * 1.3 + 2);
        }
        ctx.fillStyle = pal.fg; ctx.font = BL.font(700, 14); ctx.textAlign = 'right';
        ctx.fillText(cnt.toLocaleString('en-US') + (cnt === 1 ? ' snapshot' : ' snapshots') + (S.slice ? ' · thin slice' : ''), W - 14, 24 * BL.ts);
        if (S.twoTone) {
          BL.label(ctx, '+ side', W - 14, 24 * BL.ts + f * 2.2, { font: BL.font(700, 13), align: 'right', color: pal.pos, border: pal.pos });
          BL.label(ctx, '− side', W - 14, 24 * BL.ts + f * 4.3, { font: BL.font(700, 13), align: 'right', color: pal.neg, border: pal.neg });
        }
        if (!S.hinted && !BL.reduced) {
          const ph = (performance.now() / 1200) % 1;
          BL.label(ctx, '↻ drag to turn it', cx, H - 18 - f * 0.5, { font: BL.font(700, 14), border: pal.ui, color: pal.fg });
        }

        // goals
        if (cnt >= 1000) goals.done('shape');
        if (cnt >= 800 && (o.id === '2s' || o.id === '3s')) goals.done('ring');
        if (cnt >= 800 && (o.id === '2p' || o.id === '3p') && !S.all) goals.done('bell');
        if (cnt >= 1500 && o.id.endsWith('p') && S.all) goals.done('round');

        S.histT += dt; if (S.histT > 0.15) { S.histT = 0; S.hist = null; }
        drawHist();
      }

      function drawHist() {
        const c = hist.ctx, W = hist.w, H = hist.h, pal = BL.pal;
        if (!W) return;
        c.clearRect(0, 0, W, H);
        const f = BL.fs(13), o = S.orb;
        const rmx = ({ 1: 5, 2: 16, 3: 32 }[o.n]) / S.Z * (o.n === 3 && o.l === 2 ? 0.75 : 1);
        const m = { l: 14, r: 14, t: f * 1.2, b: f * 2.8 };
        const bins = 44, cnt = Math.min(S.count, S.keep), hh = new Float32Array(bins);
        for (let k = 0; k < cnt; k++) { const i = (S.head - 1 - k + CAP * 2) % CAP; const b = Math.floor((S.R[i] / rmx) * bins); if (b >= 0 && b < bins) hh[b]++; }
        const curve = Array.from({ length: 200 }, (_, i) => { const r = ((i + 0.5) / 200) * rmx; return A.radialProb(o.n, o.l, r * S.Z) * S.Z; });
        const cmax = Math.max(...curve), tot = cnt || 1;
        const dens = (b) => hh[b] / tot / (rmx / bins);                      // per a0
        const ymax = Math.max(cmax, ...Array.from(hh, (_, b) => dens(b))) * 1.08;
        const X = (r) => m.l + (r / rmx) * (W - m.l - m.r), Y = (v) => H - m.b - (v / ymax) * (H - m.b - m.t);
        const bw = (W - m.l - m.r) / bins;
        for (let b = 0; b < bins; b++) { c.fillStyle = BL.alpha(pal.cloud, pal.dark ? 0.6 : 0.65); const y = Y(dens(b)); c.fillRect(m.l + b * bw + 1, y, bw - 2, H - m.b - y); }
        c.strokeStyle = pal.fg; c.lineWidth = 2.5; c.beginPath();
        curve.forEach((v, i) => { const x = X(((i + 0.5) / 200) * rmx), y = Y(v); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke();
        c.strokeStyle = pal.line2; c.lineWidth = 1.5; c.beginPath(); c.moveTo(m.l, H - m.b); c.lineTo(W - m.r, H - m.b); c.stroke();
        c.fillStyle = pal.muted; c.font = BL.font(400, 13); c.textAlign = 'center';
        const step = rmx > 20 ? 10 : rmx > 8 ? 4 : rmx > 3 ? 1 : 0.5;
        for (let a = 0; a <= rmx + 1e-6; a += step) { const x = X(a); c.fillRect(x - 0.75, H - m.b, 1.5, 5); c.fillText((a * BOHR).toFixed(a * BOHR < 10 && step < 4 ? 1 : 0), x, H - m.b + f * 1.35); }
        c.textAlign = 'right'; c.fillText('distance from the nucleus, Å →', W - m.r, H - 4);
      }

      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); hist.destroy(); } };
    },
  });
})();
