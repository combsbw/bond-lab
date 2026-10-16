/* Rings: what a bacterium does with its DNA instead.

   The DNA ladder in Thread is for eukaryotes. The chapter appends the bacterial case last, as a set of contrasts
   that only make sense once the standard one is solid: a bacterium's DNA is a ring, not a line; it has no
   histones, so no nucleosomes and no chromatin, because its small ring needs far less coiling; and it may carry
   extra small rings called plasmids, which can pass between bacteria and can carry resistance to antibiotics.

   The first two are things to look at: tap a bacterium and open it. The plasmid is the one with consequences, so
   it gets a dish. Bacteria wander, grow and divide. A few carry a plasmid with a resistance gene. When a carrier
   touches a bacterium without one, and both have their pili, the plasmid can pass across. Add an antibiotic and
   everything without the plasmid dies, so whoever has it takes over. Cut the pili and the plasmid only goes to a
   bacterium's own daughters, so it spreads far more slowly.

   Nothing here is told to produce resistance. It falls out of three rules: a plasmid is copied into daughters, a
   plasmid can cross a touch, and the drug kills what lacks it. It is a toy: rates are chosen to be watchable,
   resistance can also arise from changes to the main chromosome (not modelled), and the antibiotic is a flat
   dose, not a drug. Antibiotic resistance as a subject is Chapter 22's. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const K = BL.cell;

  const NMAX = 90;
  const STEPS = [
    { id: 'ring', text: 'Tap a bacterium and look at its DNA.',
      how: 'Tap any rod in the dish. Its DNA opens up underneath.',
      ask: 'is a bacterium’s main DNA a ring or a line?',
      opts: ['A ring', 'A line, like ours'], right: 0 },
    { id: 'plasmid', text: 'Find one with a plasmid and open it.',
      how: 'The ones with a small ring and a dot inside carry a plasmid. Tap one.',
      ask: 'what is a plasmid?',
      opts: ['A small extra ring of DNA', 'A kind of organelle', 'A protein'], right: 0 },
    { id: 'spread', text: 'Leave the pili on and let the plasmid spread.',
      how: 'Start over, keep “Pili on”, and wait until more than half the dish carries it.',
      ask: 'one bacterium carries the plasmid. Left to mix, how many end up with it?',
      opts: ['Still just the one', 'Many — they pass it to their neighbours'], right: 1 },
    { id: 'drug', text: 'Add antibiotic to a dish where it has spread.',
      how: 'Press “Add antibiotic” and watch who survives.',
      ask: 'after the antibiotic, who is left?',
      opts: ['Only the bacteria with the plasmid', 'All of them equally', 'None of them'], right: 0 },
    { id: 'nopili', text: 'Cut the pili, start over, and wait.',
      how: 'Switch “Pili on” off, press “Start over”, and wait twenty seconds.',
      ask: 'without pili, can the plasmid pass to a neighbour?',
      opts: ['Yes, by touch alone', 'No — only to its own daughters'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<circle cx="100" cy="60" r="46" fill="none" stroke="var(--line-2)" stroke-width="3"/>' +
    '<g fill="none" stroke="var(--fn-struct)" stroke-width="4"><rect x="62" y="40" width="30" height="12" rx="6"/><rect x="106" y="62" width="30" height="12" rx="6" transform="rotate(30 121 68)"/></g>' +
    '<circle cx="110" cy="44" r="6" fill="none" stroke="var(--fn-genetic)" stroke-width="3.5"/><circle cx="76" cy="46" r="3.5" fill="var(--fn-genetic)"/></svg>';

  BL.register({
    id: 'rings', field: 'thread', order: 2, name: 'Rings',
    tagline: 'A bacterium has a ring, and a spare one to hand out.',
    lede: 'A bacterium keeps its DNA as a ring, with no histones to wind it on, and may carry extra small rings called plasmids. Open one up, then watch a plasmid with a resistance gene spread through a dish — and see what an antibiotic does to who is left.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = { b: [], pili: true, drug: 0, sel: null, t: 0, hinted: false, hist: [], since: 0, everSpread: false, drugged: false, geo: { cx: 0, cy: 0, u: 100 }, links: [], seed: 0, dead: 0, peak: 0 };
      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A petri dish of bacteria seen from above, drawn as rods. Some carry a small ring of DNA called a plasmid, shown as a small ring and dot. They wander, divide, and where two touch with their pili on, a plasmid can pass from one to the other. An antibiotic can be added, which kills the bacteria that lack the plasmid. Tapping a bacterium opens up its DNA underneath.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- the dish ---------------- */
      function reset() {
        S.b = []; S.links = []; S.drug = 0; S.t = 0; S.sel = null; S.dead = 0; S.since = 0; S.drugged = false; S.peak = 0;
        for (let i = 0; i < 30; i++) addB(false); addB(true);
        S.hinted = false; say('A dish of bacteria. One carries a plasmid (the small ring and dot). Tap any of them to look at their DNA.');
      }
      function addB(carrier, at) {
        const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * 0.82;
        S.b.push({ x: at ? at.x : Math.cos(a) * d, y: at ? at.y : Math.sin(a) * d, th: Math.random() * 6.28, car: carrier, life: 1, cycle: 4 + Math.random() * 5, id: ++S.seed });
      }
      const share = () => { const live = S.b.filter((o) => o.life > 0.5); return live.length ? live.filter((o) => o.car).length / live.length : 0; };

      /* ---------------- dock ---------------- */
      const piliBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'true', onclick: () => { S.pili = !S.pili; piliBtn.setAttribute('aria-pressed', String(S.pili)); piliBtn.textContent = S.pili ? 'Pili on' : 'Pili off'; S.hinted = true; } }, 'Pili on');
      const drugBtn = h('button', { type: 'button', class: 'action', onclick: () => { S.drug = 9; S.drugged = true; S.hinted = true; say('Antibiotic added. Anything without the plasmid is going to die.'); } }, 'Add antibiotic');
      dock.appendChild(h('section', {}, h('h2', {}, 'The dish'), h('div', { class: 'actions' }, drugBtn), h('div', { class: 'chips' }, piliBtn),
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action ghost', onclick: () => { addB(true); S.hinted = true; } }, 'Add one with the plasmid'), h('button', { type: 'button', class: 'action ghost', onclick: () => reset() }, 'Start over')),
        h('p', { class: 'hint' }, 'Pili are hair-like fibres that grip another bacterium. The plasmid crosses through them.')));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'rings', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const popM = BL.meter('Bacteria in the dish'), carM = BL.meter('With the plasmid');
      aux.appendChild(h('section', { class: 'panel' }, statusP, h('div', { class: 'meters' }, popM.el, carM.el),
        h('div', { class: 'legend' }, h('span', { class: 'fn-chip', style: '--c: var(--fn-genetic)' }, 'a small ring and dot: the plasmid, with a resistance gene'))));
      const zoom = BL.stage(h('div'), '2 / 1', { label: 'The inside of the bacterium you tapped. Its main DNA is a closed ring, tangled up in a region with no membrane. If it has one, a small separate ring is its plasmid.' });
      zoom.wrap.classList.add('flat');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Inside one bacterium'), zoom.wrap,
        h('p', { class: 'hint' }, 'A ring needs far less winding up than a human chromosome, so there are no histones, no nucleosomes and no chromatin: none of the four steps in Thread.')));
      function say(t) { statusP.textContent = t; }

      /* ---------------- pointer ---------------- */
      const world = (p) => ({ x: (p.x - S.geo.cx) / S.geo.u, y: (p.y - S.geo.cy) / S.geo.u });
      stage.canvas.addEventListener('pointerdown', (e) => {
        const r = stage.canvas.getBoundingClientRect(), w = world({ x: e.clientX - r.left, y: e.clientY - r.top }); let best = null, bd = 0.1;
        S.b.forEach((o) => { if (o.life < 0.5) return; const d = Math.hypot(o.x - w.x, o.y - w.y); if (d < bd) { bd = d; best = o; } });
        S.hinted = true;
        if (best) { S.sel = best; steps.done('ring'); if (best.car) { steps.done('plasmid'); say('This one carries a plasmid: a small extra ring, separate from the main DNA, with a resistance gene on it.'); } else say('Its DNA is one closed ring, in a region with no membrane round it. No plasmid in this one.'); }
      });
      stage.canvas.addEventListener('pointermove', (e) => { const r = stage.canvas.getBoundingClientRect(), w = world({ x: e.clientX - r.left, y: e.clientY - r.top }); stage.canvas.style.cursor = S.b.some((o) => o.life > 0.5 && Math.hypot(o.x - w.x, o.y - w.y) < 0.1) ? 'pointer' : ''; });

      /* ---------------- the step ---------------- */
      function step(dt) {
        S.t += dt; S.since += dt; S.links = S.links.filter((l) => (l.t += dt) < 0.6);
        if (S.drug > 0) S.drug = Math.max(0, S.drug - dt);
        const live = S.b.filter((o) => o.life > 0.5);
        S.b.forEach((o) => {
          if (o.life < 1 && !(o.life > 0.5 && !o.dying)) { }
          if (o.dying) { o.life -= dt * 0.6; return; }
          o.th += (Math.random() - 0.5) * 4 * dt; o.x += Math.cos(o.th) * 0.07 * dt; o.y += Math.sin(o.th) * 0.07 * dt;
          const d = Math.hypot(o.x, o.y); if (d > 0.88) { o.x *= 0.88 / d; o.y *= 0.88 / d; o.th += Math.PI * (0.6 + Math.random() * 0.4); }
          // the drug kills whoever lacks the plasmid
          if (S.drug > 0 && !o.car && Math.random() < 0.55 * dt) o.dying = true;
          o.cycle -= dt;
          if (o.cycle <= 0) { if (live.length < NMAX) { addB(o.car, { x: o.x + (Math.random() - 0.5) * 0.06, y: o.y + (Math.random() - 0.5) * 0.06 }); o.cycle = (o.car ? 6.5 : 5.5) + Math.random() * 4 + live.length * 0.04; } else o.cycle = 1.5; }
        });
        S.b = S.b.filter((o) => o.life > 0);
        // a plasmid crosses a touch, through the pili
        if (S.pili) {
          const L = S.b.filter((o) => !o.dying);
          for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
            const a = L[i], b = L[j]; if (a.car === b.car) continue; if (Math.abs(a.x - b.x) > 0.11 || Math.abs(a.y - b.y) > 0.11) continue;
            if (Math.hypot(a.x - b.x, a.y - b.y) < 0.11 && Math.random() < 0.3 * dt) { const to = a.car ? b : a, from = a.car ? a : b; to.car = true; S.links.push({ a: from, b: to, t: 0 }); }
          }
        }
        const sh = share(), n = S.b.filter((o) => !o.dying).length;
        S.peak = Math.max(S.peak, n);
        if (S.pili && !S.drugged && n > 20 && sh > 0.5) { steps.done('spread'); S.everSpread = true; }
        if (S.drugged && S.drug <= 0 && S.everSpread && sh > 0.9 && n > 3) steps.done('drug');
        if (!S.pili && S.since > 20 && sh < 0.3 && n > 20) steps.done('nopili');
      }

      /* ---------------- drawing ---------------- */
      function frame(dt) {
        const cw = stage.w, chh = stage.h, pal = BL.pal; if (!cw) return;
        step(dt);
        const u = Math.min(cw, chh) * 0.47; S.geo = { cx: cw / 2, cy: chh / 2, u };
        ctx.clearRect(0, 0, cw, chh);
        // the dish, tinted when there is antibiotic in it
        ctx.save(); ctx.beginPath(); ctx.arc(cw / 2, chh / 2, u * 0.96, 0, 6.2832); ctx.fillStyle = BL.mixHex(pal.panel, pal.pos, 0.04 + 0.2 * clamp(S.drug / 3, 0, 1)); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = pal.line2; ctx.stroke(); ctx.restore();
        // a pilus, drawn for a moment as the plasmid crosses
        S.links.forEach((l) => { ctx.strokeStyle = BL.alpha(pal.fn.genetic, 1 - l.t / 0.6); ctx.lineWidth = 3; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cw / 2 + l.a.x * u, chh / 2 + l.a.y * u); ctx.lineTo(cw / 2 + l.b.x * u, chh / 2 + l.b.y * u); ctx.stroke(); ctx.setLineDash([]); });
        S.b.forEach((o) => {
          const x = cw / 2 + o.x * u, y = chh / 2 + o.y * u, L = u * 0.1, W = u * 0.045;
          ctx.save(); ctx.translate(x, y); ctx.rotate(o.th); ctx.globalAlpha = clamp(o.life, 0, 1);
          ctx.fillStyle = BL.mixHex(pal.panel, o.car ? pal.fn.genetic : pal.fn.struct, o.car ? 0.2 : 0.18); ctx.strokeStyle = o.car ? pal.fn.genetic : pal.fn.struct; ctx.lineWidth = S.sel === o ? 4 : 2.4;
          ctx.beginPath(); ctx.roundRect(-L, -W, L * 2, W * 2, W); ctx.fill(); ctx.stroke();
          if (S.pili) { ctx.strokeStyle = BL.alpha(pal.fn.struct, 0.55); ctx.lineWidth = 1.2; [[-L, 0], [L, 0]].forEach(([px, py], k) => { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (k ? 1 : -1) * W * 0.9, py + (k ? -1 : 1) * W * 0.5); ctx.stroke(); }); }
          ctx.fillStyle = BL.alpha(pal.fn.genetic, 0.4); ctx.beginPath(); ctx.ellipse(-L * 0.1, 0, L * 0.45, W * 0.5, 0, 0, 6.2832); ctx.fill();      // the nucleoid, a smudge with no membrane round it
          if (o.car) { ctx.strokeStyle = pal.fn.genetic; ctx.lineWidth = 2.4; ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.beginPath(); ctx.arc(L * 0.55, 0, W * 0.38, 0, 6.2832); ctx.stroke(); ctx.fillStyle = pal.fn.genetic; ctx.beginPath(); ctx.arc(L * 0.55, 0, W * 0.14, 0, 6.2832); ctx.fill(); }
          ctx.restore();
          if (S.sel === o) { ctx.save(); ctx.strokeStyle = pal.fg; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(x, y, L * 1.5, 0, 6.2832); ctx.stroke(); ctx.restore(); }
        });
        if (S.drug > 0) BL.label(ctx, 'antibiotic in the dish', cw / 2, 22, { font: BL.font(700, 13), border: pal.pos });
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'tap a bacterium to open it up', cw / 2, chh - 16, { font: BL.font(700, 14), border: pal.ui });
        const n = S.b.filter((o) => !o.dying).length, sh = share();
        popM.set(n / NMAX, n + ' bacteria'); popM.tone(pal.fn.struct);
        carM.set(sh, sh < 0.05 ? 'almost none' : sh < 0.4 ? Math.round(sh * 100) + '% of them' : sh < 0.9 ? 'about half or more' : 'nearly all'); carM.tone(pal.fn.genetic);
        if (S.t - (S.lastTalk || 0) > 8) { S.lastTalk = S.t; if (S.drug > 0) say('The antibiotic is killing everything without the plasmid. Whoever has it is left to grow.'); else if (S.pili && sh > 0.5) say('The plasmid has spread through the dish, bacterium to bacterium. Now add the antibiotic.'); else if (!S.pili) say('Pili off. The plasmid can only go to a bacterium’s own daughters when it divides, so it spreads slowly.'); }
        drawZoom();
      }
      function drawZoom() {
        const c = zoom.ctx, W = zoom.w, H = zoom.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        const o = S.sel, cx = W / 2, cy = H / 2, r = Math.min(W * 0.23, H * 0.4);
        // a bacterium, opened: a rounded body, with no inner membranes
        c.save(); c.fillStyle = BL.mixHex(pal.panel, pal.fn.struct, 0.1); c.strokeStyle = pal.fn.struct; c.lineWidth = 5; c.beginPath(); c.roundRect(cx - W * 0.42, cy - H * 0.4, W * 0.84, H * 0.8, H * 0.4); c.fill(); c.stroke(); c.restore();
        if (!o) { c.fillStyle = pal.muted; c.font = BL.font(500, 14); c.textAlign = 'center'; c.fillText('Tap a bacterium in the dish to open it.', cx, cy); return; }
        // the main DNA: one closed ring, tangled
        const rng = K.rng(o.id * 7 + 3); c.strokeStyle = pal.fn.genetic; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath();
        for (let i = 0; i <= 90; i++) { const a = i / 90 * 6.2832, rr = r * (0.86 + 0.18 * Math.sin(a * 5 + o.id) + 0.1 * Math.sin(a * 11)), x = cx - W * 0.1 + Math.cos(a) * rr * 1.2, y = cy + Math.sin(a) * rr * 0.9; i ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.closePath(); c.stroke(); c.fillStyle = BL.alpha(pal.fn.genetic, 0.12); c.fill();
        BL.label(c, 'the main DNA: one closed ring', cx - W * 0.1, cy + r * 1.1 + 12, { font: BL.font(700, 12), border: pal.fn.genetic });
        if (o.car) { const px = cx + W * 0.27, py = cy - H * 0.05; c.strokeStyle = pal.ui; c.lineWidth = 4; c.beginPath(); c.arc(px, py, r * 0.3, 0, 6.2832); c.stroke(); c.fillStyle = pal.ui; c.beginPath(); c.arc(px + r * 0.3, py, 5, 0, 6.2832); c.fill(); BL.label(c, 'a plasmid, with a resistance gene', px, py - r * 0.5 - 10, { font: BL.font(700, 12), border: pal.ui }); }
        BL.label(c, 'no membrane round it — and no histones', W * 0.5, 16, { font: BL.font(600, 12), border: pal.muted });
      }

      if (window.__BL_TEST) window.__BL_TEST.rings = S;
      reset();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); zoom.destroy(); } };
    },
  });
})();
