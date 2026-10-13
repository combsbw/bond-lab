/* Four Hands: why it is carbon and not something else.

   Almost all of a body is hydrogen, carbon, nitrogen and oxygen, and only one
   of the four does the building. The reason is boring and complete: carbon has
   four hands. Two hands can only make a line. Three can branch but have
   nothing left over. Four can hold on in front, behind, and to both sides at
   once, which is what a chain with branches and a ring and something hanging
   off every link actually needs.

   This one is in three dimensions, and it has to be. Carbon's four hands point
   at the corners of a tetrahedron, 109.5° apart — they are not a flat plus
   sign, and two things stop making sense if you draw them as one. A chain does
   not zigzag the way it really does. And twisting a bond, which is the whole
   second half of this instrument, turns into a flat squashing motion instead
   of a rotation you can see.

   So: drag to turn the molecule over, click a hydrogen to grow it, click a
   bond to pick it. A single bond spins freely, which is why a chain is floppy.
   Pinch it into a double bond and it locks, both ends held in one plane —
   which is the first time a molecule has a shape it cannot wriggle out of, and
   the reason a fat can be bent one way or the other and never swap. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;

  const HANDS = { C: 4, N: 3, O: 2 };
  const ELS = [['C', 'Carbon', 4], ['N', 'Nitrogen', 3], ['O', 'Oxygen', 2]];
  const TAU = Math.PI * 2;
  const COS_T = -1 / 3;                       // cos 109.47°, the tetrahedral angle
  const SIN_T = Math.sqrt(8) / 3;

  /* ---------------- small vector helpers ---------------- */
  const v = (x, y, z) => ({ x, y, z });
  const add = (a, b) => v(a.x + b.x, a.y + b.y, a.z + b.z);
  const sub = (a, b) => v(a.x - b.x, a.y - b.y, a.z - b.z);
  const mul = (a, k) => v(a.x * k, a.y * k, a.z * k);
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const cross = (a, b) => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  const len = (a) => Math.hypot(a.x, a.y, a.z);
  const unit = (a) => { const L = len(a) || 1e-9; return mul(a, 1 / L); };
  /* any unit vector at right angles to this one */
  const perp = (u) => unit(cross(u, Math.abs(u.x) < 0.9 ? v(1, 0, 0) : v(0, 1, 0)));
  /* turn a vector about an axis — Rodrigues, and the reason the twist is a
     real rotation rather than a drawing of one */
  function spin(p, axis, ang) {
    const c = Math.cos(ang), s = Math.sin(ang);
    return add(add(mul(p, c), mul(cross(axis, p), s)), mul(axis, dot(axis, p) * (1 - c)));
  }

  /* The four corners of a tetrahedron, for an atom with nothing attached yet. */
  const TETRA = [v(1, 1, 1), v(1, -1, -1), v(-1, 1, -1), v(-1, -1, 1)].map(unit);

  const STEPS = [
    { id: 'turn', text: 'Turn the molecule over before you do anything else.',
      how: 'Drag anywhere on the picture, or use the arrow keys.',
      ask: 'carbon’s four hands — are they spread round a flat cross, or pointing at the corners of a pyramid?',
      opts: ['Flat, like a cross', 'Out to the corners of a pyramid'], right: 1 },
    { id: 'chain', text: 'Build a straight chain of six carbons.',
      how: 'Click any hydrogen on an end carbon. Each click turns it into another carbon. Keep going until the readout says six.',
      ask: 'how many hydrogens will a six-carbon chain be carrying when every spare hand is full?',
      opts: ['6', '12', '14', '24'], right: 2 },
    { id: 'branch', text: 'Put a branch on the chain.',
      how: 'Click a hydrogen on a middle carbon, not one on an end.',
      ask: 'does bending a branch out of a six-carbon chain change its formula?',
      opts: ['No — same formula', 'Yes — more hydrogens', 'Yes — fewer hydrogens'], right: 0 },
    { id: 'starved', text: 'Switch the hub element to oxygen and try to branch.',
      how: 'Pick Oxygen, build a short chain, then hunt for a hydrogen that is not on an end.',
      ask: 'oxygen has two hands. What is the most you will get out of it?',
      opts: ['A branch, with effort', 'A line, and nothing else'], right: 1 },
    { id: 'ring', text: 'Join the two ends of a six-carbon chain into a ring.',
      how: 'Build an unbranched chain of five or six carbons, then press “Join the two ends”. Turn it over afterwards.',
      ask: 'closing a ring costs the molecule something. What leaves?',
      opts: ['Two hydrogens', 'Two carbons', 'Nothing — it just curls up'], right: 0 },
    { id: 'lock', text: 'Twist a single bond, then make it double and try again.',
      how: 'Click a bond between two carbons, drag the twist slider and watch the far half turn. Then press “double” and try the slider again.',
      ask: 'will the double bond turn?',
      opts: ['Yes, just stiffly', 'No, not at all'], right: 1 },
    { id: 'triple', text: 'Make a triple bond and look at what is left over.',
      how: 'With a bond selected, press “triple” and count the hydrogens on those two carbons.',
      ask: 'three bonds between two carbons uses three of each one’s four hands. What is left?',
      opts: ['One hand each, pointing straight out', 'Two hands each, at an angle'], right: 0 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".8">' +
    '<path d="M100 60 L148 34"/><path d="M100 60 L52 34"/><path d="M100 60 V22"/><path d="M100 60 L112 104"/></g>' +
    '<circle cx="100" cy="60" r="19" fill="var(--e-c)"/>' +
    '<g fill="var(--pos)"><circle cx="150" cy="32" r="9"/><circle cx="50" cy="32" r="9"/><circle cx="100" cy="20" r="9"/><circle cx="113" cy="106" r="9"/></g></svg>';

  BL.register({
    id: 'backbone', field: 'carbon', order: 0, name: 'Four Hands',
    tagline: 'Carbon holds on in four directions. Everything else follows.',
    lede: 'A single atom with its hands out, in three dimensions — drag to turn it over. Click a hand and another atom joins on. Build a chain, bend a branch out of it, curl it into a ring, then pick a bond and twist it. Swap the middle element for one with fewer hands and watch how quickly you run out of places to go.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        el: 'C',
        atoms: [],        // {p: vec, par: index|null}
        bonds: [],        // {a, b, order}
        ring: false,
        sel: -1,
        twist: 0, twistTried: 0,
        yaw: 0.6, pitch: 0.3, spun: 0, turned: false,
        hint: true, hits: [], bhits: [],
      };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A molecule in three dimensions. A central atom shows one stub for each hand it has, pointing at the corners of a tetrahedron. Drag to turn the molecule over; click a hydrogen to grow the molecule; click a bond to select it and twist it. Controls are in the side panel.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- the skeleton ---------------- */
      function reset(el) {
        S.el = el || S.el;
        S.atoms = [{ p: v(0, 0, 0), par: null }];
        S.bonds = [];
        S.ring = false; S.sel = -1; S.twist = 0;
        say();
      }
      const hands = () => HANDS[S.el];
      const neighbours = (i) => S.bonds.filter((b) => b.a === i || b.b === i).map((b) => (b.a === i ? b.b : b.a));
      const used = (i) => S.bonds.reduce((n, b) => n + (b.a === i || b.b === i ? b.order : 0), 0);
      const free = (i) => Math.max(0, hands() - used(i));

      /* Where an atom's spare hands point.

         Worked out from where its neighbours already are, so this covers a
         bare atom, the end of a chain, the middle of one, a branch point and
         a ring corner without any of them being a special case. One
         neighbour: three directions at the tetrahedral angle, turned so the
         first one sits opposite the grandparent, which is what makes a real
         chain zigzag. Two: the two directions left over, one either side of
         the plane those two neighbours make. Three: the one gap left. */
      function slots(i, P) {
        P = P || S.atoms.map((a) => a.p);
        const a = { p: P[i] };
        const nb = neighbours(i).map((j) => unit(sub(P[j], a.p)));
        const n = free(i);
        if (!n) return [];
        if (nb.length === 0) return TETRA.slice(0, Math.min(4, hands()));
        if (nb.length === 1) {
          const u = nb[0];
          // stagger against whatever the neighbour is itself attached to
          const j = neighbours(i)[0];
          const gp = neighbours(j).find((k) => k !== i);
          let p;
          if (gp != null) {
            const g = sub(P[gp], P[j]);
            const gperp = sub(g, mul(u, dot(g, u)));
            p = len(gperp) > 1e-6 ? mul(unit(gperp), -1) : perp(u);
          } else p = perp(u);
          const q = cross(u, p);
          const out = [];
          for (let k = 0; k < 3; k++) {
            const t = (k * TAU) / 3;
            out.push(unit(add(mul(u, COS_T), mul(add(mul(p, Math.cos(t)), mul(q, Math.sin(t))), SIN_T))));
          }
          return out.slice(0, n);
        }
        if (nb.length === 2) {
          const s = add(nb[0], nb[1]);
          let nrm = cross(nb[0], nb[1]);
          if (len(nrm) < 1e-5) nrm = perp(nb[0]);           // the two are in a line (a triple bond)
          nrm = unit(nrm);
          const back = len(s) > 1e-6 ? mul(unit(s), -1) : perp(nrm);
          return [unit(add(mul(back, 0.58), mul(nrm, 0.816))), unit(sub(mul(back, 0.58), mul(nrm, 0.816)))].slice(0, n);
        }
        const s3 = nb.reduce(add, v(0, 0, 0));
        return (len(s3) > 1e-6 ? [mul(unit(s3), -1)] : [perp(nb[0])]).slice(0, n);
      }

      function grow(i, dir) {
        if (S.ring || S.atoms.length >= 14 || free(i) < 1) return;
        const np = add(S.atoms[i].p, mul(dir, 1));
        if (S.atoms.some((q) => len(sub(q.p, np)) < 0.7)) return;
        S.atoms.push({ p: np, par: i });
        S.bonds.push({ a: i, b: S.atoms.length - 1, order: 1 });
        S.twist = 0;
        check(); say();
      }

      function joinEnds() {
        const n = S.atoms.length;
        if (S.ring || n < 4 || n > 7) return;
        const ends = S.atoms.map((_, i) => i).filter((i) => neighbours(i).length === 1);
        if (ends.length !== 2 || S.atoms.some((_, i) => neighbours(i).length > 2)) return;
        const order = [ends[0]];
        while (order.length < n) {
          const last = order[order.length - 1];
          const nxt = neighbours(last).find((j) => order.indexOf(j) < 0);
          if (nxt == null) break;
          order.push(nxt);
        }
        if (order.length !== n) return;
        /* A real six-ring is a chair, not a flat hexagon, so alternate corners
           ride above and below the plane. It is the shape every sugar in you
           actually is, and you can only see it by turning the thing over. */
        const R = 1 / (2 * Math.sin(Math.PI / n));
        const pucker = n % 2 === 0 ? 0.25 : 0;
        order.forEach((idx, k) => {
          const ang = (k / n) * TAU;
          S.atoms[idx].p = v(Math.cos(ang) * R, Math.sin(ang) * R, (k % 2 ? 1 : -1) * pucker);
        });
        S.bonds.push({ a: ends[0], b: ends[1], order: 1 });
        S.bonds.forEach((b) => { b.order = 1; });
        S.ring = true; S.sel = -1; S.twist = 0;
        check(); say();
      }

      function setOrder(k) {
        if (S.sel < 0) return;
        const b = S.bonds[S.sel];
        const spareA = hands() - used(b.a) + b.order, spareB = hands() - used(b.b) + b.order;
        b.order = clamp(k, 1, Math.min(3, spareA, spareB));
        if (b.order > 1) { S.twist = 0; twistIn.value = '0'; twistOut.textContent = '0°'; }
        check(); say();
      }

      function aromatic() {
        if (!S.ring || S.atoms.length !== 6) return;
        let cur = 0, prev = -1;
        const order = [];
        for (let k = 0; k < 6; k++) {
          const nxt = neighbours(cur).find((j) => j !== prev);
          order.push(S.bonds.findIndex((b) => (b.a === cur && b.b === nxt) || (b.b === cur && b.a === nxt)));
          prev = cur; cur = nxt;
        }
        order.forEach((bi, k) => { if (bi >= 0) S.bonds[bi].order = k % 2 ? 1 : 2; });
        // alternating double bonds flatten the ring, which is why benzene is flat
        S.atoms.forEach((a) => { a.p = v(a.p.x, a.p.y, 0); });
        check(); say();
      }

      /* ---------------- twisting, for real ---------------- */
      function beyond(bi) {
        const b = S.bonds[bi], out = new Set([b.b]), q = [b.b];
        while (q.length) {
          const i = q.pop();
          neighbours(i).forEach((j) => { if (j !== b.a && !out.has(j)) { out.add(j); q.push(j); } });
        }
        out.delete(b.b);
        return out;
      }
      /* Every atom's position, with the far side of the selected bond turned
         about that bond's own axis. A genuine rotation in three dimensions —
         nothing here is a flat approximation of one. */
      function placed() {
        const pos = S.atoms.map((a) => a.p);
        if (S.sel < 0 || !S.twist) return pos;
        const b = S.bonds[S.sel];
        if (b.order > 1) return pos;
        const A = S.atoms[b.a].p, B = S.atoms[b.b].p;
        const axis = unit(sub(B, A));
        const far = beyond(S.sel);
        return pos.map((p, i) => (far.has(i) ? add(B, spin(sub(p, B), axis, S.twist)) : p));
      }

      /* ---------------- what it is ---------------- */
      function shape() {
        if (S.ring) return 'a ring';
        if (S.atoms.some((_, i) => neighbours(i).length > 2)) return 'a branched chain';
        if (S.atoms.length === 1) return 'one atom on its own';
        return 'a straight chain';
      }
      const SUB = '₀₁₂₃₄₅₆₇₈₉';
      const sub2 = (n) => String(n).split('').map((d) => SUB[+d]).join('');
      function formula() {
        const n = S.atoms.length, hs = S.atoms.reduce((t, _, i) => t + free(i), 0);
        return S.el + (n > 1 ? sub2(n) : '') + (hs ? 'H' + (hs > 1 ? sub2(hs) : '') : '');
      }

      function check() {
        const n = S.atoms.length;
        const straight = !S.ring && !S.atoms.some((_, i) => neighbours(i).length > 2);
        if (S.spun > 1.6) steps.done('turn');
        if (S.el === 'C' && n >= 6 && straight) steps.done('chain');
        if (S.el === 'C' && n >= 5 && !S.ring && S.atoms.some((_, i) => neighbours(i).length > 2)) steps.done('branch');
        if (S.el === 'O' && n >= 3) steps.done('starved');
        if (S.ring) steps.done('ring');
        if (S.bonds.some((b) => b.order === 2) && S.twistTried > 0.2) steps.done('lock');
        if (S.bonds.some((b) => b.order === 3)) steps.done('triple');
      }

      /* ---------------- dock ---------------- */
      const elBtns = ELS.map(([sym, name, n]) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(S.el === sym),
        onclick: () => { reset(sym); elBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(ELS[i][0] === S.el))); },
      }, name + ' · ' + n + (n === 1 ? ' hand' : ' hands')));
      dock.appendChild(h('section', {},
        h('h2', {}, 'The hub element'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Which element to build out of' }, elBtns),
        h('p', { class: 'hint' }, 'Every atom in the skeleton is this element. Swapping it starts again, because a two-handed atom cannot hold a chain a four-handed one was carrying.')));

      const joinBtn = h('button', { type: 'button', class: 'action ghost', onclick: joinEnds }, 'Join the two ends');
      const benzBtn = h('button', { type: 'button', class: 'action ghost', onclick: aromatic }, 'Alternate the ring’s bonds');
      dock.appendChild(h('section', {},
        h('h2', {}, 'The whole molecule'),
        h('div', { class: 'actions' }, joinBtn, benzBtn,
          h('button', { type: 'button', class: 'action ghost', onclick: () => reset() }, 'Start again'))));

      const ordBtns = [1, 2, 3].map((k) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => setOrder(k),
      }, ['single', 'double', 'triple'][k - 1]));
      const twistOut = h('output', { class: 'val' }, '0°');
      const twistIn = h('input', { type: 'range', min: '0', max: '360', step: '1', value: '0', 'aria-label': 'Twist the selected bond' });
      twistIn.addEventListener('input', () => {
        const val = parseFloat(twistIn.value);
        S.twistTried = Math.max(S.twistTried, val / 360);
        const b = S.sel >= 0 ? S.bonds[S.sel] : null;
        S.twist = b && b.order === 1 ? (val * Math.PI) / 180 : 0;
        twistOut.textContent = Math.round(val) + '°';
        S.hint = false;
        check();
      });
      const twistNote = h('p', { class: 'hint' });
      dock.appendChild(h('section', {},
        h('h2', {}, 'One bond'),
        h('p', { class: 'hint' }, 'Click a bond on the picture to pick it.'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'How many bonds between the two atoms' }, ordBtns),
        h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'Twist it'), twistOut),
          h('div', { class: 'range-wrap' }, twistIn, h('div', { class: 'range-ends' }, h('span', {}, 'where it was'), h('span', {}, 'all the way round')))),
        twistNote));

      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'backbone', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const readout = h('div', { class: 'readout' });
      const meters = h('div', { class: 'meters' });
      const handsM = BL.meter('Hands in use across the molecule');
      meters.appendChild(handsM.el);
      aux.appendChild(h('section', { class: 'panel' }, readout, statusP, meters,
        h('div', { class: 'legend' },
          h('span', {}, h('i', { style: 'background:var(--e-c)' }), 'a heavy atom'),
          h('span', {}, h('i', { style: 'background:var(--pos)' }), 'a hydrogen — click one to grow'),
          h('span', {}, h('i', { style: 'background:var(--ui)' }), 'the bond you have picked'))));
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'Why four is the useful number'),
        h('div', { class: 'facts' },
          h('p', { class: 'fact' }, h('b', {}, 'One hand. '), 'Hydrogen. It can be an end and nothing else. It caps whatever it touches.'),
          h('p', { class: 'fact' }, h('b', {}, 'Two hands. '), 'Oxygen. One in, one out. It can sit in the middle of a line, and a line is all you ever get.'),
          h('p', { class: 'fact' }, h('b', {}, 'Three hands. '), 'Nitrogen. Now a branch is possible — but a branching atom has used all three and has nothing spare to carry anything.'),
          h('p', { class: 'fact' }, h('b', {}, 'Four hands. '), 'Carbon. Chain on through, branch sideways, and still have a hand free to hold a group that does a job. Which is why you are mostly made of it.')),
        h('p', { class: 'hint' }, 'Hydrogen, carbon, nitrogen and oxygen are about 96% of your mass. The one with four hands is the one that gets to be the backbone. And the four hands are 109.5° apart, not 90° — turn the molecule over and you can see it.')));

      /* ---------------- turning, growing, picking ---------------- */
      BL.drag(stage.canvas, {
        pick: (p) => ({ x0: p.x, y0: p.y, px: p.x, py: p.y, moved: 0 }),
        move: (hd, p) => {
          const dx = p.x - hd.px, dy = p.y - hd.py;
          hd.px = p.x; hd.py = p.y;
          hd.moved += Math.abs(dx) + Math.abs(dy);
          if (hd.moved < 5) return;          // same threshold a tap uses, so one gesture is never both
          S.yaw += dx * 0.011;
          S.pitch = clamp(S.pitch + dy * 0.011, -1.5, 1.5);
          S.spun += (Math.abs(dx) + Math.abs(dy)) * 0.011;
          S.turned = true; S.hint = false;
          check();
        },
        end: (hd) => {
          if (hd.moved >= 5) return;               // that was a turn, not a tap
          S.hint = false;
          for (const hit of S.hits) if (Math.hypot(hit.x - hd.x0, hit.y - hd.y0) < hit.r + 9) { grow(hit.i, hit.dir); return; }
          for (const hit of S.bhits) if (Math.hypot(hit.x - hd.x0, hit.y - hd.y0) < 20) { S.sel = hit.bi; S.twist = 0; twistIn.value = '0'; twistOut.textContent = '0°'; say(); return; }
        },
      });
      stage.canvas.addEventListener('keydown', (e) => {
        const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (k) {
          e.preventDefault();
          S.yaw += k[0] * 0.15; S.pitch = clamp(S.pitch + k[1] * 0.15, -1.5, 1.5);
          S.spun += 0.15; S.turned = true; S.hint = false; check();
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          const i = S.atoms.length - 1, sp = slots(i);
          if (sp.length) { grow(i, sp[0]); e.preventDefault(); }
        }
      });

      /* ---------------- words ---------------- */
      function say() {
        const n = S.atoms.length, tot = n * hands(), inUse = S.atoms.reduce((t, _, i) => t + used(i), 0);
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, formula()),
          h('span', { class: 'zone' }, shape()),
          h('span', { class: 'dim' }, n + ' ' + S.el + (n === 1 ? '' : 's') + ' · ' + S.atoms.reduce((t, _, i) => t + free(i), 0) + ' hydrogens'));
        handsM.set(tot ? inUse / tot : 0, inUse + ' of ' + tot + ' holding another ' + S.el, '');
        joinBtn.disabled = S.ring || n < 4 || n > 7 || S.atoms.some((_, i) => neighbours(i).length > 2);
        benzBtn.disabled = !S.ring || n !== 6;
        const b = S.sel >= 0 ? S.bonds[S.sel] : null;
        ordBtns.forEach((btn, i) => { btn.setAttribute('aria-pressed', String(!!b && b.order === i + 1)); btn.disabled = !b; });
        twistIn.disabled = !b || b.order > 1;
        twistNote.textContent = !b
          ? 'Nothing picked. Click a bond on the picture.'
          : b.order === 1
            ? 'A single bond turns freely — drag the slider and watch the far half of the molecule go round. That is why a chain is floppy and a fat can flop into any shape it likes.'
            : b.order === 2
              ? 'A double bond will not turn. Both ends are held in one plane — the shaded panel on the picture — so this molecule now has a shape, and the only way to change it is to break the bond.'
              : 'A triple bond will not turn either, and it has pulled the two atoms and everything on them into a straight line, with one hand each left over.';
        const sh = shape();
        statusP.textContent = n === 1
          ? S.el + ' on its own, holding ' + free(0) + ' hydrogens, 109.5° apart. Turn it over, then click one of them.'
          : 'This is ' + sh + '. ' + (S.ring
            ? 'Turn it over and look at it edge on: a six-ring is not flat, it is buckled into a chair. Every sugar in you is that shape.'
            : sh === 'a branched chain'
              ? 'Count the hydrogens, then build the straight version and count again. Same formula, different molecule — which is the next instrument along.'
              : 'Keep going, or bend a branch out of a middle atom.');
      }

      /* ---------------- drawing ---------------- */
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        /* A slow turn until somebody takes over, so it is obvious at a glance
           that this is a solid object and not a diagram. */
        if (!S.turned && !BL.reduced) S.yaw += dt * 0.35;

        const pos = placed();
        const cyaw = Math.cos(S.yaw), syaw = Math.sin(S.yaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
        /* Fit to a sphere around the molecule's own middle, counting the
           hydrogens, which stick a bond-length further out. A sphere rather
           than a box because a box's size changes as the thing turns, and a
           picture that breathes while it spins is horrible to look at. */
        const all = [];
        pos.forEach((p, i) => { all.push(p); slots(i, pos).forEach((d) => all.push(add(p, mul(d, 0.72)))); });
        const mid = mul(all.reduce(add, v(0, 0, 0)), 1 / all.length);
        let reach = 0.9;
        all.forEach((p) => { reach = Math.max(reach, len(sub(p, mid))); });
        const sc = clamp(Math.min(cw - 40, ch - 76) / (reach * 2.1), 20, 170);
        const mq = { x: mid.x * cyaw + mid.z * syaw, y: 0, z: -mid.x * syaw + mid.z * cyaw };
        const cx = cw / 2 - mq.x * sc;
        const cy = ch / 2 + 6 - (mid.y * cp - mq.z * sp) * sc;
        const proj = (p) => {
          const x1 = p.x * cyaw + p.z * syaw, z1 = -p.x * syaw + p.z * cyaw;
          const y2 = p.y * cp - z1 * sp, z2 = p.y * sp + z1 * cp;
          return { x: cx + x1 * sc, y: cy + y2 * sc, z: z2 };
        };
        const depth = (z) => clamp(0.5 + z / (reach * 2.1), 0.18, 1);
        const R = sc * 0.3, RH = R * 0.52;

        S.hits = []; S.bhits = [];
        const P = pos.map(proj);

        /* Everything goes into one list and comes out sorted back to front, so
           what is in front really is drawn in front. */
        const items = [];

        // the plane a double bond holds its two ends in
        if (S.sel >= 0 && S.bonds[S.sel].order === 2) {
          const b = S.bonds[S.sel];
          const ends = [b.a, b.b];
          const near = [];
          ends.forEach((i) => { near.push(pos[i]); neighbours(i).forEach((j) => { if (ends.indexOf(j) < 0) near.push(pos[j]); }); });
          slots(b.a, pos).forEach((d) => near.push(add(pos[b.a], mul(d, 0.72))));
          slots(b.b, pos).forEach((d) => near.push(add(pos[b.b], mul(d, 0.72))));
          const zq = near.reduce((t, p) => t + proj(p).z, 0) / near.length;
          items.push({ z: zq - 0.01, draw: () => {
            const axis = unit(sub(pos[b.b], pos[b.a]));
            let up = perp(axis);
            const sideRef = near.find((p) => len(cross(sub(p, pos[b.a]), axis)) > 0.2);
            if (sideRef) {
              const w = sub(sideRef, pos[b.a]);
              const wp = sub(w, mul(axis, dot(w, axis)));
              if (len(wp) > 1e-5) up = unit(wp);
            }
            const mid = mul(add(pos[b.a], pos[b.b]), 0.5);
            const corners = [[-1.5, -1.1], [1.5, -1.1], [1.5, 1.1], [-1.5, 1.1]]
              .map(([u2, w2]) => proj(add(mid, add(mul(axis, u2), mul(up, w2)))));
            ctx.beginPath();
            corners.forEach((q, k) => (k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
            ctx.closePath();
            ctx.fillStyle = BL.alpha(pal.ui, 0.13); ctx.fill();
            ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(pal.ui, 0.65); ctx.stroke(); ctx.setLineDash([]);
          } });
        }

        // bonds
        S.bonds.forEach((b, bi) => {
          const qa = P[b.a], qb = P[b.b];
          const z = (qa.z + qb.z) / 2;
          const picked = bi === S.sel;
          items.push({ z, draw: () => {
            const d = depth(z);
            O.bond(ctx, qa.x, qa.y, qb.x, qb.y, {
              order: b.order, width: R * 0.46 * (0.6 + 0.5 * d),
              color: picked ? pal.ui : BL.alpha(pal.fg, 0.2 + 0.55 * d),
            });
            const mx = (qa.x + qb.x) / 2, my = (qa.y + qb.y) / 2;
            if (picked) {
              ctx.lineWidth = 2.5; ctx.strokeStyle = pal.ui;
              ctx.beginPath(); ctx.arc(mx, my, R * 0.78, 0, TAU); ctx.stroke();
            }
          } });
          S.bhits.push({ x: (qa.x + qb.x) / 2, y: (qa.y + qb.y) / 2, bi });
        });

        // spare hands, as hydrogens you can click
        S.atoms.forEach((_, i) => {
          slots(i, pos).forEach((dir) => {
            const hp = add(pos[i], mul(dir, 0.72));
            const q = proj(hp), qa = P[i];
            items.push({ z: q.z, draw: () => {
              const d = depth(q.z);
              O.bond(ctx, qa.x, qa.y, q.x, q.y, { width: R * 0.26 * (0.6 + 0.5 * d), alpha: 0.18 + 0.28 * d });
              O.atom(ctx, q.x, q.y, RH * (0.72 + 0.4 * d), 'H', { label: RH * d >= 9, color: BL.mix(pal.pos, pal.bg, 1 - d) });
            } });
            if (!S.ring && S.atoms.length < 14) S.hits.push({ x: q.x, y: q.y, r: RH, i, dir });
          });
        });

        // the heavy atoms
        pos.forEach((_, i) => {
          const q = P[i];
          items.push({ z: q.z, draw: () => {
            const d = depth(q.z);
            O.atom(ctx, q.x, q.y, R * (0.68 + 0.4 * d), S.el, { color: BL.mix(pal.el[S.el] || pal.eC, pal.bg, (1 - d) * 0.75) });
          } });
        });

        items.sort((a, b) => a.z - b.z).forEach((it) => it.draw());

        // the axis a twist turns about, so it is clear what is going round what
        if (S.sel >= 0 && S.bonds[S.sel].order === 1 && S.twist > 0.03) {
          const b = S.bonds[S.sel];
          const A = pos[b.a], B = pos[b.b];
          const axis = unit(sub(B, A));
          const far = [...beyond(S.sel)];
          const ref = far.length ? S.atoms[far[0]].p : add(B, mul(perp(axis), 1));
          let arm = sub(ref, B);
          arm = sub(arm, mul(axis, dot(arm, axis)));
          if (len(arm) > 1e-5) {
            arm = mul(unit(arm), 0.75);
            ctx.beginPath();
            for (let k = 0; k <= 48; k++) {
              const q = proj(add(B, spin(arm, axis, (k / 48) * S.twist)));
              k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
            }
            ctx.lineWidth = 3; ctx.strokeStyle = BL.alpha(pal.electron, 0.9); ctx.stroke();
            const tip = proj(add(B, spin(arm, axis, S.twist)));
            O.atom(ctx, tip.x, tip.y, 5, 'C', { color: pal.electron, label: false });
          }
          BL.label(ctx, 'turned ' + Math.round((S.twist * 180) / Math.PI) + '°', cw / 2, ch - 18, { font: BL.font(700, 14), border: pal.electron });
        }

        if (S.hint && !BL.reduced) {
          const t = (performance.now() / 600) % TAU;
          const hit = S.hits[0];
          if (hit) {
            ctx.lineWidth = 2.5; ctx.strokeStyle = BL.alpha(pal.ui, 0.5 + 0.4 * Math.sin(t));
            ctx.beginPath(); ctx.arc(hit.x, hit.y, RH + 9 + 3 * Math.sin(t), 0, TAU); ctx.stroke();
          }
          BL.label(ctx, '↻ drag to turn it · click a hydrogen to grow it', cw / 2, 22, { font: BL.font(700, 14), border: pal.ui });
        }
      }

      reset('C');
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
