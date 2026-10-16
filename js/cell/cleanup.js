/* Cleanup: the storage-and-maintenance crew, three rooms and three jobs.

   The chapter files lysosome, peroxisome and vacuole together as a cleanup
   crew and warns that they are not one thing: lysosomes digest general waste and
   are almost only in animal cells, peroxisomes specifically deal with the
   hydrogen peroxide left by breaking down fats and are in plants and animals,
   and vacuoles store and export waste and, in a plant, are huge. So this has
   three scenes, one per room, and each scene is the room's job as something to
   do with your hands:

     Lysosome    drag worn-out parts into the acid room and watch them come out
                 as building blocks; take the lysosome out and they pile up; split
                 its membrane open and the acid digests the cell itself.
     Peroxisome  feed it fat. Breaking fat down makes hydrogen peroxide, which is
                 poison; the enzyme catalase turns it into water and oxygen. Switch
                 the catalase off and the peroxide builds up and leaks out.
     Vacuole     drag waste into it, and send it out. A plant's one big central
                 vacuole is most of the cell, and the pressure of the water in it
                 is what holds the cell firm against its wall.

   The peroxisome scene is the other half of the bench lab, Bobbing for Catalase:
   the same enzyme, the same reaction, with a filter paper to watch it by.

   All three are toys. Rates are chosen so each thing is watchable, the
   chemistry of digestion is not modelled, and the parts the lysosome gives back
   are drawn as generic building blocks. The acid in the lysosome is the idea
   Rooms was about; here it is just the thing the membrane is keeping in. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const K = BL.cell;

  const SCENES = [
    { id: 'lyso', name: 'Lysosome' },
    { id: 'perox', name: 'Peroxisome' },
    { id: 'vac', name: 'Vacuole' },
  ];

  const STEPS = [
    { id: 'carry', text: 'Lysosome: carry a worn-out part into the lysosome.',
      how: 'Pick up a cracked mitochondrion and drop it inside the brown room. Watch what comes out.',
      ask: 'what comes out of a lysosome when it digests a worn-out organelle?',
      opts: ['Nothing — it is destroyed for good', 'Building blocks the cell reuses'], right: 1 },
    { id: 'nolyso', text: 'Lysosome: take the lysosome out and wait.',
      how: 'Press “Take the lysosome out” and watch the worn-out parts for ten seconds.',
      ask: 'with no lysosome, what happens to worn-out parts?',
      opts: ['They pile up', 'Something else quietly digests them'], right: 0 },
    { id: 'leak', text: 'Lysosome: split its membrane open.',
      how: 'Press “Split the lysosome open” and watch the rest of the cell.' },
    { id: 'feed', text: 'Peroxisome: feed it some fat.',
      how: 'Switch to Peroxisome and press “Feed it fat”. Watch the red molecules that appear inside it.',
      ask: 'breaking fat down makes something poisonous. What?',
      opts: ['Hydrogen peroxide', 'Carbon monoxide', 'Strong acid'], right: 0 },
    { id: 'catalase', text: 'Peroxisome: switch the catalase off, then feed it fat.',
      how: 'Press “Catalase: on” to turn it off, then feed it fat and watch the peroxide.',
      ask: 'with no catalase, what happens to the peroxide?',
      opts: ['It builds up and leaks out into the cell', 'It disappears by itself'], right: 0 },
    { id: 'bubbles', text: 'Peroxisome: with the catalase on, make ten bubbles.',
      how: 'Switch the catalase back on and keep feeding it. The bubbles are what the peroxide turns into.',
      ask: 'the bubbles that stream out of the peroxisome are…',
      opts: ['Oxygen', 'Hydrogen', 'Carbon dioxide'], right: 0 },
    { id: 'store', text: 'Vacuole: carry four pieces of waste into a vacuole.',
      how: 'Switch to Vacuole. Pick up a grey piece of waste and drop it inside the vacuole.',
      ask: 'what does a vacuole do with waste?',
      opts: ['Stores it, and can export it', 'Digests it with acid', 'Turns it into energy'], right: 0 },
    { id: 'wilt', text: 'Vacuole: let the water out of a plant cell’s vacuole.',
      how: 'Choose the plant cell and slide “Water in the vacuole” all the way down.',
      ask: 'a plant cell with an empty vacuole is…',
      opts: ['Still firm, because it has a wall', 'Limp — the vacuole’s pressure was holding it out'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<circle cx="58" cy="64" r="26" fill="var(--fn-store)" opacity=".35" stroke="var(--fn-store)" stroke-width="5"/>' +
    '<g fill="var(--fn-store)"><circle cx="50" cy="60" r="5"/><circle cx="64" cy="70" r="5"/><circle cx="60" cy="54" r="4"/></g>' +
    '<circle cx="132" cy="48" r="16" fill="none" stroke="var(--fn-store)" stroke-width="5"/>' +
    '<g fill="none" stroke="var(--fn-store)" stroke-width="3.5"><circle cx="150" cy="86" r="8"/><circle cx="130" cy="94" r="5"/><circle cx="168" cy="66" r="4"/></g></svg>';

  BL.register({
    id: 'cleanup', field: 'jobs', order: 3, name: 'Cleanup',
    tagline: 'Three rooms, three different jobs.',
    lede: 'Three rooms that look alike and are not. A lysosome digests what is worn out, a peroxisome neutralises the poison fat leaves behind, and a vacuole stores and exports. Switch between them and do each one’s job with your own hand.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock, params }) {
      const S = {
        scene: SCENES.some((s) => s.id === (params && params[0])) ? params[0] : 'lyso', t: 0, hinted: false, drag: null, geo: { w: 0, h: 0 },
        // lysosome
        lyso: true, lysoBroken: 0, junk: [], blocks: [], recycled: 0, junkT: 0, nolysoT: 0, health: 1,
        // peroxisome
        cat: true, fats: [], P: 0, tox: 0, bub: [], made: 0, fed: 0, bubbles: 0, leaked: false,
        // vacuole
        plant: false, waste: [], stored: 0, exported: 0, water: 0.7, wasteT: 0, vacFill: 0,
      };
      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A cell showing one of three cleanup rooms at a time. In the lysosome scene you carry worn-out parts into an acid room. In the peroxisome scene you feed fat in and watch hydrogen peroxide be turned into water and oxygen bubbles. In the vacuole scene you carry waste into a store and export it. Controls are in the side panel.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- dock ---------------- */
      const sceneBtns = SCENES.map((sc) => h('button', { type: 'button', 'aria-pressed': String(sc.id === S.scene), onclick: () => { S.scene = sc.id; S.hinted = true; S.drag = null; sync(); } }, sc.name));
      dock.appendChild(h('section', {}, h('h2', {}, 'Which room'), h('div', { class: 'seg', role: 'group', 'aria-label': 'Which cleanup room' }, sceneBtns)));
      const panes = {};
      const pane = (id, ...kids) => { const el = h('section', { hidden: id !== S.scene }, ...kids); panes[id] = el; dock.appendChild(el); };
      const lysoBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.lyso = !S.lyso; lysoBtn.setAttribute('aria-pressed', String(!S.lyso)); lysoBtn.textContent = S.lyso ? 'Take the lysosome out' : 'Put the lysosome back'; if (S.lyso) { S.nolysoT = 0; } } }, 'Take the lysosome out');
      pane('lyso', h('h2', {}, 'The lysosome'), h('div', { class: 'chips' }, lysoBtn),
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action ghost', onclick: () => { if (S.lyso && !S.lysoBroken) { S.lysoBroken = 0.001; steps.done('leak'); } } }, 'Split the lysosome open'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => { S.lysoBroken = 0; S.health = 1; S.junk = []; S.blocks = []; S.lyso = true; lysoBtn.setAttribute('aria-pressed', 'false'); lysoBtn.textContent = 'Take the lysosome out'; } }, 'Start over')),
        h('p', { class: 'hint' }, 'Worn-out parts appear on their own. Drag one into the brown room.'));
      const catBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'true', onclick: () => { S.cat = !S.cat; catBtn.setAttribute('aria-pressed', String(S.cat)); catBtn.textContent = S.cat ? 'Catalase: on' : 'Catalase: off'; } }, 'Catalase: on');
      pane('perox', h('h2', {}, 'The peroxisome'), h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action', onclick: () => feedFat() }, 'Feed it fat')), h('div', { class: 'chips' }, catBtn),
        h('div', { class: 'actions' }, h('a', { class: 'action ghost', href: '#/bobbing' }, 'The bench lab: Bobbing for Catalase →')),
        h('p', { class: 'hint' }, 'Catalase is an enzyme. The same one is in the yeast you will use to make paper rise.'));
      const typeBtns = [['animal', 'Animal cell'], ['plant', 'Plant cell']].map(([id, n]) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String((id === 'plant') === S.plant), onclick: () => { S.plant = id === 'plant'; S.waste = []; S.vacFill = 0; typeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String((i === 1) === S.plant))); sync(); } }, n));
      const wOut = h('output', { class: 'val' }), wIn = h('input', { type: 'range', min: '0', max: '100', step: '1', value: String(S.water * 100), 'aria-label': 'Water in the vacuole' });
      wIn.addEventListener('input', () => { S.water = parseFloat(wIn.value) / 100; wOut.textContent = S.water < 0.2 ? 'nearly empty' : S.water < 0.6 ? 'half full' : 'full'; S.hinted = true; }); wOut.textContent = 'full';
      const wCtl = h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'Water in the vacuole'), wOut), h('div', { class: 'range-wrap' }, wIn, h('div', { class: 'range-ends' }, h('span', {}, 'empty'), h('span', {}, 'full'))));
      pane('vac', h('h2', {}, 'The vacuole'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Which kind of cell' }, typeBtns), wCtl,
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action', onclick: () => doExport() }, 'Export what is stored')),
        h('p', { class: 'hint' }, 'A plant’s central vacuole can be up to 80% of the cell.'));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'cleanup', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const m1 = BL.meter(''), m2 = BL.meter(''), m3 = BL.meter('');
      aux.appendChild(h('section', { class: 'panel' }, statusP, h('div', { class: 'meters' }, m1.el, m2.el, m3.el),
        h('div', { class: 'legend' }, h('span', { class: 'fn-chip', style: '--c: var(--fn-store)' }, 'storage and maintenance: break down, detoxify, store'))));
      const key = h('section', { class: 'panel' }, h('h2', {}, 'Who has which?'));
      ['lysosome', 'peroxisome', 'vacuole'].forEach((id) => {
        const s = K.struct(id);
        key.appendChild(h('div', { class: 'cell-card' }, h('h3', { style: '--c: var(--fn-store); font-size:1.05rem' }, s.name), h('p', {}, s.job),
          h('div', { class: 'where' }, ...['animal', 'plant', 'bact'].map((t) => h('span', { class: s[t] ? 'yes' : '' }, (s[t] ? '✓ ' : '— ') + K.TYPES[t].short)))));
      });
      aux.appendChild(key);

      function sync() {
        sceneBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(SCENES[i].id === S.scene)));
        Object.entries(panes).forEach(([id, el]) => { el.hidden = id !== S.scene; });
        wCtl.style.display = S.plant ? '' : 'none';
        const set = (m, l) => { m.el.querySelector('.lab').textContent = l; };
        if (S.scene === 'lyso') { set(m1, 'Worn-out parts waiting'); set(m2, 'Building blocks given back'); set(m3, 'The rest of the cell'); }
        if (S.scene === 'perox') { set(m1, 'Hydrogen peroxide in the peroxisome'); set(m2, 'Poison loose in the cell'); set(m3, 'Oxygen bubbles made'); }
        if (S.scene === 'vac') { set(m1, 'Waste lying about'); set(m2, 'Stored in the vacuole'); set(m3, S.plant ? 'How firm the cell is' : 'Exported'); }
      }
      sync();

      function feedFat() { S.hinted = true; for (let i = 0; i < 3; i++) S.fats.push({ x: -0.9 - i * 0.12, y: -0.15 + i * 0.15, ph: Math.random() * 6 }); S.fed++; }
      function doExport() { S.hinted = true; if (S.stored > 0) { S.exported += S.stored; S.stored = 0; S.vacFill = 0; for (let i = 0; i < 5; i++) S.bub.push({ x: 0.1, y: -0.3, vx: 0.3 + Math.random() * 0.3, vy: -0.5 - Math.random() * 0.4, life: 1.4, k: 'waste' }); } }

      /* ---------------- pointer: carry junk and waste ---------------- */
      const world = (p) => ({ x: (p.x - S.geo.w / 2) / S.geo.u, y: (p.y - S.geo.h / 2) / S.geo.u });
      const room = () => (S.scene === 'lyso' ? { x: 0.42, y: 0.0, r: 0.3 } : S.scene === 'vac' ? (S.plant ? { x: 0.05, y: 0.0, r: 0.75 * (0.4 + 0.6 * S.water) } : { x: 0.45, y: -0.1, r: 0.3 }) : null);
      BL.drag(stage.canvas, {
        pick: (p) => {
          const w = world(p), list = S.scene === 'lyso' ? S.junk : S.scene === 'vac' ? S.waste : null; if (!list) return null;
          let best = null, bd = 0.16; list.forEach((o) => { if (o.gone) return; const d = Math.hypot(o.x - w.x, o.y - w.y); if (d < bd) { bd = d; best = o; } }); return best ? { o: best } : null;
        },
        move: (a, p) => { const w = world(p); a.o.x = w.x; a.o.y = w.y; a.o.vx = a.o.vy = 0; a.o.held = true; S.hinted = true; },
        end: (a) => {
          a.o.held = false; const r = room(); if (!r) return;
          const d = Math.hypot(a.o.x - r.x, a.o.y - r.y);
          if (S.scene === 'lyso' && S.lyso && !S.lysoBroken && d < r.r * 1.05) { a.o.eat = 0.001; steps.done('carry'); }
          if (S.scene === 'vac' && d < r.r * (S.plant ? 1 : 1.05)) { a.o.gone = true; S.stored++; S.vacFill = Math.min(1, S.vacFill + 0.2); if (S.stored >= 4) steps.done('store'); }
        },
      });

      /* ---------------- the three worlds ---------------- */
      function stepWorld(dt) {
        S.t += dt;
        const rnd = (a, b) => a + Math.random() * (b - a);
        // lysosome
        if (S.scene === 'lyso') {
          S.junkT += dt; if (S.junkT > 3.4 && S.junk.filter((j) => !j.eat).length < 8) { S.junkT = 0; let p; for (let k = 0; k < 20; k++) { p = { x: rnd(-0.8, 0.1), y: rnd(-0.6, 0.6) }; if (Math.hypot(p.x + 0.2, p.y) > 0.15) break; } S.junk.push({ x: p.x, y: p.y, vx: 0, vy: 0, rot: rnd(0, 6), eat: 0 }); }
          S.junk.forEach((j) => { if (j.held || j.eat) { if (j.eat) { j.eat += dt / 2.6; const r = room(); j.x += (r.x - j.x) * dt * 3; j.y += (r.y - j.y) * dt * 3; if (Math.random() < dt * 5) S.blocks.push({ x: r.x, y: r.y, vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3), life: 2.4, c: (Math.random() * 3) | 0 }); } return; } j.vx += (Math.random() - 0.5) * 0.4 * dt; j.vy += (Math.random() - 0.5) * 0.4 * dt; j.x += j.vx * dt; j.y += j.vy * dt; const d = Math.hypot(j.x, j.y); if (d > 0.82) { j.x *= 0.82 / d; j.y *= 0.82 / d; j.vx *= -1; j.vy *= -1; } });
          S.junk = S.junk.filter((j) => { if (j.eat >= 1) { S.recycled++; return false; } return true; });
          S.blocks.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }); S.blocks = S.blocks.filter((b) => b.life > 0);
          if (S.lysoBroken) { S.lysoBroken += dt; S.health = Math.max(0, S.health - dt * 0.09); }
          if (!S.lyso && S.junk.length >= 5) { S.nolysoT += dt; if (S.nolysoT > 10) steps.done('nolyso'); } else if (S.lyso) S.nolysoT = 0;
        }
        // peroxisome
        if (S.scene === 'perox') {
          S.fats.forEach((f) => { f.x += dt * 0.35; f.ph += dt * 2; });
          const r = { x: 0.35, y: 0.0, r: 0.3 };
          S.fats = S.fats.filter((f) => { if (Math.hypot(f.x - r.x, f.y - r.y) < r.r * 0.85) { S.P += 2.5; steps.done('feed'); return false; } return true; });
          const rate = S.cat ? 2.4 : 0; const conv = Math.min(S.P, rate * dt);
          S.P -= conv; S.made += conv * 0.5; S.bubbles += conv * 0.5;
          for (let k = 0; k < conv * 2.5; k++) if (Math.random() < 0.8) S.bub.push({ x: r.x + rnd(-0.1, 0.1), y: r.y - 0.1, vx: rnd(-0.1, 0.2), vy: rnd(-0.5, -0.9), life: 1.6, k: 'o2' });
          if (S.P > 4) { const leak = (S.P - 4) * 0.25 * dt; S.P -= leak; S.tox = Math.min(1, S.tox + leak * 0.4); S.leaked = true; }
          S.tox = Math.max(0, S.tox - dt * 0.03);
          if (!S.cat && S.leaked && S.tox > 0.15) steps.done('catalase');
          if (S.cat && S.bubbles >= 10) steps.done('bubbles');
        }
        // vacuole
        if (S.scene === 'vac') {
          S.wasteT += dt; if (S.wasteT > 2.8 && S.waste.filter((w) => !w.gone).length < 7) { S.wasteT = 0; S.waste.push({ x: rnd(-0.8, -0.1), y: rnd(-0.55, 0.55), vx: 0, vy: 0, rot: rnd(0, 6) }); }
          const rm = room();
          S.waste.forEach((w) => { if (w.held || w.gone) return; w.vx += (Math.random() - 0.5) * 0.4 * dt; w.vy += (Math.random() - 0.5) * 0.4 * dt; w.x += w.vx * dt; w.y += w.vy * dt; const d = Math.hypot(w.x, w.y); if (d > 0.82) { w.x *= 0.82 / d; w.y *= 0.82 / d; w.vx *= -1; w.vy *= -1; } if (rm && Math.hypot(w.x - rm.x, w.y - rm.y) < rm.r * 0.9 && S.plant) { w.x += (w.x - rm.x) * dt * 2; w.y += (w.y - rm.y) * dt * 2; } });
          S.waste = S.waste.filter((w) => !w.gone);
          if (S.plant && S.water < 0.15) { S.limpT = (S.limpT || 0) + dt; if (S.limpT > 2.5) steps.done('wilt'); } else S.limpT = 0;
        }
        S.bub.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }); S.bub = S.bub.filter((b) => b.life > 0);
      }

      /* ---------------- drawing ---------------- */
      function frame(dt) {
        const cw = stage.w, chh = stage.h, pal = BL.pal; if (!cw) return;
        stepWorld(dt);
        const u = Math.min(cw, chh) * 0.47; S.geo = { w: cw, h: chh, u };
        ctx.clearRect(0, 0, cw, chh);
        const X = (x) => cw / 2 + x * u, Y = (y) => chh / 2 + y * u;
        const col = pal.fn.store;
        // the cell
        const plant = S.scene === 'vac' && S.plant, sag = plant ? clamp(1 - S.water / 0.55, 0, 1) : 0;
        ctx.save(); ctx.beginPath();
        if (plant) { const w = 1.18 - 0.1 * sag, hh = 0.86 - 0.18 * sag; ctx.roundRect(X(-w), Y(-hh) + sag * u * 0.1, w * 2 * u, hh * 2 * u, 26 + sag * 40); } else ctx.arc(X(0), Y(0), u * 0.96, 0, 6.2832);
        const tox = S.scene === 'perox' ? S.tox : S.scene === 'lyso' ? 1 - S.health : 0;
        ctx.fillStyle = BL.mixHex(pal.panel, pal.pos, 0.12 + 0.35 * tox); ctx.fill(); ctx.lineWidth = plant ? 9 : 5; ctx.strokeStyle = pal.fn.struct; ctx.stroke(); ctx.restore();
        if (S.scene === 'lyso') drawLyso(X, Y, u, pal, col, cw, chh);
        else if (S.scene === 'perox') drawPerox(X, Y, u, pal, col, cw, chh);
        else drawVac(X, Y, u, pal, col, cw, chh, sag);
        // carriers
        S.bub.forEach((b) => { ctx.globalAlpha = clamp(b.life, 0, 1); if (b.k === 'o2') { ctx.strokeStyle = pal.neg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), 5, 0, 6.2832); ctx.stroke(); } else { ctx.fillStyle = pal.muted; ctx.fillRect(X(b.x) - 4, Y(b.y) - 4, 8, 8); } ctx.globalAlpha = 1; });
        if (!S.hinted && !BL.reduced) BL.label(ctx, S.scene === 'perox' ? 'press “Feed it fat”' : 'drag the grey pieces into the room', cw / 2, 20, { font: BL.font(700, 14), border: pal.ui });
        words();
      }
      function junkShape(x, y, rot, a, pal) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.fillStyle = BL.mixHex(pal.fn.energy, pal.muted, 0.6); ctx.strokeStyle = pal.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, 0, 17, 9, 0, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.strokeStyle = BL.alpha(pal.fg, 0.7); ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-2, -1); ctx.lineTo(-7, 4); ctx.lineTo(-1, 9); ctx.stroke(); ctx.restore(); }
      function drawLyso(X, Y, u, pal, col, cw, chh) {
        const r = room();
        if (S.lyso) {
          const broken = S.lysoBroken, pulse = broken ? Math.min(1, broken * 0.6) : 0;
          ctx.save(); ctx.fillStyle = BL.alpha(BL.mixHex(pal.panel, pal.pos, 0.38), 0.9); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.setLineDash(broken ? [10, 12] : []);
          ctx.beginPath(); ctx.arc(X(r.x), Y(r.y), r.r * u * (1 + 0.5 * pulse), 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.restore();
          BL.label(ctx, broken ? 'acid spilling out' : 'lysosome: acid inside', X(r.x), Y(r.y) - r.r * u - 14, { font: BL.font(700, 13), border: col });
        } else BL.label(ctx, 'no lysosome', X(r.x), Y(r.y), { font: BL.font(700, 13), border: pal.muted });
        S.junk.forEach((j) => junkShape(X(j.x), Y(j.y), j.rot, j.eat ? 1 - j.eat : 1, pal));
        S.blocks.forEach((b) => { ctx.globalAlpha = clamp(b.life, 0, 1); ctx.fillStyle = [pal.fn.protein, pal.fn.energy, pal.fn.genetic][b.c]; ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), 4.5, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1; });
      }
      function drawPerox(X, Y, u, pal, col, cw, chh) {
        const r = { x: 0.35, y: 0, r: 0.3 };
        ctx.save(); ctx.fillStyle = BL.alpha(BL.mixHex(pal.panel, col, 0.2), 0.95); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(X(r.x), Y(r.y), r.r * u, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.restore();
        // the peroxide inside, one red molecule per bit of it
        const n = Math.min(14, Math.round(S.P * 1.6)); for (let i = 0; i < n; i++) { const a = i * 2.4 + S.t * 0.8, rr = (0.05 + 0.17 * ((i * 0.37) % 1)) * u; ctx.fillStyle = pal.pos; ctx.beginPath(); ctx.arc(X(r.x) + Math.cos(a) * rr, Y(r.y) + Math.sin(a) * rr, 5.5, 0, 6.2832); ctx.fill(); ctx.fillStyle = pal.neg; ctx.beginPath(); ctx.arc(X(r.x) + Math.cos(a) * rr + 6, Y(r.y) + Math.sin(a) * rr + 3, 3.5, 0, 6.2832); ctx.fill(); }
        // catalase: little enzymes, awake when on
        for (let i = 0; i < 4; i++) { const a = i * 1.6 + 0.5, x = X(r.x) + Math.cos(a) * r.r * u * 0.62, y = Y(r.y) + Math.sin(a) * r.r * u * 0.62; ctx.fillStyle = S.cat ? col : BL.alpha(col, 0.3); ctx.strokeStyle = pal.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 9, 0.5, 5.8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        BL.label(ctx, S.cat ? 'peroxisome, with catalase' : 'peroxisome, NO catalase', X(r.x), Y(r.y) + r.r * u + 18, { font: BL.font(700, 13), border: S.cat ? col : pal.pos });
        // fat coming in: long zigzag chains
        S.fats.forEach((f) => { ctx.strokeStyle = pal.fn.energy; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k < 7; k++) { const x = X(f.x) + k * 7, y = Y(f.y) + (k % 2 ? -5 : 5); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); });
        BL.label(ctx, 'fat', X(-0.9), Y(0.35), { font: BL.font(700, 12), border: pal.fn.energy });
      }
      function drawVac(X, Y, u, pal, col, cw, chh, sag) {
        const r = room();
        const fill = (x, y, rr, a) => { ctx.save(); ctx.fillStyle = BL.alpha(BL.mixHex(pal.panel, col, 0.25 + 0.3 * S.vacFill), a); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); if (S.plant) ctx.ellipse(x, y + sag * u * 0.1, rr * 1.35, rr * 0.95, 0, 0, 6.2832); else ctx.arc(x, y, rr, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.restore(); };
        fill(X(r.x), Y(r.y), r.r * u, 0.95);
        BL.label(ctx, S.plant ? 'central vacuole' : 'vacuole', X(r.x), Y(r.y) + (S.plant ? 0 : r.r * u + 14), { font: BL.font(700, 13), border: col });
        if (S.plant) BL.label(ctx, S.water > 0.55 ? 'firm: the vacuole presses the cell out against the wall' : S.water > 0.2 ? 'softening' : 'limp', X(0), Y(-0.86) + 4, { font: BL.font(700, 13), border: S.water > 0.55 ? pal.ui : pal.pos });
        S.waste.forEach((w) => { ctx.save(); ctx.translate(X(w.x), Y(w.y)); ctx.rotate(w.rot); ctx.fillStyle = pal.muted; ctx.strokeStyle = pal.fg; ctx.lineWidth = 1.5; ctx.fillRect(-7, -7, 14, 14); ctx.strokeRect(-7, -7, 14, 14); ctx.restore(); });
        for (let i = 0; i < S.stored; i++) { const a = i * 1.3 + 0.3; ctx.fillStyle = pal.muted; ctx.fillRect(X(r.x) + Math.cos(a) * r.r * u * 0.4 - 6, Y(r.y) + Math.sin(a) * r.r * u * 0.4 - 6, 12, 12); }
      }
      function words() {
        const pal = BL.pal; let say = '';
        if (S.scene === 'lyso') {
          const waiting = S.junk.filter((j) => !j.eat).length;
          m1.set(waiting / 8, waiting ? waiting + ' waiting' : 'none'); m1.tone(pal.muted); m2.set(clamp(S.recycled / 6, 0, 1), S.recycled ? S.recycled + ' parts reused' : 'none yet'); m2.tone(pal.fn.protein); m3.set(S.health, S.health > 0.97 ? 'untouched' : S.health > 0.5 ? 'being digested' : 'wrecked'); m3.tone(pal.pos);
          say = S.lysoBroken ? 'The membrane is gone, so the acid is everywhere. The cell has started to digest itself.' : !S.lyso ? (waiting >= 3 ? 'No lysosome. The worn-out parts have nowhere to go, and are piling up.' : 'No lysosome, so nothing digests worn-out parts. Wait and watch them pile up.') : S.recycled ? 'The lysosome takes the part apart and gives the pieces back to be built into something new.' : 'Worn-out parts are building up. Drag one into the lysosome.';
        } else if (S.scene === 'perox') {
          m1.set(S.P / 8, S.P < 0.2 ? 'none' : S.P < 3 ? 'a little' : 'building up'); m1.tone(pal.pos); m2.set(S.tox, S.tox < 0.05 ? 'none' : S.tox < 0.4 ? 'some' : 'poisoning the cell'); m2.tone(pal.pos); m3.set(clamp(S.bubbles / 10, 0, 1), Math.floor(S.bubbles) + ' of 10'); m3.tone(pal.neg);
          say = !S.cat ? (S.P > 3 ? 'No catalase, so the peroxide cannot be turned into anything. It builds up, and it is leaking into the rest of the cell.' : 'The catalase is off. Feed it fat and see what the peroxide does.') : S.bubbles > 0.5 ? 'Catalase turns each hydrogen peroxide into water and oxygen. The bubbles are the oxygen.' : 'Press “Feed it fat”. Breaking fat down makes hydrogen peroxide, which is poison.';
        } else {
          const lying = S.waste.length; m1.set(lying / 7, lying ? lying + (lying === 1 ? ' piece' : ' pieces') : 'none'); m1.tone(pal.muted); m2.set(S.stored / 6, S.stored ? S.stored + ' stored' : 'empty'); m2.tone(pal.fn.store);
          if (S.plant) { m3.set(clamp(S.water, 0, 1), S.water > 0.55 ? 'firm' : S.water > 0.2 ? 'softening' : 'limp'); m3.tone(pal.ui); } else { m3.set(clamp(S.exported / 6, 0, 1), S.exported ? S.exported + ' sent out' : 'none yet'); m3.tone(pal.fn.store); }
          say = S.plant ? (S.water < 0.2 ? 'The vacuole is empty, and the cell has gone limp. Its pressure was what held the cell out against the wall.' : 'A plant cell’s vacuole is most of the cell. It stores waste, and its water pressure holds the cell out against the wall.') : 'A vacuole stores waste and can send it out. Drag a piece of waste in, then press “Export what is stored”.';
        }
        if (say !== S.lastSay) { S.lastSay = say; statusP.textContent = say; }
      }

      if (window.__BL_TEST) window.__BL_TEST['cleanup'] = S;   // lets a test page find things by their real coordinates
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
