/* Flicker: why even atoms with no charge stick together.
   A helium or xenon atom has no permanent plus or minus end. But its electron
   cloud is never perfectly still: it sloshes, and for a moment one side is a
   little more negative. That flicker pushes the neighbor's cloud, and the two
   flickers line up so that, on average, the atoms are pulled together.

   Two scenes. "Two atoms": watch the flicker, kick a cloud, change the size
   and the distance. "A crowd": forty atoms of one gas; cool them and see which
   gases cling, and at what temperature.

   Physics: js/drude.js (clouds on springs, exact thermal average force) and the
   shared rigid-body engine (js/water2d.js) with no hands, for the crowd. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const D = BL.drude, M = BL.water2d, G = D.GASES;

  const GOALS = [
    { id: 'drag', text: 'Drag one electron cloud off-center and watch the other one answer.' },
    { id: 'off', text: 'Turn the jiggle all the way off. What happens to the pull?' },
    { id: 'range', text: 'Pull the atoms apart and push them together. How fast does the pull change?' },
    { id: 'big', text: 'Try the smallest atom and the biggest atom at the same distance.' },
    { id: 'five', text: 'Try all five gases.' },
    { id: 'liquid', text: 'Cool a crowd of atoms until they cling together.' },
    { id: 'compare', text: 'Sweep the temperature for three different gases and compare.' },
  ];
  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true"><g stroke="currentColor" stroke-width="3" fill="var(--wash)"><circle cx="64" cy="60" r="32"/><circle cx="140" cy="60" r="32"/></g>' +
    '<circle cx="58" cy="60" r="4.5" fill="var(--fg)"/><circle cx="146" cy="60" r="4.5" fill="var(--fg)"/>' +
    '<path d="M92 56 h12" stroke="var(--neg)" stroke-width="4" stroke-linecap="round"/><path d="M92 66 h12" stroke="var(--pos)" stroke-width="4" stroke-linecap="round"/></svg>';

  const KMIN = 2, KMAX = 300;
  const kFromS = (v) => KMIN * Math.pow(KMAX / KMIN, v / 1000);
  const sFromK = (K) => 1000 * Math.log(K / KMIN) / Math.log(KMAX / KMIN);
  const SHAPES = ['o', 't', 's', 'd', 'x'];
  const colOf = (pal, i) => [pal.tVdw, pal.tDipole, pal.tHydrogen, pal.tCovalent, pal.tIonic][i];
  const FREF = Math.abs(D.meanForce(G[4].alpha, G[4].alpha, 2 * G[4].R, D.KT));
  const EREF = Math.abs(D.meanEnergy(G[4].alpha, G[4].alpha, 2 * G[4].R, D.KT));

  BL.register({
    id: 'flicker', field: 'bonding', order: 4, name: 'Flicker',
    tagline: 'Clouds that slosh, and a pull that comes from nowhere.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        scene: 'two', gi: 4, r: 6.0, jig: 1, D: null, avg: 0, inst: 0, lastInst: 0, hinted: false,
        W: null, K: 60, nb: 0, sweep: null, seed: 5, tried: new Set(), dwell: 0, seenR: { near: false, far: false }, seenGi: new Set(),
        series: G.map(() => new Map()), swept: new Set(), sampleT: 0, kick: null, ext: null,
      };
      const stage = BL.stage(stageHost, '16 / 9', {
        label: 'Two atoms drawn as a nucleus inside a cloud of electrons. The clouds slosh a little to one side and then the other. Drag a cloud off-center to see the other atom answer. Drag the right nucleus to change the distance, or use the sliders in the side panel.',
        focusable: true,
      });
      stage.wrap.classList.add('fl-stage');
      const ctx = stage.ctx;

      /* ---------------- dock ---------------- */
      const sceneBtns = [['two', 'Two atoms'], ['crowd', 'A crowd']].map(([id, label]) => h('button', { type: 'button', 'aria-pressed': String(id === S.scene), onclick: () => setScene(id) }, label));
      dock.appendChild(h('section', {}, h('h2', {}, 'Scene'), h('div', { class: 'seg', role: 'group', 'aria-label': 'Scene' }, sceneBtns)));
      const gBtns = G.map((g, i) => h('button', { type: 'button', class: 'chip el', 'aria-pressed': String(i === S.gi), 'aria-label': g.name, onclick: () => setGas(i) }, g.sym));
      const gNote = h('p', { class: 'note' });
      dock.appendChild(h('section', {}, h('h2', {}, 'Which gas'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Which gas' }, gBtns), gNote));

      const rOut = h('output', { class: 'val' });
      const rSl = h('input', { type: 'range', min: '30', max: '100', step: '1', 'aria-label': 'Distance between the atoms in angstroms' });
      rSl.addEventListener('input', () => { setR(parseFloat(rSl.value) / 10); S.hinted = true; });
      const jOut = h('output', { class: 'val' });
      const jSl = h('input', { type: 'range', min: '0', max: '200', step: '5', value: '100', 'aria-label': 'How much the clouds jiggle' });
      jSl.addEventListener('input', () => { S.jig = parseFloat(jSl.value) / 100; jOut.textContent = S.jig === 0 ? 'off' : Math.round(S.jig * 100) + '%'; if (S.jig === 0) S.offT = performance.now(); S.hinted = true; });
      jOut.textContent = '100%';
      const kickBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => { S.kick = { t: 0, a: Math.random() * 6.28 }; S.hinted = true; goals.done('drag'); } }, 'Kick the left cloud');
      const twoBox = h('section', { class: 'two-only' },
        h('div', { class: 'row' }, h('h2', {}, 'Distance apart'), rOut),
        h('div', { class: 'range-wrap' }, rSl, h('div', { class: 'range-ends' }, h('span', {}, 'close'), h('span', {}, 'far'))),
        h('div', { class: 'row sp' }, h('h2', {}, 'Jiggle'), jOut),
        h('div', { class: 'range-wrap' }, jSl, h('div', { class: 'range-ends' }, h('span', {}, 'still'), h('span', {}, 'lively'))),
        h('div', { class: 'actions' }, kickBtn),
        h('p', { class: 'hint' }, 'Drag a cloud to push it off-center. Drag the right-hand nucleus to move the atom.'));
      dock.appendChild(twoBox);

      const kOut = h('output', { class: 'val' });
      const kSl = h('input', { type: 'range', min: '0', max: '1000', step: '1', 'aria-label': 'Temperature in kelvin' });
      kSl.addEventListener('input', () => { S.sweep = null; setK(kFromS(parseFloat(kSl.value))); S.hinted = true; });
      const sweepBtn = h('button', { type: 'button', class: 'action', onclick: () => startSweep() }, 'Sweep the heat for me');
      const restartBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => newCrowd() }, 'Start over');
      const crowdBox = h('section', { class: 'crowd-only' },
        h('div', { class: 'row' }, h('h2', {}, 'Heat'), kOut),
        h('div', { class: 'range-wrap' }, kSl, h('div', { class: 'range-ends' }, h('span', {}, 'very cold'), h('span', {}, 'warm'))),
        h('div', { class: 'actions' }, sweepBtn, restartBtn),
        h('p', { class: 'hint' }, 'The scale is stretched: each step to the right is a multiplication, not an addition.'));
      dock.appendChild(crowdBox);
      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'flicker', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const meter = h('div', { class: 'meters' });
      aux.appendChild(h('section', { class: 'panel' }, statusP, meter));
      const cmp = h('div', { class: 'cmp' });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Stickiness against real boiling points'), cmp,
        h('p', { class: 'hint' }, 'Bars appear once you have tried a gas. The first bar is how sticky its atoms are when touching, from the flicker alone. The second is the temperature at which the real gas turns to liquid.')));
      const chart = BL.stage(h('div'), '2.6 / 1', { label: 'Graph of how many neighbors each atom holds on to, against temperature, for each gas you have run.' });
      chart.wrap.classList.add('flat', 'hist');
      const chartPanel = h('section', { class: 'panel crowd-only' }, h('h2', {}, 'How tightly do they cling?'), chart.wrap,
        h('div', { class: 'legend' }, G.map((g, i) => h('span', { 'data-i': String(i) }, g.sym))),
        h('p', { class: 'hint' }, 'Dashed lines mark where each real gas turns to liquid. Each curve should fall near its line.'));
      aux.appendChild(chartPanel);
      const say = (t) => { statusP.textContent = t; };

      /* ---------------- setup ---------------- */
      function setGas(i) {
        S.gi = i; gBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
        gNote.textContent = G[i].name + ': ' + G[i].alpha.toFixed(2) + ' Å³ squishiness, atom radius ' + G[i].R.toFixed(2) + ' Å.';
        S.dwell = 0;
        if (S.scene === 'two') { S.D = D.create(G[i].alpha, G[i].alpha, S.r, S.seed++); S.D.kT = D.KT * S.jig; S.avg = 0; } else newCrowd();
        S.seenGi.add(i); if (S.seenGi.has(0) && S.seenGi.has(4)) goals.done('big');
      }
      function setR(r) {
        S.r = clamp(r, 3.0, 10.0); rOut.textContent = S.r.toFixed(1) + ' Å'; rSl.value = String(Math.round(S.r * 10));
        if (S.D) S.D.r = S.r;
        if (S.r <= 4.6) S.seenR.near = true; if (S.r >= 8) S.seenR.far = true; if (S.seenR.near && S.seenR.far) goals.done('range');
      }
      function setScene(id) {
        S.scene = id; sceneBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(['two', 'crowd'][i] === id)));
        document.querySelectorAll('.two-only').forEach((e) => { e.hidden = id !== 'two'; });
        document.querySelectorAll('.crowd-only').forEach((e) => { e.hidden = id !== 'crowd'; });
        stage.wrap.style.aspectRatio = id === 'two' ? '16 / 9' : '10 / 7';
        S.sweep = null; setGas(S.gi); setR(S.r);
        say(id === 'two' ? 'Watch the two clouds. Each one is sloshing a little.' : 'Forty atoms of ' + G[S.gi].name.toLowerCase() + '. Cool them down.');
      }
      function newCrowd() {
        S.seed += 1; S.sweep = null;
        const W = M.create({ n: 40, w: 20, h: 14, type: 'none', K: 300, g: 0.05, gamma: 1.5, seed: S.seed });
        W.type = { id: 'gas', eHb: 0, eLJ: 0.13, arms: false };
        S.W = W; S.K = 60; setK(S.K); S.nb = M.neighbors(W, 1.3);
        for (let k = 0; k < 400; k++) M.step(W, 0.005);
      }
      function setK(K) { S.K = clamp(K, KMIN, KMAX); if (S.W) S.W.kT = 0.13 * S.K / G[S.gi].epsK; kOut.textContent = (S.K >= 10 ? Math.round(S.K) : S.K.toFixed(1)) + ' K'; kSl.value = String(Math.round(sFromK(S.K))); }
      function startSweep() {
        newCrowd(); S.K = KMIN; setK(KMIN); S.W.kT = 0.13 * KMIN / G[S.gi].epsK;
        for (let k = 0; k < 600; k++) M.step(S.W, 0.005);
        S.nb = M.neighbors(S.W, 1.3); S.sweep = { t: 0, dur: 36, gi: S.gi }; S.hinted = true;
        say('Warming ' + G[S.gi].name.toLowerCase() + ' slowly from almost nothing. Watch the graph.');
      }

      /* ---------------- pointer (two atoms) ---------------- */
      const geo = () => {
        const W = stage.w, H = stage.h, g = G[S.gi], span = S.r + 2 * g.R + 3, u = W / Math.max(span, 11.5);
        return { W, H, u, cx: W / 2, cy: H / 2, g, x0: W / 2 - S.r * u / 2, x1: W / 2 + S.r * u / 2 };
      };
      BL.drag(stage.canvas, {
        pick: (p) => {
          if (S.scene !== 'two') return null; const q = geo(), R = q.g.R * q.u;
          const dB = Math.hypot(p.x - q.x1 - (S.D ? S.D.d[2] * q.u : 0), p.y - q.cy - (S.D ? S.D.d[3] * q.u : 0));
          const nB = Math.hypot(p.x - q.x1, p.y - q.cy);
          if (nB < Math.max(16, R * 0.18)) return { move: true };
          for (const i of [0, 1]) { const nx = i ? q.x1 : q.x0; if (Math.hypot(p.x - nx, p.y - q.cy) < R) return { cloud: i }; }
          void dB; return null;
        },
        move: (a, p) => {
          const q = geo(); S.hinted = true;
          if (a.move) { setR((p.x - q.x0) / q.u); return; }
          const nx = a.cloud ? q.x1 : q.x0, lim = q.g.R * 0.75;
          let dx = (p.x - nx) / q.u, dy = (p.y - q.cy) / q.u; const m = Math.hypot(dx, dy); if (m > lim) { dx *= lim / m; dy *= lim / m; }
          S.D.ext = { i: a.cloud, x: dx, y: dy }; S.dragMax = Math.max(S.dragMax || 0, m);
          if (m > 0.35) goals.done('drag');
        },
        end: () => { if (S.D) S.D.ext = null; },
      });
      stage.canvas.addEventListener('keydown', (e) => {
        if (S.scene !== 'two') return; if (e.key === 'ArrowLeft') { e.preventDefault(); setR(S.r - 0.2); } else if (e.key === 'ArrowRight') { e.preventDefault(); setR(S.r + 0.2); } else if (e.key === 'Enter') kickBtn.click();
      });

      /* ---------------- frame ---------------- */
      function frame(dt) {
        const pal = BL.pal;
        if (S.scene === 'two') frameTwo(dt, pal); else frameCrowd(dt, pal);
        drawChart(); meterText(); compare();
      }

      function frameTwo(dt, pal) {
        const q = geo(), d = S.D, g = q.g, W = stage.w, H = stage.h; if (!d) return;
        d.kT = D.KT * S.jig; d.r = S.r;
        if (S.kick) { S.kick.t += dt; if (S.kick.t < 0.25) { d.d[0] += Math.cos(S.kick.a) * dt * 6; d.d[1] += Math.sin(S.kick.a) * dt * 6; } else S.kick = null; }
        let n = 8, f = 0; while (n--) { f = D.step(d, 0.01); S.avg += (f - S.avg) * 0.0015; }
        S.inst = f;
        S.dwell += dt; if (S.dwell > 3 && !S.tried.has(S.gi)) { S.tried.add(S.gi); if (S.tried.size >= 5) goals.done('five'); }
        if (S.jig === 0 && performance.now() - (S.offT || 0) > 600) goals.done('off');
        // draw
        ctx.clearRect(0, 0, W, H);
        const u = q.u, R = g.R * u, xs = [q.x0, q.x1];
        // meet-here marker: contact distance
        const touch = 2 * g.R;
        ctx.setLineDash([5, 6]); ctx.strokeStyle = pal.line2; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(q.x0 + touch * u, q.cy + R * 1.28); ctx.lineTo(q.x0 + touch * u, q.cy + R * 1.5); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'center'; ctx.fillText('touching', q.x0 + touch * u, q.cy + R * 1.5 + BL.fs(13) * 1.2);
        for (let i = 0; i < 2; i++) {
          const nx = xs[i], dx = d.d[i * 2] * u, dy = d.d[i * 2 + 1] * u, cxx = nx + dx, cyy = q.cy + dy;
          const grad = ctx.createRadialGradient(cxx, cyy, R * 0.1, cxx, cyy, R);
          grad.addColorStop(0, BL.alpha(pal.cloud, pal.dark ? 0.55 : 0.5)); grad.addColorStop(1, BL.alpha(pal.cloud, pal.dark ? 0.12 : 0.1));
          ctx.beginPath(); ctx.arc(cxx, cyy, R, 0, 7); ctx.fillStyle = grad; ctx.fill(); ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.strokeStyle = BL.alpha(pal.cloud, 0.9); ctx.stroke(); ctx.setLineDash([]);
          // nucleus
          ctx.beginPath(); ctx.arc(nx, q.cy, Math.max(7, R * 0.09), 0, 7); ctx.fillStyle = pal.pos; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = pal.panel; ctx.stroke();
          // the lopsidedness: where the cloud has gone is − and where it left is +
          const m = Math.hypot(d.d[i * 2], d.d[i * 2 + 1]);
          if (m > 0.1) {
            const ux = d.d[i * 2] / m, uy = d.d[i * 2 + 1] / m, a = clamp(m / 0.5, 0.35, 1);
            ctx.globalAlpha = a;
            BL.label(ctx, '−', cxx + ux * R * 0.62, cyy + uy * R * 0.62, { font: BL.font(800, 18), color: pal.neg, border: pal.neg });
            BL.label(ctx, '+', nx - ux * R * 0.62 * (m > 0.3 ? 1 : 0.8), q.cy - uy * R * 0.62 * (m > 0.3 ? 1 : 0.8), { font: BL.font(800, 18), color: pal.pos, border: pal.pos });
            ctx.globalAlpha = 1;
          }
        }
        // the force right now
        const mid = (q.x0 + q.x1) / 2, mag = clamp(Math.abs(S.inst) / FREF * 0.9, 0, 1), dir = S.inst < 0 ? 1 : -1;
        if (mag > 0.04) {
          const len = Math.min(90, 14 + 70 * mag), y = q.cy - R * 1.28 - 14, col = S.inst < 0 ? pal.tHydrogen || pal.ui : pal.neg;
          ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = col;
          for (const side of [-1, 1]) {
            const x0 = mid + side * (len + 14) * 0.5, x1 = mid + side * (14) * 0.5 - side * 0 + (dir > 0 ? 0 : side * len);
            const from = dir > 0 ? mid + side * (len + 12) : mid + side * 12, to = dir > 0 ? mid + side * 12 : mid + side * (len + 12);
            ctx.beginPath(); ctx.moveTo(from, y); ctx.lineTo(to, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(to - side * -dir * 0, y); ctx.lineTo(to + side * (dir > 0 ? 11 : -11), y - 9); ctx.moveTo(to, y); ctx.lineTo(to + side * (dir > 0 ? 11 : -11), y + 9); ctx.stroke();
            void x0; void x1;
          }
          ctx.lineCap = 'butt';
          BL.label(ctx, S.inst < 0 ? 'pulling together, right now' : 'pushing apart, right now', mid, y - 22, { font: BL.font(700, 13), border: col });
        }
        ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 20, true); ctx.textAlign = 'left'; ctx.fillText(g.name, 14, 10 + BL.fs(20));
        ctx.font = BL.font(400, 14); ctx.fillStyle = pal.muted; ctx.fillText(S.r.toFixed(1) + ' Å apart', 14, 10 + BL.fs(20) + BL.fs(14) * 1.3);
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'drag a cloud off-center', W * 0.24, H - 18 - BL.fs(14) * 0.4, { font: BL.font(700, 14), border: pal.ui });
        ctx.beginPath(); ctx.arc(q.x1, q.cy, Math.max(7, R * 0.09) + 5, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(pal.fg, 0.5); ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
      }

      function frameCrowd(dt, pal) {
        const W = S.W, cw = stage.w, ch = stage.h, u = cw / W.w, gI = G[S.gi];
        if (S.sweep) {
          S.sweep.t += dt; const f = clamp(S.sweep.t / S.sweep.dur, 0, 1);
          setK(KMIN * Math.pow(KMAX / KMIN, f));
          if (f >= 1) { S.swept.add(S.sweep.gi); say('Sweep done for ' + G[S.sweep.gi].name.toLowerCase() + '.'); S.sweep = null; if (S.swept.size >= 3) goals.done('compare'); }
        }
        const target = S.sweep ? 100 : 40, t0 = performance.now(); let n = 0;
        while (n < target && performance.now() - t0 < 10) { M.step(W, 0.005); n++; }
        const a = 1 - Math.exp(-dt / 1.2); S.nb += (M.neighbors(W, 1.3) - S.nb) * a;
        if (S.nb > 2.8 && S.wasLoose) goals.done('liquid'); if (S.nb < 1.4) S.wasLoose = true;
        S.sampleT += dt; if (S.sampleT > 0.25) { S.sampleT = 0; const m = S.series[S.gi], bin = Math.round(Math.log10(S.K) * 20), c = m.get(bin) || { s: 0, n: 0 }; c.s += S.nb; c.n += 1; if (c.n > 30) { c.s *= 0.9; c.n *= 0.9; } m.set(bin, c); }
        S.dwell += dt; if (S.dwell > 3) S.tried.add(S.gi);
        ctx.clearRect(0, 0, cw, ch);
        const warm = clamp(Math.log(S.K / KMIN) / Math.log(KMAX / KMIN), 0, 1), gr = ctx.createLinearGradient(0, ch, 0, ch * 0.4);
        gr.addColorStop(0, BL.alpha(BL.mix(pal.neg, pal.electron, warm), pal.dark ? 0.22 : 0.16)); gr.addColorStop(1, BL.alpha(pal.panel, 0)); ctx.fillStyle = gr; ctx.fillRect(0, ch * 0.4, cw, ch * 0.6);
        const col = colOf(pal, S.gi);
        for (let i = 0; i < W.n; i++) {
          ctx.beginPath(); ctx.arc(W.x[i] * u, W.y[i] * u, 0.5 * u, 0, 7); ctx.fillStyle = BL.alpha(col, 0.28); ctx.fill(); ctx.lineWidth = Math.max(1.5, u * 0.06); ctx.strokeStyle = col; ctx.stroke();
          ctx.beginPath(); ctx.arc(W.x[i] * u, W.y[i] * u, Math.max(2, u * 0.07), 0, 7); ctx.fillStyle = pal.fg; ctx.fill();
        }
        ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 20, true); ctx.textAlign = 'left'; ctx.fillText(Math.round(S.K * 10) / 10 + ' K', 14, 10 + BL.fs(20));
        ctx.font = BL.font(400, 14); ctx.fillStyle = pal.muted; ctx.fillText(gI.name + ' (boils at ' + gI.bp + ' K in real life)', 14, 10 + BL.fs(20) + BL.fs(14) * 1.3);
        if (S.sweep) { const pw = cw - 28; ctx.fillStyle = pal.line; ctx.fillRect(14, ch - 12, pw, 5); ctx.fillStyle = pal.electron; ctx.fillRect(14, ch - 12, pw * clamp(S.sweep.t / S.sweep.dur, 0, 1), 5); }
      }

      function meterText() {
        const now = performance.now(); if (now - (S.lastM || 0) < 180) return; S.lastM = now;
        meter.textContent = '';
        const row = (k, v, pct) => meter.appendChild(h('div', { class: 'meter' }, h('div', { class: 'meter-row' }, h('span', {}, k), h('b', {}, v)), pct != null ? h('div', { class: 'mbar' }, h('div', { style: 'width:' + clamp(pct, 0, 1) * 100 + '%' })) : null));
        if (S.scene === 'two') {
          const g = G[S.gi], F = Math.abs(D.meanForce(g.alpha, g.alpha, S.r, D.KT * S.jig)), pct = F / FREF * 100;
          row('Right now', S.jig === 0 ? 'still' : (S.inst < 0 ? 'pulling' : 'pushing'), null);
          row('Average pull', pct < 0.01 ? 'none' : (pct >= 10 ? pct.toFixed(0) : pct.toFixed(2)) + ' (xenon touching = 100)', clamp(Math.log10(1 + pct) / Math.log10(1 + 400), 0, 1));
          if (S.jig === 0) say('The clouds are still, so there is no pull at all.');
          else if (!S.hinted) say('Watch the clouds slosh. The arrows show the push or pull of the moment.');
          else say('The arrow flips back and forth, but the average is always a pull.');
        } else {
          const nb = S.nb, state = nb > 2.8 ? 'clinging together (a liquid)' : nb > 1.6 ? 'loosening' : 'flying apart (a gas)';
          row('Neighbors holding on', nb.toFixed(1) + ' each', nb / 4);
          row('The crowd is', state);
          if (!S.sweep) say(nb > 2.8 ? 'They cling. At this temperature ' + G[S.gi].name.toLowerCase() + ' is a liquid.' : nb > 1.6 ? 'Starting to let go.' : 'Mostly on their own: a gas.');
        }
      }

      function compare() {
        const now = performance.now(); if (now - (S.lastC || 0) < 400) return; S.lastC = now;
        cmp.textContent = '';
        G.forEach((g, i) => {
          const tried = S.tried.has(i), st = -D.meanEnergy(g.alpha, g.alpha, 2 * g.R, D.KT) / EREF;
          cmp.appendChild(h('div', { class: 'cmp-row' + (i === S.gi ? ' now' : '') },
            h('b', {}, g.sym),
            tried ? h('div', {}, h('div', { class: 'mbar' }, h('div', { style: 'width:' + clamp(st, 0.02, 1) * 100 + '%' })), h('div', { class: 'mbar b2' }, h('div', { style: 'width:' + clamp(g.bp / 165.1, 0.02, 1) * 100 + '%' })))
              : h('span', { class: 'muted' }, 'not tried yet'),
            tried ? h('span', { class: 'nums' }, g.bp + ' K') : null));
        });
      }

      function drawChart() {
        if (S.scene !== 'crowd') return;
        const c = chart.ctx, Wd = chart.w, Hd = chart.h, pal = BL.pal; if (!Wd) return;
        c.clearRect(0, 0, Wd, Hd);
        const f = BL.fs(13), m = { l: 34, r: 12, t: f * 1.7, b: f * 2.5 };
        const lx = (K) => (Math.log10(K) - Math.log10(KMIN)) / (Math.log10(KMAX) - Math.log10(KMIN));
        const X = (K) => m.l + lx(K) * (Wd - m.l - m.r), Y = (v) => Hd - m.b - (v / 4.5) * (Hd - m.b - m.t);
        c.font = BL.font(400, 13); c.textAlign = 'right'; c.fillStyle = pal.muted;
        [0, 1, 2, 3, 4].forEach((v) => { c.strokeStyle = pal.line; c.lineWidth = 1; c.beginPath(); c.moveTo(m.l, Y(v)); c.lineTo(Wd - m.r, Y(v)); c.stroke(); c.fillText(String(v), m.l - 6, Y(v) + 4); });
        c.textAlign = 'center';
        [2, 5, 10, 20, 50, 100, 200].forEach((K) => c.fillText(String(K), X(K), Hd - m.b + f * 1.25));
        c.textAlign = 'right'; c.fillText('temperature, K →', Wd - m.r, Hd - 3);
        G.forEach((g, i) => { const col = colOf(pal, i); c.setLineDash([4, 5]); c.strokeStyle = col; c.globalAlpha = i === S.gi ? 1 : 0.55; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X(g.bp), m.t - 4); c.lineTo(X(g.bp), Hd - m.b); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; c.fillStyle = pal.muted; c.textAlign = 'center'; c.fillText(g.sym, X(g.bp), m.t - 8 - (i % 2 ? 0 : 0)); });
        G.forEach((g, i) => {
          const col = colOf(pal, i), pts = [...S.series[i].entries()].filter(([, v]) => v.n >= 2).sort((a, b) => a[0] - b[0]).map(([b, v]) => [Math.pow(10, b / 20), v.s / v.n]);
          if (!pts.length) return;
          c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); pts.forEach(([K, v], k) => (k ? c.lineTo(X(K), Y(v)) : c.moveTo(X(K), Y(v)))); c.stroke();
          pts.forEach(([K, v]) => marker(c, SHAPES[i], X(K), Y(v), col, pal.panel));
        });
        c.beginPath(); c.arc(X(S.K), Y(clamp(S.nb, 0, 4.5)), 9, 0, 7); c.lineWidth = 3; c.strokeStyle = colOf(pal, S.gi); c.stroke();
      }
      function marker(c, s, x, y, col, edge) {
        c.fillStyle = col; c.strokeStyle = edge; c.lineWidth = 1.5; c.beginPath();
        if (s === 'o') c.arc(x, y, 4.2, 0, 7); else if (s === 's') c.rect(x - 3.6, y - 3.6, 7.2, 7.2);
        else if (s === 't') { c.moveTo(x, y - 5); c.lineTo(x + 5, y + 4); c.lineTo(x - 5, y + 4); c.closePath(); }
        else if (s === 'd') { c.moveTo(x, y - 5); c.lineTo(x + 5, y); c.lineTo(x, y + 5); c.lineTo(x - 5, y); c.closePath(); }
        else { c.moveTo(x - 4, y - 4); c.lineTo(x + 4, y + 4); c.moveTo(x + 4, y - 4); c.lineTo(x - 4, y + 4); c.lineWidth = 3; c.strokeStyle = col; c.stroke(); return; }
        c.fill(); c.stroke();
      }
      // legend swatches get their colors from the palette
      function paintLegend() { chartPanel.querySelectorAll('.legend span').forEach((sp) => { const i = +sp.getAttribute('data-i'); sp.style.color = BL.pal.fg; sp.style.setProperty('--sw', colOf(BL.pal, i)); }); }

      setScene('two'); setR(6.0); paintLegend();
      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); chart.destroy(); } };
    },
  });
})();
