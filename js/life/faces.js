/* Two Faces: nobody builds a membrane.

   A phospholipid has a head that gets on with water and two tails that do
   not. Drop a few thousand into water and they sort themselves out, tails
   tucked away from the water and heads facing it, and what you get is a
   double-layered sheet — the thing every cell you have is wrapped in.

   The point of the instrument is that nothing in here is told to do that.
   There is no force between the lipids pulling them into a sheet. The water
   will not have the tails, the tails have nowhere else to go but against each
   other, and the sheet is simply what is left when that has finished
   happening.

   Change the shape of the molecule and you get a different answer to the same
   question. One tail is a wedge, and wedges close up into a ball — that is
   soap. Three tails and no head at all is nothing but grease, and grease in
   water makes a droplet and never a membrane. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;
  const TAU = Math.PI * 2;

  const KINDS = [
    { id: 'two', name: 'Phospholipid', tails: 2, head: true,
      n: 40, is: 'a water-loving head and two water-hating tails. Straight-sided, so a crowd of them lies flat: a sheet two molecules thick, heads out on both faces, tails hidden in the middle. This is your cell membrane.',
      makes: 'a sheet — a bilayer' },
    { id: 'one', name: 'Soap', tails: 1, head: true, n: 36,
      is: 'the same head with only one tail, so the molecule is a wedge. Wedges cannot lie flat; they close up into a ball with the tails in the middle. Drop grease into the middle of one of those balls and you have just washed up.',
      makes: 'balls — micelles' },
    { id: 'tri', name: 'Triglyceride', tails: 3, head: false, n: 20,
      is: 'three tails on a glycerol and no water-loving end left anywhere. Nothing on it will face the water, so it cannot line a surface. It just huddles. This is the fat in a fat cell, and in a chip pan.',
      makes: 'a droplet of fat' },
  ];

  const STEPS = [
    { id: 'self', text: 'Scatter phospholipids in water and do not touch anything.',
      how: 'Press “Scatter them again” and watch for a few seconds without changing a setting.',
      ask: 'nothing is telling them what to do. What will they do?',
      opts: ['Stay scattered', 'Sort themselves tails-in, heads-out', 'Sink to the bottom'], right: 1 },
    { id: 'wedge', text: 'Swap to the one-tailed molecule.',
      how: 'Press “Soap” and watch what shape the crowd settles into instead.',
      ask: 'one tail instead of two. Does it still make a sheet?',
      opts: ['Yes, the same sheet', 'No — it closes up into balls'], right: 1 },
    { id: 'nohead', text: 'Take the head off altogether.',
      how: 'Press “Triglyceride”, which is three tails and no head.',
      ask: 'with no water-loving end left, will it make a membrane?',
      opts: ['Yes', 'No — there is nothing left to face the water'], right: 1 },
    { id: 'cold', text: 'Compare a straight-tailed sheet with a kinked one.',
      how: 'Let a sheet settle with the kinks off and read the packing bar, then drag the kinks all the way up and read it again.',
      ask: 'one of them packs tighter than the other. Which?',
      opts: ['The straight-tailed one', 'The kinked one', 'Neither — they pack the same'], right: 0 },
    { id: 'holds', text: 'Ask what is actually holding the membrane together.',
      how: 'Read the “what is holding it together” line while the sheet sits there.',
      ask: 'what holds a membrane in one piece?',
      opts: ['Bonds between neighbouring lipids', 'Nothing between them — the water is holding them in'], right: 1 },
    { id: 'energy', text: 'Compare what a fat stores with what a sugar stores.',
      how: 'Read the energy bars at the bottom of the panel.',
      ask: 'gram for gram, a fat against a carbohydrate —',
      opts: ['about the same', 'the fat holds roughly twice as much'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g stroke="var(--e-tail)" stroke-width="4" stroke-linecap="round">' +
    '<path d="M30 42 V58"/><path d="M38 42 V58"/><path d="M70 42 V58"/><path d="M78 42 V58"/>' +
    '<path d="M110 42 V58"/><path d="M118 42 V58"/><path d="M150 42 V58"/><path d="M158 42 V58"/>' +
    '<path d="M30 78 V62"/><path d="M38 78 V62"/><path d="M70 78 V62"/><path d="M78 78 V62"/>' +
    '<path d="M110 78 V62"/><path d="M118 78 V62"/><path d="M150 78 V62"/><path d="M158 78 V62"/></g>' +
    '<g fill="var(--neg)"><circle cx="34" cy="34" r="10"/><circle cx="74" cy="34" r="10"/><circle cx="114" cy="34" r="10"/><circle cx="154" cy="34" r="10"/>' +
    '<circle cx="34" cy="86" r="10"/><circle cx="74" cy="86" r="10"/><circle cx="114" cy="86" r="10"/><circle cx="154" cy="86" r="10"/></g></svg>';

  BL.register({
    id: 'faces', field: 'four', order: 2, name: 'Two Faces',
    tagline: 'Water will not have the tails. The membrane is what is left over.',
    lede: 'Lipids scattered in water, each with a water-loving head and one, two or three water-hating tails. Nothing in here pulls them into any shape. Watch what they do anyway, then change the shape of the molecule and watch the answer change with it.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const W = 26, H = 15;                       // the box, in bead diameters
      const S = { kind: 0, T: 300, kink: 0, W: null, t: 0, hint: true, triedCold: new Set(), seed: 0 };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'Lipid molecules scattered in water. Each has a head and one or more tails. Left alone they sort themselves so the tails are hidden from the water.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const kind = () => KINDS[S.kind];

      /* ---------------- the lipids ---------------- */
      /* The model is js/life/lipid.js, so it can be tuned and tested in Node
         (tools/check-lipid.js) rather than by squinting at the screen. */
      const LP = BL.lipid;
      function scatter() {
        const k = kind();
        S.W = LP.create({ n: k.n, tails: k.tails, head: k.head, w: W, h: H, T: S.T, kink: S.kink, seed: (S.seed = (S.seed || 0) + 1) });
        say();
      }
      const hidden = () => LP.hidden(S.W);
      const shapeOf = () => LP.shape(S.W);
      /* Not how fast they are moving — this flat model does not get the
         freezing right — but how tightly the tails have managed to pack, which
         is the thing that actually decides it. */
      const packed = () => clamp(LP.packing(S.W) / 4.2, 0, 1);

      /* ---------------- dock ---------------- */
      const kBtns = KINDS.map((k, i) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(S.kind === i),
        onclick: () => { S.kind = i; S.hint = false; kBtns.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i))); scatter(); },
      }, k.name + ' · ' + k.tails + (k.tails === 1 ? ' tail' : ' tails')));
      dock.appendChild(h('section', {},
        h('h2', {}, 'The molecule'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Which lipid' }, kBtns),
        h('p', { class: 'hint' }, 'Same head, different number of tails — and in the last one, no head at all.')));

      const tOut = h('output', { class: 'val' });
      const tIn = h('input', { type: 'range', min: '258', max: '330', step: '1', value: '300', 'aria-label': 'Temperature' });
      const tword = (T) => (T < 272 ? 'freezer cold' : T < 285 ? 'fridge cold' : T < 296 ? 'cool' : T < 312 ? 'body warm' : 'hot');
      tIn.addEventListener('input', () => { S.T = parseFloat(tIn.value); S.W.T = S.T; tOut.textContent = tword(S.T) + (BL.nums ? ' · ' + Math.round(S.T - 273) + ' °C' : ''); S.hint = false; say(); });
      tOut.textContent = tword(300);
      const kOut = h('output', { class: 'val' }, 'straight');
      const kIn = h('input', { type: 'range', min: '0', max: '100', step: '1', value: '0', 'aria-label': 'Kinks in the tails' });
      kIn.addEventListener('input', () => {
        S.kink = parseFloat(kIn.value) / 100;
        S.W.kink = S.kink;
        kOut.textContent = S.kink < 0.15 ? 'straight' : S.kink < 0.6 ? 'a bend or two' : 'well kinked';
        S.hint = false; say();
      });
      dock.appendChild(h('section', {},
        h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'Temperature'), tOut),
          h('div', { class: 'range-wrap' }, tIn, h('div', { class: 'range-ends' }, h('span', {}, 'freezer'), h('span', {}, 'hot')))),
        h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'Kinks in the tails'), kOut),
          h('div', { class: 'range-wrap' }, kIn, h('div', { class: 'range-ends' }, h('span', {}, 'straight — butter'), h('span', {}, 'kinked — olive oil')))),
        h('p', { class: 'hint' }, 'A double bond puts a bend in a tail that will not straighten out. Bent tails cannot lie flat against their neighbours, so a membrane full of them never packs tight — which is why olive oil is still liquid in a fridge and butter is not, and why a fish living in cold water builds its membranes out of kinked ones.'),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action ghost', onclick: () => { scatter(); S.hint = false; } }, 'Scatter them again'))));

      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'faces', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const readout = h('div', { class: 'readout' });
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const meters = h('div', { class: 'meters' });
      const hidM = BL.meter('How well the tails are hidden from the water');
      const packM = BL.meter('How tightly the tails are packed against each other');
      meters.append(hidM.el, packM.el);
      aux.appendChild(h('section', { class: 'panel' }, readout, statusP, meters));

      const holdP = h('p', {});
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'What is holding it together'), holdP,
        h('p', { class: 'hint' }, 'This is why a membrane heals. Push a needle through one and it closes behind the needle, because there is nothing to break — the water simply shuts the hole the way it shut everything else.')));

      const energy = h('div', { class: 'cmp' });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Why fat is what a body stores'), energy,
        h('p', { class: 'hint' }, 'A fat is almost nothing but carbon and hydrogen, and it carries no water with it. A carbohydrate is already part-way to being burnt — every carbon has an oxygen hanging about it — and it drags water along as well. Gram for gram the fat is worth roughly twice as much, which is why a body on a long journey carries fat and not sugar.')));

      const WORD = {
        sheet: 'a sheet — a bilayer', vesicle: 'a closed bag — heads out, heads in, tails hidden between',
        micelles: 'balls — micelles', droplet: 'one droplet of fat',
      };
      function say() {
        const k = kind(), hd = hidden(), pk = packed();
        const sh = shapeOf();
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, k.name),
          /* what it actually made, measured off the screen — not what it was
             supposed to make. Sometimes they settle differently, and saying so
             is the honest half of "nothing is arranging them". */
          h('span', { class: 'zone' }, hd > 0.3 ? WORD[sh.kind] : 'still scattered'),
          h('span', { class: 'dim' }, k.n + ' molecules · ' + k.tails + (k.tails === 1 ? ' tail' : ' tails') + ' each'));
        statusP.textContent = k.is;
        hidM.set(hd, hd > 0.62 ? 'tucked right away' : hd > 0.4 ? 'mostly out of the water' : hd > 0.18 ? 'starting to gather' : 'still out in the open', '');
        hidM.tone(hd > 0.4 ? BL.pal.eTail : BL.pal.muted);
        packM.set(pk, pk > 0.78 ? 'packed solid — nothing can slide' : pk > 0.5 ? 'packed close' : pk > 0.28 ? 'loosely' : 'hardly at all', '');
        packM.tone(pk > 0.7 ? BL.pal.pos : BL.pal.ui);
        holdP.textContent = k.head
          ? 'Nothing. There is no bond between one lipid and the next — you could slide one out sideways and the rest would close up behind it. What holds the sheet together is the water on both sides refusing to let the tails out.'
          : 'Nothing, and there is no sheet either. With no water-loving end the molecule has no reason to sit at a surface, so it just hides in the middle of the heap with the rest.';
        energy.textContent = '';
        [['A gram of fat', 1, '≈ 37 kJ'], ['A gram of carbohydrate', 0.46, '≈ 17 kJ']].forEach(([name, frac, num]) => {
          energy.appendChild(h('div', { class: 'cmp-row' },
            h('b', {}, ''),
            h('div', {}, h('b', {}, name), h('div', { class: 'mbar' }, h('div', { style: 'width:' + frac * 100 + '%' }))),
            h('span', { class: 'nums' }, BL.numv(num))));
        });
        check(hd, pk);
      }

      function check(hd, pk) {
        if (S.kind === 0 && hd > 0.4) steps.done('self');
        if (S.kind === 1 && hd > 0.45) steps.done('wedge');
        if (S.kind === 2 && hd > 0.45) steps.done('nohead');
        if (hd > 0.4) steps.done('holds');
        if (hd > 0.3) S.triedCold.add(S.kink < 0.2 ? 'straight' : S.kink > 0.6 ? 'kinked' : null);
        S.triedCold.delete(null);
        if (S.triedCold.size >= 2) steps.done('cold');
        if (S.seenEnergy) steps.done('energy');
      }
      // the energy panel is the last thing on the page, so seeing it counts
      const seen = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { S.seenEnergy = true; say(); } });
      seen.observe(energy);

      /* ---------------- drawing ---------------- */
      let lastSay = 0;
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        S.t += dt;
        /* As many steps as fit in a slice of the frame. Sorting themselves out
           takes a few thousand, and a learner should not have to wait a minute
           to watch it happen. */
        const t0 = performance.now();
        let k = 0;
        while (k < 48 && performance.now() - t0 < 8) { LP.step(S.W, 0.008); k++; }
        if (performance.now() - lastSay > 250) { lastSay = performance.now(); say(); }
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        const u = Math.min((cw - 16) / W, (ch - 40) / H);
        const ox = (cw - W * u) / 2, oy = 30 + (ch - 30 - H * u) / 2;
        ctx.fillStyle = BL.alpha(pal.neg, pal.dark ? 0.1 : 0.07);
        ctx.fillRect(ox, oy, W * u, H * u);
        ctx.lineWidth = 2; ctx.strokeStyle = pal.line; ctx.strokeRect(ox, oy, W * u, H * u);
        const P = S.W.p;
        const X = (a) => ox + a.x * u, Y = (a) => oy + a.y * u;
        S.W.mol.forEach((m) => {
          m.tails.forEach((chn) => {
            ctx.beginPath();
            ctx.moveTo(X(P[m.head]), Y(P[m.head]));
            chn.forEach((id) => ctx.lineTo(X(P[id]), Y(P[id])));
            ctx.lineWidth = u * 0.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.strokeStyle = BL.alpha(pal.eTail, 0.9);
            ctx.stroke();
          });
        });
        S.W.mol.forEach((m) => {
          const a = P[m.head];
          O.atom(ctx, X(a), Y(a), u * LP.HEAD_R * 0.95, 'P', { color: kind().head ? pal.neg : pal.eTail, label: false });
        });
        BL.label(ctx, 'water', ox + 44, oy - 14, { font: BL.font(600, 13), bg: false, color: pal.neg });
        // the hint stands down once something has visibly happened, whether or
        // not anybody touched a control
        if (hidden() > 0.3) S.hint = false;
        if (S.hint && !BL.reduced) BL.label(ctx, 'watch. nothing is arranging them →', cw / 2, 16, { font: BL.font(700, 14), border: pal.ui });
        else BL.label(ctx, hidden() > 0.3 ? WORD[shapeOf().kind] : 'sorting themselves out…', cw / 2, 16, { font: BL.font(800, 15), border: pal.ui });
      }

      scatter();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); seen.disconnect(); } };
    },
  });
})();
