/* Twins: same parts, different molecule.

   This is the one idea in the chapter that sounds like a footnote and is not.
   Two molecules can have the identical parts list — same number of carbons,
   same number of hydrogens, same single oxygen — and be different substances
   with different boiling points and different jobs. One is in a drink. One
   comes out of a can as a gas. Nothing was added or taken away; the oxygen
   just sits somewhere else.

   The instrument pins the parts counter to the screen and never lets it
   change, because that is the whole argument. Everything else moves. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;
  const TAU = Math.PI * 2;

  /* Each pair: two arrangements of one parts list.
     Positions are in bond-lengths, laid out by hand so both forms read
     clearly, and the atom list is identical between the two by construction. */
  const PAIRS = [
    {
      id: 'oxy', name: 'Where the oxygen sits', parts: '2 carbon · 6 hydrogen · 1 oxygen', formula: 'C₂H₆O',
      cost: 'Two bonds would have to break and two new ones form. Nothing short of that gets you from one to the other.',
      why: 'Both have an oxygen. Only one of them has a hydrogen stuck on that oxygen — and a hydrogen on an oxygen is a hydrogen bond waiting to happen. The buried oxygen has nothing to offer, so the molecules barely hold each other and barely hold water.',
      forms: [
        { name: 'Ethanol', is: 'the alcohol in a drink and in hand sanitiser',
          bp: 351, mix: 1, note: 'Its oxygen is on the end, carrying a hydrogen. That hydrogen reaches the next molecule, and the next, and water.',
          atoms: [['C', -1.4, 0.35], ['C', -0.2, -0.35], ['O', 1.0, 0.35]], h: [[0, 3], [1, 2], [2, 1]], bonds: [[0, 1], [1, 2]] },
        { name: 'Dimethyl ether', is: 'a propellant — the gas that pushes paint out of a spray can',
          bp: 249, mix: 0.18, note: 'Its oxygen sits in the middle with a carbon on each side. There is no hydrogen on it, so there is nothing to reach out with.',
          atoms: [['C', -1.4, 0.35], ['O', -0.2, -0.35], ['C', 1.0, 0.35]], h: [[0, 3], [1, 0], [2, 3]], bonds: [[0, 1], [1, 2]] },
      ],
    },
    {
      id: 'branch', name: 'Where the branch sits', parts: '4 carbon · 10 hydrogen', formula: 'C₄H₁₀',
      cost: 'A carbon would have to be unplugged from the end of the chain and plugged into the middle. Two bonds, again.',
      why: 'A straight chain can lie flat alongside its neighbour over its whole length, and every point of contact adds another scrap of van der Waals grip. A branched one is a ball: it touches in patches, the grip never adds up, and it lets go at a colder temperature.',
      forms: [
        { name: 'Butane', is: 'camping-gas canisters and the fuel in a cheap lighter',
          bp: 272.5, mix: 0.02, note: 'Four carbons in a line. Two of these lie against each other the whole way down.',
          atoms: [['C', -1.6, 0.4], ['C', -0.55, -0.3], ['C', 0.5, 0.4], ['C', 1.55, -0.3]], h: [[0, 3], [1, 2], [2, 2], [3, 3]], bonds: [[0, 1], [1, 2], [2, 3]] },
        { name: 'Isobutane', is: 'the gas in a fridge, and in a lighter meant to work in the cold',
          bp: 261, mix: 0.02, note: 'Same four carbons, but one has moved to the middle. The molecule is now a lump rather than a line.',
          atoms: [['C', 0, -0.1], ['C', -1.2, 0.55], ['C', 1.2, 0.55], ['C', 0, -1.35]], h: [[0, 1], [1, 3], [2, 3], [3, 3]], bonds: [[0, 1], [0, 2], [0, 3]] },
      ],
    },
    {
      id: 'side', name: 'Which side of the double bond', parts: '18 carbon · 34 hydrogen · 2 oxygen', formula: 'C₁₈H₃₄O₂',
      cost: 'Nothing you can do. The double bond will not turn — go back to Four Hands and try it. To swap these two you would have to break the double bond and rebuild it the other way round.',
      why: 'The double bond is a bond that cannot turn, so whichever side the rest of the chain left on, it is stuck on. Kinked, the molecules cannot stack and the fat stays liquid. Straight, they stack like bricks and it goes solid — which is also why the straight one behaves in your arteries like the solid fats do.',
      forms: [
        { name: 'The kinked one', is: 'what most of olive oil is. Liquid on the shelf.',
          bp: 286, mix: 0.02, kink: true, tail: true,
          note: 'Both halves of the chain leave the double bond on the same side, so the molecule has a bend in it that it cannot straighten out.' },
        { name: 'The straight one', is: 'the kind of fat that used to be put in margarine on purpose, and is now mostly banned',
          bp: 318, mix: 0.02, kink: false, tail: true,
          note: 'The halves leave on opposite sides, so the chain runs straight. Straight chains stack, and a stack of them is a solid.' },
      ],
    },
  ];

  const STEPS = [
    { id: 'count', text: 'Move the oxygen from the end to the middle and watch the parts counter.',
      how: 'On the first pair, press the other form. Keep your eye on the counter under the molecule, not on the molecule.',
      ask: 'does the parts counter change when you switch?',
      opts: ['Yes', 'No'], right: 1 },
    { id: 'bp', text: 'Read both boiling points on the first pair.',
      how: 'Switch back and forth and compare the two bars.',
      ask: 'which boils at the colder temperature — the one with —OH on the end, or the one with the oxygen buried in the middle?',
      opts: ['The —OH one', 'The buried one'], right: 1 },
    { id: 'mix', text: 'Try both forms of the first pair with water.',
      how: 'Compare the “mixes with water” bars for the two forms.',
      ask: 'both have an oxygen. Will both mix into water?',
      opts: ['Yes, both', 'Only the one with a hydrogen on its oxygen'], right: 1 },
    { id: 'vdw', text: 'Switch to the butane pair.',
      how: 'Pick “Where the branch sits” and compare the two boiling points.',
      ask: 'identical formulas. Which one holds on to its neighbours harder?',
      opts: ['The straight one', 'The branched lump', 'Exactly the same'], right: 0 },
    { id: 'fat', text: 'Switch to the fat pair and look at the shape of each.',
      how: 'Pick “Which side of the double bond”. Watch where the chain goes after the bond.',
      ask: 'which of the two stacks together into a solid?',
      opts: ['The kinked one', 'The straight one'], right: 1 },
    { id: 'locked', text: 'Try to turn one fat into the other.',
      how: 'Read the line under the molecule that says what the swap would cost.',
      ask: 'can you get from one to the other by twisting the double bond?',
      opts: ['Yes, twist it round', 'No — a double bond will not turn'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".8">' +
    '<path d="M22 72 L52 40 L82 72"/><path d="M118 40 L148 72 L178 40"/></g>' +
    '<circle cx="82" cy="72" r="12" fill="var(--neg)"/><circle cx="148" cy="72" r="12" fill="var(--neg)"/>' +
    '<g fill="var(--e-c)"><circle cx="22" cy="72" r="11"/><circle cx="52" cy="40" r="11"/>' +
    '<circle cx="118" cy="40" r="11"/><circle cx="178" cy="40" r="11"/></g></svg>';

  BL.register({
    id: 'twins', field: 'carbon', order: 2, name: 'Twins',
    tagline: 'Identical parts list. Different substance.',
    lede: 'Three pairs of molecules. Each pair is built from exactly the same atoms in exactly the same numbers — the counter under the picture proves it and never moves. Switch between the two forms and read what changed anyway.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = { p: 0, f: 0, t: 1, from: null, hint: true };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'One of two molecules built from the same atoms. The parts counter underneath is the same for both forms. Switching forms animates the atoms into their new places.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const pair = () => PAIRS[S.p];
      const form = () => pair().forms[S.f];

      /* ---------------- dock ---------------- */
      const pairBtns = PAIRS.map((p, i) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(S.p === i),
        onclick: () => { S.p = i; S.f = 0; S.t = 1; S.from = null; sync(); },
      }, p.name));
      dock.appendChild(h('section', {},
        h('h2', {}, 'The pair'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Which pair of twins' }, pairBtns),
        h('p', { class: 'hint' }, 'Three pairs. In every one, the two members have the same formula and behave differently.')));

      const formBtns = [0, 1].map((i) => h('button', { type: 'button', class: 'chip', onclick: () => switchTo(i) }, ''));
      dock.appendChild(h('section', {},
        h('h2', {}, 'Which form'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Which of the two' }, formBtns)));

      const costP = h('p', { class: 'hint' });
      dock.appendChild(h('section', {}, h('h2', {}, 'What swapping them would cost'), costP));

      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'twins', STEPS);
      dock.appendChild(stepHost);

      function switchTo(i) {
        if (i === S.f) return;
        S.from = S.f; S.f = i; S.t = 0; S.hint = false;
        steps.done('count');
        if (S.p === 0) { steps.done('bp'); steps.done('mix'); }
        if (S.p === 1) steps.done('vdw');
        if (S.p === 2) { steps.done('fat'); steps.done('locked'); }
        sync();
      }

      /* ---------------- aux ---------------- */
      const readout = h('div', { class: 'readout' });
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const cmp = h('div', { class: 'cmp' });
      aux.appendChild(h('section', { class: 'panel' }, readout, statusP,
        h('h2', {}, 'The two of them, side by side'), cmp,
        h('p', { class: 'hint' }, 'Nothing in the parts list differs. Everything in this table does.')));

      const whyP = h('p', {});
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Why the difference exists at all'), whyP,
        h('p', { class: 'hint' }, 'Isomers are the reason a chemical formula is not a name. C₂H₆O does not tell you whether you are holding a drink or a propellant; only the arrangement does.')));

      function sync() {
        const p = pair(), f = form();
        pairBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(S.p === i)));
        formBtns.forEach((b, i) => { b.textContent = p.forms[i].name; b.setAttribute('aria-pressed', String(S.f === i)); });
        costP.textContent = p.cost;
        whyP.textContent = p.why;
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, f.name),
          h('span', { class: 'zone' }, p.formula),
          h('span', { class: 'dim' }, p.parts));
        statusP.textContent = f.note + ' In everyday life this one is ' + f.is + '.';

        cmp.textContent = '';
        const hi = Math.max(...p.forms.map((x) => x.bp));
        p.forms.forEach((x, i) => {
          const bbar = h('div', { class: 'mbar' }, h('div', { style: 'width:' + ((x.bp / hi) * 100).toFixed(0) + '%' }));
          const mbar = h('div', { class: 'mbar b2' }, h('div', { style: 'width:' + (x.mix * 100).toFixed(0) + '%' }));
          cmp.appendChild(h('div', { class: 'cmp-row' + (i === S.f ? ' now' : '') },
            h('b', {}, i === S.f ? '▸' : ''),
            h('div', {}, h('b', {}, x.name), bbar, mbar),
            h('span', { class: 'nums' }, BL.words.tempShort(x.bp), BL.numv(' ' + Math.round(x.bp - 273) + ' °C'))));
        });
        cmp.appendChild(h('div', { class: 'cmp-row' },
          h('b', {}, ''), h('span', { class: 'muted' }, 'Top bar: the temperature it boils at — how hard the molecules hold on to each other. Lower bar: how much of it mixes into water.')));
      }

      /* ---------------- drawing ---------------- */
      /* The long-chain pair is drawn as a chain rather than as atoms, because
         eighteen carbons as eighteen lettered spheres is unreadable and the
         thing worth seeing is the bend. */
      function drawFat(cw, ch, pal, kinkAmount) {
        const cy = ch * 0.52, u = clamp(Math.min(cw / 15, ch / 7), 10, 30);
        const head = cw * 0.12;
        O.atom(ctx, head, cy, u * 0.6, 'C', { color: pal.pos, text: 'O' });
        BL.label(ctx, 'the acid head', head, cy - u * 1.5, { font: BL.font(600, 13) });
        // first half, straight
        let x = head + u * 0.7, y = cy, ang = 0;
        const seg = u * 0.62;
        for (let i = 0; i < 7; i++) {
          const nx = x + Math.cos(ang) * seg, ny = y + (i & 1 ? 1 : -1) * seg * 0.36;
          O.bond(ctx, x, y, nx, ny, { width: u * 0.26, color: pal.eTail });
          x = nx; y = ny;
        }
        // the double bond: the one that will not turn
        const dx = x + seg * 1.3, dy = y + (kinkAmount ? seg * 0.1 : -seg * 0.3);
        O.bond(ctx, x, y, dx, dy, { order: 2, width: u * 0.3, color: pal.electron });
        BL.label(ctx, 'the double bond', (x + dx) / 2, dy + u * 1.7, { font: BL.font(700, 13), border: pal.electron });
        // second half, leaving on one side or the other
        let bend = kinkAmount * 1.05;
        x = dx; y = dy; ang = bend;
        for (let i = 0; i < 8; i++) {
          const nx = x + Math.cos(ang) * seg, ny = y + Math.sin(ang) * seg + (i & 1 ? 1 : -1) * seg * 0.3 * Math.cos(ang);
          O.bond(ctx, x, y, nx, ny, { width: u * 0.26, color: pal.eTail });
          x = nx; y = ny;
        }
        BL.label(ctx, kinkAmount > 0.5 ? 'kinked — it cannot stack' : 'straight — it stacks like a brick',
          cw / 2, ch - 44, { font: BL.font(700, 14), border: kinkAmount > 0.5 ? pal.ui : pal.pos });
      }

      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        S.t = Math.min(1, S.t + dt * (BL.reduced ? 4 : 2.2));
        const ease = S.t * S.t * (3 - 2 * S.t);
        const p = pair();

        if (p.forms[0].tail) {
          const want = S.f === 0 ? 1 : 0, had = S.from == null ? want : (S.from === 0 ? 1 : 0);
          drawFat(cw, ch, pal, had + (want - had) * ease);
        } else {
          const A = p.forms[S.from == null ? S.f : S.from], B = p.forms[S.f];
          const u = clamp(Math.min(cw / 5.2, (ch - 70) / 3.2), 26, 104);
          const cx = cw / 2, cy = ch * 0.46;
          const at = (frm, i) => frm.atoms[i];
          const lerp = (i) => {
            const a = at(A, i), b = at(B, i);
            return [cx + (a[1] + (b[1] - a[1]) * ease) * u, cy + (a[2] + (b[2] - a[2]) * ease) * u];
          };
          const n = B.atoms.length;
          // bonds morph too: the ones that are breaking fade out, the new ones fade in
          const key = (bd) => bd[0] + '-' + bd[1];
          const inA = new Set(A.bonds.map(key)), inB = new Set(B.bonds.map(key));
          const all = [...new Set([...A.bonds.map(key), ...B.bonds.map(key)])];
          all.forEach((k) => {
            const [i, j] = k.split('-').map(Number);
            const a = lerp(i), b = lerp(j);
            const was = inA.has(k), will = inB.has(k);
            const al = was && will ? 0.8 : was ? 0.8 * (1 - ease) : 0.8 * ease;
            O.bond(ctx, a[0], a[1], b[0], b[1], { width: u * 0.17, alpha: al });
          });
          // hydrogens, fanned off each heavy atom
          for (let i = 0; i < n; i++) {
            const pos = lerp(i);
            const ha = (A.h.find((x) => x[0] === i) || [i, 0])[1], hb = (B.h.find((x) => x[0] === i) || [i, 0])[1];
            const cnt = Math.round(ha + (hb - ha) * ease);
            const base = Math.atan2(pos[1] - cy, pos[0] - cx) || -Math.PI / 2;
            for (let k = 0; k < cnt; k++) {
              const ang = base + (k - (cnt - 1) / 2) * 0.72;
              const hx = pos[0] + Math.cos(ang) * u * 0.62, hy = pos[1] + Math.sin(ang) * u * 0.62;
              O.bond(ctx, pos[0], pos[1], hx, hy, { width: u * 0.1, alpha: 0.3 });
              O.atom(ctx, hx, hy, u * 0.17, 'H', { label: false });
            }
          }
          for (let i = 0; i < n; i++) {
            const pos = lerp(i);
            O.atom(ctx, pos[0], pos[1], u * 0.3, B.atoms[i][0]);
          }
        }

        // the parts counter, pinned. The whole argument is that it does not move.
        const plate = BL.label(ctx, p.parts, cw / 2, ch - 18, { font: BL.font(800, 15), border: pal.ui, pad: 12 });
        BL.label(ctx, 'unchanged, both ways round', cw / 2, plate.y - 12, { font: BL.font(600, 13), bg: false, color: pal.muted });

        if (S.hint && !BL.reduced) {
          BL.label(ctx, 'switch to the other form in the panel →', cw / 2, 24, { font: BL.font(700, 14), border: pal.ui });
        }
      }

      sync();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
