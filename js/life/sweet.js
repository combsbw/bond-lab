/* Sweet: why you can eat a potato and not a tree.

   Starch and cellulose are both long chains of glucose. Not similar sugars —
   the same sugar, the same number of them, joined by the same reaction. The
   only difference is how each ring is turned when it joins the next one.

   Every ring the same way up, and each join turns the chain a little the same
   way, so it winds into a helix — a spring, with a channel down the middle.
   That is starch, and the enzyme in your spit is shaped for exactly that join,
   so you take it apart and live on it. Every other ring flipped over, and the
   turns cancel: the chain runs dead straight and the rings lie flat, a ribbon.
   That is cellulose. Ribbons stack like planks and hold each other by
   hydrogen bonds at every ring along their length; your enzyme has the wrong
   shape for that join and cannot get hold of it, so the most common organic
   molecule on the planet goes straight through you.

   Nothing was added. One ring was turned over — and in three dimensions you
   can see it: turn the helix to look down its barrel, then turn the ribbon
   edge-on and see the sheets. The enzyme is something you carry, not a button:
   drag it along a chain and watch where it works and where it does not. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;
  const K = BL.v3;
  const TAU = Math.PI * 2;
  const RING = 0.42;                  // hexagon circumradius; neighbours sit about 1 apart
  const STEP = 1.04;

  const FORMS = [
    { id: 'starch', name: 'Starch', flip: false, branch: false, amino: false,
      who: 'what plants put their spare glucose into — a potato, a grain of rice, a slice of bread',
      cut: true, says: 'A coil, because every ring joins on the same way up and each join turns the chain a little the same way. It winds into a spring with a channel down the middle. Your spit starts taking this apart before you have swallowed it, which is why bread turns sweet if you hold it in your mouth.' },
    { id: 'glycogen', name: 'Glycogen', flip: false, branch: true, amino: false,
      who: 'what animals put their spare glucose into — your liver and muscles are holding some right now',
      cut: true, says: 'The same coil, but branched. Branches mean loose ends, and an enzyme can only start at an end, so a branched store can be unpacked far faster than a straight one. An animal that needs to run needs that.' },
    { id: 'cellulose', name: 'Cellulose', flip: true, branch: false, amino: false,
      who: 'plant cell walls — wood, cotton, celery strings, paper',
      cut: false, says: 'Dead straight and flat, because every other ring is flipped over and the turns cancel. Flat ribbons lie against each other and hydrogen-bond all the way down, which is why a tree can stand up. Your enzymes have the wrong shape for this join.' },
    { id: 'chitin', name: 'Chitin', flip: true, branch: false, amino: true,
      who: 'beetle shells, crab shells, and the walls of every fungus',
      cut: false, says: 'Cellulose with a nitrogen group bolted onto every ring. Same flat ribbons, same stacking, a bit tougher — and it is the second most common organic molecule there is.' },
  ];

  const STEPS = [
    { id: 'shape', text: 'Link the rings one way, then flip every other one, and turn each over.',
      how: 'Switch between “all the same way up” and “every other one flipped”. Drag to look along each chain.',
      ask: 'same sugar, same number, only the join turned. Does the shape change?',
      opts: ['Barely', 'Completely'], right: 1 },
    { id: 'cutA', text: 'Carry the gut enzyme to the coiled one and let it work.',
      how: 'With starch on screen, press “Fetch the gut enzyme”, then drag it by hand along the chain.',
      ask: 'will it cut?',
      opts: ['Yes', 'No'], right: 0 },
    { id: 'cutB', text: 'Carry the same enzyme to the straight one.',
      how: 'Switch to cellulose, fetch the enzyme and hold it against the ribbon.',
      ask: 'the same enzyme, on a chain of the same sugar —',
      opts: ['cuts it just the same', 'cannot get hold of it at all'], right: 1 },
    { id: 'ends', text: 'Count the loose ends on a branched chain and on a straight one.',
      how: 'Compare starch with glycogen. The readout counts the ends for you, and the enzyme goes to them first.',
      ask: 'an enzyme can only start at an end. Which store gives glucose back faster?',
      opts: ['The branched one', 'The straight one', 'No difference'], right: 0 },
    { id: 'stack', text: 'Stack three cellulose ribbons and turn them edge-on.',
      how: 'On cellulose, press “Stack three of them”, then drag the picture until you are looking along the ribbons.',
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
    lede: 'A chain of glucose rings, in three dimensions — drag to turn it. One switch decides whether each ring joins the next the same way up or flipped over: a coil or a flat ribbon, a store or a wall. Then fetch the gut enzyme, carry it along the chain yourself, and see which one it can get hold of.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        f: 0, n: 18, stack: false, tried: new Set(), hint: true, t: 0,
        E: null, held: false, auto: false, bounce: 0, bounceMax: 0,   // the enzyme: where it is, whether you hold it
        rel: new Map(),                                                // rings that have been cut loose, and when
        rings: [], hits: [],
      };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A chain of sugar rings in three dimensions. Linked one way it winds into a helix; linked the other way it lies flat as a ribbon. An enzyme can be fetched and carried along the chain by hand to see whether it can cut.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const form = () => FORMS[S.f];

      /* ---------------- the chain, in space ---------------- */
      /* Rings are placed along a helix about the x axis (starch, glycogen) or
         in a flat line (cellulose, chitin). Ring i has a centre, a normal, and
         an in-plane axis that says which way its oxygen points; flipping a ring
         is turning that axis the other way. */
      function layout() {
        const f = form(), out = [];
        const sheets = S.stack && f.flip ? [-1.35, 0, 1.35] : [0];
        sheets.forEach((z0, si) => {
          for (let i = 0; i < S.n; i++) {
            if (f.flip) {
              const ring = { c: K.v(i * STEP - S.n * STEP / 2, 0, z0), nrm: K.v(0, 0, 1), u: K.v(0, i % 2 ? -1 : 1, 0), i, sheet: si, prev: i ? out.length - 1 : -1, branch: false };
              out.push(ring);
            } else {
              /* Tiles laid on the surface of a barrel: each ring faces outward,
                 six to a turn, and the barrel is the channel down the middle of
                 starch. Looking along the axis you see a hexagon of tiles. */
              const th = i * (Math.PI / 3), Rh = 1.04, hh = 0.4;
              const radial = K.v(0, Math.cos(th), Math.sin(th));
              const c = K.v(i * hh - S.n * hh / 2, Rh * Math.cos(th), Rh * Math.sin(th));
              out.push({ c, nrm: radial, u: K.v(1, 0, 0), i, sheet: 0, prev: i ? out.length - 1 : -1, branch: false });
            }
          }
        });
        if (f.branch) {
          const main = out.slice();
          for (let i = 3; i < S.n - 2; i += 5) {
            const base = main[i];
            const radial = K.unit(base.nrm);            // outward from the barrel
            let prev = i, pos = base.c, dir = K.unit(K.add(K.mul(radial, 1), K.v(0.2, 0, 0)));
            for (let k = 0; k < 4; k++) {
              pos = K.add(pos, K.mul(dir, STEP));
              dir = K.unit(K.add(dir, K.mul(K.perp(dir), 0.16)));
              out.push({ c: pos, nrm: K.unit(K.cross(dir, K.perp(dir))), u: K.perp(dir), i: S.n + out.length, sheet: 0, prev: k ? out.length - 1 : prev, branch: true, tip: k === 3 });
            }
          }
        }
        return out;
      }
      /* Where an enzyme can start. A chain has one end and a branched chain has
         many — which is the whole reason a branched store unpacks faster. */
      const endRings = (rs) => {
        const f = form();
        if (f.branch) return rs.map((r, k) => (r.tip || (!r.branch && r.i === 0)) ? k : -1).filter((k) => k >= 0);
        return rs.map((r, k) => (r.sheet === 0 && r.i === 0 ? k : -1)).filter((k) => k >= 0);
      };
      const nEnds = () => (form().branch ? 1 + Math.max(0, Math.floor((S.n - 5) / 5) + 1) : 1) * (S.stack && form().flip ? 3 : 1);

      /* ---------------- dock ---------------- */
      const formBtns = FORMS.map((f, i) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(S.f === i),
        onclick: () => { setForm(i); },
      }, f.name));
      function setForm(i) {
        S.f = i; S.rel.clear(); S.E = null; S.auto = false; S.bounce = 0; S.hint = false;
        if (i !== 2 && i !== 3) S.stack = false;
        formBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
        say();
      }
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
        setForm(f >= 0 ? f : FORMS.findIndex((x) => x.flip === flip));
        S.tried.add(flip ? 'b' : 'a');
        say();
      }
      const nOut = h('output', { class: 'val' });
      const nIn = h('input', { type: 'range', min: '6', max: '30', step: '1', value: '18', 'aria-label': 'How many rings' });
      nIn.addEventListener('input', () => { S.n = parseFloat(nIn.value); nOut.textContent = S.n + ' rings'; S.rel.clear(); S.hint = false; say(); });
      nOut.textContent = '18 rings';
      dock.appendChild(h('section', {},
        h('h2', {}, 'How the rings join'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Which way each ring joins the next' }, joinBtns),
        h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'How long'), nOut),
          h('div', { class: 'range-wrap' }, nIn, h('div', { class: 'range-ends' }, h('span', {}, 'short'), h('span', {}, 'long')))),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action', onclick: () => { fetchEnzyme(); } }, 'Fetch the gut enzyme'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => { S.stack = !S.stack; if (S.stack && !form().flip) setForm(2); S.rel.clear(); S.hint = false; say(); } }, 'Stack three of them'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => { S.rel.clear(); S.E = null; S.auto = false; say(); } }, 'Fresh chain'))));

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
        const loose = S.rel.size;
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, f.name),
          h('span', { class: 'zone' }, f.flip ? 'every other ring flipped · a flat ribbon' : 'every ring the same way up · a coil'),
          h('span', { class: 'dim' }, S.n + ' rings · ' + nEnds() + (nEnds() === 1 ? ' loose end' : ' loose ends')));
        statusP.textContent = f.says;
        facts.textContent = '';
        facts.append(
          h('p', { class: 'fact' }, h('b', {}, 'Where you find it. '), f.who),
          h('p', { class: 'fact' }, h('b', {}, 'Can you digest it? '), f.cut ? 'Yes. Your enzymes are shaped for this join.' : 'No. Your enzymes are the wrong shape for this join, and no amount of chewing changes that.'),
          h('p', { class: 'fact' }, h('b', {}, 'Loose ends. '), nEnds() + ' — and an enzyme can only start at an end, so this is what decides how fast the store can be unpacked.'),
          h('p', { class: 'fact' }, h('b', {}, 'Glucose let go so far. '), loose + ' of ' + layout().length));

        cmp.textContent = '';
        FORMS.forEach((x, i) => {
          cmp.appendChild(h('div', { class: 'cmp-row' + (i === S.f ? ' now' : '') },
            h('b', {}, i === S.f ? '▸' : ''),
            h('div', {}, h('b', {}, x.name), h('span', { class: 'muted' }, (x.flip ? 'flipped joins · flat ribbon' : 'same-way joins · coil') + (x.branch ? ' · branched' : ''))),
            h('span', { class: 'nums' }, x.cut ? 'you can eat it' : 'you cannot')));
        });
        check();
      }

      function check() {
        if (S.tried.size >= 2) steps.done('shape');
        if (form().cut && S.rel.size > 1) steps.done('cutA');
        if (!form().cut && S.bounceMax > 0.7) steps.done('cutB');
        if (FORMS[S.f].branch) steps.done('ends');
        if (S.stack && form().flip && V.turned > 0.9) steps.done('stack');
        if (S.f === 1) steps.done('store');
      }

      /* ---------------- the enzyme ---------------- */
      function fetchEnzyme() {
        const rs = layout();
        const ends = endRings(rs);
        const r0 = rs[ends[0] != null ? ends[0] : 0];
        S.E = K.add(r0.c, K.v(-0.6, -2.4, 0.6));
        S.auto = true; S.bounce = 0; S.hint = false;
      }
      const ringAt = (pt) => {
        let best = -1, bd = 1e9;
        S.hits.forEach((hh) => { const d = Math.hypot(hh.x - pt.x, hh.y - pt.y); if (d < hh.r + 4 && d < bd) { bd = d; best = hh.k; } });
        return best;
      };

      const V = BL.view3d(stage.canvas, {
        yaw: 0.45, pitch: 0.32, auto: 0.28,
        onturn: () => { S.hint = false; check(); },
        hover: (pt) => { const over = pt && S.E && Math.hypot(S.Eq.x - pt.x, S.Eq.y - pt.y) < S.Eq.r + 8; stage.canvas.style.cursor = over ? 'grab' : ''; },
        pick: (pt) => {
          if (!S.E || !S.Eq) return null;
          if (Math.hypot(S.Eq.x - pt.x, S.Eq.y - pt.y) > S.Eq.r + 10) return null;
          S.held = true; S.auto = false; S.hint = false;
          return { z: V.project(S.E).z };
        },
        drag: (c, pt) => { S.E = V.unproject(pt.x, pt.y, c.z); },
        end: () => { S.held = false; },
      });
      S.Eq = null;

      /* ---------------- drawing ---------------- */
      let lastSay = 0, cutT = 0;
      function hexPts(r) {
        const v = K.cross(r.nrm, r.u);
        const pts = [];
        for (let k = 0; k < 6; k++) {
          const a = (k * TAU) / 6;
          pts.push(K.add(r.c, K.add(K.mul(r.u, Math.cos(a) * RING), K.mul(v, Math.sin(a) * RING))));
        }
        return pts;
      }

      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        S.t += dt;
        V.step(dt);
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        const f = form();
        const rs = layout();
        const col = f.amino ? pal.eN : pal.tDipole;

        let lo = { x: 1e9, y: 1e9, z: 1e9 }, hi = { x: -1e9, y: -1e9, z: -1e9 };
        rs.forEach((r) => ['x', 'y', 'z'].forEach((a) => { lo[a] = Math.min(lo[a], r.c[a]); hi[a] = Math.max(hi[a], r.c[a]); }));
        const mid = { x: (lo.x + hi.x) / 2, y: (lo.y + hi.y) / 2, z: (lo.z + hi.z) / 2 };
        const rad = Math.max(1.9, Math.hypot(hi.x - lo.x, hi.y - lo.y, hi.z - lo.z) / 2 + 0.5);
        V.frame(cw, ch, rad, mid);
        const sc = V.scale;

        // the enzyme: where it wants to be, what it is touching, whether it can cut
        let touching = -1, td = 1e9;
        if (S.E) {
          rs.forEach((r, k) => { if (S.rel.has(k)) return; const d = K.len(K.sub(r.c, S.E)); if (d < td) { td = d; touching = k; } });
          if (S.auto) {
            // go to the next end that is still there, and work inward
            const ends = endRings(rs).filter((k) => !S.rel.has(k));
            let goal = null;
            if (ends.length) {
              const near = ends.reduce((b, k) => (K.len(K.sub(rs[k].c, S.E)) < K.len(K.sub(rs[b].c, S.E)) ? k : b), ends[0]);
              goal = rs[near].c;
            } else {
              // no ends left: take whatever ring is closest to a gap
              const k2 = rs.findIndex((r, k) => !S.rel.has(k) && (r.prev < 0 || S.rel.has(r.prev)));
              if (k2 >= 0) goal = rs[k2].c;
            }
            if (goal) {
              const to = K.sub(goal, K.add(S.E, K.v(0, 0, 0)));
              const L = K.len(to) || 1;
              const sp = Math.min(L, dt * 3.2);
              S.E = K.add(S.E, K.mul(to, sp / L));
              S.E = K.add(S.E, K.v(0, -0.0, 0));
            }
          }
          if (td < 0.95) {
            if (f.cut) {
              cutT += dt * (S.auto ? 1 : 1.3);
              // only a ring with a free end — or one next to a gap — can come away
              const r = rs[touching];
              const freeEnd = r.prev < 0 || S.rel.has(r.prev) || r.tip || rs.every((q) => q.prev !== touching) || rs.some((q, kk) => q.prev === touching && S.rel.has(kk));
              if (freeEnd && cutT > 0.55) { cutT = 0; S.rel.set(touching, S.t); }
            } else {
              S.bounce = Math.min(2, S.bounce + dt); S.bounceMax = Math.max(S.bounceMax, S.bounce);
            }
          } else S.bounce = Math.max(0, S.bounce - dt * 2);
        }

        const P = rs.map((r) => V.project(r.c));
        S.hits = [];

        // links between neighbours
        rs.forEach((r, k) => {
          if (r.prev < 0 || S.rel.has(k) || S.rel.has(r.prev)) return;
          const a = P[r.prev], b = P[k];
          V.add((a.z + b.z) / 2 - 0.02, () => BL.stick3(ctx, a, b, sc * 0.075, { color: BL.alpha(pal.ui, 0.45 + 0.5 * Math.min(a.d, b.d)), ta: sc * RING * 0.5, tb: sc * RING * 0.5 }));
        });

        // the rings, each as a real hexagon in its own plane
        rs.forEach((r, k) => {
          const loose = S.rel.has(k);
          const age = loose ? S.t - S.rel.get(k) : 0;
          const drift = loose ? K.v(Math.sin(k * 2.3 + age) * 0.25, 0.55 + age * 0.9, Math.cos(k * 1.7 + age) * 0.25) : K.v(0, 0, 0);
          const rr = loose ? { c: K.add(r.c, drift), nrm: r.nrm, u: K.unit(K.add(r.u, K.v(0.35 * Math.sin(age * 2 + k), 0, 0.35 * Math.cos(age * 2 + k)))) } : r;
          const pts = hexPts(rr).map((p) => V.project(p));
          const qc = V.project(rr.c);
          if (loose && age > 3.2) return;
          const alpha = loose ? Math.max(0, 1 - age / 3.2) * 0.8 : 1;
          V.add(qc.z, () => {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
            ctx.closePath();
            ctx.fillStyle = BL.alpha(col, (pal.dark ? 0.3 : 0.22) + 0.25 * qc.d);
            ctx.fill();
            ctx.lineWidth = Math.max(1.6, sc * 0.045); ctx.lineJoin = 'round';
            ctx.strokeStyle = BL.alpha(col, 0.5 + 0.5 * qc.d); ctx.stroke();
            // the ring's oxygen sits on one corner: this is the thing that is flipped
            BL.sphere3(ctx, pts[0], sc * 0.1, pal.neg, null);
            if (f.amino) BL.sphere3(ctx, pts[3], sc * 0.085, pal.eN, null);
            ctx.restore();
          });
          if (!loose) S.hits.push({ x: qc.x, y: qc.y, r: sc * RING, k });
        });

        // what holds a stack together: hydrogen bonds from sheet to sheet
        if (S.stack && f.flip) {
          for (let k = 0; k < rs.length; k++) {
            const r = rs[k];
            const up = rs.findIndex((q) => q.sheet === r.sheet + 1 && q.i === r.i);
            if (up < 0 || r.i % 2) continue;
            const a = P[k], b = P[up];
            V.add((a.z + b.z) / 2 - 0.01, () => { ctx.save(); ctx.globalAlpha = 0.45 + 0.5 * Math.min(a.d, b.d); O.weakBond(ctx, a.x, a.y, b.x, b.y, { width: Math.max(2, sc * 0.05) }); ctx.restore(); });
          }
        }

        // the enzyme
        if (S.E) {
          const q = V.project(S.E);
          const R = sc * 0.34;
          S.Eq = { x: q.x, y: q.y, r: R };
          const wrong = !f.cut && td < 1.1;
          const shake = wrong ? Math.sin(S.t * 38) * 3 : 0;
          V.add(q.z + 0.4, () => {
            const e = { x: q.x + shake, y: q.y, z: q.z, d: q.d };
            BL.sphere3(ctx, e, R, wrong ? pal.pos : pal.ui, null, S.held ? { ring: pal.fg } : null);
            // the notch: the shape a bond has to fit into
            ctx.save();
            ctx.fillStyle = pal.panel;
            ctx.beginPath(); ctx.arc(e.x + R * 0.34, e.y - R * 0.12, R * 0.34, 0, TAU); ctx.fill();
            ctx.restore();
          });
        } else S.Eq = null;
        V.flush();

        if (S.E) {
          const wrong = !f.cut && td < 1.1;
          BL.label(ctx, wrong ? 'the notch is the wrong shape — nothing happens' : f.cut && td < 0.95 ? 'the notch fits — it is cutting' : S.held ? 'carrying it' : S.auto ? 'on its way to an end' : 'drag it to a ring',
            cw / 2, 22, { font: BL.font(700, 14), border: wrong ? pal.pos : pal.ui });
        }
        if (S.stack && f.flip) BL.label(ctx, 'hydrogen bonds, ribbon to ribbon — turn it edge-on', cw / 2, ch - 18, { font: BL.font(700, 14), border: pal.tHydrogen });
        V.cue(ctx, pal);
        if (S.hint && !BL.reduced && !S.E) BL.label(ctx, 'drag to turn it · flip the joins · fetch the enzyme →', cw / 2, 22, { font: BL.font(700, 14), border: pal.ui });

        if (performance.now() - lastSay > 300) { lastSay = performance.now(); say(); }
      }

      say();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
