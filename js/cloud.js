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
    tagline: 'One electron, many snapshots, and a shape appears.',
    lede: 'There is only one electron in this whole picture. Each dot is one snapshot of where it happened to be caught — take enough of them and a shape appears out of the scatter.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        orb: A.ORBITALS[0], shape: 's', all: false, Z: 1,
        speed: 'fast', keep: 3000, running: true, twoTone: false, fit: true, slice: false,
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
      dock.appendChild(h('section', {},
        h('h2', {}, 'Pull of the nucleus'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Nucleus charge' }, zBtns),
        h('h2', { class: 'sub-h' }, 'Look'),
        h('div', { class: 'actions' }, fitBtn, tonBtn, sliceBtn),
        h('p', { class: 'hint' }, 'Turn the cloud by dragging it. “Slice it open” keeps only the dots in a thin sheet through the middle, so empty rings show up. “Two signs” colors the two sides of the wave: red and blue are just labels for opposite signs, not charges.')));

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
        // the dots
        const cnt = Math.min(S.count, S.keep), blend = pal.dark ? 'lighter' : 'source-over';
        ctx.save(); ctx.globalCompositeOperation = blend;
        const ds = pal.dark ? 2.6 : 2.9, big = cnt < 60 ? 5 : cnt < 400 ? 3.6 : ds;
        const aBase = cnt < 60 ? 0.95 : cnt < 400 ? 0.8 : pal.dark ? 0.5 : 0.55;
        let lastXY = null;
        for (let k = 0; k < cnt; k++) {
          const i = (S.head - 1 - k + CAP * 2) % CAP;
          const x0 = S.X[i], y0 = S.Y[i], z0 = S.Zc[i];
          const x1 = x0 * cyaw + z0 * syaw, z1 = -x0 * syaw + z0 * cyaw;
          const y2 = y0 * cp - z1 * sp, z2 = y0 * sp + z1 * cp;
          const px = cx + x1 * sc, py = cy + y2 * sc;
          if (px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;
          if (S.slice && Math.abs(z2) > slab) continue;
          const depth = clamp(0.5 + z2 / (ext * 2.2 || 1), 0, 1);       // 1 = near the viewer
          const a = clamp(aBase * (0.55 + 0.6 * depth), 0, 1);
          ctx.fillStyle = S.twoTone ? BL.alpha(S.G[i] > 0 ? pal.pos : pal.neg, Math.round(a * 20) / 20) : BL.alpha(pal.cloud, Math.round(a * 20) / 20);
          const sz = big * (0.8 + 0.4 * depth);
          ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
          if (k === 0) lastXY = [px, py];
        }
        ctx.restore();

        // the nucleus, and the most recent snapshot
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fillStyle = pal.fg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = pal.panel; ctx.stroke();
        if (lastXY && (S.speed === 'one' || !S.running || cnt < 40)) {
          const age = (performance.now() - S.lastT) / 1000, pulse = BL.reduced ? 1 : 1 + 0.25 * Math.sin(age * 8);
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
