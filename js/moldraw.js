/* Bond Lab moldraw: how a molecule looks.

   The water instruments all run the same physics (js/water2d.js), which treats
   a molecule as a disk with four sites on its rim: two that offer a hydrogen
   and two that offer a lone pair. That is exactly right as physics and exactly
   wrong as a picture — a learner looking at a grey disk with four dots on it
   has no way to know they are looking at water.

   So this file draws what the physics already says. The two H sites sit at
   ±52.25° from the molecule's axis, which is half of water's real 104.5° bond
   angle, and the lone-pair sites sit behind. Draw an oxygen at the centre, a
   hydrogen on each H site, a stick between them and a soft negative lobe over
   the back, and the disk becomes a water molecule without one number changing.

   Everything is drawn at a scale `u` (pixels per molecule diameter) so the
   same code works for one molecule filling the stage and for forty in a tank. */
(function () {
  'use strict';
  const BL = window.BL;
  const M = BL.water2d;
  const TAU = Math.PI * 2;

  /* Sizes, as fractions of the molecule diameter u. */
  const R_O = 0.40, R_H = 0.21, R_LP = 0.30;

  const tint = (pal, base, amount) => BL.mix(pal.panel, base, amount);

  /* The negative side of a water molecule: a soft lobe over the two lone
     pairs, opposite the hydrogens. This is the end that other molecules'
     hydrogens come looking for, so it is worth being able to see. */
  function lobe(ctx, x, y, th, u, pal, strength) {
    if (strength <= 0 || !(u > 0)) return;
    const bx = x - Math.cos(th) * 0.26 * u, by = y - Math.sin(th) * 0.26 * u;
    const r = R_LP * u * 1.5;
    const g = ctx.createRadialGradient(bx, by, r * 0.1, bx, by, r);
    g.addColorStop(0, BL.alpha(pal.neg, 0.42 * strength));
    g.addColorStop(1, BL.alpha(pal.neg, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fill();
  }

  /* One water molecule, centred on its oxygen's disk centre.
     o.label: draw O and H letters (only worth it when u is large).
     o.charge: draw δ− / δ+ marks.
     o.lone: 0..1 how strongly to show the negative back.
     o.soap: draw it as a soap molecule instead (a greasy tail). */
  function water(ctx, x, y, th, u, pal, o) {
    o = o || {};
    if (!(u > 0)) return { o: { x, y }, h: [] };
    const arm = M.D_ARM * u;
    const hs = [M.SITE_ANG[0], M.SITE_ANG[1]].map((a) => ({
      x: x + Math.cos(th + a) * arm, y: y + Math.sin(th + a) * arm,
    }));
    const lw = Math.max(1.4, u * 0.055);

    if (o.lone !== 0) lobe(ctx, x, y, th, u, pal, o.lone == null ? 0.85 : o.lone);

    // sticks first, so the atoms sit on top of them
    ctx.lineCap = 'round';
    ctx.strokeStyle = BL.alpha(pal.fg, 0.5);
    ctx.lineWidth = Math.max(2, u * 0.13);
    hs.forEach((p) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    ctx.lineCap = 'butt';

    // oxygen: the electron-greedy end, so it is tinted negative
    ctx.beginPath(); ctx.arc(x, y, R_O * u, 0, TAU);
    ctx.fillStyle = o.soap ? tint(pal, pal.electron, 0.5) : tint(pal, pal.neg, 0.42);
    ctx.fill();
    ctx.lineWidth = lw; ctx.strokeStyle = o.soap ? pal.electron : pal.neg; ctx.stroke();

    // the two hydrogens: stripped of their share, so they read positive
    hs.forEach((p) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, R_H * u, 0, TAU);
      ctx.fillStyle = tint(pal, pal.pos, 0.55);
      ctx.fill();
      ctx.lineWidth = Math.max(1.2, u * 0.045); ctx.strokeStyle = pal.pos; ctx.stroke();
    });

    if (o.label && u > 34) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = BL.font(800, Math.min(19, u * 0.26), true);
      ctx.fillStyle = pal.fg;
      ctx.fillText('O', x, y + 0.5);
      if (u > 60) {
        ctx.font = BL.font(800, Math.min(15, u * 0.17), true);
        hs.forEach((p) => ctx.fillText('H', p.x, p.y + 0.5));
      }
      ctx.textBaseline = 'alphabetic';
    }
    if (o.charge && u > 44) {
      const f = BL.fs(13);
      BL.label(ctx, 'δ−', x - Math.cos(th) * 0.78 * u, y - Math.sin(th) * 0.78 * u,
        { font: BL.font(700, 13), color: pal.neg, pad: 4 });
      BL.label(ctx, 'δ+', hs[0].x + Math.cos(th + M.SITE_ANG[0]) * 0.3 * u, hs[0].y + Math.sin(th + M.SITE_ANG[0]) * 0.3 * u - f * 0.1,
        { font: BL.font(700, 13), color: pal.pos, pad: 4 });
    }
    return { o: { x, y }, h: hs };
  }

  /* A molecule with hydrogens that barely pull — H₂S is the classroom example.
     Bigger middle atom, almost no charge separation, so almost no grip. */
  function weak(ctx, x, y, th, u, pal, o) {
    o = o || {};
    if (!(u > 0)) return { o: { x, y }, h: [] };
    const arm = M.D_ARM * u;
    const hs = [M.SITE_ANG[0], M.SITE_ANG[1]].map((a) => ({ x: x + Math.cos(th + a) * arm * 0.95, y: y + Math.sin(th + a) * arm * 0.95 }));
    ctx.lineCap = 'round';
    ctx.strokeStyle = BL.alpha(pal.fg, 0.42); ctx.lineWidth = Math.max(2, u * 0.13);
    hs.forEach((p) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(x, y, R_O * u * 1.14, 0, TAU);
    ctx.fillStyle = tint(pal, pal.tVdw || pal.muted, 0.3); ctx.fill();
    ctx.lineWidth = Math.max(1.4, u * 0.055); ctx.strokeStyle = pal.muted; ctx.stroke();
    hs.forEach((p) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, R_H * u * 0.95, 0, TAU);
      ctx.fillStyle = tint(pal, pal.pos, 0.2); ctx.fill();
      ctx.lineWidth = Math.max(1.2, u * 0.045); ctx.strokeStyle = BL.alpha(pal.pos, 0.6); ctx.stroke();
    });
    if (o.label && u > 40) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = BL.font(800, Math.min(18, u * 0.24), true); ctx.fillStyle = pal.fg;
      ctx.fillText('S', x, y + 0.5); ctx.textBaseline = 'alphabetic';
    }
    return { o: { x, y }, h: hs };
  }

  /* A molecule with no polar end at all — methane. Four hydrogens spread
     evenly, no lobe, nothing sticking out to grab with. */
  function plain(ctx, x, y, th, u, pal, o) {
    o = o || {};
    if (!(u > 0)) return { o: { x, y }, h: [] };
    const arm = M.D_ARM * u * 0.86;
    const pts = [0, 1, 2, 3].map((k) => {
      const a = th + (k * TAU) / 4 + Math.PI / 4;
      return { x: x + Math.cos(a) * arm, y: y + Math.sin(a) * arm };
    });
    ctx.lineCap = 'round';
    ctx.strokeStyle = BL.alpha(pal.fg, 0.38); ctx.lineWidth = Math.max(1.8, u * 0.11);
    pts.forEach((p) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(x, y, R_O * u, 0, TAU);
    ctx.fillStyle = tint(pal, pal.fg, pal.dark ? 0.2 : 0.14); ctx.fill();
    ctx.lineWidth = Math.max(1.4, u * 0.055); ctx.strokeStyle = pal.muted; ctx.stroke();
    pts.forEach((p) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, R_H * u * 0.82, 0, TAU);
      ctx.fillStyle = pal.panel; ctx.fill();
      ctx.lineWidth = Math.max(1.1, u * 0.04); ctx.strokeStyle = pal.muted; ctx.stroke();
    });
    if (o.label && u > 40) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = BL.font(800, Math.min(18, u * 0.24), true); ctx.fillStyle = pal.fg;
      ctx.fillText('C', x, y + 0.5); ctx.textBaseline = 'alphabetic';
    }
    return { o: { x, y }, h: pts };
  }

  /* An ion: one ball, one sign, no sharing to speak of. */
  function ion(ctx, x, y, r, q, sym, pal, o) {
    o = o || {};
    if (!(r > 0)) return { x, y, r: 0 };
    const col = q > 0 ? pal.pos : pal.neg;
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.9);
    g.addColorStop(0, BL.alpha(col, 0.3)); g.addColorStop(1, BL.alpha(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.9, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = tint(pal, col, 0.5); ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.14); ctx.strokeStyle = col; ctx.stroke();
    if (sym && r > 11) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = BL.font(800, Math.min(20, r * 0.62), true); ctx.fillStyle = pal.fg;
      ctx.fillText(sym + (q > 0 ? '⁺' : '⁻'), x, y + 0.5);
      ctx.textBaseline = 'alphabetic';
    }
    return { x, y, r };
  }

  /* The hydrogen bond itself: a dotted bridge from a hydrogen to someone
     else's lone pair, drawn differently from a real bond on purpose. */
  function bridge(ctx, x1, y1, x2, y2, pal, strength, width) {
    const s = BL.clamp(strength == null ? 1 : strength, 0, 1);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.setLineDash([Math.max(2, (width || 6) * 0.42), Math.max(3, (width || 6) * 0.72)]);
    ctx.lineWidth = (width || 6) * (0.4 + 0.6 * s);
    ctx.strokeStyle = BL.alpha(pal.tHydrogen || pal.ui, 0.35 + 0.5 * s);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  /* Pick the drawing that matches a water2d molecule type. */
  function byType(id) {
    return id === 'water' ? water : id === 'weak' ? weak : plain;
  }

  BL.mol = { water, weak, plain, ion, bridge, byType, R_O, R_H };
})();
