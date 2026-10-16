/* Complement: write the other strand.

   The chapter's DNA half starts with one skill that Chapter 9 needs again: given one strand, write the other.
   A pairs with T, G pairs with C — a purine with a pyrimidine — and the two strands run in opposite directions,
   so 5'-TACTG-3' faces 3'-ATGAC-5'. It is easy to learn as a rule and fail as a skill, so this is a place to
   practise it, with the reason attached to every wrong answer.

   Life Lab's Letters already showed WHY only two pairs fit: a pair has to be the right width, and then the places
   the two bases hold on have to line up. This uses the same two tests, so a wrong pair is told which one it
   failed ("two double rings, too wide", "right width, but the hydrogen bonds don't match"), and the four bases
   keep the colours and the ring shapes they had there.

   What is new is direction. The top strand is read left to right, 5' to 3'. The strand it faces runs the other
   way, so its 5' end is on the right. The arrows show it, a switch reads the new strand in its own direction
   (which turns TACTG's partner from ATGAC into CAGTA), and the helix underneath is the same pair of strands as a
   solid, with its rungs filling in as you place them. The helix is a drawing of the arrangement, not of true
   geometry: ten base pairs to a turn is not drawn to scale. */
(function () {
  'use strict';
  const { h, clamp } = BL;

  /* ring: 2 for a double-ring base (a purine), 1 for a single-ring one (a pyrimidine); edge as in Letters */
  const BASES = {
    A: { id: 'A', name: 'adenine', ring: 2, edge: 'DA', col: () => BL.pal.eN },
    T: { id: 'T', name: 'thymine', ring: 1, edge: 'AD', col: () => BL.pal.electron },
    G: { id: 'G', name: 'guanine', ring: 2, edge: 'ADD', col: () => BL.pal.tIondipole },
    C: { id: 'C', name: 'cytosine', ring: 1, edge: 'DAA', col: () => BL.pal.tDipole },
  };
  const ORDER = ['A', 'T', 'G', 'C'];
  const flip = (e) => e.split('').map((c) => (c === 'D' ? 'A' : 'D')).join('');
  function fit(x, y) {
    const a = BASES[x], b = BASES[y], w = a.ring + b.ring;
    if (w > 3) return { ok: false, why: 'Two double rings are too wide: ' + a.name + ' and ' + b.name + ' would shove the two rails apart.' };
    if (w < 3) return { ok: false, why: 'Two single rings are too narrow: ' + a.name + ' and ' + b.name + ' would pinch the rails together.' };
    if (a.edge.length !== b.edge.length || flip(a.edge) !== b.edge) return { ok: false, why: 'The width is right, but ' + a.name + ' and ' + b.name + ' do not line up: the places that offer a hydrogen would face each other, or find nothing to hold.' };
    return { ok: true, bonds: a.edge.length, why: a.id + ' and ' + b.id + ' fit: the width is right and every hydrogen on one side meets a place to hold it on the other. ' + a.edge.length + ' hydrogen bonds.' };
  }
  const partner = (x) => ORDER.find((y) => fit(x, y).ok);

  const STEPS = [
    { id: 'first', text: 'Place the first base opposite the one it faces.',
      how: 'Drag a base from the tray to the empty slot, or tap a base and then tap the slot.',
      ask: 'across from a T on one strand, the other strand has an…',
      opts: ['A', 'G', 'C'], right: 0 },
    { id: 'wrong', text: 'Put a wrong base opposite one on purpose.',
      how: 'Try a G opposite an A, or anything that is not a partner, and read what it says.',
      ask: 'will a G fit opposite an A?',
      opts: ['Yes — both are bases', 'No — the shapes are wrong'], right: 1 },
    { id: 'strand', text: 'Complete a whole strand.',
      how: 'Fill every empty slot.',
      ask: 'which base pairs with G?',
      opts: ['C', 'T', 'A'], right: 0 },
    { id: 'way', text: 'Read the new strand the way it runs.',
      how: 'Complete a strand, then press “Read it 5′ → 3′”. Watch the order of the letters.',
      ask: 'if the top strand runs 5′ to 3′ left to right, the strand across from it runs…',
      opts: ['The same way', 'The opposite way'], right: 1 },
    { id: 'five', text: 'Complete five strands.',
      how: 'Press “Another strand” each time.',
      ask: 'if you know one strand, how much do you know about the other?',
      opts: ['Nothing — they are separate', 'All of it'], right: 1 },
    { id: 'turn', text: 'Turn the helix and watch the two strands run the other way.',
      how: 'Drag in “The same strands as a helix”. The arrows are the 3′ ends.' },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g stroke="var(--fn-genetic)" stroke-width="5" stroke-linecap="round"><path d="M40 40 H160"/><path d="M160 84 H40"/></g>' +
    '<g stroke-width="5" stroke-linecap="round"><path d="M56 44 V80" stroke="var(--e-n)"/><path d="M80 44 V80" stroke="var(--electron)"/><path d="M104 44 V80" stroke="var(--t-iondipole)"/><path d="M128 44 V80" stroke="var(--t-dipole)"/></g></svg>';

  BL.register({
    id: 'complement', field: 'thread', order: 0, name: 'Complement',
    tagline: 'Know one strand, and you know the other.',
    lede: 'DNA is two strands facing each other, running in opposite directions. Given one, write the other: A with T, G with C. When you get one wrong, it says which of the two tests it failed — then watch the same strands become a helix.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const rnd = (n) => Math.floor(Math.random() * n);
      const newStrand = (first) => (first ? 'TACTG' : Array.from({ length: 5 }, () => ORDER[rnd(4)]).join(''));
      const S = { top: newStrand(true), bot: [null, null, null, null, null], sel: null, done: 0, wrong: 0, hinted: false, read: false, shake: -1, shakeT: 0, ghost: null, over: -1, msg: '', t: 0, flash: [], first: true };
      const stage = BL.stage(stageHost, '8 / 4.6', {
        label: 'Two strands of DNA facing each other. The top strand is given. The bottom strand has empty slots, and you fill each with the base that pairs with the one above it, by dragging a base from the tray or by tapping a base and then a slot. The directions of the two strands are marked at their ends.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- dock ---------------- */
      const readBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.read = !S.read; readBtn.setAttribute('aria-pressed', String(S.read)); if (S.read && S.bot.every(Boolean)) steps.done('way'); } }, 'Read it 5′ → 3′');
      dock.appendChild(h('section', {}, h('h2', {}, 'The strand'), h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action', onclick: () => next() }, 'Another strand')), h('div', { class: 'chips' }, readBtn),
        h('p', { class: 'hint' }, 'The first strand is the chapter’s own: 5′-TACTG-3′.')));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'complement', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' }, 'Fill the empty slots. A pairs with T and G with C — but the reason is shape, and it will tell you.');
      const pairM = BL.meter('Pairs placed'), doneM = BL.meter('Strands completed');
      aux.appendChild(h('section', { class: 'panel' }, statusP, h('div', { class: 'meters' }, pairM.el, doneM.el),
        h('div', { class: 'legend' }, ...ORDER.map((id) => h('span', { class: 'chip', style: 'background:' + BL.alpha(BASES[id].col(), 0.22) + ';border-color:' + BASES[id].col() }, id + ' · ' + (BASES[id].ring === 2 ? 'double ring' : 'single ring'))))));
      const c3 = BL.stage(h('div'), '1.9 / 1', { label: 'The two strands as a three-dimensional double helix. Each rung is a pair of bases, coloured as the bases are, and the rungs fill in as pairs are placed. Arrows mark which way each strand runs. Drag to turn it.', focusable: true });
      c3.wrap.classList.add('flat');
      const V3 = BL.view3d(c3.canvas, { yaw: 0.4, pitch: 0.2, auto: 0.3, onturn: () => { if (V3.turned > 1.3) steps.done('turn'); } });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'The same strands as a helix'), c3.wrap,
        h('p', { class: 'hint' }, 'Bases are the rungs and the sugar–phosphate backbones are the rails. The two rails run in opposite directions: antiparallel.')));
      function say(t) { statusP.textContent = t; S.msg = t; }
      function next() { S.top = newStrand(false); S.bot = [null, null, null, null, null]; S.read = false; readBtn.setAttribute('aria-pressed', 'false'); S.sel = null; say('A new strand. Write the one across from it.'); }

      /* ---------------- placing a base ---------------- */
      function place(i, id) {
        if (S.bot[i]) return;
        const t = S.top[i], r = fit(t, id);
        S.hinted = true;
        if (r.ok) {
          S.bot[i] = id; S.flash.push({ i, t: 0 }); say(r.why);
          if (S.first) { S.first = false; steps.done('first'); }
          if (S.bot.every(Boolean)) {
            S.done++; steps.done('strand'); if (S.done >= 5) steps.done('five');
            say('The strand is complete: 5′-' + S.top + '-3′ faces 3′-' + S.bot.join('') + '-5′. Press “Read it 5′ → 3′” to see it the way it runs.');
          }
        } else { S.wrong++; S.shake = i; S.shakeT = 1; say(r.why); steps.done('wrong'); }
        S.sel = null;
      }

      /* ---------------- pointer ---------------- */
      const geo = () => { const w = stage.w, hh = stage.h, n = 5, sw = Math.min(w * 0.12, 96), x0 = (w - n * sw) / 2, yTop = hh * 0.18, yBot = hh * 0.45, tray = hh * 0.88; return { w, hh, n, sw, x0, yTop, yBot, tray, tileW: Math.min(w * 0.1, 80) }; };
      const slotAt = (p) => { const g = geo(); for (let i = 0; i < g.n; i++) { const cx = g.x0 + (i + 0.5) * g.sw; if (Math.abs(p.x - cx) < g.sw / 2 && Math.abs(p.y - g.yBot) < 54) return i; } return -1; };
      const tileAt = (p) => { const g = geo(); for (let k = 0; k < 4; k++) { const cx = g.w / 2 + (k - 1.5) * (g.tileW * 1.3); if (Math.abs(p.x - cx) < g.tileW / 2 + 4 && Math.abs(p.y - g.tray) < 44) return ORDER[k]; } return null; };
      BL.drag(stage.canvas, {
        pick: (p) => { const t = tileAt(p); if (t) return { tile: t, moved: 0, x0: p.x, y0: p.y }; const i = slotAt(p); if (i >= 0 && S.sel && !S.bot[i]) return { slot: i }; return null; },
        move: (a, p) => { S.hinted = true; if (a.tile) { a.moved = Math.hypot(p.x - a.x0, p.y - a.y0); if (a.moved > 8) { S.ghost = { id: a.tile, x: p.x, y: p.y }; S.over = slotAt(p); } } },
        end: (a, p) => {
          if (a.tile) { S.ghost = null; const i = slotAt(p); S.over = -1; if (a.moved > 8) { if (i >= 0) place(i, a.tile); } else S.sel = S.sel === a.tile ? null : a.tile; }
          else if (a.slot != null) place(a.slot, S.sel);
        },
      });

      /* ---------------- drawing ---------------- */
      function baseBlock(id, cx, cy, sw, o) {
        const b = BASES[id], pal = BL.pal, wd = sw * 0.78, ht = b.ring === 2 ? sw * 0.9 : sw * 0.55;
        ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
        ctx.fillStyle = BL.alpha(b.col(), 0.28); ctx.strokeStyle = b.col(); ctx.lineWidth = o.sel ? 5 : 3;
        const x = cx - wd / 2, y = cy - ht / 2 + (o.down ? 0 : 0);
        ctx.beginPath(); ctx.roundRect(x, y, wd, ht, 14); ctx.fill(); ctx.stroke();
        // the rings: two for a purine, one for a pyrimidine
        ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(b.col(), 0.75);
        const rr = sw * 0.17;
        if (b.ring === 2) { ctx.beginPath(); ctx.arc(cx - rr * 0.9, cy + ht * 0.18, rr, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + rr * 0.9, cy + ht * 0.18, rr, 0, 6.2832); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(cx, cy + ht * 0.1, rr, 0, 6.2832); ctx.stroke(); }
        ctx.fillStyle = pal.fg; ctx.font = BL.font(800, Math.max(18, sw * 0.28)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(id, cx, cy - ht * 0.22);
        ctx.restore();
        return { w: wd, h: ht };
      }
      function frame(dt) {
        const g = geo(), pal = BL.pal; if (!g.w) return;
        S.t += dt; if (S.shakeT > 0) S.shakeT = Math.max(0, S.shakeT - dt * 2.2);
        S.flash.forEach((f) => (f.t += dt)); S.flash = S.flash.filter((f) => f.t < 1);
        ctx.clearRect(0, 0, g.w, g.hh);
        const sw = g.sw, rail = pal.eP;
        // the rails: backbones above and below, and the direction each strand runs
        const xl = g.x0 - 20, xr = g.x0 + g.n * sw + 20;
        ctx.strokeStyle = BL.alpha(rail, 0.9); ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(xl, g.yTop - 48); ctx.lineTo(xr, g.yTop - 48); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xl, g.yBot + 48); ctx.lineTo(xr, g.yBot + 48); ctx.stroke();
        const arrow = (x, y, dir, text) => { ctx.fillStyle = pal.fg; ctx.beginPath(); ctx.moveTo(x + 11 * dir, y); ctx.lineTo(x - 2 * dir, y - 9); ctx.lineTo(x - 2 * dir, y + 9); ctx.closePath(); ctx.fill(); };
        arrow(xr + 8, g.yTop - 48, 1); arrow(xl - 8, g.yBot + 48, -1);
        ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('5′', xl - 24, g.yTop - 48); ctx.fillText('3′', xr + 28, g.yTop - 48);
        ctx.fillText('3′', xl - 28, g.yBot + 48); ctx.fillText('5′', xr + 24, g.yBot + 48);
        // the strands
        for (let i = 0; i < g.n; i++) {
          const cx = g.x0 + (i + 0.5) * sw;
          baseBlock(S.top[i], cx, g.yTop, sw, {});
          const filled = S.bot[i], over = S.over === i, sh = S.shake === i ? Math.sin(S.shakeT * 30) * 8 * S.shakeT : 0;
          if (filled) {
            baseBlock(filled, cx, g.yBot, sw, {});
            // hydrogen bonds between them, two for A–T and three for G–C
            const nb = BASES[S.top[i]].edge.length, fl = S.flash.find((f) => f.i === i);
            ctx.strokeStyle = pal.tHydrogen; ctx.lineWidth = 3; ctx.setLineDash([4, 4]);
            for (let k = 0; k < nb; k++) { const x = cx + (k - (nb - 1) / 2) * 12; ctx.globalAlpha = fl ? Math.min(1, fl.t * 3) : 1; ctx.beginPath(); ctx.moveTo(x, g.yTop + (BASES[S.top[i]].ring === 2 ? sw * 0.45 : sw * 0.28)); ctx.lineTo(x, g.yBot - (BASES[filled].ring === 2 ? sw * 0.45 : sw * 0.28)); ctx.stroke(); }
            ctx.setLineDash([]); ctx.globalAlpha = 1;
          } else {
            ctx.save(); ctx.strokeStyle = S.shake === i && S.shakeT > 0 ? pal.pos : over ? pal.ui : BL.alpha(pal.fg, 0.35); ctx.lineWidth = over ? 4 : 2.5; ctx.setLineDash([7, 6]);
            ctx.beginPath(); ctx.roundRect(cx - sw * 0.39 + sh, g.yBot - sw * 0.34, sw * 0.78, sw * 0.68, 14); ctx.stroke(); ctx.restore();
            ctx.fillStyle = BL.alpha(pal.fg, 0.4); ctx.font = BL.font(800, 22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', cx + sh, g.yBot);
          }
        }
        // the sequences in words
        const topTxt = "5′-" + S.top + "-3′", full = S.bot.every(Boolean), botSeq = S.bot.map((b) => b || '·').join('');
        ctx.fillStyle = pal.muted; ctx.font = BL.font(700, 15); ctx.textAlign = 'center';
        ctx.fillText(topTxt, g.w / 2, g.yBot + 76);
        ctx.fillStyle = pal.fg; ctx.fillText(S.read ? "5′-" + botSeq.split('').reverse().join('') + "-3′" : "3′-" + botSeq + "-5′", g.w / 2, g.yBot + 98);
        // the tray
        ctx.fillStyle = BL.alpha(pal.panel, 0.6); ctx.strokeStyle = pal.line2; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(g.w / 2 - 4 * g.tileW * 0.72, g.tray - 42, 4 * g.tileW * 1.45, 84, 16); ctx.fill(); ctx.stroke();
        ORDER.forEach((id, k) => { const cx = g.w / 2 + (k - 1.5) * (g.tileW * 1.3); baseBlock(id, cx, g.tray, g.tileW, { sel: S.sel === id, alpha: S.ghost && S.ghost.id === id ? 0.35 : 1 }); });
        if (S.ghost) baseBlock(S.ghost.id, S.ghost.x, S.ghost.y, g.tileW * 1.05, { alpha: 0.92 });
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'drag a base into a slot, or tap one then tap a slot', g.w / 2, g.tray - 56, { font: BL.font(700, 14), border: pal.ui });
        pairM.set(S.bot.filter(Boolean).length / 5, S.bot.filter(Boolean).length + ' of 5'); pairM.tone(pal.tHydrogen);
        doneM.set(clamp(S.done / 5, 0, 1), S.done + ' of 5'); doneM.tone(pal.fn.genetic);
        draw3(dt);
      }

      /* ---------------- the helix ---------------- */
      function draw3(dt) {
        const c = c3.ctx, W = c3.w, H = c3.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        V3.step(dt); V3.frame(W, H, 1.75, { x: 0, y: 0, z: 0 });
        const N = 15, R = 0.85, dy = 0.22, c0 = 5, v = (x, y, z) => ({ x, y, z });
        const A = [], B = [];
        for (let i = 0; i < N; i++) { const th = i * 0.62, y = (i - (N - 1) / 2) * dy; A.push(v(Math.cos(th) * R, y, Math.sin(th) * R)); B.push(v(Math.cos(th + Math.PI) * R, y, Math.sin(th + Math.PI) * R)); }
        const PA = A.map((p) => V3.project(p)), PB = B.map((p) => V3.project(p)), rail = pal.eP, rb = 0.05 * V3.scale;
        for (let i = 0; i < N - 1; i++) {
          V3.add((PA[i].z + PA[i + 1].z) / 2, () => BL.stick3(c, PA[i], PA[i + 1], rb * 1.4, { color: BL.alpha(rail, 0.55 + 0.4 * Math.min(PA[i].d, PA[i + 1].d)) }));
          V3.add((PB[i].z + PB[i + 1].z) / 2, () => BL.stick3(c, PB[i], PB[i + 1], rb * 1.4, { color: BL.alpha(BL.mixHex(rail, pal.fg, 0.25), 0.55 + 0.4 * Math.min(PB[i].d, PB[i + 1].d)) }));
        }
        for (let i = 0; i < N; i++) {
          const k = i - c0, inside = k >= 0 && k < 5, t = inside ? S.top[k] : null, b = inside ? S.bot[4 - k] : null;
          // the strands run opposite ways: the top strand left to right is the helix's strand A going up, the new strand B comes down
          const mid = v(0, A[i].y, 0), mq = V3.project(mid);
          const colA = t ? BASES[t].col() : BL.alpha(pal.muted, 0.7), colB = inside ? (S.bot[k] ? BASES[S.bot[k]].col() : BL.alpha(pal.muted, 0.35)) : BL.alpha(pal.muted, 0.7);
          V3.add(mq.z - 0.01, () => BL.stick3(c, PA[i], mq, rb * 1.6, { color: BL.alpha(colA, 0.85) }));
          V3.add(mq.z - 0.01, () => BL.stick3(c, mq, PB[i], rb * 1.6, { color: colB.startsWith('#') ? BL.alpha(colB, 0.85) : colB }));
          if (inside && S.bot[k]) V3.add(mq.z, () => BL.sphere3(c, mq, rb * 0.9, pal.tHydrogen, null));
          V3.add(PA[i].z, () => BL.sphere3(c, PA[i], rb * 1.25, rail, null)); V3.add(PB[i].z, () => BL.sphere3(c, PB[i], rb * 1.25, BL.mixHex(rail, pal.fg, 0.25), null));
        }
        V3.flush();
        const top = PA[N - 1], bot = PB[0];
        BL.label(c, '3′', top.x, top.y - 16, { font: BL.font(800, 14), border: rail }); BL.label(c, '5′', PA[0].x, PA[0].y + 16, { font: BL.font(800, 14), border: rail });
        BL.label(c, '5′', PB[N - 1].x, PB[N - 1].y - 16, { font: BL.font(800, 14), border: pal.fg }); BL.label(c, '3′', bot.x, bot.y + 16, { font: BL.font(800, 14), border: pal.fg });
        V3.cue(c, pal);
      }

      if (window.__BL_TEST) window.__BL_TEST.complement = S;
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); c3.destroy(); } };
    },
  });
})();
