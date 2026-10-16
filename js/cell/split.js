/* Pull Apart: the division job, which is only two terms and one ordering rule.

   The chapter gives the centrosome two sentences: it is a pair of centrioles, cylinders attached at a
   right angle, and it copies itself before a cell divides, after which the centrioles and the cytoskeleton
   help pull the dividing cell apart. It says the full role is a later chapter's. So this keeps to that:
   what the thing looks like, that it copies first, and that something is pulling.

   The shape is the part worth turning over, so it is a solid: a pair of cylinders, each a ring of nine
   bundles of tubes, one standing against the side of the other at ninety degrees. Look closer and turn it.

   The ordering rule is the part worth being surprised by. Pull the cell apart with only one centrosome and
   every chromosome is dragged to the one end; one new cell would have everything and the other nothing.
   Copy it first and there is a pole at each end, and the chromosomes are shared out evenly. Cut the fibres
   and the poles have nothing to pull with.

   It is a picture of that order of events, not of mitosis: chromosomes are four fixed pairs, the spindle
   is lines, the pinch is a shape, and none of the stages of division are shown or named (Chapter 9). */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const K = BL.cell;

  const STEPS = [
    { id: 'look', text: 'Look closer at the centrosome and turn it over.',
      how: 'Press “Look closer”, then drag to turn it until you can see how the two cylinders sit.',
      ask: 'how are the two centrioles in a centrosome arranged?',
      opts: ['Side by side, parallel', 'At a right angle', 'End to end in a line'], right: 1 },
    { id: 'nocopy', text: 'Try to pull the cell apart with the one centrosome it has.',
      how: 'Slide “Pull the cell apart” all the way across before you copy anything.',
      ask: 'with only one centrosome, what happens to the chromosomes?',
      opts: ['They all go one way', 'Half go each way anyway'], right: 0 },
    { id: 'copy', text: 'Press “Copy the centrosome” and watch it.',
      how: 'Start the cell over first, then press the button.',
      ask: 'when does a centrosome copy itself?',
      opts: ['Before the cell divides', 'After the cell has split'], right: 0 },
    { id: 'pull', text: 'Now pull the cell apart, with a pole at each end.',
      how: 'Slide “Pull the cell apart” to the end, or drag a centrosome.',
      ask: 'with a centrosome at each end, how are the chromosomes shared?',
      opts: ['Evenly: one set to each end', 'However they happen to fall'], right: 0 },
    { id: 'fibres', text: 'Cut the fibres, then try to pull.',
      how: 'Press “Cut the fibres”, and pull the cell apart with both centrosomes in place.',
      ask: 'what do the centrosomes pull the chromosomes with?',
      opts: ['Fibres of the cytoskeleton', 'Nothing — they just drift apart'], right: 0 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<ellipse cx="100" cy="62" rx="64" ry="42" fill="none" stroke="var(--fn-struct)" stroke-width="5"/>' +
    '<rect x="42" y="54" width="22" height="8" rx="3" fill="var(--fn-divide)"/><rect x="50" y="36" width="8" height="22" rx="3" fill="var(--fn-divide)"/>' +
    '<rect x="134" y="62" width="22" height="8" rx="3" fill="var(--fn-divide)"/><rect x="142" y="62" width="8" height="22" rx="3" fill="var(--fn-divide)"/>' +
    '<path d="M64 58 L98 62 M64 58 L98 52 M148 66 L110 62 M148 66 L110 72" stroke="var(--fn-struct)" stroke-width="2.5"/>' +
    '<path d="M94 54 l10 16 M104 54 l-10 16" stroke="var(--fn-genetic)" stroke-width="4" stroke-linecap="round"/></svg>';

  BL.register({
    id: 'split', field: 'jobs', order: 5, name: 'Pull Apart',
    tagline: 'Copy first. Then pull.',
    lede: 'A centrosome is two cylinders standing at a right angle, and it copies itself before a cell divides. Turn it over, then try to pull a cell in two — with one centrosome, and with two.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = { copied: false, grow: 0, pull: 0, fibres: true, close: 0, wantClose: false, hinted: false, t: 0, drag: null, seen: { nocopy: false } };
      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A three-dimensional cell with its chromosomes in the middle and a centrosome, which is two small cylinders at a right angle. You can turn it by dragging, look closer at the centrosome, copy it, and pull the cell in two, either with the pole you have or with the ones you made. Controls are in the side panel.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const V = BL.view3d(stage.canvas, {
        yaw: 0.5, pitch: 0.25, auto: 0,
        pick: (p) => { const c = S.hit && S.hit(p); return c ? { c } : null; },
        drag: (a, p) => { const y = pitchY(p); if (y != null) { S.pull = clamp((Math.abs(y) - 0.15) / 0.7, 0, 1); S.hinted = true; pullIn.value = String(Math.round(S.pull * 100)); } },
        end: () => { },
        onturn: () => { S.hinted = true; },
      });
      const pitchY = (p) => { const q = V.unproject(p.x, p.y, 0); return q.y; };

      /* ---------------- dock ---------------- */
      const copyBtn = h('button', { type: 'button', class: 'action', onclick: () => { if (!S.copied && S.pull < 0.05) { S.copied = true; S.grow = 0; steps.done('copy'); S.hinted = true; say('It copied itself: each cylinder grew a new one at a right angle, and the pair came apart into two centrosomes.'); } else if (S.copied) say('It has already copied. Start the cell over to see it again.'); else say('Copy it before the cell starts to divide. Put the pull back to the start first.'); } }, 'Copy the centrosome');
      const closeBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.wantClose = !S.wantClose; closeBtn.setAttribute('aria-pressed', String(S.wantClose)); closeBtn.textContent = S.wantClose ? 'Back out' : 'Look closer'; S.hinted = true; if (S.wantClose) { V.userTurned = true; V.turned = 0; } } }, 'Look closer');
      const fibreBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.fibres = !S.fibres; fibreBtn.setAttribute('aria-pressed', String(!S.fibres)); fibreBtn.textContent = S.fibres ? 'Cut the fibres' : 'Put the fibres back'; } }, 'Cut the fibres');
      const pOut = h('output', { class: 'val' }, 'not started'), pullIn = h('input', { type: 'range', min: '0', max: '100', step: '1', value: '0', 'aria-label': 'Pull the cell apart' });
      pullIn.addEventListener('input', () => { S.pull = parseFloat(pullIn.value) / 100; S.hinted = true; });
      dock.appendChild(h('section', {}, h('h2', {}, 'The centrosome'), h('div', { class: 'actions' }, copyBtn), h('div', { class: 'chips' }, closeBtn)));
      dock.appendChild(h('section', {}, h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'Pull the cell apart'), pOut), h('div', { class: 'range-wrap' }, pullIn, h('div', { class: 'range-ends' }, h('span', {}, 'one cell'), h('span', {}, 'two cells')))),
        h('div', { class: 'chips' }, fibreBtn),
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action ghost', onclick: () => { S.copied = false; S.pull = 0; pullIn.value = '0'; S.fibres = true; fibreBtn.setAttribute('aria-pressed', 'false'); fibreBtn.textContent = 'Cut the fibres'; S.seen.nocopy = false; say('Back to one centrosome, with the cell whole.'); } }, 'Start the cell over'))));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'split', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' }, 'One cell, one centrosome. Turn it over, or try something.');
      const poleM = BL.meter('Centrosomes'), shareM = BL.meter('Chromosomes at the near end');
      aux.appendChild(h('section', { class: 'panel' }, statusP, h('div', { class: 'meters' }, poleM.el, shareM.el),
        h('div', { class: 'legend' }, h('span', { class: 'fn-chip', style: '--c: var(--fn-divide)' }, 'cellular division'), h('span', { class: 'fn-chip', style: '--c: var(--fn-genetic)' }, 'the DNA, in chromosomes'))));
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'What this is'), h('p', {}, K.struct('centrosome').job),
        h('p', { class: 'hint' }, 'The full story of how a cell divides — mitosis — is Chapter 9. This is only the part this chapter needs: the shape, and the fact that it copies first.')));
      function say(t) { statusP.textContent = t; }

      /* ---------------- the cell ---------------- */
      const v = (x, y, z) => ({ x, y, z });
      const CH = [0, 1, 2, 3].map((i) => { const a = i * 1.57 + 0.4; return { x: Math.cos(a) * 0.3, z: Math.sin(a) * 0.3, y: (i % 2 ? 0.08 : -0.08), rot: i * 0.7 }; });
      /* a cylinder: a body between two flat ends, with nine bundles of tubes round the rim of the near end */
      const cyl = (a0, a1, R, col, al) => {
        const A = V.project(a0), B = V.project(a1), r = R * V.scale * (A.s + B.s) / 2;
        const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L * r, ny = dx / L * r;
        ctx.save(); ctx.globalAlpha = al;
        const g = ctx.createLinearGradient(A.x + nx, A.y + ny, A.x - nx, A.y - ny); g.addColorStop(0, BL.mixHex(col, '#ffffff', 0.35)); g.addColorStop(1, BL.mixHex(col, '#000000', 0.25));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(A.x + nx, A.y + ny); ctx.lineTo(B.x + nx, B.y + ny); ctx.lineTo(B.x - nx, B.y - ny); ctx.lineTo(A.x - nx, A.y - ny); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = BL.alpha(BL.pal.fg, 0.55); ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
      };
      const centrioles = (c, o) => {       // one centrosome: two cylinders, one standing against the other's side
        const col = BL.pal.fn.divide, sc = o.scale || 1, L = 0.2 * sc, R = 0.05 * sc;
        const parts = [[v(c.x, c.y, c.z), v(1, 0, 0)], [v(c.x - L * 0.55, c.y + L * 0.55 + R, c.z), v(0, 1, 0)]];
        parts.forEach(([p, ax]) => {
          const f = K.frame(ax), a0 = v(p.x - ax.x * L / 2, p.y - ax.y * L / 2, p.z - ax.z * L / 2), a1 = v(p.x + ax.x * L / 2, p.y + ax.y * L / 2, p.z + ax.z * L / 2);
          const q = V.project(p);
          V.add(q.z, () => {
            cyl(a0, a1, R, col, o.alpha);
            // the near end: a ring of nine bundles, which is what a centriole is made of
            const near = V.project(a1).z > V.project(a0).z ? a1 : a0;
            K.ring(ctx, V, near, f.u, f.w, R, BL.mixHex(col, '#000000', 0.35), 2.2, o.alpha);
            for (let k = 0; k < 9; k++) { const th = k / 9 * 6.2832, pt = v(near.x + (f.u.x * Math.cos(th) + f.w.x * Math.sin(th)) * R * 0.8, near.y + (f.u.y * Math.cos(th) + f.w.y * Math.sin(th)) * R * 0.8, near.z + (f.u.z * Math.cos(th) + f.w.z * Math.sin(th)) * R * 0.8), pq = V.project(pt); ctx.save(); ctx.globalAlpha = o.alpha; ctx.fillStyle = BL.mixHex(col, '#000000', 0.45); ctx.beginPath(); ctx.arc(pq.x, pq.y, Math.max(1.2, R * V.scale * pq.s * 0.16), 0, 6.2832); ctx.fill(); ctx.restore(); }
          });
        });
      };

      /* ---------------- frame ---------------- */
      const poles = () => {
        const p = S.pull, y = 0.15 + 0.7 * p;
        return S.copied ? [v(0, y, 0), v(0, -y, 0)] : [v(0, y, 0)];
      };
      function frame(dt) {
        const cw = stage.w, chh = stage.h, pal = BL.pal; if (!cw) return;
        S.t += dt; if (S.copied && S.grow < 1) S.grow = Math.min(1, S.grow + dt * 0.6);
        S.close += ((S.wantClose ? 1 : 0) - S.close) * (1 - Math.exp(-dt * 4));
        V.step(dt);
        const c0 = poles()[0];
        const mid = { x: c0.x * S.close, y: c0.y * S.close * 0.6, z: 0 }, rad = 1.25 + (0.6 - 1.25) * S.close;
        V.frame(cw, chh, rad, mid);
        ctx.clearRect(0, 0, cw, chh);
        const p = S.pull, dd = 0.62 * p, rr = 1 - 0.22 * p;
        // the cell: one ball that stretches into two
        V.add(-800, () => { [dd, -dd].forEach((y) => { const q = V.project(v(0, y, 0)), r = rr * V.scale * q.s; ctx.save(); ctx.globalAlpha = 1 - 0.55 * S.close; const g = ctx.createRadialGradient(q.x - r * 0.25, q.y - r * 0.3, r * 0.1, q.x, q.y, r); g.addColorStop(0, BL.alpha(BL.mixHex(pal.panel, pal.fn.struct, 0.04), 0.4)); g.addColorStop(1, BL.alpha(BL.mixHex(pal.panel, pal.fn.struct, 0.3), 0.4)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.2832); ctx.fill(); ctx.lineWidth = 3.2; ctx.strokeStyle = pal.fn.struct; ctx.stroke(); ctx.restore(); }); });
        // chromosomes: each an X of two chromatids that part when the cell is pulled
        const P = poles(), sep = clamp((p - 0.4) / 0.5, 0, 1), pulled = S.fibres ? sep : 0;
        let near = 0, far = 0;
        CH.forEach((c, i) => {
          [1, -1].forEach((side) => {
            const goUp = S.copied ? side > 0 : true;         // with one pole, both chromatids go the one way
            const ty = (goUp ? 1 : -1) * (0.15 + 0.7 * p) * 0.82, cy = c.y + (ty - c.y) * pulled;
            const base = v(c.x * (1 - 0.35 * pulled) , cy, c.z * (1 - 0.35 * pulled)), ax = v(Math.cos(c.rot + 0.45 * side), 0, Math.sin(c.rot + 0.45 * side));
            const a = v(base.x - ax.x * 0.11, base.y + 0.03 * side * (1 - pulled), base.z - ax.z * 0.11), b = v(base.x + ax.x * 0.11, base.y - 0.03 * side * (1 - pulled), base.z + ax.z * 0.11);
            const qa = V.project(a), qb = V.project(b);
            V.add((qa.z + qb.z) / 2, () => K.fibre(ctx, V, a, b, Math.max(5, 0.055 * V.scale * qa.s), pal.fn.genetic, 1 - 0.8 * S.close));
            if (pulled > 0.5 || p > 0.9) { if (cy > 0.05) near++; else far++; }
            // spindle fibres from the poles to the chromatids
            if (S.fibres && p > 0.02) P.forEach((pole) => { if ((pole.y > 0) === (goUp || !S.copied) || !S.copied) { const q = V.project(pole); V.add(Math.min(q.z, qa.z) - 0.01, () => K.fibre(ctx, V, pole, base, 1.2, pal.fn.struct, 0.5 * (1 - 0.8 * S.close))); } });
          });
        });
        // the centrosomes
        P.forEach((pole, i) => { const grow = i === 1 ? S.grow : 1; centrioles(pole, { alpha: grow, scale: 1.5 + 0.3 * S.close }); });
        S.hit = (pt) => { for (const pole of P) { const q = V.project(pole); if (Math.hypot(pt.x - q.x, pt.y - q.y) < 22) return pole; } return null; };
        V.flush();
        // labels
        P.forEach((pole) => { const q = V.project(pole); BL.label(ctx, 'centrosome', q.x + 54, q.y - 8, { font: BL.font(700, 12), border: pal.fn.divide }); });
        if (S.close > 0.6) { const q = V.project(c0); BL.label(ctx, 'two centrioles, at a right angle', q.x, q.y + 70, { font: BL.font(700, 13), border: pal.fn.divide }); }
        V.cue(ctx, pal);
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'drag a centrosome, or the slider, to pull', cw / 2, chh - 16, { font: BL.font(700, 14), border: pal.ui });

        // goals and words
        if (S.wantClose && V.turned > 1.0) steps.done('look');
        if (!S.copied && S.pull > 0.9) { steps.done('nocopy'); S.seen.nocopy = true; }
        if (S.copied && S.pull > 0.95 && S.fibres) steps.done('pull');
        if (S.copied && !S.fibres && S.pull > 0.9) steps.done('fibres');
        pOut.textContent = S.pull < 0.05 ? 'not started' : S.pull < 0.6 ? 'stretching' : S.pull < 0.95 ? 'pinching' : 'two cells';
        poleM.set(S.copied ? 1 : 0.5, S.copied ? 'two' : 'one'); poleM.tone(pal.fn.divide);
        const tot = near + far; shareM.set(tot ? near / tot : 0.5, !tot ? 'not pulled yet' : far === 0 ? 'all of them' : near === far ? 'half of them' : near + ' of ' + tot); shareM.tone(pal.fn.genetic);
        const words = !S.fibres && S.pull > 0.5 ? 'The fibres are cut. The poles are in place but have nothing to pull with, so the chromosomes stay where they are.' : S.pull > 0.9 ? (S.copied ? 'A centrosome at each end, and the chromosomes shared out evenly: one set to each new cell.' : 'Only one centrosome, so every chromosome was pulled the one way. One new cell would get the lot and the other nothing.') : S.copied ? 'Two centrosomes now. Pull the cell apart and see how the chromosomes are shared.' : null;
        if (words && words !== S.lastSay) { S.lastSay = words; say(words); }
      }
      if (window.__BL_TEST) window.__BL_TEST.split = S;
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
