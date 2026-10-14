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
      n: 40, is: 'a polar head and two non-polar tails. Straight-sided, so a crowd of them lies flat: a sheet two molecules thick, heads out on both faces, tails hidden in the middle. This is your cell membrane.',
      makes: 'a sheet — a bilayer' },
    { id: 'one', name: 'Soap', tails: 1, head: true, n: 36,
      is: 'the same head with only one tail, so the molecule is a wedge. Wedges cannot lie flat; they close up into a ball with the tails in the middle. Drop grease into the middle of one of those balls and you have just washed up.',
      makes: 'balls — micelles' },
    { id: 'tri', name: 'Triglyceride', tails: 3, head: false, n: 20,
      is: 'three tails on a glycerol and no polar end left anywhere. Nothing on it will face the water, so it cannot line a surface. It just huddles. This is the fat in a fat cell, and in a chip pan.',
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
      ask: 'with no polar end left, will it make a membrane?',
      opts: ['Yes', 'No — there is nothing left to face the water'], right: 1 },
    { id: 'cold', text: 'Compare a straight-tailed sheet with a kinked one.',
      how: 'Let a sheet settle with the kinks off and read the packing bar, then drag the kinks all the way up and read it again.',
      ask: 'one of them packs tighter than the other. Which?',
      opts: ['The straight-tailed one', 'The kinked one', 'Neither — they pack the same'], right: 0 },
    { id: 'poke', text: 'Pull one lipid out of the sheet, and let go.',
      how: 'Wait for a sheet, press on any lipid and drag it well clear of the others. Hold it there a moment, then release.',
      ask: 'let go of a lipid you have dragged out into the open water. What happens?',
      opts: ['It swims back and tucks in by itself', 'It stays out there, on its own'], right: 0 },
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
    lede: 'Lipids scattered in water, each with a polar head and one, two or three non-polar tails. Nothing in here pulls them into any shape. Watch what they do anyway, grab one and pull it out of the crowd, then change the shape of the molecule and watch the answer change with it. Underneath, the same lipids in three dimensions: turn them over, and cut them open.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const W = 26, H = 15;                       // the box, in bead diameters
      const S = { kind: 0, T: 300, kink: 0, W: null, t: 0, hint: true, triedCold: new Set(), seed: 0, lay: null, held: null, poked: false, releasedAt: 0, cut: false, m3: null, m3key: '' };

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

      /* ---------------- the same thing, in three dimensions ---------------- */
      /* The flat tank is a slice. This is the whole object: a patch of
         bilayer, a micelle or a droplet, built from the same lipids, that you
         can pick up and turn. "Cut it open" removes the near half so you can
         see what is inside, which is the whole point of a membrane. */
      const c3 = BL.stage(h('div'), '1.7 / 1', { label: 'A three-dimensional model of what the lipids make: a patch of bilayer, a micelle, or a droplet. Drag to turn it.', focusable: true });
      c3.wrap.classList.add('flat');
      const cutBtn = h('button', { type: 'button', class: 'action ghost', 'aria-pressed': 'false', onclick: () => { S.cut = !S.cut; cutBtn.textContent = S.cut ? 'Put it back together' : 'Cut it open'; cutBtn.setAttribute('aria-pressed', String(S.cut)); S.hint = false; setView3(); } }, 'Cut it open');
      const note3 = h('p', { class: 'hint' });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'The same thing, in three dimensions'), c3.wrap,
        h('div', { class: 'actions' }, cutBtn), note3));

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
          : 'Nothing, and there is no sheet either. With no polar end the molecule has no reason to sit at a surface, so it just hides in the middle of the heap with the rest.';
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
        if (S.poked && !S.W.grab && S.kind === 0 && hd > 0.4 && performance.now() - S.releasedAt > 2500) steps.done('poke');
        if (hd > 0.3) S.triedCold.add(S.kink < 0.2 ? 'straight' : S.kink > 0.6 ? 'kinked' : null);
        S.triedCold.delete(null);
        if (S.triedCold.size >= 2) steps.done('cold');
        if (S.seenEnergy) steps.done('energy');
      }
      // the energy panel is the last thing on the page, so seeing it counts
      const seen = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { S.seenEnergy = true; say(); } });
      seen.observe(energy);

      /* ---------------- the 3D model ---------------- */
      const K3 = BL.v3;
      function build3() {
        const k = kind(), kinkv = Math.round(S.kink * 10) / 10;
        const key = k.id + '|' + kinkv;
        if (S.m3key === key) return S.m3;
        const lipids = [];
        if (k.id === 'two') {
          const sp = 1.25 + 0.4 * kinkv, N6 = 6;
          [1, -1].forEach((sgn) => {
            for (let i = 0; i < N6; i++) for (let j = 0; j < N6; j++) {
              const x = (i - (N6 - 1) / 2) * sp + (j % 2 ? sp * 0.25 : 0), y = (j - (N6 - 1) / 2) * sp;
              const head = K3.v(x, y, sgn * 2.0);
              const tails = [-0.3, 0.3].map((off, ti) => [0, 1, 2].map((b) => {
                const bend = kinkv * 0.5 * (b === 1 ? 1 : b === 2 ? -0.4 : 0) * (ti ? 1 : -1);
                return K3.v(x + off + bend, y, sgn * (2.0 - 0.62 * (b + 1)));
              }));
              lipids.push({ head, tails });
            }
          });
          S.m3 = { lipids, radius: 4.4 + 1.2 * kinkv, headCol: 'neg' };
        } else if (k.id === 'one') {
          const n = 26;
          for (let i = 0; i < n; i++) {
            const y = 1 - (i + 0.5) * 2 / n, r = Math.sqrt(1 - y * y), th = i * 2.399963;
            const d = K3.v(r * Math.cos(th), y, r * Math.sin(th));
            lipids.push({ head: K3.mul(d, 2.3), tails: [[0, 1, 2].map((b) => K3.mul(d, 2.3 - 0.62 * (b + 1)))] });
          }
          S.m3 = { lipids, radius: 3.2, headCol: 'neg' };
        } else {
          const n = 12;
          for (let i = 0; i < n; i++) {
            const y = 1 - (i + 0.5) * 2 / n, r = Math.sqrt(1 - y * y), th = i * 2.399963;
            const d = K3.v(r * Math.cos(th), y, r * Math.sin(th));
            const base = K3.mul(d, 1.2);
            const tails = [0, 1, 2].map((ti) => {
              const side = K3.mul(K3.perp(d), 0.32 * (ti - 1));
              return [0, 1, 2].map((b) => K3.add(K3.add(base, K3.mul(d, 0.55 * b)), K3.add(side, K3.mul(K3.cross(d, K3.perp(d)), 0.18 * Math.sin(b + ti + i)))));
            });
            lipids.push({ head: base, tails });
          }
          S.m3 = { lipids, radius: 2.7, headCol: 'tail' };
        }
        S.m3key = key;
        return S.m3;
      }
      const V3 = BL.view3d(c3.canvas, { yaw: 0.55, pitch: 0.5, auto: 0.22 });
      function setView3() {
        // cut open: look along the sheet, so the thickness runs up the screen and the layers show
        V3.home = S.cut ? { yaw: 0, pitch: 1.45 } : { yaw: 0.55, pitch: 0.5 };
        V3.userTurned = false; V3.turned = 0;
        V3.goal = { yaw: V3.home.yaw, pitch: V3.home.pitch, zoom: 1 };
        V3.auto = S.cut ? 0 : 0.22;
      }
      function draw3(dt) {
        const pal = BL.pal, cw = c3.w, ch = c3.h, c = c3.ctx;
        if (!cw) return;
        c.clearRect(0, 0, cw, ch);
        V3.step(dt || 1 / 60);
        const m = build3(), k = kind();
        V3.frame(cw, ch, m.radius, { x: 0, y: 0, z: 0 });
        const sc = V3.scale, rb = sc * 0.2;
        // cut open: the near half goes, so what is inside shows
        const shown = m.lipids.filter((l) => !S.cut || (l.head.y <= 0.35));
        shown.forEach((l) => {
          l.tails.forEach((t) => {
            let prev = V3.project(l.head);
            t.forEach((b, bi) => {
              const q = V3.project(b);
              const a0 = prev;
              V3.add((a0.z + q.z) / 2, () => BL.stick3(c, a0, q, rb * 0.9, { color: BL.alpha(pal.eTail, 0.4 + 0.5 * Math.min(a0.d, q.d)), ta: bi ? BL.sphereR(a0, rb) * 0.8 : 0, tb: BL.sphereR(q, rb) * 0.8 }));
              V3.add(q.z, () => BL.sphere3(c, q, rb, pal.eTail, null));
              prev = q;
            });
          });
          if (k.head) { const q = V3.project(l.head); V3.add(q.z, () => BL.sphere3(c, q, rb * 1.7, pal.neg, null)); }
        });
        V3.flush();
        V3.cue(c, pal);
        BL.label(c, S.cut ? 'cut open: heads on the outside, tails hidden in the middle' : k.id === 'two' ? 'a patch of bilayer — two layers of lipids, tails to tails' : k.id === 'one' ? 'a micelle — a ball with every tail pointing in' : 'a droplet of fat — nothing on the outside to face the water',
          cw / 2, ch - 16, { font: BL.font(700, 13), border: pal.ui });
        const kv = Math.round(S.kink * 10) / 10;
        note3.textContent = k.id === 'two' && kv > 0.4 ? 'With kinks in the tails the two layers cannot pack together tightly: look at the gaps. That is a membrane that stays fluid in the cold.' : k.id === 'two' ? 'Straight tails lie against each other all the way down. Slide the kinks up and watch the packing loosen.' : 'Drag it round. Whatever the shape, the polar ends are on the outside and the non-polar ones are hidden.';
      }

      /* ---------------- grabbing a lipid ---------------- */
      const beadAt = (pt) => {
        const Lh = S.lay; if (!Lh) return -1;
        let best = -1, bd = 1e9;
        S.W.p.forEach((a, i) => { const d = Math.hypot(Lh.ox + a.x * Lh.u - pt.x, Lh.oy + a.y * Lh.u - pt.y); const rr = Lh.u * (a.head ? 0.85 : 0.6) + 6; if (d < rr && d < bd) { bd = d; best = i; } });
        return best;
      };
      BL.drag(stage.canvas, {
        pick: (pt) => { const i = beadAt(pt); if (i < 0) return null; S.held = i; S.hint = false; return { i, x0: S.W.p[i].x, y0: S.W.p[i].y }; },
        move: (hd, pt) => {
          const Lh = S.lay;
          const wx = clamp((pt.x - Lh.ox) / Lh.u, 0.5, W - 0.5), wy = clamp((pt.y - Lh.oy) / Lh.u, 0.5, H - 0.5);
          S.W.grab = { i: hd.i, x: wx, y: wy };
          if (Math.hypot(wx - hd.x0, wy - hd.y0) > 3.5) S.poked = true;
        },
        end: () => { S.W.grab = null; S.held = null; S.releasedAt = performance.now(); },
        hover: (pt) => { stage.canvas.style.cursor = pt && beadAt(pt) >= 0 ? 'grab' : 'default'; },
      });

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
        S.lay = { u, ox, oy };
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
        if (S.held != null) { const a = P[S.held]; ctx.lineWidth = 3; ctx.strokeStyle = pal.ui; ctx.beginPath(); ctx.arc(X(a), Y(a), u * 0.75, 0, TAU); ctx.stroke(); }
        draw3(dt);
        // the hint stands down once something has visibly happened, whether or
        // not anybody touched a control
        if (hidden() > 0.3) S.hint = false;
        if (S.hint && !BL.reduced) BL.label(ctx, 'watch — then grab a lipid and pull', cw / 2, 16, { font: BL.font(700, 14), border: pal.ui });
        else BL.label(ctx, hidden() > 0.3 ? WORD[shapeOf().kind] : 'sorting themselves out…', cw / 2, 16, { font: BL.font(800, 15), border: pal.ui });
      }

      scatter();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); c3.destroy(); seen.disconnect(); } };
    },
  });
})();
