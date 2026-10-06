/* Spectrum: one dial, from sharing to handing over, and everything that follows.

   The usual way this gets taught is as a box of unrelated names — covalent,
   ionic, hydrogen bond, dipole–dipole, van der Waals — as if they were five
   different things. They are one thing seen at five settings of one dial:
   how unevenly a pair of atoms shares its electrons.

   So this instrument is a rail. Slide along it and the picture changes with
   no seams: an even cloud in the middle of two atoms, then a cloud that leans,
   then a cloud that has simply moved in with one of them. Nothing jumps. The
   names appear over whichever stretch you are standing on.

   The second half is the part that normally goes missing. Once a bond is
   uneven, the molecule has ends — a δ+ end and a δ− end — and those ends can
   reach OTHER molecules. That is where hydrogen bonds, dipole–dipole and
   ion–dipole come from. They are not a separate topic. They are the leftovers
   of the same unevenness, acting outside the molecule instead of inside it.
   So you can park a neighbour next to the molecule and watch which hold forms,
   and the answer changes as you slide the same rail.

   The numbers (kJ/mol) line up with the wells in js/physics.js on purpose, so
   a learner who goes to The Well afterwards meets the same depths again. */
(function () {
  'use strict';
  const { h, clamp, lerp, randn } = BL;

  /* Pauling electronegativity and a rough covalent radius (Å). */
  const EL = {
    K: { en: 0.82, r: 2.03 }, Na: { en: 0.93, r: 1.66 }, Li: { en: 0.98, r: 1.28 },
    Mg: { en: 1.31, r: 1.41 }, H: { en: 2.20, r: 0.31 }, C: { en: 2.55, r: 0.76 },
    Br: { en: 2.96, r: 1.20 }, N: { en: 3.04, r: 0.71 }, Cl: { en: 3.16, r: 1.02 },
    O: { en: 3.44, r: 0.66 }, F: { en: 3.98, r: 0.57 },
  };
  /* Pauling's own estimate of how ionic a bond is, from the difference in pull. */
  const icOf = (d) => 1 - Math.exp(-0.25 * d * d);
  const DEN_MAX = 3.4;
  /* Where books draw the line between "very polar" and "ionic": a difference
     in pull of about 1.9, which on Pauling's own curve is this much unevenness.
     It is a convention, not a cliff, and the rail shows the curve running
     straight through it. Sodium chloride lands just the far side of it, which
     is the answer anyone would expect of table salt. */
  const IONIC_AT = 0.63;

  /* Real pairs, as ticks along the rail. hb: this pair puts a hydrogen on an
     N, O or F, which is the only place a hydrogen bond ever comes from. */
  const PAIRS = [
    { a: 'H', b: 'H', name: 'H–H', note: 'hydrogen gas', max: 3 },
    { a: 'Cl', b: 'Cl', name: 'Cl–Cl', note: 'chlorine gas', max: 1 },
    { a: 'C', b: 'H', name: 'C–H', note: 'every fat, every fuel', max: 1 },
    { a: 'C', b: 'C', name: 'C–C', note: 'the backbone of life', max: 3 },
    { a: 'C', b: 'Cl', name: 'C–Cl', note: 'dry-cleaning fluid', max: 1 },
    { a: 'N', b: 'H', name: 'N–H', note: 'ammonia, and every protein', max: 1, hb: true },
    { a: 'O', b: 'H', name: 'O–H', note: 'water', max: 1, hb: true },
    { a: 'C', b: 'O', name: 'C–O', note: 'sugar, alcohol, carbon dioxide', max: 2 },
    { a: 'H', b: 'F', name: 'H–F', note: 'etches glass', max: 1, hb: true },
    { a: 'Mg', b: 'O', name: 'Mg–O', note: 'the grit in a firework', max: 1 },
    { a: 'Na', b: 'Cl', name: 'Na–Cl', note: 'table salt', max: 1 },
    { a: 'K', b: 'Br', name: 'K–Br', note: 'an old photographic salt', max: 1 },
    { a: 'Li', b: 'F', name: 'Li–F', note: 'as one-sided as a bond gets', max: 1 },
  ];
  PAIRS.forEach((p) => {
    p.d = Math.abs(EL[p.a].en - EL[p.b].en);
    p.u = icOf(p.d);
    /* Chip names keep the spelling people know (O–H, N–H). The picture always
       puts the weaker puller on the left and the stronger on the right, so that
       sliding right always means "the cloud moves that way". */
    const flip = EL[p.b].en < EL[p.a].en;
    p.lo = flip ? p.b : p.a;
    p.hi = flip ? p.a : p.b;
  });

  /* Where the names sit along the rail. The edges are human conventions, not
     cliffs: the drawn picture crosses them without changing. */
  const ZONES = [
    { lo: 0, hi: 0.05, mid: 0.0, word: 'shared evenly', book: 'covalent', say: 'Both atoms pull the same, so the cloud sits dead centre. Neither end is charged, so this molecule has nothing to offer a neighbour but a flicker.' },
    { lo: 0.05, hi: 0.45, mid: 0.24, word: 'shared unevenly', book: 'polar covalent', say: 'One atom pulls harder. The cloud leans, and the molecule grows a δ− end and a δ+ end — which is where every between-molecule hold comes from.' },
    { lo: 0.45, hi: IONIC_AT, mid: 0.54, word: 'nearly taken', book: 'very polar', say: 'The cloud has almost moved in with the stronger atom. The ends are now strongly charged, and a hydrogen sitting on this end is bare enough to make a hydrogen bond.' },
    { lo: IONIC_AT, hi: 1.001, mid: 0.82, word: 'handed over', book: 'ionic', say: 'The electron is simply gone. Two charged balls are left, pulling on each other — and on every other ion within reach, which is why salt is a lattice and not a pair.' },
  ];
  const zoneOf = (u) => ZONES.find((z) => u < z.hi) || ZONES[ZONES.length - 1];

  /* How much shorter and stiffer a bond gets with a second and third pair. */
  const ORDER = [null, { len: 1, kJ: 350, word: 'one pair shared' }, { len: 0.87, kJ: 610, word: 'two pairs shared' }, { len: 0.78, kJ: 840, word: 'three pairs shared' }];

  /* The neighbours you can park next to the molecule, and the reach of the
     hold that results. m is how fast the pull dies as you back away:
     a big m means a hold that only works touching. */
  const NEIGH = {
    none: { id: 'none', label: 'Nobody' },
    plus: { id: 'plus', label: 'A + ion', sub: 'like Na⁺ from salt' },
    minus: { id: 'minus', label: 'A − ion', sub: 'like Cl⁻ from salt' },
    copy: { id: 'copy', label: 'Another one of these', sub: 'the same molecule again' },
    blob: { id: 'blob', label: 'A plain blob', sub: 'no ends at all, like argon' },
  };
  const NEIGH_ORDER = ['none', 'copy', 'plus', 'minus', 'blob'];

  /* What holds the two of them together, given how uneven the bond is (u),
     what the neighbour is, and whether this pair can make a hydrogen bond.
     Depths are kJ/mol and match the wells in The Well. */
  function hold(u, neigh, hb, r) {
    if (neigh === 'none') return null;
    const vdw = 1.0;                                  // every pair of anything has this much
    const ionic = u > IONIC_AT;                       // not molecules any more: ions
    let kind, D, m, why;
    if (neigh === 'plus' || neigh === 'minus') {
      if (ionic) {
        kind = 'ionic'; D = 380; m = 1;
        why = 'Two full charges, nothing shared. And it does not stop at two: every ion grabs every ion of the other sign within reach. That is why salt is a hard crystal and not a gas.';
      } else if (u < 0.08) {
        kind = 'vdw'; D = vdw + 7 * (1 - u); m = 4;
        why = 'The ion squashes the even cloud out of shape, and then holds on to the dent it made. A tiny grip, and it dies the moment you back away.';
      } else {
        kind = 'iondipole'; D = 15 + 85 * u; m = 2;
        why = 'A whole charge on one side, a charged end of a molecule on the other. This is the strongest of the between-molecule holds, and it reaches furthest — it is what pulls salt apart when it dissolves.';
      }
    } else if (neigh === 'copy') {
      if (ionic) {
        kind = 'ionic'; D = 500; m = 1;
        why = 'There are no molecules here to pair off. Each + ion is surrounded by − ions and each − by +, stacked in every direction at once: a lattice.';
      } else if (u >= 0.12 && hb) {
        kind = 'hydrogen'; D = 6 + 22 * Math.min(1, (u - 0.12) / 0.5); m = 4;
        why = 'The hydrogen on this bond has been stripped so bare it is almost a naked proton, and the other molecule’s spare electrons come to meet it. That is a hydrogen bond: the strongest hold between neutral molecules, and the reason water behaves nothing like its size suggests.';
      } else if (u >= 0.1) {
        kind = 'dipole'; D = vdw + 11 * u * u; m = 3;
        why = 'Both molecules have a δ+ end and a δ− end, so they swing round and line up head to tail. Weaker than a hydrogen bond, much stronger than nothing.';
      } else {
        kind = 'vdw'; D = vdw + 0.6; m = 6;
        why = 'No ends to line up. All that is left is the flicker: the clouds slosh about, and for an instant one is lopsided and the other answers. Feeble, and it needs them almost touching.';
      }
    } else {
      if (u < 0.1) { kind = 'vdw'; D = vdw; m = 6; why = 'Neither one has an end. Only the flicker is left, and it is the weakest hold there is — but it is never zero, which is why even argon turns liquid if you make it cold enough.'; }
      else { kind = 'vdw'; D = vdw + 5 * u; m = 5; why = 'The charged end squashes the blob’s cloud and then holds on to the dent. Borrowed unevenness: it only exists while the charge is sitting there.'; }
    }
    const r0 = kind === 'ionic' ? 2.36 : kind === 'iondipole' ? 2.4 : kind === 'hydrogen' ? 1.9 : kind === 'dipole' ? 3.0 : 3.8;
    const f = Math.pow(r0 / Math.max(r, r0), m);
    return { kind, D, m, why, r0, now: D * f, reach: f, ionic };
  }
  const KIND_NAME = { covalent: 'Covalent bond', ionic: 'Ionic attraction', hydrogen: 'Hydrogen bond', dipole: 'Dipole–dipole', iondipole: 'Ion–dipole', vdw: 'Van der Waals' };

  const GOALS = [
    { id: 'even', text: 'Find a pair that shares the cloud dead evenly.' },
    { id: 'lean', text: 'Make the cloud lean far enough to give one atom a clear δ−.' },
    { id: 'hand', text: 'Slide all the way: make one atom simply take the electron.' },
    { id: 'tight', text: 'Tighten an even bond with a second and a third shared pair.' },
    { id: 'hbond', text: 'Make a hydrogen bond between two copies of the same molecule.' },
    { id: 'iondip', text: 'Park an ion beside a molecule with strong ends. What is that hold called?' },
    { id: 'induce', text: 'Get a neighbour to stick to a molecule that has no uneven sharing at all.' },
    { id: 'reach', text: 'Drag a neighbour slowly away. Find the hold that dies first, and the one that reaches furthest.' },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<defs><linearGradient id="spg" x1="0" x2="1"><stop offset="0" stop-color="var(--t-covalent)"/><stop offset="0.5" stop-color="var(--t-hydrogen)"/><stop offset="1" stop-color="var(--t-ionic)"/></linearGradient></defs>' +
    '<rect x="14" y="30" width="172" height="13" rx="6.5" fill="url(#spg)"/>' +
    '<circle cx="62" cy="36.5" r="9" fill="var(--panel)" stroke="currentColor" stroke-width="3"/>' +
    '<g stroke="currentColor" stroke-width="3" fill="none"><circle cx="64" cy="84" r="20"/><circle cx="130" cy="84" r="15"/></g>' +
    '<ellipse cx="108" cy="84" rx="30" ry="15" fill="var(--cloud)" opacity=".55"/></svg>';

  BL.register({
    id: 'spectrum', field: 'bonding', order: 0, name: 'The Spectrum',
    tagline: 'Every kind of bond is one dial at a different setting.',
    lede: 'Slide the marker along the rail. The two atoms below are the same bond, drawn at whatever setting you are standing on — nothing jumps, because these are not four different things.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock, params }) {
      const S = {
        u: 0.0, pair: 0, order: 1, neigh: 'none',
        nr: 5.2,                 // how far away the neighbour is, in angstrom
        touched: false, free: false, vu: 0, dragging: false, sawReach: false, zone: null,
      };
      const pre = (params && params[0] || '').toLowerCase();
      const pi = PAIRS.findIndex((p) => p.name.toLowerCase().replace('–', '-') === pre.replace('–', '-'));
      if (pi >= 0) { S.pair = pi; S.u = PAIRS[pi].u; }
      else { S.pair = 0; S.u = PAIRS[0].u; }
      S.vu = S.u;

      const cur = () => (S.free ? null : PAIRS[S.pair]);
      /* A hydrogen bond needs a hydrogen with nothing left on it, which in practice
         means H bonded to N, O or F. Off the preset pairs there are no elements to
         check, so any strongly uneven bond short of a full handover counts. */
      const canHB = () => { const p = cur(); return p ? !!p.hb : S.vu >= 0.12 && S.vu <= IONIC_AT; };
      const maxOrder = () => { const p = cur(); return S.u > 0.45 ? 1 : p ? p.max : 3; };

      /* ---------------- stage ---------------- */
      /* The four names, as a strip you can also press. It sits above the stage
         because the names are the part a learner has to carry away, and canvas
         text at that size is the first thing to get unreadable. */
      const zoneSay = h('p', { class: 'zone-say' });
      const zoneBtn = ZONES.map((z) => h('button', {
        type: 'button', class: 'zone', 'aria-pressed': 'false',
        onclick: () => { S.touched = true; S.free = true; S.u = z.mid; S.order = Math.min(S.order, maxOrder()); sync(); },
      }, h('b', {}, z.word), h('span', {}, z.book)));
      stageHost.appendChild(h('div', { class: 'zone-strip', role: 'group', 'aria-label': 'Where along the spectrum' }, zoneBtn));
      stageHost.appendChild(zoneSay);
      function paintZones() {
        zoneBtn.forEach((b, i) => b.setAttribute('aria-pressed', String(ZONES[i] === S.zone)));
        zoneSay.textContent = S.zone ? S.zone.say : '';
      }
      const stage = BL.stage(stageHost, '16 / 7.6', {
        label: 'A rail running from evenly shared electrons to electrons handed over completely, with two atoms drawn below it. Drag the marker along the rail, or focus the stage and use the left and right arrow keys.',
        focusable: true,
      });
      stage.wrap.classList.add('spec-stage');
      const ctx = stage.ctx;

      const L = {};
      stage.onresize = () => {
        const W = stage.w, H = stage.h, f = BL.fs(13);
        L.railY = Math.max(f * 1.9, Math.min(H * 0.13, f * 3.0));
        L.railX0 = Math.max(18, W * 0.05);
        L.railX1 = W - L.railX0;
        L.railW = L.railX1 - L.railX0;
        L.railH = Math.max(13, Math.min(20, H * 0.035));
        L.sceneY = L.railY + (H - L.railY) * 0.52;
        /* With nobody parked alongside, the molecule gets the whole stage. The
           moment a neighbour arrives it has to share, which matters most on a
           phone, where there is no spare width to be had. */
        L.unit = clamp(Math.min(W * (S.neigh === 'none' ? 0.13 : 0.08), H * 0.26), 22, S.neigh === 'none' ? 96 : 76);
        L.molF = S.neigh === 'none' ? 0.42 : 0.3;
      };
      stage.onresize();

      const ux = (u) => L.railX0 + u * L.railW;
      const xu = (x) => clamp((x - L.railX0) / L.railW, 0, 1);

      /* The molecule sits left of centre so a neighbour has room on the right. */
      const bondLen = () => (1.05 + 2.1 * S.vu) * ORDER[S.order].len;
      const molX = () => stage.w * (L.molF == null ? 0.42 : L.molF);
      /* Covalent radii are honest and useless as a picture: hydrogen comes out a
         speck. Compress the range instead, so sizes still rank correctly. */
      const atomPx = (r) => L.unit * clamp(0.5 + 0.52 * r, 0.6, 1.45);
      /* How far the neighbour may be dragged before it would leave the stage. */
      const maxR = () => clamp((stage.w - molX() - L.unit * 1.9) / L.unit - bondLen() / 2, 3.2, 9);
      const neighX = () => molX() + (bondLen() / 2 + S.nr) * L.unit;

      /* ---------------- cloud dots ---------------- */
      const N = 760;
      const mk = () => ({ u: clamp(randn(), -2.4, 2.4), v: clamp(randn(), -2.4, 2.4), lobe: Math.random() < 0.5 ? -1 : 1, s: 0.45 + Math.random() * 0.55 });
      const P = Array.from({ length: N }, mk);

      /* ---------------- pointer ---------------- */
      BL.drag(stage.canvas, {
        pick: (p) => {
          if (Math.abs(p.y - L.railY) < Math.max(30, L.railH * 2.2) && p.x > L.railX0 - 24 && p.x < L.railX1 + 24) return 'rail';
          if (S.neigh !== 'none' && Math.hypot(p.x - neighX(), p.y - L.sceneY) < 44) return 'neigh';
          return null;
        },
        move: (hnd, p) => {
          S.touched = true; S.dragging = true;
          if (hnd === 'rail') { S.free = true; S.u = xu(p.x); S.order = Math.min(S.order, maxOrder()); sync(); }
          else {
            S.nr = clamp((p.x - molX()) / L.unit - bondLen() / 2, 1.4, maxR());
          }
        },
        end: () => { S.dragging = false; },
      });
      stage.canvas.addEventListener('keydown', (e) => {
        const step = e.shiftKey ? 0.01 : 0.05;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault(); S.touched = true; S.free = true;
          S.u = clamp(S.u + (e.key === 'ArrowRight' ? step : -step), 0, 1);
          S.order = Math.min(S.order, maxOrder()); sync();
        } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && S.neigh !== 'none') {
          e.preventDefault(); S.touched = true;
          S.nr = clamp(S.nr + (e.key === 'ArrowUp' ? -0.4 : 0.4), 1.4, maxR());
        }
      });

      /* Each kind of hold has its own comfortable distance, so a neighbour
         arrives sitting at it rather than at some arbitrary gap. */
      const restingGap = (id) => { const t = hold(S.u, id, canHB(), 99); return t ? t.r0 : 3.4; };

      /* ---------------- what the ends can do (aux) ---------------- */
      const holdName = h('p', { class: 'hold-name' });
      const holdWhy = h('p', { class: 'hint' });
      const mNow = BL.meter('How hard this holds');
      const mReach = BL.meter('How much is left at this distance');
      const holdBox = h('section', { class: 'panel' },
        h('h2', {}, 'What is holding them together'),
        holdName, mNow.el, mReach.el, holdWhy);
      aux.appendChild(holdBox);

      const ladderCv = BL.stage(h('div'), '3.1 / 1', {
        label: 'The six kinds of hold, drawn end to end by strength, with the one you have made now marked.',
      });
      ladderCv.wrap.classList.add('flat', 'dial');
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'All of them, side by side'),
        ladderCv.wrap,
        h('p', { class: 'hint' }, 'Inside a molecule on the left, between molecules on the right. Same ladder, same cause: how unevenly electrons got shared in the first place.')));

      /* ---------------- dock ---------------- */
      const pairChips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Real pairs' });
      const pairBtn = PAIRS.map((p, i) => {
        const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: () => { S.touched = true; S.free = false; S.pair = i; S.u = p.u; S.order = Math.min(S.order, p.max); sync(); } },
          p.name, h('span', { class: 'sub' }, p.note));
        pairChips.appendChild(b); return b;
      });
      const pairNote = h('p', { class: 'hint' }, 'Or drag the marker on the rail to anywhere in between — including places no real pair sits.');
      dock.appendChild(h('section', {}, h('h2', {}, 'A real pair'), pairChips, pairNote));

      const orderBtns = [1, 2, 3].map((n) =>
        h('button', { type: 'button', 'aria-pressed': String(n === S.order), onclick: () => { S.touched = true; S.order = Math.min(n, maxOrder()); sync(); } }, ['one', 'two', 'three'][n - 1]));
      const orderNote = h('p', { class: 'hint' });
      dock.appendChild(h('section', {},
        h('h2', {}, 'Pairs shared'),
        h('div', { class: 'seg', role: 'group', 'aria-label': 'How many pairs of electrons are shared' }, orderBtns),
        orderNote));

      const neighBtns = NEIGH_ORDER.map((id) =>
        h('button', { class: 'chip', type: 'button', 'aria-pressed': String(id === S.neigh), onclick: () => { S.touched = true; S.neigh = id; S.nr = restingGap(id); stage.onresize(); sync(); } },
          NEIGH[id].label, NEIGH[id].sub ? h('span', { class: 'sub' }, NEIGH[id].sub) : null));
      dock.appendChild(h('section', {},
        h('h2', {}, 'Park a neighbour beside it'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Neighbour' }, neighBtns),
        h('p', { class: 'hint' }, 'Then drag the neighbour closer or further away. (Keyboard: focus the stage, up and down arrows.)')));

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'spectrum', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- sync ---------------- */
      function sync() {
        const mo = maxOrder();
        pairBtn.forEach((b, i) => b.setAttribute('aria-pressed', String(!S.free && S.pair === i)));
        orderBtns.forEach((b, i) => {
          b.setAttribute('aria-pressed', String(!S.free || true ? i + 1 === S.order : false));
          b.disabled = i + 1 > mo;
        });
        orderNote.textContent = S.u > 0.45
          ? 'Once an atom has simply taken the electrons, there is nothing left to share a second time. Doubling up belongs to the sharing end of the rail.'
          : S.order === 1 ? 'One shared pair. Loose enough that the two ends can still turn.'
            : S.order === 2 ? 'Two shared pairs: shorter, stiffer, and now the molecule cannot twist at this bond.'
              : 'Three shared pairs: the shortest and stiffest bond there is. Nitrogen gas is held this way, which is why it does almost nothing.';
        neighBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(NEIGH_ORDER[i] === S.neigh)));
        pairNote.textContent = S.free
          ? 'You are between the real pairs. Nothing breaks — the picture only ever slides.'
          : 'Or drag the marker on the rail to anywhere in between — including places no real pair sits.';
      }
      sync();

      /* ---------------- the ladder chart ---------------- */
      const LADDER = [
        { id: 'covalent', name: 'Covalent', D: 436, where: 'inside' },
        { id: 'ionic', name: 'Ionic', D: 500, where: 'inside' },
        { id: 'iondipole', name: 'Ion–dipole', D: 100, where: 'between' },
        { id: 'hydrogen', name: 'Hydrogen bond', D: 22, where: 'between' },
        { id: 'dipole', name: 'Dipole–dipole', D: 12, where: 'between' },
        { id: 'vdw', name: 'Van der Waals', D: 1, where: 'between' },
      ];
      function drawLadder(nowKind) {
        const c = ladderCv.ctx, W = ladderCv.w, H = ladderCv.h, pal = BL.pal;
        if (!W) return;
        c.clearRect(0, 0, W, H);
        c.font = BL.font(700, 13);
        let lw = 0;
        LADDER.forEach((r) => { lw = Math.max(lw, c.measureText(r.name).width); });
        const x0 = Math.min(W * 0.42, lw + 14), pad = 8;
        const rowH = (H - pad * 2) / LADDER.length;
        const maxLog = Math.log(600), minLog = Math.log(0.7);
        LADDER.forEach((r, i) => {
          const y = pad + i * rowH + rowH / 2, bh = Math.min(rowH * 0.56, 17);
          const on = r.id === nowKind;
          const frac = (Math.log(r.D) - minLog) / (maxLog - minLog);
          c.fillStyle = on ? BL.alpha(pal.ui, 0.14) : 'transparent';
          if (on) { c.beginPath(); if (c.roundRect) c.roundRect(2, y - rowH / 2 + 1, W - 4, rowH - 2, 7); else c.rect(2, y - rowH / 2 + 1, W - 4, rowH - 2); c.fill(); }
          c.fillStyle = on ? pal.fg : pal.muted;
          c.font = BL.font(on ? 800 : 400, 13);
          c.textAlign = 'right'; c.textBaseline = 'middle';
          c.fillText(r.name, x0 - 8, y);
          const bw = Math.max(4, frac * (W - x0 - 12));
          c.fillStyle = r.where === 'inside' ? BL.alpha(pal.types[r.id] || pal.ui, on ? 1 : 0.55) : BL.alpha(pal.types[r.id] || pal.ui, on ? 1 : 0.5);
          c.beginPath();
          if (c.roundRect) c.roundRect(x0, y - bh / 2, bw, bh, bh / 2); else c.rect(x0, y - bh / 2, bw, bh);
          c.fill();
          if (on) { c.lineWidth = 2.5; c.strokeStyle = pal.fg; c.stroke(); }
          if (BL.nums) {
            c.fillStyle = pal.muted; c.font = BL.font(400, 12); c.textAlign = 'left';
            c.fillText(r.D + ' kJ/mol', x0 + bw + 7, y);
          }
        });
        c.textBaseline = 'alphabetic';
      }

      /* ---------------- the rail ---------------- */
      function drawRail(pal) {
        const y = L.railY, hh = L.railH, f = BL.fs(13);
        // the band itself: a smooth blend from the covalent colour to the ionic one
        const g = ctx.createLinearGradient(L.railX0, 0, L.railX1, 0);
        g.addColorStop(0, pal.types.covalent);
        g.addColorStop(0.45, pal.types.hydrogen);
        g.addColorStop(1, pal.types.ionic);
        ctx.fillStyle = g;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(L.railX0, y - hh / 2, L.railW, hh, hh / 2); else ctx.rect(L.railX0, y - hh / 2, L.railW, hh);
        ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = BL.alpha(pal.fg, 0.35); ctx.stroke();

        // hairlines where books draw their cut-offs. The names live in the strip
        // above the stage, where there is room to read them.
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ZONES.forEach((z, i) => {
          if (!i) return;
          ctx.strokeStyle = BL.alpha(pal.fg, 0.4); ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(ux(z.lo), y - hh / 2 - 4); ctx.lineTo(ux(z.lo), y + hh / 2 + 4); ctx.stroke(); ctx.setLineDash([]);
        });

        // real pairs as ticks below
        ctx.font = BL.font(400, 12);
        PAIRS.forEach((p, i) => {
          const x = ux(p.u), on = !S.free && S.pair === i;
          ctx.strokeStyle = BL.alpha(pal.fg, on ? 0.9 : 0.4); ctx.lineWidth = on ? 2.5 : 1.4;
          ctx.beginPath(); ctx.moveTo(x, y + hh / 2 + 2); ctx.lineTo(x, y + hh / 2 + (on ? 11 : 7)); ctx.stroke();
          if (on) {
            ctx.font = BL.font(700, 13);
            const w = ctx.measureText(p.name + ' · ' + p.note).width / 2 + 10;
            BL.label(ctx, p.name + ' · ' + p.note, clamp(x, L.railX0 + w, L.railX1 - w), y + hh / 2 + f * 1.8,
              { font: BL.font(700, 13), border: pal.line2 });
          }
        });

        // the marker
        const mx = ux(S.vu);
        ctx.beginPath(); ctx.arc(mx, y, hh * 0.85, 0, 7);
        ctx.fillStyle = pal.panel; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = pal.fg; ctx.stroke();
        ctx.beginPath(); ctx.arc(mx, y, hh * 0.3, 0, 7); ctx.fillStyle = pal.fg; ctx.fill();
        if (!S.touched && !BL.reduced) {
          const ph = (performance.now() / 1100) % 1;
          ctx.strokeStyle = BL.alpha(pal.fg, (1 - ph) * 0.8); ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(mx, y, hh * 0.9 + ph * 16, 0, 7); ctx.stroke();
        }

      }

      /* ---------------- the molecule ---------------- */
      function drawMolecule(pal, dq) {
        const u = S.vu, cx = molX(), cy = L.sceneY;
        const p = cur();
        const symA = p ? p.lo : 'X', symB = p ? p.hi : 'Y';
        const d = bondLen() * L.unit;
        const rA = atomPx(p ? EL[p.lo].r : 1.0) * (1 - 0.45 * u);
        const rB = atomPx(p ? EL[p.hi].r : 0.9) * (1 + 0.34 * u);
        const ax = cx - d / 2, bx = cx + d / 2;
        const t = 0.5 + 0.5 * u;
        const clx = ax + t * d + dq * L.unit * 1.2;
        const blend = pal.dark ? 'lighter' : 'source-over';

        // the sticks: one line per shared pair, so a triple bond LOOKS tighter
        if (u < IONIC_AT) {
          const sep = Math.max(4, L.unit * 0.14);
          ctx.strokeStyle = BL.alpha(pal.fg, 0.4 * (1 - u / IONIC_AT));
          ctx.lineWidth = Math.max(2, L.unit * 0.1); ctx.lineCap = 'round';
          for (let k = 0; k < S.order; k++) {
            const off = (k - (S.order - 1) / 2) * sep;
            ctx.beginPath(); ctx.moveTo(ax, cy + off); ctx.lineTo(bx, cy + off); ctx.stroke();
          }
          ctx.lineCap = 'butt';
        }

        // the shared cloud
        const easeU = Math.pow(u, 0.8);
        const sx = Math.max(9, lerp(d * 0.2, rB * 0.44, easeU));
        const sy = Math.max(9, lerp(d * 0.17 * (1 + 0.18 * (S.order - 1)), rB * 0.44, easeU));
        const lobeDx = 0.17 * d * (1 - u);
        ctx.save();
        ctx.globalCompositeOperation = blend;
        ctx.translate(clx, cy); ctx.scale(sx * 2.7 + lobeDx, sy * 2.7);
        const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        gg.addColorStop(0, BL.alpha(pal.cloud, pal.dark ? 0.3 : 0.27)); gg.addColorStop(1, BL.alpha(pal.cloud, 0));
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill();
        ctx.restore();

        // atoms
        const qB = -(u + dq), qA = u + dq;
        [[ax, rA, qA, symA], [bx, rB, qB, symB]].forEach(([x, r, q, sym]) => {
          const tintc = q >= 0 ? pal.pos : pal.neg;
          ctx.beginPath(); ctx.arc(x, cy, r, 0, 7);
          ctx.fillStyle = BL.alpha(tintc, 0.06 + 0.22 * Math.min(1, Math.abs(q))); ctx.fill();
          ctx.strokeStyle = BL.alpha(pal.fg, 0.55); ctx.lineWidth = 2; ctx.stroke();
        });

        // dots
        ctx.save();
        ctx.globalCompositeOperation = blend;
        const rc = BL.reduced ? 0.01 : 0.06;
        for (let i = 0; i < Math.ceil(N * rc); i++) P[(Math.random() * N) | 0] = mk();
        const ds = pal.dark ? 2.4 : 2.6, base = pal.dark ? 0.3 : 0.38;
        for (let i = 0; i < N; i++) {
          const q = P[i];
          ctx.fillStyle = BL.alpha(pal.cloud, Math.round((base + 0.5 * q.s) * 20) / 20);
          ctx.fillRect(clx + q.lobe * lobeDx + q.u * sx - ds / 2, cy + q.v * sy - ds / 2, ds, ds);
        }
        ctx.restore();

        // nuclei, names, charges
        const f = BL.fs(14);
        [[ax, qA, symA], [bx, qB, symB]].forEach(([x, q, sym]) => {
          const col = q >= 0 ? BL.mix(pal.fg, pal.pos, Math.min(1, Math.abs(q) * 1.6)) : BL.mix(pal.fg, pal.neg, Math.min(1, Math.abs(q) * 1.6));
          ctx.beginPath(); ctx.arc(x, cy, 6.5, 0, 7); ctx.fillStyle = col; ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = pal.panel; ctx.stroke();
          const full = u > IONIC_AT + 0.08;
          BL.label(ctx, sym + (full ? (q > 0 ? '⁺' : '⁻') : ''), x, cy + f * 2.2, { font: BL.font(800, 17, true) });
          if (Math.abs(q) >= 0.05) {
            BL.label(ctx, (full ? '' : 'δ') + (q >= 0 ? '+' : '−') + (BL.nums ? ' ' + Math.abs(q).toFixed(2) : ''), x, cy - f * 2.2,
              { font: BL.font(700, 14), color: q >= 0 ? pal.pos : pal.neg, border: q >= 0 ? pal.pos : pal.neg });
          }
        });

        // the charge-separation arrow: the one quantity that drives everything downstream
        if (u > 0.05) {
          const y2 = cy + f * 3.9, x1 = ax, x2 = bx;
          ctx.strokeStyle = pal.electron; ctx.fillStyle = pal.electron; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x1, y2); ctx.lineTo(x2 - 9, y2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 11, y2 - 6); ctx.lineTo(x2 - 11, y2 + 6); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(x1, y2 - 7); ctx.lineTo(x1, y2 + 7); ctx.stroke();
          BL.label(ctx, 'charge separation' + (BL.nums ? ' ' + u.toFixed(2) : ''), (x1 + x2) / 2, y2 + f * 1.3,
            { font: BL.font(700, 13), color: pal.electron, pad: 5 });
        }
        return { ax, bx, cy, rB, qB, d };
      }

      /* ---------------- the neighbour ---------------- */
      function drawNeighbour(pal, mol, hd) {
        if (S.neigh === 'none') {
          // the empty half of the stage is the point: nothing is out here yet
          const gr = atomPx(1.0);
          const x = Math.min(stage.w - gr - 10, mol.bx + L.unit * 3.4), y = L.sceneY;
          ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(pal.line2, 0.8);
          ctx.beginPath(); ctx.arc(x, y, gr, 0, 7); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 13); ctx.textAlign = 'center';
          ctx.fillText('park a neighbour here', clamp(x, 80, stage.w - 80), y + gr + BL.fs(13) * 1.5);
          return;
        }
        const x = neighX(), y = L.sceneY, f = BL.fs(14);
        // the bridge, drawn from the molecule's δ− end (or δ+, for a + ion)
        if (hd) {
          const fromPlus = S.neigh === 'minus';
          const sx = fromPlus ? mol.ax : mol.bx;
          const style = hd.kind === 'hydrogen' || hd.kind === 'dipole' || hd.kind === 'iondipole' || hd.kind === 'vdw';
          if (style && hd.reach > 0.04) {
            BL.mol.bridge(ctx, sx, y, x, y, pal, clamp(hd.now / Math.max(hd.D, 1), 0, 1), Math.max(4, L.unit * 0.3));
          }
        }
        if (S.neigh === 'plus' || S.neigh === 'minus') {
          BL.mol.ion(ctx, x, y, atomPx(1.0), S.neigh === 'plus' ? 1 : -1, S.neigh === 'plus' ? 'Na' : 'Cl', pal);
        } else if (S.neigh === 'copy' && hd && hd.ionic) {
          // at this end there is no molecule to copy: it is more ions
          BL.mol.ion(ctx, x, y, atomPx(0.95), -1, null, pal);
          BL.mol.ion(ctx, x + atomPx(0.95) * 2.1, y, atomPx(0.8), 1, null, pal);
          BL.label(ctx, 'and more, in every direction', x + atomPx(0.95), y + f * 2.2, { font: BL.font(700, 13) });
        } else if (S.neigh === 'copy') {
          // the same molecule again, turned to face the one on the left
          const p = cur();
          const d2 = bondLen() * L.unit * 0.78;
          const rr = atomPx(p ? EL[p.hi].r : 0.9) * (1 + 0.26 * S.vu);
          ctx.beginPath(); ctx.arc(x + d2 * 0.3, y, rr, 0, 7);
          ctx.fillStyle = BL.alpha(pal.neg, 0.16); ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(pal.fg, 0.5); ctx.stroke();
          ctx.beginPath(); ctx.arc(x - d2 * 0.4, y - d2 * 0.25, rr * 0.55, 0, 7);
          ctx.fillStyle = BL.alpha(pal.pos, 0.16); ctx.fill(); ctx.stroke();
          ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, L.unit * 0.1); ctx.strokeStyle = BL.alpha(pal.fg, 0.4);
          ctx.beginPath(); ctx.moveTo(x + d2 * 0.3, y); ctx.lineTo(x - d2 * 0.4, y - d2 * 0.25); ctx.stroke(); ctx.lineCap = 'butt';
          BL.label(ctx, (p ? p.hi : 'Y') + '–' + (p ? p.lo : 'X'), x, y + f * 2.2, { font: BL.font(800, 15, true) });
        } else {
          // a plain blob, squashed toward the molecule by whatever charge is near it
          const squash = clamp(S.vu * hd ? hd.reach * S.vu * 0.4 : 0, 0, 0.35);
          ctx.save(); ctx.translate(x, y); ctx.scale(1 + squash, 1 - squash * 0.55);
          ctx.beginPath(); ctx.arc(0, 0, atomPx(1.1), 0, 7);
          ctx.fillStyle = BL.alpha(pal.tVdw || pal.muted, 0.2); ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = BL.alpha(pal.fg, 0.5); ctx.stroke();
          ctx.restore();
          BL.label(ctx, 'Ar', x, y + f * 2.2, { font: BL.font(800, 15, true) });
        }
        if (!S.dragging && !BL.reduced && S.touched) {
          ctx.fillStyle = pal.muted; ctx.font = BL.font(400, 12); ctx.textAlign = 'center';
          ctx.fillText('drag me', x, y - atomPx(1.1) - BL.fs(12) * 1.2);
        }
      }

      /* ---------------- frame ---------------- */
      function frame(dt) {
        const pal = BL.pal, W = stage.w, H = stage.h;
        if (!W) return;
        stage.onresize();
        const k = 1 - Math.exp(-dt * (BL.reduced ? 24 : 9));
        S.vu += (S.u - S.vu) * k;

        const hb = canHB();
        const hd = hold(S.vu, S.neigh, hb, S.nr);

        // a + or − ion squashes the cloud, which is how an even bond gets ends it did not have
        let dq = 0;
        if (hd && (S.neigh === 'plus' || S.neigh === 'minus')) {
          dq = (S.neigh === 'minus' ? 1 : -1) * 0.3 * hd.reach * (1 - 0.6 * S.vu);
        }

        ctx.clearRect(0, 0, W, H);
        drawRail(pal);
        const mol = drawMolecule(pal, dq);
        drawNeighbour(pal, mol, hd);

        // the headline, in words
        const z = zoneOf(S.vu);
        if (z !== S.zone) { S.zone = z; paintZones(); }

        // ---------- readouts ----------
        if (hd) {
          holdName.textContent = '';
          holdName.append(
            h('span', { class: 'hold-kind', style: 'color: var(--t-' + hd.kind + ')' }, KIND_NAME[hd.kind]),
            h('span', { class: 'hold-where' }, hd.kind === 'ionic' ? 'between ions — and in every direction at once' : 'between the two, not inside either'));
          const w1 = BL.words.strength(hd.D);
          mNow.set(w1.frac, w1.word, Math.round(hd.D) + ' kJ/mol');
          mReach.set(clamp(hd.reach, 0, 1), hd.reach > 0.7 ? 'nearly all of it' : hd.reach > 0.3 ? 'about half' : hd.reach > 0.08 ? 'a trace' : 'gone',
            Math.round(hd.reach * 100) + '%');
          holdWhy.textContent = hd.why;
        } else {
          const o = ORDER[S.order];
          const insideD = S.vu > IONIC_AT ? 500 : lerp(o.kJ, 500, clamp(S.vu / IONIC_AT, 0, 1) * 0.3);
          holdName.textContent = '';
          holdName.append(
            h('span', { class: 'hold-kind', style: 'color: var(--t-' + (S.vu > IONIC_AT ? 'ionic' : 'covalent') + ')' }, S.vu > IONIC_AT ? KIND_NAME.ionic : KIND_NAME.covalent),
            h('span', { class: 'hold-where' }, 'inside the molecule'));
          const w1 = BL.words.strength(insideD);
          mNow.set(w1.frac, w1.word, Math.round(insideD) + ' kJ/mol');
          mReach.set(1, 'all of it — they are bonded', '100%');
          holdWhy.textContent = S.vu > IONIC_AT
            ? 'One atom took the electrons outright. What is left is a + ball and a − ball pulling on each other — and in real salt that pull does not stop at two, it builds a whole lattice.'
            : 'The electrons belong to both atoms at once. Put a neighbour beside it to see what this molecule can do to anything OUTSIDE itself.';
        }
        drawLadder(hd ? hd.kind : (S.vu > IONIC_AT ? 'ionic' : 'covalent'));

        // ---------- goals ----------
        if (S.touched) {
          if (S.vu < 0.02) goals.done('even');
          if (S.vu > 0.25 && S.vu < IONIC_AT) goals.done('lean');
          if (S.vu > IONIC_AT + 0.05) goals.done('hand');
          if (S.order === 3 && S.vu < 0.2) goals.done('tight');
          if (hd) {
            if (hd.kind === 'hydrogen' && hd.reach > 0.5) goals.done('hbond');
            if (hd.kind === 'iondipole' && hd.reach > 0.4) goals.done('iondip');
            if (S.vu < 0.08 && hd.now > 1.4 && hd.reach > 0.5) goals.done('induce');
            if (S.dragging && S.nr > 6 && hd.reach < 0.05) { S.sawReach = true; }
            if (S.sawReach && S.nr < 3) goals.done('reach');
          }
        }
      }

      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); ladderCv.destroy(); } };
    },
  });
})();
