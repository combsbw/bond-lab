/* Climb: water going up a thin tube, against gravity.
   Three thin tubes stand in a dish of water. Where the water touches the tube
   wall, the wall grabs it and pulls it up; the water behind it is held on by
   handshakes and gets dragged along. The pull is along the rim of the tube,
   but the weight to be held up fills the whole width, so a thin tube gets
   its pull-to-weight ratio in its favor and water climbs higher. A surface
   that grabs less than the water grips itself does the opposite: the water
   is pushed down.

   Model: this one is a calculation, not a molecule-by-molecule simulation.
   The rise comes from the textbook balance of rim pull and weight,
       h = 4 * gamma * cos(theta) / (rho * g * d),
   with gamma (surface tension) set by how tightly the water grips itself and
   the contact angle theta set by how the surface grab compares with that grip,
   matching the drops measured in Cling. The close-up at the side is a drawing
   of the idea. (A molecule-by-molecule version of this needs thousands of
   molecules; the small one in js/water2d.js is too noisy to show the trend.) */
(function () {
  'use strict';
  const { h, clamp } = BL;

  const TOP = 110;                       // tube length above the dish level, mm
  const DOWN = 55;                       // tube length below it
  const GAMMA0 = 72, RHO = 1000, G0 = 9.81;
  const GOALS = [
    { id: 'rise', text: 'Make water climb a tube.' },
    { id: 'narrow', text: 'Find out which tube lifts the water highest.' },
    { id: 'wax', text: 'Find a surface where the water goes down the tube instead.' },
    { id: 'zero', text: 'Find a surface where the water neither climbs nor drops.' },
    { id: 'coh', text: 'Keep the glass and make the water grip itself more tightly. Does the climb go up or down?' },
    { id: 'moon', text: 'Take the experiment to the Moon.' },
    { id: 'space', text: 'Turn gravity off. What does the water do?' },
  ];
  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true"><path d="M30 78 H170 V108 H30Z" fill="var(--wash)" opacity=".8"/><path d="M30 78 H170" stroke="var(--ui)" stroke-width="3"/>' +
    '<g stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"><path d="M72 20 V98"/><path d="M82 20 V98"/><path d="M110 20 V98"/><path d="M130 20 V98"/></g>' +
    '<path d="M73 44 H81 V78 H73Z" fill="var(--ui)" opacity=".85"/><path d="M111 62 H129 V78 H111Z" fill="var(--ui)" opacity=".85"/></svg>';

  BL.register({
    id: 'climb', field: 'water', order: 3, name: 'Climb',
    tagline: 'Up a thin tube, against gravity.',
    lede: 'Water climbs up a narrow tube on its own, against gravity. It grabs the walls and then drags the rest of itself up behind it.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        grab: 85, coh: 100, grav: 100, d: [0.4, 1, 2.2], L: [0, 0, 0], v: [0, 0, 0], sel: 1, hinted: false, t: 0, cohBase: null, cohBaseRise: null, moved: false,
      };
      const stage = BL.stage(stageHost, '16 / 11', {
        label: 'Three thin tubes standing in a dish of water, drawn from the side, with a ruler. The water level inside each tube rises or falls depending on the tube width, the surface, and gravity. Controls are in the side panel.',
        focusable: true,
      });
      stage.wrap.classList.add('climb-stage');
      const ctx = stage.ctx;

      /* ---------------- the physics, in one place ---------------- */
      const cosTheta = (grab, coh) => clamp(-0.5 + 1.4 * (grab / coh), -1, 1);
      const gamma = (coh) => GAMMA0 * coh / 100;
      const target = (i) => {
        const c = cosTheta(S.grab, S.coh), g = G0 * S.grav / 100;
        if (g <= 0.05) return c > 0 ? Infinity : -Infinity;
        const hMm = (4 * gamma(S.coh) * 1e-3 * c) / (RHO * g * S.d[i] * 1e-3) * 1000;      // mm
        return clamp(hMm, -DOWN + 8, Infinity);
      };

      /* ---------------- dock ---------------- */
      const presets = [['Wax', 5], ['Plastic', 28], ['Glass', 85]];
      const presetBtns = presets.map(([n, v]) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(v === S.grab), onclick: () => { S.grab = v; grabIn.value = String(v); sync(); S.moved = true; } }, n));
      dock.appendChild(h('section', {}, h('h2', {}, 'Tube material'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Tube material' }, presetBtns)));
      const mk = (label, min, max, step, val, fmt, cb, ends) => {
        const out = h('output', { class: 'val' }), input = h('input', { type: 'range', min, max, step, value: val, 'aria-label': label });
        input.addEventListener('input', () => { cb(parseFloat(input.value)); out.textContent = fmt(parseFloat(input.value)); S.hinted = true; });
        out.textContent = fmt(val);
        return { out, input, el: h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, label), out), h('div', { class: 'range-wrap' }, input, h('div', { class: 'range-ends' }, h('span', {}, ends[0]), h('span', {}, ends[1])))) };
      };
      const grabC = mk('How much the tube grabs water', '0', '100', '1', S.grab, (v) => Math.round(v) + '%', (v) => { S.grab = v; sync(); }, ['not at all', 'a lot']);
      const grabIn = grabC.input;
      const cohC = mk('How tightly water grips itself', '40', '160', '5', S.coh, (v) => Math.round(v) + '%', (v) => { S.coh = v; sync(); }, ['loosely', 'tightly']);
      const gravC = mk('Gravity', '0', '150', '1', S.grav, (v) => (v === 0 ? 'off' : v === 17 ? 'Moon' : v === 100 ? 'Earth' : Math.round(v) + '%'), (v) => { S.grav = v; sync(); }, ['none', 'strong']);
      const moonBtn = h('button', { type: 'button', class: 'chip soft', onclick: () => { S.grav = 17; gravC.input.value = '17'; gravC.out.textContent = 'Moon'; sync(); } }, 'Moon');
      const earthBtn = h('button', { type: 'button', class: 'chip soft', onclick: () => { S.grav = 100; gravC.input.value = '100'; gravC.out.textContent = 'Earth'; sync(); } }, 'Earth');
      dock.appendChild(h('section', {}, grabC.el, cohC.el, gravC.el, h('div', { class: 'chips' }, earthBtn, moonBtn)));

      const wIn = [0, 1, 2].map((i) => {
        const out = h('output', { class: 'val' }), input = h('input', { type: 'range', min: '2', max: '40', step: '1', value: String(Math.round(S.d[i] * 10)), 'aria-label': 'Width of tube ' + 'ABC'[i] });
        input.addEventListener('input', () => { S.d[i] = parseFloat(input.value) / 10; out.textContent = S.d[i].toFixed(1) + ' mm'; S.sel = i; S.hinted = true; sync(); });
        out.textContent = S.d[i].toFixed(1) + ' mm';
        return h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('span', { class: 'lab' }, 'Tube ' + 'ABC'[i] + ' width'), out), input);
      });
      dock.appendChild(h('section', {}, h('h2', {}, 'Tube widths'), ...wIn));
      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'climb', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const meter = h('div', { class: 'meters' });
      aux.appendChild(h('section', { class: 'panel' }, statusP, meter));
      const zoom = BL.stage(h('div'), '2 / 1', { label: 'A close-up drawing of the edge of the water where it meets the tube wall: the wall pulls up on the nearest water molecule, and the handshakes drag the next ones along.' });
      zoom.wrap.classList.add('flat', 'hist');
      const selBtns = [0, 1, 2].map((i) => h('button', { type: 'button', 'aria-pressed': String(i === S.sel), onclick: () => { S.sel = i; sync(); } }, 'Tube ' + 'ABC'[i]));
      aux.appendChild(h('section', { class: 'panel' }, h('div', { class: 'row' }, h('h2', {}, 'Close up, at the wall'), h('div', { class: 'seg', role: 'group', 'aria-label': 'Which tube to look at' }, selBtns)), zoom.wrap,
        h('p', { class: 'hint' }, 'A drawing, not a simulation: the red arrow is the wall pulling on the water at the rim, the teal bars are the handshakes that drag the rest along.')));

      function sync() {
        presetBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(Math.abs(S.grab - presets[i][1]) < 2)));
        selBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === S.sel)));
        grabC.out.textContent = Math.round(S.grab) + '%'; grabC.input.value = String(S.grab);
        gravC.out.textContent = S.grav === 0 ? 'off' : S.grav === 17 ? 'Moon' : S.grav === 100 ? 'Earth' : Math.round(S.grav) + '%';
        if (S.moved === false) S.moved = false;
      }

      /* ---------------- frame ---------------- */
      function frame(dt) {
        const pal = BL.pal, W = stage.w, H = stage.h; S.t += dt;
        const steps = Math.max(1, Math.round(dt / 0.004));
        for (let i = 0; i < 3; i++) {
          let tg = target(i); const lim = tg === Infinity ? TOP : tg === -Infinity ? -DOWN + 8 : clamp(tg, -DOWN + 8, TOP);
          for (let k = 0; k < steps; k++) { const a = 40 * (lim - S.L[i]) - 11 * S.v[i]; S.v[i] += a * 0.004; S.L[i] += S.v[i] * 0.004; }
          S.L[i] = clamp(S.L[i], -DOWN + 6, TOP);
        }
        // goals
        const c = cosTheta(S.grab, S.coh), settled = S.v.every((v) => Math.abs(v) < 0.8);
        if (S.L.some((l) => l > 5)) goals.done('rise');
        if (settled && c > 0.15 && S.grav > 20 && S.L[0] < TOP - 2 && S.L[2] > 3 && S.d[0] < S.d[1] - 0.2 && S.d[1] < S.d[2] - 0.2 && S.L[0] > S.L[1] + 2 && S.L[1] > S.L[2] + 2) goals.done('narrow');
        if (settled && S.L.some((l) => l < -3)) goals.done('wax');
        if (settled && Math.abs(c) < 0.06 && S.grab > 15) goals.done('zero');
        if (S.grav > 0 && S.grav <= 20 && S.L.some((l) => l > 20)) goals.done('moon');
        if (S.grav === 0 && c > 0 && S.L.every((l) => l > TOP - 3)) goals.done('space');
        if (settled && S.grab > 70) { if (S.cohBase == null) { S.cohBase = S.coh; S.cohRise = S.L[1]; } else if (Math.abs(S.coh - S.cohBase) >= 40 && Math.abs(S.L[1] - S.cohRise) > 5 && S.L[1] < TOP - 3) goals.done('coh'); }
        draw(pal, W, H); drawZoom(); words(c);
      }

      function words(c) {
        const now = performance.now(); if (now - (S.lastW || 0) < 250) return; S.lastW = now;
        const th = Math.acos(c) * 180 / Math.PI, i = S.sel, d = S.d[i];
        const rim = 2 * Math.PI * (d / 2) * gamma(S.coh) * c;            // uN-ish, drawn relative
        const wt = Math.PI * (d / 2) ** 2 * Math.max(0, S.L[i]) * (S.grav / 100) * 9.81 * 1e-3 * 1;
        meter.textContent = '';
        const row = (k, v) => meter.appendChild(h('div', { class: 'meter-row' }, h('span', {}, k), h('b', {}, v)));
        row('The water meets the wall at', Math.round(th) + '°');
        S.d.forEach((dd, j) => row('Tube ' + 'ABC'[j] + ' (' + dd.toFixed(1) + ' mm wide)', S.L[j] >= TOP - 1 ? 'fills the tube' : (S.L[j] >= 0 ? '+' : '−') + Math.abs(S.L[j]).toFixed(0) + ' mm'));
        const mx = Math.max(Math.abs(rim), 1e-6);
        meter.appendChild(h('div', { class: 'meter' }, h('div', { class: 'meter-row' }, h('span', {}, 'Pull of the rim, tube ' + 'ABC'[i]), h('b', {}, rim >= 0 ? 'up' : 'down')), h('div', { class: 'mbar' }, h('div', { style: 'width:' + clamp(Math.abs(rim) / mx, 0, 1) * 100 + '%' }))));
        meter.appendChild(h('div', { class: 'meter' }, h('div', { class: 'meter-row' }, h('span', {}, 'Weight of the water it holds up'), h('b', {}, '')), h('div', { class: 'mbar' }, h('div', { style: 'width:' + clamp(wt / mx, 0, 1) * 100 + '%' }))));
        const a = S.L[0], b = S.L[2];
        statusP.textContent = c < -0.05 ? 'This tube pushes the water away. It sits lower inside the tube than outside.' : Math.abs(c) <= 0.05 ? 'The tube grabs the water exactly as much as the water grips itself. Nothing moves.'
          : S.grav === 0 ? 'No gravity pulling the water down, so it climbs all the way.' : (a - b > 4 ? 'The thin tube holds a taller column than the wide one.' : 'The tube grabs the water, so it climbs.');
      }

      /* ---------------- drawing ---------------- */
      function draw(pal, W, H) {
        ctx.clearRect(0, 0, W, H);
        const pxMm = (H - 90) / (TOP + DOWN + 12), y0 = 26 + TOP * pxMm;            // y of the dish level
        const col = pal.tHydrogen || pal.ui;
        // the dish
        const dishTop = y0, dishH = H - 20 - y0;
        ctx.fillStyle = BL.alpha(pal.ui, pal.dark ? 0.28 : 0.2); ctx.fillRect(18, dishTop, W - 36, dishH);
        ctx.strokeStyle = pal.muted; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, dishTop - 16); ctx.lineTo(18, H - 20); ctx.lineTo(W - 18, H - 20); ctx.lineTo(W - 18, dishTop - 16); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, y0); ctx.lineTo(W - 18, y0); ctx.stroke();
        // ruler
        const rx = W - 44;
        ctx.strokeStyle = pal.muted; ctx.fillStyle = pal.muted; ctx.lineWidth = 1.5; ctx.font = BL.font(400, 13); ctx.textAlign = 'right';
        for (let mm = -40; mm <= TOP; mm += 10) { const y = y0 - mm * pxMm; ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + (mm % 50 === 0 ? 14 : 8), y); ctx.stroke(); if (mm % 50 === 0) ctx.fillText(mm + (mm === TOP - TOP % 50 ? ' mm' : ''), rx - 4, y + 4); }
        ctx.beginPath(); ctx.moveTo(rx, y0 + 40 * pxMm); ctx.lineTo(rx, y0 - TOP * pxMm); ctx.stroke();
        // the tubes
        const xs = [W * 0.2, W * 0.42, W * 0.64], pxW = 16, wallW = 6;
        S.d.forEach((d, i) => {
          const cx = xs[i], iw = Math.max(5, d * pxW), x0 = cx - iw / 2, x1 = cx + iw / 2, yTop = y0 - TOP * pxMm, yBot = y0 + DOWN * pxMm;
          const wl = y0 - S.L[i] * pxMm;
          // water inside
          ctx.fillStyle = BL.alpha(pal.ui, pal.dark ? 0.55 : 0.5); ctx.fillRect(x0, wl, iw, yBot - wl);
          // tube walls
          ctx.fillStyle = BL.alpha(pal.fg, 0.55); ctx.fillRect(x0 - wallW, yTop, wallW, yBot - yTop); ctx.fillRect(x1, yTop, wallW, yBot - yTop);
          if (S.sel === i) { ctx.strokeStyle = pal.electron; ctx.lineWidth = 3; ctx.strokeRect(x0 - wallW - 4, yTop - 4, iw + wallW * 2 + 8, yBot - yTop + 8); }
          // meniscus
          const c = cosTheta(S.grab, S.coh), sag = clamp(c, -1, 1) * Math.min(iw * 0.45, 9);
          ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, wl - sag); ctx.quadraticCurveTo(cx, wl + sag, x1, wl - sag); ctx.stroke();
          // label
          const txt = S.L[i] >= TOP - 1 ? 'full' : (S.L[i] >= 0 ? '+' : '−') + Math.abs(S.L[i]).toFixed(0) + ' mm';
          BL.label(ctx, txt, cx, clamp(wl - 22, yTop + 14, yBot - 6), { font: BL.font(700, 13), border: pal.fg });
          ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 15); ctx.textAlign = 'center'; ctx.fillText('ABC'[i], cx, yTop - 8 < 14 ? 14 : yTop - 8);
          ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 12); ctx.fillText(d.toFixed(1) + ' mm', cx, yBot + 16);
        });
        ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 12); ctx.textAlign = 'left'; ctx.fillText('Tube widths are drawn bigger than they are.', 24, H - 4);
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'change the tube material or the widths →', W * 0.42, H - 40, { font: BL.font(700, 14), border: pal.ui });
      }

      function drawZoom() {
        const c = zoom.ctx, W = zoom.w, H = zoom.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        const cs = cosTheta(S.grab, S.coh), th = Math.acos(cs);
        const wallX = W * 0.18;
        // wall
        c.fillStyle = BL.alpha(pal.fg, 0.55); c.fillRect(0, 0, wallX, H);
        // water, with the meniscus curving up (or down) at the wall
        const base = H * 0.55, lift = (cs) * H * 0.22;
        c.beginPath(); c.moveTo(wallX, base - lift); c.quadraticCurveTo(wallX + W * 0.18, base, W, base); c.lineTo(W, H); c.lineTo(wallX, H); c.closePath(); c.fillStyle = BL.alpha(pal.ui, pal.dark ? 0.4 : 0.3); c.fill();
        c.beginPath(); c.moveTo(wallX, base - lift); c.quadraticCurveTo(wallX + W * 0.18, base, W, base); c.lineWidth = 3; c.strokeStyle = pal.tHydrogen || pal.ui; c.stroke();
        // molecules: a short stack, the top one at the wall
        const R = Math.min(14, H * 0.08);
        const mols = [[wallX + R + 6, base - lift + R + 4], [wallX + R * 3 + 12, base - lift * 0.55 + R + 12], [wallX + R + 8, base - lift + R * 3.1 + 6], [wallX + R * 3.4 + 12, base + R * 2.1 + 8]];
        const cohW = 3 + 4 * S.coh / 100;
        for (let k = 1; k < mols.length; k++) { c.beginPath(); c.moveTo(mols[0][0], mols[0][1]); c.lineTo(mols[k][0], mols[k][1]); c.lineWidth = cohW * (k === 3 ? 0.5 : 1); c.strokeStyle = BL.alpha(pal.tHydrogen || pal.ui, 0.7); c.lineCap = 'round'; c.stroke(); c.lineCap = 'butt'; }
        mols.forEach(([x, y], k) => BL.mol.water(c, x, y, (k * 2.399) % 6.283, R * 2, pal, { lone: 0.55 }));
        // the wall's pull on the rim molecule
        const pull = (S.grab / 100) * H * 0.5;
        if (pull > 6) { c.strokeStyle = pal.neg; c.fillStyle = pal.neg; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(wallX + 10, mols[0][1] + 2); c.lineTo(wallX + 10, mols[0][1] - pull * 0.5); c.stroke(); c.lineCap = 'butt'; c.beginPath(); c.moveTo(wallX + 10, mols[0][1] - pull * 0.5 - 10); c.lineTo(wallX + 3, mols[0][1] - pull * 0.5 + 1); c.lineTo(wallX + 17, mols[0][1] - pull * 0.5 + 1); c.closePath(); c.fill(); }
        if (cs < 0) { c.fillStyle = pal.fg; c.font = BL.font(700, 13); c.textAlign = 'left'; c.fillText('the water grips itself more than it grips the wall', wallX + 14, 22); }
        // angle
        const px = wallX, py = base - lift;
        c.strokeStyle = pal.fg; c.lineWidth = 2.5; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + 40); c.stroke();
        c.beginPath(); c.arc(px, py, 26, Math.PI / 2 - th, Math.PI / 2); c.stroke();
        c.fillStyle = pal.fg; c.font = BL.font(800, 14); c.textAlign = 'left'; c.fillText(Math.round(th * 180 / Math.PI) + '°', px + 30, py + 34);
      }

      sync();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); zoom.destroy(); } };
    },
  });
})();
