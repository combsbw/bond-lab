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

  /* Each pair: two arrangements of one parts list. Atoms are a list of
     elements and a list of bonds; where everything sits in three dimensions is
     worked out by BL.geom, which is the same tetrahedral geometry Four Hands
     builds with. Atom i in one form is atom i in the other, so switching can
     slide each atom to its new place rather than cutting. */
  const PAIRS = [
    {
      id: 'oxy', name: 'Where the oxygen sits', parts: '2 carbon · 6 hydrogen · 1 oxygen', formula: 'C₂H₆O',
      cost: 'Two bonds would have to break and two new ones form. Nothing short of that gets you from one to the other.',
      why: 'Both have an oxygen. Only one of them has a hydrogen stuck on that oxygen — and a hydrogen on an oxygen is a hydrogen bond waiting to happen. The buried oxygen has nothing to offer, so the molecules barely hold each other and barely hold water.',
      forms: [
        { name: 'Ethanol', is: 'the alcohol in a drink and in hand sanitiser',
          bp: 351, mix: 1, note: 'Its oxygen is on the end, carrying a hydrogen. That hydrogen reaches the next molecule, and the next, and water.',
          els: ['C', 'C', 'O'], bonds: [[0, 1, 1], [1, 2, 1]] },
        { name: 'Dimethyl ether', is: 'a propellant — the gas that pushes paint out of a spray can',
          bp: 249, mix: 0.18, note: 'Its oxygen sits in the middle with a carbon on each side. There is no hydrogen on it, so there is nothing to reach out with.',
          els: ['C', 'O', 'C'], bonds: [[0, 1, 1], [1, 2, 1]] },
      ],
    },
    {
      id: 'branch', name: 'Where the branch sits', parts: '4 carbon · 10 hydrogen', formula: 'C₄H₁₀',
      cost: 'A carbon would have to be unplugged from the end of the chain and plugged into the middle. Two bonds, again.',
      why: 'A straight chain can lie flat alongside its neighbour over its whole length, and every point of contact adds another scrap of van der Waals grip. A branched one is a ball: it touches in patches, the grip never adds up, and it lets go at a colder temperature.',
      forms: [
        { name: 'Butane', is: 'camping-gas canisters and the fuel in a cheap lighter',
          bp: 272.5, mix: 0.02, note: 'Four carbons in a line. Two of these lie against each other the whole way down.',
          els: ['C', 'C', 'C', 'C'], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1]] },
        { name: 'Isobutane', is: 'the gas in a fridge, and in a lighter meant to work in the cold',
          bp: 261, mix: 0.02, note: 'Same four carbons, but one has moved to the middle. The molecule is now a lump rather than a line.',
          els: ['C', 'C', 'C', 'C'], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
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
    lede: 'Three pairs of molecules, in three dimensions — drag to turn them over. Each pair is built from exactly the same atoms in exactly the same numbers; the counter under the picture proves it and never moves. Switch between the two forms, tap any atom to ask what it is doing, and read what changed anyway.',
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
        onclick: () => { S.p = i; S.f = 0; S.t = 1; S.from = null; S.pick = -1; sync(); setView(); },
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
        S.from = S.f; S.f = i; S.t = 0; S.hint = false; S.pick = -1;
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

      /* ---------------- the molecules, in three dimensions ---------------- */
      const cache = new Map();
      const mol = (f) => { if (!cache.has(f)) cache.set(f, BL.geom.layout(f.els, f.bonds)); return cache.get(f); };
      const ELCOL = { C: () => BL.pal.eC, O: () => BL.pal.neg, H: () => BL.pal.pos, N: () => BL.pal.eN };
      let V = null;

      /* Tapping an atom says what it is doing for the molecule. For the oxygen
         that is the whole lesson: does it have a hydrogen to reach out with? */
      function describe(m, i) {
        const el = m.els[i];
        const hs = m.h.filter((x) => x.of === i).length;
        const nb = m.bonds.filter(([a, b]) => a === i || b === i).length;
        if (el === 'O') return hs ? 'an oxygen carrying a hydrogen — a hydrogen bond waiting to happen' : 'an oxygen buried between two carbons — nothing on it to reach out with';
        if (nb >= 3) return 'a carbon with three carbons on it — the branch point';
        return 'a carbon, ' + nb + (nb === 1 ? ' neighbour, ' : ' neighbours, ') + hs + ' hydrogens';
      }

      /* The fat. Fourteen carbons is enough to show the shape without
         eighteen lettered spheres being unreadable. kink is 0 for trans, 1 for
         cis, and both halves are real zigzags.

         Trans: the zigzag carries straight on through the double bond. Cis:
         the two chain bonds that meet the double bond leave on the same side,
         which turns the whole second half through 60° — the zigzag's average
         direction changes, not just its phase. That bend is the thing that
         will not straighten out, and it is why these cannot lie flat against
         each other. */
      const NF = 14, DB = 6, ZZ = 0.52, BEND = Math.PI / 3;
      function fatPoints(kink) {
        const alt = (k) => (k % 2 ? -ZZ : ZZ);
        const pts = [{ x: 0, y: 0, z: 0 }];
        let x = 0, y = 0;
        for (let k = 0; k < NF - 1; k++) {
          const a = k <= DB ? alt(k) : alt(k) + (BEND + alt(k - 1) - alt(k)) * kink;
          x += Math.cos(a); y += Math.sin(a);
          pts.push({ x, y, z: 0 });
        }
        return pts;
      }
      function clashes(pts, dy) {
        const out = [];
        pts.forEach((p, i) => pts.forEach((q, j) => {
          const d = Math.hypot(p.x - q.x, p.y - (q.y + dy));
          if (d < 0.78 && Math.abs(i - j) > 0) out.push({ x: (p.x + q.x) / 2, y: (p.y + q.y + dy) / 2, z: 0 });
        }));
        return out;
      }

      V = BL.view3d(stage.canvas, {
        yaw: 0.55, pitch: 0.28, auto: 0.3,
        onturn: () => { S.hint = false; },
        hover: (pt) => { S.hov = pt ? atomAt(pt) : -1; stage.canvas.style.cursor = S.hov >= 0 ? 'pointer' : ''; },
        tap: (pt) => { const i = atomAt(pt); S.pick = i >= 0 && !pair().forms[0].tail ? i : -1; S.hint = false; },
      });
      S.pick = -1; S.hov = -1; S.atomHits = [];
      /* The fat pair is a point about two shapes lying side by side, and seen
         end-on three chains are one chain. So it opens face-on and does not
         spin by itself; turn it and the thickness is there to find. The
         small molecules open at a three-quarter view and turn gently. */
      function setView() {
        const fat = !!pair().forms[0].tail;
        V.auto = fat ? 0 : 0.3;
        V.home = fat ? { yaw: 0.12, pitch: 0.12 } : { yaw: 0.55, pitch: 0.28 };
        V.userTurned = false; V.turned = 0;
        V.goal = { yaw: V.home.yaw, pitch: V.home.pitch, zoom: 1 };
      }
      const atomAt = (pt) => {
        let best = -1, bd = 1e9;
        S.atomHits.forEach((a) => { const d = Math.hypot(a.x - pt.x, a.y - pt.y); if (d < a.r + 8 && d < bd) { bd = d; best = a.i; } });
        return best;
      };

      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        V.step(dt);
        S.t = Math.min(1, S.t + dt * (BL.reduced ? 4 : 2.2));
        const ease = S.t * S.t * (3 - 2 * S.t);
        const p = pair();
        S.atomHits = [];

        if (p.forms[0].tail) {
          /* the fat: three copies side by side. Straight, they lie neatly
             against each other. Kinked, they cannot, and the places where
             they run into each other light up. */
          const want = S.f === 0 ? 1 : 0, had = S.from == null ? want : (S.from === 0 ? 1 : 0);
          const kink = had + (want - had) * ease;
          const pts = fatPoints(kink);
          const mid = pts.reduce((t, q) => ({ x: t.x + q.x, y: t.y + q.y, z: 0 }), { x: 0, y: 0, z: 0 });
          mid.x /= pts.length; mid.y = 0.5;
          const rows = [-1.3, 0, 1.3];
          // framed to hold BOTH shapes, so it does not rescale while it morphs
          const both = fatPoints(0).concat(fatPoints(1)).flatMap((q) => [q, { x: q.x, y: q.y + 2.6, z: 0 }]);
          const lo = { x: Math.min(...both.map((q) => q.x)), y: Math.min(...both.map((q) => q.y)) };
          const hi = { x: Math.max(...both.map((q) => q.x)), y: Math.max(...both.map((q) => q.y)) };
          V.frame(cw, ch, Math.max(hi.x - lo.x, (hi.y - lo.y) * 1.6) / 2 + 0.4, { x: (lo.x + hi.x) / 2, y: (lo.y + hi.y) / 2 - 0.3, z: 0 });
          const R = V.scale * 0.2;
          let clash = 0;
          rows.forEach((off, ri) => {
            const Q = pts.map((q) => V.project({ x: q.x, y: q.y + off * 1.0, z: ri * 0.0 }));
            for (let i = 0; i < Q.length - 1; i++) {
              const dbl = i === DB;
              V.add((Q[i].z + Q[i + 1].z) / 2, () => BL.stick3(ctx, Q[i], Q[i + 1], R * (dbl ? 0.62 : 0.5), { order: dbl ? 2 : 1, color: dbl ? pal.electron : BL.alpha(pal.eTail, 0.45 + 0.5 * Q[i].d), ta: BL.sphereR(Q[i], R) * 0.8, tb: BL.sphereR(Q[i + 1], R) * 0.8 }));
            }
            Q.forEach((q, i) => V.add(q.z, () => BL.sphere3(ctx, q, R, i === 0 ? pal.pos : pal.eTail, i === 0 ? 'O' : null)));
          });
          // where one chain runs into the next
          const one = fatPoints(kink);
          [1.3, 2.6].forEach((dy) => clashes(one, dy).forEach((c) => {
            clash++;
            const q = V.project(c);
            V.add(q.z + 0.5, () => { ctx.lineWidth = 3; ctx.strokeStyle = BL.alpha(pal.pos, 0.85); ctx.beginPath(); ctx.arc(q.x, q.y, R * 1.15, 0, TAU); ctx.stroke(); });
          }));
          V.flush();
          const dbq = V.project({ x: (pts[DB].x + pts[DB + 1].x) / 2, y: pts[DB].y - 0.2 + rows[0], z: 0 });
          BL.label(ctx, 'the double bond — it will not turn', dbq.x, 26, { font: BL.font(700, 13), border: pal.electron });
          BL.label(ctx, kink > 0.5 ? 'kinked — they run into each other (red), so they cannot stack' : 'straight — they lie against each other, so they stack',
            cw / 2, ch - 76, { font: BL.font(700, 14), border: kink > 0.5 ? pal.pos : pal.ui });
        } else {
          const A = mol(p.forms[S.from == null ? S.f : S.from]), B = mol(p.forms[S.f]);
          const mid = { x: (A.mid.x + (B.mid.x - A.mid.x) * ease) * 0, y: 0, z: 0 };
          const rad = A.radius + (B.radius - A.radius) * ease;
          const lerp = (i) => BL.v3.add(A.pos[i], BL.v3.mul(BL.v3.sub(B.pos[i], A.pos[i]), ease));
          // centre on the heavy atoms so the picture does not wander as it morphs
          const cen = A.pos.map((_, i) => lerp(i)).reduce((t, q) => BL.v3.add(t, q), { x: 0, y: 0, z: 0 });
          const n = A.pos.length;
          V.frame(cw, ch, rad + 0.15, { x: cen.x / n, y: cen.y / n, z: cen.z / n });
          const R = V.scale * 0.3, RH = R * 0.5;
          const P = A.pos.map((_, i) => V.project(lerp(i)));
          // bonds: the ones that are breaking fade out, the new ones fade in
          const key = (bd) => Math.min(bd[0], bd[1]) + '-' + Math.max(bd[0], bd[1]);
          const inA = new Set(A.bonds.map(key)), inB = new Set(B.bonds.map(key));
          [...new Set([...inA, ...inB])].forEach((k) => {
            const [i, j] = k.split('-').map(Number);
            const was = inA.has(k), will = inB.has(k);
            const al = was && will ? 1 : was ? 1 - ease : ease;
            V.add((P[i].z + P[j].z) / 2, () => { ctx.save(); ctx.globalAlpha = al; BL.stick3(ctx, P[i], P[j], R * 0.46, { ta: BL.sphereR(P[i], R) * 0.9, tb: BL.sphereR(P[j], R) * 0.9 }); ctx.restore(); });
          });
          // hydrogens: the old ones fade out where they were, the new ones fade in
          // before any switch there is only one molecule, so only one layer
          (S.from == null ? [[B, 1]] : [[A, 1 - ease], [B, ease]]).forEach(([M, al]) => {
            if (al < 0.02) return;
            M.h.forEach((hh) => {
              const par = P[hh.of], q = V.project(BL.v3.add(lerp(hh.of), BL.v3.mul(hh.d, 0.72)));
              V.add(q.z, () => {
                ctx.save(); ctx.globalAlpha = al;
                BL.stick3(ctx, par, q, R * 0.26, { color: BL.alpha(pal.fg, 0.15 + 0.3 * q.d), ta: BL.sphereR(par, R) * 0.9, tb: BL.sphereR(q, RH) * 0.9 });
                BL.sphere3(ctx, q, RH, pal.pos, 'H');
                ctx.restore();
              });
            });
          });
          // the heavy atoms; an atom that changes element fades from one colour to the other
          P.forEach((q, i) => {
            const ea = A.els[i], eb = B.els[i];
            const col = ea === eb ? ELCOL[ea]() : BL.mixHex(ELCOL[ea](), ELCOL[eb](), ease);
            const ring = S.pick === i ? pal.ui : S.hov === i ? BL.alpha(pal.ui, 0.6) : null;
            V.add(q.z, () => BL.sphere3(ctx, q, R * (ea !== eb && ease > 0.2 && ease < 0.8 ? 1.12 : 1), col, ease < 0.5 ? ea : eb, ring ? { ring } : null));
            S.atomHits.push({ x: q.x, y: q.y, r: BL.sphereR(q, R), i });
          });
          V.flush();
          if (S.pick >= 0 && S.pick < n) {
            const q = P[S.pick];
            BL.label(ctx, describe(B, S.pick), cw / 2, 26, { font: BL.font(700, 14), border: pal.ui });
          }
        }

        // the parts counter, pinned. The whole argument is that it does not move.
        const plate = BL.label(ctx, p.parts, cw / 2, ch - 18, { font: BL.font(800, 15), border: pal.ui, pad: 12 });
        BL.label(ctx, 'unchanged, both ways round', cw / 2, plate.y - 12, { font: BL.font(600, 13), bg: false, color: pal.muted });

        V.cue(ctx, pal);
        if (S.hint && !BL.reduced) {
          BL.label(ctx, 'drag to turn it · tap an atom · switch form in the panel →', cw / 2, 24, { font: BL.font(700, 14), border: pal.ui });
        }
      }

      sync();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
