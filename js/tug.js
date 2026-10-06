/* Tug: two atoms, one electron cloud, who holds it?
   Covalent, polar covalent and ionic are not three boxes. They are three
   stretches of one dial: how unequal the pull is. The learner turns that
   dial, watches the cloud lean, and meets the words afterwards.

   Model (all simple on purpose):
   - Pull is Pauling electronegativity.
   - Ionic character = 1 - exp(-dEN^2 / 4)  (Pauling's own estimate), so no bond is ever 0% or 100% anything.
   - The cloud's centre sits at fraction t = 0.5 + 0.5 * signed ionic character
     of the way from the weaker atom to the stronger one.
   - A charged probe nudges the cloud (it is squishy) and turns polar
     molecules (they have two different ends). */
(function () {
  'use strict';
  const { h, clamp, lerp, randn } = BL;

  /* Pauling electronegativity and covalent radius (angstrom). */
  const EL = {
    K: { en: 0.82, r: 2.03 }, Na: { en: 0.93, r: 1.66 }, Li: { en: 0.98, r: 1.28 },
    Ca: { en: 1.00, r: 1.76 }, Mg: { en: 1.31, r: 1.41 }, H: { en: 2.20, r: 0.31 },
    C: { en: 2.55, r: 0.76 }, S: { en: 2.58, r: 1.05 }, Br: { en: 2.96, r: 1.20 },
    N: { en: 3.04, r: 0.71 }, Cl: { en: 3.16, r: 1.02 }, O: { en: 3.44, r: 0.66 },
    F: { en: 3.98, r: 0.57 },
  };
  const ORDER = Object.keys(EL).sort((a, b) => EL[a].en - EL[b].en); // weakest puller to strongest
  const EN_MIN = 0.7, EN_MAX = 4.0, DEN_MAX = 3.4;
  const icOf = (d) => 1 - Math.exp(-0.25 * d * d);
  /* The cut-offs are human conventions (books draw them at 0.4/0.5 and 1.7/2.0). We use 0.4 and 2.0, which
     keeps HF molecular and MgO ionic. The dial shows the curve under them has no corner. */
  const ZONE_POLAR = 0.4, ZONE_IONIC = 2.0;
  const zoneOf = (d) => (d < ZONE_POLAR ? 'nonpolar covalent' : d < ZONE_IONIC ? 'polar covalent' : 'ionic');
  const radiusOf = (a) => (a.el ? EL[a.el].r : clamp(2.15 - 0.43 * a.en, 0.45, 2.0));
  const PAIRS = [['H', 'H'], ['Cl', 'Cl'], ['C', 'H'], ['C', 'Cl'], ['N', 'H'], ['O', 'H'], ['C', 'O'],
    ['H', 'F'], ['Mg', 'O'], ['Na', 'Cl'], ['K', 'Br'], ['Li', 'F']];
  const wrapAngle = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const fmtQ = (q) => (q >= 0 ? '+' : '−') + Math.abs(q).toFixed(2);

  const GOALS = [
    { id: 'even', text: 'Make the sharing perfectly even.' },
    { id: 'hand', text: 'Make one atom take almost everything.' },
    { id: 'edge', text: 'Set a bond right on the line between polar and ionic.' },
    { id: 'turn', text: 'Turn a bond around with the charge probe.' },
    { id: 'induce', text: 'Make a perfectly even bond lean anyway.' },
    { id: 'water', text: 'Build the bond that holds water together.' },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<defs><radialGradient id="tg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e8870f" stop-opacity=".95"/><stop offset="1" stop-color="#e8870f" stop-opacity="0"/></radialGradient></defs>' +
    '<circle cx="76" cy="60" r="32" fill="none" stroke="currentColor" stroke-opacity=".7" stroke-width="2.5"/>' +
    '<circle cx="130" cy="60" r="25" fill="none" stroke="currentColor" stroke-opacity=".7" stroke-width="2.5"/>' +
    '<ellipse cx="110" cy="60" rx="36" ry="21" fill="url(#tg)"/>' +
    '<circle cx="76" cy="60" r="5" fill="#d9493c"/><circle cx="130" cy="60" r="5" fill="#3b82e0"/></svg>';

  BL.register({
    id: 'tug', field: 'bonding', order: 2, name: 'Tug',
    tagline: 'A close-up of one bond, and what a passing charge does to it.',
    lede: 'A close-up of one stretch of the rail you met in The Spectrum. Change how hard each atom pulls and watch the cloud lean — then bring a charge nearby and watch it lean further, or turn the whole molecule round.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock, params }) {
      const S = {
        a: { el: 'C', en: EL.C.en },
        b: { el: 'N', en: EL.N.en },
        probe: { q: 0, nx: 0.8, ny: 0.2, used: false },
        theta: 0, omega: 0, maxTurn: 0, touched: false,
        v: { sic: 0.05, shift: { x: 0, y: 0 } },   // smoothed picture of the molecule
      };
      // Deep link from other instruments: #/tug/Na-Cl
      const pre = (params && params[0] || '').split('-');
      if (pre.length === 2 && EL[pre[0]] && EL[pre[1]]) {
        S.a = { el: pre[0], en: EL[pre[0]].en }; S.b = { el: pre[1], en: EL[pre[1]].en };
      }
      S.v.sic = Math.sign(S.b.en - S.a.en) * icOf(Math.abs(S.b.en - S.a.en));

      /* ---------- stage ---------- */
      const stage = BL.stage(stageHost, '16 / 10', {
        label: 'Two atoms sharing an electron cloud. Drag the charge probe to disturb it. With the stage focused, arrow keys move the probe.',
        focusable: true,
      });
      stage.wrap.classList.add('dots');
      const ctx = stage.ctx;
      const L = { cx: 0, cy: 0, d: 120, unit: 34 };
      stage.onresize = () => {
        L.d = clamp(Math.min(stage.w * 0.36, stage.h * 0.48), 78, 300);
        L.unit = L.d * 0.36;
        L.cx = stage.w * 0.5;
        L.cy = stage.h * 0.5;
      };
      stage.onresize();

      const N = 1100;
      const mk = () => ({ u: clamp(randn(), -2.5, 2.5), v: clamp(randn(), -2.5, 2.5), lobe: Math.random() < 0.5 ? -1 : 1, s: 0.45 + Math.random() * 0.55 });
      const P = Array.from({ length: N }, mk);

      const probePos = () => ({ x: S.probe.nx * stage.w, y: S.probe.ny * stage.h });

      BL.drag(stage.canvas, {
        pick: (p) => { if (!S.probe.q) return null; const q = probePos(); return Math.hypot(p.x - q.x, p.y - q.y) < 36 ? 'probe' : null; },
        move: (_h, p) => {
          S.probe.nx = clamp(p.x, 20, stage.w - 20) / stage.w;
          S.probe.ny = clamp(p.y, 20, stage.h - 20) / stage.h;
          S.probe.used = true; S.touched = true;
        },
      });
      stage.canvas.addEventListener('keydown', (e) => {
        const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (!k || !S.probe.q) return;
        e.preventDefault();
        S.probe.nx = clamp(S.probe.nx + k[0] * 0.03, 0.04, 0.96);
        S.probe.ny = clamp(S.probe.ny + k[1] * 0.04, 0.05, 0.95);
        S.probe.used = true; S.touched = true;
      });

      /* ---------- below the stage: readout + dial ---------- */
      const readout = h('div', { class: 'readout', 'aria-live': 'polite' });
      const dialStage = BL.stage(h('div'), '2.9 / 1', {
        label: 'Chart of how unevenly the cloud is shared against the difference in pull. Real pairs are marked; click one to load it.',
      });
      dialStage.wrap.classList.add('flat', 'dial');
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'This bond'), readout, dialStage.wrap,
        h('p', { class: 'hint' }, 'The dots on the curve are real pairs. Click one to load it.')));

      /* ---------- dock: atoms ---------- */
      const panels = {};
      function atomPanel(side, title) {
        const chips = h('div', { class: 'chips', role: 'group', 'aria-label': title + ' element' });
        const buttons = {};
        ORDER.forEach((sym) => {
          const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: () => { S.touched = true; const a = S[side]; a.el = sym; a.en = EL[sym].en; syncUI(); } }, sym);
          buttons[sym] = b; chips.appendChild(b);
        });
        const out = h('output', { class: 'val' });
        const slider = h('input', { type: 'range', min: EN_MIN, max: EN_MAX, step: '0.01', 'aria-label': title + ' pull' });
        slider.addEventListener('input', () => { S.touched = true; const a = S[side]; a.en = parseFloat(slider.value); a.el = null; syncUI(); });
        panels[side] = { buttons, out, slider };
        return h('section', {},
          h('div', { class: 'row' }, h('h2', {}, title), h('span', { class: 'note' }, 'pull ', out)),
          chips,
          h('div', { class: 'range-wrap' }, slider, h('div', { class: 'range-ends' }, h('span', {}, 'lets go'), h('span', {}, 'holds tight'))));
      }
      dock.appendChild(atomPanel('a', 'Atom on the left'));
      dock.appendChild(atomPanel('b', 'Atom on the right'));

      /* ---------- dock: probe + goals ---------- */
      const probeBtns = [['Off', 0, 'Charge probe off'], ['+', 1, 'Positive probe'], ['−', -1, 'Negative probe']].map(([label, q, aria]) =>
        h('button', { type: 'button', 'aria-pressed': String(q === 0), 'aria-label': aria, onclick: () => { S.probe.q = q; S.touched = true; probeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === [0, 1, -1].indexOf(q)))); } }, label));
      dock.appendChild(h('section', {},
        h('h2', {}, 'Charge probe'),
        h('div', { class: 'seg', role: 'group', 'aria-label': 'Charge probe' }, probeBtns),
        h('p', { class: 'hint' }, 'Drag it around the molecule. (Keyboard: focus the stage, use the arrow keys.)')));

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'tug', GOALS);
      dock.appendChild(goalsHost);

      /* ---------- derived values ---------- */
      const derive = () => {
        const d = Math.abs(S.b.en - S.a.en);
        return { d, ic: icOf(d), sgn: Math.sign(S.b.en - S.a.en) };
      };
      const nameOf = () => (S.a.el || 'X') + '–' + (S.b.el || 'Y');

      function syncUI() {
        ['a', 'b'].forEach((side) => {
          const a = S[side], pn = panels[side];
          ORDER.forEach((sym) => pn.buttons[sym].setAttribute('aria-pressed', String(a.el === sym)));
          pn.slider.value = a.en;
          pn.out.textContent = a.en.toFixed(2);
        });
        const D = derive();
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, nameOf()),
          h('span', { class: 'zone' }, zoneOf(D.d)),
          h('span', { class: 'dim' }, 'difference in pull ' + D.d.toFixed(2)));
      }
      syncUI();

      /* ---------- dial ---------- */
      const dial = { hoverIdx: -1 };
      const dm = () => { const f = BL.fs(13); return { l: f * 3.6, r: 14, t: f * 2.4, b: f * 3.3, f }; };
      const dx = (d) => { const m = dm(); return m.l + (d / DEN_MAX) * (dialStage.w - m.l - m.r); };
      const dy = (share) => { const m = dm(); return m.t + (1 - (share - 0.5) / 0.5) * (dialStage.h - m.t - m.b); };
      const pairPts = PAIRS.map(([x, y]) => { const d = Math.abs(EL[x].en - EL[y].en); return { a: x, b: y, d, share: 0.5 + 0.5 * icOf(d), label: x + '–' + y }; });
      const nearestPair = (p) => {
        let best = -1, bd = 20;
        pairPts.forEach((q, i) => { const dd = Math.hypot(p.x - dx(q.d), p.y - dy(q.share)); if (dd < bd) { bd = dd; best = i; } });
        return best;
      };
      dialStage.canvas.addEventListener('pointermove', (e) => {
        const r = dialStage.canvas.getBoundingClientRect();
        dial.hoverIdx = nearestPair({ x: e.clientX - r.left, y: e.clientY - r.top });
        dialStage.canvas.style.cursor = dial.hoverIdx >= 0 ? 'pointer' : 'default';
      });
      dialStage.canvas.addEventListener('pointerleave', () => { dial.hoverIdx = -1; });
      dialStage.canvas.addEventListener('click', (e) => {
        const r = dialStage.canvas.getBoundingClientRect();
        const i = nearestPair({ x: e.clientX - r.left, y: e.clientY - r.top });
        if (i < 0) return;
        S.touched = true;
        S.a.el = pairPts[i].a; S.a.en = EL[pairPts[i].a].en;
        S.b.el = pairPts[i].b; S.b.en = EL[pairPts[i].b].en;
        syncUI();
      });

      function drawDial() {
        const c = dialStage.ctx, W = dialStage.w, H = dialStage.h, pal = BL.pal;
        if (!W) return;
        c.clearRect(0, 0, W, H);
        const D = derive(), m = dm();
        // zones
        const zones = [[0, ZONE_POLAR, 'nonpolar'], [ZONE_POLAR, ZONE_IONIC, 'polar covalent'], [ZONE_IONIC, DEN_MAX, 'ionic']];
        const fillA = [0.05, 0.12, 0.05];
        c.font = BL.font(700, 13);
        zones.forEach(([a, b, name], i) => {
          c.fillStyle = BL.alpha(pal.ui, fillA[i]);
          c.fillRect(dx(a), m.t, dx(b) - dx(a), H - m.t - m.b);
          c.fillStyle = pal.muted; c.textAlign = 'center';
          const bw = dx(b) - dx(a), cx = (dx(a) + dx(b)) / 2, yb = H - m.b;
          if (c.measureText(name).width < bw - 8) c.fillText(name, cx, yb - 8);
          else if (name === 'polar covalent') { c.fillText('polar', cx, yb - m.f * 1.35); c.fillText('covalent', cx, yb - 8); }
          else { c.save(); c.translate(cx + m.f * 0.35, m.t + 8); c.rotate(Math.PI / 2); c.textAlign = 'left'; c.fillText(name, 0, 0); c.restore(); }
        });
        // boundaries
        c.strokeStyle = BL.alpha(pal.line2, 0.8); c.lineWidth = 1.5; c.setLineDash([4, 4]);
        [ZONE_POLAR, ZONE_IONIC].forEach((v) => { c.beginPath(); c.moveTo(dx(v), m.t); c.lineTo(dx(v), H - m.b); c.stroke(); });
        c.setLineDash([]);
        // axes
        c.strokeStyle = pal.line2; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(m.l, m.t); c.lineTo(m.l, H - m.b); c.lineTo(W - m.r, H - m.b); c.stroke();
        c.fillStyle = pal.muted; c.font = BL.font(400, 13); c.textAlign = 'right';
        [0.5, 0.75, 1].forEach((s) => c.fillText(Math.round(s * 100) + '%', m.l - 6, dy(s) + 4));
        c.textAlign = 'center';
        [0, 1, 2, 3].forEach((v) => c.fillText(String(v), dx(v), H - m.b + m.f * 1.15));
        c.textAlign = 'right'; c.fillText('difference in pull →', W - m.r, H - 5);
        c.textAlign = 'left'; c.fillText('share of cloud on the stronger atom', 6, m.f * 1.15);
        // curve
        c.strokeStyle = pal.ui; c.lineWidth = 3; c.beginPath();
        for (let i = 0; i <= 80; i++) { const d = (i / 80) * DEN_MAX; const x = dx(d), y = dy(0.5 + 0.5 * icOf(d)); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
        c.stroke();
        // real pairs
        pairPts.forEach((q, i) => {
          const on = i === dial.hoverIdx;
          c.fillStyle = pal.fg; c.strokeStyle = pal.panel; c.lineWidth = 2;
          c.beginPath(); c.arc(dx(q.d), dy(q.share), on ? 6 : 4.5, 0, 7); c.fill(); c.stroke();
        });
        if (dial.hoverIdx >= 0) {
          const q = pairPts[dial.hoverIdx], x = dx(q.d), y = dy(q.share);
          BL.label(c, q.label, x + (x > W * 0.7 ? -10 : 10), y - 14, { font: BL.font(700, 14), align: x > W * 0.7 ? 'right' : 'left', border: pal.line2 });
        }
        // you are here
        const mx = dx(Math.min(D.d, DEN_MAX)), my = dy(0.5 + 0.5 * D.ic);
        c.strokeStyle = BL.alpha(pal.electron, 0.8); c.lineWidth = 1.5; c.setLineDash([3, 3]);
        c.beginPath(); c.moveTo(mx, my); c.lineTo(mx, H - m.b); c.stroke(); c.setLineDash([]);
        c.strokeStyle = pal.electron; c.lineWidth = 3; c.beginPath(); c.arc(mx, my, 9, 0, 7); c.stroke();
        c.fillStyle = pal.electron; c.beginPath(); c.arc(mx, my, 3.5, 0, 7); c.fill();
      }

      /* ---------- the molecule ---------- */
      function frame(dt) {
        const D = derive(), v = S.v, pal = BL.pal;
        const k = 1 - Math.exp(-dt * (BL.reduced ? 20 : 7));

        v.sic += (D.sgn * D.ic - v.sic) * k;
        const icv = Math.abs(v.sic);
        const t = 0.5 + 0.5 * v.sic;

        // probe: squishes the cloud, turns the molecule
        let tgt = { x: 0, y: 0 }, near = 0;
        const Cc = { x: L.cx, y: L.cy };
        if (S.probe.q) {
          const pp = probePos();
          const dxp = pp.x - Cc.x, dyp = pp.y - Cc.y, dist = Math.hypot(dxp, dyp) || 1;
          near = clamp(Math.pow((L.d * 1.15) / dist, 2), 0, 1.6);
          const alpha = 0.34 * L.d * (1 - 0.55 * icv);
          const mag = alpha * Math.min(1, near);
          tgt = { x: S.probe.q * (dxp / dist) * mag, y: S.probe.q * (dyp / dist) * mag };
          if (D.sgn !== 0) {
            const phi = S.theta + (D.sgn > 0 ? 0 : Math.PI);                     // direction of the stronger-pulling atom
            const want = S.probe.q > 0 ? Math.atan2(dyp, dxp) : Math.atan2(-dyp, -dxp);
            const torque = 38 * icv * near * Math.sin(wrapAngle(want - phi));
            S.omega += (torque - 7 * S.omega - 1.6 * Math.sin(S.theta)) * dt;
          } else S.omega += (-7 * S.omega - 1.6 * Math.sin(S.theta)) * dt;
        } else {
          S.omega += (-7 * S.omega - 1.6 * Math.sin(S.theta)) * dt;
        }
        S.theta = wrapAngle(S.theta + S.omega * dt * (BL.reduced ? 3 : 1));
        v.shift.x += (tgt.x - v.shift.x) * k;
        v.shift.y += (tgt.y - v.shift.y) * k;

        const cth = Math.cos(S.theta), sth = Math.sin(S.theta);
        const proj = v.shift.x * cth + v.shift.y * sth;       // cloud pushed toward the right-hand atom?
        const dq = clamp((proj / L.d) * 1.1, -0.4, 0.4);
        const qB = -v.sic - dq, qA = v.sic + dq;

        // ---------- goals ----------
        if (S.touched) {
          if (D.d < 0.03) goals.done('even');
          if (D.ic >= 0.7) goals.done('hand');
          if (Math.abs(D.d - ZONE_IONIC) < 0.06) goals.done('edge');
          if ((S.a.el === 'H' && S.b.el === 'O') || (S.a.el === 'O' && S.b.el === 'H')) goals.done('water');
          if (S.probe.q && D.ic > 0.15) { S.maxTurn = Math.max(S.maxTurn, Math.abs(S.theta)); if (S.maxTurn > 0.9) goals.done('turn'); }
          if (S.probe.q && D.ic < 0.05 && Math.abs(dq) > 0.12) goals.done('induce');
        }

        // ---------- draw ----------
        const W = stage.w, H = stage.h;
        ctx.clearRect(0, 0, W, H);
        const rot = (x, y) => ({ x: L.cx + x * cth - y * sth, y: L.cy + x * sth + y * cth });
        const Apos = rot(-L.d / 2, 0), Bpos = rot(L.d / 2, 0);
        const strongRpx = (v.sic >= 0 ? radiusOf(S.b) : radiusOf(S.a)) * L.unit * (1 + 0.38 * icv);
        const easeIc = Math.pow(icv, 0.8);
        const sx = Math.max(10, lerp(0.19 * L.d, 0.42 * strongRpx, easeIc));
        const sy = Math.max(10, lerp(0.16 * L.d, 0.42 * strongRpx, easeIc));
        const lobeDx = 0.17 * L.d * (1 - icv);
        const xc = -L.d / 2 + t * L.d;
        const cw = rot(xc, 0);
        cw.x += v.shift.x; cw.y += v.shift.y;
        const blend = pal.dark ? 'lighter' : 'source-over';

        // soft glow under the cloud
        ctx.save();
        ctx.globalCompositeOperation = blend;
        ctx.translate(cw.x, cw.y); ctx.rotate(S.theta); ctx.scale(sx * 2.7 + lobeDx, sy * 2.7);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, BL.alpha(pal.cloud, pal.dark ? 0.28 : 0.26)); g.addColorStop(1, BL.alpha(pal.cloud, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill();
        ctx.restore();

        // atom bodies (drawn under the cloud so the glow reads through)
        const facA = 1 + (v.sic < 0 ? 0.38 * icv : -0.30 * icv);
        const facB = 1 + (v.sic > 0 ? 0.38 * icv : -0.30 * icv);
        const atoms = [
          { pos: Apos, a: S.a, q: qA, rpx: radiusOf(S.a) * L.unit * facA, label: S.a.el || 'X' },
          { pos: Bpos, a: S.b, q: qB, rpx: radiusOf(S.b) * L.unit * facB, label: S.b.el || 'Y' },
        ];
        atoms.forEach((o) => {
          const tint = o.q >= 0 ? pal.pos : pal.neg;
          ctx.beginPath(); ctx.arc(o.pos.x, o.pos.y, o.rpx, 0, 7);
          ctx.fillStyle = BL.alpha(tint, 0.05 + 0.2 * Math.min(1, Math.abs(o.q))); ctx.fill();
          ctx.strokeStyle = BL.alpha(pal.fg, 0.55); ctx.lineWidth = 2; ctx.stroke();
        });

        // the cloud itself
        ctx.save();
        ctx.globalCompositeOperation = blend;
        const rc = BL.reduced ? 0.01 : 0.07;
        for (let i = 0; i < Math.ceil(N * rc); i++) P[(Math.random() * N) | 0] = mk();
        const dotCol = pal.cloud, base = pal.dark ? 0.30 : 0.38, span = pal.dark ? 0.5 : 0.5, ds = pal.dark ? 2.5 : 2.7;
        for (let i = 0; i < N; i++) {
          const p = P[i];
          const lx = xc + p.lobe * lobeDx + p.u * sx, ly = p.v * sy;
          const x = L.cx + lx * cth - ly * sth + v.shift.x, y = L.cy + lx * sth + ly * cth + v.shift.y;
          ctx.fillStyle = BL.alpha(dotCol, Math.round((base + span * p.s) * 20) / 20);
          ctx.fillRect(x - ds / 2, y - ds / 2, ds, ds);
        }
        ctx.restore();

        // nuclei, charges, names
        atoms.forEach((o) => {
          const col = o.q >= 0 ? BL.mix(pal.fg, pal.pos, Math.min(1, o.q * 1.6)) : BL.mix(pal.fg, pal.neg, Math.min(1, -o.q * 1.6));
          ctx.beginPath(); ctx.arc(o.pos.x, o.pos.y, 7, 0, 7); ctx.fillStyle = col; ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = pal.panel; ctx.stroke();
          BL.label(ctx, o.label, o.pos.x, o.pos.y + BL.fs(14) * 2.1, { font: BL.font(800, 17, true) });
          if (Math.abs(o.q) >= 0.03) BL.label(ctx, 'δ' + fmtQ(o.q), o.pos.x, o.pos.y - BL.fs(14) * 2.1, { font: BL.font(700, 14), color: o.q >= 0 ? pal.pos : pal.neg, border: o.q >= 0 ? pal.pos : pal.neg });
        });

        // probe
        if (S.probe.q) {
          const pp = probePos(), pos = S.probe.q > 0;
          const hue = pos ? pal.pos : pal.neg;
          const gr = ctx.createRadialGradient(pp.x, pp.y, 4, pp.x, pp.y, 46);
          gr.addColorStop(0, BL.alpha(hue, 0.35)); gr.addColorStop(1, BL.alpha(hue, 0));
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(pp.x, pp.y, 46, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(pp.x, pp.y, 18, 0, 7); ctx.fillStyle = hue; ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = pal.fg; ctx.stroke();
          ctx.fillStyle = pal.dark ? '#08151a' : '#ffffff'; ctx.font = BL.font(800, 24, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(pos ? '+' : '−', pp.x, pp.y + 1.5);
          if (!S.probe.used && !BL.reduced) {
            const ph = (performance.now() / 900) % 1;
            ctx.strokeStyle = BL.alpha(hue, (1 - ph) * 0.9); ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(pp.x, pp.y, 22 + ph * 18, 0, 7); ctx.stroke();
          }
          ctx.textBaseline = 'alphabetic';
        }

        drawDial();
      }

      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); dialStage.destroy(); } };
    },
  });
})();
