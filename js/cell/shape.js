/* Shape: what holds a cell together, and in shape.

   The first job in the chapter's table is structure and support: the plasma
   membrane, the cytoskeleton, the cell wall. Three structures, three different
   jobs, and this makes each one's job the thing you take away.

   The cell is a ring of points joined by springs (the membrane) with water
   pushing out on it from inside. That is all a membrane alone is: a floppy bag.
   It only takes a round shape because the water inflates it.

     - Switch the cytoskeleton on and a scaffold of struts runs from the middle
       out to the edge, so the cell keeps its own shape — here a three-lobed
       one — however you poke it. Switch it off and the water rounds the cell
       into a ball.
     - Fill it with water and the membrane stretches. Past a point it tears.
       That is why a cell with no wall has to be careful.
     - Put a wall round it and the membrane presses out against something that
       does not give. The cell goes firm, and does not burst. Let the water out
       and the membrane pulls away from the wall.

   The second panel is the membrane itself, side on. A fluid mosaic: the
   lipids and proteins slide about in their own layer all the time, and the
   layer never comes apart. But a lipid cannot turn over to the other layer,
   because its head would have to be dragged through the oily middle.

   The model is a mass-and-spring toy: a ring of 44 points, edge springs,
   pressure along the normals, struts, and a rounded-rectangle wall that points
   cannot cross. It does not do osmosis (how the water gets in is Chapter 5) and
   the numbers are chosen to look right, not measured. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const K = BL.cell;

  const N = 44, HUB = N;                       // the ring, and one point in the middle for the struts
  const WALL = { hx: 1.1, hy: 0.85, rc: 0.38 };
  const BURST = 0.35;                           // how far the edge can stretch before it tears

  const STEPS = [
    { id: 'poke', text: 'Poke the cell: drag its edge inward, then let go.',
      how: 'Press on the membrane and drag it into the cell. The cytoskeleton is on.',
      ask: 'the cell has a scaffold inside it. When you let go, will it spring back to its own shape?',
      opts: ['Yes', 'No — it stays dented'], right: 0 },
    { id: 'noskel', text: 'Take the cytoskeleton out.',
      how: 'Switch the cytoskeleton off and wait a few seconds. Leave the wall off.',
      ask: 'with no scaffold, what shape does a bag of water settle into?',
      opts: ['A ball', 'Whatever shape it had', 'A flat sheet'], right: 0 },
    { id: 'burst', text: 'Fill the cell with water until something gives.',
      how: 'No wall, and slide “Water in the cell” all the way to full.',
      ask: 'what happens to a cell with no wall that takes on too much water?',
      opts: ['It swells until the membrane tears', 'It stays the same size', 'The cytoskeleton holds it together'], right: 0 },
    { id: 'wall', text: 'Put a wall round the cell and fill it with water.',
      how: 'Switch the wall on and slide the water up. Poke the edge.',
      ask: 'a cell with a wall, full of water: does it burst sooner or go firm?',
      opts: ['It bursts sooner', 'It presses against the wall and goes firm'], right: 1 },
    { id: 'wilt', text: 'Let the water out of the walled cell.',
      how: 'Keep the wall on and slide the water all the way down.',
      ask: 'when a walled cell loses water, what does the membrane do?',
      opts: ['It stays pressed against the wall', 'It pulls away from the wall'], right: 1 },
    { id: 'flip', text: 'Try to turn a lipid over in the membrane.',
      how: 'In “The membrane up close”, drag a lipid across to the other layer, then let go.',
      ask: 'can a phospholipid flip from one layer to the other?',
      opts: ['Easily', 'No — its head would have to be dragged through the oily middle'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<path d="M44 66 C44 34 80 26 100 38 C120 26 158 34 158 66 C158 96 124 100 100 90 C76 100 44 96 44 66 Z" fill="none" stroke="var(--fn-struct)" stroke-width="5"/>' +
    '<path d="M100 62 L62 52 M100 62 L142 52 M100 62 L100 96 M100 62 L70 84 M100 62 L132 84" stroke="var(--fn-struct)" stroke-width="2.5" opacity=".7"/>' +
    '<circle cx="100" cy="62" r="9" fill="var(--fn-genetic)"/></svg>';

  BL.register({
    id: 'shape', field: 'jobs', order: 0, name: 'Shape',
    tagline: 'A bag of water, a scaffold, and a wall.',
    lede: 'A cell is a bag of water with a membrane round it. Poke it, switch the scaffold inside it on and off, put a wall round it, and fill it with water until something gives. Underneath, the membrane itself, side on.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        skel: true, wall: false, w: 0.4, burst: 0, burstT: 0, pts: [], T: [], tmpl: [], grab: null, maxDisp: 0, hinted: false, roundT: 0, wallT: 0, wiltT: 0, t: 0,
        geo: { cx: 0, cy: 0, u: 100 },
      };
      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A single cell drawn as a ring of points with water pushing out from inside. A scaffold of struts, a stiff wall around it and the amount of water can each be switched. You can drag the edge of the cell inward to poke it. Controls are in the side panel.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- the cell ---------------- */
      function build() {
        S.pts = []; S.T = []; S.burst = 0; S.burstT = 0; S.grab = null;
        for (let i = 0; i < N; i++) {
          const a = i / N * 6.2832, r = 1 + 0.3 * Math.cos(3 * a + 0.4) + 0.1 * Math.cos(2 * a);
          const p = { x: Math.cos(a) * r * 0.84 - 0.15, y: Math.sin(a) * r * 0.84 * 0.78, vx: 0, vy: 0 };
          S.pts.push(p); S.T.push({ x: p.x, y: p.y });
        }
        S.pts.push({ x: 0, y: 0, vx: 0, vy: 0 }); S.T.push({ x: 0, y: 0 });
        S.edge = []; for (let i = 0; i < N; i++) { const j = (i + 1) % N; S.edge.push([i, j, Math.hypot(S.T[i].x - S.T[j].x, S.T[i].y - S.T[j].y)]); }
        S.L0 = S.edge.reduce((s, e) => s + e[2], 0);
        S.struts = [];
        for (let i = 0; i < N; i++) {
          [3, 8, 14].forEach((k) => { const j = (i + k) % N; S.struts.push([i, j, Math.hypot(S.T[i].x - S.T[j].x, S.T[i].y - S.T[j].y), 1]); });
          S.struts.push([i, HUB, Math.hypot(S.T[i].x, S.T[i].y), 1.6]);
        }
      }
      build();

      const pressure = () => 1.2 + 90 * S.w * S.w * S.w;
      const wallPush = (p) => {   // inside a rounded rectangle, or pushed back into it
        const { hx, hy, rc } = WALL, ax = Math.abs(p.x), ay = Math.abs(p.y), cx = hx - rc, cy = hy - rc;
        let ox = ax - cx, oy = ay - cy;
        if (ox > 0 && oy > 0) { const d = Math.hypot(ox, oy); if (d > rc) { const k = rc / d; p.x = Math.sign(p.x) * (cx + ox * k); p.y = Math.sign(p.y) * (cy + oy * k); return true; } return d > rc - 0.015; }
        let hit = false;
        if (ax > hx) { p.x = Math.sign(p.x) * hx; p.vx = 0; hit = true; } else if (ax > hx - 0.015) hit = true;
        if (ay > hy) { p.y = Math.sign(p.y) * hy; p.vy = 0; hit = true; } else if (ay > hy - 0.015) hit = true;
        return hit;
      };

      function physics(dt) {
        const P = S.burst ? 0 : pressure(), pts = S.pts;
        pts.forEach((p) => { p.fx = 0; p.fy = 0; });
        // the membrane: springs along the edge
        S.edge.forEach(([i, j, l0]) => {
          const a = pts[i], b = pts[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, f = (S.burst ? 60 : 900) * (d - l0), ux = dx / d, uy = dy / d;
          a.fx += f * ux; a.fy += f * uy; b.fx -= f * ux; b.fy -= f * uy;
        });
        // the water: pushes out along the edge, harder the fuller the cell is
        for (let i = 0; i < N; i++) {
          const a = pts[(i + N - 1) % N], b = pts[(i + 1) % N], tx = b.x - a.x, ty = b.y - a.y;
          pts[i].fx += P * ty * 0.5; pts[i].fy -= P * tx * 0.5;    // outward normal for a counter-clockwise ring
        }
        // the scaffold: struts that remember the cell's own shape
        if (S.skel && !S.burst) S.struts.forEach(([i, j, l0, k]) => {
          const a = pts[i], b = pts[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, cap = 0.8 * k, f = clamp(55 * k * (d - l0), -cap, cap), ux = dx / d, uy = dy / d;
          a.fx += f * ux; a.fy += f * uy; b.fx -= f * ux; b.fy -= f * uy;
        });
        // a finger
        if (S.grab) { const p = pts[S.grab.i], dx = S.grab.x - p.x, dy = S.grab.y - p.y, d = Math.hypot(dx, dy) || 1e-6, f = Math.min(110, 220 * d); p.fx += dx / d * f; p.fy += dy / d * f; }
        // the hub is tethered to the middle so the whole cell does not drift
        pts[HUB].fx -= 6 * pts[HUB].x; pts[HUB].fy -= 6 * pts[HUB].y;
        const damp = Math.exp(-5 * dt);
        pts.forEach((p) => { p.vx = (p.vx + p.fx * dt) * damp; p.vy = (p.vy + p.fy * dt) * damp; const sp = Math.hypot(p.vx, p.vy); if (sp > 9) { p.vx *= 9 / sp; p.vy *= 9 / sp; } p.x += p.vx * dt; p.y += p.vy * dt; });
        if (S.wall && !S.burst) { let c = 0; for (let i = 0; i < N; i++) if (wallPush(pts[i])) c++; S.contact = c / N; } else S.contact = 0;
      }

      /* ---------------- dock ---------------- */
      const skelBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'true', onclick: () => { S.skel = !S.skel; S.hinted = true; sync(); } }, 'Cytoskeleton');
      const wallBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { S.wall = !S.wall; S.hinted = true; sync(); } }, 'Cell wall');
      dock.appendChild(h('section', {}, h('h2', {}, 'What the cell has'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Which structures the cell has' }, skelBtn, wallBtn),
        h('p', { class: 'hint' }, 'The membrane is always there. The scaffold and the wall are the two extras.')));
      const wOut = h('output', { class: 'val' }), wIn = h('input', { type: 'range', min: '0', max: '100', step: '1', value: String(S.w * 100), 'aria-label': 'Water in the cell' });
      const wWords = () => (S.burst ? 'burst' : S.w < 0.15 ? 'nearly empty' : S.w < 0.5 ? 'comfortable' : S.w < 0.72 ? 'tight' : 'about to give');
      wIn.addEventListener('input', () => { S.w = parseFloat(wIn.value) / 100; S.hinted = true; wOut.textContent = wWords(); });
      wOut.textContent = wWords();
      dock.appendChild(h('section', {}, h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, 'Water in the cell'), wOut),
        h('div', { class: 'range-wrap' }, wIn, h('div', { class: 'range-ends' }, h('span', {}, 'empty'), h('span', {}, 'full')))),
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action ghost', onclick: () => { build(); S.maxDisp = 0; S.hinted = true; wOut.textContent = wWords(); } }, 'A fresh cell'))));
      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'shape', STEPS);
      dock.appendChild(stepHost);
      function sync() { skelBtn.setAttribute('aria-pressed', String(S.skel)); wallBtn.setAttribute('aria-pressed', String(S.wall)); }

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const stretchM = BL.meter('How stretched the membrane is'), roundM = BL.meter('How round it is');
      aux.appendChild(h('section', { class: 'panel' }, statusP, h('div', { class: 'meters' }, stretchM.el, roundM.el),
        h('div', { class: 'legend' }, h('span', { class: 'fn-chip', style: '--c: var(--fn-struct)' }, 'membrane, scaffold and wall are all structure'))));
      const mem = BL.stage(h('div'), '2.2 / 1', { label: 'A cross-section of the plasma membrane. Two layers of phospholipids, with their heads facing the water above and below and their tails hidden in the middle, and a few large proteins spanning both layers. Everything slides sideways. You can drag a lipid.', focusable: true });
      mem.wrap.classList.add('flat');
      const memSay = h('p', { class: 'status', 'aria-live': 'polite' }, 'Drag a lipid sideways, or try to turn one over.');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'The membrane up close'), mem.wrap, memSay,
        h('p', { class: 'hint' }, 'Heads face the water on both sides and the tails hide in the oily middle. Everything slides about in its own layer — the fluid mosaic — and nothing leaves.')));

      /* ---------------- the membrane up close ---------------- */
      const M = { top: [], bot: [], prot: [{ x: 6, w: 3.4, vx: 0.18 }, { x: 15, w: 3.4, vx: -0.12 }], W: 24, grab: null, flipTried: false, flash: 0 };
      for (let i = 0; i < 18; i++) { M.top.push({ x: i * (M.W / 18) + 0.4, dy: 0 }); M.bot.push({ x: i * (M.W / 18) + 0.9, dy: 0 }); }
      function memStep(dt) {
        const sp = (L) => {
          L.forEach((o) => { if (M.grab && M.grab.o === o) return; o.x += BL.randn() * 1.2 * Math.sqrt(dt); o.dy *= Math.exp(-9 * dt); });
          M.prot.forEach((p) => { p.x += (p.vx + BL.randn() * 0.25) * dt; p.x = (p.x + M.W) % M.W; });
          // keep out of the proteins and off each other, round a ring
          for (let it = 0; it < 4; it++) {
            L.sort((a, b) => a.x - b.x);
            for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length], dx = ((b.x - a.x) + M.W) % M.W; if (dx < 1.0 && L.length > 1) { const push = (1.0 - dx) / 2; if (!(M.grab && M.grab.o === a)) a.x -= push; if (!(M.grab && M.grab.o === b)) b.x += push; } }
            L.forEach((o) => { M.prot.forEach((p) => { let d = o.x - p.x; d -= Math.round(d / M.W) * M.W; const lim = p.w / 2 + 0.5; if (Math.abs(d) < lim && !(M.grab && M.grab.o === o)) o.x = p.x + Math.sign(d || 1) * lim; }); o.x = (o.x + M.W) % M.W; });
          }
        };
        sp(M.top); sp(M.bot);
      }
      BL.drag(mem.canvas, {
        pick: (p) => {
          const g = M.geo; if (!g) return null;
          let best = null, bd = 16;
          [['top', M.top], ['bot', M.bot]].forEach(([k, L]) => L.forEach((o) => { const x = g.x0 + o.x * g.sx, y = (k === 'top' ? g.yTop : g.yBot) + o.dy; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = { o, layer: k, y0: p.y, x0: p.x }; } }));
          return best;
        },
        move: (a, p) => { const g = M.geo; M.grab = a; a.o.x = (p.x - g.x0) / g.sx; a.o.x = (a.o.x + M.W) % M.W; a.o.dy = clamp((p.y - a.y0) * 0.35, -g.maxdy, g.maxdy); S.hinted = true; if (Math.abs(p.y - a.y0) > 30) M.flipTried = true; },
        end: (a) => { M.grab = null; if (M.flipTried) { M.flipTried = false; M.flash = 1; memSay.textContent = 'It snapped back. A phospholipid cannot turn over: its water-loving head would have to be dragged through the oily middle.'; steps.done('flip'); } else memSay.textContent = 'It slides, and the layer closes up round it. Nothing comes apart.'; },
      });
      function drawMem(dt) {
        const c = mem.ctx, W = mem.w, H = mem.h, pal = BL.pal; if (!W) return;
        memStep(dt);
        c.clearRect(0, 0, W, H);
        const x0 = 12, sx = (W - 24) / M.W, yMid = H / 2, gap = Math.min(H * 0.34, 54), yTop = yMid - gap / 2 - 4, yBot = yMid + gap / 2 + 4;
        M.geo = { x0, sx, yTop, yBot, maxdy: gap * 0.55 };
        c.fillStyle = BL.alpha(pal.neg, pal.dark ? 0.14 : 0.1); c.fillRect(0, 0, W, yTop - 16); c.fillRect(0, yBot + 16, W, H - yBot - 16);
        c.fillStyle = BL.alpha(pal.fn.store, pal.dark ? 0.16 : 0.12); c.fillRect(0, yTop + 8, W, yBot - yTop - 16);
        c.fillStyle = pal.muted; c.font = BL.font(600, 12); c.textAlign = 'right';
        c.fillText('water', W - 8, 16); c.fillText('water', W - 8, H - 8); c.fillText('oily middle', W - 8, yMid + 4);
        const lipid = (o, dir, y0) => {
          const x = x0 + o.x * sx, y = y0 + o.dy, r = 5.5;
          c.strokeStyle = pal.fn.store; c.lineWidth = 2.4; c.lineCap = 'round';
          [-2.2, 2.2].forEach((k) => { c.beginPath(); c.moveTo(x + k, y + dir * r); c.lineTo(x + k * 1.2, y + dir * (r + 18)); c.stroke(); });
          const g = c.createRadialGradient(x - 2, y - 2 - (dir < 0 ? 0 : 0), 1, x, y, r); g.addColorStop(0, BL.mixHex(pal.fn.struct, '#ffffff', 0.4)); g.addColorStop(1, pal.fn.struct);
          c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill();
          if (M.grab && M.grab.o === o) { c.strokeStyle = pal.fg; c.lineWidth = 2; c.stroke(); }
        };
        M.top.forEach((o) => lipid(o, 1, yTop)); M.bot.forEach((o) => lipid(o, -1, yBot));
        M.prot.forEach((p) => {
          const x = x0 + p.x * sx, w = p.w * sx, y1 = yTop - 14, y2 = yBot + 14;
          c.fillStyle = BL.alpha(pal.fn.protein, 0.88); c.strokeStyle = pal.fn.protein; c.lineWidth = 2;
          c.beginPath(); c.roundRect(x - w / 2, y1, w, y2 - y1, 10); c.fill(); c.stroke();
        });
        if (M.flash > 0) { M.flash -= dt * 1.2; c.fillStyle = BL.alpha(pal.pos, 0.18 * M.flash); c.fillRect(0, yTop - 20, W, yBot - yTop + 40); }
        if (!S.hinted && !BL.reduced) BL.label(c, 'drag a lipid', W / 2, 18, { font: BL.font(700, 13), border: pal.ui });
      }

      /* ---------------- pointer on the cell ---------------- */
      const toWorld = (p) => ({ x: (p.x - S.geo.cx) / S.geo.u, y: (p.y - S.geo.cy) / S.geo.u });
      BL.drag(stage.canvas, {
        pick: (p) => {
          if (S.burst) return null;
          const w = toWorld(p); let best = -1, bd = 0.2;
          for (let i = 0; i < N; i++) { const d = Math.hypot(S.pts[i].x - w.x, S.pts[i].y - w.y); if (d < bd) { bd = d; best = i; } }
          return best >= 0 ? { i: best } : null;
        },
        move: (a, p) => { const w = toWorld(p); S.grab = { i: a.i, x: w.x, y: w.y }; S.hinted = true; },
        end: () => { if (S.skel && S.maxDisp > 0.28) S.poked = true; S.grab = null; S.maxDisp = 0; },
      });
      stage.canvas.addEventListener('pointermove', (e) => { if (S.grab) return; const r = stage.canvas.getBoundingClientRect(), w = toWorld({ x: e.clientX - r.left, y: e.clientY - r.top }); stage.canvas.style.cursor = !S.burst && S.pts.slice(0, N).some((q) => Math.hypot(q.x - w.x, q.y - w.y) < 0.2) ? 'grab' : ''; });

      /* ---------------- frame ---------------- */
            function frame(dt) {
        const cw = stage.w, chh = stage.h, pal = BL.pal; if (!cw) return;
        S.t += dt;
        const sub = 8, h2 = Math.min(dt, 0.033) / sub;
        for (let i = 0; i < sub; i++) physics(h2);
        if (S.grab) { const q = S.pts[S.grab.i], t = S.T[S.grab.i]; S.maxDisp = Math.max(S.maxDisp, Math.hypot(q.x - t.x, q.y - t.y)); }
        drawMem(dt);
        const u = Math.min(cw / 3.2, chh / 2.3); S.geo = { cx: cw / 2, cy: chh / 2, u };
        ctx.clearRect(0, 0, cw, chh);
        // stretch and roundness
        let per = 0; for (let i = 0; i < N; i++) { const a = S.pts[i], b = S.pts[(i + 1) % N]; per += Math.hypot(a.x - b.x, a.y - b.y); }
        const stretch = per / S.L0 - 1;
        if (!S.burst && stretch > BURST && !S.wall) { S.burst = 1; S.burstT = 0; S.pts.forEach((p) => { p.vx += (Math.random() - 0.5) * 4 + p.x * 4; p.vy += (Math.random() - 0.5) * 4 + p.y * 4; }); steps.done('burst'); say('The membrane tore. It stretched past what it can take.'); }
        if (S.burst) S.burstT += dt;
        const cxm = S.pts.slice(0, N).reduce((s, p) => s + p.x, 0) / N, cym = S.pts.slice(0, N).reduce((s, p) => s + p.y, 0) / N;
        const rs = S.pts.slice(0, N).map((p) => Math.hypot(p.x - cxm, p.y - cym)), round = Math.min(...rs) / Math.max(...rs);

        // the wall
        if (S.wall) {
          const { hx, hy, rc } = WALL;
          ctx.save(); ctx.strokeStyle = pal.fn.struct; ctx.lineWidth = 12; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.roundRect(S.geo.cx - (hx + 0.07) * u, S.geo.cy - (hy + 0.07) * u, (hx + 0.07) * 2 * u, (hy + 0.07) * 2 * u, (rc + 0.07) * u); ctx.stroke();
          ctx.strokeStyle = BL.alpha(pal.fn.struct, 0.35); ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(S.geo.cx - (hx + 0.16) * u, S.geo.cy - (hy + 0.16) * u, (hx + 0.16) * 2 * u, (hy + 0.16) * 2 * u, (rc + 0.16) * u); ctx.stroke(); ctx.restore();
        }
        // the cell body
        const P = (i) => ({ x: S.geo.cx + S.pts[i].x * u, y: S.geo.cy + S.pts[i].y * u });
        ctx.save(); ctx.globalAlpha = S.burst ? Math.max(0, 1 - S.burstT * 0.7) : 1;
        ctx.beginPath(); for (let i = 0; i < N; i++) { const a = P(i), b = P((i + 1) % N), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; if (i === 0) { const z = P(N - 1); ctx.moveTo((z.x + a.x) / 2, (z.y + a.y) / 2); } ctx.quadraticCurveTo(a.x, a.y, mx, my); } ctx.closePath();
        ctx.fillStyle = BL.alpha(BL.mixHex(pal.panel, pal.neg, 0.28), 0.9); ctx.fill();
        ctx.restore();
        // the scaffold
        if (S.skel && !S.burst) {
          ctx.strokeStyle = BL.alpha(pal.fn.struct, 0.55); ctx.lineWidth = 2;
          S.struts.forEach(([i, j, , k]) => { if ((k > 1 && i % 2 === 0) || (k === 1 && j === (i + 14) % N && i % 3 === 0)) { const a = P(i), b = P(j); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } });
        }
        // the membrane
        ctx.save(); ctx.globalAlpha = S.burst ? Math.max(0, 1 - S.burstT * 0.7) : 1;
        const hot = clamp(stretch / BURST, 0, 1) ** 2;
        ctx.strokeStyle = BL.mixHex(pal.fn.struct, pal.pos, hot * 0.9); ctx.lineWidth = 7 - 3 * hot; ctx.lineJoin = 'round';
        ctx.beginPath(); for (let i = 0; i < N; i++) { const a = P(i), b = P((i + 1) % N), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; if (i === 0) { const z = P(N - 1); ctx.moveTo((z.x + a.x) / 2, (z.y + a.y) / 2); } ctx.quadraticCurveTo(a.x, a.y, mx, my); } ctx.closePath(); ctx.stroke();
        // a nucleus, so there is a "middle" to see
        if (!S.burst) { const q = P(HUB); const g = ctx.createRadialGradient(q.x - 5, q.y - 5, 2, q.x, q.y, 24); g.addColorStop(0, BL.mixHex(pal.fn.genetic, '#ffffff', 0.4)); g.addColorStop(1, pal.fn.genetic); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, 22, 0, 6.2832); ctx.fill(); }
        ctx.restore();
        if (S.grab) { const g = P(S.grab.i); ctx.strokeStyle = pal.fg; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]); }
        if (!S.hinted && !BL.reduced) BL.label(ctx, 'drag the edge of the cell inward', cw / 2, 24, { font: BL.font(700, 14), border: pal.ui });

        // goals and words
        if (S.poked && !S.grab) { S.poked = false; steps.done('poke'); }
        if (!S.skel && !S.wall && !S.burst && round > 0.8) { S.roundT += dt; if (S.roundT > 2.5) steps.done('noskel'); } else if (S.skel || S.wall) S.roundT = 0;
        if (S.wall && !S.burst && S.w > 0.6 && S.contact > 0.3) { S.wallT += dt; if (S.wallT > 2) steps.done('wall'); } else S.wallT = 0;
        if (S.wall && !S.burst && S.w < 0.2) { let far = 0; for (let i = 0; i < N; i++) { const p = S.pts[i]; const dx = Math.max(0, Math.abs(p.x) - (WALL.hx - WALL.rc)), dy = Math.max(0, Math.abs(p.y) - (WALL.hy - WALL.rc)); const inCorner = dx > 0 && dy > 0; const gap = inCorner ? WALL.rc - Math.hypot(dx, dy) : Math.min(WALL.hx - Math.abs(p.x), WALL.hy - Math.abs(p.y)); if (gap > 0.18) far++; } if (far / N > 0.7) { S.wiltT += dt; if (S.wiltT > 2) steps.done('wilt'); } else S.wiltT = 0; } else S.wiltT = 0;
        stretchM.set(clamp(stretch / BURST, 0, 1), S.burst ? 'torn' : stretch < 0.04 ? 'slack' : stretch < 0.2 ? 'taut' : 'about to tear'); stretchM.tone(BL.mixHex(pal.fn.struct, pal.pos, hot));
        roundM.set(round, round > 0.93 ? 'a ball' : round > 0.75 ? 'rounded' : 'its own shape'); roundM.tone(pal.fn.struct);
        stage.canvas.dataset.round = round.toFixed(2); stage.canvas.dataset.stretch = stretch.toFixed(3);
        const now = S.burst ? 'The membrane tore, and the cell is gone. Press “A fresh cell”.' : S.wall ? (S.contact > 0.5 ? 'The membrane is pressed out against the wall. The cell is firm, and the wall is taking the strain.' : 'There is a wall, but the cell is too slack to reach it: the membrane has pulled away.') : !S.skel ? 'No scaffold, so the water pushes the cell into a ball.' : 'The scaffold holds the cell in its own shape. Poke it and let go.';
        if (now !== S.lastSay) { S.lastSay = now; say(now); }
      }
      function say(t) { statusP.textContent = t; }
      if (window.__BL_TEST) window.__BL_TEST['shape'] = S;   // lets a test page find things by their real coordinates
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); mem.destroy(); } };
    },
  });
})();
