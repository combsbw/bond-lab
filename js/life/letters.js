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
    lede: 'Two strands facing each other, five rungs between them. Click any base to change it and watch what the rung does: snap together, shove the rails apart, pinch them in, or simply fail to line up. Only two of the ten possible pairs survive both tests.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        left: ['A', 'G', 'C', 'T', 'A'], right: ['T', 'C', 'G', 'A', 'T'],
        rna: false, apart: false, t: 0, hint: true, hits: [], tried: new Set(), sel: null,
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

      /* ---------------- picking ---------------- */
      stage.canvas.addEventListener('pointerdown', (e) => {
        const r = stage.canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        for (const hit of S.hits) if (mx > hit.x0 && mx < hit.x1 && Math.abs(my - hit.y) < hit.h / 2) { cycle(hit.side, hit.i); return; }
      });
      stage.canvas.addEventListener('pointermove', (e) => {
        const r = stage.canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        stage.canvas.style.cursor = S.hits.some((hit) => mx > hit.x0 && mx < hit.x1 && Math.abs(my - hit.y) < hit.h / 2) ? 'pointer' : 'default';
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

      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        S.t += dt;
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        S.hits = [];

        if (S.apart) { drawApart(pal, cw, ch); return; }

        const top = 52, bot = ch - 40;
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
        BL.label(ctx, S.hint && !BL.reduced ? 'click a base to change it' : S.rna ? 'ribose · uracil instead of thymine' : 'deoxyribose · thymine',
          cw / 2, ch - 14, { font: BL.font(700, 14), border: pal.ui });
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
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
