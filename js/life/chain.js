/* Chain: run the template a hundred times and count what comes out.

   One bond, one water. Run it again: two bonds, two waters. The thing worth
   arriving at is that joining n blocks in a line takes n−1 bonds and lets
   n−1 waters go, not n — and that this is true whichever family you are
   building, because it was always the same reaction.

   The other half is the size names. Monosaccharide, disaccharide,
   oligosaccharide, polysaccharide sound like four different substances and
   are four different lengths of the same one. So the name on the readout
   changes while you drag, and nothing else about the molecule does. */
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
    lede: 'Blocks joining into a line, one bond at a time. Every bond costs one run of the reaction and lets one water go, and the counters keep track. Drag the chain long and watch the name change while nothing else about it does.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const MAXN = 120;
      const S = { fam: 0, n: 1, spent: 0, back: 0, water: 0, built: new Set(), hint: true, pop: [], t: 0 };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A chain of building blocks, wrapped over several rows, with a tally of the water molecules that came out while it was being built.',
        focusable: true,
      });
      const ctx = stage.ctx;
      const fam = () => FAM[S.fam];
      const cap = () => (fam().id === 'fatty' ? 3 : MAXN);
      const sizeOf = (n) => { const r = fam().sizes.find((x) => n <= x[0]); return r || fam().sizes[fam().sizes.length - 1]; };

      function setN(n, quiet) {
        const want = clamp(Math.round(n), 1, cap());
        if (want === S.n) return;
        if (want > S.n) {
          const made = want - S.n;
          S.water += made; S.spent += made;
          for (let k = 0; k < Math.min(made, 8); k++) S.pop.push({ t: 0, i: S.n + k });
        } else {
          const broke = S.n - want;
          S.water = Math.max(0, S.water - broke); S.back += broke;
        }
        S.n = want;
        S.hint = false;
        if (!quiet) { nIn.value = String(S.n); }
        check(); say();
      }

      function check() {
        if (S.n >= 2) steps.done('two');
        if (S.n >= 10) { steps.done('ten'); S.built.add(fam().id); }
        if (S.n >= 100 && fam().id === 'sugar') steps.done('poly');
        if (S.back >= 99) steps.done('undo');
        if (S.spent >= 19 && S.back >= 19) steps.done('ledger');
        if (S.built.size >= 2) steps.done('same');
      }

      /* ---------------- dock ---------------- */
      const famBtns = FAM.map((f, i) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(S.fam === i),
        onclick: () => {
          S.fam = i; famBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
          S.n = 1; S.water = 0; S.pop.length = 0;
          nIn.max = String(cap()); nIn.value = '1';
          say(); check();
        },
      }, f.tab));
      dock.appendChild(h('section', {},
        h('h2', {}, 'Which building blocks'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Which family' }, famBtns)));

      const nOut = h('output', { class: 'val' });
      const nIn = h('input', { type: 'range', min: '1', max: String(MAXN), step: '1', value: '1', 'aria-label': 'How many blocks in the chain' });
      nIn.addEventListener('input', () => setN(parseFloat(nIn.value), true));
      dock.appendChild(h('section', {},
        h('div', { class: 'ctl' },
          h('div', { class: 'row' }, h('h2', {}, 'How long'), nOut),
          h('div', { class: 'range-wrap' }, nIn, h('div', { class: 'range-ends' }, h('span', {}, 'one block'), h('span', {}, 'a long chain')))),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action', onclick: () => setN(S.n + 1) }, 'Join one on'),
          h('button', { type: 'button', class: 'action', onclick: () => setN(S.n + 10) }, 'Join ten on'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => setN(S.n - 1) }, 'Add water, split one off'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => setN(1) }, 'Split it all'))));

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
        const f = fam(), sz = sizeOf(S.n);
        nOut.textContent = S.n + (S.n === 1 ? ' block' : ' blocks');
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, sz[1]),
          h('span', { class: 'zone' }, S.n + ' × ' + f.unit),
          h('span', { class: 'dim' }, S.n === 2 ? '1 ' + f.bond.replace(/s$/, '') : Math.max(0, S.n - 1) + ' ' + f.bond));
        statusP.textContent = sz[2];
        counts.textContent = '';
        counts.append(
          h('p', { class: 'fact' }, h('b', {}, 'Blocks in the chain. '), String(S.n)),
          h('p', { class: 'fact' }, h('b', {}, 'Bonds holding it together. '), String(Math.max(0, S.n - 1)) + ' — always one fewer than the blocks, because the two end blocks each only hold on at one side.'),
          h('p', { class: 'fact' }, h('b', {}, 'Waters squeezed out. '), String(S.water) + ' — one per bond, and not one more.'),
          h('p', { class: 'fact' }, h('b', {}, 'Waters you would need to undo it. '), String(Math.max(0, S.n - 1)) + ' — exactly the ones that left.'));
        const hi = Math.max(20, S.spent, S.back);
        spentM.set(S.spent / hi, S.spent + (S.spent === 1 ? ' bond made' : ' bonds made'), '');
        backM.set(S.back / hi, S.back + (S.back === 1 ? ' bond broken' : ' bonds broken'), '');
        backM.tone(BL.pal.tDipole);
        sizeNote.textContent = f.id === 'fatty'
          ? 'Fats are the odd one out. Glycerol has exactly three hydroxyls, so three fatty acids fill it and there is nowhere to put a fourth. That is why a fat is a fixed little object and a starch can be any length at all.'
          : 'At one block it has one name. At two, another. At ten, another. At a hundred, another again — and at no point did the reaction, the bond or the blocks change.';
      }

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

        for (let i = 0; i < S.n; i++) {
          const c = i % cols, r = (i / cols) | 0;
          const x = gx(c), y = gy(r);
          if (i) {
            const pc = (i - 1) % cols, pr = ((i - 1) / cols) | 0;
            O.bond(ctx, gx(pc), gy(pr), x, y, { width: Math.max(2, cell * 0.17), color: BL.alpha(pal.ui, 0.85) });
          }
          ctx.save();
          ctx.beginPath();
          const s2 = cell * 0.46;
          if (ctx.roundRect) ctx.roundRect(x - s2, y - s2, s2 * 2, s2 * 2, Math.max(2, s2 * 0.35)); else ctx.rect(x - s2, y - s2, s2 * 2, s2 * 2);
          ctx.fillStyle = BL.alpha(tint, pal.dark ? 0.34 : 0.24); ctx.fill();
          ctx.lineWidth = Math.max(1.2, cell * 0.06); ctx.strokeStyle = BL.alpha(tint, 0.95); ctx.stroke();
          ctx.restore();
        }
        const nb = Math.max(0, S.n - 1);
        BL.label(ctx, sizeOf(S.n)[1] + ' · ' + S.n + (S.n === 1 ? ' block, ' : ' blocks, ') + nb + (nb === 1 ? ' bond' : ' bonds'),
          cw / 2, ch - 16, { font: BL.font(800, 15), border: pal.ui });

        // the waters that came out, as a tally across the top
        const shown = Math.min(S.water, 18);
        const wu = clamp(cw / 26, 12, 26);
        for (let i = 0; i < shown; i++) {
          const x = cw / 2 + (i - (shown - 1) / 2) * wu * 1.25;
          const bob = Math.sin(S.t * 1.4 + i) * (BL.reduced ? 0 : wu * 0.09);
          BL.mol.water(ctx, x, top * 0.56 + bob, -Math.PI / 2, wu, pal, { label: false, lone: 0.45 });
        }
        BL.label(ctx, S.water === 0 ? 'no water out yet' : S.water + (S.water === 1 ? ' water out' : ' waters out') + (S.water > shown ? ' (showing ' + shown + ')' : ''),
          cw / 2, top * 0.56 + wu * 1.5, { font: BL.font(700, 14), border: pal.neg });

        if (S.hint && !BL.reduced) {
          BL.label(ctx, 'drag the chain longer and count the waters →', cw / 2, 20, { font: BL.font(700, 14), border: pal.ui });
        }
      }

      say();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); } };
    },
  });
})();
