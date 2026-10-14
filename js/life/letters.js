/* Letters: why only two pairs fit.

   A nucleotide is three things bolted together: a phosphate, a five-carbon
   sugar, and a base. The phosphate and the sugar join to the next nucleotide's
   phosphate and sugar, over and over, and that makes a rail that is identical
   all the way down. The base hangs off the side and takes no part in it.

   That is the whole reason DNA can carry a message. The part that holds the
   molecule together never varies, so the part that does vary is free to mean
   something.

   Then there is the pairing, which textbooks give as a rule to memorise —
   A with T, G with C — and which is not a rule at all, it is a shape. A base
   is either a double ring or a single ring. Two double rings facing each other
   are too wide and shove the rails apart; two single rings are too narrow and
   pinch them. Only one of each fits. And even among the pairs that are the
   right width, the little hydrogen-bond donors and acceptors along the facing
   edge have to come out opposite each other, and for most pairs they do not.
   Put both conditions together and exactly two pairs survive. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;
  const TAU = Math.PI * 2;

  /* width: 2 for a double-ring base, 1 for a single-ring one.
     edge: what sticks out along the facing edge, top to bottom —
     D offers a hydrogen, A is waiting for one. */
  const BASES = {
    A: { id: 'A', name: 'Adenine', ring: 'double', width: 2, edge: 'DA', col: () => BL.pal.eN },
    G: { id: 'G', name: 'Guanine', ring: 'double', width: 2, edge: 'ADD', col: () => BL.pal.tIondipole },
    C: { id: 'C', name: 'Cytosine', ring: 'single', width: 1, edge: 'DAA', col: () => BL.pal.tDipole },
    T: { id: 'T', name: 'Thymine', ring: 'single', width: 1, edge: 'AD', col: () => BL.pal.electron },
    U: { id: 'U', name: 'Uracil', ring: 'single', width: 1, edge: 'AD', col: () => BL.pal.tVdw },
  };
  const flip = (e) => e.split('').map((c) => (c === 'D' ? 'A' : 'D')).join('');

  /* Does this pair fit? Width first, then whether the edges line up. */
  function fit(x, y) {
    const a = BASES[x], b = BASES[y];
    const w = a.width + b.width;
    if (w > 3) return { ok: false, why: 'two double rings — too wide. They shove the rails apart.', kind: 'wide' };
    if (w < 3) return { ok: false, why: 'two single rings — too narrow. The rails pinch together.', kind: 'narrow' };
    if (a.edge.length !== b.edge.length) return { ok: false, why: 'right width, but one edge offers two places to hold on and the other offers three. They do not line up.', kind: 'edge' };
    if (flip(a.edge) !== b.edge) return { ok: false, why: 'right width, but both are offering a hydrogen in the same place. Two donors facing each other hold on to nothing.', kind: 'edge' };
    return { ok: true, why: 'the width is right and every place one offers a hydrogen the other is waiting for one. ' + a.edge.length + ' hydrogen bonds.', kind: 'ok', bonds: a.edge.length };
  }

  const STEPS = [
    { id: 'parts', text: 'Take one nucleotide apart.',
      how: 'Press “Take one apart” and count the pieces.',
      ask: 'how many parts is a nucleotide?',
      opts: ['Two', 'Three', 'Four'], right: 1 },
    { id: 'rail', text: 'Look along the strand and find what repeats.',
      how: 'Read the strand top to bottom. One part of it is identical at every rung and one is not.',
      ask: 'going down a strand, what is exactly the same every time?',
      opts: ['The base', 'The sugar and the phosphate', 'All of it'], right: 1 },
    { id: 'wide', text: 'Try pairing A with G.',
      how: 'Click the bases until a double ring faces a double ring. Watch the rails.',
      ask: 'two double rings facing each other —',
      opts: ['fit fine', 'are too wide and push the rails apart'], right: 1 },
    { id: 'edge', text: 'Try pairing A with C.',
      how: 'One double ring, one single ring, so the width is right. Click them together and look at the little marks along the facing edge.',
      ask: 'the width is right. Will it pair?',
      opts: ['Yes', 'No — the places they hold on do not line up'], right: 1 },
    { id: 'two', text: 'Work through every pair you can make.',
      how: 'There are ten of them with four bases. Try them and count how many snap together.',
      ask: 'how many of the ten fit?',
      opts: ['Two', 'Four', 'Ten'], right: 0 },
    { id: 'rna', text: 'Swap the sugar for ribose and swap T for U.',
      how: 'Press “RNA” and read what changed.',
      ask: 'what have you just built?',
      opts: ['DNA, still', 'RNA'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g stroke="var(--e-p)" stroke-width="6" stroke-linecap="round"><path d="M46 14 V106"/><path d="M154 14 V106"/></g>' +
    '<g><rect x="54" y="24" width="44" height="18" rx="6" fill="var(--e-n)"/><rect x="104" y="24" width="42" height="18" rx="6" fill="var(--electron)"/>' +
    '<rect x="54" y="52" width="26" height="18" rx="6" fill="var(--t-dipole)"/><rect x="86" y="52" width="60" height="18" rx="6" fill="var(--t-covalent)"/>' +
    '<rect x="54" y="80" width="44" height="18" rx="6" fill="var(--e-n)"/><rect x="104" y="80" width="42" height="18" rx="6" fill="var(--electron)"/></g></svg>';

  const N = 5;

  BL.register({
    id: 'letters', field: 'four', order: 3, name: 'Letters',
    tagline: 'Two pairs fit. Not because of a rule — because of a shape.',
    lede: 'Two strands facing each other, five rungs between them. Drag a base from the tray onto any rung — or just tap one — and watch what the rung does: snap together, shove the rails apart, pinch them in, or simply fail to line up. Underneath, the same rungs wound into a helix you can turn. Only two of the ten possible pairs survive both tests.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        left: ['A', 'G', 'C', 'T', 'A'], right: ['T', 'C', 'G', 'A', 'T'],
        rna: false, apart: false, t: 0, hint: true, hits: [], tried: new Set(), sel: null, tray: [], ghost: null, dropOn: null,
      };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'Two strands of DNA facing each other with five base pairs between them. Clicking a base changes it. Pairs that do not fit push the backbones apart or pinch them together.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const letters = () => (S.rna ? ['A', 'G', 'C', 'U'] : ['A', 'G', 'C', 'T']);

      function cycle(side, i) {
        const L = letters();
        const arr = side === 'l' ? S.left : S.right;
        arr[i] = L[(L.indexOf(arr[i]) + 1) % L.length];
        if (S.rna && arr[i] === 'T') arr[i] = 'U';
        S.hint = false; S.sel = { side, i };
        S.tried.add([S.left[i], S.right[i]].sort().join(''));
        say();
      }
      function complement() {
        const want = { A: S.rna ? 'U' : 'T', G: 'C', C: 'G', T: 'A', U: 'A' };
        S.left.forEach((b, i) => { S.right[i] = want[b]; });
        S.hint = false; say();
      }

      /* ---------------- dock ---------------- */
      dock.appendChild(h('section', {},
        h('h2', {}, 'The strands'),
        h('p', { class: 'hint' }, 'Click any base on the picture to change it. The rung underneath it will tell you what happened.'),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action', onclick: complement }, 'Fill the other strand in for me'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => { S.apart = !S.apart; S.hint = false; say(); } }, 'Take one apart'))));

      const modeBtns = [
        h('button', { type: 'button', class: 'chip', 'aria-pressed': 'true', onclick: () => setMode(false) }, 'DNA'),
        h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => setMode(true) }, 'RNA'),
      ];
      function setMode(rna) {
        S.rna = rna;
        modeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String((i === 1) === rna)));
        const swap = (arr) => arr.forEach((b, i) => { if (rna && b === 'T') arr[i] = 'U'; if (!rna && b === 'U') arr[i] = 'T'; });
        swap(S.left); swap(S.right);
        S.hint = false; say();
      }
      dock.appendChild(h('section', {},
        h('h2', {}, 'Which one are you building'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'DNA or RNA' }, modeBtns),
        h('p', { class: 'hint' }, 'The difference is two things: the sugar has one more oxygen on it, and thymine is swapped for uracil. Everything else about it is the same molecule.')));

      const grid = h('div', { class: 'chips', role: 'group', 'aria-label': 'The bases' });
      dock.appendChild(h('section', {}, h('h2', {}, 'The bases'), grid,
        h('p', { class: 'hint' }, 'Two of them are double rings and are called purines. The rest are single rings and are called pyrimidines. That is the only thing those two words mean.')));

      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'letters', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const readout = h('div', { class: 'readout' });
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const rungs = h('div', { class: 'cmp' });
      aux.appendChild(h('section', { class: 'panel' }, readout, statusP,
        h('h2', {}, 'Rung by rung'), rungs));

      /* ---------------- the same ladder, twisted ---------------- */
      /* The flat picture is the ladder before it twists. This is DNA as it
         really is: the same rungs, wound into a double helix you can turn.
         Wherever a pair does not fit, the rung is drawn broken, and you can see
         what a wrong base does to the shape of the whole thing. */
      const c3 = BL.stage(h('div'), '1.55 / 1', { label: 'A three-dimensional double helix built from the rungs above. Rungs that fit are drawn joined; rungs that do not are drawn broken. Drag to turn it.', focusable: true });
      c3.wrap.classList.add('flat');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'The same ladder, twisted'), c3.wrap,
        h('p', { class: 'hint' }, 'Ten rungs of the pattern you built, wound into a helix. Turn it: the two sugar–phosphate rails run all the way round the outside, and the bases pair up in the middle, out of the way. Break a rung above and you can see it break here.')));

      const table = h('div', { class: 'facts' });
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'Every pair you could make'), table,
        h('p', { class: 'hint' }, 'Ten pairs. Two survive. Nobody chose them — they are the ones where a double ring faces a single ring and the hydrogen bonds happen to line up along the edge.')));

      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'Where the message is'),
        h('p', {}, 'The rail is a sugar, a phosphate, a sugar, a phosphate, forever. It is identical in every strand of DNA in every living thing, and it is identical whether the strand says something or nothing at all. Because it never varies, it is useless for carrying information — and because it never varies, the bases hanging off it are free to.'),
        h('p', { class: 'hint' }, 'This is the same trick as a string of beads, or a row of letters on a page. The thing holding it together must not mean anything, or it could not hold everything together.')));

      function say() {
        grid.textContent = '';
        letters().forEach((k) => {
          const b = BASES[k];
          grid.appendChild(h('span', { class: 'chip', style: 'background:' + BL.alpha(b.col(), 0.25) + ';border-color:' + b.col() },
            b.id + ' · ' + b.name + ' · ' + (b.ring === 'double' ? 'double ring' : 'single ring')));
        });
        let good = 0;
        rungs.textContent = '';
        for (let i = 0; i < N; i++) {
          const f = fit(S.left[i], S.right[i]);
          if (f.ok) good++;
          rungs.appendChild(h('div', { class: 'cmp-row' + (S.sel && S.sel.i === i ? ' now' : '') },
            h('b', {}, S.left[i] + '–' + S.right[i]),
            h('span', { class: 'muted' }, f.why),
            h('span', { class: 'nums' }, f.ok ? 'fits' : 'no')));
        }
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, S.rna ? 'RNA' : 'DNA'),
          h('span', { class: 'zone' }, good + ' of ' + N + ' rungs fit'),
          h('span', { class: 'dim' }, S.left.join('') + ' facing ' + S.right.join('')));
        statusP.textContent = good === N
          ? 'Every rung fits. Both rails run straight and parallel, which is the only way a long molecule like this can stack up into a helix and stay the same width the whole way down.'
          : 'Some rungs do not fit, and you can see it in the rails: where a pair is too wide they bow outward, where it is too narrow they pinch in. A real cell has machinery whose entire job is spotting that bulge and fixing it.';

        table.textContent = '';
        const L = letters();
        const seen = new Set();
        L.forEach((x) => L.forEach((y) => {
          const k = [x, y].sort().join('');
          if (seen.has(k)) return;
          seen.add(k);
          const f = fit(x, y);
          table.appendChild(h('p', { class: 'fact' },
            h('b', {}, x + ' with ' + y + ' — '),
            f.ok ? 'fits, with ' + f.bonds + ' hydrogen bonds.' : f.why));
        }));
        check(good);
      }

      function check(good) {
        if (S.apart) steps.done('parts');
        if (S.tried.size >= 1) steps.done('rail');
        if (S.tried.has('AG') || S.tried.has('AA') || S.tried.has('GG')) steps.done('wide');
        if (S.tried.has('AC') || S.tried.has('GT') || S.tried.has('GU')) steps.done('edge');
        if (S.tried.size >= 8) steps.done('two');
        if (S.rna) steps.done('rna');
      }

      /* ---------------- picking, and a tray of bases ---------------- */
      /* Bases can be tapped to cycle, or dragged from the tray along the bottom
         onto any rung. Both are the same edit; the tray is for when you know
         which one you want. */
      const slotAt = (pt) => S.hits.find((hit) => pt.x > hit.x0 && pt.x < hit.x1 && Math.abs(pt.y - hit.y) < hit.h / 2);
      const tileAt = (pt) => (S.tray || []).find((t) => pt.x > t.x && pt.x < t.x + t.w && pt.y > t.y && pt.y < t.y + t.h);
      BL.drag(stage.canvas, {
        pick: (pt) => {
          const t = tileAt(pt); if (t) { S.hint = false; return { kind: 'tile', base: t.id, x: pt.x, y: pt.y, moved: 0 }; }
          const sl = slotAt(pt); if (sl) return { kind: 'slot', side: sl.side, i: sl.i, moved: 0 };
          return null;
        },
        move: (hd, pt, start) => {
          if (start) { hd.px = pt.x; hd.py = pt.y; return; }
          hd.moved += Math.abs(pt.x - hd.px) + Math.abs(pt.y - hd.py); hd.px = pt.x; hd.py = pt.y;
          if (hd.kind === 'tile') { S.ghost = { base: hd.base, x: pt.x, y: pt.y }; S.dropOn = slotAt(pt) || null; }
        },
        end: (hd, pt) => {
          if (hd.kind === 'slot') { if (hd.moved < 8) cycle(hd.side, hd.i); return; }
          const sl = slotAt(pt);
          S.ghost = null; S.dropOn = null;
          if (sl) {
            const arr = sl.side === 'l' ? S.left : S.right;
            arr[sl.i] = hd.base; S.sel = { side: sl.side, i: sl.i }; S.hint = false;
            S.tried.add([S.left[sl.i], S.right[sl.i]].sort().join(''));
            say();
          }
        },
        hover: (pt) => { stage.canvas.style.cursor = pt && (tileAt(pt) || slotAt(pt)) ? (tileAt(pt) ? 'grab' : 'pointer') : 'default'; },
      });

      /* ---------------- drawing ---------------- */
      function drawBase(x, y, w, hgt, b, dir, col) {
        // dir +1 means the facing edge is on the right
        ctx.save();
        ctx.beginPath();
        const x0 = dir > 0 ? x : x - w, x1 = dir > 0 ? x + w : x;
        if (ctx.roundRect) ctx.roundRect(x0, y - hgt / 2, w, hgt, hgt * 0.3); else ctx.rect(x0, y - hgt / 2, w, hgt);
        ctx.fillStyle = BL.alpha(col, 0.9); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(BL.pal.fg, 0.3); ctx.stroke();
        ctx.restore();
        // a double ring gets a line down it, so you can see at a glance it is two
        if (b.ring === 'double') {
          ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(BL.pal.bg, 0.6);
          const mx = dir > 0 ? x + w * 0.45 : x - w * 0.45;
          ctx.beginPath(); ctx.moveTo(mx, y - hgt / 2 + 3); ctx.lineTo(mx, y + hgt / 2 - 3); ctx.stroke();
        }
        ctx.font = BL.font(800, Math.min(18, hgt * 0.55));
        ctx.fillStyle = O.ink(col);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.id, dir > 0 ? x + w * (b.ring === 'double' ? 0.72 : 0.5) : x - w * (b.ring === 'double' ? 0.72 : 0.5), y);
        ctx.textBaseline = 'alphabetic';
        return { x0, x1, face: dir > 0 ? x1 : x0 };
      }

      /* ---------------- the double helix ---------------- */
      const V3 = BL.view3d(c3.canvas, { yaw: 0.4, pitch: 0.18, auto: 0.35 });
      const MR = 10;                                   // rungs: the five you built, twice round
      function drawHelix(dt) {
        const pal = BL.pal, cw = c3.w, ch = c3.h, c = c3.ctx;
        if (!cw) return;
        c.clearRect(0, 0, cw, ch);
        V3.step(dt);
        V3.frame(cw, ch, 3.5, { x: 0, y: 0, z: 0 });
        const sc = V3.scale, R = 1.1, rise = 0.58, twist = 0.63, offs = 2.55;
        const rb = sc * 0.13;
        const A = [], B = [];
        for (let j = 0; j < MR; j++) {
          const th = j * twist, y = (j - (MR - 1) / 2) * rise;
          A.push({ x: R * Math.cos(th), y, z: R * Math.sin(th) });
          B.push({ x: R * Math.cos(th + offs), y, z: R * Math.sin(th + offs) });
        }
        const PA = A.map((q) => V3.project(q)), PB = B.map((q) => V3.project(q));
        // the two rails: sugar and phosphate, going all the way round
        [[PA, 0], [PB, 1]].forEach(([P, side]) => {
          for (let j = 0; j < MR - 1; j++) V3.add((P[j].z + P[j + 1].z) / 2 - 0.02, () => BL.stick3(c, P[j], P[j + 1], rb * 1.1, { color: BL.alpha(pal.eP, 0.5 + 0.45 * Math.min(P[j].d, P[j + 1].d)), ta: BL.sphereR(P[j], rb) * 0.8, tb: BL.sphereR(P[j + 1], rb) * 0.8 }));
          for (let j = 0; j < MR; j++) V3.add(P[j].z, () => BL.sphere3(c, P[j], rb * 1.1, pal.eP, null));
        });
        let good = 0;
        for (let j = 0; j < MR; j++) {
          const a = BASES[S.left[j % N]], b = BASES[S.right[j % N]];
          const f = fit(S.left[j % N], S.right[j % N]);
          if (f.ok) good++;
          // each base reaches in from its own rail; purines reach further than pyrimidines
          const wa = f.kind === 'wide' ? 0.62 : f.kind === 'narrow' ? 0.36 : a.width === 2 ? 0.62 : 0.38;
          const wb = f.kind === 'wide' ? 0.62 : f.kind === 'narrow' ? 0.36 : b.width === 2 ? 0.62 : 0.38;
          const ma = { x: A[j].x + (B[j].x - A[j].x) * wa, y: A[j].y, z: A[j].z + (B[j].z - A[j].z) * wa };
          const mb = { x: B[j].x + (A[j].x - B[j].x) * wb, y: B[j].y, z: B[j].z + (A[j].z - B[j].z) * wb };
          const qa = V3.project(ma), qb = V3.project(mb), za = PA[j], zb = PB[j];
          V3.add((za.z + qa.z) / 2, () => BL.stick3(c, za, qa, rb * 1.5, { color: BL.alpha(a.col(), 0.4 + 0.6 * Math.min(za.d, qa.d)), ta: 0, tb: 0 }));
          V3.add((zb.z + qb.z) / 2, () => BL.stick3(c, zb, qb, rb * 1.5, { color: BL.alpha(b.col(), 0.4 + 0.6 * Math.min(zb.d, qb.d)) }));
          V3.add(qa.z, () => BL.sphere3(c, qa, rb * 0.95, a.col(), a.id));
          V3.add(qb.z, () => BL.sphere3(c, qb, rb * 0.95, b.col(), b.id));
          const mid = { x: (qa.x + qb.x) / 2, y: (qa.y + qb.y) / 2, z: (qa.z + qb.z) / 2, d: Math.min(qa.d, qb.d) };
          V3.add(mid.z + 0.05, () => {
            if (f.ok) { c.save(); c.globalAlpha = 0.5 + 0.5 * mid.d; O.weakBond(c, qa.x, qa.y, qb.x, qb.y, { width: Math.max(2, rb * 0.5) }); c.restore(); }
            else { c.save(); c.lineWidth = 3; c.strokeStyle = pal.pos; c.beginPath(); c.moveTo(mid.x - 6, mid.y - 6); c.lineTo(mid.x + 6, mid.y + 6); c.moveTo(mid.x + 6, mid.y - 6); c.lineTo(mid.x - 6, mid.y + 6); c.stroke(); c.restore(); }
          });
        }
        V3.flush();
        V3.cue(c, pal);
        BL.label(c, good === MR ? 'every rung fits — the helix runs true' : (MR - good) + ' of ' + MR + ' rungs do not fit', cw / 2, ch - 16, { font: BL.font(700, 13), border: good === MR ? pal.ui : pal.pos });
      }

      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        S.t += dt;
        ctx.clearRect(0, 0, cw, ch);
        drawHelix(dt);
        if (!cw) return;
        S.hits = [];

        if (S.apart) { drawApart(pal, cw, ch); return; }

        const top = 52, bot = ch - 88;
        const rowH = (bot - top) / N;
        const unit = clamp(Math.min((cw - 150) / 6.2, rowH * 1.7), 22, 68);
        const mid = cw / 2;
        const railL = [], railR = [];
        const hgt = Math.min(rowH * 0.66, 40);

        for (let i = 0; i < N; i++) {
          const y = top + rowH * (i + 0.5);
          const a = BASES[S.left[i]], b = BASES[S.right[i]];
          const f = fit(S.left[i], S.right[i]);
          // the rails move: too wide and they bow out, too narrow and they pinch
          const push = f.kind === 'wide' ? unit * 0.55 : f.kind === 'narrow' ? -unit * 0.5 : 0;
          const gap = unit * 1.9 + push;
          const lx = mid - gap / 2, rx = mid + gap / 2;
          railL.push([lx, y]); railR.push([rx, y]);

          const aw = a.width * unit * 0.62, bw = b.width * unit * 0.62;
          // the stub of sugar each base hangs off, so it is attached to the rail
          O.bond(ctx, lx - unit * 0.5, y, lx, y, { width: unit * 0.16, color: BL.alpha(pal.eP, 0.85) });
          O.bond(ctx, rx + unit * 0.5, y, rx, y, { width: unit * 0.16, color: BL.alpha(pal.eP, 0.85) });
          const la = drawBase(lx, y, aw, hgt, a, 1, a.col());
          const rb = drawBase(rx, y, bw, hgt, b, -1, b.col());
          S.hits.push({ x0: la.x0, x1: la.x1, y, h: hgt, side: 'l', i });
          S.hits.push({ x0: rb.x0, x1: rb.x1, y, h: hgt, side: 'r', i });

          // the little donors and acceptors along the facing edges
          const marks = (edge, x, out) => edge.split('').map((c, k) => {
            const yy = y - hgt * 0.28 + (k / Math.max(1, edge.length - 1)) * hgt * 0.56;
            ctx.beginPath(); ctx.arc(x + out * 5, yy, 3.6, 0, TAU);
            if (c === 'D') { ctx.fillStyle = pal.pos; ctx.fill(); } else { ctx.lineWidth = 2; ctx.strokeStyle = pal.neg; ctx.stroke(); }
            return { y: yy, c };
          });
          const ma = marks(a.edge, la.face, 1), mb = marks(b.edge, rb.face, -1);
          if (f.ok) {
            ma.forEach((p, k) => O.weakBond(ctx, la.face + 8, p.y, rb.face - 8, mb[k].y, { width: 3 }));
          } else if (f.kind === 'edge') {
            ctx.strokeStyle = pal.pos; ctx.lineWidth = 2.5;
            const cxm = (la.face + rb.face) / 2;
            ctx.beginPath(); ctx.moveTo(cxm - 7, y - 7); ctx.lineTo(cxm + 7, y + 7); ctx.moveTo(cxm + 7, y - 7); ctx.lineTo(cxm - 7, y + 7); ctx.stroke();
          }
        }

        // the two rails, bending wherever a rung is the wrong size
        [railL, railR].forEach((rail, s) => {
          ctx.beginPath();
          rail.forEach(([x, y], i) => {
            const rx = x + (s ? 1 : -1) * unit * 0.5;
            i ? ctx.lineTo(rx, y) : ctx.moveTo(rx, y);
          });
          ctx.lineWidth = Math.max(5, unit * 0.22); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.strokeStyle = pal.eP; ctx.stroke();
          rail.forEach(([x, y]) => {
            const rx = x + (s ? 1 : -1) * unit * 0.5;
            O.atom(ctx, rx, y, unit * 0.2, 'P', { label: false });
          });
        });
        BL.label(ctx, 'sugar–phosphate rail', railL[0][0] - unit * 0.5, top - 22, { font: BL.font(600, 13), border: pal.eP });
        BL.label(ctx, 'and the same again', railR[0][0] + unit * 0.5, top - 22, { font: BL.font(600, 13), border: pal.eP });
        // the tray: one tile of each base, to drag onto a rung
        const ids = letters(), tw = clamp((cw - 60) / ids.length, 44, 96), th = 34, ty = ch - 62;
        const tx0 = cw / 2 - (tw * ids.length + 8 * (ids.length - 1)) / 2;
        S.tray = ids.map((id, i) => ({ id, x: tx0 + i * (tw + 8), y: ty, w: tw, h: th }));
        S.tray.forEach((t) => {
          const b = BASES[t.id];
          ctx.save();
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(t.x, t.y, t.w, t.h, 10); else ctx.rect(t.x, t.y, t.w, t.h);
          ctx.fillStyle = BL.alpha(b.col(), S.ghost && S.ghost.base === t.id ? 0.35 : 0.92); ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(pal.fg, 0.3); ctx.stroke();
          ctx.font = BL.font(800, 15); ctx.fillStyle = O.ink(b.col()); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(t.id + ' · ' + (b.ring === 'double' ? '▭▭' : '▭'), t.x + t.w / 2, t.y + t.h / 2);
          ctx.restore();
        });
        // where a dragged base would land
        if (S.dropOn) { ctx.save(); ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.strokeStyle = pal.ui; ctx.strokeRect(S.dropOn.x0 - 4, S.dropOn.y - S.dropOn.h / 2 - 4, S.dropOn.x1 - S.dropOn.x0 + 8, S.dropOn.h + 8); ctx.restore(); }
        if (S.ghost) {
          const b = BASES[S.ghost.base], gw = b.width * unit * 0.62, gh = Math.min(rowH * 0.66, 40);
          ctx.save(); ctx.globalAlpha = 0.9;
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(S.ghost.x - gw / 2, S.ghost.y - gh / 2, gw, gh, gh * 0.3); else ctx.rect(S.ghost.x - gw / 2, S.ghost.y - gh / 2, gw, gh);
          ctx.fillStyle = b.col(); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = pal.fg; ctx.stroke();
          ctx.font = BL.font(800, 18); ctx.fillStyle = O.ink(b.col()); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(S.ghost.base, S.ghost.x, S.ghost.y); ctx.restore();
        }
        BL.label(ctx, S.hint && !BL.reduced ? 'drag a base from the tray onto a rung — or tap one' : S.rna ? 'ribose · uracil instead of thymine' : 'deoxyribose · thymine',
          cw / 2, ch - 12, { font: BL.font(700, 13), border: pal.ui });
      }

      /* One nucleotide, in pieces, so the three parts are countable. */
      function drawApart(pal, cw, ch) {
        const s = clamp(Math.min(cw / 7, ch / 4.4), 34, 86);
        const cy = ch * 0.5, cx = cw / 2;
        O.atom(ctx, cx - s * 1.9, cy, s * 0.42, 'P');
        BL.label(ctx, 'a phosphate', cx - s * 1.9, cy + s * 0.95, { font: BL.font(700, 14), border: pal.eP });
        BL.label(ctx, 'joins to the next one', cx - s * 1.9, cy + s * 1.5, { font: BL.font(400, 13), bg: false, color: pal.muted });

        const pts = O.ringPts(cx, cy, s * 0.6, 5, -Math.PI / 2);
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fillStyle = BL.alpha(pal.tDipole, pal.dark ? 0.3 : 0.2); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = pal.tDipole; ctx.stroke();
        BL.label(ctx, S.rna ? 'ribose — a five-carbon sugar' : 'deoxyribose — a five-carbon sugar', cx, cy + s * 1.1, { font: BL.font(700, 14), border: pal.tDipole });
        BL.label(ctx, S.rna ? 'this is the one with the extra oxygen' : 'one oxygen short, which is what “deoxy” means', cx, cy + s * 1.65, { font: BL.font(400, 13), bg: false, color: pal.muted });

        const b = BASES[S.left[0]];
        drawBase(cx + s * 1.3, cy, s * 0.55 * b.width, s * 0.72, b, 1, b.col());
        BL.label(ctx, 'a base — ' + b.name, cx + s * 1.8, cy + s * 0.95, { font: BL.font(700, 14), border: b.col() });
        BL.label(ctx, 'the only part that changes', cx + s * 1.8, cy + s * 1.5, { font: BL.font(400, 13), bg: false, color: pal.muted });

        O.bond(ctx, cx - s * 1.48, cy, cx - s * 0.6, cy, { width: s * 0.1 });
        O.bond(ctx, cx + s * 0.6, cy, cx + s * 1.3, cy, { width: s * 0.1 });
        BL.label(ctx, 'three parts, every time', cw / 2, 26, { font: BL.font(800, 15), border: pal.ui });
      }

      say();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); c3.destroy(); } };
    },
  });
})();
