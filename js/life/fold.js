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
  const R_ = { grease: () => BL.pal.eTail, wet: () => BL.pal.neg, plus: () => BL.pal.pos, minus: () => BL.pal.eN };
  const N = 16;                       // beads per chain
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
    { id: 'pull', text: 'Grab a bead and pull the folded chain out straight, then let go.',
      how: 'Let it settle, press on any bead and drag it away from the lump. Hold it there a moment, then release.',
      ask: 'let go of a chain you have stretched out. What does it do?',
      opts: ['Folds back up on its own', 'Stays stretched — it has nothing to fold back to'], right: 0 },
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
    lede: 'A chain of amino acids in three dimensions — drag the background to turn it. Each bead has an R-group that is greasy, water-loving, positive or negative, and nothing is told what shape to be. Set the sequence, let go, and watch what the water pushes it into. Grab any bead and pull; tap one to change it. Then heat it and find out what you can and cannot get back.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        seq: PRESETS[0][1].split(','), nch: 1, T: 300, t: 0,
        W: null, hint: true, hits: [], hover: -1, held: -1, pulled: false, rad: 4.5, mid: { x: 0, y: 0, z: 0 },
      };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A chain of coloured beads in water. Greasy beads clump together and the chain collapses round them. Heating it shakes the shape apart.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- the chain ---------------- */
      /* The model is js/life/fold3.js, so it can be tested in Node
         (tools/check-fold.js) rather than judged by eye. */
      const F3 = BL.fold3;
      function build() {
        S.W = F3.create({ seq: S.seq, nch: S.nch, T: S.T, seed: (S.seedN = (S.seedN || 0) + 1) });
        S.pulled = false; S.held = -1;
        say();
      }
      const idx = F3.idx;
      const levels = () => F3.levels(S.W);

      /* ---------------- dock ---------------- */
      const strip = h('div', { class: 'el-grid', role: 'group', 'aria-label': 'The sequence. Click a bead to change its R-group.' });
      const stripBtns = [];
      for (let i = 0; i < N; i++) {
        const b = h('button', { type: 'button', class: 'chip', 'aria-label': 'Bead ' + (i + 1) });
        b.addEventListener('click', () => {
          S.seq[i] = RK[(RK.indexOf(S.seq[i]) + 1) % RK.length];
          S.W.p.forEach((a) => { if (a.i === i) a.k = S.seq[i]; });
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
      tIn.addEventListener('input', () => { S.T = parseFloat(tIn.value); S.W.T = S.T; tOut.textContent = tsay(S.T); S.hint = false; say(); });
      tOut.textContent = tsay(S.T);
      const setT = (v) => { S.T = v; S.W.T = v; tIn.value = String(v); tOut.textContent = tsay(v); S.hint = false; say(); };
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
          h('span', { class: 'name' }, S.W.cooked ? 'Cooked' : L.compact > 0.6 ? 'Folded' : L.compact > 0.3 ? 'Half folded' : 'A loose string'),
          h('span', { class: 'zone' }, tword(S.T)),
          h('span', { class: 'dim' }, S.nch + (S.nch === 1 ? ' chain' : ' chains') + ' · ' + N * S.nch + ' amino acids'));
        statusP.textContent = S.W.cooked && S.T < T_COOK
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
        if (S.W.cooked && S.T < T_COOK) { steps.done('cook'); steps.done('left'); }
        if (S.nch > 1 && S.W.links.length) steps.done('two');
        if (S.pulled && S.held < 0 && L.compact > 0.6) steps.done('pull');
      }

      /* ---------------- turning, grabbing, changing ---------------- */
      const beadAt = (pt) => {
        let best = -1, bz = -1e9;
        S.hits.forEach((hh) => { if (Math.hypot(hh.x - pt.x, hh.y - pt.y) < hh.r + 6 && hh.z > bz) { bz = hh.z; best = hh.i; } });
        return best;
      };
      const V = BL.view3d(stage.canvas, {
        yaw: 0.4, pitch: 0.25, auto: 0.22,
        onturn: () => { S.hint = false; },
        hover: (pt) => { S.hover = pt ? beadAt(pt) : -1; stage.canvas.style.cursor = S.hover >= 0 ? 'grab' : ''; },
        /* A press on a bead claims it. If it then moves, the bead follows the
           finger in the plane of the screen and the rest of the chain comes
           with it; if it does not, it was a tap and the bead changes kind. */
        pick: (pt) => {
          const i = beadAt(pt);
          if (i < 0) return null;
          S.held = i; S.hint = false;
          return { i, z: V.project(S.W.p[i]).z };
        },
        drag: (c, pt) => {
          const q = V.unproject(pt.x, pt.y, c.z);
          S.W.grab = { i: c.i, x: q.x, y: q.y, z: q.z };
          if (levels().rg > 2.4) S.pulled = true;
        },
        end: (c, pt, moved) => {
          S.W.grab = null; S.held = -1;
          if (moved < 6) {
            const a = S.W.p[c.i];
            S.seq[a.i] = RK[(RK.indexOf(S.seq[a.i]) + 1) % RK.length];
            S.W.p.forEach((b) => { if (b.i === a.i) b.k = S.seq[a.i]; });
            S.changed = true; say();
          }
        },
      });

      /* ---------------- drawing ---------------- */
      let lastSay = 0;
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        S.t += dt;
        S.W.T = S.T;
        V.step(dt);
        /* As many steps as fit in a slice of the frame: folding takes a few
           thousand, and nobody should have to wait half a minute to watch it. */
        const t0 = performance.now();
        let ks = 0;
        while (ks < 40 && performance.now() - t0 < 7) { F3.step(S.W, 0.006); ks++; }
        if (performance.now() - lastSay > 240) { lastSay = performance.now(); say(); }
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        const p = S.W.p;

        // follow the chain's middle and size, easing, so it does not lurch as it folds
        let mx = 0, my = 0, mz = 0;
        p.forEach((a) => { mx += a.x; my += a.y; mz += a.z; });
        mx /= p.length; my /= p.length; mz /= p.length;
        let rad = 1.6;
        p.forEach((a) => { rad = Math.max(rad, Math.hypot(a.x - mx, a.y - my, a.z - mz) + 0.7); });
        /* While a bead is in somebody's hand the camera may pull back to keep
           the whole chain in view, but it does not re-centre — the pull is an
           equal-and-opposite pair, so the chain's middle stays put, and a
           moving view would make the bead slide away from the finger. */
        const held = S.held >= 0;
        const e = 1 - Math.exp(-dt * (held ? 1.4 : 2.2));
        S.rad += (rad - S.rad) * e;
        if (!held) { S.mid.x += (mx - S.mid.x) * e; S.mid.y += (my - S.mid.y) * e; S.mid.z += (mz - S.mid.z) * e; }
        V.frame(cw, ch, S.rad, S.mid);
        const rb = V.scale * 0.3;
        const P = p.map((a) => V.project(a));
        S.hits = [];

        for (let c = 0; c < S.nch; c++) {
          for (let i = 0; i < F3.N - 1; i++) {
            const a = P[idx(c, i)], b = P[idx(c, i + 1)];
            V.add((a.z + b.z) / 2 - 0.01, () => BL.stick3(ctx, a, b, rb * 0.5, { color: BL.alpha(pal.fg, (c ? 0.18 : 0.3) + 0.35 * Math.min(a.d, b.d)), ta: BL.sphereR(a, rb) * 0.85, tb: BL.sphereR(b, rb) * 0.85 }));
          }
          // where the backbone is holding on to itself
          if (S.T < F3.T_COOK) {
            for (let i = 0; i < F3.N - 3; i++) {
              const A = p[idx(c, i)], B = p[idx(c, i + 3)];
              if (Math.abs(Math.hypot(A.x - B.x, A.y - B.y, A.z - B.z) - F3.L3) > 0.35) continue;
              const a = P[idx(c, i)], b = P[idx(c, i + 3)];
              V.add((a.z + b.z) / 2 - 0.005, () => { ctx.save(); ctx.globalAlpha = 0.35 + 0.55 * Math.min(a.d, b.d); O.weakBond(ctx, a.x, a.y, b.x, b.y, { width: Math.max(2, rb * 0.3) }); ctx.restore(); });
            }
          }
        }
        // what the cooking welded together
        S.W.links.forEach(([i, j]) => V.add((P[i].z + P[j].z) / 2, () => BL.stick3(ctx, P[i], P[j], rb * 0.5, { color: BL.alpha(pal.pos, 0.95) })));
        p.forEach((a, i) => {
          const q = P[i];
          const ring = S.held === i ? pal.ui : S.hover === i ? BL.alpha(pal.ui, 0.65) : null;
          V.add(q.z, () => BL.sphere3(ctx, q, rb, R_[a.k]().toString(), null, ring ? { ring } : null));
          S.hits.push({ x: q.x, y: q.y, r: BL.sphereR(q, rb), z: q.z, i });
        });
        V.flush();

        if (S.hover >= 0 && S.held < 0) {
          const q = P[S.hover], kind = R_[S.W.p[S.hover].k] ? R[S.W.p[S.hover].k] : null;
          if (kind) BL.label(ctx, kind.tag + ' · bead ' + (S.W.p[S.hover].i + 1) + ' — tap to change, drag to pull', cw / 2, ch - 44, { font: BL.font(600, 13), border: pal.ui });
        }
        BL.label(ctx, tsay(S.T), 78, 22, { font: BL.font(700, 14), border: S.T > T_COOK ? pal.pos : pal.line2 });
        if (S.W.cooked) BL.label(ctx, S.T > T_COOK ? 'coming apart' : 'cooked — it will not go back', cw - 130, 22, { font: BL.font(700, 14), border: pal.pos });
        V.cue(ctx, pal);
        if (S.hint && !BL.reduced) BL.label(ctx, 'grab a bead · drag the background to turn · or turn the heat up', cw / 2, 52, { font: BL.font(700, 14), border: pal.ui });
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
