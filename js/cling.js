/* Cling: does water hold on to the surface, or to itself?
   A small drop of water-like molecules sits on a surface. Turn up how much the
   surface grabs and the drop spreads out flat (it clings to the surface). Turn
   it down and the drop pulls itself into a bead (it clings to itself). Change
   how tightly the water grips itself and the same surface behaves differently.
   Tilt the surface: a drop on a surface that grabs stays put; on one that does
   not, it slides.

   Model: js/water2d.js. The surface grab is an exponential well under the
   molecules (plus sideways drag where it grabs). The contact angle is measured
   from the molecules: width of the layer touching the floor and height of the drop. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const M = BL.water2d;

  const WW = 18, WH = 10, N = 30, G = 0.06, K = 300, WA_MAX = 4;
  const PRESETS = [['Wax', 5], ['Plastic', 28], ['Glass', 85]];
  const GOALS = [
    { id: 'bead', text: 'Make the water pull itself into a bead.' },
    { id: 'wet', text: 'Make the water spread flat across the surface.' },
    { id: 'cohere', text: 'Keep the surface the same, and change the drop’s shape by changing how tightly the water grips itself.' },
    { id: 'slide', text: 'Tilt a surface until the drop slides along it.' },
    { id: 'stick', text: 'Tilt a surface a long way and have the drop stay put.' },
    { id: 'presets', text: 'Try wax, plastic and glass.' },
  ];
  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true"><path d="M20 92 H180" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M62 92 C62 54 138 54 138 92 Z" fill="var(--wash)" stroke="var(--ui)" stroke-width="3.5"/>' +
    '<g fill="var(--electron)"><path d="M30 99 l5 8 5-8z"/><path d="M60 99 l5 8 5-8z"/><path d="M90 99 l5 8 5-8z"/><path d="M120 99 l5 8 5-8z"/><path d="M150 99 l5 8 5-8z"/></g></svg>';

  BL.register({
    id: 'cling', field: 'water', order: 1, name: 'Cling',
    tagline: 'Water meets glass, then water meets water.',
    lede: 'A drop of real water molecules resting on a surface, seen from the side. It beads or spreads depending on who grips harder — the surface, or the water holding on to itself.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        grab: 28, coh: 100, tilt: 0, W: null, u: 20, ang: 90, hasAng: false, bonds: [], t: 0,
        series: [new Map(), new Map(), new Map()], sampleT: 0, sinceChange: 0, presets: new Set(), hinted: false,
        lo: 999, hi: -999, cohTouched: false, base: null, seed: 11,
      };
      const stage = BL.stage(stageHost, '9 / 5', {
        label: 'A small drop of water molecules resting on a surface, seen from the side. The drop spreads out or pulls into a bead depending on how much the surface grabs the water and how tightly the water grips itself. The controls are in the side panel.',
        focusable: true,
      });
      stage.wrap.classList.add('cling-stage');
      const ctx = stage.ctx;
      const waOf = () => WA_MAX * S.grab / 100;

      /* ---------------- dock ---------------- */
      const presetBtns = PRESETS.map(([name, v]) => h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.presets.add(name); S.grab = v; grabIn.value = String(v); apply(true); if (S.presets.size >= 3) goals.done('presets'); } }, name));
      dock.appendChild(h('section', {}, h('h2', {}, 'Surface'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Pick a surface' }, presetBtns)));

      const mk = (label, min, max, step, val, fmt, cb, ends) => {
        const out = h('output', { class: 'val' }), input = h('input', { type: 'range', min, max, step, value: val, 'aria-label': label });
        input.addEventListener('input', () => { cb(parseFloat(input.value)); out.textContent = fmt(parseFloat(input.value)); S.hinted = true; });
        out.textContent = fmt(val);
        return { out, input, el: h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, label), out), h('div', { class: 'range-wrap' }, input, h('div', { class: 'range-ends' }, h('span', {}, ends[0]), h('span', {}, ends[1])))) };
      };
      const grabC = mk('How much the surface grabs water', '0', '100', '1', S.grab, (v) => Math.round(v) + '%', (v) => { S.grab = v; apply(false); }, ['not at all', 'a lot']);
      const grabIn = grabC.input;
      const cohC = mk('How tightly water grips itself', '40', '160', '5', S.coh, (v) => Math.round(v) + '%', (v) => { S.coh = v; S.cohTouched = true; apply(false, true); }, ['loosely', 'tightly']);
      const tiltC = mk('Tilt the surface', '0', '40', '1', S.tilt, (v) => Math.round(v) + '°', (v) => { S.tilt = v; apply(false, false, true); }, ['flat', 'steep']);
      dock.appendChild(h('section', {}, grabC.el, cohC.el, tiltC.el,
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action ghost', onclick: () => newDrop() }, 'Drop water on it again'))));

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'cling', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const meter = h('div', { class: 'meters' });
      const key = h('div', { class: 'legend' },
        h('span', {}, h('i', { class: 'k-pos' }), 'a hydrogen, δ+'), h('span', {}, h('i', { class: 'k-neg' }), 'an oxygen, δ−'), h('span', {}, h('i', { class: 'k-hs' }), 'a hydrogen bond'),
        h('span', {}, h('i', { class: 'k-grab' }), 'a place where the surface grabs'));
      aux.appendChild(h('section', { class: 'panel' }, statusP, meter, key));
      const chart = BL.stage(h('div'), '2.6 / 1', { label: 'Graph of the drop’s contact angle against how much the surface grabs, for three levels of how tightly the water grips itself.' });
      chart.wrap.classList.add('flat', 'hist');
      const clearBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => S.series.forEach((m) => m.clear()) }, 'Clear the graph');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'How the drop’s edge meets the surface'), chart.wrap,
        h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'k-line s1' }), 'water grips itself loosely'), h('span', {}, h('i', { class: 'k-line s2' }), 'normally'), h('span', {}, h('i', { class: 'k-line s3' }), 'tightly')),
        h('div', { class: 'actions' }, clearBtn),
        h('p', { class: 'hint' }, 'The contact angle is how steeply the water’s edge rises from the surface. Points are added while the drop settles. Change one slider at a time.')));

      /* ---------------- world ---------------- */
      function newDrop() {
        S.seed++; S.hasAng = false;
        const W = M.create({ n: N, w: WW, h: WH, type: 'water', K, g: G, gamma: 0.3, seed: S.seed });
        for (let i = 0; i < N; i++) { const c = i % 6, r = Math.floor(i / 6); W.x[i] = WW / 2 - 3 + c * 1.1 + 0.3 * (r & 1); W.y[i] = WH - 0.7 - r; W.th[i] = Math.random() * 6.28; }
        W.floorFric = 4; W.fresh = false; S.W = W; apply(true, true, true);
        S.base = null;
      }
      function apply(resetRange, cohChanged, tiltChanged) {
        const W = S.W; if (!W) return;
        W.floorWa = waOf(); W.hs.fill(S.coh / 100);
        const a = S.tilt * Math.PI / 180; W.g = G * Math.cos(a); W.gx = G * Math.sin(a); W.fresh = false;
        presetBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(Math.abs(S.grab - PRESETS[i][1]) < 2)));
        grabC.out.textContent = Math.round(S.grab) + '%'; grabC.input.value = String(S.grab);
        S.sinceChange = 0; if (!cohChanged || resetRange === true) { if (!cohChanged) { S.lo = 999; S.hi = -999; S.cohTouched = false; } }
        S.base = null;
      }

      /* ---------------- measuring the drop ---------------- */
      function measure() {
        const W = S.W, idx = [];
        for (let i = 0; i < N; i++) { let c = 0; for (let j = 0; j < N; j++) if (j !== i && Math.hypot(W.x[i] - W.x[j], W.y[i] - W.y[j]) < 1.4) c++; if (c >= 1) idx.push(i); }
        if (idx.length < 6) return null;
        // largest connected group
        const seen = new Set(), groups = [];
        idx.forEach((s0) => { if (seen.has(s0)) return; const grp = [], q = [s0]; seen.add(s0); while (q.length) { const a = q.pop(); grp.push(a); idx.forEach((b) => { if (!seen.has(b) && Math.hypot(W.x[a] - W.x[b], W.y[a] - W.y[b]) < 1.4) { seen.add(b); q.push(b); } }); } groups.push(grp); });
        groups.sort((a, b) => b.length - a.length);
        const sel = groups[0]; if (sel.length < 6) return null;
        const band = sel.filter((i) => W.y[i] > WH - 1.7); if (band.length < 2) return null;
        const xs = band.map((i) => W.x[i]), x0 = Math.min(...xs), x1 = Math.max(...xs);
        const wd = x1 - x0 + 1, ht = WH - Math.min(...sel.map((i) => W.y[i])) + 0.5;
        const mean = sel.reduce((s, i) => s + W.x[i], 0) / sel.length;
        return { ang: 2 * Math.atan2(2 * ht, wd) * 180 / Math.PI, x0, x1, mean, n: sel.length };
      }

      /* ---------------- frame ---------------- */
      let mTick = 0, cur = null;
      function frame(dt) {
        const W = S.W, pal = BL.pal, cw = stage.w, ch = stage.h;
        S.u = Math.min(cw / WW, (ch - 34) / WH);
        const t0 = performance.now(); let k = 0; while (k < 40 && performance.now() - t0 < 10) { M.step(W, 0.005); k++; }
        S.t += dt; S.sinceChange += dt;
        const hs = M.handshakes(W); S.bonds = hs.list;
        if (++mTick % 6 === 0) {
          cur = measure();
          if (cur) { S.ang = S.hasAng ? S.ang + (cur.ang - S.ang) * 0.12 : cur.ang; S.hasAng = true; }
        }
        // goals
        if (S.hasAng && S.sinceChange > 4) {
          if (S.ang > 115) goals.done('bead');
          if (S.ang < 45) goals.done('wet');
          S.lo = Math.min(S.lo, S.ang); S.hi = Math.max(S.hi, S.ang);
          if (S.cohTouched && S.hi - S.lo > 35) goals.done('cohere');
        }
        if (cur) {
          if (!S.base || S.base.tilt !== S.tilt || Math.abs(S.base.grab - S.grab) > 2) S.base = { tilt: S.tilt, grab: S.grab, x: cur.mean, t: S.t };
          const moved = Math.abs(cur.mean - S.base.x), el = S.t - S.base.t;
          if (S.tilt >= 15 && S.grab <= 20 && moved > 4) goals.done('slide');
          if (S.tilt >= 25 && S.grab >= 60 && el > 7 && moved < 2.2) goals.done('stick');
        }
        // the graph
        S.sampleT += dt;
        if (S.sampleT > 0.5 && S.hasAng && S.sinceChange > 5 && S.tilt === 0) {
          S.sampleT = 0; const bin = S.coh < 75 ? 0 : S.coh > 125 ? 2 : 1, key = Math.round(S.grab / 5) * 5, m = S.series[bin], c = m.get(key) || { s: 0, n: 0 };
          c.s += S.ang; c.n += 1; if (c.n > 40) { c.s *= 0.9; c.n *= 0.9; } m.set(key, c);
        }
        draw(pal, cw, ch);
        drawChart();
        words();
      }

      function words() {
        const now = performance.now(); if (now - (S.lastW || 0) < 250) return; S.lastW = now;
        meter.textContent = '';
        const row = (k, v, pct) => meter.appendChild(h('div', { class: 'meter' }, h('div', { class: 'meter-row' }, h('span', {}, k), h('b', {}, v)), h('div', { class: 'mbar' }, h('div', { style: 'width:' + clamp(pct, 0, 1) * 100 + '%' }))));
        row('The surface grabs the water', Math.round(S.grab) + '%', S.grab / 100);
        row('The water grips itself', Math.round(S.coh) + '%', S.coh / 160);
        if (!S.hasAng) { statusP.textContent = 'Waiting for the drop to settle…'; return; }
        const a = S.ang;
        const word = a > 115 ? 'a bead' : a > 75 ? 'a dome' : a > 45 ? 'a low, spreading dome' : 'a flat film';
        meter.appendChild(h('div', { class: 'meter-row' }, h('span', {}, 'The drop’s edge rises at'), h('b', {}, '≈ ' + Math.round(a / 5) * 5 + '°')));
        statusP.textContent = 'The drop is ' + word + '. ' + (a > 100 ? 'The water would rather hold on to itself than to the surface.' : a < 60 ? 'The surface pulls the water outward more than the water pulls itself in.' : 'The two pulls are fairly close to even.');
      }

      /* ---------------- drawing ---------------- */
      function draw(pal, cw, ch) {
        const W = S.W, u = S.u, ox = (cw - WW * u) / 2, oy = ch - 34 - WH * u;
        ctx.clearRect(0, 0, cw, ch);
        ctx.save(); ctx.translate(ox, oy);
        // the surface
        const fy = WH * u;
        ctx.fillStyle = BL.mix(pal.panel, pal.fg, 0.12); ctx.fillRect(-ox, fy, cw, ch - fy + 40);
        ctx.fillStyle = BL.alpha(pal.electron, S.grab / 100 * 0.2); ctx.fillRect(-ox, fy, cw, ch - fy + 40);
        ctx.fillStyle = pal.muted; ctx.fillRect(-ox, fy, cw, 3);
        // grabbing marks: more, and bigger, when the surface grabs more
        const n = 6 + Math.round(S.grab / 100 * 20), sz = 3 + S.grab / 100 * 6;
        ctx.fillStyle = pal.electron;
        for (let k = 0; k < n; k++) { const x = (k + 0.5) / n * WW * u; ctx.beginPath(); ctx.moveTo(x - sz, fy + 4); ctx.lineTo(x + sz, fy + 4); ctx.lineTo(x, fy + 4 + sz * 1.6); ctx.closePath(); ctx.globalAlpha = 0.35 + 0.6 * S.grab / 100; ctx.fill(); ctx.globalAlpha = 1; }
        // walls
        ctx.strokeStyle = pal.line2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(1, fy); ctx.moveTo(WW * u - 1, 0); ctx.lineTo(WW * u - 1, fy); ctx.stroke();
        // handshakes
        for (let i = 0; i < N; i++) {
          BL.mol.water(ctx, W.x[i] * u, W.y[i] * u, W.th[i], u, pal, { label: true, lone: 0.7 });
        }
        // a hydrogen bond runs from one molecule's hydrogen to another's lone pair, so draw it there
        const sa = [0, 0], sb = [0, 0];
        S.bonds.forEach(([i, a, j, b, g]) => {
          M.site(W, i, a, sa); M.site(W, j, b, sb);
          BL.mol.bridge(ctx, sa[0] * u, sa[1] * u, sb[0] * u, sb[1] * u, pal, g, Math.max(3, u * 0.2));
        });
        // contact angle
        if (cur && S.hasAng) {
          const px = cur.x0 * u - 0.1 * u, py = fy, a = S.ang * Math.PI / 180, L = Math.min(3.2 * u, 70);
          ctx.strokeStyle = pal.fg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - L * 0.6, py - 1); ctx.lineTo(px + L, py - 1); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(px, py - 1); ctx.lineTo(px + Math.cos(a) * L, py - 1 - Math.sin(a) * L); ctx.stroke();
          ctx.beginPath(); ctx.arc(px, py - 1, L * 0.55, -a, 0); ctx.lineWidth = 2.5; ctx.stroke();
          BL.label(ctx, '≈ ' + Math.round(S.ang / 5) * 5 + '°', clamp(px + L * 0.75, 40, WW * u - 40), py - 1 - L * 0.5 - 16, { font: BL.font(800, 14), border: pal.fg });
        }
        ctx.restore();
        // gravity and tilt
        const a = S.tilt * Math.PI / 180, gx0 = cw - 80, gy0 = 56;
        ctx.save(); ctx.translate(gx0, gy0);
        ctx.strokeStyle = pal.line2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, 18); ctx.lineTo(30, 18); ctx.stroke();               // a flat reference
        ctx.rotate(a); ctx.strokeStyle = pal.fg; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-30, 18); ctx.lineTo(30, 18); ctx.stroke(); ctx.fillStyle = pal.panel; ctx.strokeStyle = pal.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 6, 7, 0, 7); ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.translate(gx0, gy0); ctx.strokeStyle = pal.neg; ctx.fillStyle = pal.neg; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-34, -30); ctx.lineTo(-34 + Math.sin(a) * 26, -30 + Math.cos(a) * 26); ctx.stroke(); ctx.beginPath(); ctx.arc(-34 + Math.sin(a) * 26, -30 + Math.cos(a) * 26, 4, 0, 7); ctx.fill(); ctx.restore();
        ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'right'; ctx.fillText('tilt ' + Math.round(S.tilt) + '°', gx0 + 34, 98);
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'try the surface and the sliders →', cw / 2, 30, { font: BL.font(700, 14), border: pal.ui });
      }

      function drawChart() {
        const c = chart.ctx, W = chart.w, H = chart.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        const f = BL.fs(13), m = { l: 38, r: 12, t: 10, b: f * 2.6 };
        const X = (v) => m.l + (v / 100) * (W - m.l - m.r), Y = (a) => H - m.b - (a / 150) * (H - m.b - m.t);
        c.font = BL.font(400, 13); c.fillStyle = pal.muted; c.textAlign = 'right';
        [0, 45, 90, 135].forEach((a) => { c.strokeStyle = pal.line; c.lineWidth = 1; c.beginPath(); c.moveTo(m.l, Y(a)); c.lineTo(W - m.r, Y(a)); c.stroke(); c.fillText(a + '°', m.l - 6, Y(a) + 4); });
        c.textAlign = 'center'; [0, 25, 50, 75, 100].forEach((v) => c.fillText(v + '%', X(v), H - m.b + f * 1.25));
        c.textAlign = 'right'; c.fillText('how much the surface grabs →', W - m.r, H - 3);
        const st = [{ col: pal.ui, dash: [], shape: 'o' }, { col: pal.electron, dash: [9, 5], shape: 't' }, { col: pal.fg, dash: [2, 5], shape: 's' }];
        // the normal-grip series is drawn from the tight and loose ones' perspective: keep order loose, normal, tight
        const order = [1, 0, 2], sty = { 1: st[0], 0: st[1], 2: st[2] };
        order.forEach((bin) => {
          const s = sty[bin], pts = [...S.series[bin].entries()].filter(([, v]) => v.n >= 2).sort((a, b) => a[0] - b[0]).map(([k, v]) => [k, v.s / v.n]);
          if (!pts.length) return;
          c.strokeStyle = s.col; c.lineWidth = 3; c.setLineDash(s.dash); c.beginPath(); pts.forEach(([k, v], i) => (i ? c.lineTo(X(k), Y(v)) : c.moveTo(X(k), Y(v)))); c.stroke(); c.setLineDash([]);
          pts.forEach(([k, v]) => { const x = X(k), y = Y(v); c.fillStyle = s.col; c.strokeStyle = pal.panel; c.lineWidth = 1.5; c.beginPath(); if (s.shape === 'o') c.arc(x, y, 4.2, 0, 7); else if (s.shape === 's') c.rect(x - 3.6, y - 3.6, 7.2, 7.2); else { c.moveTo(x, y - 5); c.lineTo(x + 5, y + 4); c.lineTo(x - 5, y + 4); c.closePath(); } c.fill(); c.stroke(); });
        });
        if (S.hasAng) { c.beginPath(); c.arc(X(S.grab), Y(clamp(S.ang, 0, 150)), 9, 0, 7); c.lineWidth = 3; c.strokeStyle = pal.fg; c.stroke(); }
      }

      newDrop();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); chart.destroy(); } };
    },
  });
})();
