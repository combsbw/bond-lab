/* Rooms: what a membrane buys.

   The chapter's first hook asks it directly: a cell is basically a bag of the
   molecules from Chapter 3, so what does organising them into compartments buy
   that having them loose would not? This is the answer, and nothing in it is
   scripted.

   The cell has to clear away worn-out parts, and the enzymes that do it work
   only in acid (the real ones do: a lysosome runs at about pH 4.5, the rest of
   the cell at about 7). It also has the plans — its DNA — and an acid-loving
   enzyme will digest those just as happily as it digests junk. So:

     - Leave the whole cell neutral and the enzymes are asleep. The plans are
       safe and the junk piles up.
     - Make the whole cell acid and the junk is eaten — and the plans with it.
     - There is no setting of one dial that does both.

   The only way out is to give the acid somewhere to be. Draw a loop around the
   enzymes and a membrane forms there: inside it the acid is kept on, outside it
   stays neutral. Now the junk goes in and is eaten, and the plans, out in the
   neutral cell, are untouched. Pop the room and the acid spills; wall the plans
   in with the enzymes and they are digested. Every one of those is something
   the learner does and watches, not something they are told.

   The model: a particle in a room is at the room's pH and one outside is at the
   cell's. An enzyme digests whatever it touches in proportion to how active it
   is at that pH, a smooth curve that is half on at pH 5.4. Numbers are chosen to
   read well, not measured. It does not model how the acid is made (proton pumps
   spending ATP), how junk is actually taken in (a vesicle fusing), or that a
   real cell has buffers; it is a picture of the one idea, that a membrane lets a
   cell hold two conditions at once. A bacterium has no rooms and does its six
   jobs anyway: it simply has one setting for the whole cell. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const K = BL.cell;

  const ROOM_PH = 4.6, MAX_ROOMS = 4, MAX_JUNK = 12;
  /* how awake an enzyme is at this pH: half on at 5.4, asleep by neutral */
  const act = (pH) => 1 / (1 + Math.exp((pH - 5.4) * 3.2));

  const STEPS = [
    { id: 'neutral', text: 'Leave the cell neutral and watch what the loose enzymes do to the junk.',
      how: 'Do not touch anything for about ten seconds. Watch the grey junk.',
      ask: 'will enzymes loose in a neutral cell clear the junk?',
      opts: ['Yes, slowly', 'No — they need acid to work'], right: 1 },
    { id: 'sour', text: 'Make the whole cell acid.',
      how: 'Slide “How acid is the whole cell” down to very sour and wait.',
      ask: 'if the whole cell turns acid, what happens to the plans — the purple DNA?',
      opts: ['Nothing — the enzymes only go for the junk', 'The plans get digested too'], right: 1 },
    { id: 'room', text: 'Put the cell back to neutral, then draw a room round some enzymes.',
      how: 'Drag across empty space to draw a circle, and let go. A membrane forms round whatever is inside it.',
      ask: 'inside the room the acid is kept on and outside it stays neutral. Are the plans safe now?',
      opts: ['Yes — the acid stays in the room', 'No — the enzymes will get out'], right: 0 },
    { id: 'feed', text: 'Get some junk digested inside the room.',
      how: 'Junk drifts to a room and is taken in by itself. Or pick a piece up and drop it inside.',
      ask: 'with a room built, will the junk be cleared while the rest of the cell stays neutral?',
      opts: ['Yes', 'No'], right: 0 },
    { id: 'pop', text: 'Pop a room.',
      how: 'Tap the wall of a room and watch the purple plans.',
      ask: 'what was keeping the acid away from the plans?',
      opts: ['The membrane', 'The enzymes themselves', 'Nothing — acid stays put on its own'], right: 0 },
    { id: 'plans', text: 'Wall the plans in with the enzymes.',
      how: 'Draw a room round the DNA and wait.',
      ask: 'in an acid room full of enzymes, are the plans safe?',
      opts: ['Yes — it is a room', 'No — the room keeps the acid in, plans and all'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<circle cx="100" cy="62" r="46" fill="none" stroke="var(--fn-struct)" stroke-width="5"/>' +
    '<circle cx="128" cy="48" r="17" fill="var(--fn-store)" opacity=".3" stroke="var(--fn-store)" stroke-width="4"/>' +
    '<g fill="var(--fn-store)"><circle cx="124" cy="46" r="3.5"/><circle cx="132" cy="52" r="3.5"/><circle cx="128" cy="42" r="3.5"/></g>' +
    '<path d="M70 70 q6 -12 12 0 t12 0" fill="none" stroke="var(--fn-genetic)" stroke-width="5" stroke-linecap="round"/></svg>';

  BL.register({
    id: 'rooms', field: 'rule', order: 0, name: 'Rooms',
    tagline: 'A membrane lets a cell keep two conditions at once.',
    lede: 'Enzymes that clear a cell’s junk only work in acid — and they will digest the cell’s DNA just as happily. Try to clear the junk without hurting the plans. Slide the acidity, then drag a circle across empty space to wall some enzymes off.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        ph: 7.2, leak: 0, t: 0, E: [], J: [], D: [], R: [], drops: [], draw: null, hinted: false, neutralT: 0, roomSafeT: 0,
        digestedIn: 0, digestedOut: 0, spawnT: 1, popped: 0, plansHurtInRoom: false, msg: '', msgT: 0, geo: { cx: 0, cy: 0, u: 100 },
      };
      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A cell seen in cross-section, with brown enzymes, grey pieces of junk and a purple strand of DNA. A slider sets how acid the whole cell is. Dragging across empty space draws a circle that becomes a room with its own membrane and its own acid. Enzymes digest whatever they touch in proportion to how acid it is. The controls are in the side panel.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- the world, in cell radii ---------------- */
      function reset() {
        S.E = []; S.J = []; S.D = []; S.R = []; S.drops = []; S.leak = 0; S.t = 0; S.neutralT = 0; S.roomSafeT = 0; S.digestedIn = 0; S.digestedOut = 0; S.draw = null;
        const rnd = K.rng(5);
        [[0.5, 0.34], [0.38, -0.46]].forEach(([cx, cy]) => { for (let i = 0; i < 6; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 0.15; S.E.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, vx: 0, vy: 0, room: -1 }); } });
        for (let i = 0; i < 4; i++) newJunk();
        for (let i = 0; i < 12; i++) { const a = -1.1 + i * 0.28; S.D.push({ x: -0.42 + Math.cos(a) * 0.2 * (1 + 0.15 * Math.sin(i * 2)), y: -0.05 + Math.sin(a) * 0.24, h: 1, room: -1 }); }
        S.hinted = false; S.msg = ''; say('A cell with a pile of junk and a strand of plans. The enzymes are loose, and the cell is neutral.');
      }
      function newJunk() {
        for (let k = 0; k < 30; k++) {
          const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * 0.8, x = Math.cos(a) * d, y = Math.sin(a) * d;
          if (S.R.some((r) => r.alive && Math.hypot(x - r.x, y - r.y) < r.r + 0.08)) continue;
          if (S.D.some((b) => Math.hypot(x - b.x, y - b.y) < 0.16)) continue;
          S.J.push({ x, y, vx: 0, vy: 0, h: 1, room: -1, sh: Math.random() * 6.28 }); return;
        }
      }
      const cytoPH = () => S.ph - S.leak;
      const phOf = (room) => (room >= 0 && S.R[room] && S.R[room].alive ? ROOM_PH : cytoPH());
      const roomAt = (x, y, pad) => S.R.findIndex((r) => r.alive && Math.hypot(x - r.x, y - r.y) < r.r + (pad || 0));

      /* ---------------- dock ---------------- */
      const out = h('output', { class: 'val' }), phIn = h('input', { type: 'range', min: '46', max: '76', step: '1', value: String(S.ph * 10), 'aria-label': 'How acid is the whole cell' });
      const words = () => (S.ph < 5.4 ? 'very sour' : S.ph < 6.4 ? 'sour' : S.ph < 7.0 ? 'a little sour' : 'neutral');
      const setOut = () => { out.textContent = ''; out.append(words(), BL.numv(' pH ' + S.ph.toFixed(1))); };
      phIn.addEventListener('input', () => { S.ph = parseFloat(phIn.value) / 10; S.hinted = true; setOut(); S.msgT = -1e9; });
      setOut();
      dock.appendChild(h('section', {},
        h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'How acid is the whole cell'), out),
          h('div', { class: 'range-wrap' }, phIn, h('div', { class: 'range-ends' }, h('span', {}, 'very sour'), h('span', {}, 'neutral')))),
        h('p', { class: 'hint' }, 'This dial sets the whole cell. A room has its own.')));
      dock.appendChild(h('section', {}, h('h2', {}, 'Build a room'),
        h('p', { class: 'hint' }, 'Drag across empty space to draw a circle, and let go. Tap a room’s wall to pop it. Drag a room to carry it, or a piece of junk to drop it in.'),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action', onclick: () => autoRoom() }, 'Wall off the nearest enzymes'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => { S.ph = 7.2; reset(); sync(); } }, 'Start the cell over'))));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'rooms', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const junkM = BL.meter('Junk piling up'), plansM = BL.meter('The plans (DNA)'), roomsM = BL.meter('Rooms');
      aux.appendChild(h('section', { class: 'panel' }, statusP, h('div', { class: 'meters' }, junkM.el, plansM.el, roomsM.el),
        h('div', { class: 'legend' }, h('span', { class: 'fn-chip', style: '--c: var(--fn-store)' }, 'an enzyme: awake only in acid'), h('span', { class: 'fn-chip', style: '--c: var(--fn-genetic)' }, 'the plans (DNA)'), h('span', {}, 'grey shards: worn-out parts'))));
      const bars = ['animal', 'plant', 'bact'].map((t) => { const m = BL.meter(K.TYPES[t].name); m.set(K.rooms(t).length / 9, K.rooms(t).length ? K.rooms(t).length + ' rooms' : 'none — one room, the whole cell'); return m; });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Who has rooms?'), h('div', { class: 'meters' }, bars.map((m) => m.el)),
        h('p', { class: 'hint' }, 'Eukaryotes — animals, plants, fungi — wall their organelles off with membranes. A bacterium does all six jobs without any, so the whole cell has to run on one setting. That one difference is how the chapter sorts almost everything.')));

      function say(t) { statusP.textContent = t; S.msg = t; S.msgT = S.t; }
      function sync() { phIn.value = String(Math.round(S.ph * 10)); setOut(); }

      /* a room round the densest knot of loose enzymes, for anyone who would rather tap than drag */
      function autoRoom() {
        if (S.R.filter((r) => r.alive).length >= MAX_ROOMS) { say('That is the most rooms this cell can hold. Pop one first.'); return; }
        let best = null, bn = 0;
        S.E.forEach((e) => { if (e.room >= 0) return; const n = S.E.filter((o) => o.room < 0 && Math.hypot(o.x - e.x, o.y - e.y) < 0.26).length; if (n > bn) { bn = n; best = e; } });
        if (!best) { say('Every enzyme is already in a room.'); return; }
        const cs = S.E.filter((o) => o.room < 0 && Math.hypot(o.x - best.x, o.y - best.y) < 0.26);
        const cx = cs.reduce((s, o) => s + o.x, 0) / cs.length, cy = cs.reduce((s, o) => s + o.y, 0) / cs.length;
        makeRoom(cx, cy, Math.max(0.2, ...cs.map((o) => Math.hypot(o.x - cx, o.y - cy) + 0.07)));
      }
      function makeRoom(cx, cy, r) {
        r = clamp(r, 0.13, 0.42);
        if (Math.hypot(cx, cy) + r > 0.97) { say('A room has to fit inside the cell.'); return false; }
        if (S.R.some((o) => o.alive && Math.hypot(o.x - cx, o.y - cy) < o.r + r + 0.02)) { say('Rooms cannot overlap.'); return false; }
        if (S.R.filter((o) => o.alive).length >= MAX_ROOMS) { say('That is the most rooms this cell can hold. Pop one first.'); return false; }
        S.R.push({ x: cx, y: cy, r, alive: true, born: S.t });
        const idx = S.R.length - 1, inside = (o) => Math.hypot(o.x - cx, o.y - cy) < r - 0.015;
        let ne = 0, nj = 0, nd = 0;
        S.E.forEach((o) => { if (o.room < 0 && inside(o)) { o.room = idx; ne++; } });
        S.J.forEach((o) => { if (o.room < 0 && inside(o)) { o.room = idx; nj++; } });
        S.D.forEach((o) => { if (o.room < 0 && inside(o)) { o.room = idx; nd++; } });
        S.hinted = true;
        say(nd ? 'A room — with ' + (nd === S.D.length ? 'the plans' : 'part of the plans') + ' inside it, and the acid switched on. ' : ne ? 'A room, with ' + ne + ' enzyme' + (ne === 1 ? '' : 's') + ' inside it. Inside, the acid is on. Outside, the cell is still ' + words() + '.' : 'A room with nothing in it. Enzymes outside stay loose.');
        return true;
      }
      function pop(j) {
        const r = S.R[j]; if (!r || !r.alive) return;
        r.alive = false;
        [S.E, S.J, S.D].forEach((list) => list.forEach((o) => { if (o.room === j) { o.room = -1; } }));
        S.leak = Math.min(2.6, 7.2 - ROOM_PH - 0.1); S.popped++; steps.done('pop');
        say('Popped. The acid ran out into the cell, and so did everything that was in the room.');
      }

      /* ---------------- pointer ---------------- */
      const toWorld = (p) => ({ x: (p.x - S.geo.cx) / S.geo.u, y: (p.y - S.geo.cy) / S.geo.u });
      BL.drag(stage.canvas, {
        pick: (p) => {
          const w = toWorld(p); if (!S.geo.u || Math.hypot(w.x, w.y) > 1.0) return null;
          // junk first: it is the thing worth carrying
          let best = null, bd = 0.09;
          S.J.forEach((o) => { const d = Math.hypot(o.x - w.x, o.y - w.y); if (d < bd) { bd = d; best = o; } });
          if (best) return { junk: best };
          const j = S.R.findIndex((r) => r.alive && Math.abs(Math.hypot(w.x - r.x, w.y - r.y) - r.r) < 0.07);
          if (j >= 0) return { room: j, x: w.x, y: w.y, moved: 0 };
          if (roomAt(w.x, w.y, 0.02) >= 0) return null;
          return { draw: true, cx: w.x, cy: w.y };
        },
        move: (a, p, start) => {
          const w = toWorld(p); S.hinted = true;
          if (a.junk) { const o = a.junk; o.x = w.x; o.y = w.y; o.vx = o.vy = 0; o.room = roomAt(w.x, w.y, -0.03); return; }
          if (a.room != null) {
            const r = S.R[a.room]; if (!r || !r.alive) return;
            const dx = w.x - a.x, dy = w.y - a.y; a.moved += Math.hypot(dx, dy); a.x = w.x; a.y = w.y;
            if (a.moved < 0.02) return;
            const nx = r.x + dx, ny = r.y + dy;
            if (Math.hypot(nx, ny) + r.r > 0.97 || S.R.some((o, k) => k !== a.room && o.alive && Math.hypot(o.x - nx, o.y - ny) < o.r + r.r + 0.01)) return;
            r.x = nx; r.y = ny;
            [S.E, S.J, S.D].forEach((list) => list.forEach((o) => { if (o.room === a.room) { o.x += dx; o.y += dy; } }));
            return;
          }
          if (a.draw) S.draw = { cx: a.cx, cy: a.cy, r: Math.hypot(w.x - a.cx, w.y - a.cy) };
        },
        end: (a, p) => {
          if (a.junk) { a.junk.room = roomAt(a.junk.x, a.junk.y, -0.03); return; }
          if (a.room != null) { if (a.moved < 0.03) pop(a.room); return; }
          if (a.draw && S.draw) { const d = S.draw; S.draw = null; if (d.r >= 0.12) makeRoom(d.cx, d.cy, d.r); }
        },
      });

      /* ---------------- the step ---------------- */
      function step(dt) {
        S.t += dt; S.leak = Math.max(0, S.leak - dt * 0.42 * Math.max(0.4, S.leak / 2));
        S.spawnT -= dt; if (S.spawnT <= 0) { S.spawnT = 3.2; if (S.J.length < MAX_JUNK) newJunk(); }
        const sq = Math.sqrt(dt);
        const jiggle = (o, s) => { o.vx += BL.randn() * s * sq; o.vy += BL.randn() * s * sq; o.vx *= 1 - 2.2 * dt; o.vy *= 1 - 2.2 * dt; o.x += o.vx * dt; o.y += o.vy * dt; };
        const confine = (o, pr) => {
          if (o.room >= 0 && S.R[o.room] && S.R[o.room].alive) {
            const r = S.R[o.room], d = Math.hypot(o.x - r.x, o.y - r.y), lim = r.r - pr;
            if (d > lim) { const nx = (o.x - r.x) / d, ny = (o.y - r.y) / d; o.x = r.x + nx * lim; o.y = r.y + ny * lim; const vn = o.vx * nx + o.vy * ny; if (vn > 0) { o.vx -= 2 * vn * nx; o.vy -= 2 * vn * ny; } }
            return;
          }
          const d = Math.hypot(o.x, o.y), lim = 0.94 - pr;
          if (d > lim) { o.x *= lim / d; o.y *= lim / d; o.vx *= -0.5; o.vy *= -0.5; }
          S.R.forEach((r) => {
            if (!r.alive) return;
            const dx = o.x - r.x, dy = o.y - r.y, dd = Math.hypot(dx, dy) || 1e-6, lm = r.r + pr;
            if (dd < lm) { o.x = r.x + dx / dd * lm; o.y = r.y + dy / dd * lm; const vn = (o.vx * dx + o.vy * dy) / dd; if (vn < 0) { o.vx -= 2 * vn * dx / dd; o.vy -= 2 * vn * dy / dd; } }
          });
        };
        S.E.forEach((o) => { jiggle(o, 0.9); confine(o, 0.03); });
        S.J.forEach((o) => {
          jiggle(o, 0.35);
          // junk near a room is taken in, the way a vesicle fuses with it
          if (o.room < 0) S.R.forEach((r, j) => {
            if (!r.alive) return; const dx = r.x - o.x, dy = r.y - o.y, d = Math.hypot(dx, dy);
            if (d < r.r + 0.32 && d > r.r - 0.02) { o.vx += dx / d * 0.9 * dt; o.vy += dy / d * 0.9 * dt; }
            if (d < r.r - 0.02) o.room = j;
          });
          confine(o, 0.04);
        });

        // digestion: an enzyme works on whatever it touches in the same room, in proportion to how awake it is there
        S.E.forEach((e) => {
          const a = act(phOf(e.room)); if (a < 0.02) return;
          e._a = a;
          for (let i = S.J.length - 1; i >= 0; i--) {
            const o = S.J[i]; if (o.room !== e.room || Math.hypot(o.x - e.x, o.y - e.y) > 0.1) continue;
            o.h -= a * dt * 0.7;
            if (o.h <= 0) {
              if (o.room >= 0) { S.digestedIn++; } else S.digestedOut++;
              for (let k = 0; k < 4; k++) S.drops.push({ x: o.x, y: o.y, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, life: 1 });
              S.J.splice(i, 1);
            }
          }
          S.D.forEach((b) => {
            if (b.room !== e.room || b.h <= 0 || Math.hypot(b.x - e.x, b.y - e.y) > 0.1) return;
            b.h = Math.max(0, b.h - a * dt * 0.3);
            if (b.room >= 0) S.plansHurtInRoom = true;
          });
        });
        S.E.forEach((e) => { if (e._a) e._a *= 0.9; });
        S.drops.forEach((d) => { d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt * 0.9; });
        S.drops = S.drops.filter((d) => d.life > 0);

        // goals
        const plans = S.D.reduce((s, b) => s + b.h, 0) / S.D.length;
        if (S.ph >= 6.8 && S.R.every((r) => !r.alive) && S.leak < 0.05 && S.J.length >= 6) { S.neutralT += dt; if (S.neutralT > 10) steps.done('neutral'); } else if (S.ph < 6.8) S.neutralT = 0;
        if (S.ph < 5.6 && plans < 0.78) steps.done('sour');
        const live = S.R.filter((r) => r.alive);
        if (live.some((r, j) => S.E.filter((e) => e.room === S.R.indexOf(r)).length >= 3) && S.ph >= 6.8 && plans > 0.95) { S.roomSafeT += dt; if (S.roomSafeT > 8) steps.done('room'); }
        if (S.digestedIn >= 3 && S.ph >= 6.8) steps.done('feed');
        if (S.plansHurtInRoom && S.D.some((b) => b.room >= 0 && b.h < 0.8)) steps.done('plans');
        return plans;
      }

      /* ---------------- drawing ---------------- */
            function frame(dt) {
        const cw = stage.w, chh = stage.h, pal = BL.pal; if (!cw) return;
        const plans = step(dt);
        const u = Math.min(cw, chh) * 0.47, cx = cw / 2, cy = chh / 2; S.geo = { cx, cy, u };
        ctx.clearRect(0, 0, cw, chh);
        const acid = clamp((7.2 - cytoPH()) / 2.8, 0, 1);

        // the cell: a tint that goes warm as it goes sour
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, u * 0.96, 0, 6.2832);
        ctx.fillStyle = BL.mixHex(pal.panel, pal.pos, acid * 0.3); ctx.fill();
        ctx.lineWidth = 6; ctx.strokeStyle = pal.fn.struct; ctx.stroke();
        ctx.restore();

        // rooms
        S.R.forEach((r) => {
          if (!r.alive) return;
          const rx = cx + r.x * u, ry = cy + r.y * u, rr = r.r * u;
          const grow = clamp((S.t - r.born) * 4, 0, 1);
          ctx.save(); ctx.globalAlpha = grow;
          ctx.fillStyle = BL.alpha(BL.mixHex(pal.panel, pal.pos, 0.34), 0.9); ctx.beginPath(); ctx.arc(rx, ry, rr, 0, 6.2832); ctx.fill();
          // the bilayer: a ring of heads outside, a ring inside, tails between
          const n = Math.max(14, Math.round(6.2832 * rr / 11));
          for (let i = 0; i < n; i++) {
            const a = i / n * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
            ctx.strokeStyle = BL.alpha(pal.fn.store, 0.7); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(rx + ca * (rr - 2), ry + sa * (rr - 2)); ctx.lineTo(rx + ca * (rr + 4), ry + sa * (rr + 4)); ctx.stroke();
            ctx.fillStyle = pal.fn.store; ctx.beginPath(); ctx.arc(rx + ca * (rr + 6), ry + sa * (rr + 6), 3.2, 0, 6.2832); ctx.fill();
            ctx.beginPath(); ctx.arc(rx + ca * (rr - 4), ry + sa * (rr - 4), 3.2, 0, 6.2832); ctx.fill();
          }
          ctx.restore();
        });

        // the plans
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 0; i < S.D.length - 1; i++) {
          const a = S.D[i], b = S.D[i + 1], hh = Math.min(a.h, b.h);
          ctx.strokeStyle = BL.mixHex(pal.muted, pal.fn.genetic, hh); ctx.lineWidth = 3 + 4 * hh; ctx.globalAlpha = 0.35 + 0.65 * hh;
          ctx.beginPath(); ctx.moveTo(cx + a.x * u, cy + a.y * u); ctx.lineTo(cx + b.x * u, cy + b.y * u); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        S.D.forEach((b) => { ctx.fillStyle = BL.mixHex(pal.muted, pal.fn.genetic, b.h); ctx.beginPath(); ctx.arc(cx + b.x * u, cy + b.y * u, 3 + 4 * b.h, 0, 6.2832); ctx.fill(); });

        // junk: grey angular shards that fade as they are eaten
        S.J.forEach((o) => {
          const x = cx + o.x * u, y = cy + o.y * u, s = 8 + 6 * o.h;
          ctx.save(); ctx.translate(x, y); ctx.rotate(o.sh); ctx.globalAlpha = 0.35 + 0.65 * o.h;
          ctx.fillStyle = pal.muted; ctx.strokeStyle = pal.fg; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.lineTo(-s * 0.2, -s); ctx.lineTo(s, -s * 0.2); ctx.lineTo(s * 0.5, s); ctx.lineTo(-s * 0.7, s * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        });
        // what an enzyme leaves behind
        S.drops.forEach((d) => { ctx.fillStyle = BL.alpha(pal.fn.energy, d.life); ctx.beginPath(); ctx.arc(cx + d.x * u, cy + d.y * u, 3, 0, 6.2832); ctx.fill(); });

        // enzymes: a brown ball with a bite out of it, glowing when it is awake
        S.E.forEach((e) => {
          const x = cx + e.x * u, y = cy + e.y * u, a = act(phOf(e.room)), r = 9;
          if (a > 0.1) { const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.6); g.addColorStop(0, BL.alpha(pal.pos, 0.55 * a)); g.addColorStop(1, BL.alpha(pal.pos, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, 6.2832); ctx.fill(); }
          ctx.fillStyle = BL.mixHex(pal.fn.store, pal.panel, 0.35 * (1 - a)); ctx.strokeStyle = pal.fg; ctx.lineWidth = 1.6;
          const mouth = 0.18 + 0.5 * a * (0.5 + 0.5 * Math.sin(S.t * 9 + x));
          ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, mouth, 6.2832 - mouth); ctx.closePath(); ctx.fill(); ctx.stroke();
        });

        // the room being drawn
        if (S.draw && S.draw.r > 0.02) {
          const d = S.draw, ok = d.r >= 0.12;
          ctx.save(); ctx.strokeStyle = ok ? pal.fn.store : pal.muted; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
          ctx.beginPath(); ctx.arc(cx + d.cx * u, cy + d.cy * u, Math.min(d.r, 0.42) * u, 0, 6.2832); ctx.stroke(); ctx.restore();
          BL.label(ctx, ok ? 'let go to wall this off' : 'a little bigger', cx + d.cx * u, cy + d.cy * u - Math.min(d.r, 0.42) * u - 16, { font: BL.font(700, 13), border: pal.fn.store });
        }
        // labels, so nobody has to guess what the shapes are
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'drag across empty space to build a room', cx, 22, { font: BL.font(700, 14), border: pal.ui });

        // readouts
        const jn = S.J.length;
        junkM.set(jn / MAX_JUNK, jn === 0 ? 'none' : jn < 4 ? 'a little' : jn < 8 ? 'building up' : 'piling up'); junkM.tone(pal.muted);
        plansM.set(plans, plans > 0.97 ? 'untouched' : plans > 0.6 ? 'damaged' : plans > 0.2 ? 'badly damaged' : 'gone'); plansM.tone(pal.fn.genetic);
        const nr = S.R.filter((r) => r.alive).length; roomsM.set(nr / MAX_ROOMS, nr ? nr + ' room' + (nr === 1 ? '' : 's') : 'none: the whole cell is one'); roomsM.tone(pal.fn.store);
        if (S.t - S.msgT > 14 && !S.draw) {
          if (!nr) say(S.ph >= 6.8 ? (S.J.length >= 6 ? 'The enzymes are asleep in a neutral cell, so the junk is just building up.' : 'The enzymes are loose and asleep. The cell is neutral.') : plans < 0.9 ? 'The whole cell is acid, so the enzymes are awake everywhere — and the plans are being eaten.' : 'The whole cell is acid. The enzymes are awake everywhere.');
          else say(S.digestedIn ? 'Inside the room the enzymes are awake, outside the cell is ' + words() + '. The junk goes in and is eaten; the plans are out of reach.' : 'A room, with the acid on inside it. Junk will drift in.');
        }
      }

      sync(); reset();
      if (window.__BL_TEST) window.__BL_TEST['rooms'] = S;   // lets a test page find things by their real coordinates
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
