/* Assembly Line: protein management, in the order it actually happens.

   The chapter says to learn this one as a literal assembly line, in exactly this
   order: a ribosome builds the protein, the rough ER modifies it, a vesicle
   carries it to the Golgi, the Golgi finishes and sorts it and repackages it in
   a new vesicle, and that vesicle takes it out. Smooth ER, by contrast, is just
   ER without the ribosomes and is not part of the line.

   So this is the line, running. Proteins start at the nucleus, where the
   instructions come out through a pore, and make their way along it one station
   at a time. Every station can be taken out by tapping it, and the point of that
   is what each one's absence does:

     no ribosome     nothing is built; the instructions arrive and nobody reads them
     no rough ER     the chain is made but never modified; it waits at the door
     no vesicles     the ER fills with protein it cannot send anywhere
     no Golgi        vesicles arrive and nothing sorts or ships them

   Peel the ribosomes off the ER and it becomes smooth ER, and the line stops
   there too: a room with no ribosomes is not on this route.

   It is a model of the ORDER and of what each step is needed for. It says nothing
   about how a ribosome reads, how a protein folds, or what the Golgi adds (those
   are Chapter 12's), and "modified" and "sorted" are drawn as a tag and a label
   so you can see the state change, not because that is what they look like. The
   timings are chosen so the line is watchable. The second panel is the same line
   in three dimensions, lit up as proteins pass through. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const K = BL.cell;

  /* the stations, in order; x and y are fractions of the stage */
  const ST = [
    { id: 'nuc', name: 'Nucleus', x: 0.1, y: 0.42, does: 'sends out the instructions', crit: false },
    { id: 'ribo', name: 'Ribosome', x: 0.28, y: 0.42, does: 'builds the chain', fail: 'No ribosome, so nothing is built. The instructions arrive and nobody reads them.' },
    { id: 'er', name: 'Rough ER', x: 0.46, y: 0.64, does: 'modifies it', fail: 'No rough ER, so the chain is built but never modified. It waits at the door, unfinished.' },
    { id: 'ves1', name: 'Vesicle', x: 0.6, y: 0.46, does: 'carries it across', fail: 'No vesicles, so the ER fills up with protein it cannot send anywhere.' },
    { id: 'golgi', name: 'Golgi apparatus', x: 0.74, y: 0.3, does: 'finishes, sorts and repackages it', fail: 'No Golgi, so the vesicles arrive and wait. Nothing is sorted and nothing is shipped.' },
    { id: 'ves2', name: 'Vesicle', x: 0.87, y: 0.22, does: 'delivers it', fail: 'No second vesicle, so the finished protein is stuck in the Golgi.' },
  ];
  const DUR = [1.4, 2.4, 2.2, 1.6, 2.2, 1.6];     // seconds of work at each station

  const STEPS = [
    { id: 'run', text: 'Make a protein and follow it all the way out.',
      how: 'Press “Make a protein”. Watch the same one from the nucleus to the outside.',
      ask: 'in what order does a protein pass through these rooms?',
      opts: ['Ribosome, rough ER, vesicle, Golgi, vesicle, out', 'Golgi, ribosome, rough ER, vesicle, out', 'Rough ER, Golgi, ribosome, out'], right: 0 },
    { id: 'noer', text: 'Take out the rough ER, then make another protein.',
      how: 'Tap the Rough ER, then press “Make a protein”. Watch where it stops.',
      ask: 'with the rough ER out, will any protein get shipped?',
      opts: ['Yes — the Golgi can finish it', 'No — it never gets that far'], right: 1 },
    { id: 'nogolgi', text: 'Put the ER back, take out the Golgi, and make a few.',
      how: 'Tap the Rough ER to restore it, tap the Golgi to take it out, and press “Make a protein” a few times.',
      ask: 'with no Golgi, what happens to the vesicles that arrive?',
      opts: ['They pile up — nothing sorts or ships them', 'They go out anyway'], right: 0 },
    { id: 'novesicle', text: 'Cut the vesicles that carry protein from the ER.',
      how: 'Restore the Golgi, tap the first Vesicle to take it out, and make a few.',
      ask: 'what does the rough ER do when its vesicles are cut?',
      opts: ['It fills up with protein it cannot send', 'It carries on shipping'], right: 0 },
    { id: 'smooth', text: 'Peel the ribosomes off the ER to make it smooth ER.',
      how: 'Press “Make it smooth ER”, then make a protein.',
      ask: 'does smooth ER take part in this line?',
      opts: ['Yes — it is the same room', 'No — it has no ribosomes'], right: 1 },
    { id: 'five', text: 'Put everything back and deliver five proteins.',
      how: 'Restore every station, switch on “Keep it running”, and wait.',
      ask: 'which room decides where a finished protein goes?',
      opts: ['The ribosome', 'The rough ER', 'The Golgi'], right: 2 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<circle cx="34" cy="64" r="14" fill="var(--fn-genetic)"/>' +
    '<g fill="var(--fn-protein)"><circle cx="70" cy="64" r="6"/><circle cx="80" cy="60" r="6"/></g>' +
    '<path d="M98 80 q8 -10 16 0 t16 0 M98 90 q8 -10 16 0 t16 0" fill="none" stroke="var(--fn-protein)" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M144 60 q10 -14 22 -6 M144 68 q10 -14 22 -6 M144 76 q10 -14 22 -6" fill="none" stroke="var(--fn-protein)" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M48 64 H60 M134 76 H142" stroke="currentColor" stroke-width="2" stroke-dasharray="3 4"/></svg>';

  BL.register({
    id: 'line', field: 'jobs', order: 2, name: 'Assembly Line',
    tagline: 'Build it, modify it, ship it. Take any room out and see what stops.',
    lede: 'A protein is built by a ribosome, modified in the rough ER, carried by a vesicle to the Golgi, finished and sorted there, and carried out in a new vesicle. Run the line, then take the rooms out one at a time and see where it piles up.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        broken: {}, smooth: false, items: [], run: false, since: 0, delivered: 0, hinted: false, t: 0, made: 0, stuckT: { er: 0, golgi: 0, ves1: 0 }, last: '', seq: 0,
      };
      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A protein assembly line inside a cell: a nucleus, a ribosome, the rough ER, a vesicle, the Golgi apparatus and a second vesicle, in a row. Proteins pass along it. Tapping any station takes it out so you can see what stops. Controls are in the side panel.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- dock ---------------- */
      const makeBtn = h('button', { type: 'button', class: 'action', onclick: () => { make(); S.hinted = true; } }, 'Make a protein');
      const runBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.run = !S.run; S.hinted = true; runBtn.setAttribute('aria-pressed', String(S.run)); } }, 'Keep it running');
      const smoothBtn = h('button', { type: 'button', class: 'chip soft', 'aria-pressed': 'false', onclick: () => { S.smooth = !S.smooth; S.hinted = true; smoothBtn.setAttribute('aria-pressed', String(S.smooth)); smoothBtn.textContent = S.smooth ? 'Put the ribosomes back (rough ER)' : 'Make it smooth ER'; if (S.smooth) say('Smooth ER: the same membrane with no ribosomes on it. It is not on this route, so nothing gets through.'); } }, 'Make it smooth ER');
      dock.appendChild(h('section', {}, h('h2', {}, 'The line'), h('div', { class: 'actions' }, makeBtn), h('div', { class: 'chips' }, runBtn),
        h('p', { class: 'hint' }, 'Tap any station in the picture to take it out, and tap it again to put it back.')));
      dock.appendChild(h('section', {}, h('h2', {}, 'The ER'), h('div', { class: 'chips' }, smoothBtn)));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'line', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const outM = BL.meter('Finished proteins delivered'), waitM = BL.meter('Waiting somewhere, unfinished');
      aux.appendChild(h('section', { class: 'panel' }, statusP, h('div', { class: 'meters' }, outM.el, waitM.el),
        h('div', { class: 'legend' }, h('span', { class: 'fn-chip', style: '--c: var(--fn-protein)' }, 'protein management: build, ship, finish'))));
      const c3 = BL.stage(h('div'), '1.9 / 1', { label: 'The same line in three dimensions: a nucleus, a sheet of rough ER, a vesicle and a stack of Golgi plates. Whichever room a protein is in lights up. You can drag to turn it.', focusable: true });
      c3.wrap.classList.add('flat');
      const V3 = BL.view3d(c3.canvas, { yaw: 0.4, pitch: 0.25, auto: 0, onturn: () => { S.hinted = true; } });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'The same line, in three dimensions'), c3.wrap,
        h('p', { class: 'hint' }, 'The ER is an extension of the nucleus’s own envelope, so the line starts right beside the plans. Whatever room a protein is in lights up.')));
      const L3 = (() => { const a = K.layout('animal'), pick = (s) => a.find((i) => i.s === s); const N = pick('nucleus'); return { nuc: Object.assign({}, N, { p: { x: -1.0, y: 0.15, z: 0 }, r: 0.42 }), er: Object.assign({}, pick('er'), { p: { x: -0.25, y: 0.1, z: 0.1 }, R: 0.46, count: 5, gap: 0.1 }), golgi: Object.assign({}, pick('golgi'), { p: { x: 0.95, y: -0.05, z: 0 }, R: 0.34, count: 6, gap: 0.09 }), v: { s: 'vesicle', p: { x: 0.35, y: 0.0, z: 0.0 }, r: 0.07 } }; })();

      /* ---------------- the line, running ---------------- */
      function say(t) { if (t !== S.last) { S.last = t; statusP.textContent = t; } }
      function make() {
        if (S.items.filter((i) => i.at === 0 && i.phase === 'work').length) return;          // one at a time at the door
        S.items.push({ id: ++S.seq, at: 0, phase: 'work', p: 0, mv: 0, born: S.t }); S.made++;
      }
      const ok = (i) => !S.broken[ST[i].id] && !(ST[i].id === 'er' && S.smooth);
      function step(dt) {
        S.t += dt;
        if (S.run) { S.since += dt; if (S.since > 3.4) { S.since = 0; make(); } }
        const busy = (i, me) => S.items.some((o) => o !== me && o.at === i && (o.phase === 'work' || (o.phase === 'wait')));
        S.items.forEach((it) => {
          if (it.phase === 'out') { it.fade = (it.fade || 0) + dt; return; }
          if (it.phase === 'work') {
            if (ok(it.at)) it.p += dt / DUR[it.at];
            if (it.p >= 1) { it.phase = it.at === ST.length - 1 ? 'out' : 'move'; it.mv = 0; if (it.phase === 'out') { S.delivered++; it.fade = 0; steps.done('run'); } }
          } else if (it.phase === 'move') {
            const nx = it.at + 1;
            // wait at the door of the next room until it is free and working
            if (it.mv < 0.8) it.mv += dt / 1.1;
            else if (!ok(nx) || busy(nx, it)) { it.mv = 0.8; it.waiting = nx; }
            else { it.mv += dt / 0.6; it.waiting = null; }
            if (it.mv >= 1) { it.at = nx; it.phase = 'work'; it.p = 0; it.mv = 0; }
          }
        });
        S.items = S.items.filter((i) => !(i.phase === 'out' && i.fade > 2.2));
        // who is stuck where
        const stuck = (id) => S.items.filter((i) => i.phase === 'move' && i.waiting === ST.findIndex((s) => s.id === id)).length + S.items.filter((i) => i.phase === 'work' && ST[i.at].id === id && !ok(i.at)).length;
        ['er', 'golgi', 'ves1'].forEach((id) => { S.stuckT[id] = stuck(id) > 0 ? S.stuckT[id] + dt : 0; });
        if (S.broken.er && S.stuckT.er > 3) steps.done('noer');
        if (S.broken.golgi && S.items.filter((i) => i.phase === 'move' && i.waiting === 4).length >= 1 && S.stuckT.golgi > 3) steps.done('nogolgi');
        if (S.broken.ves1 && S.items.filter((i) => ST[i.at].id === 'er' && i.phase === 'work').length + stuck('ves1') >= 1 && S.stuckT.ves1 > 3) steps.done('novesicle');
        if (S.smooth && S.items.some((i) => i.at === 1 && i.phase === 'move' && i.waiting === 2)) steps.done('smooth');
        if (!Object.values(S.broken).some(Boolean) && !S.smooth && S.delivered >= 5) steps.done('five');
      }

      /* ---------------- pointer ---------------- */
      const pos = (s) => ({ x: s.x * stage.w, y: s.y * stage.h });
      BL.drag(stage.canvas, {
        pick: (p) => { let best = -1, bd = 46; ST.forEach((s, i) => { const q = pos(s), d = Math.hypot(p.x - q.x, p.y - q.y); if (i > 0 && d < bd) { bd = d; best = i; } }); return best > 0 ? { i: best } : null; },
        move: () => { },
        end: (a) => { S.hinted = true; const id = ST[a.i].id; S.broken[id] = !S.broken[id]; say(S.broken[id] ? ST[a.i].fail : ST[a.i].name + ' is back.'); },
      });

      /* ---------------- drawing ---------------- */
      function frame(dt) {
        const cw = stage.w, chh = stage.h, pal = BL.pal; if (!cw) return;
        step(dt);
        ctx.clearRect(0, 0, cw, chh);
        const col = pal.fn.protein;
        // the cell and the outside
        ctx.save(); ctx.beginPath(); ctx.roundRect(8, 8, cw * 0.93 - 8, chh - 16, 36);
        ctx.fillStyle = BL.mixHex(pal.panel, pal.fn.struct, 0.1); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = pal.fn.struct; ctx.stroke(); ctx.restore();
        BL.label(ctx, 'outside', cw * 0.965, chh * 0.12, { font: BL.font(700, 12), border: pal.muted });

        const P = ST.map(pos);
        // the route, faintly, so the order reads before anything moves
        ctx.save(); ctx.strokeStyle = BL.alpha(pal.fg, 0.18); ctx.lineWidth = 3; ctx.setLineDash([4, 7]); ctx.beginPath(); P.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.lineTo(cw * 0.965, P[5].y - 14); ctx.stroke(); ctx.restore();

        // stations
        const sz = Math.min(cw / 9, chh / 5);
        ST.forEach((s, i) => {
          const q = P[i], dead = !ok(i), a = dead ? 0.35 : 1;
          ctx.save(); ctx.globalAlpha = a;
          if (s.id === 'nuc') { const g = ctx.createRadialGradient(q.x - sz * 0.15, q.y - sz * 0.2, 4, q.x, q.y, sz * 0.62); g.addColorStop(0, BL.mixHex(pal.fn.genetic, '#ffffff', 0.4)); g.addColorStop(1, pal.fn.genetic); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, sz * 0.6, 0, 6.2832); ctx.fill(); ctx.strokeStyle = pal.fg; ctx.lineWidth = 1.6; for (let k = 0; k < 4; k++) { const th = -0.2 + k * 0.5; ctx.beginPath(); ctx.arc(q.x + Math.cos(th) * sz * 0.6, q.y + Math.sin(th) * sz * 0.6, 4, 0, 6.2832); ctx.stroke(); } }
          else if (s.id === 'ribo') { [[-0.12, 0.08, 0.2], [0.12, -0.06, 0.28]].forEach(([dx, dy, r]) => { ctx.fillStyle = col; ctx.strokeStyle = pal.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(q.x + dx * sz, q.y + dy * sz, r * sz, 0, 6.2832); ctx.fill(); ctx.stroke(); }); }
          else if (s.id === 'er') { for (let k = 0; k < 4; k++) { ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); for (let u = 0; u <= 10; u++) { const x = q.x - sz * 0.95 + u * sz * 0.19, y = q.y - sz * 0.28 + k * sz * 0.2 + Math.sin(u * 1.3 + k) * 5; u ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); if (!S.smooth) { ctx.fillStyle = BL.mixHex(col, '#000000', 0.45); for (let u = 1; u < 10; u += 2) { ctx.beginPath(); ctx.arc(q.x - sz * 0.95 + u * sz * 0.19, q.y - sz * 0.28 + k * sz * 0.2 + Math.sin(u * 1.3 + k) * 5 - 7, 3, 0, 6.2832); ctx.fill(); } } } }
          else if (s.id === 'golgi') { for (let k = 0; k < 5; k++) { ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(q.x + (k - 2) * 0, q.y - sz * 0.5 + k * sz * 0.22 + sz * 0.7, sz * 0.62 - Math.abs(k - 2) * 4, -2.5, -0.64); ctx.stroke(); } }
          else { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(q.x, q.y, sz * 0.3, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = BL.alpha(col, 0.15); ctx.fill(); }
          ctx.restore();
          if (dead) { ctx.strokeStyle = pal.pos; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q.x - 16, q.y - 16); ctx.lineTo(q.x + 16, q.y + 16); ctx.moveTo(q.x + 16, q.y - 16); ctx.lineTo(q.x - 16, q.y + 16); ctx.stroke(); }
          BL.label(ctx, (s.id === 'er' && S.smooth ? 'Smooth ER' : s.name), q.x, q.y + sz * (s.id === 'er' ? 0.78 : s.id === 'golgi' ? 0.78 : 0.78), { font: BL.font(700, 13), border: dead ? pal.pos : col });
        });

        // the proteins
        const cell = (it) => {
          const a = P[it.at], b = it.phase === 'move' || it.waiting ? P[Math.min(it.at + 1, 5)] : a;
          let x = a.x, y = a.y;
          if (it.phase === 'move') { const u = it.mv * it.mv * (3 - 2 * it.mv); x = a.x + (b.x - a.x) * u; y = a.y + (b.y - a.y) * u; }
          if (it.phase === 'out') { x = cw * 0.965; y = P[5].y - 14 - (it.fade || 0) * 10; }
          return { x, y };
        };
        S.items.forEach((it) => {
          const q = cell(it), stage_ = it.at + (it.phase === 'move' ? it.mv : it.p) * 0, beads = 3 + Math.round(clamp(it.at === 1 ? it.p : it.at < 1 ? 0 : 1, 0, 1) * 5);
          ctx.save(); ctx.globalAlpha = it.phase === 'out' ? Math.max(0, 1 - (it.fade || 0) / 2.2) : 1;
          const built = it.at >= 2 || (it.at === 1 && it.phase !== 'work');
          const n = it.at === 0 ? 0 : it.at === 1 && it.phase === 'work' ? 2 + Math.round(it.p * 6) : 8;
          if (it.at === 0 && it.phase === 'work') { // the instructions: a thin strand leaving through a pore
            ctx.strokeStyle = pal.fn.genetic; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const xx = q.x + sz * 0.6 + k * 5 * (0.3 + it.p), yy = q.y + Math.sin(k * 1.5 + S.t * 4) * 4; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke();
          } else {
            const folded = it.at >= 2, r = 5.5;
            for (let k = 0; k < n; k++) {
              const ang = folded ? k * 0.85 : 0, rad = folded ? 3 + k * 1.1 : 0;
              const bx = folded ? q.x + Math.cos(ang) * rad : q.x - (n * r) / 2 + k * (r * 1.7), by = folded ? q.y + Math.sin(ang) * rad : q.y + Math.sin(k * 0.9 + S.t * 3) * 3;
              ctx.fillStyle = BL.mixHex(col, '#ffffff', 0.12 * (k % 2)); ctx.strokeStyle = pal.fg; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, r, 0, 6.2832); ctx.fill(); ctx.stroke();
            }
            if (it.at >= 2 && !(it.at === 2 && it.p < 0.5 && it.phase === 'work')) { ctx.fillStyle = pal.fn.energy; ctx.beginPath(); for (let k = 0; k < 6; k++) { const th = k * 1.0472; k ? ctx.lineTo(q.x + 9 + Math.cos(th) * 4, q.y - 9 + Math.sin(th) * 4) : ctx.moveTo(q.x + 9 + Math.cos(th) * 4, q.y - 9 + Math.sin(th) * 4); } ctx.closePath(); ctx.fill(); }       // modified: a sugar tag
            if (it.at >= 4 && !(it.at === 4 && it.p < 0.55 && it.phase === 'work')) { ctx.fillStyle = pal.fn.divide; ctx.beginPath(); ctx.moveTo(q.x - 10, q.y - 14); ctx.lineTo(q.x - 2, q.y - 14); ctx.lineTo(q.x - 6, q.y - 7); ctx.closePath(); ctx.fill(); }          // sorted: a shipping label
            if (it.at === 3 || it.at === 5 || (it.phase === 'move' && (it.at === 2 || it.at === 4))) { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.fillStyle = BL.alpha(col, 0.18); ctx.beginPath(); ctx.arc(q.x, q.y, 18, 0, 6.2832); ctx.fill(); ctx.stroke(); }                 // in a vesicle
          }
          ctx.restore();
          if (it.waiting != null && it.phase === 'move') { BL.label(ctx, 'waiting', q.x, q.y - 28, { font: BL.font(700, 11), border: pal.pos }); }
        });
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'press “Make a protein”, or tap a room to take it out', cw / 2, chh - 18, { font: BL.font(700, 14), border: pal.ui });

        // words
        const waiting = S.items.filter((i) => i.phase !== 'out').length;
        outM.set(clamp(S.delivered / 6, 0, 1), S.delivered ? S.delivered + ' out' : 'none yet'); outM.tone(col);
        waitM.set(clamp(waiting / 5, 0, 1), waiting ? waiting + ' on the line' : 'the line is empty'); waitM.tone(pal.muted);
        const dead = ST.filter((s, i) => i > 0 && !ok(i));
        if (dead.length) say(dead.map((s) => s.fail).join(' '));
        else if (S.smooth) say('Smooth ER has no ribosomes, so it is not on this route.');
        else if (!S.items.length) say('Press “Make a protein”. The route is: nucleus, ribosome, rough ER, vesicle, Golgi, vesicle, out.');
        else { const w = S.items[S.items.length - 1]; say(w.phase === 'out' ? 'Delivered. It left in a vesicle that fused with the membrane.' : ST[w.at].name + ': ' + ST[w.at].does + '.'); }
        draw3(dt);
      }

      /* ---------------- 3D ---------------- */
      function draw3(dt) {
        const c = c3.ctx, W = c3.w, H = c3.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        V3.step(dt); if (!V3.userTurned && !V3.goal && !BL.reduced) V3.yaw = 0.4 + 0.45 * Math.sin(S.t * 0.4);
        V3.frame(W, H, 1.25, { x: 0, y: 0, z: 0 });
        const active = new Set(S.items.filter((i) => i.phase !== 'out').map((i) => ST[i.at].id));
        const ring = (inst, on) => V3.add(V3.project(inst.p).z + 0.001, () => { if (on && inst._sr) { c.save(); c.strokeStyle = pal.fg; c.lineWidth = 3; c.setLineDash([6, 4]); c.beginPath(); c.arc(inst._sx, inst._sy, inst._sr + 6, 0, 6.2832); c.stroke(); c.restore(); } });
        [[L3.nuc, active.has('nuc') || active.has('ribo')], [L3.er, active.has('er')], [L3.golgi, active.has('golgi')]].forEach(([inst, on]) => { const q = V3.project(inst.p); V3.add(q.z, () => K.drawInst(c, V3, inst, { alpha: 1 })); ring(inst, on); });
        // a vesicle that travels from the ER to the Golgi whenever something is in transit
        const tr = S.items.find((i) => i.phase === 'move' && (i.at === 2 || i.at === 3));
        const f = tr ? (tr.at === 2 ? tr.mv * 0.5 : 0.5 + tr.mv * 0.5) : 0;
        if (tr) { const p = { x: L3.er.p.x + (L3.golgi.p.x - L3.er.p.x) * f, y: L3.er.p.y + (L3.golgi.p.y - L3.er.p.y) * f + 0.12 * Math.sin(f * 3.14), z: 0.1 }; const q = V3.project(p); V3.add(q.z + 5, () => K.ball(c, V3, p, 0.07, pal.fn.protein, { ring: pal.fg })); }
        V3.flush();
        const lab = (inst, t) => { if (inst._sr) BL.label(c, t, inst._sx, Math.min(H - 12, inst._sy + inst._sr + 16), { font: BL.font(700, 12), border: pal.fn.protein }); };
        lab(L3.nuc, 'nucleus'); lab(L3.er, 'rough ER'); lab(L3.golgi, 'Golgi');
        V3.cue(c, pal);
      }

      say('Press “Make a protein”. The route is: nucleus, ribosome, rough ER, vesicle, Golgi, vesicle, out.');
      if (window.__BL_TEST) window.__BL_TEST['line'] = S;   // lets a test page find things by their real coordinates
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); c3.destroy(); } };
    },
  });
})();
