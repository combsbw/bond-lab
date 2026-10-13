/* Hurry Up: the hill, and what a living thing does about it.

   The Template ends on a problem. Both ends of that reaction are stable and
   there is a hill in between, and nothing gets over a hill for free. Left
   alone, the reactions life depends on happen so rarely you would never see
   one. An enzyme does not change where the two ends sit. It lowers the hill,
   and it is not used up doing it, so one of them can do it again and again.

   This is also Chapter 3's bench lab — Fruity Enzymes — with the bowl on
   the screen instead of the worktop. Fresh pineapple carries bromelain, which
   cuts protein. Gelatin is protein, and it sets by its long chains tangling
   into a mesh. Cut the chains and there is nothing left to tangle, so the
   jelly never sets. Heat the juice first and the enzyme unfolds, and an
   unfolded enzyme does not refold when you cool it down — which is the one
   result from that lab worth carrying for the rest of the course.

   The model: a working enzyme speeds up with heat, and above about 45 °C it
   starts coming apart, faster the hotter it gets, and never comes back. Rate
   also saturates in the substrate, which is Chapter 4's catalase lab in
   advance. Numbers ride behind Display > Show the numbers; everything the
   instrument actually says, it says in words. */
(function () {
  'use strict';
  const { h, clamp } = BL;
  const O = BL.org;
  const TAU = Math.PI * 2;

  const T_ROOM = 294, T_ICE = 277, T_WARM = 320, T_HOT = 358;
  const T_FRAY = 318;              // where an enzyme starts coming apart
  const SET_LEN = 7;               // a chain this long or longer can still join the mesh
  const NCH = 9, LEN0 = 14;

  /* A working enzyme speeds up with heat — about three to four times over the
     seventeen degrees between an ice bath and a warm room, which is what makes
     the chilled tube on the bench behave differently from the one beside it.
     Above T_FRAY it starts coming apart, faster the hotter it gets, and it
     never comes back. Rate also saturates: the enzymes can only be in so many
     places at once. tools/check-enzyme.js keeps these honest. */
  const act = (T) => Math.exp((T - 278) / 13);
  const fray = (T) => (T > T_FRAY ? 0.02 * Math.exp((T - T_FRAY) / 6) : 0);
  const sat = (c) => c / (c + 0.35);
  const BENCH = 5;              // how long the juice gets to work before the tubes go in the fridge
  const SPEED = 12;             // the bowl runs in fast-forward, so nobody waits twenty minutes to find out

  /* Water's own word scale calls anything under 100 °C "boiling", which is no
     use for a bowl of jelly. These are the words this instrument needs. */
  const tword = (T) => (T < 283 ? 'ice-cold' : T < 292 ? 'cool' : T < 300 ? 'room warm' : T < 312 ? 'warm' : T < 325 ? 'hot' : T < 340 ? 'very hot' : 'near boiling');
  const tlabel = (T) => tword(T) + (BL.nums ? ' · ' + Math.round(T - 273) + ' °C' : '');

  const STEPS = [
    { id: 'fresh', text: 'Stir fresh pineapple juice into the gelatin at room temperature.',
      how: 'Leave the temperature at room, enzyme up, gelatin up. Watch the chains.',
      ask: 'will this gelatin set?',
      opts: ['Yes, it will set', 'No, it will stay runny'], right: 1 },
    { id: 'none', text: 'Take the juice out and try the same thing.',
      how: 'Drag “how much pineapple juice” to none and press “Fresh bowl”.',
      ask: 'with no enzyme in it, will the gelatin set?',
      opts: ['Yes', 'No'], right: 0 },
    { id: 'peak', text: 'Walk the temperature up slowly and watch the rate.',
      how: 'Nudge the temperature a few degrees at a time, waiting at each stop. Watch the graph fill in.',
      ask: 'as it gets hotter, does the enzyme just keep getting faster?',
      opts: ['Yes — hotter is always faster', 'No — it peaks, then falls off a cliff'], right: 1 },
    { id: 'dead', text: 'Boil the juice, then cool it right back to room temperature.',
      how: 'Press “Boil it”, wait until the rate collapses, then press “Cool it back down”.',
      ask: 'back at room temperature, does the enzyme work again?',
      opts: ['Yes, it picks up where it left off', 'No — it does not come back'], right: 1 },
    { id: 'spare', text: 'Let the reaction run right through and count the enzymes.',
      how: 'Full enzyme, room temperature, and wait until every chain has been cut up.',
      ask: 'after one enzyme has cut a hundred chains, how many enzymes are left?',
      opts: ['All of them — it is not used up', 'Half of them', 'None — they are consumed'], right: 0 },
    { id: 'sat', text: 'Turn the gelatin up and up with the juice held steady.',
      how: 'Leave the juice where it is and drag the gelatin from a little to a lot, watching the rate.',
      ask: 'twice as much gelatin — twice the rate?',
      opts: ['Yes, always', 'Only up to a point, then it stops helping'], right: 1 },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<path d="M16 92 C56 92 56 26 100 26 C144 26 144 92 184 92" fill="none" stroke="var(--line-2)" stroke-width="5" stroke-dasharray="7 6"/>' +
    '<path d="M16 92 C56 92 56 62 100 62 C144 62 144 92 184 92" fill="none" stroke="var(--ui)" stroke-width="6"/>' +
    '<circle cx="100" cy="62" r="12" fill="var(--electron)"/></svg>';

  BL.register({
    id: 'enzyme', field: 'build', order: 2, name: 'Hurry Up',
    tagline: 'An enzyme does not push. It lowers the hill — and then does it again.',
    lede: 'A bowl of gelatin with fresh pineapple juice stirred into it. Gelatin is protein: long chains that set by tangling. The enzyme in the juice cuts those chains. Change the temperature, the juice and the gelatin, and find out what the enzyme will and will not survive.',
    art, goals: STEPS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        T: T_ROOM, enz: 1, sub: 1, alive: 1, chains: [], cuts: 0, t: 0, hint: true,
        series: new Map(), sampleT: 0, steady: 0, boiled: false, everCooled: false, lastHigh: 0,
      };

      const stage = BL.stage(stageHost, '8 / 5', {
        label: 'A bowl of long protein chains with enzyme molecules among them. The enzymes cut the chains. Heating past about 45 degrees makes the enzymes unfold, and an unfolded one does not work again.',
        focusable: true,
      });
      const ctx = stage.ctx;

      /* Each chain keeps its own spot in the bowl, as a fraction of the way
         across and down, so a cut makes two pieces that drift apart from where
         the one chain was rather than the whole bowl rearranging itself. */
      const spot = (near) => ({
        u: clamp((near ? near.u : 0.5) + (near ? (Math.random() - 0.5) * 0.16 : (Math.random() - 0.5) * 0.9), 0.06, 0.94),
        v: clamp((near ? near.v : 0.5) + (near ? (Math.random() - 0.5) * 0.3 : (Math.random() - 0.5) * 0.9), 0.1, 0.9),
        a: (near ? near.a : 0) + (Math.random() - 0.5) * (near ? 0.8 : 1.1),
        ph: Math.random() * TAU,
      });
      function fresh() {
        S.chains = [];
        for (let i = 0; i < NCH; i++) {
          const p = spot(null);
          p.u = 0.1 + (i % 3) * 0.4 + (Math.random() - 0.5) * 0.12;
          p.v = 0.18 + ((i / 3) | 0) * 0.32 + (Math.random() - 0.5) * 0.1;
          S.chains.push(Object.assign({ n: LEN0 }, p));
        }
        S.alive = 1; S.cuts = 0; S.boiled = false; S.everCooled = false;
        S.series.clear();
        say();
      }

      /* How much of the gelatin is still in chains long enough to tangle. */
      const meshFrac = () => {
        let tot = 0, long = 0;
        S.chains.forEach((c) => { tot += c.n; if (c.n >= SET_LEN) long += c.n; });
        return tot ? long / tot : 0;
      };
      const willSet = () => meshFrac() > 0.55 && S.sub > 0.25;
      const rate = () => (S.enz * S.alive * act(S.T) * sat(S.sub) * 0.012) + 0.0004 * act(S.T) * sat(S.sub);
      const shown = () => rate() * SPEED;     // what the bowl is doing on screen
      /* What this bowl will look like once it has had its time and been
         chilled: the headline is about where it ends up, not about this second. */
      const ending = () => (S.enz === 0 ? 1 : Math.exp(-rate() * BENCH * 8));

      /* ---------------- dock ---------------- */
      const mk = (label, min, max, step, val, fmt, cb, ends) => {
        const out = h('output', { class: 'val' });
        const input = h('input', { type: 'range', min, max, step, value: val, 'aria-label': label });
        input.addEventListener('input', () => { const v = parseFloat(input.value); cb(v); out.textContent = fmt(v); S.hint = false; say(); });
        out.textContent = fmt(val);
        return { out, input, el: h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('h2', {}, label), out), h('div', { class: 'range-wrap' }, input, h('div', { class: 'range-ends' }, h('span', {}, ends[0]), h('span', {}, ends[1])))) };
      };

      const tempC = mk('Temperature', String(T_ICE), String(T_HOT), '1', S.T, tlabel,
        (v) => { S.T = v; S.steady = 0; }, ['ice bath', 'near boiling']);
      const enzC = mk('How much pineapple juice', '0', '100', '1', 100, (v) => (v === 0 ? 'none' : v < 35 ? 'a splash' : v < 75 ? 'some' : 'plenty'),
        (v) => { S.enz = v / 100; S.steady = 0; }, ['none', 'plenty']);
      const subC = mk('How much gelatin', '10', '100', '1', 100, (v) => (v < 30 ? 'a little' : v < 70 ? 'some' : 'a lot'),
        (v) => { S.sub = v / 100; S.steady = 0; }, ['a little', 'a lot']);

      const setT = (v) => { S.T = v; tempC.input.value = String(v); tempC.out.textContent = tlabel(v); S.steady = 0; S.hint = false; say(); };
      dock.appendChild(h('section', {},
        h('h2', {}, 'The bowl'),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Temperature presets' },
          h('button', { type: 'button', class: 'chip', onclick: () => setT(T_ICE) }, 'Ice bath'),
          h('button', { type: 'button', class: 'chip', onclick: () => setT(T_ROOM) }, 'Room'),
          h('button', { type: 'button', class: 'chip', onclick: () => setT(T_WARM) }, 'Warm'),
          h('button', { type: 'button', class: 'chip', onclick: () => { S.boiled = true; setT(T_HOT); } }, 'Boil it')),
        tempC.el, enzC.el, subC.el,
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'action', onclick: () => { S.everCooled = true; setT(T_ROOM); } }, 'Cool it back down'),
          h('button', { type: 'button', class: 'action ghost', onclick: () => { fresh(); } }, 'Fresh bowl, fresh juice'))));

      const stepHost = h('section', {}, h('h2', {}, 'Try'));
      const steps = BL.protocol(stepHost, 'enzyme', STEPS);
      dock.appendChild(stepHost);

      /* ---------------- aux ---------------- */
      const readout = h('div', { class: 'readout' });
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' });
      const meters = h('div', { class: 'meters' });
      const rateM = BL.meter('How fast the chains are being cut');
      const aliveM = BL.meter('Enzymes still folded up and working');
      meters.append(rateM.el, aliveM.el);
      aux.appendChild(h('section', { class: 'panel' }, readout, statusP, meters));

      const hill = BL.stage(h('div'), '3 / 1', { label: 'The energy hill between the two ends of the reaction, drawn with and without the enzyme.' });
      hill.wrap.classList.add('flat');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'What the enzyme actually does'), hill.wrap,
        h('p', { class: 'hint' }, 'Both ends stay exactly where they were. The enzyme does not make the reaction go somewhere new and it does not push — it holds the two pieces in the right place so that getting over costs less. And it is still there afterwards, which is the whole trick.')));

      const chart = BL.stage(h('div'), '2.6 / 1', { label: 'Graph of cutting rate against temperature. Points are added as you wait at each temperature.' });
      chart.wrap.classList.add('flat', 'hist');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'Rate against temperature'), chart.wrap,
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'action ghost', onclick: () => S.series.clear() }, 'Clear the graph')),
        h('p', { class: 'hint' }, 'Hold a temperature and wait, and a point lands. Go up slowly from the ice bath. The shape you get is the shape every enzyme in you has: faster and faster, then a cliff.')));

      const bench = BL.stage(h('div'), '2.4 / 1', { label: 'Three test tubes of gelatin with pineapple juice: one with juice kept cold, one at room temperature, one with juice that was boiled first.' });
      bench.wrap.classList.add('flat');
      aux.appendChild(h('section', { class: 'panel' }, h('h2', {}, 'The bench, as you would actually set it up'), bench.wrap,
        h('p', { class: 'hint' }, 'Three tubes, same gelatin, same juice. The only difference is what the juice was allowed to do before all three went in the fridge, and this is twenty minutes later. The third tube is the one that settles whether heat slows an enzyme down or finishes it off — and the bowl above runs in fast-forward so you do not have to wait twenty minutes to find out.')));

      function say() {
        const r = rate(), mf = meshFrac(), end = ending();
        readout.textContent = '';
        readout.append(
          h('span', { class: 'name' }, end > 0.55 ? 'This one will set' : 'This one will not set'),
          h('span', { class: 'zone' }, tword(S.T)),
          h('span', { class: 'dim' }, S.cuts + (S.cuts === 1 ? ' cut so far' : ' cuts so far')));
        const dead = S.alive < 0.08;
        statusP.textContent = S.enz === 0
          ? 'No juice in it, so nothing is cutting anything. The chains stay long, they tangle, and the gelatin sets — which is what gelatin does when you leave it alone.'
          : dead
            ? 'The enzymes have come apart. They are still in the bowl, every atom of them, but the shape has gone and the shape was the whole point. Cooling it down will not put them back.'
            : S.T > T_FRAY
              ? 'Working fast and falling apart at the same time. Watch which one wins.'
              : 'The enzymes are cutting. Each one finds a chain, cuts it, lets go, and goes looking for another.';
        const sr = shown();
        rateM.set(clamp(sr / 3, 0, 1), sr < 0.03 ? 'barely at all' : sr < 0.25 ? 'slowly' : sr < 0.9 ? 'steadily' : 'fast',
          BL.nums ? sr.toFixed(2) + ' cuts a second per chain' : '');
        rateM.tone(sr < 0.08 ? BL.pal.muted : BL.pal.ui);
        aliveM.set(S.alive, S.alive > 0.9 ? 'all of them' : S.alive > 0.5 ? 'most of them' : S.alive > 0.08 ? 'a few left' : 'none',
          BL.nums ? Math.round(S.alive * 100) + '%' : '');
        aliveM.tone(S.alive > 0.5 ? BL.pal.tDipole : BL.pal.pos);
        check(mf);
      }

      function check(mf) {
        if (S.enz > 0.6 && S.sub > 0.6 && S.T < T_FRAY && mf < 0.4) steps.done('fresh');
        if (S.enz === 0 && S.sub > 0.6 && mf > 0.9) steps.done('none');
        if (S.series.size >= 5 && [...S.series.keys()].some((k) => k >= 325)) steps.done('peak');
        if (S.boiled && S.everCooled && S.alive < 0.1) steps.done('dead');
        if (S.cuts >= NCH * (LEN0 - 1) - 2 && S.alive > 0.9) steps.done('spare');
        if (S.satSeen) steps.done('sat');
      }

      /* ---------------- the bowl ---------------- */
      function tick(dt) {
        S.t += dt;
        const f = fray(S.T) * dt;
        if (f > 0) S.alive = Math.max(0, S.alive * Math.exp(-f));
        // cuts
        const cuttable = S.chains.filter((c) => c.n > 1);
        if (cuttable.length) {
          const want = rate() * SPEED * dt * cuttable.length;
          S.pending = (S.pending || 0) + want;
          while (S.pending >= 1 && S.chains.length < 60) {
            S.pending -= 1;
            const pool = S.chains.filter((c) => c.n > 1);
            if (!pool.length) break;
            const c = pool[(Math.random() * pool.length) | 0];
            const k = 1 + ((Math.random() * (c.n - 1)) | 0);
            S.chains.push(Object.assign({ n: c.n - k }, spot(c)));
            c.n = k;
            S.cuts++;
          }
        }
        // the graph: a point per settled temperature
        S.steady += dt; S.sampleT += dt;
        if (S.steady > 1.4 && S.sampleT > 0.4 && S.enz > 0.5) {
          S.sampleT = 0;
          const key = Math.round(S.T / 3) * 3;
          const prev = S.series.get(key);
          const r = shown();
          S.series.set(key, prev == null ? r : Math.max(prev, r));
        }
        // saturation: did they watch the rate stop climbing with more gelatin?
        if (S.sub > 0.85) S.satHigh = true;
        if (S.satHigh && S.sub < 0.35) S.satSeen = true;
      }

      let lastSay = 0;
      function frame(dt) {
        const pal = BL.pal, cw = stage.w, ch = stage.h;
        tick(dt);
        if (performance.now() - lastSay > 220) { lastSay = performance.now(); say(); }
        ctx.clearRect(0, 0, cw, ch);
        if (!cw) return;

        // the bowl
        const bx = 16, by = 40, bw = cw - 32, bh = ch - 58;
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 18); else ctx.rect(bx, by, bw, bh);
        ctx.fillStyle = BL.alpha(willSet() ? pal.tDipole : pal.electron, pal.dark ? 0.16 : 0.11);
        ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = pal.line2; ctx.stroke();
        ctx.clip();

        // the gelatin chains, each wiggling where it lies. Long ones are the
        // only ones that can still join the mesh, so they are the coloured ones.
        const shake = clamp((S.T - 270) / 90, 0.05, 1);
        const bead = clamp(Math.min(bw, bh) * 0.016, 2.4, 7);
        S.chains.forEach((c) => {
          const ox = bx + 10 + c.u * (bw - 20), oy = by + 10 + c.v * (bh - 20);
          const ca = Math.cos(c.a), sa2 = Math.sin(c.a);
          const amp = bead * (0.6 + shake * 1.1);
          ctx.beginPath();
          for (let k = 0; k < c.n; k++) {
            const t = BL.reduced ? 0 : S.t * (1 + shake * 2.4) + c.ph;
            const d = (k - (c.n - 1) / 2) * bead * 1.9;
            const w = Math.sin(t + k * 0.95) * amp * 0.55;
            const px = ox + ca * d - sa2 * w, py = oy + sa2 * d + ca * w;
            k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.lineWidth = bead * 1.4;
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.strokeStyle = BL.alpha(c.n >= SET_LEN ? pal.eN : pal.muted, c.n >= SET_LEN ? 0.92 : 0.55);
          ctx.stroke();
        });

        // the enzymes: a folded blob with a notch, or a dead tangle
        const nE = Math.round(S.enz * 7);
        for (let i = 0; i < nE; i++) {
          const working = i < Math.round(nE * S.alive);
          const a = (i / Math.max(1, nE)) * TAU + S.t * (BL.reduced ? 0 : 0.25 * shake);
          const ex = bx + bw * (0.18 + 0.64 * (0.5 + 0.45 * Math.cos(a * 1.7 + i)));
          const ey = by + bh * (0.18 + 0.64 * (0.5 + 0.45 * Math.sin(a * 2.3 + i)));
          const er = clamp(Math.min(bw, bh) * 0.055, 9, 22);
          if (working) {
            // the wedge out of it is the active site: the shape a chain has to
            // fit into. Lose the shape and you have lost the enzyme.
            const face = a * 1.3 + i;
            ctx.beginPath();
            ctx.arc(ex, ey, er, face + 0.85, face - 0.85 + TAU);
            ctx.lineTo(ex, ey);
            ctx.closePath();
            ctx.fillStyle = BL.alpha(pal.ui, 0.92); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = pal.ui; ctx.lineJoin = 'round'; ctx.stroke();
          } else {
            ctx.beginPath();
            for (let k = 0; k <= 26; k++) {
              const th = (k / 26) * TAU * 2.4;
              const rr = er * (0.35 + 0.65 * Math.abs(Math.sin(th * 1.7 + i)));
              const px = ex + Math.cos(th) * rr, py = ey + Math.sin(th) * rr * 0.8;
              k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            }
            ctx.lineWidth = 2.6; ctx.strokeStyle = BL.alpha(pal.pos, 0.85); ctx.stroke();
          }
        }
        ctx.restore();

        const mf = meshFrac();
        BL.label(ctx, mf > 0.55 ? 'enough long chains left to tangle — this would set' : 'cut too short to tangle — this will not set',
          cw / 2, ch - 16, { font: BL.font(800, 15), border: mf > 0.55 ? pal.tDipole : pal.electron });
        BL.label(ctx, tlabel(S.T), bx + 72, 22, { font: BL.font(700, 14), border: S.T > T_FRAY ? pal.pos : pal.line2 });
        if (S.alive < 0.9 && S.enz > 0) {
          BL.label(ctx, S.alive < 0.08 ? 'the enzymes have come apart' : 'the enzymes are coming apart',
            cw - 150, 22, { font: BL.font(700, 14), border: pal.pos });
        }
        if (S.hint && !BL.reduced) BL.label(ctx, 'change the temperature and watch →', cw / 2, 22, { font: BL.font(700, 14), border: pal.ui });

        drawHill();
        drawChart();
        drawBench();
      }

      /* The same reaction coordinate The Template drew, with the hill lowered
         by however much enzyme is actually still working. */
      function drawHill() {
        const c = hill.ctx, cw = hill.w, ch = hill.h, pal = BL.pal;
        if (!cw) return;
        c.clearRect(0, 0, cw, ch);
        const m = { l: 18, r: 18, t: 16, b: 28 };
        const X = (u) => m.l + u * (cw - m.l - m.r);
        const Y = (v) => ch - m.b - v * (ch - m.b - m.t);
        const prof = (u, peak) => 0.2 + peak * Math.exp(-((u - 0.5) ** 2) / 0.022) - 0.14 * u;
        const help = S.enz * S.alive;
        const line = (peak, col, dash, w) => {
          c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash);
          c.beginPath();
          for (let i = 0; i <= 80; i++) { const u = i / 80, x = X(u), y = Y(prof(u, peak)); i ? c.lineTo(x, y) : c.moveTo(x, y); }
          c.stroke(); c.setLineDash([]);
        };
        line(0.68, BL.alpha(pal.fg, 0.4), [7, 6], 2.5);
        line(0.68 - 0.46 * help, pal.ui, [], 3.5);
        c.font = BL.font(600, 13); c.fillStyle = pal.muted;
        c.textAlign = 'left'; c.fillText('start', m.l, ch - 8);
        c.textAlign = 'right'; c.fillText('finished', cw - m.r, ch - 8);
        c.textAlign = 'center';
        BL.label(c, 'on its own', X(0.5), Y(0.88) + 2, { font: BL.font(600, 13), bg: false, color: BL.alpha(pal.fg, 0.6) });
        if (help > 0.05) BL.label(c, 'with the enzyme', X(0.5), Y(0.2 + (0.68 - 0.46 * help)) - 14, { font: BL.font(700, 13), border: pal.ui });
      }

      function drawChart() {
        const c = chart.ctx, cw = chart.w, ch = chart.h, pal = BL.pal;
        if (!cw) return;
        c.clearRect(0, 0, cw, ch);
        const f = BL.fs(13), m = { l: 34, r: 12, t: 12, b: f * 2.5 };
        const X = (T) => m.l + ((T - T_ICE) / (T_HOT - T_ICE)) * (cw - m.l - m.r);
        const hiR = 3;
        const Y = (r) => ch - m.b - clamp(r / hiR, 0, 1) * (ch - m.b - m.t);
        c.strokeStyle = pal.line; c.lineWidth = 1;
        [0, 1.5, 3].forEach((r) => { c.beginPath(); c.moveTo(m.l, Y(r)); c.lineTo(cw - m.r, Y(r)); c.stroke(); });
        c.font = BL.font(400, 13); c.fillStyle = pal.muted; c.textAlign = 'center';
        [T_ICE, T_ROOM, T_WARM, T_HOT].forEach((T) => c.fillText(tword(T), X(T), ch - m.b + f * 1.3));
        c.textAlign = 'right'; c.fillText('faster →', cw - m.r, ch - 3);
        // the frayed region
        c.fillStyle = BL.alpha(pal.pos, 0.09);
        c.fillRect(X(T_FRAY), m.t, cw - m.r - X(T_FRAY), ch - m.b - m.t);
        BL.label(c, 'they come apart in here', (X(T_FRAY) + cw - m.r) / 2, m.t + 12, { font: BL.font(600, 13), bg: false, color: pal.pos });
        const pts = [...S.series.entries()].sort((a, b) => a[0] - b[0]);
        if (pts.length) {
          c.strokeStyle = pal.ui; c.lineWidth = 3;
          c.beginPath(); pts.forEach(([T, r], i) => (i ? c.lineTo(X(T), Y(r)) : c.moveTo(X(T), Y(r)))); c.stroke();
          pts.forEach(([T, r]) => { c.fillStyle = pal.ui; c.beginPath(); c.arc(X(T), Y(r), 4.2, 0, TAU); c.fill(); });
        } else {
          BL.label(c, 'hold a temperature and wait for a point', cw / 2, ch / 2, { font: BL.font(600, 13), border: pal.line2 });
        }
        c.strokeStyle = pal.fg; c.lineWidth = 2.5;
        c.beginPath(); c.arc(X(S.T), Y(shown()), 8, 0, TAU); c.stroke();
      }

      /* Three tubes, worked out from the same model: juice kept cold, juice at
         room temperature, juice that was boiled and then cooled. */
      function drawBench() {
        const c = bench.ctx, cw = bench.w, ch = bench.h, pal = BL.pal;
        if (!cw) return;
        c.clearRect(0, 0, cw, ch);
        /* All three go in the fridge afterwards. The only difference is what
           the juice was allowed to do first. */
        const TUBES = [
          { name: 'juice kept on ice', T: T_ICE, alive: 1, why: 'cold, so the enzyme is slow' },
          { name: 'juice at room temperature', T: T_ROOM, alive: 1, why: 'the enzyme working normally' },
          { name: 'juice boiled first, then cooled', T: T_ROOM, alive: 0, why: 'the enzyme unfolded and gone' },
        ];
        const w = (cw - 24) / 3;
        TUBES.forEach((t, i) => {
          const cx = 12 + w * (i + 0.5);
          const r = S.enz * t.alive * act(t.T) * sat(S.sub) * 0.012;
          const left = S.enz === 0 ? 1 : Math.exp(-r * BENCH * 8);
          const sets = left > 0.55;
          const tw = Math.min(w * 0.4, 44), th = ch * 0.5;
          const tx = cx - tw / 2, ty = ch * 0.08;
          c.save();
          c.beginPath();
          if (c.roundRect) c.roundRect(tx, ty, tw, th, [6, 6, tw / 2, tw / 2]); else c.rect(tx, ty, tw, th);
          c.fillStyle = BL.alpha(sets ? pal.tDipole : pal.electron, sets ? 0.42 : 0.2);
          c.fill();
          c.lineWidth = 2.4; c.strokeStyle = pal.line2; c.stroke();
          c.restore();
          if (!sets) {
            c.strokeStyle = BL.alpha(pal.electron, 0.95); c.lineWidth = 2.5;
            c.beginPath(); c.moveTo(tx + 3, ty + th * 0.3); c.lineTo(tx + tw - 3, ty + th * 0.3); c.stroke();
          }
          c.font = BL.font(800, 13); c.fillStyle = sets ? pal.tDipole : pal.electron;
          c.textAlign = 'center';
          c.fillText(sets ? 'set' : 'still runny', cx, ty + th + BL.fs(13) * 1.4);
          c.fillStyle = pal.muted; c.font = BL.font(400, 12);
          wrap(c, t.name + ' — ' + t.why, cx, ty + th + BL.fs(13) * 2.7, w - 8);
        });
      }

      function wrap(c, text, x, y, maxw) {
        const words = text.split(' ');
        let line = '', yy = y;
        words.forEach((wd) => {
          const t2 = line ? line + ' ' + wd : wd;
          if (c.measureText(t2).width > maxw && line) { c.fillText(line, x, yy); yy += BL.fs(12) * 1.2; line = wd; } else line = t2;
        });
        if (line) c.fillText(line, x, yy);
      }

      fresh();
      const loop = BL.loop(frame); loop.start();
      return { destroy() { loop.stop(); stage.destroy(); hill.destroy(); chart.destroy(); bench.destroy(); } };
    },
  });
})();
