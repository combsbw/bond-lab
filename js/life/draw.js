/* How organic molecules look in the Life Lab.

   Chapter 3 arrives as four dozen names, and the fastest way to make it feel
   like forty separate facts is to draw each family differently. So everything
   here draws through one kit: an atom is always a lettered sphere in that
   element's colour, a bond is always one, two or three lines, a leaving water
   is always the same little molecule Bond Lab drew. Oxygen keeps the blue it
   had as water's δ− end and hydrogen keeps the red it had as the δ+ end, so a
   learner arriving from the chapter before recognises the parts on sight.

   The four monomers live in here too, as UNITS. Each one knows the name of its
   own bond, what its polymer is called, and where its two coupling sites are —
   which is the entire reason The Template can run the same animation four
   times and let the learner see that it is the same reaction. */
(function () {
  'use strict';
  const BL = window.BL;
  const TAU = Math.PI * 2;

  const lum = (hex) => { const c = BL.rgb(hex); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };
  /* Letters go on top of the sphere, so they have to pick their own colour. */
  const ink = (hex) => (lum(hex) > 0.56 ? '#0b1412' : '#ffffff');
  const colOf = (sym, o) => (o && o.color) || (BL.pal.el && BL.pal.el[sym]) || BL.pal.eC || BL.pal.fg;

  /* ---------------------------------------------------------------
     One atom: a sphere with its letter on it. Shaded, because a flat
     disc reads as a token and a shaded one reads as a thing.
     --------------------------------------------------------------- */
  function atom(ctx, x, y, r, sym, o) {
    o = o || {};
    if (!(r > 0)) return;
    const pal = BL.pal, col = colOf(sym, o);
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.34, Math.max(0.4, r * 0.08), x, y, r);
    g.addColorStop(0, BL.mix(col, '#ffffff', 0.44));
    g.addColorStop(0.58, col);
    g.addColorStop(1, BL.mix(col, '#000000', pal.dark ? 0.1 : 0.2));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (o.ring) { ctx.lineWidth = Math.max(2.5, r * 0.26); ctx.strokeStyle = o.ring; ctx.stroke(); }
    else if (o.edge !== false) { ctx.lineWidth = 1.4; ctx.strokeStyle = BL.alpha(pal.fg, 0.3); ctx.stroke(); }
    const text = o.text == null ? sym : o.text;
    if (text && o.label !== false && r >= 7) {
      ctx.save();
      ctx.font = BL.font(800, r * (text.length > 1 ? 0.78 : 1.0));
      ctx.fillStyle = o.ink || ink(col);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + r * 0.05);
      ctx.restore();
    }
  }

  /* ---------------------------------------------------------------
     One bond. Order 1, 2 or 3 — and because a learner meets double and
     triple bonds here as "a bond you cannot twist", the extra lines are
     drawn as extra lines rather than as a thicker one.
     --------------------------------------------------------------- */
  function bond(ctx, x1, y1, x2, y2, o) {
    o = o || {};
    const pal = BL.pal, order = o.order || 1, w = o.width || 7;
    let dx = x2 - x1, dy = y2 - y1;
    const L = Math.hypot(dx, dy);
    if (!(L > 0.01)) return;
    dx /= L; dy /= L;
    const ax = x1 + dx * (o.trim1 || 0), ay = y1 + dy * (o.trim1 || 0);
    const bx = x2 - dx * (o.trim2 || 0), by = y2 - dy * (o.trim2 || 0);
    const px = -dy, py = dx;
    ctx.save();
    ctx.strokeStyle = o.color || BL.alpha(pal.fg, o.alpha == null ? 0.8 : o.alpha);
    ctx.lineCap = o.cap || 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    const offs = order >= 3 ? [-w * 0.92, 0, w * 0.92] : order === 2 ? [-w * 0.52, w * 0.52] : [0];
    ctx.lineWidth = order >= 3 ? w * 0.48 : order === 2 ? w * 0.58 : w;
    offs.forEach((k) => {
      ctx.beginPath();
      ctx.moveTo(ax + px * k, ay + py * k);
      ctx.lineTo(bx + px * k, by + py * k);
      ctx.stroke();
    });
    ctx.restore();
  }

  /* A hydrogen bond, or any other weak hold: the same dotted line Bond Lab used. */
  function weakBond(ctx, x1, y1, x2, y2, o) {
    o = o || {};
    bond(ctx, x1, y1, x2, y2, {
      order: 1, width: o.width || 3.5, dash: o.dash || [3, 5],
      color: o.color || BL.alpha(BL.pal.tHydrogen, o.alpha == null ? 0.9 : o.alpha), cap: 'butt',
    });
  }

  /* The corners of a ring, which is the one shape carbon can make that a
     chain cannot, and the shape every sugar and every base turns out to be. */
  function ringPts(cx, cy, r, n, rot) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (rot || -Math.PI / 2) + (i / n) * TAU;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }

  /* A functional group as a pill with its formula on it: the handle you bolt
     onto a carbon body to tell it what to do for a living. */
  function pill(ctx, x, y, text, o) {
    o = o || {};
    const pal = BL.pal, col = o.color || pal.ui;
    ctx.save();
    ctx.font = BL.font(800, o.size || 14);
    const tw = ctx.measureText(text).width;
    // the browser normalises ctx.font to "800 16px ...", so parseFloat would
    // hand back the weight. Pull the pixel size out by name.
    const fsz = parseFloat(ctx.font.match(/(\d+(?:\.\d+)?)px/)[1]);
    const w = tw + fsz * 1.1, h = fsz + 11, rr = h / 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, rr); else ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = o.fill === false ? BL.alpha(pal.panel, 0.9) : col;
    ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = o.fill === false ? col : BL.alpha(pal.fg, 0.25); ctx.stroke();
    ctx.fillStyle = o.fill === false ? col : ink(col);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 0.5);
    ctx.restore();
    return { w, h };
  }

  /* A hydrocarbon tail: the zigzag every fatty acid is, kinked wherever a
     double bond stops it lying flat. */
  function tail(ctx, x, y, dir, n, o) {
    o = o || {};
    const seg = o.seg || 13, amp = o.amp || 7, kinks = o.kinks || [];
    const pts = [[x, y]];
    let cx = x, cy = y, ang = dir;
    for (let i = 0; i < n; i++) {
      const z = (i & 1 ? 1 : -1) * (o.flat ? 0 : 0.55);
      if (kinks.indexOf(i) >= 0) ang += o.kinkBend == null ? 0.72 : o.kinkBend;
      cx += Math.cos(ang) * seg - Math.sin(ang) * z * amp * 0.0;
      cy += Math.sin(ang) * seg;
      const nx = cx - Math.sin(ang) * z * amp, ny = cy + Math.cos(ang) * z * amp;
      pts.push([nx, ny]);
    }
    ctx.save();
    ctx.strokeStyle = o.color || BL.pal.eTail;
    ctx.lineWidth = o.width || 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
    kinks.forEach((k) => {
      const p = pts[Math.min(k + 1, pts.length - 1)];
      ctx.lineWidth = (o.width || 6) * 0.5; ctx.strokeStyle = BL.pal.electron;
      ctx.beginPath(); ctx.arc(p[0], p[1], (o.width || 6) * 0.85, 0, TAU); ctx.stroke();
    });
    ctx.restore();
    return pts;
  }

  /* The water molecule that leaves when a bond forms and comes back when one
     breaks. Same drawing as Bond Lab's, so it reads as the same molecule. */
  function water(ctx, x, y, u, o) {
    o = o || {};
    if (BL.mol && BL.mol.water) return BL.mol.water(ctx, x, y, o.th == null ? -Math.PI / 2 : o.th, u, BL.pal, { label: o.label !== false, lone: o.lone == null ? 0 : o.lone });
    return null;
  }

  /* ---------------------------------------------------------------
     The four monomers.

     Every one of them has a left site and a right site. Join two units and
     the left site of one gives up a hydrogen while the right site of the
     other gives up a hydroxyl; those two leave together as water and the
     bond is what is left. Four families, one move. The only thing that
     changes between them is what the body looks like and what the bond is
     called.
     --------------------------------------------------------------- */
  const UNITS = {
    amino: {
      id: 'amino', name: 'amino acid', short: 'amino acid', bond: 'peptide bond', poly: 'polypeptide',
      family: 'protein', leftTag: 'N—H', rightTag: 'O—H',
      made: 'a protein', bodyColor: () => BL.pal.eN,
      says: 'An amino group at one end, a carboxyl group at the other, and an R-group hanging off the middle that is different in every one of the twenty.',
      draw(ctx, x, y, s, o) {
        o = o || {};
        const pal = BL.pal, w = s * 1.5, hh = s * 0.95;
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x - w / 2, y - hh / 2, w, hh, s * 0.35); else ctx.rect(x - w / 2, y - hh / 2, w, hh);
        ctx.fillStyle = BL.alpha(o.tint || pal.eN, pal.dark ? 0.26 : 0.17);
        ctx.fill();
        ctx.lineWidth = 2.4; ctx.strokeStyle = BL.alpha(o.tint || pal.eN, 0.9); ctx.stroke();
        ctx.restore();
        // the R-group, the only part that differs between one amino acid and the next
        if (o.r !== false) {
          bond(ctx, x, y - hh / 2, x, y - hh / 2 - s * 0.42, { width: s * 0.14 });
          atom(ctx, x, y - hh / 2 - s * 0.68, s * 0.33, 'C', { text: o.rText || 'R', color: o.rColor || pal.electron });
        }
        atom(ctx, x - w * 0.3, y, s * 0.3, 'N');
        atom(ctx, x + w * 0.3, y, s * 0.3, 'C');
        return { left: [x - w / 2, y], right: [x + w / 2, y] };
      },
    },
    sugar: {
      id: 'sugar', name: 'monosaccharide', short: 'sugar', bond: 'glycosidic bond', poly: 'polysaccharide',
      family: 'carbohydrate', leftTag: 'O—H', rightTag: 'O—H',
      made: 'a starch, or a cellulose', bodyColor: () => BL.pal.tDipole,
      says: 'A ring of carbons with oxygens hanging off it, in the ratio one carbon to two hydrogens to one oxygen. Sugars are rings; that is what they look like.',
      draw(ctx, x, y, s, o) {
        o = o || {};
        const pal = BL.pal, r = s * 0.72;
        const pts = ringPts(x, y, r, 6, -Math.PI / 2);
        ctx.save();
        ctx.beginPath();
        pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.closePath();
        ctx.fillStyle = BL.alpha(o.tint || pal.tDipole, pal.dark ? 0.26 : 0.17); ctx.fill();
        ctx.lineWidth = 2.6; ctx.strokeStyle = BL.alpha(o.tint || pal.tDipole, 0.95); ctx.stroke();
        ctx.restore();
        atom(ctx, pts[0][0], pts[0][1], s * 0.26, 'O');
        return { left: [x - r, y + r * 0.2], right: [x + r, y + r * 0.2] };
      },
    },
    fatty: {
      id: 'fatty', name: 'fatty acid', short: 'fatty acid', bond: 'ester bond', poly: 'triglyceride',
      family: 'lipid', leftTag: 'O—H', rightTag: 'O—H',
      made: 'a fat, or a membrane', bodyColor: () => BL.pal.eTail,
      says: 'A carboxyl group with a long hydrocarbon tail trailing off it. The head will talk to water. The tail will not.',
      draw(ctx, x, y, s, o) {
        o = o || {};
        const pal = BL.pal;
        tail(ctx, x + s * 0.3, y, 0, 5, { seg: s * 0.33, amp: s * 0.18, width: s * 0.2, kinks: o.kinks || [], color: o.tint || pal.eTail });
        atom(ctx, x, y, s * 0.36, 'C', { color: o.tint || pal.eTail });
        atom(ctx, x - s * 0.1, y - s * 0.44, s * 0.24, 'O');
        return { left: [x - s * 0.36, y], right: [x + s * 1.9, y] };
      },
    },
    nucl: {
      id: 'nucl', name: 'nucleotide', short: 'nucleotide', bond: 'phosphodiester bond', poly: 'nucleic acid',
      family: 'nucleic acid', leftTag: 'O—H', rightTag: 'O—H',
      made: 'a DNA strand', bodyColor: () => BL.pal.tIondipole,
      says: 'Three parts bolted together: a phosphate, a five-carbon sugar, and one of five bases. Only the base changes along a strand — which is exactly why the base is where the information is.',
      draw(ctx, x, y, s, o) {
        o = o || {};
        const pal = BL.pal;
        const pts = ringPts(x, y + s * 0.1, s * 0.5, 5, -Math.PI / 2);
        ctx.save();
        ctx.beginPath();
        pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.closePath();
        ctx.fillStyle = BL.alpha(o.tint || pal.tDipole, pal.dark ? 0.24 : 0.16); ctx.fill();
        ctx.lineWidth = 2.4; ctx.strokeStyle = BL.alpha(o.tint || pal.tDipole, 0.95); ctx.stroke();
        ctx.restore();
        // phosphate on the left, base on the right: the order they sit in along a strand
        atom(ctx, x - s * 0.82, y, s * 0.33, 'P');
        bond(ctx, x - s * 0.82, y, x - s * 0.5, y, { width: s * 0.12 });
        const bw = s * 0.62;
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x + s * 0.5, y - bw * 0.5, bw, bw, bw * 0.3); else ctx.rect(x + s * 0.5, y - bw * 0.5, bw, bw);
        ctx.fillStyle = BL.alpha(o.baseColor || pal.eN, 0.9); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.font = BL.font(800, s * 0.4); ctx.fillStyle = ink(o.baseColor || pal.eN);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.base || 'A', x + s * 0.81, y);
        ctx.restore();
        return { left: [x - s * 1.15, y], right: [x + s * 0.5, y + s * 0.55] };
      },
    },
  };

  BL.org = { atom, bond, weakBond, ringPts, pill, tail, water, UNITS, ink, lum, TAU };
})();
