/* Meet: why these two atoms bond the way they do.

   The usual story is backwards. Atoms are said to bond "in order to fill their
   outer shell", as if an atom could want something. Nothing in the universe
   wants a full shell. What actually happens is an accounting question:

       Can one of these two afford to simply hand an electron over?

   Handing over costs whatever it takes to pull the electron off the giver
   (its ionization energy). It pays back twice: a little from the taker, which
   is glad of one more (its electron affinity), and a lot from the pull between
   the two charged balls you are left with. If the payback covers the cost,
   the handover happens and you get an ionic bond. If it does not, neither can
   afford to let go, so they share instead, and the sharing leans toward
   whichever one pulls harder.

   The full outer shell is what is left over when the arithmetic works out.
   It is the receipt, not the reason. That is the whole point of this
   instrument: nothing in it counts shells, and it still gets the answers right.

   So the learner does the experiment themselves — drag an electron across and
   see whether the atom can afford it. Ionization energies and electron
   affinities are measured values, from js/atoms.js. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const A = BL.atoms;

  /* Once the electron has gone across you have a + ball and a − ball sitting
     at the distance they settle at. For small atoms that pull is worth about
     this much. One number, stated plainly, rather than a fake precision. */
  const PAYBACK = 6.0;             // eV, per unit of charge squared, at full grip
  const CALL = 1.0;                // eV either side of break-even: too close to call
  const GRIP = 1.6;                // eV of pull gap for the payback to come good

  /* The first twenty, minus the noble gases, which bond with nobody here. */
  const PICKS = A.EL.filter((e) => !['He', 'Ne', 'Ar'].includes(e.sym));

  /* Pairs worth meeting, as shortcuts. */
  const FAMOUS = [
    ['Na', 'Cl', 'table salt'], ['H', 'H', 'hydrogen gas'], ['O', 'H', 'water'],
    ['C', 'H', 'methane'], ['Mg', 'O', 'firework grit'], ['K', 'Cl', 'a salt substitute'],
    ['C', 'O', 'carbon dioxide'], ['Li', 'F', 'a battery salt'], ['N', 'H', 'ammonia'],
    ['Ca', 'Cl', 'the grit on icy roads'],
  ];

  /* How many electrons an atom would plausibly hand over, and how many another
     would plausibly take. Magnesium and oxygen do it two at a time, and that
     matters: two charges pull four times as hard as one. Capped at two, which
     is as far as the measured second ionization energies here go. */
  const nGive = (el) => { const v = A.valenceN(el.Z); return Math.min(2, v <= 3 ? v : 1); };
  const nTake = (el) => { const v = A.valenceN(el.Z); return Math.min(2, v >= 5 ? 8 - v : 1); };

  /* How hard an atom pulls on electrons overall: the average of what it costs
     to take one off and what it gains by taking one on. Mulliken's measure,
     and it is built from the two numbers this instrument already uses. */
  const pull = (el) => (el.ie + el.ea) / 2;

  /* One direction of the handover, costed out.

     The payback is the pull between the + ball and the − ball you are left
     with — but you only get two charged balls if the electron actually stays
     where you put it. Between two atoms that hold electrons equally loosely
     nothing stays put, there is no + and no −, and there is nothing to pay
     you back. So the payback is scaled by how much more tightly the taker
     grips than the giver does. Two sodiums, or a sodium and a potassium, earn
     almost none of it — which is why no such salt has ever existed. */
  function run(giver, taker) {
    const n = Math.min(nGive(giver), nTake(taker));
    const cost = giver.ie + (n >= 2 && giver.ie2 ? giver.ie2 : 0);
    const take = n * taker.ea;
    const gap = Math.max(0, pull(taker) - pull(giver));
    const grip = 1 - Math.exp(-gap / GRIP);
    const pay = n * n * PAYBACK * grip;
    return { giver, taker, n, cost, take, pay, gap, grip, net: pay + take - cost };
  }

  /* Which way round, if either, the handover is worth doing. */
  function balance(a, b) {
    // Two of the same element have no pull gap at all, so the model already
    // gives them nothing. This branch only exists to say so more plainly.
    if (a.sym === b.sym) {
      const one = run(a, b);
      one.twin = true; one.verdict = 'share';
      return one;
    }
    const one = run(a, b), two = run(b, a);
    const best = one.net >= two.net ? one : two;
    best.other = best === one ? two : one;
    best.verdict = best.net > CALL ? 'hand' : best.net < -CALL ? 'share' : 'close';
    return best;
  }

  const VERDICT = {
    hand: {
      name: 'One of them simply takes it',
      kind: 'Ionic',
      say: 'The handover pays for itself, so it happens. You are left with a + ball and a − ball stuck to each other — and in real life, to every other ion within reach, which is why this stuff is a hard crystal.',
    },
    close: {
      name: 'Too close to call',
      kind: 'Very polar',
      say: 'The handover almost pays for itself. Real pairs in this band are hard to label: the electrons mostly live on one atom but have not quite moved out. This is the muddy middle of the spectrum, and it is where most of the interesting chemistry lives.',
    },
    share: {
      name: 'Neither can afford to let go',
      kind: 'Covalent',
      say: 'Taking the electron off costs far more than it pays back, so no handover happens. They share instead — and the sharing leans toward whichever one pulls harder, which is where a δ+ end and a δ− end come from.',
    },
  };

  const GOALS = [
    { id: 'try', text: 'Drag an electron from one atom to the other and see whether it can afford it.' },
    { id: 'ionic', text: 'Find a pair where the handover pays for itself.' },
    { id: 'share', text: 'Find a pair where it is far too expensive, so they share.' },
    { id: 'close', text: 'Find a pair that lands in the middle, too close to call.' },
    { id: 'guess', text: 'Predict a pair correctly before you test it.' },
    { id: 'five', text: 'Test five different pairs.' },
    { id: 'direction', text: 'Find a pair where the handover works one way round and not the other.' },
    { id: 'shell', text: 'Open “What about full shells?” and read what the arithmetic never used.' },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g fill="none" stroke="currentColor" stroke-width="3"><circle cx="58" cy="60" r="26"/><circle cx="142" cy="60" r="26"/></g>' +
    '<circle cx="84" cy="60" r="6.5" fill="var(--electron)"/>' +
    '<path d="M92 60 h22" stroke="var(--electron)" stroke-width="3.5" stroke-dasharray="5 4"/>' +
    '<path d="M120 60 l-9 -6 v12z" fill="var(--electron)"/>' +
    '<text x="58" y="106" font-size="19" font-weight="700" text-anchor="middle" fill="currentColor">+</text>' +
    '<text x="142" y="106" font-size="19" font-weight="700" text-anchor="middle" fill="currentColor">−</text></svg>';

  BL.register({
    id: 'meet', field: 'bonding', order: 1, name: 'Meet',
    tagline: 'Can one of them afford to hand an electron over?',
    lede: 'Two atoms, close enough to react. Drag one of the outer electrons across and find out whether that atom can afford to let it go.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock, params }) {
      const S = {
        a: A.bySym.Na, b: A.bySym.Cl,
        phase: 'rest',           // rest | dragging | moving | ionic | shared | bounced
        t: 0, held: null, hx: 0, hy: 0,
        guess: null, guessed: null, tested: new Set(), sawBoth: false,
        shake: 0, shown: false,
      };
      const pre = (params && params[0] || '').split('-');
      if (pre.length === 2 && A.bySym[pre[0]] && A.bySym[pre[1]]) { S.a = A.bySym[pre[0]]; S.b = A.bySym[pre[1]]; }

      const B = () => balance(S.a, S.b);

      const stage = BL.stage(stageHost, '16 / 7.8', {
        label: 'Two atoms with their outer electrons drawn as dots. Drag an outer electron onto the other atom to attempt a handover. With the stage focused, press Enter to attempt the cheapest handover and Escape to start over.',
        focusable: true,
      });
      stage.wrap.classList.add('meet-stage');
      const ctx = stage.ctx;

      const L = {};
      stage.onresize = () => {
        const W = stage.w, H = stage.h;
        L.cy = H * 0.5;
        L.r = clamp(Math.min(W * 0.155, H * 0.34), 36, 122);
        L.gap = L.r * (3.1 - (S.phase === 'ionic' ? 0.85 * (S.t * S.t * (3 - 2 * S.t)) : 0));
        L.ax = W * 0.5 - L.gap / 2;
        L.bx = W * 0.5 + L.gap / 2;
      };
      stage.onresize();

      /* Where an atom's outer electrons sit, as a ring of dots. */
      function dots(el, cx, lost) {
        const n = Math.max(0, A.valenceN(el.Z) - (lost || 0));
        const out = [];
        for (let i = 0; i < n; i++) {
          const ang = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2;
          out.push({ x: cx + Math.cos(ang) * L.r * 0.82, y: L.cy + Math.sin(ang) * L.r * 0.82, i });
        }
        return out;
      }

      /* ---------------- pointer ---------------- */
      BL.drag(stage.canvas, {
        pick: (p) => {
          if (S.phase === 'ionic' || S.phase === 'shared' || S.phase === 'moving') return null;
          for (const side of ['a', 'b']) {
            const cx = side === 'a' ? L.ax : L.bx;
            for (const d of dots(S[side], cx, 0)) {
              if (Math.hypot(p.x - d.x, p.y - d.y) < 26) return { side, i: d.i };
            }
          }
          return null;
        },
        move: (hnd, p) => { S.held = hnd; S.phase = 'dragging'; S.hx = p.x; S.hy = p.y; },
        end: (hnd, p) => {
          const toward = hnd.side === 'a' ? L.bx : L.ax;
          const close = Math.abs(p.x - toward) < L.r * 1.5 && Math.abs(p.y - L.cy) < L.r * 1.6;
          attempt(hnd.side, close);
        },
      });
      stage.canvas.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const bal = B();
          attempt(bal.giver === S.a ? 'a' : 'b', true);
        } else if (e.key === 'Escape') { e.preventDefault(); reset(); }
      });

      function attempt(side, close) {
        if (!close) { S.held = null; S.phase = 'rest'; return; }
        const giver = side === 'a' ? S.a : S.b, taker = side === 'a' ? S.b : S.a;
        /* The same sum the panel shows — not a second copy of it. The electron
           only stays across if this direction genuinely pays; a near miss
           springs back, because a near miss is a shared bond, not an ionic one. */
        const t = S.a.sym === S.b.sym ? { net: -99, gap: 0 } : run(giver, taker);
        S.attempt = { side, net: t.net, gap: t.gap, giver, taker, ok: t.net > CALL };
        S.tested.add(S.a.sym + S.b.sym);
        S.phase = 'moving'; S.t = 0;
        goals.done('try');
        if (S.tested.size >= 5) goals.done('five');
        const bal = B();
        if (bal.verdict === 'hand') goals.done('ionic');
        if (bal.verdict === 'share') goals.done('share');
        if (bal.verdict === 'close') goals.done('close');
        if (!bal.twin && bal.other && (bal.net > CALL) !== (bal.other.net > CALL)) goals.done('direction');
        if (S.guess && S.guessed !== (S.a.sym + S.b.sym)) {
          S.guessed = S.a.sym + S.b.sym;
          const right = (S.guess === 'hand' && bal.verdict !== 'share') || (S.guess === 'share' && bal.verdict !== 'hand');
          S.guessRight = right;
          if (right) goals.done('guess');
        }
        syncVerdict();
      }
      function reset() { S.phase = 'rest'; S.held = null; S.attempt = null; S.t = 0; S.guess = null; S.guessRight = null; syncVerdict(); }

      /* ---------------- the books (aux) ---------------- */
      let shellFold;
      const headline = h('p', { class: 'verdict' });
      const mCost = BL.meter('Pulling it off the giver costs');
      const mTake = BL.meter('The taker is glad of it, worth');
      const mGap = BL.meter('How much harder the taker holds electrons');
      const mPull = BL.meter('The two charged balls pulling, worth');
      const netLine = h('p', { class: 'net-line' });
      const saying = h('p', { class: 'hint' });
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'The books, for this handover'),
        headline, mCost.el, mTake.el, mGap.el, mPull.el, netLine, saying,
        shellFold = BL.fold('What about full shells?',
          h('p', { class: 'hint' }, 'Look back at what that sum used: how hard the giver holds on, how glad the taker is, and how strongly the two charged balls pull. Not one line of it counted electrons in a shell, and it still got the answer right.'),
          h('p', { class: 'hint' }, 'The reason the arithmetic works out for sodium and chlorine is that sodium’s outermost electron is the only one in its shell, so almost nothing holds it — and chlorine’s outer shell is one short, so an extra electron falls straight into a tight spot. The full shells are the shape of those numbers, not a goal either atom is working toward. The bond is the consequence; the tidy shells are the receipt.'),
          h('p', { class: 'hint' }, 'That is worth holding on to, because the shell story quietly breaks the first time you meet something it was never built for, and this one does not.')),
        BL.fold('Where these numbers come from',
          h('p', { class: 'hint' }, 'The cost of pulling an electron off and the gladness of taking one in are both measured in a laboratory, and are the real values for these elements. The payback is a round figure: once the two are charged, they do not only pull on each other, they pull on every ion packed around them, and for small atoms that comes to roughly '
            + PAYBACK.toFixed(1) + ' electron volts per unit of charge each way. Two charges pull four times as hard, which is why magnesium and oxygen can afford to move two at once.'),
          h('p', { class: 'hint' }, 'It is a round figure on purpose. Swapping it for the exact one for every pair would change which side of the line a handful of borderline pairs land on, and would not change a single thing about how the decision is made.'))));

      shellFold.addEventListener('toggle', () => { if (shellFold.open) goals.done('shell'); });

      /* One picture that does what no pair-by-pair test can: every element laid
         out by how tightly it holds its outermost electron. The givers pile up
         at one end, the takers at the other, and the rule falls out of the
         picture — one from each end and the handover pays, two from the same
         end and it never does. That is the metals-and-non-metals split, arrived
         at rather than announced. */
      const mapCv = BL.stage(h('div'), '3.4 / 1', {
        label: 'Every element laid out by how tightly it holds its outermost electron, with the two you have chosen marked. Click an element to load it.',
      });
      mapCv.wrap.classList.add('flat', 'dial');
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'Who gives, who takes'),
        mapCv.wrap,
        h('p', { class: 'hint' }, 'The distance between two elements on this line is the whole story. Far apart and the handover pays for itself: that is an ionic bond, and it is what "a metal plus a non-metal" has always meant. Close together — two metals, or two non-metals — and there is no reason for an electron to move at all, so they share instead. Nobody had to tell you where the metals are; the measurements put them there.')));

      const mapHit = [];
      mapCv.canvas.addEventListener('click', (e) => {
        const r = mapCv.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        let best = null, bd = 26;
        mapHit.forEach((m) => { const d = Math.hypot(x - m.x, y - m.y); if (d < bd) { bd = d; best = m; } });
        if (!best) return;
        // the second click on a different element fills the other slot
        if (S.a.sym === best.el.sym || S.b.sym === best.el.sym) return;
        S.b = S.a; S.a = best.el;
        reset(); stage.onresize(); sync();
      });
      mapCv.canvas.addEventListener('pointermove', (e) => {
        const r = mapCv.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        mapCv.canvas.style.cursor = mapHit.some((m) => Math.hypot(x - m.x, y - m.y) < 26) ? 'pointer' : 'default';
      });

      function drawMap() {
        const c = mapCv.ctx, W = mapCv.w, H = mapCv.h, pal = BL.pal;
        if (!W) return;
        c.clearRect(0, 0, W, H);
        mapHit.length = 0;
        const f = BL.fs(13);
        const lo = 2.0, hi = 11.0;
        const pad = { l: 14, r: 14, t: f * 2.2, b: f * 2.6 };
        const X = (v) => pad.l + ((BL.clamp(v, lo, hi) - lo) / (hi - lo)) * (W - pad.l - pad.r);
        const yMid = pad.t + (H - pad.t - pad.b) * 0.52;
        // the two ends, as bands
        const GIVE = 5.0, TAKE = 5.6;
        c.fillStyle = BL.alpha(pal.pos, 0.1);
        c.fillRect(pad.l, pad.t, X(GIVE) - pad.l, H - pad.t - pad.b);
        c.fillStyle = BL.alpha(pal.neg, 0.1);
        c.fillRect(X(TAKE), pad.t, W - pad.r - X(TAKE), H - pad.t - pad.b);
        c.font = BL.font(700, 13); c.textBaseline = 'alphabetic';
        c.fillStyle = pal.muted;
        c.fillStyle = pal.pos; c.textAlign = 'left'; c.fillText('hands electrons over, ends up +', pad.l + 2, f * 1.2);
        c.fillStyle = pal.neg; c.textAlign = 'right'; c.fillText('takes them, ends up −', W - pad.r - 2, f * 1.2);
        // the line itself
        c.strokeStyle = pal.line2; c.lineWidth = 2;
        c.beginPath(); c.moveTo(pad.l, yMid); c.lineTo(W - pad.r, yMid); c.stroke();
        // every element, stacked where they collide
        const rows = [];
        PICKS.slice().sort((p, q) => pull(p) - pull(q)).forEach((el) => {
          const x = X(pull(el));
          let k = 0;
          while (rows[k] != null && x - rows[k] < f * 1.9) k++;
          rows[k] = x;
          const on = el.sym === S.a.sym || el.sym === S.b.sym;
          const y = yMid + (k % 2 ? 1 : -1) * Math.ceil((k + 1) / 2) * f * 1.25;
          mapHit.push({ x, y, el });
          c.strokeStyle = BL.alpha(pal.line2, 0.6); c.lineWidth = 1;
          c.beginPath(); c.moveTo(x, yMid); c.lineTo(x, y); c.stroke();
          BL.label(c, el.sym, x, y, {
            font: BL.font(on ? 800 : 400, on ? 14 : 13),
            color: on ? pal.uiInk : pal.fg,
            bg: on ? pal.ui : BL.alpha(pal.panel, 0.9),
            border: on ? pal.ui : BL.alpha(pal.line2, 0.5),
            pad: 5,
          });
        });
        if (BL.nums) {
          c.fillStyle = pal.muted; c.font = BL.font(400, 12); c.textAlign = 'center';
          [3, 5, 7, 9].forEach((v) => c.fillText(v + ' eV', X(v), H - 5));
        } else {
          c.fillStyle = pal.muted; c.font = BL.font(400, 13); c.textAlign = 'center';
          c.fillText('how hard it pulls on electrons →', W / 2, H - 5);
        }
      }

      const scaleCv = BL.stage(h('div'), '3.2 / 1', { label: 'A balance: the cost of pulling the electron off against what the handover pays back.' });
      scaleCv.wrap.classList.add('flat', 'dial');
      aux.appendChild(h('section', { class: 'panel' },
        h('h2', {}, 'Does it pay for itself?'), scaleCv.wrap,
        h('p', { class: 'hint' }, 'Tipped right, the handover happens and you get an ionic bond. Tipped left, it is too expensive and they share. The dotted band in the middle is where it is genuinely hard to call.')));

      /* ---------------- dock ---------------- */
      function picker(side, title) {
        const chips = h('div', { class: 'chips el-grid', role: 'group', 'aria-label': title });
        const btn = {};
        PICKS.forEach((e) => {
          const b = h('button', {
            class: 'chip el', type: 'button', 'aria-pressed': 'false', 'aria-label': e.name,
            onclick: () => { S[side] = e; reset(); stage.onresize(); sync(); },
          }, e.sym);
          btn[e.sym] = b; chips.appendChild(b);
        });
        return { el: h('section', {}, h('h2', {}, title), chips), btn };
      }
      const pa = picker('a', 'Atom on the left');
      const pb = picker('b', 'Atom on the right');

      const famous = h('div', { class: 'chips' }, FAMOUS.map(([x, y, note]) =>
        h('button', {
          class: 'chip', type: 'button',
          onclick: () => { S.a = A.bySym[x]; S.b = A.bySym[y]; reset(); stage.onresize(); sync(); },
        }, x + ' + ' + y, h('span', { class: 'sub' }, note))));
      dock.appendChild(h('section', {}, h('h2', {}, 'Pairs worth meeting'), famous));
      dock.appendChild(pa.el);
      dock.appendChild(pb.el);

      const guessBtns = [['share', 'They will share'], ['hand', 'One will take it']].map(([id, label]) =>
        h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => { S.guess = id; sync(); } }, label));
      const guessNote = h('p', { class: 'hint' });
      dock.appendChild(h('section', {},
        h('h2', {}, 'Call it first'),
        h('div', { class: 'seg', role: 'group', 'aria-label': 'Your prediction' }, guessBtns),
        guessNote));

      dock.appendChild(h('section', {}, h('div', { class: 'actions' },
        h('button', { class: 'action ghost', type: 'button', onclick: reset }, 'Start over'))));

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'meet', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- sync ---------------- */
      function sync() {
        PICKS.forEach((e) => {
          pa.btn[e.sym].setAttribute('aria-pressed', String(S.a.sym === e.sym));
          pb.btn[e.sym].setAttribute('aria-pressed', String(S.b.sym === e.sym));
        });
        guessBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(S.guess === ['share', 'hand'][i])));
        guessNote.textContent = S.guess == null
          ? 'Say what you think will happen, then drag an electron and find out. Guessing wrong is the cheapest way to learn something.'
          : S.guessRight == null ? 'Now drag an electron across.'
            : S.guessRight ? 'You called it.' : 'Not this time — read the sum above and see which line surprised you.';
        syncVerdict();
      }
      function syncVerdict() {
        const bal = B(), v = VERDICT[bal.verdict];
        headline.textContent = '';
        headline.append(
          h('b', { class: 'verdict-kind' }, v.kind),
          h('span', {}, v.name));
        const hold = BL.words.hold(bal.cost / bal.n);
        const many = bal.n > 1 ? ' (both of them)' : '';
        mCost.set(hold.frac, bal.giver.sym + ' ' + hold.word + many, bal.cost.toFixed(2) + ' eV');
        const want = BL.words.want(bal.take / bal.n);
        mTake.set(want.frac, bal.taker.sym + ' ' + want.word, bal.take.toFixed(2) + ' eV');
        const gap = bal.gap || 0, grip = bal.grip == null ? 0 : bal.grip;
        mGap.set(clamp(gap / 8, 0.03, 1),
          gap < 0.8 ? 'barely any harder — nothing would stay put'
            : gap < 2 ? 'a little harder' : gap < 4 ? 'much harder' : 'enormously harder',
          gap.toFixed(2) + ' eV');
        mPull.set(clamp(bal.pay / 24, 0.03, 1),
          grip < 0.3 ? 'almost nothing — no real + and − ever form'
            : bal.n > 1 ? 'two charges each way, so four times the pull' : 'a strong pull, once they are charged',
          bal.pay.toFixed(1) + ' eV');
        netLine.textContent = '';
        if (bal.twin) {
          netLine.append(h('span', { class: 'net-word bad' }, 'There is nothing to weigh up.'));
        } else {
          const over = bal.net;
          netLine.append(
            h('span', { class: 'net-word' + (over > CALL ? ' good' : over < -CALL ? ' bad' : '') },
              over > CALL ? 'The payback covers the cost.' : over < -CALL ? 'The payback does not come close.' : 'The payback very nearly covers it.'),
            BL.numv(' Net ' + (over >= 0 ? '+' : '') + over.toFixed(2) + ' eV'
              + (bal.n > 1 ? ', moving ' + bal.n + ' electrons.' : '.')));
        }
        /* The commonest wrong answer this instrument could give is an ionic
           bond between two metals, so when the pull gap is this small it says
           so outright — and names what really happens instead. */
        saying.textContent = bal.twin
          ? 'Two of the same element. Neither has the slightest reason to take from its own twin, so the only thing on the table is an even share — which is why the elements that come as pairs, like hydrogen and oxygen and nitrogen gas, are held covalently and share perfectly evenly.'
          : (bal.gap != null && bal.gap < 0.8)
            ? 'Neither of these holds electrons any more tightly than the other, so an electron has no reason to prefer one atom to the other. Nothing stays put, no + and no − ever form, and there is no payback to collect. Two metals in this position do something else entirely: they pool their outer electrons and share them among all the atoms at once. That is what a metal is, and it is why you can mix two of them into an alloy but never into a salt.'
            : v.say;
      }
      sync();

      /* ---------------- the balance drawing ---------------- */
      function drawScale() {
        const c = scaleCv.ctx, W = scaleCv.w, H = scaleCv.h, pal = BL.pal;
        if (!W) return;
        c.clearRect(0, 0, W, H);
        const bal = B(), net = clamp(bal.twin ? -8 : bal.net, -10, 10);
        const cx = W / 2, cy = H * 0.52, arm = Math.min(W * 0.33, 150);
        const ang = clamp(net / 8, -1, 1) * 0.42;
        // the band where it is too close to call
        const bw = (CALL / 8) * arm;
        c.fillStyle = BL.alpha(pal.line2, 0.18);
        c.fillRect(cx - bw, 8, bw * 2, H - 16);
        c.setLineDash([4, 4]); c.lineWidth = 1.4; c.strokeStyle = BL.alpha(pal.fg, 0.4);
        c.beginPath(); c.moveTo(cx - bw, 8); c.lineTo(cx - bw, H - 8); c.moveTo(cx + bw, 8); c.lineTo(cx + bw, H - 8); c.stroke();
        c.setLineDash([]);
        // the beam
        c.save(); c.translate(cx, cy); c.rotate(ang);
        c.lineCap = 'round'; c.lineWidth = 7; c.strokeStyle = pal.fg;
        c.beginPath(); c.moveTo(-arm, 0); c.lineTo(arm, 0); c.stroke();
        [[-arm, 'too expensive', pal.types.covalent], [arm, 'it pays', pal.types.ionic]].forEach(([x, label, col]) => {
          c.beginPath(); c.arc(x, 0, 11, 0, 7); c.fillStyle = col; c.fill();
          c.lineWidth = 2.5; c.strokeStyle = pal.panel; c.stroke();
        });
        c.restore();
        // the pivot
        c.fillStyle = pal.muted;
        c.beginPath(); c.moveTo(cx, cy + 4); c.lineTo(cx - 13, cy + 26); c.lineTo(cx + 13, cy + 26); c.closePath(); c.fill();
        // words at the ends
        c.font = BL.font(700, 13); c.fillStyle = pal.muted;
        c.textAlign = 'left'; c.fillText('they share', 6, H - 7);
        c.textAlign = 'right'; c.fillText('one takes it', W - 6, H - 7);
        c.textAlign = 'center';
        BL.label(c, VERDICT[bal.verdict].kind, cx, BL.fs(14) * 1.1,
          { font: BL.font(800, 14), color: bal.verdict === 'hand' ? pal.types.ionic : bal.verdict === 'share' ? pal.types.covalent : pal.fg, border: pal.line2 });
      }

      /* ---------------- stage drawing ---------------- */
      function drawAtom(pal, el, cx, charge, lost, dim) {
        const col = charge > 0 ? pal.pos : charge < 0 ? pal.neg : pal.fg;
        // the body
        ctx.beginPath(); ctx.arc(cx, L.cy, L.r * (charge > 0 ? 0.78 : charge < 0 ? 1.1 : 1), 0, 7);
        ctx.fillStyle = BL.alpha(col, charge ? 0.14 : 0.05); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = BL.alpha(col, dim ? 0.3 : 0.65); ctx.stroke();
        // nucleus
        BL.bigBall(ctx, cx, L.cy, Math.max(7, L.r * 0.13), col, pal.panel);
        // outer electrons
        dots(el, cx, lost).forEach((d) => {
          if (S.held && S.phase === 'dragging' && S.held.i === d.i && ((S.held.side === 'a') === (cx === L.ax))) return;
          BL.bigBall(ctx, d.x, d.y, Math.max(5, L.r * 0.1), pal.electron, pal.panel);
        });
        const f = BL.fs(14);
        BL.label(ctx, el.sym + (charge > 0 ? '⁺' : charge < 0 ? '⁻' : ''), cx, L.cy + L.r + f * 1.4, { font: BL.font(800, 19, true) });
        BL.label(ctx, el.name, cx, L.cy + L.r + f * 2.9, { font: BL.font(400, 13), color: pal.muted });
      }

      function frame(dt) {
        const pal = BL.pal, W = stage.w, H = stage.h;
        if (!W) return;
        ctx.clearRect(0, 0, W, H);
        const bal = B();

        if (S.phase === 'moving') {
          S.t += dt * (BL.reduced ? 3 : 1.6);
          if (S.t >= 1) { S.phase = S.attempt.ok ? 'ionic' : 'shared'; S.t = 0; stage.onresize(); }
        } else if (S.phase === 'ionic' || S.phase === 'shared') {
          S.t = Math.min(1, S.t + dt * (BL.reduced ? 4 : 2.2));
        }
        stage.onresize();

        const ionic = S.phase === 'ionic';
        const shared = S.phase === 'shared';
        const ease = S.t * S.t * (3 - 2 * S.t);

        // atoms, with their charges once the handover has gone through
        const gaveA = ionic && S.attempt.side === 'a', gaveB = ionic && S.attempt.side === 'b';
        if (shared) {
          // one merged cloud between them, drawn under the atoms
          const mx = (L.ax + L.bx) / 2;
          const lean = (() => {
            const ea = S.a.en || 2, eb = S.b.en || 2;
            return clamp((eb - ea) * 0.1, -0.3, 0.3);
          })();
          const g = ctx.createRadialGradient(mx + lean * L.gap, L.cy, 2, mx + lean * L.gap, L.cy, L.gap * 0.62);
          g.addColorStop(0, BL.alpha(pal.cloud, 0.34 * ease)); g.addColorStop(1, BL.alpha(pal.cloud, 0));
          ctx.fillStyle = g;
          ctx.save(); ctx.translate(mx + lean * L.gap, L.cy); ctx.scale(1, 0.6);
          ctx.beginPath(); ctx.arc(0, 0, L.gap * 0.62, 0, 7); ctx.fill(); ctx.restore();
        }
        drawAtom(pal, S.a, L.ax, gaveA ? 1 : gaveB ? -1 : 0, gaveA ? 1 : 0, false);
        drawAtom(pal, S.b, L.bx, gaveB ? 1 : gaveA ? -1 : 0, gaveB ? 1 : 0, false);

        // the electron in the learner's hand, with its price on it
        const f = BL.fs(14);
        if (S.phase === 'dragging' && S.held) {
          const giver = S.held.side === 'a' ? S.a : S.b;
          ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.strokeStyle = BL.alpha(pal.electron, 0.7);
          ctx.beginPath(); ctx.moveTo(S.held.side === 'a' ? L.ax : L.bx, L.cy); ctx.lineTo(S.hx, S.hy); ctx.stroke(); ctx.setLineDash([]);
          BL.bigBall(ctx, S.hx, S.hy, Math.max(7, L.r * 0.13), pal.electron, pal.panel);
          const hold = BL.words.hold(giver.ie);
          BL.label(ctx, giver.sym + ' ' + hold.word + (BL.nums ? ' · ' + giver.ie.toFixed(1) + ' eV' : ''), S.hx, S.hy - f * 1.9,
            { font: BL.font(700, 13), border: pal.electron });
        } else if (S.phase === 'moving') {
          const from = S.attempt.side === 'a' ? L.ax : L.bx, to = S.attempt.side === 'a' ? L.bx : L.ax;
          // it goes across, and if the atom cannot afford it, it comes straight back
          const u = S.attempt.ok ? S.t : Math.sin(S.t * Math.PI) * 0.78;
          const x = from + (to - from) * u;
          const y = L.cy - Math.sin(Math.min(1, u) * Math.PI) * L.r * 0.55;
          BL.bigBall(ctx, x, y, Math.max(7, L.r * 0.13), pal.electron, pal.panel);
          if (!S.attempt.ok && S.t > 0.45) {
            BL.label(ctx, 'too expensive — it springs back', W / 2, L.cy - L.r * 1.25,
              { font: BL.font(800, 15), color: pal.types.covalent, border: pal.types.covalent });
          }
        }

        // the result, said on the stage
        if (ionic || shared) {
          const v = VERDICT[bal.verdict];
          BL.label(ctx, (ionic ? 'handed over · ' : 'shared · ') + v.kind, W / 2, H - f * 1.5,
            { font: BL.font(800, 16, true), border: ionic ? pal.types.ionic : pal.types.covalent });
          if (ionic) {
            // the two ions pulling on each other
            ctx.strokeStyle = pal.types.ionic; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
            ctx.beginPath(); ctx.moveTo(L.ax, L.cy); ctx.lineTo(L.bx, L.cy); ctx.stroke(); ctx.setLineDash([]);
          }
        } else if (S.phase === 'rest') {
          BL.label(ctx, 'drag an outer electron across', W / 2, H - f * 1.5, { font: BL.font(700, 14), border: pal.line2 });
        }

        drawScale();
        drawMap();
      }

      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); scaleCv.destroy(); mapCv.destroy(); } };
    },
  });
})();
