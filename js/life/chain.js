/* Chain: run the template a hundred times and count what comes out.

   One bond, one water. Run it again: two bonds, two waters. The thing worth
   arriving at is that joining n blocks in a line takes n−1 bonds and lets
   n−1 waters go, not n — and that this is true whichever family you are
   building, because it was always the same reaction.

   The other half is the size names. Monosaccharide, disaccharide,
   oligosaccharide, polysaccharide sound like four different substances and
   are four different lengths of the same one. So the name on the readout
   changes while you drag, and nothing else about the molecule does.

   And the bonds are things you can touch. Tap one and a water goes into it
   and the chain comes apart there; tap the gap and the water comes out and it
   closes. Break one in the middle of a long chain and you have two shorter
   chains and have used exactly one water — which is what digestion is. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;
  const TAU = Math.PI * 2;

  const FAM = [
    { id: 'sugar', tab: 'Sugars', unit: 'monosaccharide', bond: 'glycosidic bonds', tint: () => BL.pal.tDipole,
      sizes: [[1, 'a monosaccharide', 'one sugar. Glucose, say — the one your blood carries round.'],
        [2, 'a disaccharide', 'two sugars. Glucose plus fructose is table sugar; glucose plus galactose is the sugar in milk.'],
        [10, 'an oligosaccharide', 'between three and ten. These sit on the outside of your cells as name tags — your blood group is one of them.'],
        [99, 'a long chain', 'past ten and heading for a polysaccharide.'],
        [1e9, 'a polysaccharide', 'a hundred or more. Starch, glycogen and cellulose are all this, all built out of glucose.']] },
    { id: 'amino', tab: 'Amino acids', unit: 'amino acid', bond: 'peptide bonds', tint: () => BL.pal.eN,
      sizes: [[1, 'an amino acid', 'one on its own. Twenty of these are all your proteins are made of.'],
        [2, 'a dipeptide', 'two joined. Aspartame, the sweetener, is one of these.'],
        [49, 'a peptide', 'a short chain. Insulin is 51 of these, which is about where a peptide starts being called a protein.'],
        [1e9, 'a polypeptide — a protein', 'a long chain. The average protein in you is around three hundred.']] },
    { id: 'nucl', tab: 'Nucleotides', unit: 'nucleotide', bond: 'phosphodiester bonds', tint: () => BL.pal.tIondipole,
      sizes: [[1, 'a nucleotide', 'one on its own. ATP, the molecule that pays for everything in you, is one of these with two extra phosphates.'],
        [2, 'a dinucleotide', 'two joined.'],
        [49, 'a short strand', 'a handful. Long enough to be a primer, not long enough to be a gene.'],
        [1e9, 'a nucleic acid', 'a long strand. One human chromosome is about two hundred million of these in a row.']] },
    { id: 'fatty', tab: 'Fatty acids', unit: 'fatty acid', bond: 'ester bonds', tint: () => BL.pal.eTail,
      sizes: [[1, 'a free fatty acid', 'one tail on its own.'],
        [2, 'a diglyceride', 'two tails on a glycerol.'],
        [3, 'a triglyceride — a fat', 'three tails on one glycerol, and the glycerol has run out of hydroxyls. This is where fats stop: there is no fourth place to put one.'],
        [1e9, 'more than a glycerol can hold', 'a fat tops out at three. The other three families go on as long as you like; this one does not.']] },
  ];

  const STEPS = [
    { id: 'two', text: 'Join two blocks together and count the waters.',
      how: 'Press “Join one on” once, so there are two blocks in the chain.',
      ask: 'two blocks, joined. How many waters came out?',
      opts: ['One', 'Two', 'None'], right: 0 },
    { id: 'ten', text: 'Build a chain of ten.',
      how: 'Drag the slider to ten, or press “Join ten on”.',
      ask: 'ten blocks joined in a line. How many waters have left in total?',
      opts: ['Ten', 'Nine', 'Eleven'], right: 1 },
    { id: 'poly', text: 'Grow a sugar chain past a hundred.',
      how: 'On Sugars, drag the slider all the way right and watch the name under the chain.',
      ask: 'a hundred sugars joined in a row. What is it called?',
      opts: ['A polysaccharide', 'A disaccharide', 'An oligosaccharide'], right: 0 },
    { id: 'snip', text: 'Break one bond in the middle of a long chain.',
      how: 'Build ten blocks, then tap the join between two of the middle ones.',
      ask: 'one bond broken in the middle of a ten-block chain. What have you got?',
      opts: ['Two shorter chains, and one water used up', 'One shorter chain and a loose block', 'Nothing — a chain will not break in the middle'], right: 0 },
    { id: 'undo', text: 'Break the whole chain back down.',
      how: 'Press “Split it all” and watch the water counter.',
      ask: 'to split a hundred-block chain back into a hundred loose blocks, how many waters do you have to put in?',
      opts: ['A hundred', 'Ninety-nine', 'One'], right: 1 },
    { id: 'ledger', text: 'Build it, then break it, and read the ledger.',
      how: 'Build to twenty, then split it all, and compare “spent” with “got back”.',
      ask: 'you built the chain and then took it apart again. What happened to the energy?',
      opts: ['Came back out, as much as went in', 'You ended up ahead', 'All of it went to heat'], right: 0 },
    { id: 'same', text: 'Switch families and build ten again.',
      how: 'Press another tab and take the slider back to ten.',
      ask: 'does the number of waters depend on which family you are building?',
      opts: ['Yes, each family is different', 'No, it is the same count every time'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g fill="var(--t-dipole)" opacity=".4" stroke="var(--t-dipole)" stroke-width="3">' +
    '<rect x="14" y="66" width="34" height="34" rx="8"/><rect x="58" y="66" width="34" height="34" rx="8"/>' +
    '<rect x="102" y="66" width="34" height="34" rx="8"/><rect x="146" y="66" width="34" height="34" rx="8"/></g>' +
    '<g stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M48 83 H58"/><path d="M92 83 H102"/><path d="M136 83 H146"/></g>' +
    '<g fill="var(--neg)"><circle cx="53" cy="30" r="9"/><circle cx="97" cy="30" r="9"/><circle cx="141" cy="30" r="9"/></g></svg>';

  BL.register({
    id: 'chain', field: 'build', order: 1, name: 'Chain',
    tagline: 'Run the same reaction a hundred times and keep the receipts.',
    lede: 'Blocks joining into a line, one bond at a time. Every bond costs one run of the reaction and lets one water go, and the counters keep track. Build it long and watch the name change while nothing else about it does — then tap the bonds themselves to break the chain wherever you like.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const MAXN = 120;
      /* joined[i] is whether block i is held to block i+1. A bond is made by a
         dehydration (a water leaves) and broken by hydrolysis (a water goes
         in), so the number of waters out is always the number of joined bonds. */
      const S = {
        fam: 0, n: 1, joined: [], spent: 0, back: 0, built: new Set(), hint: true, t: 0,
        fx: [], hits: [], hover: -1, lay: null, snipped: false,
      };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A chain of building blocks wrapped over several rows. The bonds between blocks can be tapped: a joined bond breaks and a water goes in; a gap closes and a water comes out. A tally across the top counts the waters that are out.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const fam = () => FAM[S.fam];
      const cap = () => (fam().id === 'fatty' ? 3 : MAXN);
      const sizeOf = (n) => { const r = fam().sizes.find((x) => n <= x[0]); return r || fam().sizes[fam().sizes.length - 1]; };
      const nJoined = () => S.joined.filter(Boolean).length;
      /* The lengths of the separate pieces, in blocks. */
      const pieces = () => {
        const out = []; let run = 1;
        for (let i = 0; i < S.n - 1; i++) { if (S.joined[i]) run++; else { out.push(run); run = 1; } }
        out.push(run);
        return out;
      };
      const longest = () => Math.max(...pieces());

      function setN(n) {
        const want = clamp(Math.round(n), 1, cap());
        if (want === S.n) return;
        if (want > S.n) {
          const made = want - S.n;
          for (let k = 0; k < made; k++) { S.joined.push(true); S.fx.push({ i: S.n - 1 + k, kind: 'out', t: 0 }); }
          S.spent += made;
        } else {
          const gone = S.joined.splice(want - 1).filter(Boolean).length;
          S.back += gone;
        }
        S.n = want; S.hint = false;
        nIn.value = String(S.n);
        check(); say();
      }
      /* Tap a bond: a joined one takes a water in and lets go, a gap closes and
         lets one out. */
      function toggle(i) {
        if (i < 0 || i >= S.n - 1) return;
        S.hint = false;
        if (S.joined[i]) { S.joined[i] = false; S.back++; S.fx.push({ i, kind: 'in', t: 0 }); if (pieces().length >= 2 && S.n >= 5) S.snipped = true; }
        else { S.joined[i] = true; S.spent++; S.fx.push({ i, kind: 'out', t: 0 }); }
        check(); say();
      }
      function breakAll() { for (let i = 0; i < S.n - 1; i++) if (S.joined[i]) { S.joined[i] = false; S.back++; S.fx.push({ i, kind: 'in', t: 0 }); } check(); say(); }
      function joinAll() { for (let i = 0; i < S.n - 1; i++) if (!S.joined[i]) { S.joined[i] = true; S.spent++; S.fx.push({ i, kind: 'out', t: 0 }); } check(); say(); }

      function check() {
        if (nJoined() >= 1) steps.done('two');
        if (longest() >= 10) { steps.done('ten'); S.built.add(fam().id); }
        if (longest() >= 100 && fam().id === 'sugar') steps.done('poly');
        if (S.snipped && S.n >= 10) steps.done('snip');
        if (S.back >= 99) steps.done('undo');
        if (S.spent >= 19 && S.back >= 19) steps.done('ledger');
        if (S.built.size >= 2) steps.done('same');
      }

      /* ---------------- dock ---------------- */
      const famBtns = FAM.map((f, i) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(S.fam === i),
        onclick: () => {
          S.fam = i; famBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
          S.n = 1; S.joined = []; S.fx = [];
          nIn.max = String(cap()); nIn.value = '1';
          say(); check();
        },
      }, f.tab));
      dock.appendChild(h('section', {},
        h('h2', {}, 'Which building blocks'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Which family' }, famBtns)));

      const nOut = h('output', { class: 'val' });
      const nIn = h('input', { type: 'range', min: '1', max: String(MAXN), step: '1', value: '1', 'aria-label': 'How many blocks in the chain' });
      nIn.addEventListener('input', () => setN(parseFloat(nIn.value)));
      dock.appendChild(h('section', {},
        h('div', { class: 'ctl' },
          h('div', { class: 'row' }, h('h2', {}, 'How long'), nOut),
          h('div', { class: 'range-wrap' }, nIn, h('div', { class: 'range-ends' }, h('span', {}, 'one block'), h('span', {}, 'a long chain')))),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action', onclick: () => setN(S.n + 1) }, 'Join one on'),
          h('button', { type: 'button', class: 'action', onclick: () => setN(S.n + 10) }, 'Join ten on'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => toggle(S.n - 2) }, 'Break the last bond'),
          h('button', { type: 'button', class: 'action ghost', onclick: breakAll }, 'Split it all'),
          h('button', { type: 'button', class: 'action ghost', onclick: joinAll }, 'Join them all up')),
        h('p', { class: 'hint' }, 'Or tap a bond on the picture. A joined one breaks and a water goes into it; a gap closes and a water comes out.')));

      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'chain', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const readout = h('div', { class: 'readout' });
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const counts = h('div', { class: 'facts' });
      aux.appendChild(h('section', { class: 'panel' }, readout, statusP, counts));

      const ledger = h('div', { class: 'meters' });
      const spentM = BL.meter('Energy spent building');
      const backM = BL.meter('Energy handed back on breaking');
      ledger.append(spentM.el, backM.el);
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'The ledger'), ledger,
        h('p', { class: 'hint' }, 'Building is anabolic and costs. Breaking is catabolic and pays. A body does both all day: it takes the bonds in a meal apart to pay for building the bonds it actually wants. Nothing is ever got for free — the sums here come out even on purpose, because that is what the chemistry says.')));

      const sizeNote = h('p', {});
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Why the name keeps changing'), sizeNote,
        h('p', { class: 'hint' }, 'Mono-, di-, oligo-, poly- are counting words, not chemistry words. The molecule is doing exactly the same thing at every length; only what people call it moves.')));

      function say() {
        const f = fam(), pc = pieces(), big = Math.max(...pc), sz = sizeOf(big), nj = nJoined();
        nOut.textContent = S.n + (S.n === 1 ? ' block' : ' blocks');
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, sz[1]),
          h('span', { class: 'zone' }, pc.length > 1 ? pc.length + ' pieces, the longest ' + big + ' × ' + f.unit : S.n + ' × ' + f.unit),
          h('span', { class: 'dim' }, nj === 1 ? '1 ' + f.bond.replace(/s$/, '') : nj + ' ' + f.bond));
        statusP.textContent = sz[2];
        counts.textContent = '';
        counts.append(
          h('p', { class: 'fact' }, h('b', {}, 'Blocks. '), String(S.n) + (pc.length > 1 ? ', in ' + pc.length + ' separate pieces' : '')),
          h('p', { class: 'fact' }, h('b', {}, 'Bonds holding them. '), String(nj) + ' — in one unbroken chain there is always one fewer than the blocks, because the two end blocks each only hold on at one side.'),
          h('p', { class: 'fact' }, h('b', {}, 'Waters squeezed out. '), String(nj) + ' — one per bond that is made, and not one more.'),
          h('p', { class: 'fact' }, h('b', {}, 'Waters you would need to undo it. '), String(nj) + ' — exactly the ones that left.'));
        const hi = Math.max(20, S.spent, S.back);
        spentM.set(S.spent / hi, S.spent + (S.spent === 1 ? ' bond made' : ' bonds made'), '');
        backM.set(S.back / hi, S.back + (S.back === 1 ? ' bond broken' : ' bonds broken'), '');
        backM.tone(BL.pal.tDipole);
        sizeNote.textContent = f.id === 'fatty'
          ? 'Fats are the odd one out. Glycerol has exactly three hydroxyls, so three fatty acids fill it and there is nowhere to put a fourth. That is why a fat is a fixed little object and a starch can be any length at all.'
          : 'At one block it has one name. At two, another. At ten, another. At a hundred, another again — and at no point did the reaction, the bond or the blocks change.';
      }

      /* ---------------- tapping a bond ---------------- */
      const bondAt = (pt) => {
        let best = -1, bd = 1e9;
        S.hits.forEach((hh) => { const d = Math.hypot(hh.x - pt.x, hh.y - pt.y); if (d < hh.r && d < bd) { bd = d; best = hh.i; } });
        return best;
      };
      BL.drag(stage.canvas, {
        pick: (pt) => (bondAt(pt) >= 0 ? { i: bondAt(pt) } : null),
        move: () => {},
        end: (hd) => { toggle(hd.i); },
        hover: (pt) => { S.hover = pt ? bondAt(pt) : -1; stage.canvas.style.cursor = S.hover >= 0 ? 'pointer' : 'default'; },
      });
      stage.canvas.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { toggle(S.n - 2); e.preventDefault(); }
      });

      /* ---------------- drawing ---------------- */
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        S.t += dt;
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;
        const f = fam(), tint = f.tint();
        const top = ch * 0.46;                       // the chain lives in the lower part
        const area = { x: 14, y: top, w: cw - 28, h: ch - top - 34 };

        // pick a cell size that fits the whole chain in the area
        let cell = 46, cols = 1, rows = 1;
        for (cell = 46; cell >= 7; cell -= 1) {
          cols = Math.max(1, Math.floor(area.w / (cell * 1.32)));
          rows = Math.ceil(S.n / cols);
          if (rows * cell * 1.5 <= area.h) break;
        }
        const gx = (c) => area.x + (area.w - Math.min(S.n, cols) * cell * 1.32) / 2 + c * cell * 1.32 + cell * 0.66;
        const gy = (r) => area.y + cell * 0.8 + r * cell * 1.5;
        const at = (i) => [gx(i % cols), gy((i / cols) | 0)];
        S.hits = [];

        for (let i = 0; i < S.n; i++) {
          const [x, y] = at(i);
          if (i) {
            const [px, py] = at(i - 1);
            const j = S.joined[i - 1], hov = S.hover === i - 1;
            if (j) {
              O.bond(ctx, px, py, x, y, { width: Math.max(2, cell * 0.17), color: BL.alpha(hov ? pal.pos : pal.ui, 0.9) });
            } else {
              // a gap: the water that went in is sitting where the bond was
              const mx = (px + x) / 2, my = (py + y) / 2;
              ctx.save(); ctx.setLineDash([3, 4]); ctx.lineWidth = Math.max(1.5, cell * 0.07); ctx.strokeStyle = BL.alpha(hov ? pal.ui : pal.line2, 0.8);
              ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
              if (cell >= 18) BL.mol.water(ctx, mx, my, -Math.PI / 2, Math.min(cell * 0.62, 26), pal, { label: false, lone: 0.4 });
              else { ctx.fillStyle = pal.neg; ctx.beginPath(); ctx.arc(mx, my, Math.max(2.5, cell * 0.2), 0, 7); ctx.fill(); }
            }
            S.hits.push({ x: (px + x) / 2, y: (py + y) / 2, r: Math.max(11, cell * 0.5), i: i - 1 });
            if (hov) {
              ctx.lineWidth = 2.5; ctx.strokeStyle = j ? pal.pos : pal.ui;
              ctx.beginPath(); ctx.arc((px + x) / 2, (py + y) / 2, Math.max(11, cell * 0.46), 0, 7); ctx.stroke();
            }
          }
          ctx.save();
          ctx.beginPath();
          const s2 = cell * 0.46;
          if (ctx.roundRect) ctx.roundRect(x - s2, y - s2, s2 * 2, s2 * 2, Math.max(2, s2 * 0.35)); else ctx.rect(x - s2, y - s2, s2 * 2, s2 * 2);
          ctx.fillStyle = BL.alpha(tint, pal.dark ? 0.34 : 0.24); ctx.fill();
          ctx.lineWidth = Math.max(1.2, cell * 0.06); ctx.strokeStyle = BL.alpha(tint, 0.95); ctx.stroke();
          ctx.restore();
        }

        // a water on its way in or out of a bond
        S.fx = S.fx.filter((q) => q.t < 1);
        S.fx.forEach((q) => {
          q.t += dt * 1.6;
          if (q.i >= S.n - 1) return;
          const [ax, ay] = at(q.i), [bx, by] = at(q.i + 1), mx = (ax + bx) / 2, my = (ay + by) / 2;
          const e = q.kind === 'in' ? 1 - q.t : q.t;
          ctx.save(); ctx.globalAlpha = Math.max(0, 1 - q.t * 0.3);
          BL.mol.water(ctx, mx, my - e * Math.min(60, area.h * 0.5), -Math.PI / 2, Math.min(Math.max(14, cell * 0.7), 28), pal, { label: false, lone: 0.4 });
          ctx.restore();
        });

        const sizeName = sizeOf(longest())[1];
        const nb = nJoined();
        BL.label(ctx, sizeName + ' · ' + S.n + (S.n === 1 ? ' block, ' : ' blocks, ') + nb + (nb === 1 ? ' bond' : ' bonds'),
          cw / 2, ch - 16, { font: BL.font(800, 15), border: pal.ui });
        if (S.hover >= 0) {
          BL.label(ctx, S.joined[S.hover] ? 'tap: a water goes in, and the bond lets go' : 'tap: the water comes out, and the bond forms',
            cw / 2, top - 6, { font: BL.font(700, 13), border: S.joined[S.hover] ? pal.pos : pal.ui });
        }

        // the waters that are out, as a tally across the top
        const shown = Math.min(nb, 18);
        const wu = clamp(cw / 26, 12, 26);
        for (let i = 0; i < shown; i++) {
          const x = cw / 2 + (i - (shown - 1) / 2) * wu * 1.25;
          const bob = Math.sin(S.t * 1.4 + i) * (BL.reduced ? 0 : wu * 0.09);
          BL.mol.water(ctx, x, top * 0.5 + bob, -Math.PI / 2, wu, pal, { label: false, lone: 0.45 });
        }
        BL.label(ctx, nb === 0 ? 'no water out' : nb + (nb === 1 ? ' water out' : ' waters out') + (nb > shown ? ' (showing ' + shown + ')' : ''),
          cw / 2, top * 0.5 + wu * 1.5, { font: BL.font(700, 14), border: pal.neg });

        if (S.hint && !BL.reduced) {
          BL.label(ctx, S.n > 1 ? 'tap a bond to break it' : 'join some blocks on, then tap the bonds', cw / 2, 20, { font: BL.font(700, 14), border: pal.ui });
        }
      }

      say();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
