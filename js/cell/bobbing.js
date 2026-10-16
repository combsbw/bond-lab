/* Bobbing for Catalase: the chapter's bench lab, with the bench on the screen.

   Chapter 4's ESP lab (Exploring Scientific Procedures): a filter-paper disc soaked in yeast is dropped
   into hydrogen peroxide of different strengths, and the time for it to rise is recorded. The yeast makes
   catalase; catalase turns peroxide into water and oxygen; the oxygen gathers as bubbles on the paper until
   it floats up. The independent variable is the concentration of the peroxide. The dependent variable is the
   time to rise. The control is plain water.

   It is the other half of Cleanup's peroxisome: the same enzyme, doing the same job, with a bit of paper to
   watch it by. And it is Chapter 3's Hurry Up from the other side: the rate saturates in the substrate, so the
   graph of time against strength flattens out, and boiled yeast does nothing at all.

   Everything a real lab report asks for is here and fills itself in as you run it: the variable, the control,
   three trials per cup, an average, and a graph. Run a cup again and the time is not the same — the model
   (js/cell/catalase.js, held to the bench by tools/check-bobbing.js) adds the scatter a real piece of paper
   brings — and the two strongest cups sometimes swap places, which is a thing real students find and then
   have to explain. A "Your mix" cup lets you test a strength the tray did not have and call its time before
   you run it. It runs in sped-up time, and says so. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const M = BL.catalase;

  const STEPS = [
    { id: 'water', text: 'Run the water control.',
      how: 'Tap the “Water” cup (or press “Drop the paper in every cup”) and wait for it to give up.',
      ask: 'in plain water, will the paper rise?',
      opts: ['Yes, slowly', 'No — there is nothing for the enzyme to break down'], right: 1 },
    { id: 'four', text: 'Run all four peroxide cups.',
      how: 'Press “Drop the paper in every cup”. Watch which paper surfaces first.',
      ask: 'which cup will the paper rise in first?',
      opts: ['The strongest peroxide', 'The weakest peroxide'], right: 0 },
    { id: 'level', text: 'Compare the strongest two: 50% and 100%.',
      how: 'Look at the table and the graph once both have a time.',
      ask: 'twice the peroxide, from 50% to 100% of the bottle: the time will…',
      opts: ['Halve', 'Fall, but by much less than half'], right: 1 },
    { id: 'mix', text: 'Mix a strength the tray did not have, and call its time first.',
      how: 'Leave “Your mix” at 2.0%, tap its cup, and see where it lands against its neighbours.',
      ask: 'a 2% mix sits between the 50% and 75% cups. Its time will be…',
      opts: ['Between theirs', 'Faster than both', 'Slower than both'], right: 0 },
    { id: 'boil', text: 'Boil the yeast first, then run the strongest cup.',
      how: 'Press “Boil the yeast first”, then tap the 100% cup.',
      ask: 'if the yeast has been boiled, will the paper rise?',
      opts: ['Yes — the peroxide is still there', 'No — the enzyme has come apart'], right: 1 },
    { id: 'repeat', text: 'Run the same cup three times.',
      how: 'Tap one cup, wait, and tap it again, until its row has three times.',
      ask: 'will three runs of the same cup give exactly the same time?',
      opts: ['Yes — same cup, same time', 'Close, but not identical'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<path d="M64 30 H136 L128 100 H72 Z" fill="var(--wash)" stroke="var(--fn-store)" stroke-width="5" stroke-linejoin="round"/>' +
    '<ellipse cx="100" cy="76" rx="14" ry="5" fill="var(--fn-store)" opacity=".8"/>' +
    '<g fill="none" stroke="var(--neg)" stroke-width="3"><circle cx="92" cy="62" r="4"/><circle cx="104" cy="52" r="5"/><circle cx="98" cy="40" r="3.5"/></g></svg>';

  BL.register({
    id: 'bobbing', field: 'jobs', order: 4, name: 'Bobbing for Catalase',
    tagline: 'Paper, yeast, peroxide, and a stopwatch.',
    lede: 'Chapter 4’s bench lab, on the screen. A paper disc soaked in yeast is dropped into hydrogen peroxide, and the oxygen the enzyme makes lifts it to the top. Change the strength of the peroxide and time how long it takes. The table and graph fill in as you go.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const cups = M.CUPS.map((c) => ({ id: c.id, name: c.name, pct: c.pct, fixed: true, trials: [], run: null, bub: [] }));
      cups.push({ id: 'mix', name: 'Your mix', pct: 2.0, fixed: false, trials: [], run: null, bub: [] });
      const S = { speed: 3, boiled: false, mode: 'time', trend: false, hinted: false, t: 0, seed: 1 };
      const rnd = () => Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(6.2832 * Math.random());
      const stage = BL.stage(stageHost, '8 / 4.4', {
        label: 'Six clear cups in a row: plain water, then hydrogen peroxide at a quarter, half, three quarters and the full strength of the bottle, then a cup whose strength you set yourself. A paper disc soaked in yeast sinks to the bottom of each cup you run, collects oxygen bubbles, and floats to the top. Tap a cup to run it. The table and graph beside the picture record the times.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- dock ---------------- */
      const dropAll = h('button', { type: 'button', class: 'action', onclick: () => { S.hinted = true; cups.slice(0, 5).forEach((c) => start(c)); } }, 'Drop the paper in every cup');
      const boilBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.boiled = !S.boiled; boilBtn.setAttribute('aria-pressed', String(S.boiled)); boilBtn.textContent = S.boiled ? 'The yeast is boiled' : 'Boil the yeast first'; } }, 'Boil the yeast first');
      const spd = [[1, 'Real time'], [3, '3× faster'], [6, '6× faster']].map(([v, n]) => h('button', { type: 'button', 'aria-pressed': String(v === S.speed), onclick: () => { S.speed = v; spd.forEach((b, i) => b.setAttribute('aria-pressed', String([1, 3, 6][i] === v))); } }, n));
      dock.appendChild(h('section', {}, h('h2', {}, 'Run the experiment'), h('div', { class: 'actions' }, dropAll), h('div', { class: 'chips' }, boilBtn),
        h('p', { class: 'hint' }, 'Or tap one cup. Each run adds a time to the table; the lab asks for three.')));
      const mOut = h('output', { class: 'val' }), mIn = h('input', { type: 'range', min: '5', max: '30', step: '1', value: '20', 'aria-label': 'Strength of your own mix' });
      const setMix = () => { cups[5].pct = parseFloat(mIn.value) / 10; mOut.textContent = cups[5].pct.toFixed(1) + '%'; cups[5].trials = []; };
      mIn.addEventListener('input', () => { setMix(); S.hinted = true; });
      mOut.textContent = '2.0%';
      dock.appendChild(h('section', {}, h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'Your mix'), mOut), h('div', { class: 'range-wrap' }, mIn, h('div', { class: 'range-ends' }, h('span', {}, 'weak'), h('span', {}, 'as strong as the bottle')))),
        h('p', { class: 'hint' }, 'A strength the tray did not have. Call its time before you run it.')));
      dock.appendChild(h('section', {}, h('h2', {}, 'Speed of the clock'), h('div', { class: 'seg', role: 'group', 'aria-label': 'How fast time runs' }, spd),
        h('p', { class: 'hint' }, 'The model runs faster than a real stopwatch so nobody waits. The times in the table are in lab seconds.'),
        h('div', { class: 'actions' }, BL.confirmBtn('Clear the table', 'Tap again to clear', () => { cups.forEach((c) => { c.trials = []; c.run = null; c.bub = []; }); }))));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'bobbing', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' }, 'Tap a cup to drop a paper disc in.');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'The experiment'), statusP,
        h('div', { class: 'facts' },
          h('div', {}, h('dt', {}, 'What you change (independent variable)'), h('dd', {}, 'how strong the hydrogen peroxide is')),
          h('div', {}, h('dt', {}, 'What you measure (dependent variable)'), h('dd', {}, 'seconds for the paper to rise')),
          h('div', {}, h('dt', {}, 'The control'), h('dd', {}, 'plain water, with the same paper')),
          h('div', {}, h('dt', {}, 'The reaction'), h('dd', {}, '2 H₂O₂ → 2 H₂O + O₂ — the bubbles are the oxygen')))));
      const tbody = h('tbody');
      const rowEls = cups.map((c) => { const tr = h('tr', {}, h('th', { scope: 'row' }, c.name + (c.fixed ? '' : '')), h('td', {}), h('td', {}), h('td', {}), h('td', { class: 'avg' })); tbody.appendChild(tr); return tr; });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Your data'), h('div', { class: 'cell-chart-wrap' }, h('table', { class: 'cell-chart bob-table' }, h('caption', { class: 'sr-only' }, 'Times in seconds for the paper to rise, for each cup and each trial.'),
        h('thead', {}, h('tr', {}, h('th', {}, 'Cup'), h('th', {}, 'Trial 1'), h('th', {}, 'Trial 2'), h('th', {}, 'Trial 3'), h('th', {}, 'Average'))), tbody)),
        h('p', { class: 'hint' }, 'Seconds. “no rise” means the paper had not come up when the clock gave up.')));
      const graph = BL.stage(h('div'), '1.9 / 1', { label: 'A graph of the time for the paper to rise against the strength of the peroxide. Each dot is one trial and a line joins the averages. A toggle shows speed instead of time.' });
      graph.wrap.classList.add('flat');
      const modeBtns = [['time', 'Time to rise'], ['speed', 'Speed (1 ÷ time)']].map(([id, n]) => h('button', { type: 'button', 'aria-pressed': String(id === S.mode), onclick: () => { S.mode = id; modeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(['time', 'speed'][i] === id))); } }, n));
      const trendBtn = h('button', { type: 'button', class: 'chip soft', 'aria-pressed': 'false', onclick: () => { S.trend = !S.trend; trendBtn.setAttribute('aria-pressed', String(S.trend)); } }, 'Show what the enzyme would do');
      aux.appendChild(h('section', { class: 'panel' }, h('div', { class: 'row' }, h('h2', {}, 'Graph'), h('div', { class: 'seg', role: 'group', 'aria-label': 'What the graph shows' }, modeBtns)), graph.wrap, h('div', { class: 'chips' }, trendBtn),
        h('p', { class: 'hint' }, 'Switch to speed: it climbs steeply and then levels off. The enzyme can only work so fast, however much peroxide there is.')));

      /* ---------------- running a cup ---------------- */
      function start(c) {
        if (c.run && !c.run.ended) return;
        if (c.trials.filter((t) => t.boiled === S.boiled).length >= 3) { say('Three times is what the lab asks for. “Clear the table” to start again.'); return; }
        const T = M.trial(c.pct, S.boiled, rnd);
        c.run = { t: 0, T, boiled: S.boiled, ended: false };
        S.hinted = true;
      }
      function finish(c) {
        const r = c.run, rose = r.T !== Infinity;
        c.trials.push({ t: rose ? Math.round(r.T * 10) / 10 : null, boiled: r.boiled });
        r.ended = true; r.endT = S.t;
        if (c.id === 'water' && !r.boiled) steps.done('water');
        if (r.boiled && !rose && c.pct > 0) steps.done('boil');
        if (cups.slice(1, 5).every((k) => k.trials.some((t) => t.t != null && !t.boiled))) steps.done('four');
        const g = (id) => cups.find((k) => k.id === id).trials.some((t) => t.t != null && !t.boiled);
        if (g('c50') && g('c100')) steps.done('level');
        if (!c.fixed && c.trials.some((t) => t.t != null && !t.boiled)) steps.done('mix');
        if (cups.some((k) => k.trials.filter((t) => !t.boiled).length >= 3)) steps.done('repeat');
        say(rose ? c.name + ': the paper rose in ' + r.T.toFixed(1) + ' s' + (r.boiled ? '' : '.') : (r.boiled ? 'The yeast was boiled, so the enzyme has come apart. The paper never rose.' : 'Nothing happened. With no peroxide there is nothing for the enzyme to break down.'));
      }
      function say(t) { statusP.textContent = t; }
      const avg = (c) => { const ts = c.trials.filter((t) => t.t != null && !t.boiled).map((t) => t.t); return ts.length ? ts.reduce((a, b) => a + b, 0) / ts.length : null; };

      /* ---------------- pointer ---------------- */
      const slot = (i) => ({ x: (i + 0.5) / cups.length * stage.w, w: stage.w / cups.length * 0.66 });
      stage.canvas.addEventListener('pointerdown', (e) => {
        const r = stage.canvas.getBoundingClientRect(), x = e.clientX - r.left, i = Math.floor(x / (stage.w / cups.length));
        if (i >= 0 && i < cups.length) { start(cups[i]); e.preventDefault(); }
      });
      stage.canvas.addEventListener('pointermove', (e) => { stage.canvas.style.cursor = 'pointer'; });
      stage.canvas.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dropAll.click(); } });

      /* ---------------- drawing ---------------- */
      function frame(dt) {
        const cw = stage.w, chh = stage.h, pal = BL.pal; if (!cw) return;
        S.t += dt;
        const sdt = dt * S.speed;
        cups.forEach((c) => {
          const r = c.run; if (!r) return;
          if (!r.ended) {
            r.t += sdt;
            const lim = r.T === Infinity ? M.CAP : r.T;
            if (r.t >= lim) finish(c);
            // bubbles come off the paper as fast as the reaction is going
            if (!r.boiled && c.pct > 0 && Math.random() < M.bubbles(c.pct, r.boiled) * 2.2 * dt * Math.min(S.speed, 3)) c.bub.push({ x: (Math.random() - 0.5) * 0.7, y: 0, life: 0, v: 0.35 + Math.random() * 0.3 });
          }
          if (r.ended && S.t - r.endT > 4.5) c.run = null;
        });
        cups.forEach((c) => { c.bub.forEach((b) => { b.life += dt; b.y += b.v * dt * (1 + 0.5 * S.speed * 0.2); }); c.bub = c.bub.filter((b) => b.y < 1.1); });
        ctx.clearRect(0, 0, cw, chh);
        const top = chh * 0.2, ch2 = chh * 0.66, bot = top + ch2;
        cups.forEach((c, i) => {
          const s = slot(i), w = s.w, x0 = s.x - w / 2, x1 = s.x + w / 2, liquid = top + ch2 * 0.12;
          // the glass and what is in it
          ctx.save(); ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0 + w * 0.06, bot); ctx.lineTo(x1 - w * 0.06, bot); ctx.lineTo(x1, top); ctx.closePath();
          const strength = clamp(c.pct / 3, 0, 1);
          ctx.fillStyle = BL.alpha(BL.mixHex(pal.panel, pal.neg, 0.1 + 0.4 * strength), 0.85); ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = pal.fn.store; ctx.stroke();
          ctx.restore();
          ctx.strokeStyle = BL.alpha(pal.fg, 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 3, liquid); ctx.lineTo(x1 - 3, liquid); ctx.stroke();
          // the paper
          const r = c.run; let py = bot - 10, rot = 0;
          if (r) {
            const T = r.T === Infinity ? 1e9 : r.T, sink = clamp(r.t / 1.2, 0, 1), rise = clamp((r.t - (T - 1.8)) / 1.8, 0, 1);
            const eased = rise * rise * (3 - 2 * rise);
            py = (liquid + 6) + (bot - 10 - (liquid + 6)) * sink * (1 - eased) + (r.T === Infinity ? 0 : 0);
            if (r.t < 1.2) py = liquid - 30 + (bot - 10 - liquid + 30) * sink;
            rot = Math.sin(r.t * 2 + i) * 0.1;
          } else py = liquid - (liquid - top) * 0.1 - 16;     // sitting above, waiting
          const px = s.x + (r && r.ended ? 0 : 0);
          if (!r) { ctx.globalAlpha = 0.35; }
          ctx.save(); ctx.translate(px, r ? py : top - 10); ctx.rotate(rot); ctx.fillStyle = BL.mixHex('#e8d9b0', '#ffffff', 0.1); ctx.strokeStyle = pal.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.2, 5, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
          if (r && r.boiled) { ctx.fillStyle = BL.alpha('#000000', 0.25); ctx.fill(); }
          ctx.restore(); ctx.globalAlpha = 1;
          // bubbles, rising off the paper
          c.bub.forEach((b) => { const yy = (bot - 14) - b.y * (bot - 14 - liquid); ctx.strokeStyle = BL.alpha(pal.neg, 0.9); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(s.x + b.x * w * 0.4, yy, 2.6 + b.v * 3, 0, 6.2832); ctx.stroke(); });
          // labels
          ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 14); ctx.textAlign = 'center';
          ctx.fillText(c.pct === 0 ? 'Water' : c.name === 'Your mix' ? c.pct.toFixed(1) + '%' : c.name, s.x, bot + 22);
          ctx.fillStyle = pal.muted; ctx.font = BL.font(500, 12);
          ctx.fillText(c.pct === 0 ? 'control' : c.fixed ? (c.pct.toFixed(2).replace(/0$/, '') + '% H₂O₂') : 'your mix', s.x, bot + 40);
          // the stopwatch
          let txt = '—', col = pal.muted;
          if (r && !r.ended) { txt = Math.min(r.t, r.T === Infinity ? M.CAP : r.T).toFixed(1) + ' s'; col = pal.fg; }
          else if (c.trials.length) { const l = c.trials[c.trials.length - 1]; txt = l.t == null ? 'no rise' : l.t.toFixed(1) + ' s'; col = pal.fn.store; }
          BL.label(ctx, txt, s.x, top - 28, { font: BL.font(800, 15), border: col });
          if (r && r.boiled) BL.label(ctx, 'boiled yeast', s.x, top - 52, { font: BL.font(700, 11), border: pal.pos });
        });
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'tap a cup to drop a paper disc in', cw / 2, chh - 12, { font: BL.font(700, 14), border: pal.ui });
        tableAndGraph();
      }

      /* ---------------- the table and the graph ---------------- */
      let tableKey = '';
      function tableAndGraph() {
        const key = JSON.stringify(cups.map((c) => [c.pct, c.trials]));
        if (key !== tableKey) {
          tableKey = key;
          cups.forEach((c, i) => {
            const tds = rowEls[i].querySelectorAll('td'), th = rowEls[i].querySelector('th');
            th.textContent = c.pct === 0 ? 'Water (control)' : c.fixed ? c.name + ' · ' + c.pct.toFixed(2).replace(/0$/, '') + '%' : 'Your mix · ' + c.pct.toFixed(1) + '%';
            for (let k = 0; k < 3; k++) { const t = c.trials[k]; tds[k].textContent = t ? (t.t == null ? (t.boiled ? 'no rise (boiled)' : 'no rise') : t.t.toFixed(1) + (t.boiled ? ' (boiled)' : '')) : ''; }
            const a = avg(c); tds[3].textContent = a == null ? '' : a.toFixed(1);
          });
        }
        const c = graph.ctx, W = graph.w, H = graph.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        const f = BL.fs(13), m = { l: 46, r: 14, t: 14, b: f * 3 };
        const X = (p) => m.l + (p / 3.2) * (W - m.l - m.r);
        const sp = S.mode === 'speed', ymax = sp ? 0.1 : 50;
        const Y = (v) => H - m.b - (v / ymax) * (H - m.b - m.t);
        c.font = BL.font(400, 12); c.fillStyle = pal.muted; c.strokeStyle = pal.line; c.lineWidth = 1; c.textAlign = 'right';
        (sp ? [0, 0.025, 0.05, 0.075, 0.1] : [0, 10, 20, 30, 40, 50]).forEach((v) => { c.beginPath(); c.moveTo(m.l, Y(v)); c.lineTo(W - m.r, Y(v)); c.stroke(); c.fillText(sp ? v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : String(v), m.l - 6, Y(v) + 4); });
        c.textAlign = 'center'; [0, 0.75, 1.5, 2.25, 3].forEach((p) => c.fillText(p + '%', X(p), H - m.b + f * 1.2));
        c.fillText('strength of the hydrogen peroxide →', (m.l + W - m.r) / 2, H - 4);
        c.save(); c.translate(12, (m.t + H - m.b) / 2); c.rotate(-Math.PI / 2); c.fillText(sp ? 'speed (1 ÷ seconds)' : 'seconds to rise', 0, 0); c.restore();
        if (S.trend) { c.strokeStyle = BL.alpha(pal.fn.store, 0.8); c.lineWidth = 2.5; c.setLineDash([6, 5]); c.beginPath(); for (let i = 0; i <= 60; i++) { const p = 0.05 + i / 60 * 3.1, t = M.time0(p, false), v = sp ? 1 / t : t; i ? c.lineTo(X(p), Y(clamp(v, 0, ymax))) : c.moveTo(X(p), Y(clamp(v, 0, ymax))); } c.stroke(); c.setLineDash([]); }
        const pts = [];
        cups.forEach((k) => {
          k.trials.forEach((t) => { if (t.boiled) return; if (t.t == null) { if (k.pct === 0) { c.fillStyle = pal.muted; c.font = BL.font(800, 14); c.textAlign = 'center'; c.fillText('✕', X(0), Y(sp ? 0 : M.CAP) + 5); } return; } const v = sp ? 1 / t.t : t.t; c.fillStyle = BL.alpha(pal.fn.store, 0.5); c.beginPath(); c.arc(X(k.pct), Y(v), 4, 0, 6.2832); c.fill(); });
          const a = avg(k); if (a != null) pts.push([k.pct, sp ? 1 / a : a]);
        });
        pts.sort((a, b) => a[0] - b[0]);
        if (pts.length) { c.strokeStyle = pal.fn.store; c.lineWidth = 3; c.beginPath(); pts.forEach(([p, v], i) => (i ? c.lineTo(X(p), Y(v)) : c.moveTo(X(p), Y(v)))); c.stroke(); pts.forEach(([p, v]) => { c.fillStyle = pal.fn.store; c.strokeStyle = pal.panel; c.lineWidth = 2; c.beginPath(); c.arc(X(p), Y(v), 6.5, 0, 6.2832); c.fill(); c.stroke(); }); }
        else { c.fillStyle = pal.muted; c.font = BL.font(500, 14); c.textAlign = 'center'; c.fillText('Run a cup and its point appears here.', (m.l + W - m.r) / 2, (m.t + H - m.b) / 2); }
      }

      if (window.__BL_TEST) window.__BL_TEST.bobbing = { cups, S };
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); graph.destroy(); } };
    },
  });
})();
