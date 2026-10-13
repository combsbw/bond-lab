/* Four Hands: why it is carbon and not something else.

   Almost all of a body is hydrogen, carbon, nitrogen and oxygen, and only one
   of the four does the building. The reason is boring and complete: carbon has
   four hands. Two hands can only make a line. Three can branch but have
   nothing left over. Four can hold on in front, behind, and to both sides at
   once, which is what a chain with branches and a ring and something hanging
   off every link actually needs.

   So the instrument is a thing you build with. Click a spare hand, another
   carbon appears. Swap the hub element to oxygen and watch the building stop,
   because two hands is one in and one out and there is nothing left.

   The other half is twisting. A single bond turns freely — that is why a
   chain is floppy. Pinch it into a double bond and it locks, which is the
   first time a molecule has a shape it cannot wriggle out of, and the reason
   a fat can be bent one way or the other and never swap. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;

  const HANDS = { C: 4, N: 3, O: 2, H: 1 };
  const ELS = [['C', 'Carbon', 4], ['N', 'Nitrogen', 3], ['O', 'Oxygen', 2]];
  const LEN = 54;              // bond length, screen units before scaling
  const TAU = Math.PI * 2;

  const STEPS = [
    { id: 'chain', text: 'Build a straight chain of six carbons.',
      how: 'Click the small hydrogen on the right-hand end. Each click turns it into another carbon. Do it until the readout says six.',
      ask: 'how many hydrogens will a six-carbon chain be carrying when every spare hand is full?',
      opts: ['6', '12', '14', '24'], right: 2 },
    { id: 'branch', text: 'Put a branch on the chain.',
      how: 'Click a hydrogen sticking out of the top or bottom of a middle carbon, not one on the end.',
      ask: 'does bending a branch out of a six-carbon chain change its formula?',
      opts: ['No — same formula', 'Yes — more hydrogens', 'Yes — fewer hydrogens'], right: 0 },
    { id: 'starved', text: 'Switch the hub element to oxygen and try to branch.',
      how: 'Pick Oxygen, build a short chain, then hunt for a hydrogen that is not on an end.',
      ask: 'oxygen has two hands. What is the most you will get out of it?',
      opts: ['A branch, with effort', 'A line, and nothing else'], right: 1 },
    { id: 'ring', text: 'Join the two ends of a six-carbon chain into a ring.',
      how: 'Build an unbranched chain of five or six carbons, then press “Join the two ends”.',
      ask: 'closing a ring costs the molecule something. What leaves?',
      opts: ['Two hydrogens', 'Two carbons', 'Nothing — it just curls up'], right: 0 },
    { id: 'lock', text: 'Make a double bond and then try to twist it.',
      how: 'Click a bond between two carbons to select it, press “double”, then drag the twist slider.',
      ask: 'will the double bond turn?',
      opts: ['Yes, just stiffly', 'No, not at all'], right: 1 },
    { id: 'triple', text: 'Make a triple bond and look at what is left over.',
      how: 'With a bond selected, press “triple” and count the hydrogens on those two carbons.',
      ask: 'three bonds between two carbons uses three of each one’s four hands. What is left?',
      opts: ['One hand each, pointing straight out', 'Two hands each, at an angle'], right: 0 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".85">' +
    '<path d="M100 60 H150"/><path d="M100 60 H50"/><path d="M100 60 V20"/><path d="M100 60 V100"/></g>' +
    '<circle cx="100" cy="60" r="20" fill="var(--e-c)"/>' +
    '<g fill="var(--pos)"><circle cx="152" cy="60" r="9"/><circle cx="48" cy="60" r="9"/><circle cx="100" cy="18" r="9"/><circle cx="100" cy="102" r="9"/></g></svg>';

  BL.register({
    id: 'backbone', field: 'carbon', order: 0, name: 'Four Hands',
    tagline: 'Carbon holds on in four directions. Everything else follows.',
    lede: 'A single atom with its hands out. Click a hand and another one joins on. Build a chain, bend a branch out of it, curl it into a ring — then swap the middle element for one with fewer hands and watch how quickly you run out of places to go.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        el: 'C',
        atoms: [],        // {x, y, back} — back is the angle pointing at the parent
        bonds: [],        // {a, b, order}
        ring: false,
        sel: -1,          // selected bond
        twist: 0,
        hint: true,
        hits: [],         // clickable spare hands, rebuilt every frame
        bhits: [],        // clickable bonds
      };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A molecule you build by clicking. A central atom shows one stub for each hand it has; clicking the small hydrogen on a stub turns it into another heavy atom. Bonds can be selected and made double or triple. Controls are in the side panel.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- the skeleton ---------------- */
      function reset(el) {
        S.el = el || S.el;
        S.atoms = [{ x: 0, y: 0, back: null }];
        S.bonds = [];
        S.ring = false; S.sel = -1; S.twist = 0;
        say();
      }
      const hands = () => HANDS[S.el];
      const neighbours = (i) => S.bonds.filter((b) => b.a === i || b.b === i).map((b) => (b.a === i ? b.b : b.a));
      const used = (i) => S.bonds.reduce((n, b) => n + (b.a === i || b.b === i ? b.order : 0), 0);
      const free = (i) => Math.max(0, hands() - used(i));

      /* Where an atom's hands point. The first one points back at whoever it
         came from; the rest are spaced evenly round the circle, which is why a
         four-handed atom looks like a plus sign and a two-handed one looks
         like a dash. */
      function slots(i) {
        const n = hands(), a = S.atoms[i];
        const out = [];
        if (S.ring) {
          const c = centre(), base = Math.atan2(a.y - c.y, a.x - c.x);
          for (let k = 0; k < n - 2; k++) out.push(base + (k - (n - 3) / 2) * 0.72);
          return out;
        }
        const start = a.back == null ? 0 : a.back;
        for (let k = a.back == null ? 0 : 1; k < n; k++) out.push(start + (k * TAU) / n);
        return out;
      }
      function centre() {
        let sx = 0, sy = 0;
        S.atoms.forEach((a) => { sx += a.x; sy += a.y; });
        return { x: sx / S.atoms.length, y: sy / S.atoms.length };
      }
      /* Which slots already have a heavy atom on them, and which are spare. */
      function spare(i) {
        const taken = neighbours(i).map((j) => Math.atan2(S.atoms[j].y - S.atoms[i].y, S.atoms[j].x - S.atoms[i].x));
        const open = slots(i).filter((a) => !taken.some((t) => Math.abs(Math.atan2(Math.sin(a - t), Math.cos(a - t))) < 0.4));
        return open.slice(0, free(i));
      }

      function grow(i, ang) {
        if (S.ring || S.atoms.length >= 14 || free(i) < 1) return;
        const a = S.atoms[i];
        const nx = a.x + Math.cos(ang) * LEN, ny = a.y + Math.sin(ang) * LEN;
        if (S.atoms.some((p) => Math.hypot(p.x - nx, p.y - ny) < LEN * 0.7)) return;
        S.atoms.push({ x: nx, y: ny, back: ang + Math.PI });
        S.bonds.push({ a: i, b: S.atoms.length - 1, order: 1 });
        S.twist = 0;
        check(); say();
      }

      function joinEnds() {
        const n = S.atoms.length;
        if (S.ring || n < 4 || n > 7) return;
        const ends = S.atoms.map((_, i) => i).filter((i) => neighbours(i).length === 1);
        if (ends.length !== 2 || S.atoms.some((_, i) => neighbours(i).length > 2)) return;
        // walk the chain so the ring comes out in order
        const order = [ends[0]];
        while (order.length < n) {
          const last = order[order.length - 1];
          const nxt = neighbours(last).find((j) => order.indexOf(j) < 0);
          if (nxt == null) break;
          order.push(nxt);
        }
        if (order.length !== n) return;
        const R = LEN / (2 * Math.sin(Math.PI / n));
        const pts = O.ringPts(0, 0, R, n, -Math.PI / 2);
        order.forEach((idx, k) => { S.atoms[idx].x = pts[k][0]; S.atoms[idx].y = pts[k][1]; });
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
        if (b.order > 1) S.twist = 0;
        check(); say();
      }

      function aromatic() {
        if (!S.ring || S.atoms.length !== 6) return;
        // alternate the ring bonds round the loop
        const ring = S.bonds.filter((b) => true);
        let flip = true;
        const seen = new Set(), order = [];
        let cur = 0, prev = -1;
        for (let k = 0; k < 6; k++) {
          const nxt = neighbours(cur).find((j) => j !== prev);
          const bi = S.bonds.findIndex((b) => (b.a === cur && b.b === nxt) || (b.b === cur && b.a === nxt));
          order.push(bi); prev = cur; cur = nxt;
        }
        order.forEach((bi, k) => { if (bi >= 0) S.bonds[bi].order = k % 2 ? 1 : 2; });
        check(); say();
      }

      /* ---------------- twisting ---------------- */
      /* Rotating the far half of the molecule about one bond, projected flat.
         The part of each atom's offset that lies across the bond shrinks by
         cos of the angle, and the part that has swung out of the screen is
         what the depth shading shows. Which is what a bond twisting looks
         like when you are only allowed two dimensions. */
      function beyond(bi) {
        const b = S.bonds[bi], out = new Set([b.b]), q = [b.b];
        while (q.length) {
          const i = q.pop();
          neighbours(i).forEach((j) => { if (j !== b.a && !out.has(j)) { out.add(j); q.push(j); } });
        }
        out.delete(b.b);
        return out;
      }
      function placed() {
        const pos = S.atoms.map((a) => ({ x: a.x, y: a.y, z: 0 }));
        if (S.sel < 0 || !S.twist) return pos;
        const b = S.bonds[S.sel];
        if (b.order > 1) return pos;
        const A = S.atoms[b.a], B = S.atoms[b.b];
        let ux = B.x - A.x, uy = B.y - A.y;
        const L = Math.hypot(ux, uy) || 1;
        ux /= L; uy /= L;
        const c = Math.cos(S.twist), s = Math.sin(S.twist);
        beyond(S.sel).forEach((i) => {
          const vx = S.atoms[i].x - B.x, vy = S.atoms[i].y - B.y;
          const al = vx * ux + vy * uy;
          const pxv = vx - al * ux, pyv = vy - al * uy;
          pos[i] = { x: B.x + al * ux + pxv * c, y: B.y + al * uy + pyv * c, z: Math.hypot(pxv, pyv) * s };
        });
        return pos;
      }

      /* ---------------- what it is ---------------- */
      function shape() {
        if (S.ring) return 'a ring';
        if (S.atoms.some((_, i) => neighbours(i).length > 2)) return 'a branched chain';
        if (S.atoms.length === 1) return 'one atom on its own';
        return 'a straight chain';
      }
      function formula() {
        const n = S.atoms.length, hs = S.atoms.reduce((t, _, i) => t + free(i), 0);
        return S.el + (n > 1 ? sub(n) : '') + (hs ? 'H' + (hs > 1 ? sub(hs) : '') : '');
      }
      const SUB = '₀₁₂₃₄₅₆₇₈₉';
      const sub = (n) => String(n).split('').map((d) => SUB[+d]).join('');

      function check() {
        const n = S.atoms.length;
        const straight = !S.ring && !S.atoms.some((_, i) => neighbours(i).length > 2);
        if (S.el === 'C' && n >= 6 && straight) steps.done('chain');
        if (S.el === 'C' && n >= 5 && !S.ring && S.atoms.some((_, i) => neighbours(i).length > 2)) steps.done('branch');
        if (S.el === 'O' && n >= 3) steps.done('starved');
        if (S.ring) steps.done('ring');
        if (S.bonds.some((b) => b.order === 2) && Math.abs(S.twistTried || 0) > 0.2) steps.done('lock');
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
      const twistIn = h('input', { type: 'range', min: '0', max: '90', step: '1', value: '0', 'aria-label': 'Twist the selected bond' });
      twistIn.addEventListener('input', () => {
        const v = parseFloat(twistIn.value);
        S.twistTried = Math.max(S.twistTried || 0, v / 90);
        const b = S.sel >= 0 ? S.bonds[S.sel] : null;
        S.twist = b && b.order === 1 ? (v * Math.PI) / 180 : 0;
        twistOut.textContent = Math.round(v) + '°';
        check();
      });
      const twistNote = h('p', { class: 'hint' });
      dock.appendChild(h('section', {},
        h('h2', {}, 'One bond'),
        h('p', { class: 'hint' }, 'Click a bond on the picture to pick it.'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'How many bonds between the two atoms' }, ordBtns),
        h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'Twist it'), twistOut),
          h('div', { class: 'range-wrap' }, twistIn, h('div', { class: 'range-ends' }, h('span', {}, 'flat'), h('span', {}, 'quarter turn')))),
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
        h('p', { class: 'hint' }, 'Hydrogen, carbon, nitrogen and oxygen are about 96% of your mass. The one with four hands is the one that gets to be the backbone.')));

      /* ---------------- picking ---------------- */
      function toScreen(p, cw, ch) {
        return { x: cw / 2 + p.x * S.k, y: ch / 2 + p.y * S.k };
      }
      stage.canvas.addEventListener('pointerdown', (e) => {
        const r = stage.canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        S.hint = false;
        for (const hit of S.hits) if (Math.hypot(hit.x - mx, hit.y - my) < hit.r + 8) { grow(hit.i, hit.ang); return; }
        for (const hit of S.bhits) if (Math.hypot(hit.x - mx, hit.y - my) < 18) { S.sel = hit.bi; S.twist = 0; twistIn.value = '0'; twistOut.textContent = '0°'; say(); return; }
      });
      stage.canvas.addEventListener('pointermove', (e) => {
        const r = stage.canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        const over = S.hits.some((hit) => Math.hypot(hit.x - mx, hit.y - my) < hit.r + 8) || S.bhits.some((hit) => Math.hypot(hit.x - mx, hit.y - my) < 18);
        stage.canvas.style.cursor = over ? 'pointer' : 'default';
      });
      stage.canvas.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { const sp = spare(S.atoms.length - 1); if (sp.length) { grow(S.atoms.length - 1, sp[0]); e.preventDefault(); } }
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
        ordBtns.forEach((btn, i) => btn.setAttribute('aria-pressed', String(!!b && b.order === i + 1)));
        ordBtns.forEach((btn) => { btn.disabled = !b; });
        twistIn.disabled = !b || b.order > 1;
        twistNote.textContent = !b
          ? 'Nothing picked. Click a bond on the picture.'
          : b.order === 1
            ? 'A single bond turns freely. That is why a chain is floppy and a fat can flop into any shape it likes.'
            : b.order === 2
              ? 'A double bond will not turn. Both ends are stuck in one plane — so this molecule now has a shape, and the only way to change it is to break the bond.'
              : 'A triple bond will not turn either, and it has pulled the two atoms into a straight line with one hand each left over.';
        const sh = shape();
        statusP.textContent = n === 1
          ? S.el + ' on its own, holding ' + free(0) + ' hydrogens. Click one of them.'
          : 'This is ' + sh + '. ' + (S.ring
            ? 'A ring needs an atom that can hold two neighbours and still carry something. Rings are everywhere in you: every sugar is one, and so is every base in your DNA.'
            : sh === 'a branched chain'
              ? 'Count the hydrogens, then build the straight version and count again. Same formula, different molecule — which is the next instrument along.'
              : 'Keep going, or bend a branch out of a middle atom.');
      }

      /* ---------------- drawing ---------------- */
      function frame() {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        const pos = placed();
        let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
        pos.forEach((p) => { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y); });
        // the spare hands stick out a bond-length further, and a one-atom
        // molecule should still fill the frame rather than sit in it like a full stop
        const spanX = (maxx - minx) + LEN * 2.4, spanY = (maxy - miny) + LEN * 2.4;
        S.k = clamp(Math.min(cw / spanX, (ch - 36) / spanY), 0.3, 2.3);
        const cx = cw / 2 - ((minx + maxx) / 2) * S.k, cy = ch / 2 - ((miny + maxy) / 2) * S.k;
        const R = LEN * S.k * 0.3, RH = R * 0.52;
        const sx = (p) => cx + p.x * S.k, sy = (p) => cy + p.y * S.k;
        const depth = (i) => clamp(1 - Math.abs(pos[i].z) / (LEN * 1.3), 0.45, 1);

        S.hits = []; S.bhits = [];

        // bonds first, so the spheres sit on top of them
        S.bonds.forEach((b, bi) => {
          const picked = bi === S.sel;
          const d = Math.min(depth(b.a), depth(b.b));
          O.bond(ctx, sx(pos[b.a]), sy(pos[b.a]), sx(pos[b.b]), sy(pos[b.b]), {
            order: b.order, width: R * 0.46 * d,
            color: picked ? pal.ui : BL.alpha(pal.fg, 0.28 + 0.5 * d),
          });
          const mx = (sx(pos[b.a]) + sx(pos[b.b])) / 2, my = (sy(pos[b.a]) + sy(pos[b.b])) / 2;
          S.bhits.push({ x: mx, y: my, bi });
          if (picked) {
            ctx.lineWidth = 2.5; ctx.strokeStyle = pal.ui;
            ctx.beginPath(); ctx.arc(mx, my, R * 0.8, 0, TAU); ctx.stroke();
          }
        });

        // spare hands, as hydrogens you can click
        S.atoms.forEach((_, i) => {
          const sp = spare(i);
          sp.forEach((ang) => {
            const hx = sx(pos[i]) + Math.cos(ang) * LEN * S.k * 0.66, hy = sy(pos[i]) + Math.sin(ang) * LEN * S.k * 0.66;
            O.bond(ctx, sx(pos[i]), sy(pos[i]), hx, hy, { width: R * 0.28, alpha: 0.3 });
            O.atom(ctx, hx, hy, RH, 'H', { label: RH >= 9 });
            if (!S.ring && S.atoms.length < 14) S.hits.push({ x: hx, y: hy, r: RH, i, ang });
          });
        });

        // the heavy atoms, far ones first
        const order = pos.map((_, i) => i).sort((a, b) => pos[a].z - pos[b].z);
        order.forEach((i) => {
          const d = depth(i);
          O.atom(ctx, sx(pos[i]), sy(pos[i]), R * (0.78 + 0.22 * d), S.el, { color: BL.mix(pal.el[S.el] || pal.eC, pal.bg, 1 - d) });
        });

        if (S.hint && !BL.reduced) {
          const t = (performance.now() / 600) % TAU;
          const hit = S.hits[0];
          if (hit) {
            ctx.lineWidth = 2.5; ctx.strokeStyle = BL.alpha(pal.ui, 0.5 + 0.4 * Math.sin(t));
            ctx.beginPath(); ctx.arc(hit.x, hit.y, RH + 8 + 3 * Math.sin(t), 0, TAU); ctx.stroke();
          }
          BL.label(ctx, 'click a hydrogen to grow the chain', cw / 2, 24, { font: BL.font(700, 14), border: pal.ui });
        }
        if (S.sel >= 0 && S.twist > 0.05) {
          BL.label(ctx, 'twisted ' + Math.round((S.twist * 180) / Math.PI) + '°', cw / 2, ch - 20, { font: BL.font(700, 14), border: pal.ui });
        }
      }

      reset('C');
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
