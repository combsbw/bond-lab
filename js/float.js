/* Float: why ice floats.
   A flat sheet of molecules on a grid. Every water-like molecule has three
   hands, 120 degrees apart, and the sheet can hold as many molecules as it
   likes (like a pond that can shrink and swell). Warm, the molecules tumble
   and pack in close. Cool them and the hands start to win: the molecules
   settle into the pattern where every hand shakes, and that pattern is a
   honeycomb, full of holes. So the sheet gets LESS dense as it freezes.
   A second kind, with no hands, only ever packs tighter as it cools.

   The block in the tank is made of whatever the sheet is made of right now,
   and the pond is the same stuff, warm. If the block is less dense, it floats.

   Model: js/lattice.js, a Monte Carlo lattice model, tested in Node
   (tools/check-lattice.js). It is a toy: the numbers on the axes are
   relative, not degrees. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const Lt = BL.lattice;

  const L = 24, TMIN = 0.1, TMAX = 0.9, TPOND = 0.5;
  const MU = { water: -1.4, plain: -1.2 };
  const KINDS = [['water', 'Water-like', 'three hands each, and they like to shake'], ['plain', 'No hands', 'only a weak stickiness, everywhere']];
  const GOALS = [
    { id: 'cool', text: 'Cool the water-like sheet until almost every hand is shaking.' },
    { id: 'open', text: 'Watch it get less dense as it cools. Where are the holes?' },
    { id: 'dense', text: 'Find the heat where the water-like sheet is packed the tightest.' },
    { id: 'sweep', text: 'Let the cooling run slowly and watch the graph draw itself.' },
    { id: 'float', text: 'Make the block float.' },
    { id: 'plain', text: 'Switch to the kind with no hands and cool it. Does it open up?' },
    { id: 'sink', text: 'Make a block that sinks in its own liquid.' },
    { id: 'melt', text: 'Warm the frozen sheet and watch the holes fill in.' },
  ];
  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true"><path d="M20 70 H180 V108 H20Z" fill="var(--wash)" opacity=".8"/><path d="M20 70 H180" stroke="var(--ui)" stroke-width="3"/>' +
    '<g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M78 40 l10 -6 l10 6 v12 l-10 6 l-10 -6Z"/><path d="M98 40 l10 -6 l10 6 v12 l-10 6 l-10 -6Z"/><path d="M88 58 l10 6 l10 -6"/></g></svg>';

  BL.register({
    id: 'float', field: 'water', order: 4, name: 'Float',
    tagline: 'Ice does something odd.',
    lede: 'A sheet of molecules that can pack loosely or tightly. Cool it down and watch which way this one goes — then look at the block floating in the tank.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        kind: 'water', T: 0.8, hinted: false, d: 0.85, b: 0.8, pond: { water: 0.86, plain: 0.97 }, dmax: { water: 0, plain: 0 },
        series: { water: new Map(), plain: new Map() }, sweep: null, sampleT: 0, wasCold: false, f: 1, tick: 0,
      };
      const G = Lt.create({ L, kind: 'water', T: S.T, mu: MU.water, seed: 11 });
      for (let i = 0; i < G.n; i++) G.s[i] = 1 + ((G.rand() * 2) | 0);
      Lt.sweep(G, 150);
      const P = { water: Lt.create({ L, kind: 'water', T: TPOND, mu: MU.water, seed: 21 }), plain: Lt.create({ L, kind: 'plain', T: TPOND, mu: MU.plain, seed: 22 }) };
      Object.values(P).forEach((g) => { for (let i = 0; i < g.n; i++) g.s[i] = 1 + ((g.rand() * 2) | 0); Lt.sweep(g, 250); });
      S.pond.water = Lt.stats(P.water).density; S.pond.plain = Lt.stats(P.plain).density;
      S.d = Lt.stats(G).density; S.b = Lt.stats(G).bonds;

      const stage = BL.stage(stageHost, '100 / 87', {
        label: 'A sheet of molecules on a grid, each drawn as a dot with three arms. Where two arms meet, the molecules are shaking hands. Use the heat slider in the side panel to warm and cool the sheet. When it is cold the water-like sheet forms a honeycomb with holes in it, and it is less dense than when it is mild.',
        focusable: true,
      });
      stage.wrap.classList.add('fl-stage');
      const ctx = stage.ctx;

      /* ---------------- dock ---------------- */
      const kBtns = KINDS.map(([id, name]) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(id === S.kind), onclick: () => setKind(id) }, name));
      const kNote = h('p', { class: 'note' });
      dock.appendChild(h('section', {}, h('h2', {}, 'Kind of molecule'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Kind of molecule' }, kBtns), kNote));

      const tOut = h('output', { class: 'val' });
      const tSlider = h('input', { type: 'range', min: String(TMIN), max: String(TMAX), step: '0.01', 'aria-label': 'Heat of the sheet, from cold to hot' });
      tSlider.addEventListener('input', () => { S.sweep = null; setT(parseFloat(tSlider.value)); S.hinted = true; });
      dock.appendChild(h('section', {}, h('div', { class: 'row' }, h('h2', {}, 'Heat'), tOut),
        h('div', { class: 'range-wrap' }, tSlider, h('div', { class: 'range-ends' }, h('span', {}, 'cold'), h('span', {}, 'hot')))));

      const sweepBtn = h('button', { type: 'button', class: 'action', onclick: () => startSweep() }, 'Cool it slowly for me');
      const clearBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => { S.series.water.clear(); S.series.plain.clear(); } }, 'Clear the graph');
      dock.appendChild(h('section', {}, h('h2', {}, 'Experiments'), h('div', { class: 'actions' }, sweepBtn, clearBtn),
        h('p', { class: 'hint' }, 'The sheet needs a little time to settle at each heat, so move the slider slowly, or let it do it for you.')));

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'float', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const meter = h('div', { class: 'meters' });
      const key = h('div', { class: 'legend' },
        h('span', {}, h('i', { class: 'k-hs' }), 'a hydrogen bond'),
        h('span', {}, h('i', { class: 'k-edge' }), 'a hand with nobody to shake'));
      aux.appendChild(h('section', { class: 'panel' }, statusP, meter, key));

      const tank = BL.stage(h('div'), '16 / 9', { label: 'A tank of the same liquid, warm, with a block of the sheet floating or sinking in it.' });
      tank.wrap.classList.add('flat', 'hist');
      const tankNote = h('p', { class: 'status' });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Float or sink?'), tank.wrap, tankNote,
        h('p', { class: 'hint' }, 'The block is made of whatever the sheet is made of right now. The pond is the same stuff, mild and liquid.')));

      const chart = BL.stage(h('div'), '2.6 / 1', { label: 'Graph of how tightly packed the sheet is, against heat, for the two kinds of molecule.' });
      chart.wrap.classList.add('flat', 'hist');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'How packed is it?'), chart.wrap,
        h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'k-line s1' }), 'Water-like'), h('span', {}, h('i', { class: 'k-line s2' }), 'No hands')),
        h('p', { class: 'hint' }, 'Each point is the fraction of grid spots that hold a molecule, at that heat. The numbers are relative, not degrees.')));

      function say(t) { statusP.textContent = t; }
      const heatWord = (T) => (T < 0.25 ? 'cold' : T < 0.4 ? 'cool' : T < 0.62 ? 'mild' : T < 0.78 ? 'warm' : 'hot');
      function setT(T) { S.T = T; G.T = T; tSlider.value = String(T); tOut.textContent = heatWord(T); }
      function setKind(id) {
        S.kind = id; G.kind = Lt.KINDS[id]; G.mu = MU[id];
        kBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(KINDS[i][0] === id)));
        kNote.textContent = KINDS[KINDS.findIndex((k) => k[0] === id)][2] + '.';
        S.hinted = true;
      }
      function startSweep() {
        setT(TMAX); Lt.sweep(G, 60); S.sweep = { t: 0, dur: 45, kind: S.kind }; S.hinted = true;
        say('Cooling slowly. Watch the packing in the graph.');
      }

      /* ---------------- frame ---------------- */
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        if (S.sweep) {
          S.sweep.t += dt; const f = clamp(S.sweep.t / S.sweep.dur, 0, 1);
          setT(TMAX - (TMAX - TMIN) * f);
          if (f >= 1) { const k = S.sweep.kind; S.sweep = null; if (k === 'water') goals.done('sweep'); say('Done. Look at the graph: where was it packed the tightest?'); }
        }
        const t0 = performance.now(); let n = 0, target = S.sweep ? 8 : 10;
        while (n < target && performance.now() - t0 < 9) { Lt.sweep(G, 1); n++; }
        Lt.sweep(P.water, 1); Lt.sweep(P.plain, 1);

        const st = Lt.stats(G), a = 1 - Math.exp(-dt / 1.5);
        S.d += (st.density - S.d) * a; S.b += (st.bonds - S.b) * a;
        for (const k of ['water', 'plain']) S.pond[k] += (Lt.stats(P[k]).density - S.pond[k]) * (1 - Math.exp(-dt / 3));
        S.dmax[S.kind] = Math.max(S.dmax[S.kind], S.d);
        const shaking = clamp(2 * S.b / 3, 0, 1);              // fraction of hands that are shaking
        S.f = S.d / S.pond[S.kind];                              // block density over pond density

        // goals
        const w = S.kind === 'water';
        if (w && shaking > 0.83) { goals.done('cool'); S.wasCold = true; }
        if (w && S.dmax.water > 0.84 && S.d < S.dmax.water - 0.08 && shaking > 0.75) goals.done('open');
        if (w && S.T > 0.42 && S.T < 0.6 && S.d > 0.85) goals.done('dense');
        if (w && S.f < 0.92 && shaking > 0.75) goals.done('float');
        if (!w && S.T < 0.3 && S.d > 0.97) goals.done('plain');
        if (!w && S.f > 1.015) goals.done('sink');
        if (w && S.wasCold && S.T > 0.6 && shaking < 0.6) goals.done('melt');

        // record the graph
        S.sampleT += dt;
        if (S.sampleT > 0.25) {
          S.sampleT = 0; const m = S.series[S.kind], bin = Math.round(S.T / 0.05) * 0.05, key = bin.toFixed(2), c = m.get(key) || { s: 0, n: 0 };
          c.s += S.d; c.n += 1; if (c.n > 12) { c.s *= 0.85; c.n *= 0.85; } m.set(key, c);
        }

        draw(pal, cw, ch);
        drawTank();
        drawChart();
        meterText(shaking);
      }

      function meterText(shaking) {
        const now = performance.now(); if (now - (S.lastMeter || 0) < 200) return; S.lastMeter = now;
        meter.textContent = '';
        const row = (k, v, pct) => meter.appendChild(h('div', { class: 'meter' }, h('div', { class: 'meter-row' }, h('span', {}, k), h('b', {}, v)), pct != null ? h('div', { class: 'mbar' }, h('div', { style: 'width:' + clamp(pct, 0, 1) * 100 + '%' })) : null));
        row('Packing', Math.round(S.d * 100) + '% of the spots filled', S.d);
        const w = S.kind === 'water';
        if (w) row('Hands shaking', Math.round(shaking * 100) + '%', shaking);
        if (S.sweep) return;
        if (!w) say(S.d > 0.96 ? 'No hands to hold them apart, so they pack as tight as they can.' : 'Cool it and watch: with nothing but a weak stickiness, the molecules just crowd together.');
        else if (shaking > 0.83) say('Almost every hand is shaking, and the sheet is full of holes. It is open and light.');
        else if (S.T < 0.4 && S.d > S.dmax.water - 0.05) say('Still settling. Give it a few seconds at this heat.');
        else if (S.T < 0.4) say('The hands are winning. The molecules are leaving gaps to line up their grips.');
        else if (S.T < 0.62) say('Mild: tumbling about, packed tight. This is the densest it gets.');
        else say('Hot: the molecules tumble too fast to hold hands for long.');
        if (!S.hinted && w) say('Cool the sheet with the heat slider.');
      }

      /* ---------------- drawing ---------------- */
      function draw(pal, cw, ch) {
        ctx.clearRect(0, 0, cw, ch);
        const u = cw / L, rowH = 0.8660254 * u, w = S.kind === 'water';
        const cold = clamp((0.62 - S.T) / 0.5, 0, 1), warm = clamp((S.T - 0.5) / 0.4, 0, 1);
        ctx.fillStyle = BL.alpha(BL.mix(pal.ui, pal.electron, warm), pal.dark ? 0.1 + 0.08 * (cold + warm) : 0.06 + 0.07 * (cold + warm)); ctx.fillRect(0, 0, cw, ch);
        const col = pal.tHydrogen || pal.ui, s = G.s;
        const px = (i) => { const x = i % L, y = (i / L) | 0; return [(((x + 0.5 * y) % L) + 0.5) * u, (y + 0.5) * rowH]; };
        // shaken arms first (so they sit under the dots)
        const arms = [];
        for (let i = 0; i < G.n; i++) {
          const v = s[i]; if (!v) continue; const [x, y] = px(i);
          for (let d = (v === 1 ? 0 : 1); d < 6; d += 2) {
            let shake = false;
            if (w) { const j = G.nb[i * 6 + d]; shake = v === 1 ? s[j] === 2 : s[j] === 1; }
            arms.push([x, y, d, shake, i]);
          }
        }
        if (w) {
          ctx.lineCap = 'round';
          for (const [x, y, d, shake] of arms) {
            const len = shake ? 0.5 * u + 1 : 0.3 * u, ex = x + Lt.AX[d] * len, ey = y + Lt.AY[d] * len;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey);
            if (shake) { ctx.lineWidth = Math.max(3, u * 0.17); ctx.strokeStyle = BL.alpha(col, 0.85); }
            else { ctx.lineWidth = Math.max(2, u * 0.08); ctx.strokeStyle = BL.alpha(pal.muted, 0.65); }
            ctx.stroke();
            // the tip of an unshaken hand is a hydrogen, waiting for someone's lone pair
            if (!shake) { ctx.beginPath(); ctx.arc(ex, ey, Math.max(1.8, u * 0.07), 0, 7); ctx.fillStyle = BL.mix(pal.panel, pal.pos, 0.6); ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = BL.alpha(pal.pos, 0.7); ctx.stroke(); }
          }
          ctx.lineCap = 'butt';
        }
        const R = u * (w ? 0.2 : 0.31);
        for (let i = 0; i < G.n; i++) {
          const [x, y] = px(i);
          if (!s[i]) { ctx.beginPath(); ctx.arc(x, y, Math.max(1.2, u * 0.04), 0, 7); ctx.fillStyle = BL.alpha(pal.muted, 0.35); ctx.fill(); continue; }
          // the body is an oxygen when this sheet is water-like, so it carries the same
          // colour as every other oxygen in the lab; the no-hands kind stays neutral grey
          ctx.beginPath(); ctx.arc(x, y, R, 0, 7);
          ctx.fillStyle = w ? BL.mix(pal.panel, pal.neg, 0.42) : BL.mix(pal.panel, pal.fg, pal.dark ? 0.2 : 0.1); ctx.fill();
          ctx.lineWidth = Math.max(1.5, u * 0.05); ctx.strokeStyle = w ? pal.neg : pal.muted; ctx.stroke();
        }
        const f = BL.fs(14);
        BL.label(ctx, heatWord(S.T) + (w ? '' : ' · no hands'), 12 + 0, 14 + BL.fs(14), { font: BL.font(800, 16), border: pal.line2, align: 'left' });
        if (S.sweep) { const pw = cw - 28; ctx.fillStyle = pal.line; ctx.fillRect(14, ch - 12, pw, 5); ctx.fillStyle = pal.electron; ctx.fillRect(14, ch - 12, pw * clamp(S.sweep.t / S.sweep.dur, 0, 1), 5); }
        else if (!S.hinted && !BL.reduced) BL.label(ctx, '↔ cool it with the heat slider', cw / 2, ch - 16 - f * 0.4, { font: BL.font(700, 14), border: pal.ui });
      }

      function drawTank() {
        const c = tank.ctx, W = tank.w, H = tank.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        const wl = H * 0.34, bw = W * 0.3, bh = H * 0.34, bx = (W - bw) / 2;
        // pond
        c.fillStyle = BL.alpha(pal.ui, pal.dark ? 0.28 : 0.2); c.fillRect(0, wl, W, H - wl);
        c.strokeStyle = pal.ui; c.lineWidth = 3; c.beginPath(); c.moveTo(0, wl); c.lineTo(W, wl); c.stroke();
        c.strokeStyle = pal.line2; c.lineWidth = 2; c.strokeRect(1, 1, W - 2, H - 2);
        // block: top edge sits (1 - sub) of its height above the water line when it floats; on the bottom when it sinks
        const sub = Math.min(1, S.f), sinks = S.f > 1.005;
        const topY = sinks ? H - bh - 6 : wl - (1 - sub) * bh;
        S.tankY = (S.tankY == null ? topY : S.tankY + (topY - S.tankY) * 0.12);
        const y = S.tankY;
        c.fillStyle = BL.mix(pal.panel, pal.fg, 0.1); c.fillRect(bx, y, bw, bh);
        // the holes (or the lack of them) in the block, drawn from the density
        const cols = 9, rows = 5, cx = bw / cols, cy = bh / rows; c.fillStyle = pal.muted;
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          const hv = Math.sin((r * 12.9898 + q * 78.233 + 3.7) * 43758.5453), rnd = hv - Math.floor(hv), keep = rnd < S.d;
          if (keep) { c.beginPath(); c.arc(bx + (q + 0.5 + (r % 2) * 0.35) * cx * 0.92 + 3, y + (r + 0.5) * cy, Math.min(cx, cy) * 0.2, 0, 7); c.fill(); }
        }
        c.strokeStyle = pal.fg; c.lineWidth = 3; c.strokeRect(bx, y, bw, bh);
        tankNote.textContent = (sinks ? 'It sinks. ' : sub < 0.995 ? 'It floats, ' + Math.round(sub * 100) + '% under the surface. ' : 'It hangs level. ') + 'Block ' + S.d.toFixed(2) + ' against pond ' + S.pond[S.kind].toFixed(2) + '.';
      }

      function drawChart() {
        const c = chart.ctx, W = chart.w, H = chart.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        const f = BL.fs(13), m = { l: 38, r: 12, t: 12, b: f * 2.5 }, D0 = 0.6, D1 = 1.02;
        const X = (T) => m.l + ((T - TMIN) / (TMAX - TMIN)) * (W - m.l - m.r), Y = (v) => H - m.b - ((v - D0) / (D1 - D0)) * (H - m.b - m.t);
        c.font = BL.font(400, 13); c.textAlign = 'right'; c.fillStyle = pal.muted;
        [0.6, 0.7, 0.8, 0.9, 1.0].forEach((v) => { c.strokeStyle = pal.line; c.lineWidth = 1; c.beginPath(); c.moveTo(m.l, Y(v)); c.lineTo(W - m.r, Y(v)); c.stroke(); c.fillText(v.toFixed(1), m.l - 6, Y(v) + 4); });
        c.textAlign = 'center'; c.fillText('cold', X(TMIN + 0.04), H - m.b + f * 1.25); c.fillText('hot', X(TMAX - 0.04), H - m.b + f * 1.25);
        c.textAlign = 'right'; c.fillText('heat →', W - m.r, H - 3);
        const styles = { water: { col: pal.ui, dash: [], shape: 'o' }, plain: { col: pal.electron, dash: [9, 5], shape: 't' } };
        let peak = null;
        for (const id of ['water', 'plain']) {
          const st = styles[id], pts = [...S.series[id].entries()].filter(([, v]) => v.n >= 2).map(([k, v]) => [parseFloat(k), v.s / v.n]).sort((a, b) => a[0] - b[0]);
          if (!pts.length) continue;
          c.strokeStyle = st.col; c.lineWidth = 3; c.setLineDash(st.dash); c.beginPath(); pts.forEach(([T, v], i) => (i ? c.lineTo(X(T), Y(v)) : c.moveTo(X(T), Y(v)))); c.stroke(); c.setLineDash([]);
          pts.forEach(([T, v]) => { const x = X(T), y = Y(v); c.fillStyle = st.col; c.strokeStyle = pal.panel; c.lineWidth = 1.5; c.beginPath(); if (st.shape === 'o') c.arc(x, y, 4.2, 0, 7); else { c.moveTo(x, y - 5); c.lineTo(x + 5, y + 4); c.lineTo(x - 5, y + 4); c.closePath(); } c.fill(); c.stroke(); });
          if (id === 'water' && pts.length >= 6) { peak = pts.reduce((a, b) => (b[1] > a[1] ? b : a)); if (peak[0] < 0.3 || peak[0] > 0.75) peak = null; }
        }
        if (peak) { c.fillStyle = pal.fg; c.textAlign = 'center'; c.font = BL.font(700, 13); c.fillText('densest', clamp(X(peak[0]), 36, W - 36), Y(peak[1]) - 11); }
        const st = styles[S.kind], x = X(clamp(S.T, TMIN, TMAX)), y = Y(clamp(S.d, D0, D1));
        c.beginPath(); c.arc(x, y, 9, 0, 7); c.lineWidth = 3; c.strokeStyle = st.col; c.stroke();
      }

      setKind('water'); setT(S.T);
      say('Cool the sheet with the heat slider.');
      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); chart.destroy(); tank.destroy(); } };
    },
  });
})();
