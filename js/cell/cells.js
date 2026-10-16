/* Three Cells: the master boundary, in three dimensions.

   The chapter sorts nearly everything in it against one yes/no question: does
   this structure need a membrane-bound room, or can a cell without internal
   membranes have it too? Eukaryotes — animals, plants, fungi — have the rooms.
   Bacteria do not. So this is the whole chapter's comparison chart turned into
   something you can pick up: an animal cell, a plant cell and a bacterium,
   each one a solid you can turn over, each organelle in the colour of its job,
   with the rooms lit up on request.

   The learner meets the rule before the organelles, so the second panel asks
   them to apply it cold: here is a structure, would a bacterium have it? The
   answer is whether it is a room. It works for almost everything, and the last
   step finds the few things it does not: some structures are eukaryote-only
   without being rooms at all (the rule runs one way).

   Every fact comes from js/cell/kit.js, which tools/check-cell.js holds to the
   chapter's own chart. Nothing here is simulated; it is a picture of a table,
   with the table one tap away. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const K = BL.cell;
  const TYPES = ['animal', 'plant', 'bact'];

  const STEPS = [
    { id: 'bact', text: 'Look for rooms in the bacterium.',
      how: 'Press “Bacterium”, then press “Show the rooms”. Count what lights up.',
      ask: 'how many membrane-bound rooms does a bacterium have?',
      opts: ['None', 'A few', 'About as many as an animal cell'], right: 0 },
    { id: 'plant', text: 'Find what a plant cell has that an animal cell does not.',
      how: 'Switch between “Animal” and “Plant”. In the plant, tap a chloroplast, then tap the cell’s outer edge to find the wall.',
      ask: 'which pair does a plant cell have and an animal cell lack?',
      opts: ['A wall and chloroplasts', 'Mitochondria and a nucleus', 'Lysosomes and a centrosome'], right: 0 },
    { id: 'animal', text: 'Find what only an animal cell has.',
      how: 'In the animal cell, tap a lysosome and the centrosome (the pair of rods beside the nucleus).',
      ask: 'which of these recycling rooms is missing from a plant cell?',
      opts: ['The lysosome', 'The peroxisome', 'The vacuole'], right: 0 },
    { id: 'ribo', text: 'Find the ribosomes in all three.',
      how: 'Tap one of the small dots in each cell, or pick Ribosome in the table.',
      ask: 'does a bacterium have ribosomes?',
      opts: ['Yes', 'No — they are a eukaryote thing'], right: 0 },
    { id: 'sort', text: 'Sort six structures with the rule: would a bacterium have it?',
      how: 'Use “Room or not?” below. Ask of each one: does it need a membrane-bound room?',
      ask: 'if a structure needs a room, will a bacterium have it?',
      opts: ['No', 'Yes'], right: 0 },
    { id: 'oneway', text: 'Find something only eukaryotes have that is not a room.',
      how: 'In the animal cell, tap the centrosome, or pick Cytoskeleton or Cilia in the table.',
      ask: 'is everything a bacterium lacks a membrane-bound room?',
      opts: ['Yes — that is the rule', 'No — a few are just missing, with no membrane of their own'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<ellipse cx="62" cy="62" rx="44" ry="40" fill="none" stroke="var(--fn-struct)" stroke-width="5"/>' +
    '<circle cx="54" cy="56" r="13" fill="var(--fn-genetic)"/><ellipse cx="78" cy="76" rx="9" ry="5" fill="var(--fn-energy)" transform="rotate(-25 78 76)"/>' +
    '<rect x="118" y="30" width="62" height="64" rx="6" fill="none" stroke="var(--fn-struct)" stroke-width="5"/>' +
    '<ellipse cx="148" cy="62" rx="20" ry="26" fill="var(--fn-store)" opacity=".5"/><circle cx="130" cy="44" r="7" fill="var(--fn-genetic)"/>' +
    '</svg>';

  BL.register({
    id: 'cells', field: 'rule', order: 1, name: 'Three Cells',
    tagline: 'Sort the whole chapter with one question.',
    lede: 'An animal cell, a plant cell and a bacterium, in three dimensions — drag to turn them over. Every structure is in the colour of its job. Tap anything to find out what it does and who has it, and light up the rooms to see what the bacterium does without.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock, params }) {
      const S = {
        type: TYPES.indexOf(params && params[0]) >= 0 ? params[0] : 'animal', fade: { animal: 1, plant: 0, bact: 0 }, sel: null, hover: null,
        rooms: false, seen: new Set(), sorted: 0, hinted: false, time: 0, layouts: {}, specks: {}, speckHit: [], bodyHit: null, ribos: new Set(),
      };
      TYPES.forEach((t) => { S.layouts[t] = K.layout(t); S.specks[t] = K.specks(t); });
      S.fade = { animal: S.type === 'animal' ? 1 : 0, plant: S.type === 'plant' ? 1 : 0, bact: S.type === 'bact' ? 1 : 0 };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A three-dimensional cutaway of a cell that you can turn by dragging. Choose an animal cell, a plant cell or a bacterium. Each structure inside is coloured by the job it does. Tap one to read about it. The list below the picture gives the same information as a table.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const V = BL.view3d(stage.canvas, {
        yaw: 0.55, pitch: 0.28, auto: 0.16,
        tap: (p) => pickAt(p),
        hover: (p) => { S.hover = p ? hit(p) : null; stage.canvas.style.cursor = S.hover || (p && bodyAt(p)) ? 'pointer' : ''; },
      });

      /* ---------------- dock ---------------- */
      const typeBtns = TYPES.map((t) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(S.type === t), onclick: () => setType(t) }, K.TYPES[t].short));
      dock.appendChild(h('section', {}, h('h2', {}, 'Which cell'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Which kind of cell' }, typeBtns),
        h('p', { class: 'hint' }, 'Animals, plants and fungi are Eukarya: their cells have a nucleus. Bacteria are prokaryotes: they do not.')));
      const roomsBtn = h('button', { type: 'button', class: 'chip soft', 'aria-pressed': 'false', onclick: () => { S.rooms = !S.rooms; sync(); check(); } }, 'Show the rooms');
      dock.appendChild(h('section', {}, h('h2', {}, 'Look'), h('div', { class: 'chips' }, roomsBtn),
        h('p', { class: 'hint' }, 'A room is a compartment with a membrane of its own. Everything else fades back.')));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'cells', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux: the card ---------------- */
      const card = h('div', { class: 'cell-card', 'aria-live': 'polite' });
      aux.appendChild(h('section', { class: 'panel' }, card));

      /* ---------------- aux: room or not? ---------------- */
      const SORT = K.STRUCTS.filter((s) => s.id !== 'cytoplasm' && s.id !== 'dna');
      let deck = [], cur = null, right = 0, tried = 0;
      const sortBig = h('div', { class: 'big' }), sortSaid = h('p', { class: 'said', 'aria-live': 'polite' }, 'Pick one. The rule is the whole chapter: rooms are for eukaryotes.');
      const sortTally = h('p', { class: 'hint' });
      const yesBtn = h('button', { type: 'button', class: 'action', onclick: () => answer(true) }, 'A bacterium has it');
      const noBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => answer(false) }, 'A bacterium does not');
      const nextBtn = h('button', { type: 'button', class: 'action ghost', hidden: true, onclick: () => deal() }, 'Next one');
      function deal() {
        if (!deck.length) deck = SORT.slice().sort(() => Math.random() - 0.5);
        cur = deck.pop();
        sortBig.textContent = cur.name; sortBig.style.setProperty('--c', 'var(--fn-' + cur.fn + ')');
        sortSaid.className = 'said'; sortSaid.textContent = 'Does it need a membrane-bound room? If it does, a bacterium cannot have it.';
        yesBtn.disabled = noBtn.disabled = false; nextBtn.hidden = true;
        sortTally.textContent = right + ' of ' + tried + ' right so far.';
      }
      function answer(sayHas) {
        const truth = !!cur.bact, ok = sayHas === truth;
        tried++; if (ok) { right++; S.sorted++; }
        const room = cur.kind === 'room';
        const why = room ? cur.name + ' is a room — a membrane-bound compartment — and a bacterium has no rooms.'
          : truth ? cur.name + ' has no membrane of its own, so there is no room to need. A bacterium has it too.'
            : cur.name + ' is not a room, and a bacterium still lacks it. The rule runs one way: every room is missing from bacteria, but not everything bacteria lack is a room.';
        sortSaid.className = 'said ' + (ok ? 'right' : 'wrong'); sortSaid.textContent = (ok ? 'Yes. ' : 'No. ') + why;
        yesBtn.disabled = noBtn.disabled = true; nextBtn.hidden = false;
        sortTally.textContent = right + ' of ' + tried + ' right so far.';
        if (S.sorted >= 6) steps.done('sort');
      }
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Room or not?'), h('div', { class: 'sort-game' }, sortBig,
        h('div', { class: 'row2' }, yesBtn, noBtn), sortSaid, h('div', { class: 'actions' }, nextBtn), sortTally)));
      deal();

      /* ---------------- aux: the chart ---------------- */
      const rows = {};
      const tbody = h('tbody');
      K.STRUCTS.forEach((s) => {
        const tr = h('tr', { 'aria-selected': 'false', tabindex: '0', onclick: () => select(s.id, true), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id, true); } } },
          h('td', {}, s.name, s.kind === 'room' ? h('span', { class: 'room' }, 'room') : null, s.charted === false ? '*' : ''),
          ...TYPES.map((t) => h('td', { class: (s[t] ? 'yes' : 'no') + (t === S.type ? ' now' : ''), 'data-t': t, 'aria-label': K.TYPES[t].short + ': ' + (s[t] ? 'yes' : 'no') }, s[t] ? '✓' : '—')));
        tr.style.setProperty('--c', 'var(--fn-' + s.fn + ')');
        rows[s.id] = tr; tbody.appendChild(tr);
      });
      const heads = TYPES.map((t) => h('th', { 'data-t': t, class: t === S.type ? 'now' : '' }, K.TYPES[t].short));
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Where does it live?'),
        h('div', { class: 'cell-chart-wrap' }, h('table', { class: 'cell-chart' }, h('caption', { class: 'sr-only' }, 'Which structures are found in which kind of cell. Select a row to read about it.'),
          h('thead', {}, h('tr', {}, h('th', {}, 'Structure'), ...heads)), tbody)),
        h('p', { class: 'hint' }, 'Rows are coloured by job. “Room” marks the ones with a membrane of their own — and none of those is in the bacterium. * The chapter names it, but its own chart leaves it out.')));

      /* ---------------- behaviour ---------------- */
      function sync() {
        typeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(TYPES[i] === S.type)));
        roomsBtn.setAttribute('aria-pressed', String(S.rooms));
        Object.values(rows).forEach((tr) => tr.querySelectorAll('td[data-t]').forEach((td) => td.classList.toggle('now', td.dataset.t === S.type)));
        heads.forEach((th) => th.classList.toggle('now', th.dataset.t === S.type));
        showCard();
      }
      function setType(t) { S.type = t; S.hinted = true; V.home = { yaw: V.yaw, pitch: V.pitch }; sync(); check(); }
      function select(id, fromChart) {
        S.sel = id; S.hinted = true; S.seen.add(S.type + ':' + id);
        Object.entries(rows).forEach(([k, tr]) => tr.setAttribute('aria-selected', String(k === id)));
        if (fromChart && rows[id]) rows[id].scrollIntoView({ block: 'nearest' });
        if (id === 'ribosome') S.ribos.add(S.type);
        showCard(); check();
      }
      function showCard() {
        card.textContent = '';
        const s = S.sel && K.struct(S.sel);
        if (!s) {
          card.appendChild(h('h3', {}, K.TYPES[S.type].name));
          card.appendChild(h('p', {}, S.type === 'bact'
            ? 'A bacterium is a single room. Its DNA sits loose in the cell, a ring in a region with no membrane around it, and all six jobs get done anyway, without a single organelle.'
            : 'Tap anything in the picture. Each structure is in the colour of the job it does — for instance, blue for the proteins assembly line and purple for the plans.'));
          card.appendChild(h('p', { class: 'hint' }, 'Rooms in this cell: ' + K.rooms(S.type).length + (K.rooms(S.type).length ? ' — ' + K.rooms(S.type).map((r) => r.name.toLowerCase()).join(', ') + '.' : '.')));
          return;
        }
        const here = !!s[S.type];
        card.style.setProperty('--c', 'var(--fn-' + s.fn + ')');
        card.appendChild(h('h3', {}, s.name));
        card.appendChild(h('div', {}, h('span', { class: 'fn-chip', style: '--c: var(--fn-' + s.fn + ')' }, K.fn(s.fn).name)));
        card.appendChild(h('p', {}, s.job));
        card.appendChild(h('p', { class: 'hint' }, s.kind === 'room' ? 'This one is a room: a compartment with a membrane of its own.' : s.kind === 'boundary' ? 'A membrane, but the outside of the bag rather than a room inside it.' : 'No membrane of its own, so it is not a room.'));
        card.appendChild(h('div', { class: 'where', role: 'group', 'aria-label': 'Which cells have it' },
          ...TYPES.map((t) => h('span', { class: (s[t] ? 'yes' : '') + (t === S.type ? ' here' : '') }, (s[t] ? '✓ ' : '— ') + K.TYPES[t].short))));
        if (!here) card.appendChild(h('p', { class: 'hint' }, 'It is not in this kind of cell, so it is not drawn.'));
        else if (!S.layouts[S.type].some((i) => i.s === s.id) && !['ribosome', 'membrane', 'wall', 'capsule', 'pili', 'cilia', 'flagella', 'cytoskeleton', 'cytoplasm', 'dna'].includes(s.id)) card.appendChild(h('p', { class: 'hint' }, 'Too small to draw in this picture.'));
        if (s.charted === false) card.appendChild(h('p', { class: 'hint' }, 'The chapter names it, but its chart leaves it out.'));
      }

      /* tapping: an organelle, a ribosome dot, or the cell's own edge */
      function hit(p) { return K.pick(S.layouts[S.type], p, 4) || null; }
      function bodyAt(p) {
        const b = S.bodyHit; if (!b) return null;
        return b(p);
      }
      function pickAt(p) {
        const it = hit(p);
        if (it) { select(it.s, false); return; }
        if (S.speckHit.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 9)) { select('ribosome', false); return; }
        const b = bodyAt(p);
        if (b) select(b, false);
        else { S.sel = null; Object.values(rows).forEach((tr) => tr.setAttribute('aria-selected', 'false')); showCard(); }
      }

      function check() {
        if (S.type === 'bact' && S.rooms) steps.done('bact');
        const seen = (t, id) => S.seen.has(t + ':' + id);
        if (seen('plant', 'chloro') && (seen('plant', 'wall') || seen('bact', 'wall'))) steps.done('plant');
        if (seen('animal', 'lysosome') && seen('animal', 'centrosome')) steps.done('animal');
        if (S.ribos.size >= 3) steps.done('ribo');
        if (['cytoskeleton', 'centrosome', 'cilia'].some((id) => seen('animal', id) || seen('plant', id))) steps.done('oneway');
      }

      /* ---------------- drawing ---------------- */
      const RAD = { animal: 1.02, plant: 1.5, bact: 1.8 };
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, chh = stage.h;
        if (!cw) return;
        S.time += dt;
        TYPES.forEach((t) => { const goal = t === S.type ? 1 : 0; S.fade[t] += (goal - S.fade[t]) * (1 - Math.exp(-dt * 6)); });
        const radius = TYPES.reduce((s, t) => s + RAD[t] * S.fade[t], 0) / Math.max(0.2, TYPES.reduce((s, t) => s + S.fade[t], 0));
        V.step(dt);
        V.frame(cw, chh, radius, { x: S.type === 'bact' ? 0.4 : 0, y: 0, z: 0 });
        ctx.clearRect(0, 0, cw, chh);

        S.speckHit = [];
        TYPES.forEach((t) => {
          const a = S.fade[t]; if (a < 0.02) return;
          K.body(ctx, V, t, a, { time: S.time });
          K.fibres_draw(ctx, V, t, a * (S.rooms ? 0.3 : 1));
          K.specks_draw(ctx, V, t, S.specks[t], a * (S.rooms ? 0.25 : 1));
          S.layouts[t].forEach((inst) => {
            const room = K.struct(inst.s).kind === 'room';
            const dim = S.rooms && !room;
            const hl = (S.sel === inst.s || S.hover === inst) && t === S.type ? inst : null;
            const q = V.project(inst.p);
            inst._hidden = a < 0.5;
            V.add(q.z, () => K.drawInst(ctx, V, inst, { alpha: a * (dim ? 0.22 : 1), hl, dim: S.sel && S.sel !== inst.s && t === S.type && !S.rooms ? true : false }));
            if (S.rooms && room && a > 0.5) V.add(q.z + 0.001, () => { // a soft glow marks a room
              if (inst._sr == null) return;
              ctx.save(); ctx.strokeStyle = BL.alpha(pal.fg, 0.8); ctx.lineWidth = 2.6; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.arc(inst._sx, inst._sy, inst._sr + 5, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
            });
          });
          if (t === S.type) S.speckHit = S.specks[t].map((p) => { const q = V.project(p); return { x: q.x, y: q.y }; });
        });
        V.flush();

        // what counts as "the cell's own edge" for a tap, in screen terms
        const wallId = S.type === 'animal' ? 'membrane' : 'wall';
        if (S.type === 'animal') { const q = V.project({ x: 0, y: 0, z: 0 }), r = V.scale * q.s; S.bodyHit = (p) => (Math.hypot(p.x - q.x, p.y - q.y) < r + 6 ? wallId : null); }
        else if (S.type === 'plant') {
          const P = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => V.project({ x: x * 1.15, y: y * 0.82, z: z * 0.82 }))));
          const x0 = Math.min(...P.map((q) => q.x)), x1 = Math.max(...P.map((q) => q.x)), y0 = Math.min(...P.map((q) => q.y)), y1 = Math.max(...P.map((q) => q.y));
          S.bodyHit = (p) => (p.x > x0 - 6 && p.x < x1 + 6 && p.y > y0 - 6 && p.y < y1 + 6 ? wallId : null);
        } else {
          const a = V.project({ x: -0.75, y: 0, z: 0 }), b = V.project({ x: 0.75, y: 0, z: 0 }), r = 0.8 * V.scale * (a.s + b.s) / 2;
          S.bodyHit = (p) => { const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1, u = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / L2, 0, 1); return Math.hypot(p.x - (a.x + u * dx), p.y - (a.y + u * dy)) < r + 8 ? wallId : null; };
        }

        // a name for whatever the finger is over
        const over = S.hover;
        if (over) BL.label(ctx, K.struct(over.s).name, clamp(over._sx, 70, cw - 70), clamp(over._sy - over._sr - 16, 18, chh - 18), { font: BL.font(800, 14), border: 'var(--fn-' + K.struct(over.s).fn + ')' });
        // the one rule, spelled out where the eye already is
        const n = K.rooms(S.type).length;
        BL.label(ctx, S.rooms || S.type === 'bact' ? (n ? n + ' rooms' : 'no rooms — the whole cell is one') : K.TYPES[S.type].name, 12, 22, { font: BL.font(800, 15), align: 'left', border: pal.fg });
        V.cue(ctx, pal);
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'tap a structure · drag to turn', cw / 2, chh - 18, { font: BL.font(700, 14), border: pal.ui });
        // the table's "now" cells need no per-frame work
      }

      sync();
      if (window.__BL_TEST) window.__BL_TEST['cells'] = S;   // lets a test page find things by their real coordinates
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
