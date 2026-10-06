/* Slow: why water takes ages to warm up, and ages to cool.
   Three identical boxes of forty molecules, side by side: water-like, weak
   hands, and no hands. One heater (or cooler) under each, all the same
   power. The same heat goes in to each, and each box warms by a different
   amount. Where does the heat go? Into making the molecules move faster,
   which is what temperature is, and into letting go of handshakes, which
   is not. The water-like box has a lot of handshakes to let go of, so it
   soaks up heat and barely warms. Cooling is the same thing backwards:
   handshakes re-form and give the heat back.

   Model: each box is a js/water2d.js crowd. Heat is tracked as energy per
   molecule, and the temperature each box runs at is read off a table of
   energy against temperature that tools/gen-caloric.js measured from that
   same simulation. The handshake counts you see are live from the boxes. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const M = BL.water2d;

  // measured by tools/gen-caloric.js: energy per molecule at each temperature
  const CAL_K = [40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 520, 560, 600, 640, 680, 720, 760, 800];
  const CAL = {
    water: [-1.463, -1.446, -1.414, -1.367, -1.292, -1.182, -1.057, -0.901, -0.726, -0.587, -0.463, -0.345, -0.255, -0.162, -0.061, 0.023, 0.096, 0.176, 0.261, 0.345],
    weak: [-0.667, -0.582, -0.469, -0.332, -0.213, -0.131, -0.066, -0.004, 0.053, 0.103, 0.154, 0.203, 0.247, 0.299, 0.344, 0.383, 0.44, 0.491, 0.525, 0.563],
    none: [-0.251, -0.168, -0.093, -0.025, 0.033, 0.08, 0.125, 0.168, 0.212, 0.253, 0.292, 0.332, 0.375, 0.423, 0.469, 0.516, 0.57, 0.615, 0.655, 0.69],
  };
  const KSTART = 200, KLO = 40, KHI = 800;
  const eOf = (id, K) => { const k = clamp(K, KLO, KHI), f = (k - KLO) / 40, i = Math.min(CAL_K.length - 2, Math.floor(f)), t = f - i, a = CAL[id]; return a[i] + (a[i + 1] - a[i]) * t; };
  const kOf = (id, E) => { const a = CAL[id]; if (E <= a[0]) return KLO; if (E >= a[a.length - 1]) return KHI; let i = 0; while (a[i + 1] < E) i++; return CAL_K[i] + 40 * (E - a[i]) / (a[i + 1] - a[i]); };

  const IDS = ['water', 'weak', 'none'];
  const NAME = { water: 'Water-like', weak: 'Weak hands', none: 'No hands' };
  const GOALS = [
    { id: 'heat', text: 'Turn on the heaters and put the same heat into all three boxes.' },
    { id: 'race', text: 'Get the no-hands box hot while the water-like box is still cool.' },
    { id: 'hands', text: 'Watch the water-like handshakes let go as it warms.' },
    { id: 'same', text: 'Make all three boxes the same hot temperature. Which one needs the most heat?' },
    { id: 'cool', text: 'Heat all three, then cool them. Which one is the last to cool down?' },
  ];
  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true"><g fill="var(--panel-2)" stroke="currentColor" stroke-width="3"><rect x="14" y="22" width="52" height="56" rx="6"/><rect x="74" y="22" width="52" height="56" rx="6"/><rect x="134" y="22" width="52" height="56" rx="6"/></g>' +
    '<g fill="none" stroke="var(--electron)" stroke-width="4" stroke-linecap="round"><path d="M24 98 q6 -10 12 0 t12 0"/><path d="M84 98 q6 -10 12 0 t12 0"/><path d="M144 98 q6 -10 12 0 t12 0"/></g>' +
    '<path d="M40 70 V34" stroke="var(--ui)" stroke-width="5" stroke-linecap="round"/><path d="M100 70 V50" stroke="var(--ui)" stroke-width="5" stroke-linecap="round"/><path d="M160 70 V42" stroke="var(--ui)" stroke-width="5" stroke-linecap="round"/></svg>';

  BL.register({
    id: 'slow', field: 'water', order: 5, name: 'Slow',
    tagline: 'Takes ages to warm up. And to cool.',
    lede: 'Three boxes with exactly the same heat going into each one. Watch which of them refuses to get warm, and look at what it is doing with the heat instead.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        mode: 0, power: 0.08, on: { water: true, weak: true, none: true }, E: {}, Q: {}, qmin: {}, qmax: {}, W: {}, hb: {}, hb0: 0, u: 10, hot: false, hinted: false, total: 0, lastMeter: 0, aspect: '',
      };
      const stage = BL.stage(stageHost, '15 / 7', {
        label: 'Three identical boxes of molecules side by side: water-like, weak hands and no hands. Each has a heater or cooler underneath. The same heat goes into each, but the temperature of each box changes by a different amount. Controls are in the side panel.',
        focusable: true,
      });
      stage.wrap.classList.add('slow-stage');
      const ctx = stage.ctx;

      IDS.forEach((id, i) => {
        const W = M.create({ n: 40, w: 10, h: 8, type: id, K: KSTART, g: 0, gamma: 1.5, layout: 'block', seed: 5 + i });
        for (let k = 0; k < 3500; k++) M.step(W, 0.005);
        S.W[id] = W; S.E[id] = eOf(id, KSTART); S.Q[id] = 0; S.qmin[id] = 0; S.qmax[id] = 0;
        S.hb[id] = M.handshakes(W).perMolecule;
      });
      S.hb0 = S.hb.water;

      /* ---------------- dock ---------------- */
      const modeNames = ['Cool', 'Off', 'Heat'];
      const modeBtns = modeNames.map((nm, i) => h('button', { type: 'button', 'aria-pressed': String(i - 1 === S.mode), onclick: () => setMode(i - 1) }, nm));
      dock.appendChild(h('section', {}, h('h2', {}, 'The heaters'), h('div', { class: 'seg', role: 'group', 'aria-label': 'Heater mode' }, modeBtns)));
      const pOut = h('output', { class: 'val' });
      const pSlider = h('input', { type: 'range', min: '0.02', max: '0.16', step: '0.01', value: String(S.power), 'aria-label': 'Heater power' });
      pSlider.addEventListener('input', () => { S.power = parseFloat(pSlider.value); pOut.textContent = S.power < 0.07 ? 'gentle' : S.power < 0.14 ? 'steady' : 'fierce'; });
      pOut.textContent = 'steady';
      dock.appendChild(h('section', {}, h('div', { class: 'row' }, h('h2', {}, 'Power'), pOut), pSlider,
        h('p', { class: 'hint' }, 'Every heater puts in exactly the same energy for each molecule.')));
      const onBtns = IDS.map((id) => h('button', { type: 'button', class: 'chip', 'aria-pressed': 'true', onclick: (e) => { S.on[id] = !S.on[id]; e.currentTarget.setAttribute('aria-pressed', String(S.on[id])); S.hinted = true; } }, NAME[id]));
      dock.appendChild(h('section', {}, h('h2', {}, 'Heater under'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Which boxes have the heater switched on' }, onBtns),
        h('p', { class: 'hint' }, 'Switch one off to give the others a head start.')));
      const resetBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => reset() }, 'Start over');
      dock.appendChild(h('section', {}, h('div', { class: 'actions' }, resetBtn)));
      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'slow', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const meter = h('div', { class: 'meters' });
      const key = h('div', { class: 'legend' },
        h('span', {}, h('i', { class: 'k-pos' }), 'a hydrogen, δ+'), h('span', {}, h('i', { class: 'k-neg' }), 'an oxygen, δ−'), h('span', {}, h('i', { class: 'k-hs' }), 'a hydrogen bond'));
      aux.appendChild(h('section', { class: 'panel' }, statusP, meter, key));
      const chart = BL.stage(h('div'), '2.2 / 1', { label: 'Graph of temperature against the heat that has gone in, for the three boxes. A steep line means the box warms quickly for a little heat. A shallow line means it soaks up a lot of heat for each degree.' });
      chart.wrap.classList.add('flat', 'hist');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'How much heat for each degree?'), chart.wrap,
        h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'k-line s1' }), 'Water-like'), h('span', {}, h('i', { class: 'k-line s2' }), 'Weak hands'), h('span', {}, h('i', { class: 'k-line s3' }), 'No hands')),
        h('p', { class: 'hint' }, 'The line is the temperature of each box against the heat that went in. Steep: it heats up fast. Shallow: it soaks up heat.')));

      function say(t) { statusP.textContent = t; }
      function setMode(m) {
        S.mode = m; S.hinted = true; modeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i - 1 === m)));
      }
      function reset() {
        IDS.forEach((id) => { S.E[id] = eOf(id, KSTART); S.Q[id] = 0; S.qmin[id] = 0; S.qmax[id] = 0; S.W[id].setK(KSTART); });
        S.total = 0; S.hot = false; S.mode = 0; S.hinted = false; modeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === 1)));
        say('Everything is back to a cool start. Turn on the heaters.');
      }
      const tempOf = (id) => S.W[id].getK();

      /* ---------------- frame ---------------- */
      function frame(dt) {
        const pal = BL.pal, cw = stage.w;
        const gap = Math.max(6, cw * 0.015), colW = (cw - gap * 2) / 3, boxH = colW * 0.8, topB = 34, botB = 44;
        const need = Math.round(topB + boxH + botB), asp = cw + ' / ' + need;
        if (asp !== S.aspect) { S.aspect = asp; stage.wrap.style.aspectRatio = asp; }
        const ch = stage.h; S.u = colW / 10;

        // heat in (or out)
        const mode = S.mode;
        IDS.forEach((id) => {
          if (mode !== 0 && S.on[id]) {
            const dE = mode * S.power * dt;
            const e1 = clamp(S.E[id] + dE, eOf(id, KLO), eOf(id, KHI)); S.Q[id] += e1 - S.E[id]; S.E[id] = e1; S.qmin[id] = Math.min(S.qmin[id], S.Q[id]); S.qmax[id] = Math.max(S.qmax[id], S.Q[id]);
          }
          S.W[id].setK(kOf(id, S.E[id]));
        });
        const t0 = performance.now(); let n = 0;
        while (n < 24 && performance.now() - t0 < 12) { IDS.forEach((id) => M.step(S.W[id], 0.005)); n++; }
        const a = 1 - Math.exp(-dt / 1.0);
        IDS.forEach((id) => { S.hb[id] += (M.handshakes(S.W[id]).perMolecule - S.hb[id]) * a; });

        // goals
        const K = { water: tempOf('water'), weak: tempOf('weak'), none: tempOf('none') };
        if (S.Q.none >= 0.3 && S.Q.water >= 0.3 && S.Q.weak >= 0.3) goals.done('heat');
        if (K.none > 640 && K.water < 440) goals.done('race');
        if (S.hb.water < S.hb0 - 0.6 && S.Q.water > 0.3) goals.done('hands');
        if (Math.min(K.water, K.weak, K.none) > 450 && Math.max(K.water, K.weak, K.none) - Math.min(K.water, K.weak, K.none) < 30 && (S.Q.water - S.Q.none) > 0.3) goals.done('same');
        if (Math.min(K.water, K.weak, K.none) > 560) S.hot = true;
        if (S.hot && K.none < 260 && K.water > 340) goals.done('cool');

        draw(pal, cw, ch, colW, gap, boxH, topB, K);
        drawChart(K);
        meterText(K);
      }

      function meterText(K) {
        const now = performance.now(); if (now - S.lastMeter < 200) return; S.lastMeter = now;
        meter.textContent = '';
        const row = (k, v, pct) => meter.appendChild(h('div', { class: 'meter' }, h('div', { class: 'meter-row' }, h('span', {}, k), h('b', {}, v)), pct != null ? h('div', { class: 'mbar' }, h('div', { style: 'width:' + clamp(pct, 0, 1) * 100 + '%' })) : null));
        IDS.forEach((id) => row(NAME[id] + (id === 'none' ? '' : ' · handshakes'), Math.round(K[id]) + ' K' + (id === 'none' ? '' : ' · ' + S.hb[id].toFixed(1) + ' each'), id === 'none' ? (K[id] - KLO) / (KHI - KLO) : S.hb[id] / 2.4));
        if (!S.hinted) { say('Same heater under every box. Press Heat.'); return; }
        const spread = Math.max(K.water, K.weak, K.none) - Math.min(K.water, K.weak, K.none);
        if (S.mode === -1) say(S.hot ? 'The same cooling for each box. See who holds on to its heat the longest.' : 'Cooling all three the same.');
        else if (S.mode === 1 && spread > 80) say('Same heat in, different temperatures out. The water-like box keeps its heat in its handshakes.');
        else if (S.mode === 1) say('Heating all three the same amount.');
        else say('Heaters off. Nothing is going in or out.');
      }

      /* ---------------- drawing ---------------- */
      function drawMol(W, i, x0, y0, u, pal) {
        BL.mol.byType(W.type.id)(ctx, x0 + W.x[i] * u, y0 + W.y[i] * u, W.th[i], u, pal, { label: u > 30, lone: 0.6 });
      }

      function draw(pal, cw, ch, colW, gap, boxH, topB, K) {
        ctx.clearRect(0, 0, cw, ch);
        const u = S.u, f = BL.fs(14), col = pal.tHydrogen || pal.ui, flick = performance.now() / 160;
        IDS.forEach((id, c) => {
          const W = S.W[id], x0 = c * (colW + gap), y0 = topB, warm = clamp((K[id] - 100) / 600, 0, 1);
          // name
          ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 15); ctx.textAlign = 'center'; ctx.fillText(NAME[id], x0 + colW / 2, 20);
          // the box
          ctx.fillStyle = BL.alpha(BL.mix(pal.ui, pal.electron, warm), pal.dark ? 0.22 : 0.16); ctx.fillRect(x0, y0, colW, boxH);
          ctx.lineWidth = 3; ctx.strokeStyle = pal.line2; ctx.strokeRect(x0, y0, colW, boxH);
          // handshakes, then molecules
          const hs = M.handshakes(W);
          ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, colW, boxH); ctx.clip();
          for (let i = 0; i < W.n; i++) drawMol(W, i, x0, y0, u, pal);
          const sa = [0, 0], sb = [0, 0];
          hs.list.forEach(([i, a, j, b, gg]) => {
            M.site(W, i, a, sa); M.site(W, j, b, sb);
            BL.mol.bridge(ctx, x0 + sa[0] * u, y0 + sa[1] * u, x0 + sb[0] * u, y0 + sb[1] * u, pal, gg, Math.max(2.5, u * 0.26));
          });
          ctx.restore();
          // heater
          const by = y0 + boxH + 8, heating = S.mode === 1 && S.on[id], cooling = S.mode === -1 && S.on[id];
          ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = heating ? pal.electron : cooling ? pal.ui : pal.line2;
          ctx.beginPath(); const nz = Math.max(3, Math.floor(colW / 26)), step = (colW - 24) / nz;
          for (let k = 0; k <= nz; k++) { const x = x0 + 12 + k * step, y = by + 10 + ((heating || cooling) ? Math.sin(flick * (heating ? 1 : -1) + k * 1.5) * 5 : 0); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke(); ctx.lineCap = 'butt';
          ctx.fillStyle = pal.muted; ctx.font = BL.font(600, 13); ctx.textAlign = 'center';
          ctx.fillText(heating ? 'heating' : cooling ? 'cooling' : S.on[id] ? 'heater off' : 'switched off', x0 + colW / 2, by + 32);
          // temperature
          BL.label(ctx, BL.tempLabel(K[id]), x0 + colW / 2, y0 + 20, { font: BL.font(800, 17), border: pal.fg });
        });
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'press Heat in the side panel', cw / 2, topB + boxH / 2, { font: BL.font(700, 14), border: pal.ui });
      }

      function drawChart(K) {
        const c = chart.ctx, W = chart.w, H = chart.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        const f = BL.fs(13), m = { l: 44, r: 12, t: 12, b: f * 2.5 }, Q0 = -0.4, Q1 = 1.9;
        const X = (q) => m.l + ((q - Q0) / (Q1 - Q0)) * (W - m.l - m.r), Y = (k) => H - m.b - ((k - KLO) / (KHI - KLO)) * (H - m.b - m.t);
        c.font = BL.font(400, 13); c.textAlign = 'right'; c.fillStyle = pal.muted;
        [200, 400, 600, 800].forEach((k) => { c.strokeStyle = pal.line; c.lineWidth = 1; c.beginPath(); c.moveTo(m.l, Y(k)); c.lineTo(W - m.r, Y(k)); c.stroke(); c.fillText(k + ' K', m.l - 6, Y(k) + 4); });
        c.textAlign = 'right'; c.fillText('heat added →', W - m.r, H - 3);
        const x0 = X(0); c.setLineDash([3, 5]); c.strokeStyle = pal.line2; c.beginPath(); c.moveTo(x0, m.t); c.lineTo(x0, H - m.b); c.stroke(); c.setLineDash([]);
        c.textAlign = 'center'; c.fillStyle = pal.muted; c.fillText('start', x0, H - m.b + f * 1.25);
        const st = { water: { col: pal.ui, dash: [], shape: 'o' }, weak: { col: pal.electron, dash: [9, 5], shape: 't' }, none: { col: pal.fg, dash: [2, 5], shape: 's' } };
        IDS.forEach((id) => {
          const s = st[id], e0 = eOf(id, KSTART), qa = S.qmin[id], qb = S.qmax[id];
          c.strokeStyle = s.col; c.lineWidth = 3; c.setLineDash(s.dash); c.beginPath();
          const nseg = 40; for (let k = 0; k <= nseg; k++) { const q = qa + (qb - qa) * k / nseg, kk = kOf(id, e0 + q); k ? c.lineTo(X(q), Y(kk)) : c.moveTo(X(q), Y(kk)); }
          c.stroke(); c.setLineDash([]);
          const x = X(S.Q[id]), y = Y(K[id]); c.fillStyle = s.col; c.strokeStyle = pal.panel; c.lineWidth = 1.5; c.beginPath();
          if (s.shape === 'o') c.arc(x, y, 6, 0, 7); else if (s.shape === 's') c.rect(x - 5, y - 5, 10, 10); else { c.moveTo(x, y - 7); c.lineTo(x + 7, y + 5); c.lineTo(x - 7, y + 5); c.closePath(); } c.fill(); c.stroke();
        });
      }

      say('Same heater under every box. Press Heat.');
      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); chart.destroy(); } };
    },
  });
})();
