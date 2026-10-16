/* Gatekeeper: the nucleus, a room with doors.

   The chapter's genetic-control row starts with the nucleus: the storehouse for a eukaryote's DNA, wrapped in a
   nuclear envelope (a phospholipid bilayer) that has nuclear pores in it, filled with a fluid called nucleoplasm,
   and with a dense patch, the nucleolus, where the proteins used to make ribosomes are created. It also says
   the ER is an extension of the nuclear envelope.

   Each of those is something to do. The envelope is a membrane, so nothing crosses it except through a pore:
   try to push a molecule through anywhere else and it bounces. The pores let organic molecules through, so
   carry the building blocks of RNA in and the finished instructions (mRNA) out. The DNA itself is far too big
   for a pore, which is the whole reason the instructions have to be copied out. Tap the nucleolus and it makes
   ribosome parts, which have to be carried out the same way, to where ribosomes are built. And turn the
   nucleus round: the ER is a sheet running out from the envelope.

   It is a model of what may cross, not of how: there is no transport machinery, and sizes are one of two
   (small enough for a pore, or not). Pores are drawn evenly over the surface, though a real nucleus has a few
   thousand. The next field starts with what the DNA inside is made of. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const K = BL.cell;

  const STEPS = [
    { id: 'bounce', text: 'Try to push a molecule through the envelope away from a pore.',
      how: 'Pick up a small molecule and carry it across the wall where there is no pore, then let go.',
      ask: 'can a molecule cross the nuclear envelope wherever it likes?',
      opts: ['Yes — it is only a surface', 'No — only through the pores'], right: 1 },
    { id: 'mrna', text: 'Carry an mRNA out through a pore.',
      how: 'Pick up a purple strand inside, take it to a pore (a small ring in the wall) and out.',
      ask: 'the instructions in the DNA are copied as mRNA. Where does the mRNA go?',
      opts: ['Out of the nucleus, to the ribosomes', 'It stays inside with the DNA'], right: 0 },
    { id: 'in', text: 'Carry two nucleotides in.',
      how: 'Pick up the small yellow pieces outside and take them in through a pore.',
      ask: 'which way do the building blocks of RNA go through the pores?',
      opts: ['In, from the cytoplasm', 'Out, to the cytoplasm'], right: 0 },
    { id: 'dna', text: 'Try to carry the DNA out.',
      how: 'Pick up the long purple helix and take it to a pore.',
      ask: 'will the DNA itself fit through a pore?',
      opts: ['Yes', 'No — it is far too big'], right: 1 },
    { id: 'nucleolus', text: 'Tap the nucleolus, and carry the ribosome parts out.',
      how: 'Tap the dark patch inside. It makes pieces; take one out through a pore.',
      ask: 'what is the nucleolus making?',
      opts: ['Ribosome parts', 'Mitochondria', 'Membrane'], right: 0 },
    { id: 'er', text: 'Turn the nucleus round and find where the ER joins on.',
      how: 'Drag to turn the nucleus until you can see the blue sheets meeting the envelope.',
      ask: 'the endoplasmic reticulum is an extension of the nucleus’s own…',
      opts: ['Envelope', 'Nucleolus', 'DNA'], right: 0 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<circle cx="100" cy="60" r="44" fill="var(--fn-genetic)" opacity=".25" stroke="var(--fn-genetic)" stroke-width="6"/>' +
    '<g fill="none" stroke="var(--fn-genetic)" stroke-width="3.5"><circle cx="146" cy="52" r="6"/><circle cx="134" cy="88" r="6"/><circle cx="62" cy="34" r="6"/></g>' +
    '<circle cx="92" cy="58" r="14" fill="var(--fn-genetic)"/></svg>';

  BL.register({
    id: 'gate', field: 'jobs', order: 6, name: 'Gatekeeper',
    tagline: 'A room with doors, and a molecule too big for any of them.',
    lede: 'The nucleus, in three dimensions — drag to turn it over. Its wall is a membrane, so nothing crosses except through a pore. Pick things up and carry them through, and find out what fits and what does not.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const v = (x, y, z) => ({ x, y, z });
      const norm = (a) => { const L = Math.hypot(a.x, a.y, a.z) || 1; return v(a.x / L, a.y / L, a.z / L); };
      const S = { mol: [], hint: 0, made: 0, ins: 0, outs: 0, bounced: 0, tooBig: 0, hover: null, hinted: false, t: 0, nucleolus: v(-0.25, 0.1, 0.12), msgT: -99 };
      // pores: evenly over the surface (a Fibonacci sphere), 26 of them
      const pores = Array.from({ length: 26 }, (_, i) => { const y = 1 - (i + 0.5) / 13, r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.39996; return norm(v(Math.cos(th) * r, y, Math.sin(th) * r)); });
      const rnd = K.rng(17);
      const addMol = (k, p) => S.mol.push({ k, p, home: { x: p.x, y: p.y, z: p.z }, inside: Math.hypot(p.x, p.y, p.z) < 1, held: false });
      [v(-0.55, -0.35, 0.3), v(0.4, -0.55, -0.35), v(0.15, 0.6, 0.35)].forEach((p) => addMol('mrna', p));
      addMol('dna', v(-0.35, -0.55, -0.2));
      for (let i = 0; i < 5; i++) { const n = norm(v(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1)); addMol('nuc', v(n.x * 1.4, n.y * 1.4, n.z * 1.4)); }
      const chromatin = Array.from({ length: 7 }, () => { const pts = [], n = norm(v(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1)), f = K.frame(n); for (let i = 0; i <= 10; i++) { const a = i / 10 * 3.14 - 1.57, rr = 0.6 + rnd() * 0.2; pts.push(v(n.x * rr * Math.cos(a) * 0.6 + f.u.x * Math.sin(a) * rr, n.y * rr * Math.cos(a) * 0.6 + f.u.y * Math.sin(a) * rr, n.z * rr * Math.cos(a) * 0.6 + f.u.z * Math.sin(a) * rr)); } return pts; });

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A three-dimensional cutaway of a cell nucleus with a double membrane wall, small rings in the wall which are pores, a dark patch called the nucleolus, loops of purple DNA, and a stack of blue endoplasmic reticulum sheets joined to the wall. Small molecules can be picked up and carried; they can pass the wall only through a pore. Drag the background to turn it.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const V = BL.view3d(stage.canvas, {
        yaw: 0.6, pitch: 0.25, auto: 0.14,
        pick: (p) => { let best = null, bd = 20; S.mol.forEach((m) => { if (!m._q) return; const d = Math.hypot(p.x - m._q.x, p.y - m._q.y); if (d < bd) { bd = d; best = m; } }); return best ? { m: best, z: V.project(best.p).z } : null; },
        drag: (a, p) => { a.m.held = true; a.m.p = V.unproject(p.x, p.y, a.z); S.hinted = true; },
        end: (a) => release(a.m),
        tap: (p) => { const q = V.project(S.nucleolus); if (Math.hypot(p.x - q.x, p.y - q.y) < 26 * Math.max(0.6, q.s)) makeParts(); },
        hover: (p) => { S.hm = p ? S.mol.find((m) => m._q && Math.hypot(p.x - m._q.x, p.y - m._q.y) < 22) : null; stage.canvas.style.cursor = S.hm ? 'grab' : ''; },
        onturn: () => { S.hinted = true; if (V.turned > 1.6) steps.done('er'); },
      });

      /* ---------------- dock ---------------- */
      dock.appendChild(h('section', {}, h('h2', {}, 'Make something to carry'),
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action', onclick: () => makeParts() }, 'Make ribosome parts (tap the nucleolus)'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => { S.hint = 1; S.hinted = true; say('The doors are the small rings in the wall. Carry things through them.'); } }, 'Show me the doors')),
        h('p', { class: 'hint' }, 'Pick up a molecule and carry it. Where you let go is where it stays, if it is allowed to be there.')));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'gate', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' }, 'Pick up a molecule and carry it across the wall.');
      const inM = BL.meter('Carried in'), outM = BL.meter('Carried out'), bounceM = BL.meter('Turned back at the wall');
      aux.appendChild(h('section', { class: 'panel' }, statusP, h('div', { class: 'meters' }, inM.el, outM.el, bounceM.el),
        h('div', { class: 'legend' }, h('span', { class: 'fn-chip', style: '--c: var(--fn-genetic)' }, 'purple: mRNA and the DNA'), h('span', { class: 'fn-chip', style: '--c: var(--fn-energy)' }, 'yellow: nucleotides'), h('span', { class: 'fn-chip', style: '--c: var(--fn-protein)' }, 'blue: ribosome parts and ER'))));
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'What is in a nucleus'),
        h('div', { class: 'facts' },
          ...[['Nuclear envelope', 'a phospholipid bilayer round the whole thing'], ['Nuclear pores', 'openings in it that let organic molecules through'], ['Nucleoplasm', 'the fluid inside, like cytosol'], ['Nucleolus', 'the dense patch where ribosome parts are made']].map(([a, b]) => h('div', {}, h('dt', {}, a), h('dd', {}, b))))));
      function say(t) { statusP.textContent = t; S.msgT = S.t; }

      function makeParts() { if (S.mol.filter((m) => m.k === 'sub' && m.inside).length >= 4) { say('Plenty already. Carry some out.'); return; } const n = S.nucleolus; addMol('sub', v(n.x + (rnd() - 0.5) * 0.3, n.y + 0.2 + rnd() * 0.15, n.z + (rnd() - 0.5) * 0.3)); S.made++; S.hinted = true; say('The nucleolus made a ribosome part. It has to go out through a pore to where ribosomes are built.'); }

      /* a molecule is let go. Did it cross the wall, and was it allowed to? */
      function release(m) {
        m.held = false;
        const big = m.k === 'dna', q = V.project(m.p);
        // let go with it over a pore, and it is carried through that pore to the other side
        let np = null; pores.forEach((n) => { const pq = V.project(n); if (Math.hypot(pq.x - q.x, pq.y - q.y) < 0.11 * V.scale * pq.s && (!np || pq.z > np.z)) np = { n, z: pq.z }; });
        if (np) {
          if (big) { S.bounced++; S.tooBig++; say('The DNA will not go. It is thousands of times too big for a pore, which is why the instructions have to be copied out as mRNA.'); steps.done('dna'); m.p = { x: m.home.x, y: m.home.y, z: m.home.z }; return; }
          const to = m.inside ? 1.28 : 0.62, n = np.n; m.p = v(n.x * to, n.y * to, n.z * to); m.home = { x: m.p.x, y: m.p.y, z: m.p.z };
          m.inside = !m.inside;
          if (m.inside) { S.ins++; if (m.k === 'nuc') { say('In through a pore: a building block for making RNA.'); if (S.mol.filter((o) => o.k === 'nuc' && o.inside).length >= 2) steps.done('in'); } else say('That went in through a pore.'); }
          else { S.outs++; if (m.k === 'mrna') { say('Out through a pore: the instructions, on their way to a ribosome.'); steps.done('mrna'); } else if (m.k === 'sub') { say('Out through a pore: a ribosome part, on its way to be put together.'); steps.done('nucleolus'); } else say('That went out through a pore.'); }
          return;
        }
        const a = m.home, b = m.p, ra = Math.hypot(a.x, a.y, a.z), rb = Math.hypot(b.x, b.y, b.z), was = ra < 1, now = rb < 1;
        if (was === now) { m.home = { x: b.x, y: b.y, z: b.z }; return; }
        // it was taken across the wall somewhere with no pore
        S.bounced++; say('It turned back. The wall is a membrane, and nothing crosses a membrane except through a pore.'); steps.done('bounce'); m.p = { x: a.x, y: a.y, z: a.z }; S.hint = 1;
      }

      /* ---------------- frame ---------------- */
      function frame(dt) {
        const cw = stage.w, chh = stage.h, pal = BL.pal; if (!cw) return;
        S.t += dt; S.hint = Math.max(0, S.hint - dt * 0.12);
        V.step(dt); V.frame(cw, chh, 1.55, { x: 0.15, y: 0, z: 0 });
        ctx.clearRect(0, 0, cw, chh);
        const G = pal.fn.genetic, O = v(0, 0, 0);
        // the ER, an extension of the wall
        const erN = norm(v(1, 0.25, 0.1)), er = { s: 'er', p: v(erN.x * 1.2, erN.y * 1.2, erN.z * 1.2), n: erN, R: 0.42, count: 4, gap: 0.11 };
        V.add(V.project(er.p).z, () => K.drawInst(ctx, V, er, { alpha: 1 }));
        // the envelope: two membranes
        V.add(-800, () => { const q = V.project(O), r = V.scale * q.s; ctx.save(); const g = ctx.createRadialGradient(q.x - r * 0.3, q.y - r * 0.3, r * 0.1, q.x, q.y, r); g.addColorStop(0, BL.alpha(BL.mixHex(pal.panel, G, 0.04), 0.6)); g.addColorStop(1, BL.alpha(BL.mixHex(pal.panel, G, 0.24), 0.5)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.2832); ctx.fill(); ctx.strokeStyle = G; ctx.lineWidth = 4; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(G, 0.6); ctx.beginPath(); ctx.arc(q.x, q.y, r * 0.955, 0, 6.2832); ctx.stroke(); ctx.restore(); });
        // pores: a ring set in the wall, wherever it faces out of the page
        pores.forEach((n) => { const p = v(n.x, n.y, n.z), q = V.project(p), f = K.frame(n); V.add(q.z + 0.02, () => { const back = q.z < 0; K.ring(ctx, V, p, f.u, f.w, 0.075, back ? BL.alpha(pal.fg, 0.35) : pal.fg, back ? 2 : 3.4, 1); const held = S.mol.find((o) => o.held), hq = held && V.project(held.p), near = held && Math.hypot(hq.x - q.x, hq.y - q.y) < 0.11 * V.scale * q.s && !back;
          if ((S.hint > 0 && !back) || near) { ctx.save(); ctx.strokeStyle = BL.alpha(pal.ui, near ? 1 : S.hint); ctx.lineWidth = near ? 5 : 3; ctx.beginPath(); ctx.arc(q.x, q.y, 20 + 5 * Math.sin(S.t * 6), 0, 6.2832); ctx.stroke(); ctx.restore(); } }); });
        // chromatin, the DNA, in loops against the inner wall
        chromatin.forEach((pts) => { const a = V.project(pts[0]), b = V.project(pts[10]); V.add((a.z + b.z) / 2 - 0.1, () => { ctx.save(); ctx.strokeStyle = BL.alpha(G, 0.38); ctx.lineWidth = Math.max(1.4, 0.012 * V.scale); ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach((p, i) => { const q = V.project(p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.stroke(); ctx.restore(); }); });
        // the nucleolus
        V.add(V.project(S.nucleolus).z, () => { const q = K.ball(ctx, V, S.nucleolus, 0.2, BL.mixHex(G, '#000000', 0.4), { alpha: 0.95 }); S.nuq = q; });
        // molecules
        S.mol.forEach((m) => {
          const q = V.project(m.p); m._q = q;
          V.add(q.z + 0.5 + (m.held ? 5 : 0), () => {
            const ring = m.held ? pal.fg : null;
            if (m.k === 'nuc') K.ball(ctx, V, m.p, 0.06, BL.mixHex(pal.fn.energy, '#ffffff', 0.15), { ring: ring || pal.fg });
            else if (m.k === 'sub') { K.ball(ctx, V, m.p, 0.07, pal.fn.protein, { ring }); K.ball(ctx, V, v(m.p.x + 0.07, m.p.y + 0.04, m.p.z), 0.045, BL.mixHex(pal.fn.protein, '#ffffff', 0.25), { ring }); }
            else if (m.k === 'mrna') { let prev = null; for (let i = 0; i < 6; i++) { const p = v(m.p.x + i * 0.04 - 0.1, m.p.y + Math.sin(i * 1.6 + S.t * 3) * 0.03, m.p.z), pq = V.project(p); if (prev) K.fibre(ctx, V, prev, p, Math.max(3.5, 0.03 * V.scale * pq.s), pal.pos); prev = p; } if (ring) { ctx.strokeStyle = ring; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(q.x, q.y, 20, 0, 6.2832); ctx.stroke(); } }
            else { let pa = null, pb = null; for (let i = 0; i <= 14; i++) { const t = i / 14, th = t * 12, c = v(m.p.x + (t - 0.5) * 0.7, m.p.y, m.p.z), a = v(c.x, c.y + Math.sin(th) * 0.045, c.z + Math.cos(th) * 0.045), b = v(c.x, c.y - Math.sin(th) * 0.045, c.z - Math.cos(th) * 0.045); if (pa) { K.fibre(ctx, V, pa, a, 4.5, G); K.fibre(ctx, V, pb, b, 4.5, pal.ui); } pa = a; pb = b; } if (ring) { ctx.strokeStyle = ring; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(q.x, q.y, 36, 0, 6.2832); ctx.stroke(); } }
          });
        });
        V.flush();
        if (S.nuq) BL.label(ctx, 'nucleolus', S.nuq.x, S.nuq.y + S.nuq.r + 14, { font: BL.font(700, 12), border: G });
        const named = S.mol.find((m) => m.held) || S.hm;
        if (named && named._q) BL.label(ctx, { nuc: 'nucleotide', sub: 'ribosome part', mrna: 'mRNA: the copied instructions', dna: 'DNA — too big for a pore' }[named.k], clamp(named._q.x, 90, cw - 90), named._q.y - 30, { font: BL.font(700, 13), border: named.k === 'nuc' ? pal.fn.energy : named.k === 'sub' ? pal.fn.protein : pal.fn.genetic });
        V.cue(ctx, pal);
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'pick up a molecule and carry it through a pore', cw / 2, chh - 16, { font: BL.font(700, 14), border: pal.ui });
        inM.set(clamp(S.ins / 4, 0, 1), S.ins ? S.ins + ' through' : 'none yet'); inM.tone(pal.fn.energy);
        outM.set(clamp(S.outs / 4, 0, 1), S.outs ? S.outs + ' through' : 'none yet'); outM.tone(G);
        bounceM.set(clamp(S.bounced / 4, 0, 1), S.bounced ? S.bounced + ' time' + (S.bounced === 1 ? '' : 's') : 'never'); bounceM.tone(pal.pos);
      }
      if (window.__BL_TEST) window.__BL_TEST.gate = { S, V, pores };
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
