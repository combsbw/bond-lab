/* The Template: the one reaction, run four ways.

   This is the spine of the whole lab. Chapter 3 looks like four separate
   chemistries with four sets of names, and it is not. It is one reaction:
   take a hydrogen off one unit, take a hydroxyl off the next, let those two
   leave together as a molecule of water, and whatever is left holding the two
   units together is the bond. Run it the other way — push a water back in —
   and the bond is gone.

   So there is one slider. Left: two units, apart. Right: joined, with the
   water that came out of them floating above. Nothing else on the screen
   changes when you switch families except the shapes of the parts and the
   name somebody decided to give the bond.

   The hill in the energy picture is deliberate and is the hand-off to Hurry
   Up: this reaction does not happen just because it would be nice if it did. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;
  const U = O.UNITS;
  const TAU = Math.PI * 2;

  const FAM = [
    { id: 'amino', tab: 'Amino acids', left: 'amino', right: 'amino',
      bond: 'a peptide bond', poly: 'a polypeptide — a protein',
      gives: ['the carboxyl’s —OH', 'the amino group’s —H'],
      note: 'Twenty different amino acids, all with the same two handles in the same two places. That is why any one of them will join to any other, and why a protein can be any sequence at all.' },
    { id: 'sugar', tab: 'Sugars', left: 'sugar', right: 'sugar',
      bond: 'a glycosidic bond', poly: 'a polysaccharide — a starch, or a cellulose',
      gives: ['one ring’s —OH', 'the other ring’s —H'],
      note: 'Two glucose rings joined this way are maltose. Glucose and fructose joined this way are table sugar. The reaction is the same either way.' },
    { id: 'fatty', tab: 'Fats', left: 'glycerol', right: 'fatty',
      bond: 'an ester bond', poly: 'a triglyceride, or a phospholipid',
      gives: ['the fatty acid’s —OH', 'the glycerol’s —H'],
      note: 'Three fatty acids onto one glycerol makes a fat. Two fatty acids and a phosphate instead makes the molecule your cell membrane is built from.' },
    { id: 'nucl', tab: 'Nucleotides', left: 'nucl', right: 'nucl',
      bond: 'a phosphodiester bond', poly: 'a nucleic acid — DNA, or RNA',
      gives: ['the phosphate’s —OH', 'the sugar’s —H'],
      note: 'Phosphate to sugar, phosphate to sugar, all the way down. The bases hang off the side and never take part — which is exactly why they are free to carry a message.' },
  ];

  const STEPS = [
    { id: 'fwd', text: 'Run the slider all the way to the right and watch where the water comes from.',
      how: 'Go slowly. Keep your eye on the two small atoms between the units, not on the units.',
      ask: 'the water that leaves — where do its atoms come from?',
      opts: ['One from each unit', 'Both from the left unit', 'From the water around them'], right: 0 },
    { id: 'back', text: 'Run it back to the left.',
      how: 'Drag the slider the other way and watch the bond.',
      ask: 'to take this bond apart, do you have to put something in or take something out?',
      opts: ['Put a water in', 'Take a water out', 'Neither — it just lets go'], right: 0 },
    { id: 'sugar', text: 'Switch to sugars and run it again.',
      how: 'Press “Sugars” and drag the slider across.',
      ask: 'is this a different reaction from the one you just did?',
      opts: ['Yes, completely different', 'No — same reaction, different parts'], right: 1 },
    { id: 'all', text: 'Run all four families.',
      how: 'Press each tab in turn and take the slider across each time.',
      ask: 'how many different reactions have you run by the end?',
      opts: ['Four', 'Two', 'One'], right: 2 },
    { id: 'hill', text: 'Stop the slider half way and read the energy picture.',
      how: 'Leave it in the middle. Look at where the ball is sitting on the curve.',
      ask: 'half way between apart and joined, is the molecule at a higher or a lower energy than at either end?',
      opts: ['Higher — there is a hill in the way', 'Lower — it is downhill both ways'], right: 0 },
    { id: 'same', text: 'Compare the water that comes out of two different families.',
      how: 'Make a peptide bond, note the water, then make a phosphodiester bond and note that one.',
      ask: 'is the water that leaves a peptide bond the same stuff as the water that leaves a phosphodiester bond?',
      opts: ['Yes — water is water', 'No — each family makes its own kind'], right: 0 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<rect x="28" y="62" width="48" height="40" rx="10" fill="var(--t-dipole)" opacity=".35" stroke="var(--t-dipole)" stroke-width="3"/>' +
    '<rect x="124" y="62" width="48" height="40" rx="10" fill="var(--t-dipole)" opacity=".35" stroke="var(--t-dipole)" stroke-width="3"/>' +
    '<path d="M76 82 H124" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
    '<circle cx="100" cy="30" r="15" fill="var(--neg)"/>' +
    '<circle cx="84" cy="20" r="7" fill="var(--pos)"/><circle cx="116" cy="20" r="7" fill="var(--pos)"/></svg>';

  BL.register({
    id: 'template', field: 'build', order: 0, name: 'The Template',
    tagline: 'One reaction. It builds all four families and it takes them all apart.',
    lede: 'Two building blocks with their handles facing each other. Drag the slider to the right and a water molecule is squeezed out from between them, leaving a bond. Drag it back and the water goes in and the bond is gone. Then switch families and do exactly the same thing again.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = { fam: 0, r: 0, done: new Set(), hint: true, waters: new Set(), lastDir: 0 };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'Two building blocks side by side. A slider moves them together: a hydrogen from one and a hydroxyl from the other leave as a water molecule and a bond forms between the blocks. Moving the slider back pushes the water in and the bond comes apart.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const fam = () => FAM[S.fam];

      /* ---------------- dock ---------------- */
      const famBtns = FAM.map((f, i) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(S.fam === i),
        onclick: () => { S.fam = i; famBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i))); say(); check(); },
      }, f.tab));
      dock.appendChild(h('section', {},
        h('h2', {}, 'Which building blocks'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Which family of building blocks' }, famBtns),
        h('p', { class: 'hint' }, 'Four tabs. The reaction underneath them does not change.')));

      const rOut = h('output', { class: 'val' });
      const rIn = h('input', { type: 'range', min: '0', max: '100', step: '1', value: '0', 'aria-label': 'Build the bond, or break it' });
      rIn.addEventListener('input', () => {
        const v = parseFloat(rIn.value) / 100;
        S.lastDir = Math.sign(v - S.r);
        S.r = v; S.hint = false;
        say(); check();
      });
      dock.appendChild(h('section', {},
        h('div', { class: 'ctl' },
          h('div', { class: 'row' }, h('h2', {}, 'Build it, or break it'), rOut),
          h('div', { class: 'range-wrap' }, rIn,
            h('div', { class: 'range-ends' }, h('span', {}, 'two blocks, apart'), h('span', {}, 'joined, water out')))),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action', onclick: () => run(1) }, 'Build it'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => run(0) }, 'Break it apart'))));

      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'template', STEPS);
      dock.appendChild(stepHost);

      let anim = null;
      function run(to) {
        anim = { to, from: S.r };
        S.hint = false;
      }

      function check() {
        const f = fam();
        if (S.r > 0.93) { S.done.add(f.id); steps.done('fwd'); }
        if (S.r < 0.07 && S.done.has(f.id)) steps.done('back');
        if (S.r > 0.93 && f.id === 'sugar') steps.done('sugar');
        if (S.done.size >= 4) steps.done('all');
        if (S.r > 0.35 && S.r < 0.65) steps.done('hill');
        if (S.done.has('amino') && S.done.has('nucl')) steps.done('same');
      }

      /* ---------------- aux ---------------- */
      const readout = h('div', { class: 'readout' });
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const ledger = h('div', { class: 'facts' });
      aux.appendChild(h('section', { class: 'panel' }, readout, statusP, ledger));

      const curve = BL.stage(h('div'), '3 / 1', { label: 'The energy along the reaction. There is a hill between the two ends, and a ball shows where the slider has got to.' });
      curve.wrap.classList.add('flat');
      const curveSay = h('p', { class: 'hint' });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'The energy on the way across'), curve.wrap, curveSay));

      const famNote = h('p', {});
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'This family in particular'), famNote,
        h('p', { class: 'hint' }, 'Building is anabolic: it costs energy and it lets a water go. Breaking is catabolic: it takes a water in and gives energy back. Your body is doing both of these, in both directions, in every cell, right now.')));

      function say() {
        const f = fam(), r = S.r;
        rOut.textContent = r < 0.04 ? 'apart' : r > 0.96 ? 'joined' : Math.round(r * 100) + '%';
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, r > 0.9 ? f.bond.replace(/^an? /, '') : r < 0.1 ? 'two blocks' : 'half way'),
          h('span', { class: 'zone' }, r > 0.9 ? 'made' : r < 0.1 ? 'not joined' : 'on the way'),
          h('span', { class: 'dim' }, 'builds ' + f.poly));
        statusP.textContent = r > 0.9
          ? 'Joined by ' + f.bond + ', and one water molecule came out. Drag back to the left and you can put it in again.'
          : r < 0.1
            ? 'Two blocks, each carrying the handle it is about to lose: ' + f.gives[0] + ' on the left, ' + f.gives[1] + ' on the right.'
            : 'The hydrogen and the hydroxyl are on their way out. Until they leave together, there is no bond.';

        ledger.textContent = '';
        const dir = S.lastDir >= 0 ? 'build' : 'break';
        ledger.append(
          h('p', { class: 'fact' }, h('b', {}, 'Which way you are going. '),
            dir === 'build' ? 'Building — anabolic. Dehydration: a water comes out.' : 'Breaking — catabolic. Hydrolysis: a water goes in.'),
          h('p', { class: 'fact' }, h('b', {}, 'Energy. '),
            dir === 'build' ? 'Costs energy. Something has to pay for it, and in you that something is ATP.' : 'Gives energy back. This is how a meal becomes something you can use.'),
          h('p', { class: 'fact' }, h('b', {}, 'Waters made so far. '), (r > 0.9 ? 1 : 0) + ' — one bond, one water, every time, in every family.'),
          h('p', { class: 'fact' }, h('b', {}, 'Families you have run. '), S.done.size + ' of 4.'));
        famNote.textContent = f.note;
        curveSay.textContent = 'The two ends are the stable places. In between there is a hill, and nothing gets over a hill for free. Left on its own this reaction happens so rarely you would never see it. The instrument two along is about what living things do to that hill.';
      }

      /* ---------------- drawing ---------------- */
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        if (anim) {
          const sp = (BL.reduced ? 2.4 : 1.1) * dt;
          S.lastDir = Math.sign(anim.to - S.r);
          S.r += Math.sign(anim.to - S.r) * sp;
          if ((anim.to === 1 && S.r >= 1) || (anim.to === 0 && S.r <= 0)) { S.r = anim.to; anim = null; }
          S.r = clamp(S.r, 0, 1);
          rIn.value = String(Math.round(S.r * 100));
          say(); check();
        }
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        const f = fam(), r = S.r;
        const ease = r * r * (3 - 2 * r);
        const s = clamp(Math.min(cw / 8.5, ch / 5.2), 34, 92);
        const cy = ch * 0.56, cx = cw / 2;
        const far = s * 2.1, near = s * 1.25;
        const d = far - (far - near) * ease;

        const L = U[f.left], R = U[f.right];
        const lp = L.draw(ctx, cx - d, cy, s, { base: 'A' });
        const rp = R.draw(ctx, cx + d, cy, s, { base: 'T' });

        // the two leaving atoms, and the water they become. They sit just
        // outside the bodies so it is obvious they are on their way off.
        const ox = lp.right[0] + s * 0.2, oy = lp.right[1] - s * 0.12;
        const hx = rp.left[0] - s * 0.18, hy = rp.left[1] - s * 0.12;
        const mx = (ox + hx) / 2, my = (oy + hy) / 2;
        if (r < 0.62) {
          const t = r / 0.62;
          const rise = s * 0.55 * t;
          const oX = ox + (mx - ox) * t, oY = oy - rise;
          const hX = hx + (mx - hx) * t, hY = hy - rise;
          O.bond(ctx, lp.right[0], lp.right[1], oX, oY, { width: s * 0.09, alpha: 0.32 * (1 - t) });
          O.bond(ctx, rp.left[0], rp.left[1], hX, hY, { width: s * 0.09, alpha: 0.32 * (1 - t) });
          O.atom(ctx, oX, oY, s * 0.2, 'O');
          O.atom(ctx, oX + s * 0.24, oY - s * 0.14, s * 0.13, 'H', { label: false });
          O.atom(ctx, hX, hY, s * 0.15, 'H');
          if (r < 0.2) {
            BL.label(ctx, f.gives[0], cx - d, cy - s * 1.95, { font: BL.font(600, 13), border: pal.neg });
            BL.label(ctx, f.gives[1], cx + d, cy - s * 1.95, { font: BL.font(600, 13), border: pal.pos });
          }
        } else {
          // a water molecule, lifting away and then holding station
          const t = (r - 0.62) / 0.38;
          const wy = my - s * (0.75 + 0.85 * t);
          BL.mol.water(ctx, mx, wy, -Math.PI / 2, s * 0.6, pal, { label: s > 50, lone: 0.5 });
          BL.label(ctx, 'one water, out', mx, wy - s * 0.72, { font: BL.font(700, 13), border: pal.neg });
        }

        // the bond itself, and only once the water has actually gone
        if (r > 0.62) {
          const t = clamp((r - 0.62) / 0.28, 0, 1);
          O.bond(ctx, lp.right[0], lp.right[1], rp.left[0], rp.left[1], { width: s * 0.18, color: BL.alpha(pal.ui, t) });
          if (t > 0.5) BL.label(ctx, f.bond, (lp.right[0] + rp.left[0]) / 2, cy + s * 1.45, { font: BL.font(800, 15), border: pal.ui });
        }

        BL.label(ctx, L.name, cx - d, cy + s * (f.left === 'glycerol' ? 1.1 : 0.95), { font: BL.font(600, 13) });
        BL.label(ctx, R.name, cx + d, cy + s * 0.95, { font: BL.font(600, 13) });

        if (S.hint && !BL.reduced) {
          BL.label(ctx, 'drag the slider and watch the water leave →', cw / 2, 22, { font: BL.font(700, 14), border: pal.ui });
        }
        drawCurve();
      }

      /* The reaction coordinate. Both ends sit low, there is a hill in the
         middle, and a ball shows where the slider has got to. Hurry Up draws
         the same curve with the hill pushed down. */
      function drawCurve() {
        const c = curve.ctx, cw = curve.w, ch = curve.h, pal = BL.pal;
        if (!cw) return;
        c.clearRect(0, 0, cw, ch);
        const m = { l: 18, r: 18, t: 18, b: 30 };
        const X = (u) => m.l + u * (cw - m.l - m.r);
        const prof = (u) => 0.22 + 0.62 * Math.exp(-((u - 0.5) ** 2) / 0.022) + 0.16 * u;  // apart is lower than joined
        const Y = (v) => ch - m.b - v * (ch - m.b - m.t);
        c.strokeStyle = pal.line; c.lineWidth = 1;
        c.beginPath(); c.moveTo(m.l, Y(0)); c.lineTo(cw - m.r, Y(0)); c.stroke();
        c.strokeStyle = pal.ui; c.lineWidth = 3.5;
        c.beginPath();
        for (let i = 0; i <= 80; i++) { const u = i / 80; const x = X(u), y = Y(prof(u)); i ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke();
        const u = S.r, bx = X(u), by = Y(prof(u));
        O.atom(c, bx, by, 9, 'C', { color: pal.electron, label: false });
        c.font = BL.font(600, 13); c.fillStyle = pal.muted;
        c.textAlign = 'left'; c.fillText('apart', m.l, ch - 9);
        c.textAlign = 'right'; c.fillText('joined', cw - m.r, ch - 9);
        c.textAlign = 'center';
        BL.label(c, 'the hill', X(0.5), Y(prof(0.5)) - 16, { font: BL.font(700, 13), border: pal.electron });
      }

      say();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); curve.destroy(); } };
    },
  });
})();
