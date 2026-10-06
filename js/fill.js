/* Fill: atoms want their outer ring full.
   Each puzzle gives you a few atoms with their outer electrons. Drag an
   electron onto another atom to give it away, or into the space between two
   atoms to share it. An atom is happy when its outer ring is full: 2 for
   hydrogen, 8 for the others. An atom that has given everything away is also
   happy, because the ring underneath is already full.

   Electrons in the space between atoms count for both of them. Nothing here
   tells you which kind of bond to make: only some arrangements work, and
   which ones depends on the atoms. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const A = BL.atoms;

  /* grid: cols x rows; each atom sits on a grid cell; links are the gaps where atoms can share */
  const PUZZLES = [
    { id: 'nacl', name: 'Na + Cl', cols: 2, rows: 1, atoms: [['Na', 0, 0], ['Cl', 1, 0]], links: [[0, 1]] },
    { id: 'hh', name: 'H + H', cols: 2, rows: 1, atoms: [['H', 0, 0], ['H', 1, 0]], links: [[0, 1]] },
    { id: 'clcl', name: 'Cl + Cl', cols: 2, rows: 1, atoms: [['Cl', 0, 0], ['Cl', 1, 0]], links: [[0, 1]] },
    { id: 'lif', name: 'Li + F', cols: 2, rows: 1, atoms: [['Li', 0, 0], ['F', 1, 0]], links: [[0, 1]] },
    { id: 'hcl', name: 'H + Cl', cols: 2, rows: 1, atoms: [['H', 0, 0], ['Cl', 1, 0]], links: [[0, 1]] },
    { id: 'mgo', name: 'Mg + O', cols: 2, rows: 1, atoms: [['Mg', 0, 0], ['O', 1, 0]], links: [[0, 1]] },
    { id: 'oo', name: 'O + O', cols: 2, rows: 1, atoms: [['O', 0, 0], ['O', 1, 0]], links: [[0, 1]] },
    { id: 'nn', name: 'N + N', cols: 2, rows: 1, atoms: [['N', 0, 0], ['N', 1, 0]], links: [[0, 1]] },
    { id: 'h2o', name: 'H + O + H', cols: 3, rows: 1, atoms: [['H', 0, 0], ['O', 1, 0], ['H', 2, 0]], links: [[0, 1], [1, 2]] },
    { id: 'cacl2', name: 'Cl + Ca + Cl', cols: 3, rows: 1, atoms: [['Cl', 0, 0], ['Ca', 1, 0], ['Cl', 2, 0]], links: [[0, 1], [1, 2]] },
    { id: 'ch4', name: 'C with four H', cols: 3, rows: 3, atoms: [['C', 1, 1], ['H', 1, 0], ['H', 2, 1], ['H', 1, 2], ['H', 0, 1]], links: [[0, 1], [0, 2], [0, 3], [0, 4]] },
  ];
  const GOALS = [
    { id: 'first', text: 'Fill every atom’s outer ring in one puzzle.' },
    { id: 'give', text: 'Solve one by giving electrons away.' },
    { id: 'share', text: 'Solve one by sharing electrons.' },
    { id: 'double', text: 'Make two atoms share two pairs of electrons.' },
    { id: 'triple', text: 'Make two atoms share three pairs.' },
    { id: 'water', text: 'Build a water molecule.' },
    { id: 'six', text: 'Solve six different puzzles.' },
  ];
  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" opacity=".85"><circle cx="64" cy="60" r="30"/><circle cx="136" cy="60" r="30" stroke-dasharray="6 5"/></g>' +
    '<ellipse cx="100" cy="60" rx="14" ry="24" fill="var(--wash)" stroke="var(--ui)" stroke-width="2.5"/><circle cx="100" cy="52" r="6" fill="var(--electron)"/><circle cx="100" cy="68" r="6" fill="var(--electron)"/></svg>';
  const capOf = (el) => (A.shellsN(el.Z).length === 1 ? 2 : 8);
  const ink = (hex) => { const [r, g, b] = BL.rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#10202a' : '#ffffff'; };

  BL.register({
    id: 'fill', field: 'atoms', order: 4, name: 'Fill',
    tagline: 'Give them away or share them: make every ring full.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        pi: 0, atoms: [], zones: [], el: [], drag: null, solved: new Set(BL.store.get('fill.solved', []) || []),
        won: false, moves: 0, hinted: false,
      };
      const stage = BL.stage(stageHost, '3 / 2', {
        label: 'Atoms drawn as a core inside a ring of slots for outer electrons. Drag an electron onto another atom to give it, or into the space between two atoms to share it. The move controls in the side panel do the same without dragging.',
        focusable: true,
      });
      stage.wrap.classList.add('fill-stage');
      const ctx = stage.ctx;

      /* ---------------- puzzle setup ---------------- */
      function load(i) {
        S.pi = i; S.won = false; S.moves = 0; S.drag = null;
        const P = PUZZLES[i];
        stage.wrap.style.aspectRatio = P.rows === 3 ? '1.15 / 1' : P.cols === 3 ? '2.3 / 1' : '2 / 1';
        stage.wrap.classList.toggle('tall', P.rows === 3);
        S.atoms = P.atoms.map(([sym, gx, gy]) => { const e = A.bySym[sym]; return { sym, e, gx, gy, val: A.valenceN(e.Z), cap: capOf(e), x: 0, y: 0, r: 0 }; });
        S.zones = P.links.map(([a, b]) => ({ a, b, cx: 0, cy: 0, len: 0, ux: 1, uy: 0 }));
        S.el = [];
        S.atoms.forEach((a, ai) => { for (let k = 0; k < a.val; k++) S.el.push({ loc: { t: 'a', i: ai }, x: null, y: null }); });
        buildSelects(); sync(); say('Pick up an electron and drop it where it should go.');
        chips.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      }
      const own = (ai) => S.el.filter((e) => e.loc.t === 'a' && e.loc.i === ai).length;
      const inZone = (zi) => S.el.filter((e) => e.loc.t === 'z' && e.loc.i === zi).length;
      const shared = (ai) => S.zones.reduce((s, z, zi) => s + (z.a === ai || z.b === ai ? inZone(zi) : 0), 0);
      const total = (ai) => own(ai) + shared(ai);
      const full = (ai) => { const a = S.atoms[ai], T = total(ai); return T === a.cap || (T === 0 && A.isFull(a.e.Z - a.val)); };
      const charge = (ai) => S.atoms[ai].val - own(ai) - shared(ai) / 2;

      /* ---------------- dock ---------------- */
      const chips = PUZZLES.map((P, i) => h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => load(i) }, P.name));
      dock.appendChild(h('section', {}, h('h2', {}, 'Puzzle'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Choose a puzzle' }, chips)));

      const fromSel = h('select', { 'aria-label': 'Take an electron from' });
      const toSel = h('select', { 'aria-label': 'Put it on' });
      const moveBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => { const f = parse(fromSel.value), t = parse(toSel.value); if (f && t) tryMove(S.el.find((e) => same(e.loc, f) ), t); } }, 'Move one electron');
      const resetBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => load(S.pi) }, 'Start over');
      const nextBtn = h('button', { type: 'button', class: 'action', onclick: () => load((S.pi + 1) % PUZZLES.length) }, 'Next puzzle');
      dock.appendChild(h('section', {},
        h('h2', {}, 'Move without dragging'),
        h('label', { class: 'sel' }, h('span', {}, 'Take one from'), fromSel),
        h('label', { class: 'sel' }, h('span', {}, 'Put it on'), toSel),
        h('div', { class: 'actions' }, moveBtn, resetBtn)));
      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'fill', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- aux ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const ledger = h('ul', { class: 'ledger' });
      const note = h('p', { class: 'hint' }, 'Electrons in the space between two atoms count for both of them.');
      const doneBox = h('div', { class: 'wonbox', hidden: true });
      aux.appendChild(h('section', { class: 'panel' }, statusP, ledger, note, doneBox));
      function say(t) { statusP.textContent = t; }

      /* where a place is: {t:'a', i} or {t:'z', i} */
      const same = (a, b) => a.t === b.t && a.i === b.i;
      const parse = (v) => { const [t, i] = v.split(':'); return { t, i: +i }; };
      const placeName = (p) => (p.t === 'a' ? S.atoms[p.i].sym + (S.atoms.filter((a) => a.sym === S.atoms[p.i].sym).length > 1 ? ' #' + (S.atoms.slice(0, p.i + 1).filter((a) => a.sym === S.atoms[p.i].sym).length) : '')
        : 'the space between ' + placeName({ t: 'a', i: S.zones[p.i].a }) + ' and ' + placeName({ t: 'a', i: S.zones[p.i].b }));
      function buildSelects() {
        const opts = [];
        S.atoms.forEach((a, i) => opts.push({ v: 'a:' + i, p: { t: 'a', i } }));
        S.zones.forEach((z, i) => opts.push({ v: 'z:' + i, p: { t: 'z', i } }));
        [fromSel, toSel].forEach((sel) => { sel.textContent = ''; opts.forEach((o) => sel.appendChild(h('option', { value: o.v }, placeName(o.p)))); });
        if (toSel.options.length > 1) toSel.selectedIndex = 1;
      }

      /* ---------------- rules ---------------- */
      function room(loc, moving) {
        // would the move leave every atom within its limit?
        const sim = S.el.map((e) => (e === moving ? { loc } : e));
        const cnt = (ai) => sim.filter((e) => e.loc.t === 'a' && e.loc.i === ai).length + S.zones.reduce((s, z, zi) => s + (z.a === ai || z.b === ai ? sim.filter((e) => e.loc.t === 'z' && e.loc.i === zi).length : 0), 0);
        if (loc.t === 'z' && sim.filter((e) => e.loc.t === 'z' && e.loc.i === loc.i).length > 6) return false;
        return S.atoms.every((a, i) => cnt(i) <= a.cap) && (loc.t !== 'a' || sim.filter((e) => e.loc.t === 'a' && e.loc.i === loc.i).length <= S.atoms[loc.i].cap);
      }
      function tryMove(e, loc) {
        if (!e) { say('There is no electron there to move.'); return false; }
        if (same(e.loc, loc)) return false;
        if (!room(loc, e)) { say('No room: ' + placeName(loc) + ' already has all the electrons it can hold.'); return false; }
        e.loc = loc; S.moves++; S.hinted = true; sync(); return true;
      }

      function sync() {
        ledger.textContent = '';
        S.atoms.forEach((a, i) => {
          const T = total(i), ch = charge(i), ok = full(i);
          const chs = ch === 0 ? '' : '  ·  charge ' + (ch > 0 ? '+' : '−') + Math.abs(ch);
          ledger.appendChild(h('li', { class: ok ? 'ok' : '' },
            h('span', { class: 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '○'),
            h('span', {}, h('b', {}, placeName({ t: 'a', i })), ' · ' + (T === 0 && ok ? 'nothing left in the outer ring, the ring underneath is full' : T + ' of ' + a.cap + ' in the outer ring') + (ok ? ' · full' : '') + chs)));
        });
        const ok = S.atoms.every((_, i) => full(i));
        if (ok && !S.won) win(); else if (!ok) { S.won = false; doneBox.hidden = true; }
      }
      function win() {
        S.won = true;
        const P = PUZZLES[S.pi];
        const ions = S.atoms.some((_, i) => charge(i) !== 0), zoneE = S.zones.reduce((s, _, zi) => s + inZone(zi), 0);
        S.solved.add(P.id); BL.store.set('fill.solved', [...S.solved]);
        paintSolved();
        goals.done('first');
        let text;
        if (ions && !zoneE) { text = 'Every ring is full. The atoms are now charged: opposite charges pull on each other, and that pull is the bond.'; goals.done('give'); }
        else if (!ions) { text = 'Every ring is full, and nobody is charged. The shared electrons hold the atoms together.'; goals.done('share'); }
        else { text = 'Every ring is full, with some charged atoms and some sharing.'; goals.done('give'); goals.done('share'); }
        if (!ions && P.id === 'oo') goals.done('double'); if (!ions && P.id === 'nn') goals.done('triple'); if (!ions && P.id === 'h2o') goals.done('water');
        if (S.solved.size >= 6) goals.done('six');
        say('All filled in ' + S.moves + ' ' + (S.moves === 1 ? 'move' : 'moves') + '.');
        doneBox.textContent = ''; doneBox.hidden = false;
        doneBox.appendChild(h('p', {}, text));
        doneBox.appendChild(nextBtn);
      }
      function paintSolved() { chips.forEach((b, k) => { const on = S.solved.has(PUZZLES[k].id); b.classList.toggle('solved', on); b.setAttribute('aria-label', PUZZLES[k].name + (on ? ' (solved)' : '')); }); }
      paintSolved();

      /* ---------------- layout ---------------- */
      function layout() {
        const P = PUZZLES[S.pi], W = stage.w, H = stage.h;
        const cellW = W / P.cols, cellH = H / P.rows, r = Math.min(cellW, cellH) * (P.cols === 3 && P.rows === 3 ? 0.27 : P.cols === 3 ? 0.31 : 0.3);
        S.atoms.forEach((a) => { a.x = (a.gx + 0.5) * cellW; a.y = (a.gy + 0.5) * cellH + (P.rows === 1 ? 6 : 0); a.r = r; });
        S.zones.forEach((z) => {
          const A0 = S.atoms[z.a], B0 = S.atoms[z.b], dx = B0.x - A0.x, dy = B0.y - A0.y, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
          const sx = A0.x + ux * A0.r * 1.08, sy = A0.y + uy * A0.r * 1.08, ex = B0.x - ux * B0.r * 1.08, ey = B0.y - uy * B0.r * 1.08;
          z.sx = sx; z.sy = sy; z.ux = ux; z.uy = uy; z.len = Math.hypot(ex - sx, ey - sy); z.cx = (sx + ex) / 2; z.cy = (sy + ey) / 2;
        });
      }
      function target(e, idx) {
        if (e.loc.t === 'a') {
          const a = S.atoms[e.loc.i], ang = idx * 2 * Math.PI / a.cap - Math.PI / 2;
          return [a.x + Math.cos(ang) * a.r, a.y + Math.sin(ang) * a.r];
        }
        const z = S.zones[e.loc.i], col = idx >> 1, row = idx & 1, along = z.len * (col + 0.5) / 3, off = row ? -12 : 12;
        return [z.sx + z.ux * along - z.uy * off, z.sy + z.uy * along + z.ux * off];
      }
      function slotOf(e) { return S.el.filter((o) => same(o.loc, e.loc)).indexOf(e); }

      /* ---------------- dragging ---------------- */
      BL.drag(stage.canvas, {
        pick: (p) => {
          layout();
          let best = null, bd = 22;
          S.el.forEach((e) => { if (e.x == null) return; const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < bd) { bd = d; best = e; } });
          return best ? { e: best } : null;
        },
        move: (a, p, start) => { S.drag = { e: a.e, x: p.x, y: p.y }; S.hinted = true; },
        end: (a, p) => {
          const e = a.e; S.drag = null; layout();
          let loc = null, bd = 1e9;
          S.atoms.forEach((at, i) => { const d = Math.hypot(p.x - at.x, p.y - at.y); if (d < at.r * 1.3 && d < bd) { bd = d; loc = { t: 'a', i }; } });
          if (!loc) S.zones.forEach((z, i) => { const d = Math.hypot(p.x - z.cx, p.y - z.cy); const lim = Math.max(z.len / 2 + 10, 34); if (d < lim && d < bd) { bd = d; loc = { t: 'z', i }; } });
          if (loc) tryMove(e, loc);
        },
      });
      stage.canvas.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); moveBtn.click(); } });

      /* ---------------- drawing ---------------- */
      function frame(dt) {
        const pal = BL.pal, W = stage.w, H = stage.h, f = BL.fs(13);
        layout(); ctx.clearRect(0, 0, W, H);

        // bond zones
        S.zones.forEach((z, zi) => {
          const n = inZone(zi), ang = Math.atan2(z.uy, z.ux), wd = 46;
          ctx.save(); ctx.translate(z.cx, z.cy); ctx.rotate(ang);
          ctx.beginPath(); ctx.roundRect(-z.len / 2, -wd / 2, z.len, wd, wd / 2);
          ctx.fillStyle = n ? BL.alpha(pal.ui, pal.dark ? 0.2 : 0.15) : BL.alpha(pal.ui, 0.06); ctx.fill();
          ctx.setLineDash([6, 6]); ctx.lineWidth = 2.5; ctx.strokeStyle = n ? pal.ui : pal.line2; ctx.stroke(); ctx.setLineDash([]);
          ctx.restore();
          if (n === 0 && !S.hinted) BL.label(ctx, 'share here', z.cx, z.cy - wd / 2 - 14, { font: BL.font(700, 13), border: pal.ui });
        });

        // atoms
        S.atoms.forEach((a, i) => {
          const ok = full(i), ch = charge(i), T = total(i);
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 7); ctx.lineWidth = ok ? 4 : 2.5;
          ctx.strokeStyle = ok ? pal.ui : pal.line2; ctx.setLineDash(ok ? [] : [5, 6]); ctx.stroke(); ctx.setLineDash([]);
          // empty slots
          for (let k = own(i); !ok && k < a.cap; k++) {
            const ang = k * 2 * Math.PI / a.cap - Math.PI / 2;
            ctx.beginPath(); ctx.arc(a.x + Math.cos(ang) * a.r, a.y + Math.sin(ang) * a.r, 8, 0, 7); ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.strokeStyle = pal.muted; ctx.stroke(); ctx.setLineDash([]);
          }
          // the core
          const cr = a.r * 0.44, fill = BL.mix(pal.panel2 || pal.panel, pal.pos, 0.18);
          ctx.beginPath(); ctx.arc(a.x, a.y, cr, 0, 7); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = pal.pos; ctx.stroke();
          ctx.fillStyle = pal.fg; ctx.textAlign = 'center'; ctx.font = BL.font(800, 22, true); ctx.fillText(a.sym, a.x, a.y + 2);
          ctx.font = BL.font(700, 13); ctx.fillStyle = pal.muted; ctx.fillText('core +' + a.val, a.x, a.y + 2 + BL.fs(13) * 1.35);
          // status under the atom
          const below = a.y + a.r + f * 1.6;
          const txt = ok ? '✓ full' : T + ' of ' + a.cap;
          const blocked = S.zones.some((z) => (z.a === i && z.uy > 0.6) || (z.b === i && z.uy < -0.6));
          BL.label(ctx, txt, blocked ? a.x + a.r * 1.15 : a.x, blocked ? a.y + a.r * 0.95 : below, { font: BL.font(700, 13), border: ok ? pal.ui : pal.line2, color: pal.fg });
          if (ch !== 0) {
            const bx = a.x + a.r * 0.78, by = a.y - a.r * 0.78, col = ch > 0 ? pal.pos : pal.neg;
            ctx.beginPath(); ctx.arc(bx, by, 15, 0, 7); ctx.fillStyle = col; ctx.fill();
            ctx.fillStyle = ink(col); ctx.font = BL.font(800, 15); ctx.textBaseline = 'middle'; ctx.fillText((ch > 0 ? '+' : '−') + (Math.abs(ch) === 1 ? '' : Math.abs(ch)), bx, by + 1); ctx.textBaseline = 'alphabetic';
          }
        });

        // the pull between charged atoms once things have settled
        if (S.won) {
          S.zones.forEach((z) => {
            const a = S.atoms[z.a], b = S.atoms.indexOf(S.atoms[z.b]);
            const ca = charge(z.a), cb = charge(z.b);
            if (ca * cb < 0) {
              ctx.strokeStyle = pal.fg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(z.sx + z.ux * 6, z.sy + z.uy * 6 - 0); ctx.lineTo(z.sx + z.ux * (z.len - 6), z.sy + z.uy * (z.len - 6)); ctx.stroke();
              BL.label(ctx, '+ and − stick', z.cx, z.cy - 34, { font: BL.font(700, 13), border: pal.fg });
            }
          });
        }

        // electrons
        const cnt = new Map();
        S.el.forEach((e) => {
          const key = e.loc.t + e.loc.i; const idx = cnt.get(key) || 0; cnt.set(key, idx + 1);
          const [tx, ty] = target(e, idx);
          if (e.x == null || BL.reduced) { e.x = tx; e.y = ty; } else { const k = 1 - Math.exp(-dt * 16); e.x += (tx - e.x) * k; e.y += (ty - e.y) * k; }
        });
        const order = S.el.slice().sort((a, b) => (S.drag && S.drag.e === a ? 1 : 0) - (S.drag && S.drag.e === b ? 1 : 0));
        order.forEach((e) => {
          const dragging = S.drag && S.drag.e === e, x = dragging ? S.drag.x : e.x, y = dragging ? S.drag.y : e.y;
          ctx.beginPath(); ctx.arc(x, y, dragging ? 12 : 9.5, 0, 7); ctx.fillStyle = pal.electron; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = dragging ? pal.fg : pal.panel; ctx.stroke();
        });
        if (!S.hinted && !BL.reduced && S.el.length) {
          const e0 = S.el[S.el.length - 1], pulse = 1 + 0.2 * Math.sin(performance.now() / 260);
          if (e0.x != null) { ctx.beginPath(); ctx.arc(e0.x, e0.y, 19 * pulse, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = pal.fg; ctx.stroke(); }
        }
        if (S.won) BL.label(ctx, 'Every ring is full', W / 2, 28 + f * 0.5, { font: BL.font(800, 16), border: pal.ui, color: pal.fg });
      }

      const loop = BL.loop(frame);
      load(0); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
