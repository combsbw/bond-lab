/* Rungs: energy levels are a ladder, not a ramp.
   One electron, one nucleus, and a light you can tune. The electron can only
   stand on certain rungs, so light of the wrong energy goes straight through
   and light of just the right energy gets swallowed. Shine all the colors at
   once and the dark gaps that appear are the rungs, written in light.

   Model: hydrogen-like energy levels E_n = -13.6 Z^2 / n^2 eV. Photons are
   absorbed when their energy matches a gap (to within a tolerance, so the dial
   is usable) or exceeds the ionization energy. Excited electrons fall back on
   their own after a short wait, choosing a lower rung at random. */
(function () {
  'use strict';
  const { h, clamp, lerp } = BL;
  const A = BL.atoms;

  const NMAX = 8;                       // rungs that exist (the top ones are drawn as a crowd)
  const GOALS = [
    { id: 'jump', text: 'Lift the electron up one rung.' },
    { id: 'two', text: 'Find two different photons that both lift it from the bottom rung.' },
    { id: 'ion', text: 'Knock the electron off the atom completely.' },
    { id: 'red', text: 'Catch the atom giving off red light.' },
    { id: 'steps', text: 'Watch the electron come down in two steps.' },
    { id: 'white', text: 'Shine white light and watch dark gaps appear.' },
    { id: 'deep', text: 'Give the nucleus more charge and see the rungs spread.' },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    [[100, 'n1'], [66, 'n2'], [46, 'n3'], [34, 'n4'], [27, 'n5'], [22, 'n6']].map(([y]) => '<line x1="40" x2="160" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".85"/>').join('') +
    '<path d="M70 98 L70 70" stroke="var(--cloud)" stroke-width="3" fill="none"/><path d="M64 76 L70 66 L76 76" fill="var(--cloud)"/>' +
    '<circle cx="132" cy="66" r="7" fill="var(--panel)" stroke="var(--cloud)" stroke-width="3.5"/></svg>';

  const fmtE = (E) => (Math.abs(E) >= 100 ? E.toFixed(0) : Math.abs(E) >= 10 ? E.toFixed(1) : E.toFixed(2));
  const bandWord = (b) => ({ infrared: 'infrared (invisible)', ultraviolet: 'ultraviolet (invisible)', visible: 'visible' }[b]);
  const colorWord = (nm) => (nm < 450 ? 'violet' : nm < 495 ? 'blue' : nm < 570 ? 'green' : nm < 590 ? 'yellow' : nm < 620 ? 'orange' : 'red');

  BL.register({
    id: 'rungs', field: 'atoms', order: 1, name: 'Rungs',
    tagline: 'An electron can stand on some rungs and not others.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        Z: 1, n: 1, free: false, freeT: 0, freeKE: 0, wait: 0,
        E: 10.2, dispE: A.levelE(1, 1), anim: null,
        photons: [], fx: [], tags: [],
        fire: false, white: false, whiteT: 0, fireT: 0,
        showGaps: false, view: 'whole', lastEmitN: 0, chain: 0,
        absorbed: [], emitted: [], firstTo: new Set(), whiteSeen: new Set(),
        warm: 0, theta: 0, hinted: false, nFired: 0,
      };
      const Z2 = () => S.Z * S.Z;
      const Emax = () => 14.5 * Z2();
      const tol = () => 0.15 * Z2();
      S.E = 10.2;

      const stage = BL.stage(stageHost, '16 / 10', {
        label: 'A hydrogen-like atom with energy rungs on the left and the atom on the right. Drag along the color bar to tune the photon energy. With the stage focused, left and right arrows tune the light and Enter fires a photon.',
        focusable: true,
      });
      stage.wrap.classList.add('rungs-stage');
      const ctx = stage.ctx;
      const say = h('div', { class: 'sr-only', 'aria-live': 'polite' });
      stageHost.appendChild(say);

      /* ---------------- the record of what happened ---------------- */
      const rec = BL.stage(h('div'), '4.2 / 1', { label: 'Two strips on an energy axis. The first shows the energies of light the atom took in as dark lines. The second shows the energies of light it gave out as bright lines.' });
      rec.wrap.classList.add('flat', 'rec');
      const clearBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => { S.absorbed = []; S.emitted = []; S.whiteSeen.clear(); } }, 'Clear the record');
      aux.appendChild(h('section', { class: 'panel' },
        h('div', { class: 'row' }, h('h2', {}, 'What the atom did with the light'), clearBtn),
        rec.wrap,
        h('p', { class: 'hint' }, 'Top strip: all the colors going in, with dark lines where the atom swallowed some. Bottom strip: the light it gave back out.')));

      /* ---------------- dock ---------------- */
      const zBtns = [[1, 'Hydrogen', 'nucleus +1'], [2, 'Helium ion', 'nucleus +2'], [3, 'Lithium ion', 'nucleus +3']].map(([z, name, sub]) =>
        h('button', { type: 'button', class: 'chip', 'aria-pressed': String(z === 1), onclick: () => setZ(z) }, name, h('span', { class: 'sub' }, sub)));
      dock.appendChild(h('section', {}, h('h2', {}, 'The atom (one electron)'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Nucleus charge' }, zBtns)));

      const eOut = h('output', { class: 'val' });
      const eSub = h('p', { class: 'note', 'aria-live': 'off' });
      const slider = h('input', { type: 'range', class: 'rainbow', min: '0', max: '1000', step: '1', 'aria-label': 'Photon energy' });
      slider.addEventListener('input', () => { S.E = (parseFloat(slider.value) / 1000) * Emax(); syncE(); });
      const fireBtn = h('button', { type: 'button', class: 'action', onclick: () => shoot(S.E) }, 'Fire a photon');
      const keepBtn = h('button', { type: 'button', class: 'chip soft', 'aria-pressed': 'false', onclick: () => { S.fire = !S.fire; syncToggles(); } }, 'Keep firing');
      const whiteBtn = h('button', { type: 'button', class: 'chip soft', 'aria-pressed': 'false', onclick: () => { S.white = !S.white; if (S.white) S.fire = false; syncToggles(); } }, 'White light');
      dock.appendChild(h('section', {},
        h('div', { class: 'row' }, h('h2', {}, 'Light'), eOut),
        h('div', { class: 'range-wrap' }, slider, h('div', { class: 'range-ends' }, h('span', {}, 'low energy'), h('span', {}, 'high energy'))),
        eSub,
        h('div', { class: 'actions' }, fireBtn, keepBtn, whiteBtn),
        h('p', { class: 'hint' }, 'White light sends every energy at once, so you don’t have to hunt.')));

      const viewBtns = [['whole', 'Whole ladder'], ['top', 'Zoom in on the top']].map(([id, label]) =>
        h('button', { type: 'button', 'aria-pressed': String(id === 'whole'), onclick: () => { S.view = id; syncToggles(); } }, label));
      const gapBtn = h('button', { type: 'button', class: 'chip soft', 'aria-pressed': 'false', onclick: () => { S.showGaps = !S.showGaps; syncToggles(); } }, 'Show me the jumps');
      dock.appendChild(h('section', {},
        h('h2', {}, 'Look'),
        h('div', { class: 'seg', role: 'group', 'aria-label': 'Ladder view' }, viewBtns),
        h('div', { class: 'actions' }, gapBtn)));

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'rungs', GOALS);
      dock.appendChild(goalsHost);

      function setZ(z) {
        S.Z = z; S.n = 1; S.free = false; S.dispE = A.levelE(1, z); S.anim = null; S.photons = []; S.fx = []; S.wait = 0;
        S.E = clamp(S.E, 0, Emax()); S.absorbed = []; S.emitted = []; S.whiteSeen.clear();
        if (z > 1) goals.done('deep');
        zBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === z)));
        syncE();
      }
      function syncE() {
        slider.value = Math.round((S.E / Emax()) * 1000);
        const p = A.photon(Math.max(S.E, 0.001));
        eOut.textContent = fmtE(S.E) + ' eV';
        eSub.textContent = S.E < 0.02 ? 'Almost no energy.' : Math.round(p.nm) + ' nm · ' + bandWord(p.band) + (p.band === 'visible' ? ' · ' + colorWord(p.nm) : '');
      }
      function syncToggles() {
        keepBtn.setAttribute('aria-pressed', String(S.fire)); whiteBtn.setAttribute('aria-pressed', String(S.white));
        gapBtn.setAttribute('aria-pressed', String(S.showGaps));
        viewBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(['whole', 'top'][i] === S.view)));
      }
      syncE(); syncToggles();

      /* ---------------- geometry ---------------- */
      function geom() {
        const W = stage.w, H = stage.h, narrow = W < 560, f = BL.fs(13);
        const barY = f * 2.9 + 8, barH = Math.max(22, f * 1.7);
        const top = barY + barH + f * 2.6, bot = H - 14;
        const lx0 = 12 + f * (narrow ? 4.4 : 5.0), lx1 = W * (narrow ? 0.60 : 0.58);
        const ax = (lx1 + W) / 2 + (narrow ? 4 : 0), ay = (top + bot) / 2;
        const maxR = Math.min((W - lx1) / 2 - 10, (bot - top) / 2 - 4);
        return { W, H, narrow, f, barY, barH, top, bot, lx0, lx1, ax, ay, maxR, bx0: 14, bx1: W - 14 };
      }
      const yOfE = (g, E) => {
        const rz = A.RY * Z2();
        const lo = S.view === 'whole' ? -rz * 1.04 : -rz * 0.28, hi = S.view === 'whole' ? rz * 0.17 : rz * 0.03;
        return lerp(g.bot, g.top, (E - lo) / (hi - lo));
      };
      const ringR = (g, n) => { const r1 = g.maxR * 0.2; return r1 + (clamp(n, 1, 9) - 1) * (g.maxR - r1) / 7.6; };
      const eOfX = (g, x) => clamp((x - g.bx0) / (g.bx1 - g.bx0), 0, 1) * Emax();
      const xOfE = (g, E) => lerp(g.bx0, g.bx1, E / Emax());

      BL.drag(stage.canvas, {
        pick: (p) => { const g = geom(); return p.y > g.barY - 26 && p.y < g.barY + g.barH + 26 && p.x > g.bx0 - 14 && p.x < g.bx1 + 14 ? 'dial' : null; },
        move: (_h, p) => { const g = geom(); S.E = eOfX(g, p.x); S.hinted = true; syncE(); },
      });
      stage.canvas.addEventListener('keydown', (e) => {
        const step = 0.05 * Z2() * (e.shiftKey ? 10 : 1);
        if (e.key === 'ArrowRight') { S.E = clamp(S.E + step, 0, Emax()); syncE(); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { S.E = clamp(S.E - step, 0, Emax()); syncE(); e.preventDefault(); }
        else if (e.key === 'Enter' || e.key === ' ') { shoot(S.E); e.preventDefault(); }
      });

      /* ---------------- the physics of one photon ---------------- */
      function shoot(E, quiet) {
        const g = geom();
        S.nFired++;
        S.photons.push({ E, t: 0, kind: 'in', x0: xOfE(g, E), y0: g.barY + g.barH, white: !!quiet });
      }
      function record(list, E) {
        const key = Math.round((E / Z2()) * 40);
        const hit = list.find((r) => r.key === key);
        if (hit) hit.n++; else list.push({ key, E, n: 1 });
      }
      function moveTo(n) {
        S.anim = { from: S.dispE, to: A.levelE(n, S.Z), t: 0 }; S.n = n; S.free = false;
        S.wait = n > 1 ? 1.4 + Math.random() * 2.2 : 0;
      }
      function emit(E, fromN) {
        const g = geom(), ang = -0.4 + Math.random() * 0.8 + (Math.random() < 0.5 ? 0 : Math.PI) * 0;
        const a = Math.random() * Math.PI * 2;
        S.photons.push({ E, t: 0, kind: 'out', ang: a, ox: g.ax, oy: g.ay });
        record(S.emitted, E);
        const p = A.photon(E);
        S.tags.push({ t: 0, text: (p.band === 'visible' ? colorWord(p.nm) + ' · ' : p.band === 'ultraviolet' ? 'UV · ' : 'IR · ') + Math.round(p.nm) + ' nm', x: g.ax + Math.cos(a) * (g.maxR + 6), y: g.ay + Math.sin(a) * (g.maxR + 6) });
        S.fx.push({ t: 0, kind: 'ring', color: p.band === 'visible' ? 'photon' : 'fg', E });
        if (p.band === 'visible' && p.nm >= 620) goals.done('red');
        say.textContent = 'The atom gave off ' + (p.band === 'visible' ? colorWord(p.nm) + ' light' : p.band + ' light') + ', ' + Math.round(p.nm) + ' nanometres.';
      }
      function arrive(ph) {
        // the photon has reached the atom
        if (S.free) return false;
        const Z = S.Z, n = S.n, I = -A.levelE(n, Z), E = ph.E;
        if (E >= I - 0.02 * Z2()) {
          S.free = true; S.freeT = 0; S.freeKE = Math.max(0, E - I); S.wait = 0;
          record(S.absorbed, E); S.chain = 0;
          if (ph.white) { S.whiteSeen.add('i' + Math.round((E / Z2()) * 10)); if (S.whiteSeen.size >= 3) goals.done('white'); }
          S.fx.push({ t: 0, kind: 'ring', color: 'photon', E });
          goals.done('ion'); say.textContent = 'The photon knocked the electron off the atom.';
          return true;
        }
        let best = -1, bd = tol();
        for (let m = n + 1; m <= NMAX; m++) { const d = Math.abs(E - A.gapE(n, m, Z)); if (d <= bd) { bd = d; best = m; } }
        if (best < 0) return false;
        record(S.absorbed, E); S.chain = 0;
        if (n === 1) { S.firstTo.add(best); if (S.firstTo.size >= 2) goals.done('two'); }
        if (ph.white) { S.whiteSeen.add(best + ':' + n); if (S.whiteSeen.size >= 3) goals.done('white'); }
        moveTo(best);
        S.fx.push({ t: 0, kind: 'ring', color: 'photon', E });
        goals.done('jump'); say.textContent = 'The electron jumped up to rung ' + best + '.';
        return true;
      }
      function fall() {
        const n = S.n, m = 1 + Math.floor(Math.random() * (n - 1));
        const E = A.gapE(m, n, S.Z);
        moveTo(m);
        S.chain++;
        if (S.chain >= 2) goals.done('steps');
        emit(E, n);
      }

      /* ---------------- frame ---------------- */
      function frame(dt) {
        const g = geom(), pal = BL.pal;
        const calm = BL.reduced;
        // automatic light
        if (S.white) { S.whiteT += dt; while (S.whiteT > 0.11) { S.whiteT -= 0.11; shoot(0.3 + Math.random() * (Emax() - 0.3), true); } }
        else if (S.fire) { S.fireT += dt; if (S.fireT > 0.7) { S.fireT = 0; shoot(S.E); } }

        // level animation
        if (S.anim) { S.anim.t = Math.min(1, S.anim.t + dt / (calm ? 0.05 : 0.38)); const e = 1 - Math.pow(1 - S.anim.t, 3); S.dispE = lerp(S.anim.from, S.anim.to, e); if (S.anim.t >= 1) S.anim = null; }
        else if (!S.free) S.dispE = A.levelE(S.n, S.Z);
        // waiting to fall
        if (!S.free && S.n > 1 && !S.anim) { S.wait -= dt; if (S.wait <= 0) fall(); }
        // free electron: wander off, then come back and settle with a flash of light
        if (S.free) {
          S.freeT += dt;
          if (S.freeT > 2.6) {
            const n2 = 1 + Math.floor(Math.random() * 4);
            S.free = false; S.dispE = 0.0; S.anim = null;
            const E = S.freeKE + -A.levelE(n2, S.Z);
            moveTo(n2); S.chain = 0; emit(E, 0);
          }
        }
        S.theta += dt * 3.2 / Math.pow(Math.max(1, Math.sqrt(A.RY * Z2() / Math.max(0.01, -S.dispE))), 1.5);

        // photons in flight
        S.photons.forEach((p) => {
          p.t += dt;
          if (p.kind === 'in') {
            const T = 0.8;
            if (!p.done && p.t >= T) { p.done = true; p.took = arrive(p); }
          }
        });
        S.photons = S.photons.filter((p) => p.t < (p.kind === 'in' ? (p.took ? 0.8 : 1.7) : 1.3));
        S.fx.forEach((e) => { e.t += dt; }); S.fx = S.fx.filter((e) => e.t < 0.9);
        S.tags.forEach((e) => { e.t += dt; }); S.tags = S.tags.filter((e) => e.t < 1.8);

        // how close is the dial to something this atom would take?
        let dmin = 99;
        if (!S.free) {
          const I = -A.levelE(S.n, S.Z);
          dmin = Math.abs(S.E - I);
          for (let m = S.n + 1; m <= NMAX; m++) dmin = Math.min(dmin, Math.abs(S.E - A.gapE(S.n, m, S.Z)));
          if (S.E >= I) dmin = 0;
        }
        const warmT = Math.exp(-Math.pow(dmin / (0.9 * Z2()), 2));
        S.warm += (warmT - S.warm) * (1 - Math.exp(-dt * 6));

        draw(g, pal);
        drawRec();
      }

      /* ---------------- drawing ---------------- */
      const photonRGB = (E) => { const p = A.photon(Math.max(E, 0.01)); return 'rgb(' + p.rgb.join(',') + ')'; };

      function draw(g, pal) {
        const { W, H, f } = g;
        ctx.clearRect(0, 0, W, H);

        // --- the color bar: photon energy dial ---
        const bx0 = g.bx0, bx1 = g.bx1, bw = bx1 - bx0;
        ctx.font = BL.font(700, 14); ctx.fillStyle = pal.fg; ctx.textAlign = 'left';
        ctx.fillText('Photon energy', bx0, f * 1.6);
        ctx.font = BL.font(400, 13); ctx.fillStyle = pal.muted; ctx.textAlign = 'right';
        ctx.fillText('0', bx0 + 4, g.barY + g.barH + f * 1.3 + 2);
        ctx.fillText(fmtE(Emax()) + ' eV', bx1, g.barY + g.barH + f * 1.3 + 2);
        for (let x = 0; x < bw; x += 2) {
          const E = ((x + 1) / bw) * Emax(), p = A.photon(Math.max(E, 0.01));
          ctx.fillStyle = p.band === 'visible' ? 'rgb(' + p.rgb.join(',') + ')' : p.band === 'ultraviolet' ? BL.alpha('#8e55e0', 0.28 + 0.4 * (x / bw)) : BL.alpha('#a02020', 0.28 + 0.4 * (1 - x / bw));
          ctx.fillRect(bx0 + x, g.barY, 2, g.barH);
        }
        ctx.strokeStyle = pal.fg; ctx.lineWidth = 2; ctx.strokeRect(bx0, g.barY, bw, g.barH);
        const v0 = xOfE(g, 1.653), v1 = xOfE(g, 3.263);   // visible band edges (eV)
        if (v1 - v0 > 4) {
          ctx.strokeStyle = pal.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(v0, g.barY + g.barH); ctx.lineTo(v0, g.barY + g.barH + 7); ctx.moveTo(v1, g.barY + g.barH); ctx.lineTo(v1, g.barY + g.barH + 7); ctx.stroke();
          if (v1 - v0 > 40) { ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'center'; ctx.fillText('visible', (v0 + v1) / 2, g.barY + g.barH + f * 1.3 + 2); }
        } else { ctx.fillStyle = pal.muted; ctx.textAlign = 'left'; ctx.font = BL.font(400, 13); ctx.fillText('visible is just this sliver', Math.max(bx0 + 30, v0), g.barY - 5 - f * 0.1); }
        // handle
        const hx = xOfE(g, S.E);
        ctx.fillStyle = pal.panel; ctx.strokeStyle = pal.fg; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(hx, g.barY - 3); ctx.lineTo(hx - 11, g.barY - 17); ctx.lineTo(hx + 11, g.barY - 17); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hx, g.barY - 3); ctx.lineTo(hx, g.barY + g.barH + 3); ctx.stroke();
        if (!S.hinted && !BL.reduced) {
          const ph = (performance.now() / 1000) % 1;
          ctx.strokeStyle = BL.alpha(pal.ui, (1 - ph) * 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, g.barY - 10, 14 + ph * 14, 0, 7); ctx.stroke();
        }

        // --- the ladder ---
        const rz = A.RY * Z2();
        const y0 = yOfE(g, 0);
        // free-electron region
        if (y0 > g.top - 2) {
          ctx.save(); ctx.beginPath(); ctx.rect(g.lx0, g.top - 6, g.lx1 - g.lx0, Math.max(0, y0 - g.top + 6)); ctx.clip();
          ctx.strokeStyle = BL.alpha(pal.line2, 0.5); ctx.lineWidth = 2;
          for (let k = -400; k < 600; k += 14) { ctx.beginPath(); ctx.moveTo(g.lx0 + k, y0); ctx.lineTo(g.lx0 + k + 160, g.top - 6); ctx.stroke(); }
          ctx.restore();
        }
        ctx.strokeStyle = pal.fg; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.moveTo(g.lx0, y0); ctx.lineTo(g.lx1, y0); ctx.stroke(); ctx.setLineDash([]);
        BL.label(ctx, 'free electron', g.lx1 - 4, Math.max(g.top + f * 0.6, (y0 + g.top) / 2), { font: BL.font(700, 13), align: 'right', color: pal.fg, border: pal.line2 });
        ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'right'; ctx.fillText('0', g.lx0 - 6, y0 + 4);

        let lastLabelY = 1e9;
        const rungs = [];
        for (let n = 1; n <= NMAX; n++) {
          const E = A.levelE(n, S.Z), y = yOfE(g, E);
          if (y > g.bot + 2) continue;
          rungs.push({ n, y, E });
        }
        rungs.forEach((r) => {
          const here = !S.free && r.n === S.n;
          ctx.strokeStyle = here ? pal.electron : pal.fg; ctx.lineWidth = here ? 4 : 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(g.lx0, r.y); ctx.lineTo(g.lx1, r.y); ctx.stroke();
          if (lastLabelY - r.y >= f * 1.05 || lastLabelY === 1e9) {
            lastLabelY = r.y;
            ctx.fillStyle = pal.fg; ctx.font = BL.font(700, 14); ctx.textAlign = 'right';
            ctx.fillText(String(r.n), g.lx0 - 8, r.y + 5);
            ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'left';
            if (r.n <= 2 || S.view === 'top') ctx.fillText(fmtE(r.E) + ' eV', g.lx0 + 6, r.y - 6);
          }
        });
        ctx.lineCap = 'butt';
        const crowd = rungs.filter((r) => r.n >= 4).length;
        if (S.view === 'whole' && crowd) {
          const yc = rungs.find((r) => r.n === 4).y;
          BL.label(ctx, 'the rungs crowd together up here', (g.lx0 + g.lx1) / 2 + 30, yc + f * 2.1, { font: BL.font(400, 13), color: pal.muted });
        }
        ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'center';
        ctx.save(); ctx.translate(f * 1.0, (g.top + g.bot) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('energy →', 0, 0); ctx.restore();

        // jumps the learner could try
        if (S.showGaps && !S.free) {
          for (let m = S.n + 1; m <= Math.min(NMAX, S.n + 5); m++) {
            const x = g.lx0 + (g.lx1 - g.lx0) * (0.15 + 0.12 * (m - S.n)), ya = yOfE(g, A.levelE(S.n, S.Z)), yb = yOfE(g, A.levelE(m, S.Z));
            if (yb < g.top - 4 || ya > g.bot + 6) continue;
            const gap = A.gapE(S.n, m, S.Z);
            ctx.strokeStyle = BL.alpha(pal.ui, 0.95); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, Math.min(ya, g.bot)); ctx.lineTo(x, yb + 5); ctx.stroke();
            ctx.fillStyle = pal.ui; ctx.beginPath(); ctx.moveTo(x, yb); ctx.lineTo(x - 5, yb + 8); ctx.lineTo(x + 5, yb + 8); ctx.fill();
            BL.label(ctx, fmtE(gap), x + 6, (Math.min(ya, g.bot) + yb) / 2, { font: BL.font(700, 13), align: 'left', color: pal.ui, border: pal.ui, pad: 4 });
          }
        }

        // electron on the ladder
        const ey = S.free ? g.top - 2 - 10 : clamp(yOfE(g, S.dispE), g.top - 8, g.bot);
        const ex = g.lx0 + (g.lx1 - g.lx0) * 0.78 + Math.sin(performance.now() / 70) * (calmWobble());
        if (!S.free) electronBall(ex, ey, 9, 1);
        else { ctx.font = BL.font(400, 13); }
        const belowView = !S.free && yOfE(g, A.levelE(S.n, S.Z)) > g.bot + 2;
        if (belowView) BL.label(ctx, '↓ the electron is on rung ' + S.n, ex, g.bot - 8, { font: BL.font(700, 13) });

        // --- the atom ---
        const nC = S.free ? 9 : clamp(Math.sqrt(rz / Math.max(0.01, -S.dispE)), 1, 9);
        ctx.setLineDash([3, 6]);
        for (let n = 1; n <= NMAX; n++) {
          const r = ringR(g, n), here = !S.free && Math.abs(n - nC) < 0.5;
          ctx.strokeStyle = here ? BL.alpha(pal.electron, 0.9) : BL.alpha(pal.line2, 0.75); ctx.lineWidth = here ? 2.5 : 1.5;
          ctx.beginPath(); ctx.arc(g.ax, g.ay, r, 0, 7); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(g.ax, g.ay, 11 + S.Z * 1.5, 0, 7); ctx.fillStyle = pal.pos; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = pal.panel; ctx.stroke();
        ctx.fillStyle = pal.dark ? '#08151a' : '#ffffff'; ctx.font = BL.font(800, 13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('+' + S.Z, g.ax, g.ay + 1); ctx.textBaseline = 'alphabetic';
        if (S.free) {
          const k = Math.min(1, S.freeT / 2.4), r = g.maxR * (0.4 + 0.75 * k);
          const x = g.ax + r * 0.9, y = g.ay - r * 0.6;
          electronBall(x, y, 9, 1 - 0.7 * k);
          BL.label(ctx, 'free', x, y - 20, { font: BL.font(700, 13) });
        } else {
          const r = ringR(g, nC), x = g.ax + Math.cos(S.theta) * r, y = g.ay + Math.sin(S.theta) * r;
          electronBall(x + Math.sin(performance.now() / 55) * calmWobble() * 0.6, y, 9, 1);
        }
        ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'center';
        ctx.fillText('not to scale', g.ax, Math.min(H - 4, g.ay + g.maxR + f * 1.3));

        // --- photons ---
        S.photons.forEach((p) => {
          if (p.kind === 'in') {
            const sx = p.x0, sy = p.y0 + 4, T = p.t / 0.8;
            const dx = g.ax - sx, dy = g.ay - sy, len = Math.hypot(dx, dy) || 1;
            const k = p.took ? Math.min(T, 1) : T, px = sx + dx * k, py = sy + dy * k;
            const fade = p.took && T > 1 ? 0 : p.t > 1.5 ? 1 - (p.t - 1.5) / 0.2 : 1;
            wavePacket(px, py, dx / len, dy / len, p.E, fade, 0.5 + 0.5 * (p.white ? 0 : 1));
          } else {
            const T = p.t / 1.3, r = g.maxR * 0.25 + T * Math.max(g.W, g.H) * 0.5;
            const x = p.ox + Math.cos(p.ang) * r, y = p.oy + Math.sin(p.ang) * r;
            wavePacket(x, y, Math.cos(p.ang), Math.sin(p.ang), p.E, 1 - T * T, 1);
          }
        });
        S.fx.forEach((e) => {
          const k = e.t / 0.9;
          ctx.strokeStyle = e.color === 'photon' ? photonRGB(e.E) : pal.fg; ctx.globalAlpha = 1 - k; ctx.lineWidth = 4 * (1 - k) + 1;
          ctx.beginPath(); ctx.arc(g.ax, g.ay, 16 + k * g.maxR * 0.9, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
        });
        S.tags.forEach((t) => { ctx.globalAlpha = clamp(1.8 - t.t, 0, 1); BL.label(ctx, t.text, clamp(t.x, 50, W - 50), clamp(t.y, g.top + 8, g.bot), { font: BL.font(700, 14), border: pal.line2 }); ctx.globalAlpha = 1; });
      }
      const calmWobble = () => (BL.reduced ? 0 : S.warm * 3.2);

      function electronBall(x, y, r, a) {
        const pal = BL.pal;
        const gl = ctx.createRadialGradient(x, y, 1, x, y, r * (2.3 + 2.2 * S.warm));
        gl.addColorStop(0, BL.alpha(pal.electron, (0.55 + 0.4 * S.warm) * a)); gl.addColorStop(1, BL.alpha(pal.electron, 0));
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * (2.3 + 2.2 * S.warm), 0, 7); ctx.fill();
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = pal.panel; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = pal.electron; ctx.stroke(); ctx.globalAlpha = 1;
      }
      function wavePacket(x, y, ux, uy, E, alpha, bright) {
        const pal = BL.pal, col = photonRGB(E), len = 46, nx = -uy, ny = ux, wl = 7 + 28 / Math.max(0.6, Math.sqrt(E));
        ctx.save(); ctx.globalAlpha = clamp(alpha, 0, 1);
        const path = () => { ctx.beginPath(); for (let i = 0; i <= 28; i++) { const s = (i / 28 - 0.5) * len, amp = 8 * Math.sin(Math.PI * i / 28) * Math.sin((s / wl) * Math.PI * 2); const px = x + ux * s + nx * amp, py = y + uy * s + ny * amp; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } };
        path(); ctx.strokeStyle = pal.fg; ctx.lineWidth = 6.5; ctx.lineCap = 'round'; ctx.stroke();
        path(); ctx.strokeStyle = col; ctx.lineWidth = 3.6; ctx.stroke();
        ctx.restore();
      }

      /* ---------------- the record strips ---------------- */
      function drawRec() {
        const c = rec.ctx, W = rec.w, H = rec.h, pal = BL.pal;
        if (!W) return;
        c.clearRect(0, 0, W, H);
        const f = BL.fs(13);
        const l = 14, r = W - 14, titleH = f * 1.5, axisH = f * 1.7;
        const h2 = Math.max(18, (H - 2 * titleH - axisH - 14) / 2);
        const X = (E) => lerp(l, r, E / Emax());
        [{ title: 'Went in', dark: false }, { title: 'Came out', dark: true }].forEach((row, ri) => {
          const top = 4 + ri * (titleH + h2 + 6), y = top + titleH;
          c.font = BL.font(700, 13); c.fillStyle = pal.fg; c.textAlign = 'left'; c.fillText(row.title, l, top + f * 1.05);
          if (row.dark) { c.fillStyle = '#0a1318'; c.fillRect(l, y, r - l, h2); }
          else for (let x = 0; x < r - l; x += 2) {
            const E = ((x + 1) / (r - l)) * Emax(), p = A.photon(Math.max(E, 0.01));
            c.fillStyle = p.band === 'visible' ? 'rgb(' + p.rgb.join(',') + ')' : p.band === 'ultraviolet' ? BL.alpha('#8e55e0', 0.28 + 0.4 * (x / (r - l))) : BL.alpha('#a02020', 0.28 + 0.4 * (1 - x / (r - l)));
            c.fillRect(l + x, y, 2, h2);
          }
          (ri === 0 ? S.absorbed : S.emitted).forEach((q) => {
            const x = X(q.E);
            if (ri === 0) { c.fillStyle = '#05090b'; c.fillRect(x - 2, y, 4, h2); }
            else { c.fillStyle = photonRGB(q.E); c.globalAlpha = clamp(0.6 + q.n * 0.1, 0.6, 1); c.fillRect(x - 2.5, y, 5, h2); c.globalAlpha = 1; }
          });
          c.strokeStyle = pal.fg; c.lineWidth = 2; c.strokeRect(l, y, r - l, h2);
        });
        c.fillStyle = pal.muted; c.font = BL.font(400, 13); c.textAlign = 'left'; c.fillText('0 eV', l, H - 4);
        c.textAlign = 'right'; c.fillText(fmtE(Emax()) + ' eV', r, H - 4);
        // the dial position
        c.strokeStyle = pal.electron; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(X(S.E), 4); c.lineTo(X(S.E), H - axisH); c.stroke(); c.setLineDash([]);
      }

      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); rec.destroy(); } };
    },
  });
})();
