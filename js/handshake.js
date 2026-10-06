/* Handshake: why water molecules cling.
   Every molecule here has four hands: two that offer a hydrogen (the red, +
   end) and two that can receive one (the blue, − end). A handshake needs the
   right hand at the right place, pointed the right way. Turn a molecule and
   the grip comes and goes.

   Two scenes. "Two molecules": move one, turn either, heat them, and find
   out what a handshake needs. "A crowd": forty molecules, a heat control,
   and three kinds of molecule to compare. Heat the crowd and the handshakes
   let go; kinds with weaker hands (or none) let go much sooner.

   Physics: js/water2d.js, a flat rigid-body model, tested in Node. The
   temperature scale is calibrated so the water-like crowd comes apart near
   373 K; the other two kinds then fall where they fall. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const M = BL.water2d;

  const KMIN = 40, KMAX = 800;
  const REAL = [['CH₄', 112], ['H₂S', 212], ['H₂O', 373]];       // where the real substances boil
  const GOALS = [
    { id: 'stick', text: 'Get two molecules to shake hands firmly.' },
    { id: 'push', text: 'Point two hands at each other so that they push apart.' },
    { id: 'break', text: 'Break a firm handshake: pull it apart, or heat it.' },
    { id: 'liquid', text: 'Cool the crowd until it clings together.' },
    { id: 'boil', text: 'Heat the crowd until it flies apart.' },
    { id: 'pull', text: 'Pull one molecule out of the crowd.' },
    { id: 'compare', text: 'Sweep all three kinds of molecule and compare the curves.' },
  ];
  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true"><g fill="var(--panel-2)" stroke="currentColor" stroke-width="3"><circle cx="66" cy="60" r="30"/><circle cx="134" cy="60" r="30"/></g>' +
    '<circle cx="96" cy="60" r="7" fill="var(--pos)"/><circle cx="104" cy="60" r="7" fill="var(--panel)" stroke="var(--neg)" stroke-width="3.5"/>' +
    '<circle cx="48" cy="38" r="5.5" fill="var(--pos)"/><circle cx="152" cy="82" r="5.5" fill="var(--panel)" stroke="var(--neg)" stroke-width="3"/></svg>';

  const nameOf = (id) => M.TYPES[id].name;

  BL.register({
    id: 'handshake', field: 'bonding', order: 3, name: 'Handshake',
    tagline: 'Hands that only grip when they line up.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        scene: 'pair', type: 'water', K: { pair: 60, crowd: 600 }, W: null, u: 30,
        nb: 0, hb: 0, grip: 0, like: 0, bonds: [], t: 0, sampleT: 0, hinted: false,
        series: { water: new Map(), weak: new Map(), none: new Map() }, sweep: null, auto: null,
        stuck: false, wasCold: false, pulled: null, seed: 3,
      };
      const stage = BL.stage(stageHost, '10 / 7', {
        label: 'A box of simple molecules drawn as disks. Each has two red plus hands that give a hydrogen and two blue minus hands that receive one. Where a red hand and a blue hand meet, the molecules are shaking hands. Drag a molecule to move it. In the two-molecule scene, drag a hand to turn the molecule, or use the sliders in the side panel.',
        focusable: true,
      });
      stage.wrap.classList.add('hs-stage');
      const ctx = stage.ctx;

      /* ---------------- dock ---------------- */
      const sceneBtns = [['pair', 'Two molecules'], ['crowd', 'A crowd']].map(([id, label]) => h('button', { type: 'button', 'aria-pressed': String(id === S.scene), onclick: () => setScene(id) }, label));
      dock.appendChild(h('section', {}, h('h2', {}, 'Scene'), h('div', { class: 'seg', role: 'group', 'aria-label': 'Scene' }, sceneBtns)));

      const typeBtns = Object.keys(M.TYPES).map((id) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(id === S.type), onclick: () => setType(id) }, M.TYPES[id].name));
      const typeNote = h('p', { class: 'note' });
      dock.appendChild(h('section', {}, h('h2', {}, 'Kind of molecule'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Kind of molecule' }, typeBtns), typeNote));

      const kOut = h('output', { class: 'val' });
      const kSlider = h('input', { type: 'range', min: String(KMIN), max: String(KMAX), step: '5', 'aria-label': 'Temperature in kelvin' });
      kSlider.addEventListener('input', () => { S.sweep = null; setK(parseFloat(kSlider.value)); S.hinted = true; });
      const heatRow = h('section', {},
        h('div', { class: 'row' }, h('h2', {}, 'Heat'), kOut),
        h('div', { class: 'range-wrap' }, kSlider, h('div', { class: 'range-ends' }, h('span', {}, 'cold'), h('span', {}, 'hot'))));
      dock.appendChild(heatRow);

      /* the two-molecule scene: exact controls, for keyboard and for careful measuring */
      const mkAng = (label, who) => {
        const out = h('output', { class: 'val' });
        const input = h('input', { type: 'range', min: '0', max: '359', step: '1', value: '0', 'aria-label': label });
        input.addEventListener('input', () => { if (!S.W || S.scene !== 'pair') return; const a = parseFloat(input.value) * Math.PI / 180; S.W.th[who] = a; S.W.om[who] = 0; S.W.fresh = false; S.hinted = true; out.textContent = Math.round(parseFloat(input.value)) + '°'; });
        out.textContent = '0°';
        return { out, input, row: h('div', {}, h('div', { class: 'row' }, h('span', { class: 'lab' }, label), out), input) };
      };
      const angA = mkAng('Turn the left molecule', 0), angB = mkAng('Turn the right molecule', 1);
      const distOut = h('output', { class: 'val' });
      const dist = h('input', { type: 'range', min: '9', max: '30', step: '1', value: '24', 'aria-label': 'Distance between the molecules' });
      dist.addEventListener('input', () => {
        const W = S.W; if (!W || S.scene !== 'pair') return;
        const r = parseFloat(dist.value) / 10, cx = (W.x[0] + W.x[1]) / 2, cy = (W.y[0] + W.y[1]) / 2;
        const a = Math.atan2(W.y[1] - W.y[0], W.x[1] - W.x[0]);
        W.x[0] = cx - Math.cos(a) * r / 2; W.y[0] = cy - Math.sin(a) * r / 2; W.x[1] = cx + Math.cos(a) * r / 2; W.y[1] = cy + Math.sin(a) * r / 2; W.vx.fill(0); W.vy.fill(0); W.fresh = false; S.hinted = true;
        distOut.textContent = r.toFixed(1) + ' wide';
      });
      const pairBox = h('section', { class: 'pair-only' },
        h('h2', {}, 'Set them exactly'), angA.row, angB.row,
        h('div', {}, h('div', { class: 'row' }, h('span', { class: 'lab' }, 'Distance apart'), distOut), dist),
        h('p', { class: 'hint' }, 'You can also drag a molecule to move it, or drag one of its hands to turn it.'));
      dock.appendChild(pairBox);

      const sweepBtn = h('button', { type: 'button', class: 'action', onclick: () => startSweep() }, 'Sweep the heat for me');
      const tugBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => startTug() }, 'Tug one out for me');
      const restartBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => { newWorld(); } }, 'Start over');
      const crowdBox = h('section', { class: 'crowd-only' },
        h('h2', {}, 'Experiments'), h('div', { class: 'actions' }, sweepBtn, tugBtn, restartBtn),
        h('p', { class: 'hint' }, 'A sweep warms the crowd slowly from cold to hot and draws the graph as it goes. Or drag molecules yourself.'));
      dock.appendChild(crowdBox);
      const pairActions = h('section', { class: 'pair-only' }, h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action ghost', onclick: () => newWorld() }, 'Start over')));
      dock.appendChild(pairActions);

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'handshake', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const meter = h('div', { class: 'meters' });
      const key = h('div', { class: 'legend' },
        h('span', {}, h('i', { class: 'k-pos' }), 'a + hand: gives a hydrogen'),
        h('span', {}, h('i', { class: 'k-neg' }), 'a − hand: receives one'),
        h('span', {}, h('i', { class: 'k-hs' }), 'a handshake'));
      aux.appendChild(h('section', { class: 'panel' }, statusP, meter, key));

      const chart = BL.stage(h('div'), '2.6 / 1', { label: 'Graph of how many neighbors each molecule holds on to, against temperature, for each kind of molecule you have run.' });
      chart.wrap.classList.add('flat', 'hist');
      const clearBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => { Object.values(S.series).forEach((m) => m.clear()); } }, 'Clear the graph');
      const chartPanel = h('section', { class: 'panel crowd-only' },
        h('h2', {}, 'How tightly do they cling?'), chart.wrap,
        h('div', { class: 'legend' },
          h('span', {}, h('i', { class: 'k-line s1' }), 'Water-like'), h('span', {}, h('i', { class: 'k-line s2' }), 'Weak hands'), h('span', {}, h('i', { class: 'k-line s3' }), 'No hands')),
        h('div', { class: 'actions' }, clearBtn),
        h('p', { class: 'hint' }, 'Each point is the average number of neighbors touching a molecule, at that temperature. The dashed lines mark where the real substances boil.'));
      aux.appendChild(chartPanel);

      function say(t) { statusP.textContent = t; }

      /* ---------------- scene control ---------------- */
      function newWorld() {
        S.seed += 1; S.sweep = null; S.auto = null; S.stuck = false; S.wasCold = false; S.pulled = null;
        const pair = S.scene === 'pair';
        S.u = 0;
        S.W = M.create(pair
          ? { n: 2, w: 10, h: 7, type: S.type, K: S.K.pair, g: 0, gamma: 1.5, layout: 'pair', seed: S.seed }
          : { n: 40, w: 20, h: 14, type: S.type, K: S.K.crowd, g: 0.05, gamma: 1.5, layout: 'block', seed: S.seed });
        if (pair) {
          const W = S.W; W.x[0] = 3.0; W.y[0] = 3.5; W.th[0] = 0.5; W.x[1] = 7.0; W.y[1] = 3.6; W.th[1] = 2.2;
          angA.input.value = String(Math.round(((W.th[0] * 180 / Math.PI) % 360 + 360) % 360)); angB.input.value = String(Math.round(((W.th[1] * 180 / Math.PI) % 360 + 360) % 360)); angA.out.textContent = angA.input.value + '°'; angB.out.textContent = angB.input.value + '°';
          dist.value = '40'; distOut.textContent = '4.0 wide';
          say('Drag one molecule toward the other, and turn it by dragging one of its hands.');
        } else say('Forty molecules, flying about. Cool them and see what happens.');
        kSlider.value = String(S.K[S.scene]); setK(S.K[S.scene]);
      }
      function setScene(id) {
        S.scene = id; sceneBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(['pair', 'crowd'][i] === id)));
        document.querySelectorAll('.crowd-only').forEach((el) => { el.hidden = id !== 'crowd'; });
        document.querySelectorAll('.pair-only').forEach((el) => { el.hidden = id !== 'pair'; });
        stage.wrap.style.aspectRatio = '10 / 7';
        newWorld();
      }
      function setType(id) {
        S.type = id; S.W.type = M.TYPES[id]; S.W.fresh = false;
        typeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(Object.keys(M.TYPES)[i] === id)));
        typeNote.textContent = M.TYPES[id].note + '.';
        S.sweptTypes = S.sweptTypes || new Set();
      }
      function setK(K) { S.K[S.scene] = K; S.W.setK(K); kOut.textContent = Math.round(K) + ' K'; kSlider.value = String(K); }

      /* ---------------- experiments ---------------- */
      function startSweep() {
        S.scene === 'crowd' || setScene('crowd');
        newWorld(); S.K.crowd = KMIN; S.W.setK(KMIN);
        for (let k = 0; k < 800; k++) M.step(S.W, 0.005);        // let the cold block settle
        S.sweep = { t: 0, dur: 36, type: S.type }; S.hinted = true;
        say('Warming ' + nameOf(S.type).toLowerCase() + ' molecules slowly. Watch the graph.');
      }
      function startTug() {
        if (S.scene !== 'crowd') return;
        const W = S.W; let best = -1, bd = 1e9;
        const mx = W.w / 2;
        for (let i = 0; i < W.n; i++) { const d = Math.abs(W.x[i] - mx) + (W.h - W.y[i]) * 0.3; let c = 0; for (let j = 0; j < W.n; j++) if (j !== i && Math.hypot(W.x[i] - W.x[j], W.y[i] - W.y[j]) < 1.4) c++; if (c >= 2 && d < bd) { bd = d; best = i; } }
        if (best < 0) { say('The crowd is not clinging together enough to pull anything out of. Cool it first.'); return; }
        S.auto = { i: best, x: W.x[best], y: W.y[best], t: 0 }; S.hinted = true;
        W.drag = { i: best, x: W.x[best], y: W.y[best], k: 30 };
        say('Pulling one molecule away from its neighbors.');
      }

      /* ---------------- pointer ---------------- */
      const toWorld = (p) => ({ x: p.x / S.u, y: p.y / S.u });
      BL.drag(stage.canvas, {
        pick: (p) => {
          const W = S.W, w = toWorld(p); let best = -1, bd = 0.62; let rot = null;
          if (S.scene === 'pair') {
            const site = [0, 0];
            for (let i = 0; i < W.n; i++) for (let k = 0; k < 4; k++) { M.site(W, i, k, site); const d = Math.hypot(w.x - site[0], w.y - site[1]); if (d < 0.26 && d < bd) { bd = d; best = i; rot = k; } }
          }
          if (best < 0) for (let i = 0; i < W.n; i++) { const d = Math.hypot(w.x - W.x[i], w.y - W.y[i]); if (d < bd) { bd = d; best = i; rot = null; } }
          return best >= 0 ? { i: best, rot } : null;
        },
        move: (a, p) => {
          const W = S.W, w = toWorld(p); S.hinted = true; S.auto = null;
          if (a.rot != null) W.drag = { i: a.i, rot: { site: a.rot, target: Math.atan2(w.y - W.y[a.i], w.x - W.x[a.i]) } };
          else W.drag = { i: a.i, x: w.x, y: w.y, k: 30 };
          S.dragged = a.i;
        },
        end: () => {
          const W = S.W;
          if (S.scene === 'crowd' && W.drag && W.drag.i != null && S.pullStart != null) { /* handled in frame */ }
          W.drag = null; S.dragged = null; S.pullStart = null;
          if (S.scene === 'pair') { const a = (i) => String(Math.round(((W.th[i] * 180 / Math.PI) % 360 + 360) % 360)); angA.input.value = a(0); angB.input.value = a(1); angA.out.textContent = a(0) + '°'; angB.out.textContent = a(1) + '°'; }
        },
      });

      /* ---------------- frame ---------------- */
      function frame(dt) {
        const W = S.W, pal = BL.pal, cw = stage.w, ch = stage.h;
        S.u = cw / W.w;
        const u = S.u;

        // sweeping and auto-tug move the controls for you
        if (S.sweep) {
          S.sweep.t += dt; const f = clamp(S.sweep.t / S.sweep.dur, 0, 1);
          setK(KMIN + (KMAX - KMIN) * f);
          if (f >= 1) { const ty = S.sweep.type; S.sweep = null; S.swept = S.swept || new Set(); S.swept.add(ty); say('Sweep done for ' + nameOf(ty).toLowerCase() + ' molecules. Try another kind to compare.'); if (S.swept.size >= 3) goals.done('compare'); }
        }
        if (S.auto) {
          const a = S.auto; a.t += dt; a.y -= dt * 1.8;
          if (W.drag) { W.drag.x = a.x; W.drag.y = a.y; }
          let near = 0; for (let j = 0; j < W.n; j++) if (j !== a.i && Math.hypot(W.x[a.i] - W.x[j], W.y[a.i] - W.y[j]) < 1.5) near++;
          if (a.t > 0.8 && near === 0 && S.nbHi) { goals.done('pull'); say('It came free, after a real fight against its neighbors.'); }
          if (a.t > 9 || a.y < 0.8) { W.drag = null; S.auto = null; }
        }

        // physics, as many steps as the frame can afford
        const target = S.sweep ? 100 : 40, t0 = performance.now(); let n = 0;
        while (n < target && performance.now() - t0 < 10) { M.step(W, 0.005); n++; }

        // readings
        const a = 1 - Math.exp(-dt / 1.2);
        S.nb += (M.neighbors(W, 1.3) - S.nb) * a;
        const hs = M.handshakes(W); S.hb += (hs.perMolecule - S.hb) * a; S.bonds = hs.list; S.grip = Math.min(1, hs.grip); S.like = hs.like;
        S.nbHi = S.scene === 'crowd' && S.nb > 2.4;

        // goals
        if (S.scene === 'pair') {
          if (S.type !== 'none' && S.grip > 0.85) { goals.done('stick'); S.stuck = true; }
          if (S.stuck && S.grip < 0.08) { goals.done('break'); S.stuck = false; }
          if (S.like > 0.12 && Math.hypot(W.x[0] - W.x[1], W.y[0] - W.y[1]) < 1.7 && S.type === 'water') goals.done('push');
        } else {
          if (S.nb > 2.8 && S.wasLoose) { goals.done('liquid'); }
          if (S.nb < 1.0 && S.nb > 0 && S.wasCold && S.type === 'water') goals.done('boil');
          if (S.nb < 1.4) S.wasLoose = true;
          if (S.nb > 2.6) S.wasCold = true;
          // dragging a molecule far from the crowd
          if (W.drag && W.drag.i != null && !S.auto) {
            let near = 0; for (let j = 0; j < W.n; j++) if (j !== W.drag.i && Math.hypot(W.x[W.drag.i] - W.x[j], W.y[W.drag.i] - W.y[j]) < 1.5) near++;
            if (S.pullStart == null) S.pullStart = near; else if (S.pullStart >= 2 && near === 0 && S.nb > 2.2) { goals.done('pull'); S.pullStart = -1; }
          }
          // record the graph
          S.sampleT += dt;
          if (S.sampleT > 0.25) {
            S.sampleT = 0; const m = S.series[S.type], bin = Math.round(W.getK() / 25) * 25, c = m.get(bin) || { s: 0, n: 0 };
            c.s += S.nb; c.n += 1; if (c.n > 30) { c.s *= 0.9; c.n *= 0.9; } m.set(bin, c);
          }
        }

        draw(pal, cw, ch, u);
        drawChart();
        meterText();
      }

      function meterText() {
        const now = performance.now(); if (now - (S.lastMeter || 0) < 200) return; S.lastMeter = now;
        meter.textContent = '';
        const row = (k, v, pct) => meter.appendChild(h('div', { class: 'meter' }, h('div', { class: 'meter-row' }, h('span', {}, k), h('b', {}, v)), pct != null ? h('div', { class: 'bar' }, h('div', { style: 'width:' + clamp(pct, 0, 1) * 100 + '%' })) : null));
        if (S.scene === 'pair') {
          const g = S.grip;
          row('Grip of the handshake', g < 0.05 ? 'none' : Math.round(g * 100) + '%', g);
          if (S.type === 'none') say('These molecules have no hands. Nothing here can shake.');
          else if (g > 0.85) say('A firm handshake: a + hand and a − hand are together, pointing at each other.');
          else if (S.like > 0.12 && Math.hypot(S.W.x[0] - S.W.x[1], S.W.y[0] - S.W.y[1]) < 1.7) say('Two matching hands are facing each other, and they push apart.');
          else if (g > 0.3) say('A loose grip. The hands are close but not lined up.');
          else if (!S.hinted) say('Drag one molecule toward the other, and turn it by dragging one of its hands.');
          else say('No handshake right now.');
        } else {
          const nb = S.nb, state = nb > 2.8 ? 'clinging together' : nb > 1.6 ? 'loosening' : 'flying apart';
          row('Neighbors holding on', nb.toFixed(1) + ' each', nb / 4);
          if (S.type !== 'none') row('Handshakes', S.hb.toFixed(1) + ' per molecule', S.hb / 4);
          row('The crowd is', state);
          if (!S.sweep && !S.auto) say(nb > 2.8 ? 'The molecules cling to each other, like a liquid.' : nb > 1.6 ? 'The crowd is starting to let go.' : 'The molecules are mostly on their own, like a gas.');
        }
      }

      /* ---------------- drawing ---------------- */
      function drawMol(i, pal, u, big) {
        const W = S.W, x = W.x[i] * u, y = W.y[i] * u, R = 0.5 * u, arms = W.type.arms;
        ctx.beginPath(); ctx.arc(x, y, R, 0, 7);
        ctx.fillStyle = BL.mix(pal.panel, pal.fg, pal.dark ? 0.12 : 0.07); ctx.fill();
        ctx.lineWidth = Math.max(1.5, u * 0.05); ctx.strokeStyle = pal.muted; ctx.stroke();
        if (!arms) return;
        const rr = Math.max(4.2, 0.17 * u);
        for (let k = 0; k < 4; k++) {
          const a = W.th[i] + M.SITE_ANG[k], sx = x + Math.cos(a) * M.D_ARM * u, sy = y + Math.sin(a) * M.D_ARM * u;
          const scale = W.type.eHb < 0.5 ? 0.8 : 1;
          ctx.beginPath(); ctx.arc(sx, sy, rr * scale, 0, 7);
          if (k < 2) { ctx.fillStyle = pal.pos; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = pal.panel; ctx.stroke(); }
          else { ctx.fillStyle = pal.panel; ctx.fill(); ctx.lineWidth = Math.max(2.5, u * 0.08); ctx.strokeStyle = pal.neg; ctx.stroke(); }
          if (big) { ctx.fillStyle = k < 2 ? '#fff' : pal.neg; ctx.font = BL.font(800, 13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(k < 2 ? '+' : '−', sx, sy + 0.5); ctx.textBaseline = 'alphabetic'; }
        }
        // the molecule's front, so you can see it turn
        const fa = W.th[i]; ctx.beginPath(); ctx.moveTo(x + Math.cos(fa) * R * 0.18, y + Math.sin(fa) * R * 0.18); ctx.lineTo(x + Math.cos(fa) * R * 0.6, y + Math.sin(fa) * R * 0.6); ctx.lineWidth = Math.max(2, u * 0.06); ctx.strokeStyle = pal.muted; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
      }

      function draw(pal, cw, ch, u) {
        const W = S.W, big = u > 40;
        ctx.clearRect(0, 0, cw, ch);
        // a hint of temperature: a tinted floor
        const K = W.getK(), warm = clamp((K - 100) / 600, 0, 1);
        const g = ctx.createLinearGradient(0, ch, 0, ch * 0.4);
        g.addColorStop(0, BL.alpha(BL.mix(pal.neg, pal.electron, warm), pal.dark ? 0.22 : 0.16)); g.addColorStop(1, BL.alpha(pal.panel, 0));
        ctx.fillStyle = g; ctx.fillRect(0, ch * 0.4, cw, ch * 0.6);

        // handshakes first, behind the molecules
        const col = pal.tHydrogen || pal.ui;
        S.bonds.forEach(([i, a, j, b, gg]) => {
          const x1 = W.x[i] * u, y1 = W.y[i] * u, x2 = W.x[j] * u, y2 = W.y[j] * u;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineCap = 'round';
          ctx.lineWidth = (big ? 14 : 7) * (0.35 + 0.65 * gg); ctx.strokeStyle = BL.alpha(col, 0.35 + 0.5 * gg); ctx.stroke(); ctx.lineCap = 'butt';
        });
        for (let i = 0; i < W.n; i++) drawMol(i, pal, u, big);
        // glow where hands meet
        S.bonds.forEach(([i, a, j, b, gg]) => {
          if (gg < 0.5) return;
          const sa = [0, 0]; M.site(W, i, a, sa);
          ctx.beginPath(); ctx.arc(sa[0] * u, sa[1] * u, (big ? 12 : 8) * (0.7 + 0.5 * gg), 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
        });

        // the hand that is dragging
        if (W.drag && W.drag.i != null && !W.drag.rot) {
          const i = W.drag.i, x = W.drag.x * u, y = W.drag.y * u;
          ctx.beginPath(); ctx.moveTo(W.x[i] * u, W.y[i] * u); ctx.lineTo(x, y); ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.strokeStyle = pal.fg; ctx.stroke(); ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fillStyle = pal.fg; ctx.fill();
          const F = Math.hypot(W.drag.fx || 0, W.drag.fy || 0);
          BL.label(ctx, 'pulling with ' + F.toFixed(1), clamp(x, 70, cw - 70), y < 40 ? y + 30 : y - 24, { font: BL.font(700, 13), border: pal.fg });
        }
        // labels
        const f = BL.fs(14);
        ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 20, true); ctx.textAlign = 'left'; ctx.fillText(Math.round(K) + ' K', 14, 10 + BL.fs(20));
        ctx.font = BL.font(400, 14); ctx.fillStyle = pal.muted; ctx.fillText(nameOf(S.type), 14, 10 + BL.fs(20) + f * 1.3);
        if (!S.hinted && !BL.reduced) {
          const w0 = S.scene === 'pair' ? '↔ drag a molecule, or drag a hand to turn it' : '↕ cool it down';
          BL.label(ctx, w0, cw / 2, ch - 16 - f * 0.4, { font: BL.font(700, 14), border: pal.ui });
        }
        if (S.sweep) { const pw = cw - 28; ctx.fillStyle = pal.line; ctx.fillRect(14, ch - 12, pw, 5); ctx.fillStyle = pal.electron; ctx.fillRect(14, ch - 12, pw * clamp(S.sweep.t / S.sweep.dur, 0, 1), 5); }
      }

      function drawChart() {
        if (S.scene !== 'crowd') return;
        const c = chart.ctx, W = chart.w, H = chart.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        const f = BL.fs(13), m = { l: 34, r: 12, t: f * 1.7, b: f * 2.5 };
        const X = (K) => m.l + ((K - KMIN) / (KMAX - KMIN)) * (W - m.l - m.r), Y = (v) => H - m.b - (v / 4.5) * (H - m.b - m.t);
        c.font = BL.font(400, 13); c.textAlign = 'right'; c.fillStyle = pal.muted;
        [0, 1, 2, 3, 4].forEach((v) => { c.strokeStyle = pal.line; c.lineWidth = 1; c.beginPath(); c.moveTo(m.l, Y(v)); c.lineTo(W - m.r, Y(v)); c.stroke(); c.fillText(String(v), m.l - 6, Y(v) + 4); });
        c.textAlign = 'center';
        [100, 200, 300, 400, 500, 600, 700, 800].forEach((K) => { c.fillStyle = pal.muted; c.fillText(String(K), X(K), H - m.b + f * 1.25); });
        c.textAlign = 'right'; c.fillText('temperature, K →', W - m.r, H - 3);
        // where the real ones boil
        REAL.forEach(([name, K], i) => { c.setLineDash([4, 5]); c.strokeStyle = pal.line2; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X(K), m.t - 4); c.lineTo(X(K), H - m.b); c.stroke(); c.setLineDash([]); c.fillStyle = pal.muted; c.textAlign = 'center'; c.fillText(name, X(K), m.t - 8); });
        const styles = { water: { col: pal.ui, dash: [], shape: 'o' }, weak: { col: pal.electron, dash: [9, 5], shape: 't' }, none: { col: pal.fg, dash: [2, 5], shape: 's' } };
        Object.keys(S.series).forEach((id) => {
          const st = styles[id], pts = [...S.series[id].entries()].filter(([, v]) => v.n >= 2).sort((a, b) => a[0] - b[0]).map(([K, v]) => [K, v.s / v.n]);
          if (!pts.length) return;
          c.strokeStyle = st.col; c.lineWidth = 3; c.setLineDash(st.dash); c.beginPath(); pts.forEach(([K, v], i) => (i ? c.lineTo(X(K), Y(v)) : c.moveTo(X(K), Y(v)))); c.stroke(); c.setLineDash([]);
          pts.forEach(([K, v]) => { const x = X(K), y = Y(v); c.fillStyle = st.col; c.strokeStyle = pal.panel; c.lineWidth = 1.5; c.beginPath(); if (st.shape === 'o') c.arc(x, y, 4.2, 0, 7); else if (st.shape === 's') c.rect(x - 3.6, y - 3.6, 7.2, 7.2); else { c.moveTo(x, y - 5); c.lineTo(x + 5, y + 4); c.lineTo(x - 5, y + 4); c.closePath(); } c.fill(); c.stroke(); });
        });
        // where it is right now
        const st = styles[S.type], x = X(clamp(S.W.getK(), KMIN, KMAX)), y = Y(clamp(S.nb, 0, 4.5));
        c.beginPath(); c.arc(x, y, 9, 0, 7); c.lineWidth = 3; c.strokeStyle = st.col; c.stroke();
      }

      setScene('pair'); setType('water');
      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); chart.destroy(); } };
    },
  });
})();
