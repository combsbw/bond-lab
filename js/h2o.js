/* The Molecule: one water molecule, taken apart and put back together.

   Every other water instrument in this lab runs crowds of molecules. None of
   them stops long enough to ask what ONE of them is, and that turns out to be
   the thing everything else rests on.

   Two facts, and water's whole personality falls out of them:

     1. Oxygen pulls the shared electrons much harder than hydrogen does, so
        each O–H bond is lopsided: the oxygen end goes δ−, the hydrogens δ+.
     2. The molecule is BENT, not straight. Both hydrogens sit on the same
        side, so their two little pulls add up instead of cancelling.

   Take away either one and water stops being water. So both are handles here:
   drag the bond angle from bent to straight and watch the molecule's pull
   collapse to nothing; wind the oxygen's greed down to hydrogen's and watch
   the charges fade. Then bring a second molecule in and see whether it still
   sticks.

   Carbon dioxide is the control: O=C=O is just as lopsided bond-for-bond as
   water, and it is straight, so it has no pull at all. That is why it is a gas
   you breathe out and water is a liquid you are mostly made of. */
(function () {
  'use strict';
  const { h, clamp } = BL;

  const REAL_ANGLE = 104.5;
  const REAL_GREED = 1.24;          // the difference in pull between O and H
  const GREED_MAX = 1.8;

  /* How strong the molecule's overall pull is: each bond contributes a tug of
     size `greed` along itself, and the two tugs add as arrows, not as numbers.
     Straight molecule, opposite arrows, nothing left. */
  function dipole(angleDeg, greed) {
    const half = (angleDeg / 2) * Math.PI / 180;
    return greed * 2 * Math.cos(half) / (2 * Math.cos((REAL_ANGLE / 2) * Math.PI / 180) * REAL_GREED);
  }

  /* `out` says which end of each bond the electrons lean toward. In water it
     is the middle atom (the oxygen), so the middle goes δ− and the hydrogens
     δ+. In carbon dioxide it is the other way round: the two oxygens are the
     greedy ones and the carbon in the middle is left δ+. Flipping this changes
     nothing about how the two tugs add up, which is exactly the point. */
  const SHAPES = [
    { id: 'water', name: 'Water', formula: 'H₂O', angle: REAL_ANGLE, greed: REAL_GREED, mid: 'O', out: 'H', greedyOut: false, note: 'bent, and lopsided. Both at once.' },
    { id: 'co2', name: 'Carbon dioxide', formula: 'CO₂', angle: 180, greed: 0.89, mid: 'C', out: 'O', greedyOut: true, note: 'just as lopsided, but straight — so nothing is left over.' },
    { id: 'none', name: 'An even sharer', formula: '—', angle: REAL_ANGLE, greed: 0, mid: 'A', out: 'B', greedyOut: false, note: 'bent, but both ends pull the same, so there is nothing to lean.' },
  ];

  const GOALS = [
    { id: 'open', text: 'Straighten the molecule out and watch its pull disappear.' },
    { id: 'fair', text: 'Make both atoms pull equally hard and watch the charges fade.' },
    { id: 'back', text: 'Put water back the way it really is.' },
    { id: 'stick', text: 'Bring a second molecule in and make a hydrogen bond.' },
    { id: 'fail', text: 'Straighten the molecule, then try to make that hydrogen bond again.' },
    { id: 'co2', text: 'Look at carbon dioxide. Why is it a gas and water is not?' },
    { id: 'spin', text: 'Spin the second molecule all the way round. Is there more than one way to shake hands?' },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<path d="M100 62 L62 36 M100 62 L138 36" stroke="currentColor" stroke-width="6" stroke-linecap="round" opacity=".55"/>' +
    '<circle cx="100" cy="62" r="24" fill="var(--panel-2)" stroke="var(--neg)" stroke-width="3.5"/>' +
    '<circle cx="62" cy="36" r="13" fill="var(--panel)" stroke="var(--pos)" stroke-width="3"/>' +
    '<circle cx="138" cy="36" r="13" fill="var(--panel)" stroke="var(--pos)" stroke-width="3"/>' +
    '<path d="M100 92 v-14" stroke="var(--electron)" stroke-width="4"/><path d="M100 100 l-6 -11 h12z" fill="var(--electron)"/></svg>';

  BL.register({
    id: 'h2o', field: 'water', order: 0, name: 'The Molecule',
    tagline: 'One water molecule, and the two things that make it odd.',
    lede: 'One water molecule. Drag a hydrogen to open or close the angle, and use the sliders to change how hard the oxygen pulls. Watch the arrow below: that leftover lean is where everything water does comes from.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        angle: REAL_ANGLE, greed: REAL_GREED, shape: 'water', mid: 'O', out: 'H', greedyOut: false,
        partner: false, px: 0.74, py: 0.4, pth: Math.PI, dragged: false,
        spun: 0, lastTh: Math.PI, hadBond: false, wandered: false, touched: false,
      };

      const stage = BL.stage(stageHost, '16 / 10', {
        label: 'A single water molecule with a bent shape, its oxygen marked δ− and its hydrogens δ+, and an arrow below showing the molecule’s overall pull. Drag a hydrogen to change the angle. With the stage focused, the left and right arrow keys open and close the angle.',
        focusable: true,
      });
      stage.wrap.classList.add('h2o-stage');
      const ctx = stage.ctx;

      const L = {};
      stage.onresize = () => {
        const W = stage.w, H = stage.h;
        // with no neighbour in the way the molecule can have the room
        L.u = clamp(Math.min(W * (S.partner ? 0.15 : 0.22), H * (S.partner ? 0.26 : 0.32)), 34, 124);
        L.cx = W * (S.partner ? 0.3 : 0.46);
        L.cy = H * 0.4;
      };
      stage.onresize();

      const pp = () => ({ x: S.px * stage.w, y: S.py * stage.h });

      /* Hydrogen positions for a molecule drawn with a given half-angle. */
      function hpos(cx, cy, th, angle, u) {
        const half = (angle / 2) * Math.PI / 180;
        return [half, -half].map((a) => ({ x: cx + Math.cos(th + a) * 0.56 * u, y: cy + Math.sin(th + a) * 0.56 * u }));
      }
      const MAIN_TH = -Math.PI / 2;    // the molecule points up, so the bend reads at a glance

      BL.drag(stage.canvas, {
        pick: (p) => {
          const hs = hpos(L.cx, L.cy, MAIN_TH, S.angle, L.u);
          for (let i = 0; i < 2; i++) if (Math.hypot(p.x - hs[i].x, p.y - hs[i].y) < 30) return { h: i };
          if (S.partner) { const q = pp(); if (Math.hypot(p.x - q.x, p.y - q.y) < L.u * 0.8) return { p: true }; }
          return null;
        },
        move: (hnd, p) => {
          S.touched = true;
          if (hnd.h != null) {
            // the angle follows the hydrogen you are holding, mirrored onto the other one
            const a = Math.atan2(p.y - L.cy, p.x - L.cx) - MAIN_TH;
            const half = clamp(Math.abs(a), 30 * Math.PI / 180, Math.PI) * 180 / Math.PI;
            S.angle = clamp(half * 2, 60, 180);
            S.shape = null;
            sync();
          } else {
            S.px = clamp(p.x, L.u, stage.w - L.u) / stage.w;
            S.py = clamp(p.y, L.u, stage.h - L.u) / stage.h;
            S.dragged = true;
          }
        },
      });
      stage.canvas.addEventListener('keydown', (e) => {
        const k = { ArrowLeft: -4, ArrowRight: 4 }[e.key];
        if (k) { e.preventDefault(); S.touched = true; S.angle = clamp(S.angle + k, 60, 180); S.shape = null; sync(); return; }
        if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && S.partner) {
          e.preventDefault(); S.touched = true;
          turn(S.pth + (e.key === 'ArrowUp' ? 0.25 : -0.25));
        }
      });
      function turn(th) {
        const d = th - S.lastTh;
        S.spun += Math.abs(d); S.lastTh = th; S.pth = th;
        if (S.spun > 6.0) goals.done('spin');
      }

      /* ---------------- readouts ---------------- */
      const mPull = BL.meter('The whole molecule’s pull');
      const mLop = BL.meter('How lopsided each bond is');
      const verdict = h('p', { class: 'verdict' });
      const why = h('p', { class: 'hint' });
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'What this molecule can do'),
        verdict, mLop.el, mPull.el, why));

      const bondBox = h('section', { class: 'panel' }, h('h2', {}, 'The second molecule'));
      const bondSay = h('p', { class: 'status' });
      const mBond = BL.meter('Grip of the hydrogen bond');
      bondBox.append(bondSay, mBond.el,
        h('p', { class: 'hint' }, 'A hydrogen bond only forms where a δ+ hydrogen on one molecule meets the δ− oxygen on the other. Point them any other way and they push apart instead — which is why water molecules in ice are forced into a very particular pattern.'));
      aux.appendChild(bondBox);

      /* ---------------- dock ---------------- */
      const shapeBtns = SHAPES.map((sh) =>
        h('button', {
          class: 'chip', type: 'button', 'aria-pressed': 'false',
          onclick: () => { S.touched = true; S.shape = sh.id; S.angle = sh.angle; S.greed = sh.greed; S.mid = sh.mid; S.out = sh.out; S.greedyOut = sh.greedyOut; sync(); },
        }, sh.name, h('span', { class: 'sub' }, sh.formula + ' · ' + sh.note)));
      dock.appendChild(h('section', {}, h('h2', {}, 'Start from'), h('div', { class: 'chips' }, shapeBtns)));

      const angOut = h('output', { class: 'val' });
      const angRange = h('input', { type: 'range', min: '60', max: '180', step: '0.5', 'aria-label': 'The angle between the two bonds' });
      angRange.addEventListener('input', () => { S.touched = true; S.angle = parseFloat(angRange.value); S.shape = null; sync(); });
      const greedOut = h('output', { class: 'val' });
      const greedRange = h('input', { type: 'range', min: '0', max: String(GREED_MAX), step: '0.01', 'aria-label': 'How much harder the middle atom pulls' });
      greedRange.addEventListener('input', () => { S.touched = true; S.greed = parseFloat(greedRange.value); S.shape = null; sync(); });
      dock.appendChild(h('section', {},
        h('div', { class: 'row' }, h('h2', {}, 'The bend'), angOut),
        h('div', { class: 'range-wrap' }, angRange, h('div', { class: 'range-ends' }, h('span', {}, 'folded shut'), h('span', {}, 'straight'))),
        h('div', { class: 'row sp' }, h('h2', {}, 'How hard the middle pulls'), greedOut),
        h('div', { class: 'range-wrap' }, greedRange, h('div', { class: 'range-ends' }, h('span', {}, 'the same'), h('span', {}, 'far harder'))),
        h('div', { class: 'actions' },
          h('button', { class: 'action ghost', type: 'button', onclick: () => { S.touched = true; S.shape = 'water'; S.angle = REAL_ANGLE; S.greed = REAL_GREED; S.mid = 'O'; S.out = 'H'; S.greedyOut = false; sync(); } }, 'Put water back'))));

      const partnerBtn = h('button', { class: 'action', type: 'button', 'aria-pressed': 'false', onclick: () => { S.touched = true; S.partner = !S.partner; S.px = 0.74; S.py = 0.4; S.pth = Math.PI; S.lastTh = Math.PI; S.spun = 0; stage.onresize(); sync(); } }, 'Bring a second one in');
      const spinRange = h('input', { type: 'range', min: '0', max: '360', step: '1', 'aria-label': 'Turn the second molecule' });
      spinRange.addEventListener('input', () => { S.touched = true; turn(parseFloat(spinRange.value) * Math.PI / 180); });
      const spinWrap = h('div', { class: 'range-wrap' }, spinRange, h('div', { class: 'range-ends' }, h('span', {}, 'turn it'), h('span', {}, 'all the way round')));
      dock.appendChild(h('section', {},
        h('h2', {}, 'A neighbour'),
        h('div', { class: 'actions' }, partnerBtn),
        spinWrap,
        h('p', { class: 'hint' }, 'Drag it around the first one, and turn it, until the two of them grip.')));

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'h2o', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- sync ---------------- */
      function sync() {
        shapeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(S.shape === SHAPES[i].id)));
        angRange.value = S.angle;
        angOut.textContent = '';
        angOut.append(S.angle >= 177 ? 'straight' : S.angle > 150 ? 'nearly straight' : S.angle > 115 ? 'slightly bent' : S.angle > 95 ? 'bent, like water' : 'folded tight',
          BL.numv(' · ' + Math.round(S.angle) + '°'));
        greedRange.value = S.greed;
        greedOut.textContent = '';
        greedOut.append(S.greed < 0.08 ? 'the same' : S.greed < 0.6 ? 'a little harder' : S.greed < 1.5 ? 'much harder' : 'enormously harder',
          BL.numv(' · ' + S.greed.toFixed(2)));
        partnerBtn.setAttribute('aria-pressed', String(S.partner));
        partnerBtn.textContent = S.partner ? 'Take it away again' : 'Bring a second one in';
        spinWrap.hidden = !S.partner;
        bondBox.hidden = !S.partner;
      }
      sync();

      /* ---------------- drawing ---------------- */
      function molecule(pal, cx, cy, th, angle, greed, u, big) {
        const hs = hpos(cx, cy, th, angle, u);
        const q = clamp(greed / REAL_GREED, 0, 1.4);
        const lw = Math.max(1.6, u * 0.055);
        const f = BL.fs(14);
        const outGreedy = S.greedyOut;
        const midCol = outGreedy ? pal.pos : pal.neg;      // the middle atom's charge
        const outCol = outGreedy ? pal.neg : pal.pos;      // the outer atoms' charge
        const midSign = outGreedy ? 'δ+' : 'δ−';
        const outSign = outGreedy ? 'δ−' : 'δ+';

        /* The spare electrons pile up on whichever end is winning. For water
           that is the back of the oxygen, which is the place another
           molecule's hydrogen comes looking for. */
        if (q > 0.06) {
          const spots = outGreedy ? hs : [{ x: cx - Math.cos(th) * 0.3 * u, y: cy - Math.sin(th) * 0.3 * u }];
          const r = u * (outGreedy ? 0.42 : 0.62);
          spots.forEach((sp) => {
            const g = ctx.createRadialGradient(sp.x, sp.y, r * 0.1, sp.x, sp.y, r);
            g.addColorStop(0, BL.alpha(pal.neg, 0.42 * Math.min(1, q))); g.addColorStop(1, BL.alpha(pal.neg, 0));
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sp.x, sp.y, r, 0, 7); ctx.fill();
          });
        }
        // sticks
        ctx.lineCap = 'round'; ctx.strokeStyle = BL.alpha(pal.fg, 0.5); ctx.lineWidth = Math.max(2.5, u * 0.14);
        hs.forEach((p) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y); ctx.stroke(); });
        ctx.lineCap = 'butt';
        // the middle atom
        ctx.beginPath(); ctx.arc(cx, cy, u * 0.4, 0, 7);
        ctx.fillStyle = BL.mix(pal.panel, midCol, 0.1 + 0.34 * Math.min(1, q)); ctx.fill();
        ctx.lineWidth = lw; ctx.strokeStyle = q > 0.06 ? midCol : pal.muted; ctx.stroke();
        // the two outer atoms
        hs.forEach((p) => {
          ctx.beginPath(); ctx.arc(p.x, p.y, u * (outGreedy ? 0.28 : 0.21), 0, 7);
          ctx.fillStyle = BL.mix(pal.panel, outCol, 0.12 + 0.45 * Math.min(1, q)); ctx.fill();
          ctx.lineWidth = Math.max(1.3, u * 0.045); ctx.strokeStyle = q > 0.06 ? outCol : pal.muted; ctx.stroke();
        });
        if (u > 40) {
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = pal.fg;
          ctx.font = BL.font(800, Math.min(20, u * 0.26), true);
          ctx.fillText(S.mid, cx, cy + 0.5);
          if (u > 58) {
            ctx.font = BL.font(800, Math.min(15, u * 0.17), true);
            hs.forEach((p) => ctx.fillText(S.out, p.x, p.y + 0.5));
          }
          ctx.textBaseline = 'alphabetic';
        }
        if (big && q > 0.08) {
          BL.label(ctx, midSign, cx - Math.cos(th) * 0.86 * u, cy - Math.sin(th) * 0.86 * u, { font: BL.font(700, 14), color: midCol, pad: 5 });
          hs.forEach((p) => BL.label(ctx, outSign, p.x + (p.x - cx) * 0.75, p.y + (p.y - cy) * 0.75, { font: BL.font(700, 13), color: outCol, pad: 4 }));
        }
        // each bond's own little tug, pointing the way its electrons lean
        if (big && q > 0.08) {
          ctx.strokeStyle = BL.alpha(pal.electron, 0.55); ctx.fillStyle = BL.alpha(pal.electron, 0.55); ctx.lineWidth = 2.5;
          hs.forEach((p) => {
            const sgn = outGreedy ? -1 : 1;
            const vx = sgn * (cx - p.x), vy = sgn * (cy - p.y), m = Math.hypot(vx, vy) || 1;
            const bx = outGreedy ? cx : p.x, by = outGreedy ? cy : p.y;
            const ex = bx + (vx / m) * u * 0.52 * Math.min(1, q), ey = by + (vy / m) * u * 0.52 * Math.min(1, q);
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ex + (vx / m) * 7, ey + (vy / m) * 7);
            ctx.lineTo(ex - (vy / m) * 5, ey + (vx / m) * 5); ctx.lineTo(ex + (vy / m) * 5, ey - (vx / m) * 5);
            ctx.closePath(); ctx.fill();
          });
        }
        return { hs, cx, cy, th, back: { x: cx - Math.cos(th) * 0.4 * u, y: cy - Math.sin(th) * 0.4 * u } };
      }

      /* How well the two of them are shaking hands: one's hydrogen has to be
         sitting on the other's lone-pair side, close, and pointing in. */
      function grip(a, b, d) {
        let best = 0, which = null;
        const pairs = [];
        a.hs.forEach((p) => pairs.push([p, b.back, b]));
        b.hs.forEach((p) => pairs.push([p, a.back, a]));
        pairs.forEach(([hp, bk]) => {
          const r = Math.hypot(hp.x - bk.x, hp.y - bk.y) / L.u;
          const near = Math.exp(-Math.pow(r / 0.42, 2));
          if (near > best) { best = near; which = [hp, bk]; }
        });
        return { g: clamp(best * d * (S.greedyOut ? 0 : 1), 0, 1), at: which };
      }

      function frame() {
        const pal = BL.pal, W = stage.w, H = stage.h;
        if (!W) return;
        stage.onresize();
        ctx.clearRect(0, 0, W, H);
        const d = clamp(dipole(S.angle, S.greed), 0, 1.4);
        const f = BL.fs(14);

        const a = molecule(pal, L.cx, L.cy, MAIN_TH, S.angle, S.greed, L.u, true);
        let gr = null;
        if (S.partner) {
          const q = pp();
          const b = molecule(pal, q.x, q.y, S.pth, S.angle, S.greed, L.u * 0.92, false);
          gr = grip(a, b, d);
          if (gr.g > 0.08 && gr.at) BL.mol.bridge(ctx, gr.at[0].x, gr.at[0].y, gr.at[1].x, gr.at[1].y, pal, gr.g, Math.max(4, L.u * 0.18));
          if (!S.dragged && !BL.reduced) {
            ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'center';
            ctx.fillText('drag me, and turn me', q.x, q.y - L.u * 0.95);
          }
        }

        // The two little tugs, added up: one arrow, pointing to the δ− side.
        // It lives below the molecule where it has room to grow and shrink.
        const ay0 = H - f * 4.6, ax = L.cx;
        ctx.strokeStyle = BL.alpha(pal.fg, 0.25); ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(ax - L.u * 1.5, ay0); ctx.lineTo(ax + L.u * 1.5, ay0); ctx.stroke(); ctx.setLineDash([]);
        if (d > 0.03) {
          const len = Math.min(d * L.u * 1.2, H - ay0 - f * 2.4);
          ctx.strokeStyle = pal.electron; ctx.fillStyle = pal.electron; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(ax, ay0); ctx.lineTo(ax, ay0 + len - 10); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ax, ay0 + len); ctx.lineTo(ax - 8, ay0 + len - 13); ctx.lineTo(ax + 8, ay0 + len - 13); ctx.closePath(); ctx.fill();
          BL.label(ctx, 'the whole molecule leans toward its δ− end', ax, ay0 + len + f * 1.1,
            { font: BL.font(700, 13), color: pal.electron, pad: 5 });
        } else {
          BL.label(ctx, 'no lean at all — the two tugs cancel', ax, ay0 + f * 1.3, { font: BL.font(700, 14), color: pal.muted, border: pal.line2 });
        }

        // ---------- readouts ----------
        const lop = clamp(S.greed / GREED_MAX, 0, 1);
        mLop.set(lop, S.greed < 0.08 ? 'not at all — nothing is leaning' : S.greed < 0.6 ? 'a little' : S.greed < 1.5 ? 'a lot, like real water' : 'enormously', S.greed.toFixed(2));
        mPull.set(clamp(d / 1.2, 0, 1), d < 0.04 ? 'none' : d < 0.3 ? 'faint' : d < 0.75 ? 'useful' : 'strong, like real water', d.toFixed(2));
        verdict.textContent = '';
        const flat = S.angle > 172;
        const fair = S.greed < 0.08;
        verdict.append(
          h('b', { class: 'verdict-kind', style: 'color: var(--' + (d > 0.3 ? 'ui' : 'muted') + ')' },
            d > 0.3 ? 'This one sticks to things' : 'This one sticks to almost nothing'),
          h('span', {}, d > 0.3 ? 'it has a δ+ side and a δ− side' : 'no side of it is charged'));
        why.textContent = fair
          ? 'Both atoms pull the shared electrons equally, so neither end gains a charge. Bend it however you like: there is nothing to add up. A molecule needs lopsided bonds before its shape can matter at all.'
          : flat
            ? 'The bonds are still lopsided — look at the δ+ and δ− marks. But the molecule is straight, so the two tugs point in exactly opposite directions and cancel. That is carbon dioxide: lopsided bonds, no overall pull, and a gas at room temperature because of it. Bend it and water comes back.'
            : 'Both hydrogens are on the same side, so their two tugs add up instead of cancelling. That leftover pull is why water sticks to itself, climbs up a paper towel, holds a bug on its surface, and takes so long to boil.';

        if (S.partner) {
          const g = gr ? gr.g : 0;
          mBond.set(g, g < 0.08 ? 'nothing' : g < 0.35 ? 'barely touching' : g < 0.7 ? 'a grip' : 'a firm hydrogen bond', Math.round(g * 100) + '%');
          bondSay.textContent = g > 0.7
            ? 'A hydrogen bond. One molecule’s δ+ hydrogen is sitting right on the other’s δ− oxygen.'
            : d < 0.1 ? 'Nothing to hold on to. With no charged ends, these two just bump into each other and drift apart.'
              : g > 0.2 ? 'Close. Move it in and turn it until a hydrogen points straight at the other one’s oxygen.'
                : 'Drag the second molecule closer, and turn it, until a δ+ hydrogen faces the δ− oxygen.';
        }

        // ---------- goals ----------
        if (S.touched) {
          if (flat && S.greed > 0.3) goals.done('open');
          if (fair) goals.done('fair');
          if (Math.abs(S.angle - REAL_ANGLE) > 8 || Math.abs(S.greed - REAL_GREED) > 0.25) S.wandered = true;
          if (S.wandered && Math.abs(S.angle - REAL_ANGLE) < 3 && Math.abs(S.greed - REAL_GREED) < 0.1) goals.done('back');
          if (S.shape === 'co2') goals.done('co2');
          if (gr && gr.g > 0.7) { S.hadBond = true; goals.done('stick'); }
          if (S.hadBond && S.partner && flat && S.dragged) goals.done('fail');
        }
      }

      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
