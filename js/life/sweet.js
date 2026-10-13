/* Sweet: why you can eat a potato and not a tree.

   Starch and cellulose are both long chains of glucose. Not similar sugars —
   the same sugar, the same number of them, joined by the same reaction. The
   only difference is how each ring is turned when it joins the next one.

   Every ring the same way up, and the chain curls into a loose coil. That is
   starch, and the enzyme in your spit is shaped for exactly that join, so you
   take it apart and live on it. Every other ring flipped over, and the chain
   runs dead straight. That is cellulose. Your enzyme has the wrong shape for
   that join and cannot get hold of it, so the most common organic molecule on
   the planet goes straight through you.

   Nothing was added. One ring was turned over. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;
  const TAU = Math.PI * 2;

  const FORMS = [
    { id: 'starch', name: 'Starch', flip: false, branch: false, amino: false,
      who: 'what plants put their spare glucose into — a potato, a grain of rice, a slice of bread',
      cut: true, says: 'A loose coil, because every ring joins on the same way up. Your spit starts taking this apart before you have swallowed it, which is why bread turns sweet if you hold it in your mouth.' },
    { id: 'glycogen', name: 'Glycogen', flip: false, branch: true, amino: false,
      who: 'what animals put their spare glucose into — your liver and muscles are holding some right now',
      cut: true, says: 'The same coil, but branched. Branches mean loose ends, and an enzyme can only start at an end, so a branched store can be unpacked far faster than a straight one. An animal that needs to run needs that.' },
    { id: 'cellulose', name: 'Cellulose', flip: true, branch: false, amino: false,
      who: 'plant cell walls — wood, cotton, celery strings, paper',
      cut: false, says: 'Dead straight, because every other ring is flipped over. Straight chains lie against each other and hydrogen-bond all the way down, which is why a tree can stand up. Your enzymes have the wrong shape for this join.' },
    { id: 'chitin', name: 'Chitin', flip: true, branch: false, amino: true,
      who: 'beetle shells, crab shells, and the walls of every fungus',
      cut: false, says: 'Cellulose with a nitrogen group bolted onto every ring. Same straight chains, same stacking, a bit tougher — and it is the second most common organic molecule there is.' },
  ];

  const STEPS = [
    { id: 'shape', text: 'Link the rings one way, then flip every other one.',
      how: 'Switch between “all the same way up” and “every other one flipped” and watch the chain.',
      ask: 'same sugar, same number, only the join turned. Does the shape change?',
      opts: ['Barely', 'Completely'], right: 1 },
    { id: 'cutA', text: 'Drop a gut enzyme on the coiled one.',
      how: 'With starch on screen, press “Drop in a gut enzyme”.',
      ask: 'will it cut?',
      opts: ['Yes', 'No'], right: 0 },
    { id: 'cutB', text: 'Drop the same enzyme on the straight one.',
      how: 'Switch to cellulose and press the same button.',
      ask: 'the same enzyme, on a chain of the same sugar —',
      opts: ['cuts it just the same', 'cannot get hold of it at all'], right: 1 },
    { id: 'ends', text: 'Count the loose ends on a branched chain and on a straight one.',
      how: 'Compare starch with glycogen. The readout counts the ends for you.',
      ask: 'an enzyme can only start at an end. Which store gives glucose back faster?',
      opts: ['The branched one', 'The straight one', 'No difference'], right: 0 },
    { id: 'stack', text: 'Stack three cellulose chains side by side.',
      how: 'On cellulose, press “Stack three of them”.',
      ask: 'what holds the stack together?',
      opts: ['Proper bonds between the chains', 'Hydrogen bonds between the chains', 'Nothing — they just lie there'], right: 1 },
    { id: 'store', text: 'Find the one you are carrying around right now.',
      how: 'Read the “who makes it” line on each of the four.',
      ask: 'animals store spare glucose as —',
      opts: ['Starch', 'Glycogen', 'Cellulose'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g fill="none" stroke="var(--t-dipole)" stroke-width="4">' +
    '<path d="M22 44 l16-9 16 9 0 18 -16 9 -16-9z"/><path d="M62 44 l16-9 16 9 0 18 -16 9 -16-9z"/>' +
    '<path d="M102 44 l16-9 16 9 0 18 -16 9 -16-9z"/><path d="M142 44 l16-9 16 9 0 18 -16 9 -16-9z"/></g>' +
    '<path d="M24 92 C56 70 72 110 104 92 C136 74 150 108 178 92" fill="none" stroke="var(--electron)" stroke-width="5" stroke-linecap="round"/></svg>';

  BL.register({
    id: 'sweet', field: 'four', order: 1, name: 'Sweet',
    tagline: 'Turn one ring over and a potato becomes a tree.',
    lede: 'A chain of glucose rings. One switch decides whether each ring joins the next the same way up or flipped over — and that single switch decides whether the chain coils or runs straight, whether it stacks, and whether you can digest it.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = { f: 0, n: 14, stack: false, enz: 0, cut: 0, t: 0, hint: true, tried: new Set() };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A chain of sugar rings. Linked one way it curls into a coil; linked the other way it runs straight. An enzyme can be dropped in to try to cut it.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const form = () => FORMS[S.f];

      /* Where each ring sits. All the same way up and the chain turns a little
         at every join, so it coils. Every other one flipped and the turns
         cancel, so it runs straight. */
      function layout() {
        const f = form(), pts = [];
        let x = 0, y = 0, a = 0;
        for (let i = 0; i < S.n; i++) {
          pts.push({ x, y, a, flip: f.flip && i % 2 === 1, branch: false });
          a += f.flip ? 0 : 0.42;
          x += Math.cos(a) * 1.0;
          y += Math.sin(a) * 1.0;
        }
        if (f.branch) {
          for (let i = 3; i < S.n - 2; i += 5) {
            let bx = pts[i].x, by = pts[i].y, ba = pts[i].a - 1.25;
            for (let k = 0; k < 4; k++) {
              bx += Math.cos(ba); by += Math.sin(ba); ba += 0.42;
              pts.push({ x: bx, y: by, a: ba, flip: false, branch: true, from: k === 0 ? i : pts.length - 1 });
            }
          }
        }
        return pts;
      }
      const ends = () => (form().branch ? 1 + Math.floor(Math.max(0, S.n - 5) / 5) + 1 : 2);

      /* ---------------- dock ---------------- */
      const formBtns = FORMS.map((f, i) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(S.f === i),
        onclick: () => { S.f = i; S.cut = 0; S.enz = 0; S.hint = false; formBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i))); say(); },
      }, f.name));
      dock.appendChild(h('section', {},
        h('h2', {}, 'Which one'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Which polysaccharide' }, formBtns),
        h('p', { class: 'hint' }, 'All four are chains of the same sugar. Two of them you can eat.')));

      const joinBtns = [
        h('button', { type: 'button', class: 'chip', onclick: () => pickJoin(false) }, 'All the same way up'),
        h('button', { type: 'button', class: 'chip', onclick: () => pickJoin(true) }, 'Every other one flipped'),
      ];
      function pickJoin(flip) {
        const f = FORMS.findIndex((x) => x.flip === flip && x.branch === form().branch && x.amino === form().amino);
        S.f = f >= 0 ? f : FORMS.findIndex((x) => x.flip === flip);
        S.cut = 0; S.enz = 0; S.hint = false;
        S.tried.add(flip ? 'b' : 'a');
        formBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === S.f)));
        say();
      }
      const nOut = h('output', { class: 'val' });
      const nIn = h('input', { type: 'range', min: '6', max: '30', step: '1', value: '14', 'aria-label': 'How many rings' });
      nIn.addEventListener('input', () => { S.n = parseFloat(nIn.value); nOut.textContent = S.n + ' rings'; S.hint = false; say(); });
      nOut.textContent = '14 rings';
      dock.appendChild(h('section', {},
        h('h2', {}, 'How the rings join'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Which way each ring joins the next' }, joinBtns),
        h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'How long'), nOut),
          h('div', { class: 'range-wrap' }, nIn, h('div', { class: 'range-ends' }, h('span', {}, 'short'), h('span', {}, 'long')))),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action', onclick: () => { S.enz = 1; S.hint = false; say(); } }, 'Drop in a gut enzyme'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => { S.stack = !S.stack; S.hint = false; say(); } }, 'Stack three of them'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => { S.cut = 0; S.enz = 0; say(); } }, 'Fresh chain'))));

      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'sweet', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const readout = h('div', { class: 'readout' });
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const facts = h('div', { class: 'facts' });
      aux.appendChild(h('section', { class: 'panel' }, readout, statusP, facts));

      const cmp = h('div', { class: 'cmp' });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'All four, side by side'), cmp,
        h('p', { class: 'hint' }, 'One molecule, four jobs, and the difference between any two of them is which way up a ring went in. A cow gets at cellulose, by the way — not with its own enzymes, but by keeping a tankful of microbes that have the right ones.')));

      function say() {
        const f = form();
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, f.name),
          h('span', { class: 'zone' }, f.flip ? 'every other ring flipped' : 'every ring the same way up'),
          h('span', { class: 'dim' }, S.n + ' rings · ' + ends() + (ends() === 1 ? ' loose end' : ' loose ends')));
        statusP.textContent = f.says;
        facts.textContent = '';
        facts.append(
          h('p', { class: 'fact' }, h('b', {}, 'Where you find it. '), f.who),
          h('p', { class: 'fact' }, h('b', {}, 'Can you digest it? '), f.cut ? 'Yes. Your enzymes are shaped for this join.' : 'No. Your enzymes are the wrong shape for this join, and no amount of chewing changes that.'),
          h('p', { class: 'fact' }, h('b', {}, 'Loose ends. '), ends() + ' — and an enzyme can only start at an end, so this is what decides how fast the store can be unpacked.'),
          h('p', { class: 'fact' }, h('b', {}, 'Glucose let go so far. '), Math.floor(S.cut) + ' of ' + S.n));

        cmp.textContent = '';
        FORMS.forEach((x, i) => {
          cmp.appendChild(h('div', { class: 'cmp-row' + (i === S.f ? ' now' : '') },
            h('b', {}, i === S.f ? '▸' : ''),
            h('div', {}, h('b', {}, x.name), h('span', { class: 'muted' }, (x.flip ? 'flipped joins · straight' : 'same-way joins · coiled') + (x.branch ? ' · branched' : ''))),
            h('span', { class: 'nums' }, x.cut ? 'you can eat it' : 'you cannot')));
        });
        check();
      }

      function check() {
        if (S.tried.size >= 2) steps.done('shape');
        if (S.enz && form().cut && S.cut > 1) steps.done('cutA');
        if (S.enz && !form().cut) steps.done('cutB');
        if (FORMS[S.f].branch) steps.done('ends');
        if (S.stack && form().flip) steps.done('stack');
        if (S.f === 1) steps.done('store');
      }

      /* ---------------- drawing ---------------- */
      let lastSay = 0;
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        S.t += dt;
        const f = form();
        if (S.enz && f.cut && S.cut < S.n - 1) S.cut += dt * (0.5 + ends() * 0.45);
        if (performance.now() - lastSay > 250) { lastSay = performance.now(); say(); }
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        const pts = layout();
        let lo = 1e9, hi = -1e9, lo2 = 1e9, hi2 = -1e9;
        pts.forEach((p) => { lo = Math.min(lo, p.x); hi = Math.max(hi, p.x); lo2 = Math.min(lo2, p.y); hi2 = Math.max(hi2, p.y); });
        const rows = S.stack && f.flip ? 3 : 1;
        const u = clamp(Math.min((cw - 60) / Math.max(3, hi - lo + 1.4), (ch - 80) / Math.max(2.2, (hi2 - lo2 + 1.6) * rows)), 8, 40);
        const ox = cw / 2 - ((lo + hi) / 2) * u;
        const oy0 = ch / 2 - ((lo2 + hi2) / 2) * u - (rows - 1) * u * 1.3 / 2;

        const gone = Math.floor(S.cut);
        for (let row = 0; row < rows; row++) {
          const oy = oy0 + row * u * 1.35;
          // the links
          pts.forEach((p, i) => {
            if (i === 0) return;
            const prev = p.branch ? pts[p.from] : pts[i - 1];
            if (!prev) return;
            const alive = row > 0 || i >= gone;
            O.bond(ctx, ox + prev.x * u, oy + prev.y * u, ox + p.x * u, oy + p.y * u,
              { width: u * 0.2, color: BL.alpha(pal.ui, alive ? 0.9 : 0.12) });
          });
          // the rings
          pts.forEach((p, i) => {
            const loose = row === 0 && i < gone;
            const x = ox + p.x * u + (loose ? Math.sin(S.t * 1.5 + i) * u * 0.5 : 0);
            const y = oy + p.y * u + (loose ? (0.8 + (gone - i) * 0.12) * u : 0);
            const r = u * 0.42;
            const hex = O.ringPts(x, y, r, 6, p.flip ? 0 : -Math.PI / 2);
            ctx.beginPath();
            hex.forEach(([hx, hy], k) => (k ? ctx.lineTo(hx, hy) : ctx.moveTo(hx, hy)));
            ctx.closePath();
            ctx.fillStyle = BL.alpha(f.amino ? pal.eN : pal.tDipole, loose ? 0.12 : (pal.dark ? 0.3 : 0.2));
            ctx.fill();
            ctx.lineWidth = Math.max(1.4, u * 0.08);
            ctx.strokeStyle = BL.alpha(f.amino ? pal.eN : pal.tDipole, loose ? 0.25 : 0.95);
            ctx.stroke();
            if (p.flip && u > 16) {
              ctx.fillStyle = BL.alpha(pal.fg, 0.5); ctx.font = BL.font(700, 11);
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText('↕', x, y);
              ctx.textBaseline = 'alphabetic';
            }
          });
        }
        // what holds a stack together
        if (rows > 1) {
          for (let row = 0; row < rows - 1; row++) {
            const ya = oy0 + row * u * 1.35, yb = oy0 + (row + 1) * u * 1.35;
            pts.forEach((p, i) => {
              if (i % 2) return;
              O.weakBond(ctx, ox + p.x * u, ya + p.y * u + u * 0.42, ox + p.x * u, yb + p.y * u - u * 0.42, { width: Math.max(2, u * 0.1) });
            });
          }
          BL.label(ctx, 'hydrogen bonds, chain to chain — this is what makes wood stiff', cw / 2, ch - 18, { font: BL.font(700, 14), border: pal.tHydrogen });
        }

        // the enzyme, and whether it can get hold
        if (S.enz) {
          const p0 = pts[Math.min(gone, pts.length - 1)];
          const ex = ox + p0.x * u + (f.cut ? 0 : u * 1.2), ey = oy0 + p0.y * u - u * 1.1;
          const face = f.cut ? Math.PI / 2 : Math.PI / 2;
          ctx.beginPath();
          ctx.arc(ex, ey, u * 0.5, face + 0.95, face - 0.95 + TAU);
          ctx.lineTo(ex, ey); ctx.closePath();
          ctx.fillStyle = BL.alpha(f.cut ? pal.ui : pal.pos, 0.9); ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = f.cut ? pal.ui : pal.pos; ctx.lineJoin = 'round'; ctx.stroke();
          BL.label(ctx, f.cut ? 'the notch fits — it is cutting' : 'the notch is the wrong shape — nothing happens',
            cw / 2, 22, { font: BL.font(700, 14), border: f.cut ? pal.ui : pal.pos });
        } else if (S.hint && !BL.reduced) {
          BL.label(ctx, 'flip the joins, then drop an enzyme on it →', cw / 2, 22, { font: BL.font(700, 14), border: pal.ui });
        }
      }

      say();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
