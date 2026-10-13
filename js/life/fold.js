/* Fold: a protein's shape, and where it comes from.

   The chapter gives four levels of protein structure and they are easy to
   misread as four kinds of protein. They are four things true of one molecule
   at once: the order you threaded the beads on (primary), the backbone
   holding on to itself a few places along (secondary), the whole thing
   collapsing into a lump with the greasy bits hidden (tertiary), and two
   finished lumps sticking to each other (quaternary).

   None of it is designed. Nothing tells the chain what shape to be. You set
   the order of the beads and the water does the rest: the greasy ones are
   pushed together because the water will not have them, the charged ones find
   each other, and whatever is left over is the shape. Change one bead and you
   can change the lot — which is a real disease, and it is one letter.

   Heat it and the shape goes. Cool it and the shape does not come back,
   because by then the chains have got hold of each other instead. That is
   frying an egg, and it is the same result as boiling the pineapple juice
   two instruments ago. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;
  const TAU = Math.PI * 2;

  /* The four kinds of R-group this instrument needs. Twenty amino acids
     really do boil down to about this for the purposes of folding. */
  const R = {
    grease: { id: 'grease', tag: 'greasy', col: () => BL.pal.eTail, says: 'water will not have it, so it gets pushed inward' },
    wet: { id: 'wet', tag: 'water-loving', col: () => BL.pal.neg, says: 'happy facing the water, so it ends up on the outside' },
    plus: { id: 'plus', tag: 'positive', col: () => BL.pal.pos, says: 'pulls on anything negative' },
    minus: { id: 'minus', tag: 'negative', col: () => BL.pal.eN, says: 'pulls on anything positive' },
  };
  const RK = ['grease', 'wet', 'plus', 'minus'];
  const N = 16;                       // beads per chain
  const L0 = 1.0, L3 = 2.1;           // neighbour spacing, and the reach of a backbone hold
  const T_COOK = 340;

  const PRESETS = [
    ['A real one', 'wet,plus,grease,grease,grease,wet,minus,grease,grease,wet,plus,grease,grease,minus,wet,wet'],
    ['All greasy', Array(N).fill('grease').join(',')],
    ['All water-loving', Array(N).fill('wet').join(',')],
    ['Greasy in the middle', 'wet,wet,wet,grease,grease,grease,grease,grease,grease,grease,grease,grease,wet,wet,wet,wet'],
    ['Plus and minus', 'plus,minus,plus,minus,plus,minus,plus,minus,plus,minus,plus,minus,plus,minus,plus,minus'],
  ];

  const STEPS = [
    { id: 'bury', text: 'Fold a chain whose greasy beads are all in the middle of the sequence.',
      how: 'Press “Greasy in the middle” and let it settle. Watch where the brown beads end up.',
      ask: 'where do the greasy R-groups finish?',
      opts: ['Buried in the middle of the lump', 'Out on the surface', 'Spread evenly through it'], right: 0 },
    { id: 'nothing', text: 'Make every R-group water-loving and fold that.',
      how: 'Press “All water-loving” and wait. Compare the compactness bar with the one before.',
      ask: 'with nothing greasy in it, will the chain still ball up?',
      opts: ['Yes, just the same', 'No — nothing is pushing it together'], right: 1 },
    { id: 'one', text: 'Change one bead in the middle of a folded chain.',
      how: 'Click one square in the sequence strip to cycle it, and watch the shape settle again.',
      ask: 'one bead changed out of sixteen. How much can the shape change?',
      opts: ['Barely at all', 'Sometimes a great deal'], right: 1 },
    { id: 'cook', text: 'Heat it until it comes undone, then cool it right back down.',
      how: 'Drag the temperature to hot, wait until it is a loose string, then drag it back to warm.',
      ask: 'does it fold back into the shape it had?',
      opts: ['Yes, it recovers', 'No — it does not come back'], right: 1 },
    { id: 'left', text: 'Read what survived the heating.',
      how: 'Look at the four levels panel after cooking.',
      ask: 'after cooking, what is left of the protein?',
      opts: ['The order of the beads, and nothing else', 'Nothing at all', 'Everything, it is only hot'], right: 0 },
    { id: 'two', text: 'Put two chains in and let them find each other.',
      how: 'Press “Two chains”, let both settle, then look at the fourth level.',
      ask: 'two finished chains next to each other —',
      opts: ['stay separate', 'can stick together into one bigger thing'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<path d="M24 96 C60 20 100 110 128 48 C146 12 178 44 176 78" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" opacity=".55"/>' +
    '<g><circle cx="96" cy="70" r="12" fill="var(--e-tail)"/><circle cx="118" cy="56" r="12" fill="var(--e-tail)"/>' +
    '<circle cx="24" cy="96" r="11" fill="var(--neg)"/><circle cx="176" cy="78" r="11" fill="var(--neg)"/>' +
    '<circle cx="60" cy="40" r="11" fill="var(--pos)"/></g></svg>';

  BL.register({
    id: 'fold', field: 'four', order: 0, name: 'Fold',
    tagline: 'Set the order of the beads. The water decides the shape.',
    lede: 'A chain of amino acids, each with an R-group that is greasy, water-loving, positive or negative. Nothing here is told what shape to be. Set the sequence, let go, and watch what the water pushes it into — then heat it and find out what you can and cannot get back.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        seq: PRESETS[0][1].split(','), nch: 1, T: 300, t: 0,
        p: [], links: [], cooked: false, wasHot: false, hint: true, settle: 0, hits: [],
      };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A chain of coloured beads in water. Greasy beads clump together and the chain collapses round them. Heating it shakes the shape apart.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- the chain ---------------- */
      function build() {
        S.p = []; S.links = []; S.cooked = false; S.wasHot = false; S.settle = 0;
        for (let c = 0; c < S.nch; c++) {
          for (let i = 0; i < N; i++) {
            S.p.push({
              x: 3 + i * L0 * 0.95 + (Math.random() - 0.5) * 0.2,
              y: (c ? 7.5 : 4.5) + Math.sin(i * 0.6) * 0.4,
              vx: 0, vy: 0, c, i, k: S.seq[i],
            });
          }
        }
        say();
      }
      const idx = (c, i) => c * N + i;

      /* One step of the folding. Springs along the backbone, a weaker spring
         three along (that is the backbone holding on to itself), the greasy
         beads pulling together, charges pulling or pushing, and a thermostat
         shaking the lot. */
      function step(dt) {
        const p = S.p, n = p.length;
        const kT = clamp((S.T - 260) / 420, 0.02, 1.1);
        const hot = S.T > T_COOK;
        const sec = hot ? 0.1 : 1;                 // the backbone lets go of itself when hot
        const grab = hot ? 0.25 : 1;
        for (const a of p) { a.fx = 0; a.fy = 0; }
        const pull = (a, b, L, k) => {
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6;
          const f = k * (d - L) / d;
          a.fx += f * dx; a.fy += f * dy; b.fx -= f * dx; b.fy -= f * dy;
        };
        for (let c = 0; c < S.nch; c++) {
          for (let i = 0; i < N - 1; i++) pull(p[idx(c, i)], p[idx(c, i + 1)], L0, 26);
          for (let i = 0; i < N - 3; i++) pull(p[idx(c, i)], p[idx(c, i + 3)], L3, 2.6 * sec);
        }
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const a = p[i], b = p[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > 16) continue;
            const d = Math.sqrt(d2) || 1e-6;
            let f = 0;
            if (d < 0.92) f = -34 * (0.92 - d);                                   // nothing sits on top of anything
            if (a.k === 'grease' && b.k === 'grease' && d < 3.2) f += 1.5 * grab;  // water pushes them together
            if ((a.k === 'plus' && b.k === 'minus') || (a.k === 'minus' && b.k === 'plus')) { if (d < 3.4) f += 1.3 * grab; }
            if (a.k === b.k && (a.k === 'plus' || a.k === 'minus') && d < 2.6) f -= 1.4;
            if (!f) continue;
            const fx = (f * dx) / d, fy = (f * dy) / d;
            a.fx += fx; a.fy += fy; b.fx -= fx; b.fy -= fy;
          }
        }
        // the water-loving beads would rather be on the outside
        let cx = 0, cy = 0;
        for (const a of p) { cx += a.x; cy += a.y; }
        cx /= n; cy /= n;
        for (const a of p) {
          const dx = a.x - cx, dy = a.y - cy, d = Math.hypot(dx, dy) || 1e-6;
          if (a.k === 'wet') { a.fx += (dx / d) * 0.6 * grab; a.fy += (dy / d) * 0.6 * grab; }
          a.fx -= dx * 0.04; a.fy -= dy * 0.04;         // and nothing wanders off the stage
        }
        // links the chains made while they were cooked, which do not come undone
        S.links.forEach(([i, j]) => pull(p[i], p[j], 1.0, 18));
        // move
        const g = 3.0, c0 = Math.exp(-g * dt), sg = Math.sqrt((1 - c0 * c0) * kT);
        for (const a of p) {
          a.vx = c0 * a.vx + a.fx * dt + sg * BL.randn();
          a.vy = c0 * a.vy + a.fy * dt + sg * BL.randn();
          const sp = Math.hypot(a.vx, a.vy);
          if (sp > 14) { a.vx *= 14 / sp; a.vy *= 14 / sp; }
          a.x += a.vx * dt; a.y += a.vy * dt;
        }
        // cooking: unfolded chains get hold of each other, and that is permanent
        if (hot && S.nch > 1 && S.links.length < 10) {
          for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
              if (p[i].c === p[j].c) continue;
              if (p[i].k !== 'grease' || p[j].k !== 'grease') continue;
              if (S.links.some(([a, b]) => a === i || b === i || a === j || b === j)) continue;
              if (Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y) < 1.5) { S.links.push([i, j]); S.cooked = true; }
            }
          }
        }
        if (hot) { S.wasHot = true; S.cooked = true; }
      }

      /* ---------------- what the four levels measure ---------------- */
      function levels() {
        const p = S.p, n = p.length;
        let cx = 0, cy = 0;
        for (const a of p) { cx += a.x; cy += a.y; }
        cx /= n; cy /= n;
        let rg = 0, gin = 0, ng = 0, win = 0, nw = 0;
        for (const a of p) {
          const d = Math.hypot(a.x - cx, a.y - cy);
          rg += d * d;
          if (a.k === 'grease') { gin += d; ng++; }
          if (a.k === 'wet') { win += d; nw++; }
        }
        rg = Math.sqrt(rg / n);
        let holds = 0;
        for (let c = 0; c < S.nch; c++) {
          for (let i = 0; i < N - 3; i++) {
            const a = p[idx(c, i)], b = p[idx(c, i + 3)];
            if (Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - L3) < 0.5) holds++;
          }
        }
        return {
          rg, holds,
          buried: ng && nw ? clamp(1 - (gin / ng) / Math.max(0.3, win / nw), -1, 1) : 0,
          compact: clamp(1 - (rg - 1.6) / 2.6, 0, 1),
          joined: S.links.length,
        };
      }

      /* ---------------- dock ---------------- */
      const strip = h('div', { class: 'el-grid', role: 'group', 'aria-label': 'The sequence. Click a bead to change its R-group.' });
      const stripBtns = [];
      for (let i = 0; i < N; i++) {
        const b = h('button', { type: 'button', class: 'chip', 'aria-label': 'Bead ' + (i + 1) });
        b.addEventListener('click', () => {
          S.seq[i] = RK[(RK.indexOf(S.seq[i]) + 1) % RK.length];
          S.p.forEach((a) => { if (a.i === i) a.k = S.seq[i]; });
          S.changed = true; S.hint = false; say();
        });
        stripBtns.push(b); strip.appendChild(b);
      }
      dock.appendChild(h('section', {},
        h('h2', {}, 'The sequence — the first level'),
        strip,
        h('p', { class: 'hint' }, 'Sixteen beads. Click one to cycle it through greasy, water-loving, positive, negative. This is the only thing you get to decide; everything below is what the water does with it.'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Ready-made sequences' },
          PRESETS.map(([name, seq]) => h('button', {
            type: 'button', class: 'chip',
            onclick: () => { S.seq = seq.split(','); build(); S.hint = false; },
          }, name)))));

      const tOut = h('output', { class: 'val' });
      const tIn = h('input', { type: 'range', min: '280', max: '380', step: '1', value: '300', 'aria-label': 'Temperature' });
      const tword = (T) => (T < 292 ? 'cool' : T < 306 ? 'body warm' : T < 322 ? 'warm' : T < T_COOK ? 'hot' : T < 358 ? 'very hot' : 'near boiling');
      const tsay = (T) => tword(T) + (BL.nums ? ' · ' + Math.round(T - 273) + ' °C' : '');
      tIn.addEventListener('input', () => { S.T = parseFloat(tIn.value); tOut.textContent = tsay(S.T); S.hint = false; say(); });
      tOut.textContent = tsay(S.T);
      const setT = (v) => { S.T = v; tIn.value = String(v); tOut.textContent = tsay(v); S.hint = false; say(); };
      dock.appendChild(h('section', {},
        h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'Temperature'), tOut),
          h('div', { class: 'range-wrap' }, tIn, h('div', { class: 'range-ends' }, h('span', {}, 'cool'), h('span', {}, 'frying pan')))),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'How many chains' },
          h('button', { type: 'button', class: 'chip', onclick: () => { S.nch = 1; build(); } }, 'One chain'),
          h('button', { type: 'button', class: 'chip', onclick: () => { S.nch = 2; build(); } }, 'Two chains')),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action ghost', onclick: () => setT(378) }, 'Cook it'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => setT(300) }, 'Cool it back down'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => build() }, 'Fresh chain'))));

      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'fold', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const readout = h('div', { class: 'readout' });
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const lv = h('div', { class: 'facts' });
      aux.appendChild(h('section', { class: 'panel' }, readout, statusP,
        h('h2', {}, 'The four levels, measured rather than asserted'), lv));

      const meters = h('div', { class: 'meters' });
      const compM = BL.meter('How tightly it has balled up');
      const buryM = BL.meter('How well the greasy beads are hidden');
      meters.append(compM.el, buryM.el);
      aux.appendChild(h('section', { class: 'panel' }, meters,
        h('p', { class: 'hint' }, 'A protein’s job is its shape: an enzyme’s notch, a hormone’s fit, a hair’s stiffness. Lose the shape and you have lost the job, even though every atom is still there. That is what “denatured” means, and it is what a fried egg is.')));

      function say() {
        const L = levels();
        stripBtns.forEach((b, i) => {
          const k = R[S.seq[i]];
          b.textContent = k.tag[0].toUpperCase();
          b.setAttribute('title', k.tag);
          b.style.background = BL.alpha(k.col(), 0.3);
          b.style.borderColor = k.col();
        });
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, S.cooked ? 'Cooked' : L.compact > 0.6 ? 'Folded' : L.compact > 0.3 ? 'Half folded' : 'A loose string'),
          h('span', { class: 'zone' }, tword(S.T)),
          h('span', { class: 'dim' }, S.nch + (S.nch === 1 ? ' chain' : ' chains') + ' · ' + N * S.nch + ' amino acids'));
        statusP.textContent = S.cooked && S.T < T_COOK
          ? 'Cooled back down, and it has not gone back. The order of the beads is untouched — every single one is where it was — but the shape has gone and the chains have got hold of each other. You cannot un-fry an egg.'
          : S.T > T_COOK
            ? 'Too hot. The backbone has let go of itself and the greasy beads are no longer being held in. Watch what the chains do to each other while they are loose.'
            : L.compact > 0.6
              ? 'Settled. Nothing arranged this: the water pushed the greasy beads together and this is what was left over.'
              : 'Still finding its shape. Give it a moment.';

        lv.textContent = '';
        lv.append(
          h('p', { class: 'fact' }, h('b', {}, 'First — the order. '), S.seq.map((k) => R[k].tag[0].toUpperCase()).join('') + '. This is the only thing that was ever decided, and the only thing heat cannot take away.'),
          h('p', { class: 'fact' }, h('b', {}, 'Second — the backbone holding itself. '), L.holds + (L.holds === 1 ? ' place' : ' places') + ' where a bead is holding one three along. Enough of those in a row and you have a coil; that is the spiral in every picture of a protein.'),
          h('p', { class: 'fact' }, h('b', {}, 'Third — the whole shape. '), L.compact > 0.6 ? 'Balled up, with the greasy beads inside.' : L.compact > 0.3 ? 'Partly collapsed.' : 'Not collapsed — it is lying there as a string.'),
          h('p', { class: 'fact' }, h('b', {}, 'Fourth — chains stuck together. '), S.nch < 2 ? 'Only one chain in the bowl, so there is no fourth level to have.' : L.joined ? L.joined + (L.joined === 1 ? ' place' : ' places') + ' where the two chains are holding each other. That is one bigger molecule now.' : 'The two chains are still separate.'));
        compM.set(L.compact, L.compact > 0.6 ? 'into a lump' : L.compact > 0.3 ? 'part way' : 'not at all', '');
        buryM.set(clamp((L.buried + 1) / 2, 0, 1), L.buried > 0.25 ? 'inside, out of the water' : L.buried > -0.1 ? 'about evenly spread' : 'out on the surface', '');
        buryM.tone(L.buried > 0.25 ? BL.pal.eTail : BL.pal.muted);
        check(L);
      }

      function check(L) {
        if (L.compact > 0.55 && L.buried > 0.25 && S.seq.indexOf('grease') >= 0) steps.done('bury');
        if (S.seq.every((k) => k === 'wet') && L.compact < 0.4) steps.done('nothing');
        if (S.changed && L.compact > 0.3) steps.done('one');
        if (S.cooked && S.T < T_COOK) { steps.done('cook'); steps.done('left'); }
        if (S.nch > 1 && S.links.length) steps.done('two');
      }

      /* ---------------- drawing ---------------- */
      let lastSay = 0;
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        S.t += dt;
        for (let k = 0; k < 6; k++) step(0.006);
        if (performance.now() - lastSay > 240) { lastSay = performance.now(); say(); }
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        const p = S.p;
        let lo = 1e9, hi = -1e9, lo2 = 1e9, hi2 = -1e9;
        p.forEach((a) => { lo = Math.min(lo, a.x); hi = Math.max(hi, a.x); lo2 = Math.min(lo2, a.y); hi2 = Math.max(hi2, a.y); });
        const u = clamp(Math.min((cw - 70) / Math.max(5, hi - lo), (ch - 90) / Math.max(4, hi2 - lo2)), 8, 42);
        const ox = cw / 2 - ((lo + hi) / 2) * u, oy = ch / 2 - ((lo2 + hi2) / 2) * u;
        const X = (a) => ox + a.x * u, Y = (a) => oy + a.y * u;

        // the backbone
        for (let c = 0; c < S.nch; c++) {
          ctx.beginPath();
          for (let i = 0; i < N; i++) { const a = p[idx(c, i)]; i ? ctx.lineTo(X(a), Y(a)) : ctx.moveTo(X(a), Y(a)); }
          ctx.lineWidth = u * 0.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.strokeStyle = BL.alpha(pal.fg, c ? 0.3 : 0.45);
          ctx.stroke();
        }
        // where the backbone is holding on to itself
        for (let c = 0; c < S.nch; c++) {
          for (let i = 0; i < N - 3; i++) {
            const a = p[idx(c, i)], b = p[idx(c, i + 3)];
            if (Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - L3) > 0.5) continue;
            O.weakBond(ctx, X(a), Y(a), X(b), Y(b), { width: Math.max(2, u * 0.11) });
          }
        }
        // what the cooking welded together
        S.links.forEach(([i, j]) => {
          O.bond(ctx, X(p[i]), Y(p[i]), X(p[j]), Y(p[j]), { width: u * 0.16, color: BL.alpha(pal.pos, 0.9) });
        });
        // the beads
        p.forEach((a) => O.atom(ctx, X(a), Y(a), u * 0.34, 'C', { color: R[a.k].col(), label: false }));

        BL.label(ctx, tsay(S.T), 78, 22, { font: BL.font(700, 14), border: S.T > T_COOK ? pal.pos : pal.line2 });
        if (S.cooked) BL.label(ctx, S.T > T_COOK ? 'coming apart' : 'cooked — it will not go back', cw - 130, 22, { font: BL.font(700, 14), border: pal.pos });
        if (S.hint && !BL.reduced) BL.label(ctx, 'change the sequence, or turn the heat up →', cw / 2, 22, { font: BL.font(700, 14), border: pal.ui });
        const key = [['grease', 'greasy'], ['wet', 'water-loving'], ['plus', 'positive'], ['minus', 'negative']];
        key.forEach(([k, name], i) => {
          const x = 24 + i * ((cw - 48) / 4);
          O.atom(ctx, x + 8, ch - 18, 7, 'C', { color: R[k].col(), label: false });
          ctx.font = BL.font(600, 13); ctx.fillStyle = pal.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(name, x + 20, ch - 18);
          ctx.textBaseline = 'alphabetic';
        });
      }

      build();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
