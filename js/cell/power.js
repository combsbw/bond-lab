/* Power: the energy job. Two organelles, two different jobs, never interchangeable.

   The chapter warns about exactly one trap here: "both are energy organelles"
   collapsing into "these are the same thing". They are not.

     chloroplast   catches sunlight and builds glucose. Only cells that
                   photosynthesise have them: plants, algae.
     mitochondrion burns glucose to make ATP. Every eukaryotic cell that needs
                   energy has them — plant cells too, because a plant has to
                   live through the night.

   So the cell is a chain: light -> glucose -> ATP -> work. Plant cells have the
   whole chain. Animal cells start in the middle, because they cannot make
   glucose; they eat it. Take away any link and watch which part of the chain
   goes quiet, and which part carries on for a while on what it had stored. The
   learner is asked to call each one first.

   The model is three stocks and three rates. Sugar is made at (chloroplasts x
   light), burned at (mitochondria, saturating in sugar), and each unit burned
   makes ten units of ATP, which the work uses up. The numbers are chosen to
   read well; the chain is the point. It leaves out what actually happens inside
   either organelle, which is the business of Chapters 7 and 8, and it says so.

   The 3D panel is the two organelles themselves: a mitochondrion with its
   inner membrane folded, and a chloroplast with its stacks of thylakoids, as
   drawings you can turn over rather than as simulations. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const K = BL.cell;

  const STEPS = [
    { id: 'night', text: 'Switch off the light in the plant cell and wait.',
      how: 'Slide “Sunlight” all the way down and watch the ATP for several seconds.',
      ask: 'at night, with no light, can a plant cell still make ATP?',
      opts: ['No — it needs light for everything', 'Yes — its mitochondria burn sugar it stored'], right: 1 },
    { id: 'animal', text: 'Switch to an animal cell and feed it.',
      how: 'Press “Animal cell”, then press “Eat a snack” a few times.',
      ask: 'where does an animal cell get its glucose?',
      opts: ['It makes it from sunlight, like a plant', 'It eats it — it cannot make its own'], right: 1 },
    { id: 'sunny', text: 'Shine full sunlight on the animal cell.',
      how: 'Keep it an animal cell and slide “Sunlight” to the top. Watch the sugar.',
      ask: 'in an animal cell, will sunlight make any glucose?',
      opts: ['Yes', 'No — it has no chloroplasts'], right: 1 },
    { id: 'nomito', text: 'Take every mitochondrion away from a cell that has plenty of sugar.',
      how: 'Press “Fewer” until there are none, and keep the cell fed.',
      ask: 'with sugar piling up but no mitochondria, how much ATP is there?',
      opts: ['Plenty — sugar is energy', 'Almost none — sugar is not ATP yet'], right: 1 },
    { id: 'busy', text: 'Make the cell work hard, and give it enough mitochondria to keep up.',
      how: 'Slide “How hard the cell works” right up, then add mitochondria. In a plant cell, give it light and chloroplasts too.',
      ask: 'a cell that works hard needs…',
      opts: ['More mitochondria', 'Fewer mitochondria'], right: 0 },
    { id: 'turn', text: 'Turn the two organelles over and find their folds.',
      how: 'Drag in “Inside the two rooms”. A mitochondrion folds its inner membrane; a chloroplast stacks its thylakoids.' },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<circle cx="46" cy="32" r="14" fill="var(--fn-energy)"/><g stroke="var(--fn-energy)" stroke-width="4" stroke-linecap="round"><path d="M46 8 V0"/><path d="M70 32 H80"/><path d="M62 15 L68 9"/></g>' +
    '<ellipse cx="84" cy="76" rx="26" ry="14" fill="var(--fn-energy)" opacity=".5" stroke="var(--fn-energy)" stroke-width="4"/>' +
    '<ellipse cx="146" cy="76" rx="26" ry="14" fill="var(--fn-energy)" opacity=".5" stroke="var(--fn-energy)" stroke-width="4"/>' +
    '<path d="M132 76 q6 -8 12 0 t12 0" fill="none" stroke="var(--fn-energy)" stroke-width="3.5"/></svg>';

  BL.register({
    id: 'power', field: 'jobs', order: 1, name: 'Power',
    tagline: 'One organelle catches light. The other burns sugar.',
    lede: 'A cell’s energy is a chain: light makes sugar, sugar makes ATP, ATP does the work. Plant cells have every link. Animal cells start in the middle. Take a link away and watch where it goes quiet — and where it carries on for a while on what it had stored.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        type: 'plant', light: 0.8, nM: 4, nC: 3, work: 0.4, G: 7, A: 6, t: 0, hinted: false, fed: 0, parts: [], noMitoT: 0, sunAnimalT: 0, busyT: 0, nightT: 0, made: 0, burned: 0,
      };
      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A cell showing the chain of energy. Sunlight reaches chloroplasts, which make glucose. Mitochondria burn the glucose to make ATP, and ATP is used up by the cell’s work, drawn as a turning gear. Sliders set the sunlight and how hard the cell works, and buttons add or remove organelles.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- dock ---------------- */
      const typeBtns = [['plant', 'Plant cell'], ['animal', 'Animal cell']].map(([id, name]) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(S.type === id), onclick: () => { S.type = id; if (id === 'animal') S.nC = 0; else if (!S.nC) S.nC = 3; S.hinted = true; sync(); } }, name));
      dock.appendChild(h('section', {}, h('h2', {}, 'Which cell'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Which kind of cell' }, typeBtns)));
      const slider = (label, key, ends, fmt, cb) => {
        const out = h('output', { class: 'val' }), input = h('input', { type: 'range', min: '0', max: '100', step: '1', value: String(S[key] * 100), 'aria-label': label });
        input.addEventListener('input', () => { S[key] = parseFloat(input.value) / 100; S.hinted = true; out.textContent = fmt(S[key]); if (cb) cb(); });
        out.textContent = fmt(S[key]);
        return { out, input, el: h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, label), out), h('div', { class: 'range-wrap' }, input, h('div', { class: 'range-ends' }, h('span', {}, ends[0]), h('span', {}, ends[1])))) };
      };
      const lightC = slider('Sunlight', 'light', ['dark', 'full sun'], (v) => (v < 0.05 ? 'night' : v < 0.4 ? 'dim' : v < 0.8 ? 'bright' : 'full sun'));
      const workC = slider('How hard the cell works', 'work', ['resting', 'flat out'], (v) => (v < 0.2 ? 'resting' : v < 0.6 ? 'busy' : v < 0.85 ? 'working hard' : 'flat out'));
      dock.appendChild(h('section', {}, lightC.el, workC.el));
      const stepper = (label, key, max, min) => {
        const out = h('output', { class: 'val' }, String(S[key]));
        const set = (d) => { S[key] = clamp(S[key] + d, 0, max); S.hinted = true; out.textContent = String(S[key]); };
        return { out, el: h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, label), out), h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action ghost', onclick: () => set(-1) }, 'Fewer'), h('button', { type: 'button', class: 'action ghost', onclick: () => set(1) }, 'More'))) };
      };
      const mitoC = stepper('Mitochondria', 'nM', 8), chloC = stepper('Chloroplasts', 'nC', 4);
      const snack = h('button', { type: 'button', class: 'action', onclick: () => { S.G += 1.5; S.fed++; S.hinted = true; for (let i = 0; i < 4; i++) S.parts.push({ k: 'food', x: -0.1, y: 0.2 + Math.random() * 0.6, t: 0, life: 1.6 }); } }, 'Eat a snack');
      dock.appendChild(h('section', {}, mitoC.el, chloC.el, h('div', { class: 'actions' }, snack),
        h('p', { class: 'hint' }, 'Cells that need more energy have more mitochondria: muscle has thousands. A red blood cell has none.')));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'power', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const gM = BL.meter('Glucose in the cell'), aM = BL.meter('ATP'), mkM = BL.meter('Making sugar (chloroplasts)'), mtM = BL.meter('Making ATP (mitochondria)');
      aux.appendChild(h('section', { class: 'panel' }, statusP, h('div', { class: 'meters' }, gM.el, mkM.el, mtM.el, aM.el),
        h('div', { class: 'legend' }, h('span', { class: 'fn-chip', style: '--c: var(--fn-energy)' }, 'both organelles do the energy job — differently'))));
      const c3 = BL.stage(h('div'), '1.9 / 1', { label: 'Three-dimensional drawings of a mitochondrion, with its inner membrane folded into plates, and a chloroplast, with stacks of flat thylakoid discs. Drag to turn them.', focusable: true });
      c3.wrap.classList.add('flat');
      const V3 = BL.view3d(c3.canvas, { yaw: 0.35, pitch: 0.3, auto: 0, onturn: () => { S.hinted = true; if (V3.turned > 1.2) steps.done('turn'); } });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Inside the two rooms'), c3.wrap,
        h('p', { class: 'hint' }, 'A mitochondrion has two membranes, and the inner one is folded to fit more surface in. A chloroplast’s thylakoids are flat sacs stacked like coins, and chlorophyll is in them.')));

      function sync() {
        typeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(['plant', 'animal'][i] === S.type)));
        mitoC.out.textContent = String(S.nM); chloC.out.textContent = String(S.nC);
        chloC.el.style.opacity = S.type === 'plant' ? '1' : '0.45'; chloC.el.querySelectorAll('button').forEach((b) => { b.disabled = S.type !== 'plant'; });
        snack.disabled = false;
      }
      // keep the steppers honest when they are pressed
      [mitoC, chloC].forEach((c) => c.el.addEventListener('click', () => { mitoC.out.textContent = String(S.nM); chloC.out.textContent = String(S.nC); }));
      sync();

      /* ---------------- the chain ---------------- */
      function step(dt) {
        S.t += dt;
        const sun = S.type === 'plant' ? S.light : S.light;           // light falls on both; only a chloroplast can use it
        const make = S.nC * S.light * 0.38;                           // glucose per second
        const burn = S.nM * 0.12 * (S.G / (0.6 + S.G));                // glucose burned per second, saturating
        const atpMake = burn * 10, atpUse = S.work * 6 * (S.A > 0.05 ? 1 : 0.25);
        S.G = clamp(S.G + (make - burn) * dt, 0, 14);
        S.A = clamp(S.A + (atpMake - atpUse) * dt, 0, 10);
        S.rates = { make, burn, atpMake, atpUse, sun };
        // goals
        if (S.type === 'plant' && S.light < 0.05 && S.A > 3 && S.G > 0.2 && S.nM > 0) { S.nightT += dt; if (S.nightT > 6) steps.done('night'); } else if (S.light >= 0.05) S.nightT = 0;
        if (S.type === 'animal' && S.fed >= 3) steps.done('animal');
        if (S.type === 'animal' && S.light > 0.7) { S.sunAnimalT += dt; if (S.sunAnimalT > 5) steps.done('sunny'); } else S.sunAnimalT = 0;
        if (S.nM === 0 && S.G > 2 && S.A < 1) { S.noMitoT += dt; if (S.noMitoT > 4) steps.done('nomito'); } else S.noMitoT = 0;
        if (S.work > 0.8 && S.nM >= 5 && S.A > 3) { S.busyT += dt; if (S.busyT > 6) steps.done('busy'); } else S.busyT = 0;
        // an animal cell with no food runs down: nothing refills it
      }

      /* ---------------- drawing ---------------- */
      function frame(dt) {
        const cw = stage.w, chh = stage.h, pal = BL.pal; if (!cw) return;
        step(dt);
        ctx.clearRect(0, 0, cw, chh);
        const pad = 16, bx = cw * 0.2, by = pad + 6, bw = cw * 0.78 - 4, bh = chh - pad * 2 - 12;
        const R = S.rates;
        // the cell
        ctx.save(); ctx.beginPath(); S.type === 'plant' ? ctx.roundRect(bx, by, bw, bh, 18) : ctx.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, 6.2832);
        ctx.fillStyle = BL.mixHex(pal.panel, pal.fn.struct, 0.1); ctx.fill(); ctx.lineWidth = S.type === 'plant' ? 9 : 5; ctx.strokeStyle = pal.fn.struct; ctx.stroke(); ctx.restore();

        // the sun
        const sx = cw * 0.09, sy = by + 44;
        ctx.save(); const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 38); sg.addColorStop(0, BL.alpha(pal.fn.energy, 0.95 * Math.max(0.15, S.light))); sg.addColorStop(1, BL.alpha(pal.fn.energy, 0));
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 38, 0, 6.2832); ctx.fill();
        ctx.fillStyle = BL.mixHex(pal.panel, pal.fn.energy, 0.2 + 0.8 * S.light); ctx.strokeStyle = pal.fn.energy; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, 16, 0, 6.2832); ctx.fill(); ctx.stroke();
        ctx.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = i * 0.785 + S.t * 0.4, r1 = 22, r2 = 22 + 8 * S.light; ctx.globalAlpha = 0.25 + 0.75 * S.light; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1); ctx.lineTo(sx + Math.cos(a) * r2, sy + Math.sin(a) * r2); ctx.stroke(); }
        ctx.restore();

        // organelles: chloroplasts up the left, mitochondria down the middle, the work on the right
        const cl = [], mt = [];
        for (let i = 0; i < S.nC; i++) cl.push({ x: bx + bw * 0.2, y: by + bh * (0.2 + 0.6 * (i + 0.5) / Math.max(S.nC, 1)) });
        for (let i = 0; i < S.nM; i++) { const col = i % 2, row = Math.floor(i / 2); mt.push({ x: bx + bw * (0.44 + col * 0.13), y: by + bh * (0.2 + 0.6 * (row + 0.5) / Math.max(Math.ceil(S.nM / 2), 1)) }); }
        const work = { x: bx + bw * 0.86, y: by + bh * 0.5 };
        // photons and sugar, ATP: little carriers that run the chain
        const emit = (rate, k, from, to) => { if (Math.random() < rate * dt && from && to) S.parts.push({ k, x0: from.x, y0: from.y, x1: to.x, y1: to.y, t: 0, life: 1.2 + Math.random() * 0.5 }); };
        if (S.nC && S.light > 0.05) cl.forEach((c) => emit(R.make / Math.max(S.nC, 1) * 5, 'photon', { x: sx, y: sy }, c));
        cl.forEach((c) => { if (S.light > 0.05) emit(R.make / Math.max(S.nC, 1) * 3.2, 'glu', c, mt[(Math.random() * mt.length) | 0] || { x: bx + bw * 0.5, y: c.y }); });
        mt.forEach((m) => emit(R.atpMake / Math.max(S.nM, 1) * 1.1, 'atp', m, work));
        if (S.parts.length > 200) S.parts.splice(0, S.parts.length - 200);
        S.parts = S.parts.filter((q) => (q.t += dt) < q.life);
        // draw the carriers
        S.parts.forEach((q) => {
          const u = q.t / q.life;
          if (q.k === 'food') { const x = bx - 10 + u * 90, y = by + bh * q.y; hex(x, y, 7, pal.fn.energy, 1 - u * 0.3); return; }
          const x = q.x0 + (q.x1 - q.x0) * u, y = q.y0 + (q.y1 - q.y0) * u;
          if (q.k === 'photon') { ctx.fillStyle = BL.alpha(pal.fn.energy, 1 - u * 0.4); ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 6.2832); ctx.fill(); }
          else if (q.k === 'glu') hex(x, y, 8.5, pal.fn.energy, 1 - u * 0.3);
          else { ctx.fillStyle = pal.fg; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 6.2832); ctx.fill(); ctx.strokeStyle = pal.fn.energy; ctx.lineWidth = 2.5; ctx.stroke(); }
        });
        function hex(x, y, r, c, a) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); for (let i = 0; i < 6; i++) { const t = i * 1.0472; i ? ctx.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r) : ctx.moveTo(x + Math.cos(t) * r, y + Math.sin(t) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); }

        cl.forEach((c) => K.blob(ctx, fakeV(), { x: c.x, y: c.y, z: 0 }, { x: 1, y: 0, z: 0 }, 30, 15, BL.mixHex(pal.fn.energy, pal.neg, 0.0), { alpha: 0.95, inner: (cx, ma, mi) => { cx.fillStyle = BL.alpha('#000', 0.28); for (let i = -1; i <= 1; i++) { cx.beginPath(); cx.ellipse(i * ma * 0.42, 0, ma * 0.13, mi * 0.5, 0, 0, 6.2832); cx.fill(); } } }));
        mt.forEach((m) => K.blob(ctx, fakeV(), { x: m.x, y: m.y, z: 0 }, { x: 1, y: 0, z: 0 }, 27, 13, pal.fn.energy, { alpha: 0.95, inner: (cx, ma, mi) => { cx.strokeStyle = BL.alpha('#000', 0.38); cx.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { const x = i * ma * 0.3; cx.beginPath(); cx.moveTo(x, -mi * 0.75); cx.quadraticCurveTo(x + ma * 0.12, 0, x, mi * 0.75); cx.stroke(); } } }));
        // the work: a gear that turns as fast as the ATP is spent
        S.gear = (S.gear || 0) + R.atpUse * dt * 0.35 * (S.A > 0.05 ? 1 : 0.2);
        ctx.save(); ctx.translate(work.x, work.y); ctx.rotate(S.gear);
        ctx.fillStyle = BL.alpha(pal.fn.struct, 0.85); ctx.strokeStyle = pal.fn.struct; ctx.lineWidth = 3;
        ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i * 0.3927, r = i % 2 ? 24 : 32; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = pal.panel; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 6.2832); ctx.fill(); ctx.restore();
        BL.label(ctx, 'the cell’s work', work.x, work.y + 50, { font: BL.font(700, 13), border: pal.fn.struct });
        if (S.nC) BL.label(ctx, 'chloroplasts make sugar', bx + bw * 0.2, by + bh - 28, { font: BL.font(700, 13), border: pal.fn.energy });
        if (S.nM) BL.label(ctx, 'mitochondria make ATP', bx + bw * 0.5, by + bh - 28, { font: BL.font(700, 13), border: pal.fn.energy });
        if (S.type === 'animal') BL.label(ctx, 'no chloroplasts: this cell eats its sugar', bx + bw * 0.25, by + 24, { font: BL.font(700, 13), border: pal.muted });
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'slide the sunlight down, or take a link away', cw / 2 + 40, 16, { font: BL.font(700, 14), border: pal.ui });

        // the 3D pair
        draw3(dt);

        // words
        gM.set(S.G / 8, S.G < 0.3 ? 'none' : S.G < 2 ? 'a little' : S.G < 5 ? 'some' : 'piling up'); gM.tone(pal.fn.energy);
        aM.set(S.A / 10, S.A < 0.5 ? 'flat' : S.A < 3 ? 'low' : S.A < 7 ? 'good' : 'full'); aM.tone(pal.fn.struct);
        mkM.set(R.make / 1.6, R.make < 0.02 ? 'none' : R.make < 0.5 ? 'a little' : 'a lot'); mkM.tone(pal.fn.energy);
        mtM.set(R.atpMake / 9, R.atpMake < 0.1 ? 'none' : R.atpMake < 3 ? 'some' : 'a lot'); mtM.tone(pal.fn.energy);
        let say;
        if (S.A < 0.5 && S.work > 0.1) say = S.nM === 0 ? 'No mitochondria, so no ATP — the work has stalled, however much sugar there is.' : S.G < 0.3 ? 'The sugar has run out, so the mitochondria have nothing to burn and the ATP is gone.' : 'The cell is using ATP faster than it is being made.';
        else if (S.type === 'animal' && S.G < 0.3) say = 'An animal cell cannot make sugar. It has to eat some.';
        else if (S.type === 'plant' && S.light < 0.05) say = S.G > 0.2 ? 'No light, so no new sugar. The mitochondria carry on, burning what was stored.' : 'No light and no stored sugar left.';
        else if (S.type === 'plant') say = S.nC ? 'Light makes sugar in the chloroplasts. Mitochondria burn it to make the ATP that the work uses.' : 'No chloroplasts, so no sugar is being made.';
        else say = 'Sugar comes in as food. The mitochondria burn it to make ATP, and the ATP runs the work.';
        if (say !== S.lastSay) { S.lastSay = say; statusP.textContent = say; }
      }
      // organelles in the flow picture are flat; K.blob wants a projector, so give it one that does nothing to the point
      const flat = { project: (p) => ({ x: p.x, y: p.y, z: 0, s: 1, d: 0.8 }), scale: 1 };
      function fakeV() { return flat; }

      /* ---------------- 3D: the two organelles ---------------- */
      function draw3(dt) {
        const c = c3.ctx, W = c3.w, H = c3.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        V3.step(dt); if (!V3.userTurned && !V3.goal && !BL.reduced) V3.yaw = 0.35 + 0.55 * Math.sin(S.t * 0.45);
        V3.frame(W, H, 1.2, { x: 0, y: 0, z: 0 });
        const E = pal.fn.energy, v = (x, y, z) => ({ x, y, z });
        // mitochondrion, left: an outer shell, and an inner membrane folded into plates
        const M0 = v(-1.15, 0, 0);
        V3.add(M0.z - 50, () => K.blob(c, V3, M0, v(1, 0, 0), 0.95, 0.5, E, { alpha: 0.35, flat: true, stroke: BL.alpha(E, 0.9), line: 2.4 }));
        for (let i = -3; i <= 3; i++) {
          const p = v(M0.x + i * 0.24, (i % 2 ? 1 : -1) * 0.08, 0), up = v(0, i % 2 ? -1 : 1, 0), side = v(0, 0, 1);
          const q = V3.project(p); V3.add(q.z, () => K.disc(c, V3, p, side, up, 0.34, BL.mixHex(E, '#000000', 0.12), { alpha: 0.85 }));
        }
        // chloroplast, right: an envelope, and stacks of thylakoid discs
        const C0 = v(1.15, 0, 0);
        V3.add(C0.z - 50, () => K.blob(c, V3, C0, v(1, 0, 0), 0.95, 0.5, E, { alpha: 0.3, flat: true, stroke: BL.alpha(E, 0.9), line: 2.4 }));
        [[-0.45, 0.12, 0.05], [0, -0.12, 0.2], [0.45, 0.1, -0.12], [0.1, 0.16, -0.22], [-0.2, -0.16, -0.18]].forEach(([x, y, z], si) => {
          for (let d = 0; d < 5; d++) { const p = v(C0.x + x, y + d * 0.062 - 0.15, z), q = V3.project(p); V3.add(q.z, () => K.disc(c, V3, p, v(1, 0, 0), v(0, 0, 1), 0.17, BL.mixHex(E, '#2a6a2a', 0.4 + 0.07 * d), { alpha: 0.95 })); }
        });
        V3.flush();
        const a = V3.project(v(-1.15, -0.7, 0)), b = V3.project(v(1.15, -0.7, 0));
        BL.label(c, 'mitochondrion', a.x, c3.h - 14, { font: BL.font(700, 13), border: E }); BL.label(c, 'chloroplast', b.x, c3.h - 14, { font: BL.font(700, 13), border: E });
        V3.cue(c, pal);
      }

      if (window.__BL_TEST) window.__BL_TEST['power'] = S;   // lets a test page find things by their real coordinates
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); c3.destroy(); } };
    },
  });
})();
