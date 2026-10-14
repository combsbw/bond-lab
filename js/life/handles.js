/* Handles: what a functional group is for.

   A hydrocarbon on its own is boring and useful for exactly one thing: burning.
   Everything interesting a molecule does for a living, it does with a small
   group of atoms bolted onto one of carbon's spare hands. Bolt an —OH on and
   it will mix with water. Bolt a —COOH on and it turns the water around it
   acidic. Bolt an amino and a carboxyl onto the same carbon and you have not
   made a flavouring, you have made an amino acid, and you are one bond away
   from a protein.

   The payoff at the bottom of the panel is the one that matters: the four bond
   names the next section is about — peptide, glycosidic, ester, phosphodiester
   — are not four separate facts to learn. They are just the names for which
   two handles happened to be facing each other. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;
  const M = BL.water2d;
  const TAU = Math.PI * 2;

  /* polar: how much water wants to talk to it. acid: positive gives a
     hydrogen away, negative takes one. link: what it can couple to. */
  const GROUPS = {
    H: { tag: 'H', name: 'a plain hydrogen', polar: 0, acid: 0, link: null, color: 'pos',
      says: 'Nothing bolted on. Carbon and hydrogen and no handles at all.' },
    methyl: { tag: 'CH₃', name: 'a methyl group', polar: -0.3, acid: 0, link: null, color: 'eTail',
      says: 'More hydrocarbon. It adds bulk and nothing else, and it pushes water away slightly harder than a bare hydrogen does.' },
    hydroxyl: { tag: 'OH', name: 'a hydroxyl group', polar: 1, acid: 0.06, link: 'OH', color: 'neg',
      says: 'An oxygen with a hydrogen on it. That hydrogen can hydrogen-bond straight to water, which is the whole reason alcohol mixes into a drink and petrol floats on a puddle.' },
    carbonyl: { tag: '=O', name: 'a carbonyl group', polar: 0.5, acid: 0, link: null, color: 'neg',
      says: 'A doubled-up oxygen. Polar, but with no hydrogen of its own to offer: it can accept a hydrogen bond and never give one.' },
    carboxyl: { tag: 'COOH', name: 'a carboxyl group', polar: 1, acid: 1, link: 'COOH', color: 'pos',
      says: 'A carbonyl and a hydroxyl sharing one carbon. In water it lets its hydrogen go, and letting a hydrogen go is the entire definition of an acid.' },
    amino: { tag: 'NH₂', name: 'an amino group', polar: 0.85, acid: -1, link: 'NH2', color: 'eN',
      says: 'Nitrogen carrying two hydrogens. In water it takes a hydrogen rather than giving one, which is what being a base is.' },
    phosphate: { tag: 'PO₄', name: 'a phosphate group', polar: 1.3, acid: 1.4, link: 'PO4', color: 'eP',
      says: 'Big, strongly charged, strongly acidic. It is the part of a nucleotide that joins to the next nucleotide, and the part of ATP that carries the energy around.' },
  };
  const PAINT = ['H', 'methyl', 'hydroxyl', 'carbonyl', 'carboxyl', 'amino', 'phosphate'];

  /* Which pair of handles makes which bond. This is the whole of the next
     section, arrived at from the parts rather than from a list. */
  const COUPLES = [
    { a: 'NH2', b: 'COOH', bond: 'a peptide bond', makes: 'a protein', go: 'amino' },
    { a: 'OH', b: 'OH', bond: 'a glycosidic bond', makes: 'a carbohydrate', go: 'sugar' },
    { a: 'COOH', b: 'OH', bond: 'an ester bond', makes: 'a fat', go: 'fatty' },
    { a: 'PO4', b: 'OH', bond: 'a phosphodiester bond', makes: 'a nucleic acid', go: 'nucl' },
  ];

  /* Molecules a learner has met, so the readout can name what they just built. */
  const KNOWN = [
    { key: '', name: 'Ethane', is: 'camping-stove gas. Good for burning, useless for anything else.' },
    { key: 'methyl', name: 'Propane', is: 'barbecue gas. One carbon longer and no more interesting.' },
    { key: 'hydroxyl', name: 'Ethanol', is: 'the alcohol in beer and in hand sanitiser. It mixes into water in any amount you like.' },
    { key: 'carbonyl', name: 'Acetaldehyde', is: 'what your liver turns alcohol into on the way to getting rid of it. It is also most of why a hangover feels like that.' },
    { key: 'carboxyl', name: 'Acetic acid', is: 'vinegar. The sour taste is the hydrogen leaving the carboxyl group.' },
    { key: 'amino', name: 'Ethylamine', is: 'the smell of old fish. Amino groups in water smell exactly like that.' },
    { key: 'hydroxyl,hydroxyl', name: 'Ethylene glycol', is: 'antifreeze. Two hydroxyls hold on to water hard enough to stop it crystallising.' },
    { key: 'amino,carboxyl', name: 'Alanine', is: 'an amino acid — one of the twenty your whole body is built out of. The methyl group left over is its R-group.' },
    { key: 'carboxyl,hydroxyl', name: 'Lactic acid', is: 'what builds up in a muscle you have worked too hard, and what makes yoghurt sour.' },
  ];

  const STEPS = [
    { id: 'plain', text: 'Leave every hand as a hydrogen and read the water line.',
      how: 'Press “Ethane” and look at “Will it mix with water?”.',
      ask: 'will a molecule of nothing but carbon and hydrogen mix into water?',
      opts: ['Yes', 'No'], right: 1 },
    { id: 'oh', text: 'Bolt one hydroxyl on and read the same line again.',
      how: 'Pick —OH from the handles, then click any hydrogen on the molecule.',
      ask: 'one —OH on a two-carbon body. How well does it mix now?',
      opts: ['Completely', 'A little', 'Still not at all'], right: 0 },
    { id: 'acid', text: 'Make vinegar.',
      how: 'Pick —COOH and put it on one end. Watch the acid bar.',
      ask: 'what does a carboxyl group do to the water around it?',
      opts: ['Turns it acidic', 'Turns it basic', 'Leaves it alone'], right: 0 },
    { id: 'aa', text: 'Put an amino group and a carboxyl group on the same carbon.',
      how: 'Click the two hydrogens on the same end — one gets —NH₂, the other —COOH.',
      ask: 'what have you built?',
      opts: ['An amino acid', 'A sugar', 'A fat'], right: 0 },
    { id: 'peptide', text: 'Find the two handles whose bond is called a peptide bond.',
      how: 'Watch the “what it could join to” list at the bottom as you swap handles on and off.',
      ask: 'which pair makes a peptide bond?',
      opts: ['—OH and —OH', '—NH₂ and —COOH', '—CH₃ and —OH'], right: 1 },
    { id: 'twoOH', text: 'Compare one hydroxyl with two.',
      how: 'Put —OH on one end, read the water bar, then put —OH on the other end too.',
      ask: 'does the second hydroxyl make it mix more, less, or exactly the same?',
      opts: ['More', 'Less', 'Exactly the same'], right: 0 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<path d="M72 60 H128" stroke="currentColor" stroke-width="6" stroke-linecap="round" opacity=".8"/>' +
    '<circle cx="72" cy="60" r="17" fill="var(--e-c)"/><circle cx="128" cy="60" r="17" fill="var(--e-c)"/>' +
    '<rect x="140" y="46" width="48" height="28" rx="14" fill="var(--neg)"/>' +
    '<rect x="12" y="46" width="48" height="28" rx="14" fill="var(--e-n)"/></svg>';

  BL.register({
    id: 'handles', field: 'carbon', order: 1, name: 'Handles',
    tagline: 'Bolt a group on and the molecule gets a job.',
    lede: 'Two carbons with six spare hands, in three dimensions — drag to turn it over. Pick a group from the panel and tap a hand to bolt it on; tap it again to take it off. The readouts say what you have just made, whether it will mix with water, whether it turns water sour, and — at the bottom — what it could now join to and what that bond would be called.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      /* Six sockets: three on each carbon, at the hands that are not already
         holding the other carbon. Real geometry: each carbon's three spare
         hands sit 109.5° from the bond between them, and the two carbons are
         staggered by 60° so the hydrogens do not eclipse one another. Turn it
         over and you can see why a model drawn on paper has to cheat. */
      const ST = Math.sqrt(8) / 3;          // sin of the tetrahedral angle; the spare hands lean 1/3 away from the bond
      const SOCK = [0, 1, 2, 3, 4, 5].map((k) => {
        const c = k < 3 ? 0 : 1, j = k % 3;
        const phi = (j * 2 * Math.PI) / 3 + (c ? Math.PI / 3 : 0) + 0.35;
        return { c, d: { x: (c ? 1 : -1) / 3, y: ST * Math.cos(phi), z: ST * Math.sin(phi) } };
      });
      const CARB = [{ x: -0.55, y: 0, z: 0 }, { x: 0.55, y: 0, z: 0 }];
      const S = { g: SOCK.map(() => 'H'), paint: 'hydroxyl', hint: true, hits: [], hover: -1, W: null, t: 0, seen: new Set() };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A two-carbon molecule with six spare hands. Each hand holds a group, drawn as a labelled pill. Pick a group in the side panel and click a hand to bolt it on.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* ---------------- what we have built ---------------- */
      const groups = () => S.g.filter((k) => k !== 'H');
      const key = () => groups().slice().sort().join(',');
      const polar = () => groups().reduce((t, k) => t + GROUPS[k].polar, 0);
      const acid = () => groups().reduce((t, k) => t + GROUPS[k].acid, 0);
      const links = () => {
        const have = new Set(groups().map((k) => GROUPS[k].link).filter(Boolean));
        const counts = {};
        groups().forEach((k) => { const l = GROUPS[k].link; if (l) counts[l] = (counts[l] || 0) + 1; });
        return COUPLES.filter((c) => (c.a === c.b ? (counts[c.a] || 0) >= 1 : have.has(c.a) || have.has(c.b)))
          .map((c) => Object.assign({}, c, { both: c.a === c.b ? (counts[c.a] || 0) >= 1 : have.has(c.a) && have.has(c.b) }));
      };
      /* Water either mixes with it or does not, and the hydrocarbon body is
         always pulling the other way. Two carbons is a small body, so one
         hydroxyl is enough to win; a long tail would not be. */
      const mixes = () => clamp((polar() - 0.35) / 1.25, 0, 1);
      const known = () => KNOWN.find((m) => m.key === key());
      const sameCarbon = (x, y) => [0, 1].some((c) => {
        const on = SOCK.map((s, i) => (s.c === c ? S.g[i] : null)).filter(Boolean);
        return on.indexOf(x) >= 0 && on.indexOf(y) >= 0;
      });

      function apply(i) {
        // tapping a socket that already holds the group you are painting takes it off again
        S.g[i] = S.g[i] === S.paint && S.paint !== 'H' ? 'H' : S.paint;
        S.hint = false;
        groups().forEach((k) => S.seen.add(k));
        check(); say();
      }
      function preset(list) {
        S.g = SOCK.map(() => 'H');
        list.forEach(([i, k]) => { S.g[i] = k; });
        S.hint = false; groups().forEach((k) => S.seen.add(k));
        check(); say();
      }

      function check() {
        const k = key();
        if (k === '') steps.done('plain');
        if (k === 'hydroxyl') steps.done('oh');
        if (groups().indexOf('carboxyl') >= 0) steps.done('acid');
        if (sameCarbon('amino', 'carboxyl')) steps.done('aa');
        if (k === 'hydroxyl,hydroxyl') steps.done('twoOH');
        if (groups().indexOf('amino') >= 0 && groups().indexOf('carboxyl') >= 0) steps.done('peptide');
      }

      /* ---------------- dock ---------------- */
      const paintBtns = PAINT.map((k) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(S.paint === k),
        onclick: () => { S.paint = k; paintBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(PAINT[i] === k))); say(); },
      }, k === 'H' ? 'take it off' : '—' + GROUPS[k].tag));
      dock.appendChild(h('section', {},
        h('h2', {}, 'The handles'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Pick a group to bolt on' }, paintBtns),
        h('p', { class: 'hint' }, 'Pick one, then click a hand on the molecule. These six are the ones this chapter names.')));

      const sayGroup = h('p', { class: 'hint' });
      dock.appendChild(h('section', {}, h('h2', {}, 'What that handle does'), sayGroup));

      dock.appendChild(h('section', {},
        h('h2', {}, 'Things people have in the house'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Build a known molecule' },
          h('button', { type: 'button', class: 'chip', onclick: () => preset([]) }, 'Ethane'),
          h('button', { type: 'button', class: 'chip', onclick: () => preset([[3, 'hydroxyl']]) }, 'Ethanol'),
          h('button', { type: 'button', class: 'chip', onclick: () => preset([[3, 'carboxyl']]) }, 'Vinegar'),
          h('button', { type: 'button', class: 'chip', onclick: () => preset([[0, 'hydroxyl'], [3, 'hydroxyl']]) }, 'Antifreeze'),
          h('button', { type: 'button', class: 'chip', onclick: () => preset([[3, 'carboxyl'], [4, 'amino']]) }, 'An amino acid'))));

      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'handles', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const readout = h('div', { class: 'readout' });
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const mixM = BL.meter('Will it mix with water?');
      const acidM = BL.meter('What it does to the water’s acidity');
      aux.appendChild(h('section', { class: 'panel' }, readout, statusP,
        h('div', { class: 'meters' }, mixM.el, acidM.el)));

      const cup = BL.stage(h('div'), '2.6 / 1', { label: 'The molecule dropped into water. Water molecules either crowd in and hydrogen-bond to it, or turn their backs and cage it off.' });
      cup.wrap.classList.add('flat');
      const cupSay = h('p', { class: 'hint' });
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Drop it in water'), cup.wrap, cupSay));

      const linkBox = h('div', { class: 'facts' });
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'What it could join to, and what that bond is called'),
        linkBox,
        h('p', { class: 'hint' }, 'Four bond names, and not one of them is a separate fact. Each is just the name for which two handles were facing each other when the water came out. That is the next section.')));

      /* ---------------- water around it ---------------- */
      /* The molecule goes into the tank as one more body, nailed in place, with
         its hands turned up or down by how polar it is. Then nothing has to be
         faked: polar, and the water crowds in and shakes hands with it;
         non-polar, and the water finds nothing to hold and closes round it
         holding on to itself instead. */
      const WW = 11, WH = 5, NW = 26, SOLUTE = NW;
      function newWater() {
        const W = M.create({ n: NW + 1, w: WW, h: WH, type: 'water', K: 290, g: 0, gamma: 1.6, seed: 7 });
        for (let i = 0; i < NW; i++) {
          const col = i % 9, row = (i / 9) | 0;
          W.x[i] = 1.0 + col * 1.12;
          W.y[i] = 1.0 + row * 1.2;
          W.th[i] = W.rand() * TAU;
        }
        W.x[SOLUTE] = WW / 2; W.y[SOLUTE] = WH / 2; W.th[SOLUTE] = 0;
        W.fixed[SOLUTE] = 1;
        S.W = W;
      }
      /* A tank that has gone to infinity is a bug, not a lesson. */
      function sane(W) {
        for (let i = 0; i < W.n; i++) if (!isFinite(W.x[i]) || !isFinite(W.y[i]) || Math.abs(W.x[i]) > 1e4) return false;
        return true;
      }

      /* ---------------- picking and turning ---------------- */
      const sockAt = (p) => {
        let best = -1, bd = 1e9;
        S.hits.forEach((hh) => { const d = Math.hypot(hh.x - p.x, hh.y - p.y); if (d < hh.r + 8 && d < bd) { bd = d; best = hh.i; } });
        return best;
      };
      const V = BL.view3d(stage.canvas, {
        yaw: 0.5, pitch: 0.28, auto: 0.3,
        onturn: () => { S.hint = false; },
        hover: (p) => { S.hover = p ? sockAt(p) : -1; stage.canvas.style.cursor = S.hover >= 0 ? 'pointer' : ''; },
        tap: (p) => { const i = sockAt(p); if (i >= 0) apply(i); },
      });

      /* ---------------- words ---------------- */
      function say() {
        const k = known(), p = polar(), a = acid(), m = mixes();
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, k ? k.name : 'Something'),
          h('span', { class: 'zone' }, groups().length ? groups().map((g) => '—' + GROUPS[g].tag).join(' ') : 'no handles'));
        statusP.textContent = k ? k.is : 'Not one of the molecules this lab has a name for — which is fine. Read the bars instead: they are what actually decides how a molecule behaves.';
        mixM.set(m, m > 0.8 ? 'completely' : m > 0.45 ? 'fairly well' : m > 0.15 ? 'only a little' : 'not at all', '');
        mixM.tone(m > 0.45 ? BL.pal.neg : BL.pal.eTail);
        const av = clamp(0.5 + a * 0.33, 0, 1);
        acidM.set(av, a > 0.5 ? 'turns it sour' : a < -0.5 ? 'turns it soapy' : Math.abs(a) < 0.2 && groups().length && a !== 0 ? 'cancels out' : a === 0 ? 'leaves it alone' : 'nudges it', '');
        acidM.tone(a > 0.5 ? BL.pal.pos : a < -0.5 ? BL.pal.eN : BL.pal.muted);
        sayGroup.textContent = GROUPS[S.paint].says;

        cupSay.textContent = m > 0.45
          ? 'The water molecules swing round and point a hydrogen at the handle. That is a hydrogen bond, exactly the one from the chapter before, and it is why this molecule disappears into the water instead of sitting on top of it.'
          : 'The water has nothing to hold on to, so it holds on to itself instead and closes round the molecule like a fist. Nothing has pushed the molecule away — the water has simply shut it out.';

        linkBox.textContent = '';
        const ls = links();
        if (!ls.length) {
          linkBox.appendChild(h('p', { class: 'fact' }, 'Nothing. A molecule with no handles has no way to join to another one — which is why the gas in a camping stove stays a gas and never builds anything.'));
        } else {
          ls.forEach((c) => {
            linkBox.appendChild(h('p', { class: 'fact' },
              h('b', {}, '—' + tagOf(c.a) + ' + —' + tagOf(c.b) + ' → '),
              c.bond + ', which builds ' + c.makes + '. ',
              h('span', { class: c.both ? 'num' : 'dim' }, c.both ? 'You are holding both halves right now.' : 'You have one half of this. Another molecule would have to bring the other.')));
          });
        }
      }
      const tagOf = (l) => (l === 'NH2' ? 'NH₂' : l === 'PO4' ? 'PO₄' : l === 'COOH' ? 'COOH' : 'OH');

      /* ---------------- drawing ---------------- */
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        S.t += dt;
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        V.step(dt);
        V.frame(cw, ch, 2.15, { x: 0, y: 0, z: 0 });
        const sc = V.scale, R = sc * 0.34;
        S.hits = [];
        const add3 = BL.v3.add, mul3 = BL.v3.mul;
        const QC = CARB.map((p) => V.project(p));

        V.add((QC[0].z + QC[1].z) / 2, () => BL.stick3(ctx, QC[0], QC[1], R * 0.5, { ta: BL.sphereR(QC[0], R) * 0.9, tb: BL.sphereR(QC[1], R) * 0.9 }));

        SOCK.forEach((sk, i) => {
          const g = GROUPS[S.g[i]], isH = S.g[i] === 'H';
          const over = S.hover === i;
          const reach = isH ? 0.95 : 1.5;
          const q = V.project(add3(CARB[sk.c], mul3(sk.d, reach)));
          const bond = BL.sphereR(QC[sk.c], R);
          V.add(q.z, () => {
            if (isH) {
              BL.stick3(ctx, QC[sk.c], q, R * 0.3, { color: BL.alpha(pal.fg, 0.16 + 0.34 * q.d), ta: bond * 0.9, tb: BL.sphereR(q, R * 0.5) * 0.9 });
              BL.sphere3(ctx, q, R * 0.5 * (over ? 1.3 : 1), pal.pos, 'H', over ? { ring: pal.ui } : null);
              S.hits.push({ x: q.x, y: q.y, r: R * 0.5 + 12, i });
            } else {
              BL.stick3(ctx, QC[sk.c], q, R * 0.34, { color: BL.alpha(pal.fg, 0.2 + 0.5 * q.d), ta: bond * 0.9 });
              ctx.save();
              ctx.globalAlpha = 0.55 + 0.45 * q.d;
              const box = O.pill(ctx, q.x, q.y, '—' + g.tag, { color: pal[g.color] || pal.ui, size: Math.max(13, sc * 0.3) * (0.82 + 0.3 * q.d) });
              if (over) { ctx.lineWidth = 3; ctx.strokeStyle = pal.ui; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(q.x - box.w / 2 - 4, q.y - box.h / 2 - 4, box.w + 8, box.h + 8, box.h / 2 + 4); else ctx.rect(q.x - box.w / 2 - 4, q.y - box.h / 2 - 4, box.w + 8, box.h + 8); ctx.stroke(); }
              ctx.restore();
              S.hits.push({ x: q.x, y: q.y, r: Math.max(box.w, box.h) / 2 + 4, i });
            }
          });
        });
        QC.forEach((q) => V.add(q.z, () => BL.sphere3(ctx, q, R, pal.el.C, 'C')));
        V.flush();

        V.cue(ctx, pal);
        if (S.hint && !BL.reduced) {
          const t = (performance.now() / 600) % TAU;
          const hit = S.hits.find((x) => S.g[x.i] === 'H');
          if (hit) {
            ctx.lineWidth = 2.5; ctx.strokeStyle = BL.alpha(pal.ui, 0.5 + 0.4 * Math.sin(t));
            ctx.beginPath(); ctx.arc(hit.x, hit.y, hit.r + 3 * Math.sin(t), 0, TAU); ctx.stroke();
          }
          BL.label(ctx, 'pick a handle, then tap a hydrogen · drag to turn', cw / 2, 24, { font: BL.font(700, 14), border: pal.ui });
        }
        drawCup();
      }

      function drawCup() {
        const c = cup.ctx, cw = cup.w, ch = cup.h, pal = BL.pal;
        if (!cw) return;
        let W = S.W;
        const m = mixes();
        /* How hard the molecule's handles grip is the one thing the slider
           changes. Everything the water then does, it does by itself. */
        W.hs[SOLUTE] = clamp(m * 1.3, 0, 1.3);
        W.ls[SOLUTE] = 1;
        const t0 = performance.now();
        let k = 0;
        while (k < 30 && performance.now() - t0 < 5) { M.step(W, 0.004); k++; }
        if (!sane(W)) { newWater(); W = S.W; }

        c.clearRect(0, 0, cw, ch);
        const u = Math.min(cw / WW, ch / WH);
        const sx = W.x[SOLUTE] * u, sy = W.y[SOLUTE] * u;
        BL.blob(c, sx, sy, u * 0.95, u * 0.8, 0, m > 0.45 ? pal.neg : pal.eTail, 0.5);
        for (let i = 0; i < NW; i++) BL.mol.water(c, W.x[i] * u, W.y[i] * u, W.th[i], u * 0.9, pal, { label: false, lone: 0.55 });
        // the molecule itself, on top, with its handles showing
        O.pill(c, sx, sy, groups().length ? groups().map((g) => '—' + GROUPS[g].tag).join(' ') : 'C₂H₆',
          { color: m > 0.45 ? pal.neg : pal.eTail, size: Math.max(13, u * 0.34) });
        // and the hands it is actually holding
        const hs2 = M.handshakes(W).list.filter(([i, , j]) => i === SOLUTE || j === SOLUTE);
        const sa = [0, 0], sb = [0, 0];
        hs2.forEach(([i, a, j, bb, g]) => {
          M.site(W, i, a, sa); M.site(W, j, bb, sb);
          O.weakBond(c, sa[0] * u, sa[1] * u, sb[0] * u, sb[1] * u, { width: Math.max(3, u * 0.1) });
        });
        BL.label(c, hs2.length ? 'water is holding on to it — ' + hs2.length + (hs2.length === 1 ? ' hand' : ' hands') : 'water has found nothing to hold',
          cw / 2, ch - 16, { font: BL.font(700, 13), border: hs2.length ? pal.neg : pal.eTail });
      }

      newWater();
      say();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); cup.destroy(); } };
    },
  });
})();
