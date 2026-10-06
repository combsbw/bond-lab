/* The Well: how hard is it to pull a pair apart?
   Every attraction is a valley in an energy landscape. The pair sits in the
   valley, jiggling. Heat is water that fills it. Your hand is a weak spring.
   The learner pulls, heats and watches which pairs hold and which let go,
   with real depths, real distances and real temperatures.

   Physics lives in physics.js. This file draws it and wires the controls. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const PH = BL.physics;
  const TYPES = PH.TYPES;

  const FOUR = ['covalent', 'ionic', 'hydrogen', 'vdw'];
  const ALL_ORDER = ['covalent', 'ionic', 'hydrogen', 'dipole', 'iondipole', 'vdw'];

  /* How each pair looks. rad = real-ish radius in angstrom. Colors come from the theme (BL.pal.types). */
  const VIS = {
    covalent: { A: { sym: 'H', q: 0, rad: 0.31 }, B: { sym: 'H', q: 0, rad: 0.31 } },
    ionic: { A: { sym: 'Na', q: 1, rad: 0.95, ion: '⁺' }, B: { sym: 'Cl', q: -1, rad: 1.81, ion: '⁻' } },
    hydrogen: { A: { sym: 'H', q: 0.4, rad: 0.31 }, B: { sym: 'O', q: -0.8, rad: 0.66 } },
    dipole: { A: { sym: 'H', q: 0.2, rad: 0.31 }, B: { sym: 'Cl', q: -0.2, rad: 0.99 } },
    iondipole: { A: { sym: 'Na', q: 1, rad: 0.95, ion: '⁺' }, B: { sym: 'O', q: -0.8, rad: 0.66 } },
    vdw: { A: { sym: 'Ar', q: 0, rad: 1.88 }, B: { sym: 'Ar', q: 0, rad: 1.88 } },
  };
  const col = (id) => BL.pal.types[id];

  const FCAP = 30;          // the strongest pull a hand can manage (kJ/mol per angstrom). Deliberately modest.
  const KH = FCAP / 0.35;   // hand spring: saturates after 0.35 A of stretch
  const FAST = 14;          // time-lapse multiplier
  const LANDMARKS = [
    [77, 'liquid nitrogen'], [273, 'ice melts'], [373, 'water boils'],
    [1500, 'lava'], [5772, 'Sun’s surface'], [30000, 'lightning'],
  ];
  const fmtK = (T) => Math.round(T).toLocaleString('en-US');

  const GOALS = [
    { id: 'pull', text: 'Pull a pair apart by hand.' },
    { id: 'stuck', text: 'Find a pair your hand can’t pull apart.' },
    { id: 'hbreak', text: 'Break a hydrogen bond with heat alone.' },
    { id: 'flicker', text: 'Find a heat where a pair keeps breaking and re-forming.' },
    { id: 'cov', text: 'Break a covalent bond with heat.' },
    { id: 'four', text: 'Show all four: one gone, one wavering, two holding.' },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<path d="M0 120 L0 22 C30 22 44 26 56 56 C66 82 74 98 88 98 C102 98 112 84 124 60 C138 32 160 26 200 26 L200 120 Z" fill="var(--panel)" stroke="var(--t-covalent)" stroke-width="3.5"/>' +
    '<path d="M60 76 C70 94 80 98 88 98 C98 98 106 92 114 78 Z" fill="var(--cloud)" opacity=".4"/>' +
    '<circle cx="88" cy="90" r="7" fill="var(--panel)" stroke="var(--cloud)" stroke-width="3.5"/></svg>';

  BL.register({
    id: 'well', field: 'bonding', order: 2, name: 'The Well',
    tagline: 'How much does it take to pull a pair apart?',
    lede: 'Every attraction is a valley, and the pair sits in the bottom of it, jiggling. Pull on them with your hand, or pour heat in, and see which ones let go.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        mode: 'one', type: 'covalent',
        Tt: 298, T: 298, Tref: 298, settle: 0, lapse: false,
        pairs: {}, ema: {}, bound: {}, trans: {}, apartFor: {},
        drag: null, handF: 0, sinceDrag: 99, stuckT: 0, clock: 0, fourHold: 0, hinted: false, key: false,
      };
      const reset = (id) => {
        S.pairs[id] = PH.pairState(TYPES[id]);
        S.ema[id] = 1; S.bound[id] = true; S.trans[id] = []; S.apartFor[id] = 0;
      };
      ALL_ORDER.forEach(reset);
      const active = () => (S.mode === 'one' ? [S.type] : FOUR);

      const stage = BL.stage(stageHost, '4 / 3.2', {
        label: 'Two particles in an energy well. Drag the right-hand particle to pull on the pair. With the stage focused, the right and left arrow keys pull and Escape lets go. Use the heat slider to shake the pair.',
        focusable: true,
      });
      stage.wrap.classList.add('well-stage');
      const ctx = stage.ctx;
      const say = h('div', { class: 'sr-only', 'aria-live': 'polite' });
      stageHost.appendChild(say);

      /* ---------------- chart under the stage ---------------- */
      const chart = BL.stage(h('div'), '2.9 / 1', { label: 'For each kind of attraction, how much of the time a pair stays together at each temperature.' });
      chart.wrap.classList.add('flat', 'dial');
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'Where each one gives up'), chart.wrap,
        h('p', { class: 'hint' }, 'How much of the time a pair stays together, by temperature, over a long watch. The amber line is where the heat slider is now.')));

      const TEMPS = Array.from({ length: 76 }, (_, i) => PH.tempFromSlider(i / 75));
      const CURVES = {};
      ALL_ORDER.forEach((id) => { CURVES[id] = TEMPS.map((T) => PH.togetherness(TYPES[id], T)); });

      /* ---------------- dock ---------------- */
      const modeBtns = [['one', 'One pair'], ['four', 'All four']].map(([id, label]) =>
        h('button', { type: 'button', 'aria-pressed': String(id === S.mode), onclick: () => setMode(id) }, label));
      dock.appendChild(h('section', {}, h('h2', {}, 'Show'), h('div', { class: 'seg', role: 'group', 'aria-label': 'How many pairs to show' }, modeBtns)));

      const typeBtn = {};
      const mkType = (id, soft) => {
        const t = TYPES[id];
        const b = h('button', { type: 'button', class: 'chip' + (soft ? ' soft' : ''), 'aria-pressed': 'false', onclick: () => { S.mode = 'one'; S.type = id; ALL_ORDER.forEach(reset); sync(); } },
          h('span', { class: 'dot', style: 'background: var(--t-' + id + ')' }), t.name);
        typeBtn[id] = b; return b;
      };
      const exLine = h('p', { class: 'note' });
      dock.appendChild(h('section', {},
        h('h2', {}, 'Kind of attraction'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Kind of attraction' }, ['covalent', 'ionic', 'hydrogen'].map((id) => mkType(id, false))),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'More kinds' }, ['dipole', 'iondipole', 'vdw'].map((id) => mkType(id, true))),
        exLine));

      const heatOut = h('output', { class: 'val' });
      const heatSub = h('span', { class: 'note' });
      const heat = h('input', { type: 'range', class: 'heat', min: '0', max: '1000', step: '1', 'aria-label': 'Temperature' });
      heat.addEventListener('input', () => setTemp(PH.tempFromSlider(parseFloat(heat.value) / 1000)));
      const settling = h('span', { class: 'settling', 'aria-hidden': 'true' }, '▶▶ fast-forward');
      const lapseBtn = h('button', { type: 'button', class: 'chip soft', 'aria-pressed': 'false', onclick: () => { S.lapse = !S.lapse; sync(); } }, 'Fast time');
      const lm = h('div', { class: 'landmarks' }, LANDMARKS.map(([T, name]) =>
        h('button', { type: 'button', class: 'chip soft', onclick: () => setTemp(T) }, h('b', {}, name), BL.numv(fmtK(T) + ' K'))));
      dock.appendChild(h('section', {},
        h('div', { class: 'row' }, h('h2', {}, 'Heat'), h('span', {}, heatOut, ' ', heatSub)),
        h('div', { class: 'range-wrap' }, heat, h('div', { class: 'range-ends' }, h('span', {}, 'cold'), h('span', {}, 'hot'))),
        lm,
        h('div', { class: 'row' }, lapseBtn, settling)));

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'well', GOALS);
      dock.appendChild(goalsHost);

      function setMode(m) { S.mode = m; ALL_ORDER.forEach(reset); sync(); }
      function setTemp(T) {
        S.Tt = clamp(T, PH.T_MIN, PH.T_MAX);
        if (Math.abs(Math.log(S.Tt / S.Tref)) > 0.2) { S.settle = 1.6; S.Tref = S.Tt; }
        sync();
      }
      function sync() {
        modeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(['one', 'four'][i] === S.mode)));
        ALL_ORDER.forEach((id) => typeBtn[id].setAttribute('aria-pressed', String(S.mode === 'one' && S.type === id)));
        const t = TYPES[S.type];
        exLine.textContent = '';
        if (S.mode === 'one') {
          const w = BL.words.strength(t.D);
          exLine.append(
            t.ex + ' · ' + w.word + ' · ' + w.tangible + '. They sit ' + BL.words.gap(t.r0) + '. ',
            h('b', {}, t.Fmax > FCAP ? 'Too strong to pull apart by hand.' : 'A hand can just about pull this one apart.'),
            BL.numv(' Valley ' + t.D + ' kJ/mol deep, resting ' + t.r0.toFixed(2) + ' Å apart; a hand manages '
              + FCAP + ' kJ/mol per Å and this pair holds ' + (t.Fmax >= 10 ? Math.round(t.Fmax) : t.Fmax.toFixed(1)) + '.'));
        } else {
          exLine.append('Same heat for all four. Drag any right-hand particle.');
        }
        heat.value = Math.round(PH.sliderFromTemp(S.Tt) * 1000);
        heatOut.textContent = '';
        heatOut.append(BL.words.tempShort(S.Tt), BL.numv(' · ' + fmtK(S.Tt) + ' K'));
        heatSub.textContent = '';
        heatSub.append(BL.numv(Math.round(S.Tt - 273.15).toLocaleString('en-US') + ' °C'));
        lapseBtn.setAttribute('aria-pressed', String(S.lapse));
      }
      sync();

      /* ---------------- geometry (everything scales with the text-size setting) ---------------- */
      function geomOne() {
        const W = stage.w, H = stage.h, narrow = W < 520;
        const t = TYPES[S.type];
        const f = BL.fs(13);
        ctx.font = BL.font(400, 13);
        const padL = Math.max(ctx.measureText('apart').width, ctx.measureText('−' + t.D).width) + 18 + f * 1.3;
        const pad = { l: padL, r: f * 3.3 + 14, b: f * 2.6 };
        const headH = BL.fs(18) + BL.fs(14) + (narrow ? BL.fs(14) + 18 : 24);
        const rcap = Math.min(H < 400 ? 24 : 32, (H - headH) * 0.11);
        const trackY = headH + rcap;
        const plotTop = trackY + rcap + 18, plotBot = H - pad.b;
        const sc = (W - pad.l - pad.r) / t.R;
        const sY = (plotBot - plotTop) / 1.54;
        return {
          W, H, narrow, t, pad, rcap, trackY, plotTop, plotBot, sc, sY, headH, f,
          x: (r) => pad.l + r * sc,
          y: (U) => plotTop + (0.42 - U / t.D) * sY,
        };
      }
      function geomFour() {
        const W = stage.w, H = stage.h, narrow = W < 520;
        ctx.font = BL.font(800, 15, true);
        const names = FOUR.map((id) => ctx.measureText(TYPES[id].name).width);
        const LW = Math.min(W * 0.4, Math.max(...names) + 30);
        ctx.font = BL.font(800, 18);
        const RW = Math.max(ctx.measureText('100%').width, 50) + 16;
        const top = 6, rowH = (H - top - 6) / 4;
        const rcap = Math.min(22, rowH * 0.3);
        return { W, H, narrow, LW, RW, top, rowH, rcap };
      }
      const rowGeom = (g, i, id) => {
        const t = TYPES[id];
        const x0 = g.LW + 10 + g.rcap, sc = (g.W - g.RW - 10 - x0) / t.R;
        return { x0, sc, cy: g.top + i * g.rowH + g.rowH / 2, x: (r) => x0 + r * sc };
      };

      /* ---------------- pointer and keyboard ---------------- */
      BL.drag(stage.canvas, {
        pick: (p) => {
          if (S.mode === 'one') {
            const g = geomOne(), s = S.pairs[S.type], bx = g.x(s.r);
            const U = g.t.pot.U(s.r), by = clamp(g.y(U), g.plotTop - 4, g.plotBot);
            if (Math.hypot(p.x - bx, p.y - g.trackY) < 36 || Math.hypot(p.x - bx, p.y - by) < 30) return { type: S.type, x0: g.pad.l, sc: g.sc };
            return null;
          }
          const g = geomFour();
          for (let i = 0; i < 4; i++) {
            const id = FOUR[i], rg = rowGeom(g, i, id);
            if (Math.hypot(p.x - rg.x(S.pairs[id].r), p.y - rg.cy) < 30) return { type: id, x0: rg.x0, sc: rg.sc };
          }
          return null;
        },
        move: (hd, p) => {
          const t = TYPES[hd.type];
          S.key = false;
          S.drag = { type: hd.type, rt: clamp((p.x - hd.x0) / hd.sc, t.rMin, t.R) };
        },
        end: () => { S.drag = null; S.handF = 0; },
      });
      const release = () => { if (S.key) { S.drag = null; S.handF = 0; S.key = false; } };
      stage.canvas.addEventListener('keydown', (e) => {
        const id = S.mode === 'one' ? S.type : FOUR[0];
        const t = TYPES[id];
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const rt = S.drag && S.drag.type === id ? S.drag.rt : S.pairs[id].r;
          S.key = true; S.hinted = true;
          S.drag = { type: id, rt: clamp(rt + (e.key === 'ArrowRight' ? 0.25 : -0.25), t.rMin, t.R) };
        } else if (e.key === 'Escape') release();
      });
      stage.canvas.addEventListener('blur', release);

      /* ---------------- frame ---------------- */
      let lastSaid = '';
      function frame(dt) {
        const kk = 1 - Math.exp(-dt * 8);
        S.T = Math.exp(Math.log(S.T) + (Math.log(S.Tt) - Math.log(S.T)) * kk);
        S.settle = Math.max(0, S.settle - dt);
        const fast = !S.drag && (S.settle > 0 || S.lapse);
        const speed = fast ? FAST : 1;
        settling.classList.toggle('on', fast);
        const dtN = dt * speed;
        S.clock += dtN;
        S.sinceDrag = S.drag ? 0 : S.sinceDrag + dtN;
        const act = active();

        act.forEach((id) => {
          const t = TYPES[id], s = S.pairs[id];
          const dragging = S.drag && S.drag.type === id;
          const hand = dragging ? (r) => clamp(KH * (S.drag.rt - r), -FCAP, FCAP) : null;
          PH.run(s, t, S.T, dt, speed, hand);
          if (dragging) S.handF = clamp(KH * (S.drag.rt - s.r), -FCAP, FCAP);

          const was = S.bound[id];
          let now = was;
          if (was && s.r > t.rCut) now = false; else if (!was && s.r < t.rCut * 0.92) now = true;
          if (now !== was) { S.bound[id] = now; S.trans[id].push(S.clock); }
          S.trans[id] = S.trans[id].filter((x) => S.clock - x < 15);
          S.ema[id] += ((s.r < t.rCut ? 1 : 0) - S.ema[id]) * (1 - Math.exp(-dtN / 5));
          S.apartFor[id] = !now && !S.drag ? S.apartFor[id] + dtN : 0;
        });

        // goals
        if (S.drag) {
          const id = S.drag.type, t = TYPES[id], s = S.pairs[id];
          if (s.r > t.rCut) goals.done('pull');
          if (Math.abs(S.handF) >= FCAP * 0.98 && s.r < t.rCut && (id === 'covalent' || id === 'ionic' || id === 'iondipole')) S.stuckT += dt;
          if (S.stuckT > 1.6) goals.done('stuck');
        } else S.stuckT = Math.max(0, S.stuckT - dt);
        if (S.sinceDrag > 3) {
          if (act.includes('hydrogen') && S.apartFor.hydrogen > 1) goals.done('hbreak');
          if (act.includes('covalent') && S.apartFor.covalent > 1) goals.done('cov');
          act.forEach((id) => { if (S.trans[id].length >= 4) goals.done('flicker'); });
        }
        if (S.mode === 'four') {
          const tg = (id) => PH.togetherness(TYPES[id], S.T);
          const ok = tg('vdw') < 0.15 && tg('hydrogen') > 0.2 && tg('hydrogen') < 0.85 && tg('covalent') > 0.9 && tg('ionic') > 0.9;
          S.fourHold = ok ? S.fourHold + dt : 0;
          if (S.fourHold > 1) goals.done('four');
        }

        // a quiet spoken summary for screen readers, only when it changes
        const sum = S.mode === 'one'
          ? TYPES[S.type].name + ' pair is ' + (S.bound[S.type] ? 'together' : 'apart')
          : FOUR.map((id) => TYPES[id].name + ' ' + (S.bound[id] ? 'together' : 'apart')).join(', ');
        if (sum !== lastSaid && S.clock - (S.lastSayAt || -9) > 1.5) { lastSaid = sum; S.lastSayAt = S.clock; say.textContent = sum; }

        ctx.clearRect(0, 0, stage.w, stage.h);
        if (S.mode === 'one') drawOne(); else drawFour();
        drawChart();
      }

      /* ---------------- drawing helpers ---------------- */
      const tint = (q) => (q > 0 ? BL.pal.pos : q < 0 ? BL.pal.neg : BL.pal.fg);

      function atom(x, y, rpx, a, showQ) {
        const q = a.q, pal = BL.pal;
        ctx.beginPath(); ctx.arc(x, y, rpx, 0, 7);
        ctx.fillStyle = BL.alpha(tint(q), 0.10 + 0.22 * Math.min(1, Math.abs(q))); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(pal.fg, 0.7); ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (rpx >= 10) {
          ctx.fillStyle = pal.fg; ctx.font = BL.font(800, clamp(rpx * 0.8, 13, 17), true);
          ctx.fillText(a.sym + (a.ion || ''), x, y + 0.5);
        }
        if (showQ && !a.ion && q !== 0 && rpx >= 9) {
          ctx.font = BL.font(700, 13); ctx.fillStyle = tint(q);
          ctx.fillText(q > 0 ? 'δ+' : 'δ−', x, y + rpx + BL.fs(13) * 0.95);
        }
        ctx.textBaseline = 'alphabetic';
      }

      function bondLine(xa, xb, y, t, r, color) {
        const U = t.pot.U(r), s = clamp(-U / t.D, 0, 1);
        if (xb - xa < 2) return;
        ctx.save();
        ctx.strokeStyle = color; ctx.globalAlpha = 0.2 + 0.8 * s; ctx.lineWidth = 1.5 + 7 * Math.pow(s, 0.7); ctx.lineCap = 'round';
        if (r >= t.rCut) ctx.setLineDash([3, 7]);
        ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke();
        ctx.restore();
      }

      const radPx = (a, sc, cap) => clamp(a.rad * sc * 0.8, 9, cap);

      /* ---------------- one pair ---------------- */
      function drawOne() {
        const g = geomOne(), t = g.t, vis = VIS[S.type], s = S.pairs[S.type], pal = BL.pal, color = col(S.type);
        const { W, pad, plotTop, plotBot, x, y, f } = g;
        const kT = PH.kB * S.T;

        // header: name, status; pull gauge at right
        ctx.textAlign = 'left';
        const nameY = BL.fs(18) + 10;
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(14, nameY - BL.fs(18) * 0.32, 6, 0, 7); ctx.fill();
        ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 18, true); ctx.fillText(t.name, 28, nameY);
        const together = s.r < t.rCut;
        const pct = Math.round(100 * PH.adjust(t, S.ema[S.type]));
        const statY = nameY + BL.fs(14) + 4;
        ctx.font = BL.font(700, 14); ctx.fillStyle = together ? pal.ui : pal.muted;
        const status = (together ? '● together' : '○ apart') + '  ·  ' + pct + (g.narrow ? '%' : '% of the last few seconds');
        ctx.fillText(status, 14, statY);

        const holds = t.Fmax >= 10 ? Math.round(t.Fmax) : t.Fmax.toFixed(1);
        const gmax = Math.max(t.Fmax, FCAP) * 1.08;
        const gw = Math.min(g.narrow ? W * 0.34 : 170, W * 0.36), gx1 = W - 14, gx0 = gx1 - gw;
        const gy = g.narrow ? nameY - 12 : 12;
        ctx.fillStyle = BL.alpha(pal.line2, 0.35); ctx.fillRect(gx0, gy, gw, 10);
        ctx.fillStyle = pal.ui; ctx.fillRect(gx0, gy, gw * Math.min(1, Math.abs(S.handF) / gmax), 10);
        ctx.fillStyle = pal.fg; ctx.fillRect(gx0 + gw * (t.Fmax / gmax) - 1.5, gy - 4, 3, 18);
        ctx.font = BL.font(400, 13); ctx.fillStyle = pal.muted; ctx.textAlign = 'right';
        const cap = BL.nums
          ? (g.narrow ? 'pull ' + FCAP + ' · holds ' + holds : 'your pull (max ' + FCAP + ') · bond holds ' + holds)
          : (t.Fmax > FCAP ? 'this one holds harder than a hand can pull' : 'a hand can out-pull this one');
        const capY = g.narrow ? statY : gy + 12 + BL.fs(13);
        if (!g.narrow || ctx.measureText(status).width + ctx.measureText(cap).width + 30 < W) ctx.fillText(cap, gx1, capY);
        ctx.textAlign = 'left';

        // curve points
        const r1 = t.rShow0 * 0.9, N = 260, pts = [];
        for (let i = 0; i <= N; i++) { const r = r1 + (t.R - r1) * (i / N); pts.push([x(r), y(t.pot.U(r))]); }
        const trace = (c) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };

        ctx.save();
        ctx.beginPath(); ctx.rect(pad.l, plotTop - 6, W - pad.l - pad.r, plotBot - plotTop + 6); ctx.clip();
        // ground under the curve
        ctx.beginPath(); trace(ctx); ctx.lineTo(x(t.R), plotBot + 4); ctx.lineTo(x(r1), plotBot + 4); ctx.closePath();
        const gg = ctx.createLinearGradient(0, plotTop, 0, plotBot); gg.addColorStop(0, pal.panel2); gg.addColorStop(1, BL.alpha(color, pal.dark ? 0.16 : 0.12));
        ctx.fillStyle = gg; ctx.fill();
        // heat pooling in the valley
        const yH = clamp(y(-t.D + kT), plotTop - 6, plotBot);
        ctx.save();
        ctx.beginPath(); trace(ctx); ctx.lineTo(x(t.R), plotTop - 8); ctx.lineTo(x(r1), plotTop - 8); ctx.closePath(); ctx.clip();
        ctx.fillStyle = BL.alpha(pal.electron, 0.30); ctx.fillRect(pad.l, yH, W, plotBot - yH + 4);
        ctx.fillStyle = pal.electron; ctx.fillRect(pad.l, yH - 1.5, W, 3);
        ctx.restore();
        // rim of the valley = "apart"
        ctx.setLineDash([5, 5]); ctx.strokeStyle = BL.alpha(pal.fg, 0.55); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pad.l, y(0)); ctx.lineTo(W - pad.r, y(0)); ctx.stroke(); ctx.setLineDash([]);
        // the curve
        ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.beginPath(); trace(ctx); ctx.stroke();
        ctx.restore();

        // axes + labels
        ctx.strokeStyle = pal.line2; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pad.l, plotTop - 6); ctx.lineTo(pad.l, plotBot); ctx.lineTo(W - pad.r, plotBot); ctx.stroke();
        ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'right';
        ctx.fillText('apart', pad.l - 7, y(0) + 5); ctx.fillText('−' + t.D, pad.l - 7, y(-t.D) + 5);
        ctx.save(); ctx.translate(f * 0.95, (plotTop + plotBot) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('energy, kJ/mol', 0, 0); ctx.restore();
        ctx.textAlign = 'center';
        const step = t.R > 10 ? 2 : (g.narrow ? 2 : 1);
        for (let a = 0; a <= t.R + 1e-6; a += step) { ctx.fillText(String(a), x(a), plotBot + f * 1.3); ctx.fillRect(x(a) - 0.75, plotBot, 1.5, 5); }
        ctx.textAlign = 'right'; ctx.fillText('distance apart, Å', W - pad.r, plotBot + f * 2.4);

        // heat gauge (right margin)
        const gxm = W - pad.r + 14, gwid = 18, gt = y(0), gb = y(-t.D);
        ctx.strokeStyle = pal.fg; ctx.lineWidth = 2; ctx.strokeRect(gxm + 1, gt, gwid, gb - gt);
        const fillH = Math.min(1, kT / t.D) * (gb - gt);
        ctx.fillStyle = pal.electron; ctx.fillRect(gxm + 2, gb - fillH, gwid - 2, fillH);
        ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'center';
        ctx.fillText('heat', gxm + gwid / 2, gt - 8);
        ctx.fillText(kT >= 10 ? String(Math.round(kT)) : kT.toFixed(1), gxm + gwid / 2, gb + f * 1.2);

        // the pair on the track
        const rpA = radPx(vis.A, g.sc, g.rcap), rpB = radPx(vis.B, g.sc, g.rcap);
        const xa = x(0), xb = x(s.r);
        bondLine(xa + rpA * 0.7, xb - rpB * 0.7, g.trackY, t, s.r, color);
        atom(xa, g.trackY, rpA, vis.A, true);
        atom(xb, g.trackY, rpB, vis.B, true);

        // ball in the well, energy line, kinetic energy
        const U = t.pot.U(s.r), E = 0.5 * s.v * s.v + U;
        const by = clamp(y(U), plotTop - 4, plotBot - 2), ey = clamp(y(E), plotTop - 4, plotBot);
        ctx.setLineDash([3, 5]); ctx.strokeStyle = BL.alpha(pal.fg, 0.4); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(xb, g.trackY + rpB + (vis.B.q ? BL.fs(13) * 1.4 : 4)); ctx.lineTo(xb, by); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = BL.alpha(pal.electron, 0.6); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pad.l, ey); ctx.lineTo(W - pad.r, ey); ctx.stroke();
        ctx.strokeStyle = pal.electron; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xb, by); ctx.lineTo(xb, ey); ctx.stroke();
        const gl = ctx.createRadialGradient(xb, by, 2, xb, by, 20);
        gl.addColorStop(0, BL.alpha(pal.electron, 0.5)); gl.addColorStop(1, BL.alpha(pal.electron, 0));
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(xb, by, 20, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(xb, by, 8, 0, 7); ctx.fillStyle = pal.panel; ctx.fill();
        ctx.lineWidth = 3.5; ctx.strokeStyle = pal.electron; ctx.stroke();

        // the hand
        if (S.drag && S.drag.type === S.type) {
          const hx = x(S.drag.rt);
          ctx.setLineDash([6, 5]); ctx.strokeStyle = pal.ui; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(xb, g.trackY); ctx.lineTo(hx, g.trackY); ctx.stroke(); ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(hx, g.trackY, 8, 0, 7); ctx.fillStyle = pal.ui; ctx.fill();
        } else if (!S.hinted && !BL.reduced) {
          const ph = (performance.now() / 1000) % 1;
          ctx.strokeStyle = BL.alpha(pal.ui, (1 - ph) * 0.9); ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(xb, g.trackY, rpB + 7 + ph * 16, 0, 7); ctx.stroke();
        }
        if (S.drag) S.hinted = true;
      }

      /* ---------------- all four ---------------- */
      function drawFour() {
        const g = geomFour(), W = g.W, pal = BL.pal;
        const dmax = 500;
        FOUR.forEach((id, i) => {
          const t = TYPES[id], vis = VIS[id], s = S.pairs[id], rg = rowGeom(g, i, id), color = col(id);
          const top = g.top + i * g.rowH;
          if (i) { ctx.strokeStyle = pal.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(10, top); ctx.lineTo(W - 10, top); ctx.stroke(); }

          // label column: name, depth, true-scale depth bar
          ctx.textAlign = 'left';
          const nameY = rg.cy - g.rowH * 0.2;
          ctx.fillStyle = color; ctx.beginPath(); ctx.arc(17, nameY - BL.fs(15) * 0.3, 5.5, 0, 7); ctx.fill();
          ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 15, true); ctx.fillText(t.name, 28, nameY);
          ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13);
          ctx.fillText(t.D + ' kJ/mol', 14, nameY + BL.fs(13) + 3);
          const bw = g.LW - 22, by = nameY + BL.fs(13) + 11;
          ctx.fillStyle = BL.alpha(pal.line2, 0.3); ctx.fillRect(14, by, bw, 6);
          ctx.fillStyle = color; ctx.fillRect(14, by, Math.max(3, bw * (t.D / dmax)), 6);

          // pair
          const rpA = radPx(vis.A, rg.sc, g.rcap), rpB = radPx(vis.B, rg.sc, g.rcap);
          const xa = rg.x(0), xb = rg.x(s.r);
          bondLine(xa + rpA * 0.7, xb - rpB * 0.7, rg.cy, t, s.r, color);
          atom(xa, rg.cy, rpA, vis.A, false);
          atom(xb, rg.cy, rpB, vis.B, false);
          if (S.drag && S.drag.type === id) {
            const hx = rg.x(S.drag.rt);
            ctx.setLineDash([6, 5]); ctx.strokeStyle = pal.ui; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(xb, rg.cy); ctx.lineTo(hx, rg.cy); ctx.stroke(); ctx.setLineDash([]);
            ctx.beginPath(); ctx.arc(hx, rg.cy, 7, 0, 7); ctx.fillStyle = pal.ui; ctx.fill();
          }

          // right column: how much of the time together
          const pct = Math.round(100 * PH.adjust(t, S.ema[id]));
          ctx.textAlign = 'right'; ctx.fillStyle = s.r < t.rCut ? pal.ui : pal.muted;
          ctx.font = BL.font(800, 18); ctx.fillText(pct + '%', W - 10, rg.cy + 2);
          ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.fillText(s.r < t.rCut ? 'together' : 'apart', W - 10, rg.cy + 2 + BL.fs(13) + 3);
        });
      }

      /* ---------------- chart ---------------- */
      function drawChart() {
        const c = chart.ctx, W = chart.w, H = chart.h, pal = BL.pal;
        if (!W) return;
        c.clearRect(0, 0, W, H);
        const f = BL.fs(13);
        const m = { l: f * 3.6, r: 16, t: f * 1.7, b: f * 3.3 };
        const X = (T) => m.l + (Math.log(T / PH.T_MIN) / Math.log(PH.T_MAX / PH.T_MIN)) * (W - m.l - m.r);
        const Y = (v) => m.t + (1 - v) * (H - m.t - m.b);
        const hi = S.mode === 'one' ? [S.type] : FOUR;
        c.font = BL.font(400, 13);

        // grid + y labels
        c.strokeStyle = BL.alpha(pal.line2, 0.35); c.lineWidth = 1.5; c.fillStyle = pal.muted; c.textAlign = 'right';
        [0, 0.5, 1].forEach((v) => { c.beginPath(); c.moveTo(m.l, Y(v)); c.lineTo(W - m.r, Y(v)); c.stroke(); c.fillText(Math.round(v * 100) + '%', m.l - 6, Y(v) + 4); });
        c.textAlign = 'left'; c.fillText('time together', 6, f * 1.05);

        // landmark ticks: draw from the hot end back, dropping any label that would overlap one already drawn
        const marks = LANDMARKS.map(([T, name], i) => {
          const nm = name.replace(' melts', '').replace(' nitrogen', ' N₂').replace('Sun’s surface', 'Sun');
          const w = Math.max(c.measureText(nm).width, c.measureText(fmtK(T)).width);
          const last = i === LANDMARKS.length - 1, px = X(T);
          const x0 = last ? W - 6 - w : px - w / 2;
          return { T, nm, px, last, x0, x1: x0 + w, w };
        });
        let leftEdge = Infinity;
        for (let i = marks.length - 1; i >= 0; i--) {
          const k = marks[i];
          c.strokeStyle = pal.line2; c.beginPath(); c.moveTo(k.px, H - m.b); c.lineTo(k.px, H - m.b + 5); c.stroke();
          if (k.x1 + 8 > leftEdge) continue;
          c.fillStyle = pal.muted; c.textAlign = k.last ? 'right' : 'center';
          const tx = k.last ? W - 6 : k.px;
          c.fillText(k.nm, tx, H - m.b + f * 1.25); if (BL.nums) c.fillText(fmtK(k.T) + ' K', tx, H - m.b + f * 2.4);
          leftEdge = k.x0;
        }

        // curves
        const order = ALL_ORDER.slice().sort((a, b) => hi.includes(a) - hi.includes(b));
        order.forEach((id) => {
          const on = hi.includes(id);
          c.strokeStyle = col(id); c.globalAlpha = on ? 1 : 0.35; c.lineWidth = on ? 3.5 : 1.75; c.lineJoin = 'round';
          c.beginPath();
          CURVES[id].forEach((v, i) => { const px = X(TEMPS[i]), py = Y(v); if (i) c.lineTo(px, py); else c.moveTo(px, py); });
          c.stroke(); c.globalAlpha = 1;
        });
        // labels at each curve's halfway point
        const byT50 = ALL_ORDER.map((id) => { const i = CURVES[id].findIndex((v) => v < 0.5); return { id, i: i < 0 ? CURVES[id].length - 1 : i }; }).sort((a, b) => a.i - b.i);
        c.font = BL.font(700, 13);
        byT50.forEach(({ id, i }, k) => {
          const on = hi.includes(id);
          if (!on && W < 520) return;                 // small screens: name only the curves in play
          c.globalAlpha = on ? 1 : 0.55; c.fillStyle = col(id);
          const nm = TYPES[id].name, w = c.measureText(nm).width, px = X(TEMPS[i]);
          const flip = px - 6 - w < m.l + 2;        // no room on the left: put the name to the right of the curve
          c.textAlign = flip ? 'left' : 'right';
          c.fillText(nm, flip ? px + 8 : px - 6, Y(0.5) - 6 - (k % 2) * (f + 3));
          c.globalAlpha = 1;
        });

        // where the slider is now
        const nx = X(S.T);
        c.strokeStyle = pal.electron; c.lineWidth = 2; c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(nx, m.t); c.lineTo(nx, H - m.b); c.stroke(); c.setLineDash([]);
        hi.forEach((id) => {
          const v = PH.togetherness(TYPES[id], S.T);
          c.fillStyle = col(id); c.beginPath(); c.arc(nx, Y(v), 5.5, 0, 7); c.fill();
          c.lineWidth = 2; c.strokeStyle = pal.panel; c.stroke();
        });
      }

      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); chart.destroy(); } };
    },
  });
})();
