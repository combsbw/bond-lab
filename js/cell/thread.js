/* Thread: how two metres of DNA fit in a room too small to see.

   The chapter's second half is a ladder, and the first thing it says is that each rung is defined only in terms of
   the rung before it, so it has to be learned in strict order. Double helix; wraps around histones; the wrapped
   stretch is a nucleosome ("beads on a string"); the beads coil into chromatin; the chromatin folds into a
   chromosome. Four steps of packing, and none can be skipped.

   So the ladder is a thing you climb, and you do each step with your hands:

     wrap      drag round the histones and the DNA winds on, about one and a half turns
     beads     tap the string to drop a histone core on it; do it eight times
     coil      coil the string of beads into a fibre
     fold      fold the fibre into a chromosome

   Try to jump to a rung whose predecessor you have not done and it will not let you: you cannot coil what is not
   yet a string of nucleosomes. Each rung is shorter than the last, and "does it fit?" is answered in words, with
   rough lengths behind Display > Show the numbers.

   The chapter's third trap is built in as a question: packing is not copying. Nothing here ever changes how much
   DNA there is; every step makes the same thread smaller. Bacteria, which skip the histones altogether, are in Rings.

   It is a drawing of the ARRANGEMENT, not of true geometry: a real nucleosome is 146 base pairs round eight
   histones, a real fibre has its own helix and the levels above it are less well known than the chapter lets on.
   The lengths are round figures. Fourteen beads stand in for the thirty million. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const K = BL.cell;
  const v = (x, y, z) => ({ x, y, z });
  const lerp = (a, b, t) => a + (b - a) * t;
  const M = 14;                                  // beads, standing in for ~30 million

  const RUNGS = [
    { id: 'helix', name: 'The double helix', def: 'Two strands, paired and twisted: the DNA from Complement.', verb: '', length: 'about 2 metres', words: 'far, far too long for a nucleus', fit: 0.02 },
    { id: 'wrap', name: 'Wrapped round histones', def: 'A stretch of the double helix winds about one and a half times round a core of eight histone proteins.', verb: 'Drag round the histones to wind the DNA on.', length: 'a little shorter', words: 'one wrap done', fit: 0.1 },
    { id: 'beads', name: 'Nucleosomes: beads on a string', def: 'Each wrapped stretch is a nucleosome. Do it again and again along the DNA: beads on a string.', verb: 'Tap the string to drop a histone core on it. Eight times.', length: 'about 30 centimetres', words: 'much too long', fit: 0.3 },
    { id: 'chromatin', name: 'Chromatin', def: 'The string of nucleosomes coils up into a thicker fibre, chromatin.', verb: 'Coil the string.', length: 'about 5 centimetres', words: 'still too long', fit: 0.6 },
    { id: 'chromosome', name: 'A chromosome', def: 'The chromatin fibre folds and compacts into a chromosome.', verb: 'Fold the fibre.', length: 'about a fifth of a millimetre', words: 'packed small', fit: 0.95 },
  ];

  const STEPS = [
    { id: 'count', text: 'Look down the ladder and count the packing steps from helix to chromosome.',
      how: 'Tap any rung on the ladder.',
      ask: 'how many packing steps are there from the double helix to a chromosome?',
      opts: ['One', 'Four', 'Twelve'], right: 1 },
    { id: 'skip', text: 'Try to jump straight to the chromosome.',
      how: 'Tap “A chromosome” on the ladder before you have done the rungs below it.',
      ask: 'can you fold DNA into a chromosome without the steps between?',
      opts: ['Yes — just fold it', 'No — each step packs the one before'], right: 1 },
    { id: 'wrap', text: 'Wind the DNA round the histones.',
      how: 'On the “Wrapped round histones” rung, drag round the blue core until the DNA is on.',
      ask: 'DNA winds round a core of how many histones?',
      opts: ['Two', 'Eight', 'Eighty'], right: 1 },
    { id: 'beads', text: 'Make beads on a string.',
      how: 'Tap along the string to drop eight histone cores on it.',
      ask: 'about how many nucleosomes are in one human cell?',
      opts: ['Thousands', 'About thirty million', 'Trillions'], right: 1 },
    { id: 'coil', text: 'Coil the string into chromatin.',
      how: 'Slide “Pack it tighter” until the fibre has coiled.',
      ask: 'a string of nucleosomes, coiled up, is called…',
      opts: ['Chromatin', 'A chromosome', 'A histone'], right: 0 },
    { id: 'fold', text: 'Fold the chromatin into a chromosome.',
      how: 'Slide “Pack it tighter” all the way across.',
      ask: 'packed into a chromosome, is there more DNA, or the same DNA in less room?',
      opts: ['More DNA', 'The same DNA, in less room'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<path d="M20 90 q20 -40 40 0 t40 0 t40 0 t40 0" fill="none" stroke="var(--fn-genetic)" stroke-width="4"/>' +
    '<g fill="var(--fn-protein)"><circle cx="46" cy="36" r="9"/><circle cx="78" cy="36" r="9"/><circle cx="110" cy="36" r="9"/><circle cx="142" cy="36" r="9"/></g>' +
    '<path d="M36 36 H152" stroke="var(--fn-genetic)" stroke-width="3"/></svg>';

  BL.register({
    id: 'thread', field: 'thread', order: 1, name: 'Thread',
    tagline: 'Two metres of DNA, and a room too small to see.',
    lede: 'DNA is far too long to fit in a nucleus as it is. It gets there in four packing steps, each one packing the last, and none can be skipped. Wind it round its histones, string the beads, coil them, fold them — with your own hands, in three dimensions.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        rung: 0, done: [true, false, false, false, false], t: [1, 0, 0, 0, 0], beads: [], view: 0, wrapAcc: 0, lastAng: null, hinted: false, t0: 0, msg: '', drag: null, grow: [], note: '',
      };
      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A three-dimensional view of DNA being packed, one rung of a ladder at a time: a double helix, then DNA wound round a core of histone proteins, then a string of nucleosome beads, then a coiled fibre called chromatin, then a chromosome. You do each step yourself by dragging, tapping or sliding. Drag the background to turn it.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const V = BL.view3d(stage.canvas, {
        yaw: 0.45, pitch: 0.28, auto: 0.14,
        pick: (p) => (S.view === 1 && !S.done[1] && nearHandle(p) ? { wrap: true } : null),
        drag: (a, p) => { if (a.wrap) windTo(p); },
        end: () => { S.lastAng = null; },
        tap: (p) => { if (S.view === 2 && !S.done[2]) tapString(p); },
        onturn: () => { S.hinted = true; },
      });

      /* ---------------- dock ---------------- */
      const tOut = h('output', { class: 'val' }), tIn = h('input', { type: 'range', min: '0', max: '100', step: '1', value: '0', 'aria-label': 'Pack it tighter' });
      tIn.addEventListener('input', () => { setT(parseFloat(tIn.value) / 100); });
      const slide = h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'Pack it tighter'), tOut), h('div', { class: 'range-wrap' }, tIn, h('div', { class: 'range-ends' }, h('span', {}, 'before'), h('span', {}, 'after'))));
      const addBeads = h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action ghost', onclick: () => { if (S.view === 2 && !S.done[2]) dropBead(); } }, 'Drop a histone core on the string'));
      dock.appendChild(h('section', {}, slide, addBeads, h('p', { class: 'hint' }, 'Packing never changes how much DNA there is. It is the same thread, folded smaller.'),
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action ghost', onclick: () => undo() }, 'Unpack one rung'))));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'thread', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux: the ladder ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const lenM = BL.meter('How long the thread is now'), fitM = BL.meter('Does it fit in the nucleus?');
      aux.appendChild(h('section', { class: 'panel' }, statusP, h('div', { class: 'meters' }, lenM.el, fitM.el),
        h('div', { class: 'legend' }, h('span', { class: 'fn-chip', style: '--c: var(--fn-genetic)' }, 'the DNA'), h('span', { class: 'fn-chip', style: '--c: var(--fn-protein)' }, 'histones: the spools'))));
      const cards = RUNGS.map((r, i) => h('li', { class: 'rung', tabindex: '0', 'aria-label': r.name, onclick: () => go(i), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(i); } } },
        h('span', { class: 'rung-n' }, String(i + 1)), h('div', {}, h('b', {}, r.name), h('p', {}, r.def))));
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'The ladder'), h('ol', { class: 'ladder', 'aria-label': 'The five rungs of DNA packing, in order' }, ...cards),
        h('p', { class: 'hint' }, 'Each rung is defined by the one above it on the list, so you cannot do them out of order. A bacterium skips the histones and everything after: see Rings.')));
      function say(t) { statusP.textContent = t; S.msg = t; }

      /* ---------------- the ladder logic ---------------- */
      const unlocked = (i) => i === 0 || S.done[i - 1];
      function go(i) {
        S.hinted = true; steps.done('count');
        if (!unlocked(i)) {
          if (i === 4) steps.done('skip');
          say('You cannot do that one yet. “' + RUNGS[i].name + '” is defined as ' + RUNGS[i].def.split(':')[0].replace(/\.$/, '').toLowerCase() + ' — so “' + RUNGS[Math.max(0, i - 1)].name + '” has to be done first.');
          return;
        }
        S.view = i; sync();
        say(RUNGS[i].def + (i > 0 && !S.done[i] ? ' ' + RUNGS[i].verb : ''));
      }
      function setT(t) {
        const i = S.view; if (i < 3 || S.done[i]) { tIn.value = String(Math.round(S.t[i] * 100)); return; }
        S.t[i] = t; S.hinted = true;
        if (t >= 0.98) finish(i);
      }
      function finish(i) {
        S.done[i] = true; S.t[i] = 1;
        steps.done(['', 'wrap', 'beads', 'coil', 'fold'][i]);
        say({ 1: 'Wound on. That wrapped stretch, with its core of histones, is a nucleosome.', 2: 'Beads on a string. That is what a stretch of nucleosomes looks like.', 3: 'The beads coiled into a fibre: that is chromatin.', 4: 'The fibre folded into a chromosome. It is the same thread, packed into far less room.' }[i]);
        if (i < 4) { S.view = i + 1; }
        sync();
      }
      function undo() { for (let i = 4; i >= 1; i--) if (S.done[i]) { S.done[i] = false; S.t[i] = 0; if (i === 2) S.beads = []; S.view = i; sync(); say('Unpacked one rung: “' + RUNGS[i].name + '” is undone.'); return; } say('Already the double helix: nothing left to unpack.'); }
      function sync() {
        const cur = S.done.lastIndexOf(true);
        cards.forEach((c, i) => { c.classList.toggle('done', !!S.done[i] && i > 0); c.classList.toggle('now', i === S.view); c.classList.toggle('locked', !unlocked(i)); c.setAttribute('aria-current', String(i === S.view)); });
        const t = S.t[S.view] || 0; tIn.value = String(Math.round(t * 100));
        tOut.textContent = S.view < 3 ? (S.view === 1 ? 'drag round the histones' : S.view === 2 ? 'tap the string' : 'not yet') : (t < 0.05 ? 'not started' : t < 0.98 ? 'packing' : 'done');
        slide.style.opacity = S.view >= 3 ? '1' : '0.5'; tIn.disabled = S.view < 3;
        addBeads.style.display = S.view === 2 ? '' : 'none';
      }

      /* ---------------- the geometry, one function per rung ---------------- */
      const beadSites = (j) => v((j / (M - 1) - 0.5) * 6, 0, 0);
      const helixSites = (j, t) => { const L = 6 - 3.6 * t, rad = 0.62 * t, a = j * 0.95; return v((j / (M - 1) - 0.5) * L, Math.cos(a) * rad, Math.sin(a) * rad); };
      const chromSites = (j) => { const half = M / 2, side = j < half ? 1 : -1, k = (j < half ? j : j - half) / (half - 1) - 0.5, a = side * 0.56, s = k * 2.5, w = Math.sin(j * 2.1) * 0.05; return v(Math.cos(a) * s + w, Math.sin(a) * s * (side > 0 ? 1 : 1), w); };
      const sites = (j) => (S.t[4] > 0 ? (() => { const a = helixSites(j, 1), b = chromSites(j), t = S.t[4]; return v(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t)); })() : helixSites(j, S.t[3]));
      /* the nucleosome in close-up: a core of eight, and DNA wound round it */
      const dnaPath = (turns) => {
        const pts = [], R = 0.72, steps_ = 60;
        const x0 = -2.0;
        pts.push(v(x0, -0.28, R)); pts.push(v(-1.1, -0.28, R));
        const n = Math.max(2, Math.round(steps_ * Math.max(turns, 0.02)));
        for (let i = 0; i <= n; i++) { const a = (i / n) * turns * 6.2832, y = -0.28 + 0.56 * (i / n) * Math.min(1, turns / 1.65); pts.push(v(Math.sin(a) * R, y, Math.cos(a) * R)); }
        const last = pts[pts.length - 1], tang = v(Math.cos(turns * 6.2832), 0, -Math.sin(turns * 6.2832));
        pts.push(v(last.x + tang.x * 0.9, last.y, last.z + tang.z * 0.9)); pts.push(v(last.x + tang.x * 2.0, last.y, last.z + tang.z * 2.0));
        return pts;
      };
      function nearHandle(p) { const q = S.handle && V.project(S.handle); return q && Math.hypot(p.x - q.x, p.y - q.y) < 40; }
      function windTo(p) {
        const c = V.project(v(0, 0, 0)), ang = Math.atan2(p.y - c.y, p.x - c.x);
        if (S.lastAng != null) { let d = ang - S.lastAng; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; S.wrapAcc = clamp(S.wrapAcc + Math.abs(d), 0, 1.65 * 6.2832); }
        S.lastAng = ang; S.t[1] = S.wrapAcc / (1.65 * 6.2832); S.hinted = true; if (S.t[1] >= 0.985) finish(1);
      }
      function dropBead() { const free = []; for (let j = 0; j < M; j += 1) if (!S.beads.some((b) => b.j === j)) free.push(j); if (!free.length) return; const j = free[(Math.random() * free.length) | 0]; addBead(j); }
      function addBead(j) { if (S.beads.some((b) => b.j === j)) return; S.beads.push({ j, born: S.t0 }); S.t[2] = S.beads.length / 8; S.hinted = true; if (S.beads.length >= 8) finish(2); }
      function tapString(p) { let best = -1, bd = 34; for (let j = 0; j < M; j++) { const q = V.project(beadSites(j)); const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < bd) { bd = d; best = j; } } if (best >= 0) addBead(best); }

      /* ---------------- drawing ---------------- */
      function line3(pts, w, col, al) { for (let i = 0; i < pts.length - 1; i++) { const a = V.project(pts[i]), b = V.project(pts[i + 1]); V.add((a.z + b.z) / 2, () => K.fibre(ctx, V, pts[i], pts[i + 1], Math.max(1.5, w * V.scale * (a.s + b.s) / 2), col, al)); } }
      function doubleHelix(x0, x1, y, rad, turns, col, col2, al) {
        const n = 90; let pa = null, pb = null;
        for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(x0, x1, t), a = t * turns * 6.2832, A = v(x, y + Math.cos(a) * rad, Math.sin(a) * rad), B = v(x, y - Math.cos(a) * rad, -Math.sin(a) * rad); if (pa) { line3([pa, A], 0.05, col, al); line3([pb, B], 0.05, col2, al); } if (i % 3 === 0) line3([A, B], 0.02, BL.alpha(BL.pal.fg, 0.5), al); pa = A; pb = B; }
      }
      function core(c, r, al) { for (let k = 0; k < 8; k++) { const a = (k % 4) * 1.5708 + (k >= 4 ? 0.7854 : 0), y = (k >= 4 ? 1 : -1) * 0.13; const p = v(c.x + Math.cos(a) * 0.32, c.y + y * 1.5, c.z + Math.sin(a) * 0.32), q = V.project(p); V.add(q.z, () => K.ball(ctx, V, p, r, BL.pal.fn.protein, { alpha: al })); } }
      function frame(dt) {
        const cw = stage.w, chh = stage.h, pal = BL.pal; if (!cw) return;
        S.t0 += dt; V.step(dt); V.frame(cw, chh, S.view >= 3 ? 1.75 : S.view === 1 ? 1.55 : 2.7, v(0, 0, 0));
        ctx.clearRect(0, 0, cw, chh);
        const G = pal.fn.genetic, view = S.view;
        S.handle = null;
        if (view === 0) { doubleHelix(-3, 3, 0, 0.24, 7, G, BL.mixHex(G, '#ffffff', 0.4), 1); }
        else if (view === 1) {
          core(v(0, 0, 0), 0.2, 1);
          const turns = 1.65 * S.t[1], pts = dnaPath(turns); line3(pts, 0.06, G, 1);
          // the free end of the wound-on DNA is the handle you wind with
          S.handle = pts[pts.length - 3]; const hq = V.project(S.handle); V.add(hq.z + 2, () => { ctx.save(); ctx.strokeStyle = pal.fg; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(hq.x, hq.y, 18, 0, 6.2832); ctx.stroke(); ctx.restore(); });
          // the rest of the helix, off to each side
          V.add(-600, () => { });
        } else {
          const pos = []; for (let j = 0; j < M; j++) pos.push(view === 2 ? beadSites(j) : sites(j));
          const showBeads = view >= 3 ? M : S.beads.length;
          // the thread through the beads
          if (view === 2) line3(pos, 0.04, G, 0.9); else { const k = view === 4 ? 1 - S.t[4] : 1; line3(pos.slice(0, M / 2), 0.045, G, 1); line3(pos.slice(M / 2), 0.045, G, 1); if (k > 0.05) line3([pos[M / 2 - 1], pos[M / 2]], 0.045, G, k); }
          if (view === 4 && S.t[4] > 0.3) { // the two chromatids, as bodies the beads are packed into
            [[0, M / 2 - 1], [M / 2, M - 1]].forEach(([a, b]) => { const A = pos[a], B = pos[b], q = V.project(v((A.x + B.x) / 2, (A.y + B.y) / 2, 0)); V.add(q.z - 0.5, () => K.rod(ctx, V, A, B, 0.3, BL.alpha(G, 0.5), { alpha: 0.35 * S.t[4], edge: BL.alpha(G, 0.8), edgeW: 3 })); });
          }
          for (let j = 0; j < M; j++) {
            if (view === 2 && !S.beads.some((b) => b.j === j)) { const q = V.project(pos[j]); V.add(q.z, () => { ctx.save(); ctx.strokeStyle = BL.alpha(pal.fg, 0.45); ctx.lineWidth = 2; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(q.x, q.y, 14, 0, 6.2832); ctx.stroke(); ctx.restore(); }); continue; }
            const b = S.beads.find((o) => o.j === j), grow = view === 2 && b ? clamp((S.t0 - b.born) * 3, 0, 1) : 1, p = pos[j], q = V.project(p);
            V.add(q.z + 0.1, () => { K.ball(ctx, V, p, 0.19 * grow, pal.fn.protein, {}); K.ring(ctx, V, p, v(1, 0, 0), v(0, 0, 1), 0.23 * grow, G, 3.4, 1); K.ring(ctx, V, p, v(1, 0, 0), v(0, 0, 1), 0.28 * grow, G, 2.4, 0.7); });
          }
        }
        V.flush();
        // labels: the thing, not the name of the rung
        if (view === 1) { const hq = S.handle && V.project(S.handle); if (hq) BL.label(ctx, S.done[1] ? 'a nucleosome' : 'drag round the core →', hq.x, hq.y - 36, { font: BL.font(700, 13), border: pal.fn.protein }); const c = V.project(v(0, -0.45, 0)); BL.label(ctx, 'eight histones', c.x, c.y + 46, { font: BL.font(700, 13), border: pal.fn.protein }); }
        if (view === 2) { BL.label(ctx, S.beads.length + ' of 8 nucleosomes', cw / 2, chh - 40, { font: BL.font(700, 14), border: pal.fn.protein }); }
        BL.label(ctx, RUNGS[view].name, 12, 22, { font: BL.font(800, 15), align: 'left', border: pal.fg });
        V.cue(ctx, pal);
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'tap a rung on the ladder', cw / 2, chh - 18, { font: BL.font(700, 14), border: pal.ui });

        const cur = S.done.lastIndexOf(true), shown = view === cur + 1 && S.t[view] > 0 && !S.done[view] ? cur + S.t[view] : cur;
        const frac = 1 - clamp(shown / 4, 0, 1) * 0.9;
        lenM.set(frac, (RUNGS[Math.max(0, Math.round(shown))].length) + (BL.nums ? '' : '')); lenM.tone(G);
        fitM.set(RUNGS[Math.round(shown)].fit, RUNGS[Math.round(shown)].words); fitM.tone(pal.fn.protein);
        const L = lenM.el.querySelector('.meter-read'); if (BL.nums) { L.appendChild(BL.numv(' · the nucleus is about 6 millionths of a metre across')); }
        if (!S.msg) say('Tap a rung on the ladder. You start at the top, with the double helix.');
        if (view >= 3) { const t = S.t[view]; if (document.activeElement !== tIn) tIn.value = String(Math.round(t * 100)); tOut.textContent = S.done[view] ? 'done' : t < 0.05 ? 'not started' : 'packing'; }
      }

      if (window.__BL_TEST) window.__BL_TEST.thread = { S, V };
      sync();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
