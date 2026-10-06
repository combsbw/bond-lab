/* Skin: why the top of water behaves like a stretched sheet.
   A molecule deep in the water is held by neighbors on every side, so the pulls
   cancel. A molecule at the surface has neighbors only below and beside it.
   Nothing pulls it up, so it is pulled in. Show the pull and you see arrows
   all pointing into the water, only at the edge. Lifting a molecule out of the
   surface means stretching those handshakes, so the surface tugs back like a
   skin. A drop floating free has no floor to shape it: it pulls itself into
   the shape with the shortest edge, a ball (a circle, in this flat world).

   Soap is made of molecules that grip less. They are the cheapest ones to put
   on the edge, so they go there and the skin gets weaker.

   Model: js/water2d.js. Edge = a molecule with an open side of 150 degrees or more. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const M = BL.water2d;

  const SCENES = {
    pool: { n: 130, w: 22, h: 11, g: 0.05, K: 270, name: 'A pool' },
    drop: { n: 48, w: 24, h: 12, g: 0, K: 250, name: 'A drop in space' },
  };
  const GOALS = [
    { id: 'edge', text: 'Mark the molecules at the edge.' },
    { id: 'pull', text: 'Show the pull on each molecule. Where do the arrows point?' },
    { id: 'poke', text: 'Pull a molecule up out of the surface and let go.' },
    { id: 'soap', text: 'Add soap and find where the soap molecules end up.' },
    { id: 'round', text: 'Compare the edge of a long strip of water with the edge of a bunched-up ball of it.' },
    { id: 'hot', text: 'Heat the pool until the molecules deep inside hold fewer than two handshakes each.' },
  ];
  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true"><path d="M20 62 Q100 50 180 62" fill="none" stroke="var(--ui)" stroke-width="4"/><path d="M20 62 Q100 50 180 62 V104 H20Z" fill="var(--wash)" opacity=".75"/>' +
    '<g stroke="var(--neg)" stroke-width="3.2" stroke-linecap="round"><path d="M50 60 v14"/><path d="M80 57 v14"/><path d="M110 57 v14"/><path d="M140 59 v14"/></g>' +
    '<g fill="var(--neg)"><path d="M44 72 l6 8 6-8z"/><path d="M74 69 l6 8 6-8z"/><path d="M104 69 l6 8 6-8z"/><path d="M134 71 l6 8 6-8z"/></g></svg>';

  BL.register({
    id: 'skin', field: 'water', order: 2, name: 'Skin',
    tagline: 'A surface light things can stand on.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        scene: 'pool', W: null, u: 20, K: { pool: 270, drop: 250 }, seed: 21, showEdge: false, showPull: false, soap: [], bonds: [],
        info: [], edgeN: 0, inHb: 0, outHb: 0, round: 1, minRound: 1, hinted: false, pokeFrom: null, soapT: 0, mTick: 0, nb: 0, lastStretch: -99,
      };
      const stage = BL.stage(stageHost, '2 / 1', {
        label: 'A side view of water molecules. In the pool scene they sit in a tank under gravity. In the drop scene a drop floats free. You can drag any molecule with the pointer. Buttons in the side panel mark the edge molecules and show the pull on each one.',
        focusable: true,
      });
      stage.wrap.classList.add('skin-stage');
      const ctx = stage.ctx;

      /* ---------------- dock ---------------- */
      const sceneBtns = Object.keys(SCENES).map((id) => h('button', { type: 'button', 'aria-pressed': String(id === S.scene), onclick: () => setScene(id) }, SCENES[id].name));
      dock.appendChild(h('section', {}, h('h2', {}, 'Scene'), h('div', { class: 'seg', role: 'group', 'aria-label': 'Scene' }, sceneBtns)));

      const edgeBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.showEdge = !S.showEdge; if (S.showEdge) goals.done('edge'); syncBtns(); } }, 'Mark the edge');
      const pullBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.showPull = !S.showPull; if (S.showPull) goals.done('pull'); syncBtns(); } }, 'Show the pull');
      dock.appendChild(h('section', {}, h('h2', {}, 'Look'), h('div', { class: 'chips' }, edgeBtn, pullBtn),
        h('p', { class: 'hint' }, 'The arrows show where a molecule’s neighbors are pulling it, all added up.')));

      const kOut = h('output', { class: 'val' });
      const kIn = h('input', { type: 'range', min: '150', max: '700', step: '5', 'aria-label': 'Temperature in kelvin' });
      kIn.addEventListener('input', () => { setK(parseFloat(kIn.value)); S.hinted = true; });
      dock.appendChild(h('section', {}, h('div', { class: 'row' }, h('h2', {}, 'Heat'), kOut), h('div', { class: 'range-wrap' }, kIn, h('div', { class: 'range-ends' }, h('span', {}, 'cold'), h('span', {}, 'hot')))));

      const soapOut = h('output', { class: 'val' });
      const addSoap = h('button', { type: 'button', class: 'action', onclick: () => soapMore(2) }, 'Add soap');
      const noSoap = h('button', { type: 'button', class: 'action ghost', onclick: () => soapMore(-99) }, 'Take it out');
      const poolBox = h('section', { class: 'pool-only' }, h('div', { class: 'row' }, h('h2', {}, 'Soap'), soapOut), h('div', { class: 'actions' }, addSoap, noSoap),
        h('p', { class: 'hint' }, 'Soap molecules have weak hands. Watch where they go.'));
      const stretchBtn = h('button', { type: 'button', class: 'action', onclick: () => stretch() }, 'Stretch it long');
      const bunchBtn = h('button', { type: 'button', class: 'action', onclick: () => bunch() }, 'Bunch it up');
      const dropBox = h('section', { class: 'drop-only' }, h('h2', {}, 'Shape'), h('div', { class: 'actions' }, stretchBtn, bunchBtn), h('p', { class: 'hint' }, 'Same water, two shapes. Compare how many molecules end up on the edge.'));
      dock.appendChild(poolBox); dock.appendChild(dropBox);
      dock.appendChild(h('section', {}, h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action ghost', onclick: () => newWorld() }, 'Start over'))));
      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'skin', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const meter = h('div', { class: 'meters' });
      const key = h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'k-edge' }), 'on the edge'), h('span', {}, h('i', { class: 'k-soap' }), 'a soap molecule'), h('span', {}, h('i', { class: 'k-arrow' }), 'the pull of the neighbors'));
      aux.appendChild(h('section', { class: 'panel' }, statusP, meter, key));
      function say(t) { statusP.textContent = t; }

      /* ---------------- world ---------------- */
      function newWorld() {
        S.seed++; const sc = SCENES[S.scene];
        const W = M.create({ n: sc.n, w: sc.w, h: sc.h, type: 'water', K: S.K[S.scene], g: sc.g, gamma: 1.2, seed: S.seed });
        if (S.scene === 'drop') stripLayout(W);
        S.W = W; S.shape = 'strip'; S.shapeT = 0; S.frac = {}; S.edgeMax = 0; S.lastStretch = performance.now() / 1000; S.soap = []; S.minRound = 1; S.pokeFrom = null; S.nb = 0; S.round = 1;
        kIn.value = String(S.K[S.scene]); kOut.textContent = Math.round(S.K[S.scene]) + ' K'; soapOut.textContent = '0'; say(S.scene === 'pool' ? 'Water in a tank. Mark the edge and show the pull.' : 'A free drop, starting as a long strip.');
      }
      function stripLayout(W) {
        const n = W.n, cols = 16;
        for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols); W.x[i] = W.w / 2 - 9.4 + c * 1.25 + 0.4 * (r & 1); W.y[i] = W.h / 2 - 1.2 + r * 1.15; W.th[i] = Math.random() * 6.28; W.vx[i] = W.vy[i] = W.om[i] = 0; }
        W.fresh = false;
      }
      function blobLayout(W) {
        const pts = []; for (let r = -8; r <= 8; r++) for (let c = -8; c <= 8; c++) pts.push([c * 1.2 + (r & 1) * 0.6, r * 1.04]);
        pts.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
        for (let i = 0; i < W.n; i++) { W.x[i] = W.w / 2 + pts[i][0]; W.y[i] = W.h / 2 + pts[i][1]; W.th[i] = Math.random() * 6.28; W.vx[i] = W.vy[i] = W.om[i] = 0; }
        W.fresh = false;
      }
      function bunch() { blobLayout(S.W); S.shape = 'blob'; S.shapeT = 0; say('Bunched into a ball. Wait a few seconds, then compare the edge count.'); }
      function stretch() { S.shape = 'strip'; S.shapeT = 0; stripLayout(S.W); S.minRound = 1; S.edgeMax = 0; S.lastStretch = performance.now() / 1000; say('Stretched. Watch it pull back.'); }
      function setScene(id) {
        S.scene = id; sceneBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(Object.keys(SCENES)[i] === id)));
        document.querySelectorAll('.pool-only').forEach((e) => { e.hidden = id !== 'pool'; }); document.querySelectorAll('.drop-only').forEach((e) => { e.hidden = id !== 'drop'; });
        stage.wrap.style.aspectRatio = '2 / 1'; newWorld();
      }
      function setK(K) { S.K[S.scene] = K; S.W.setK(K); kOut.textContent = Math.round(K) + ' K'; }
      function soapMore(d) {
        const W = S.W; if (S.scene !== 'pool') return;
        if (d < 0) { S.soap.forEach((i) => { W.hs[i] = 1; }); S.soap = []; }
        else { let tries = 0; while (d > 0 && S.soap.length < 10 && tries++ < 200) { const i = (Math.random() * W.n) | 0; if (!S.soap.includes(i) && !(info(i).edge)) { S.soap.push(i); W.hs[i] = 0.08; d--; } } if (!S.soap.length) { for (let k = 0; k < 2 && S.soap.length < 10; k++) { const i = (Math.random() * W.n) | 0; if (!S.soap.includes(i)) { S.soap.push(i); W.hs[i] = 0.08; } } } }
        W.fresh = false; soapOut.textContent = String(S.soap.length); S.soapT = 0; S.hinted = true;
        say(S.soap.length ? 'Soap added: ' + S.soap.length + ' molecules with weak hands. Give it a few seconds.' : 'No soap in the water.');
      }
      function syncBtns() { edgeBtn.setAttribute('aria-pressed', String(S.showEdge)); pullBtn.setAttribute('aria-pressed', String(S.showPull)); }
      const infoCache = [];
      function info(i) { return infoCache[i] || { edge: false, vx: 0, vy: 0, n: 0 }; }

      /* ---------------- reading the molecules ---------------- */
      function analyze() {
        const W = S.W, n = W.n, rc = 1.55; let edgeN = 0, nIn = 0, nOut = 0, hIn = 0, hOut = 0, liquid = 0;
        const hb = M.handshakes(W); S.bonds = hb.list;
        const cnt = new Float64Array(n); hb.list.forEach((q) => { if (q[4] > 0.4) { cnt[q[0]]++; cnt[q[2]]++; } });
        for (let i = 0; i < n; i++) {
          let vx = 0, vy = 0, k = 0; const ang = [];
          for (let j = 0; j < n; j++) if (j !== i) { const dx = W.x[j] - W.x[i], dy = W.y[j] - W.y[i], d = Math.hypot(dx, dy); if (d < rc) { vx += dx / d; vy += dy / d; k++; ang.push(Math.atan2(dy, dx)); } }
          const ex = ang.slice(), wl = 0.8;
          if (W.h - W.y[i] < wl) ex.push(0.9, Math.PI / 2, 2.2);
          if (W.x[i] < wl) ex.push(Math.PI - 0.6, Math.PI, -Math.PI + 0.6);
          if (W.w - W.x[i] < wl) ex.push(-0.6, 0, 0.6);
          let edge = false;
          if (k >= 1) { ang.length = 0; ex.forEach((a0) => ang.push(a0)); const kk = ang.length; ang.sort((a, b) => a - b); let gap = 2 * Math.PI - (ang[kk - 1] - ang[0]); for (let q = 1; q < kk; q++) gap = Math.max(gap, ang[q] - ang[q - 1]); edge = gap > 2.6; }
          infoCache[i] = { edge, vx, vy, n: k, hb: cnt[i] };
          if (k >= 1) { liquid++; if (edge) { edgeN++; nOut++; hOut += cnt[i]; } else { nIn++; hIn += cnt[i]; } }
        }
        S.edgeN = edgeN; S.liquid = liquid; S.inHb = nIn ? hIn / nIn : 0; S.outHb = nOut ? hOut / nOut : 0; S.nb = M.neighbors(W, 1.3);
        // roundness of the biggest clump (drop scene)
        let mx = 0, my = 0, c = 0; for (let i = 0; i < n; i++) if (infoCache[i].n >= 2) { mx += W.x[i]; my += W.y[i]; c++; }
        if (c > 6) { mx /= c; my /= c; let sxx = 0, syy = 0, sxy = 0; for (let i = 0; i < n; i++) if (infoCache[i].n >= 2) { const dx = W.x[i] - mx, dy = W.y[i] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; } const tr = sxx + syy, det = sxx * syy - sxy * sxy, d = Math.sqrt(Math.max(0, tr * tr / 4 - det)), l1 = tr / 2 + d, l2 = tr / 2 - d; const r = Math.sqrt(Math.max(0, l2) / l1); S.round += (r - S.round) * 0.2; }
      }

      /* ---------------- pointer ---------------- */
      BL.drag(stage.canvas, {
        pick: (p) => { const W = S.W, u = S.u, o = origin(); let best = -1, bd = 0.75; for (let i = 0; i < W.n; i++) { const d = Math.hypot((p.x - o.x) / u - W.x[i], (p.y - o.y) / u - W.y[i]); if (d < bd) { bd = d; best = i; } } return best >= 0 ? { i: best } : null; },
        move: (a, p, start) => { const W = S.W, u = S.u, o = origin(); S.hinted = true; if (start) S.pokeFrom = { i: a.i, y: W.y[a.i], x: W.x[a.i], edge: info(a.i).edge, n: info(a.i).n, max: 0 }; W.drag = { i: a.i, x: (p.x - o.x) / u, y: (p.y - o.y) / u, k: 30 }; },
        end: () => { const W = S.W, pf = S.pokeFrom; if (pf && pf.max > 2 && pf.n >= 2) { goals.done('poke'); say('It snapped back. The surface pulled the molecule home.'); } W.drag = null; S.pokeFrom = null; },
      });
      const origin = () => ({ x: (stage.w - SCENES[S.scene].w * S.u) / 2, y: (stage.h - SCENES[S.scene].h * S.u) / 2 });

      /* ---------------- frame ---------------- */
      function frame(dt) {
        const W = S.W, pal = BL.pal, cw = stage.w, ch = stage.h, sc = SCENES[S.scene];
        S.u = Math.min(cw / sc.w, ch / sc.h);
        const t0 = performance.now(); let k = 0; const target = S.scene === 'drop' ? 70 : 40; while (k < target && performance.now() - t0 < 10) { M.step(W, 0.005); k++; }
        if (++S.mTick % 4 === 0) analyze();
        if (S.pokeFrom && W.drag) S.pokeFrom.max = Math.max(S.pokeFrom.max, Math.hypot(W.x[S.pokeFrom.i] - S.pokeFrom.x, W.y[S.pokeFrom.i] - S.pokeFrom.y));

        // goals
        S.soapT += dt;
        if (S.scene === 'pool' && S.soap.length >= 2 && S.soapT > 5) { const onEdge = S.soap.filter((i) => info(i).edge).length; if (onEdge / S.soap.length >= 0.75) goals.done('soap'); }
        if (S.scene === 'pool' && S.liquid > 20 && S.inHb < 2.0 && S.mTick > 200 && W.getK() > 400) goals.done('hot');
        if (S.scene === 'drop' && S.liquid > 10) { S.shapeT += dt; if (S.shapeT > 4) { S.frac = S.frac || {}; S.frac[S.shape || 'strip'] = S.edgeN / S.liquid; if (S.frac.strip != null && S.frac.blob != null && S.frac.strip > S.frac.blob + 0.1) goals.done('round'); } }

        draw(pal, cw, ch);
        words();
      }
      function words() {
        const now = performance.now(); if (now - (S.lastW || 0) < 300) return; S.lastW = now;
        meter.textContent = '';
        const row = (a, b, pct) => meter.appendChild(h('div', { class: 'meter' }, h('div', { class: 'meter-row' }, h('span', {}, a), h('b', {}, b)), pct != null ? h('div', { class: 'mbar' }, h('div', { style: 'width:' + clamp(pct, 0, 1) * 100 + '%' })) : null));
        if (S.liquid < 6) { say('Too hot: the water has turned to steam, with no surface left.'); return; }
        row('Handshakes held, deep inside', S.inHb.toFixed(1) + ' each', S.inHb / 4);
        row('Handshakes held, on the edge', S.outHb.toFixed(1) + ' each', S.outHb / 4);
        row('Molecules on the edge', S.edgeN + ' of ' + S.liquid, S.edgeN / Math.max(1, S.liquid));
        if (S.scene === 'drop') row('How round the drop is', Math.round(S.round * 100) + '%', S.round);
        if (S.scene === 'pool' && S.soap.length) row('Soap molecules on the edge', S.soap.filter((i) => info(i).edge).length + ' of ' + S.soap.length, S.soap.filter((i) => info(i).edge).length / S.soap.length);
        if (!S.W.drag && !/^(Soap added|Stretched|It snapped)/.test(statusP.textContent)) say(S.outHb < S.inHb - 0.5 ? 'Molecules on the edge hold fewer handshakes. Nothing holds them from above.' : 'The molecules are churning. Cool it down to see the skin.');
      }

      /* ---------------- drawing ---------------- */
      function draw(pal, cw, ch) {
        const W = S.W, u = S.u, sc = SCENES[S.scene], o = origin();
        ctx.clearRect(0, 0, cw, ch);
        ctx.save(); ctx.translate(o.x, o.y);
        // tank
        ctx.strokeStyle = pal.line2; ctx.lineWidth = 3; ctx.strokeRect(1, 1, sc.w * u - 2, sc.h * u - 2);
        const col = pal.tHydrogen || pal.ui;
        S.bonds.forEach(([i, a, j, b, g]) => { ctx.beginPath(); ctx.moveTo(W.x[i] * u, W.y[i] * u); ctx.lineTo(W.x[j] * u, W.y[j] * u); ctx.lineCap = 'round'; ctx.lineWidth = Math.max(3, u * 0.22) * (0.35 + 0.65 * g); ctx.strokeStyle = BL.alpha(col, 0.3 + 0.45 * g); ctx.stroke(); ctx.lineCap = 'butt'; });
        for (let i = 0; i < W.n; i++) {
          const x = W.x[i] * u, y = W.y[i] * u, R = 0.5 * u, soap = S.soap.includes(i), inf = info(i);
          ctx.beginPath(); ctx.arc(x, y, R, 0, 7);
          ctx.fillStyle = soap ? BL.mix(pal.panel, pal.electron, 0.45) : BL.mix(pal.panel, pal.fg, pal.dark ? 0.12 : 0.07); ctx.fill();
          ctx.lineWidth = Math.max(1.5, u * 0.05); ctx.strokeStyle = soap ? pal.electron : pal.muted; ctx.stroke();
          const rr = Math.max(3, 0.16 * u), sm = soap ? 0.6 : 1;
          for (let q = 0; q < 4; q++) {
            const a = W.th[i] + M.SITE_ANG[q], sx = x + Math.cos(a) * M.D_ARM * u, sy = y + Math.sin(a) * M.D_ARM * u;
            ctx.beginPath(); ctx.arc(sx, sy, rr * sm, 0, 7);
            if (q < 2) { ctx.fillStyle = pal.pos; ctx.fill(); } else { ctx.fillStyle = pal.panel; ctx.fill(); ctx.lineWidth = Math.max(2, u * 0.07); ctx.strokeStyle = pal.neg; ctx.stroke(); }
          }
          if (S.showEdge && inf.edge) { ctx.beginPath(); ctx.arc(x, y, R + 3, 0, 7); ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.strokeStyle = pal.fg; ctx.stroke(); ctx.setLineDash([]); }
        }
        if (S.showPull) {
          for (let i = 0; i < W.n; i++) {
            const inf = info(i); if (!inf.edge || inf.n < 1) continue;
            const m = Math.hypot(inf.vx, inf.vy); if (m < 0.9) continue;
            const x = W.x[i] * u, y = W.y[i] * u, ux = inf.vx / m, uy = inf.vy / m, L = Math.min(1.6, 0.35 + m * 0.45) * u * 0.9;
            ctx.strokeStyle = pal.neg; ctx.fillStyle = pal.neg; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ux * L, y + uy * L); ctx.stroke(); ctx.lineCap = 'butt';
            ctx.beginPath(); ctx.moveTo(x + ux * (L + 7), y + uy * (L + 7)); ctx.lineTo(x + ux * L - uy * 7, y + uy * L + ux * 7); ctx.lineTo(x + ux * L + uy * 7, y + uy * L - ux * 7); ctx.closePath(); ctx.fill();
          }
        }
        if (W.drag) { const i = W.drag.i, x = W.drag.x * u, y = W.drag.y * u; ctx.beginPath(); ctx.moveTo(W.x[i] * u, W.y[i] * u); ctx.lineTo(x, y); ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.strokeStyle = pal.fg; ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fillStyle = pal.fg; ctx.fill(); BL.label(ctx, 'pulling with ' + Math.hypot(W.drag.fx || 0, W.drag.fy || 0).toFixed(1), clamp(x, 70, sc.w * u - 70), y < 40 ? y + 30 : y - 24, { font: BL.font(700, 13), border: pal.fg }); }
        ctx.restore();
        ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 20, true); ctx.textAlign = 'left'; ctx.fillText(Math.round(W.getK()) + ' K', 14, 10 + BL.fs(20));
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'drag a molecule up out of the water', cw / 2, ch - 20, { font: BL.font(700, 14), border: pal.ui });
      }

      setScene('pool'); syncBtns();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
