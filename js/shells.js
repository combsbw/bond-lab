/* Shells: how hard is it to take an electron away?
   Pick an atom, then pull on its outermost electron: drag it outward, or set a
   pull and press the button. The atom holds on until you pull hard enough, and
   then it lets go. What it cost is the first ionization energy. Measure the
   atoms one by one and the graph builds itself into a saw-tooth: the same shape
   repeats every time a new outer shell begins.

   You can also push an electron in, and take a second one off, to find out
   which atoms are happy to change and which are not.

   Numbers: first and second ionization energies and electron affinities for
   H to Ca (see atoms.js). The "pull felt" is Slater's effective charge. */
(function () {
  'use strict';
  const { h, clamp, lerp } = BL;
  const A = BL.atoms;

  const PMAX = 80;                          // the most you can pull with, in eV
  const GOALS = [
    { id: 'pull', text: 'Pull an electron off an atom.' },
    { id: 'easy', text: 'Find an atom that hands over an outer electron almost without a fight.' },
    { id: 'tight', text: 'Find an atom that will not let go however hard you pull.' },
    { id: 'pattern', text: 'Measure eight different atoms yourself. Does anything repeat?' },
    { id: 'cliff', text: 'Take two electrons off lithium, sodium or potassium. What happens to the cost?' },
    { id: 'welcome', text: 'Push an extra electron into an atom that welcomes it.' },
    { id: 'refuse', text: 'Find an atom that refuses an extra electron.' },
    { id: 'same', text: 'Make three different ions that each end up with the same number of electrons as a noble gas.' },
  ];

  const art =
    '<svg viewBox="0 0 200 120" aria-hidden="true">' +
    '<g fill="none" stroke="currentColor" stroke-width="3" opacity=".8"><circle cx="100" cy="60" r="16"/><circle cx="100" cy="60" r="32"/><circle cx="100" cy="60" r="50" stroke-dasharray="6 6"/></g>' +
    '<circle cx="100" cy="60" r="6" fill="var(--pos)"/>' +
    [[100, 28], [100, 92], [118, 60], [82, 60]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="5" fill="currentColor"/>').join('') +
    '<circle cx="150" cy="38" r="6.5" fill="var(--electron)"/><path d="M118 52 L142 42" stroke="var(--electron)" stroke-width="3" stroke-dasharray="4 4"/></svg>';

  const ink = (hex) => { const [r, g, b] = BL.rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#10202a' : '#ffffff'; };
  const fmt = (v) => (v >= 10 ? v.toFixed(1) : v.toFixed(2));
  const ord = ['', 'first', 'second'];

  BL.register({
    id: 'shells', field: 'atoms', order: 3, name: 'Shells',
    tagline: 'Pull on an atom’s outer electron and feel how it holds on.',
    lede: 'Take hold of an atom\'s outermost electron and pull. How hard it holds on is the single number that decides almost everything about how that atom behaves.',
    art, goals: GOALS,

    mount({ stage: stageHost, aux, dock }) {
      const S = {
        Z: 11, N: 11, pull: 0, dragging: false, ramp: null,
        m1: new Map(), m2: new Map(), manual: new Set(), view: 1,
        esc: null, shake: null, flash: null, status: '', theta: 0,
        nobleIons: new Set(), hinted: false,
      };
      const el = () => A.EL[S.Z - 1];

      const stage = BL.stage(stageHost, '4 / 3', {
        label: 'An atom drawn as a nucleus with rings of electrons. Drag the outermost electron away to try to pull it off. With the stage focused, the Pull button and slider in the side panel do the same job.',
        focusable: true,
      });
      stage.wrap.classList.add('shells-stage');
      const ctx = stage.ctx;

      /* ---------------- what each action costs ---------------- */
      function cost() {
        const e = el();
        if (S.N === S.Z) return e.ie;
        if (S.N === S.Z - 1) return e.ie2;
        if (S.N === S.Z + 1) return e.ea > 0 ? e.ea : null;
        return null;
      }
      const which = () => (S.N === S.Z ? 1 : S.N === S.Z - 1 ? 2 : 0);

      /* ---------------- dock: choosing atoms ---------------- */
      const chips = A.EL.map((e) => h('button', { type: 'button', class: 'chip el', 'aria-pressed': 'false', 'aria-label': e.name + ', ' + e.Z + ' electrons', onclick: () => choose(e.Z) }, e.sym));
      dock.appendChild(h('section', {}, h('h2', {}, 'Which atom'), h('div', { class: 'chips', role: 'group', 'aria-label': 'Atoms, hydrogen to calcium' }, chips),
        h('p', { class: 'hint' }, 'They are in order of how many protons the nucleus has.')));

      const pullOut = h('output', { class: 'val' });
      const slider = h('input', { type: 'range', min: '0', max: String(PMAX), step: '0.1', value: '0', 'aria-label': 'Pull strength in electron-volts' });
      slider.addEventListener('input', () => { S.pull = parseFloat(slider.value); S.hinted = true; syncPull(); });
      const pullBtn = h('button', { type: 'button', class: 'action', onclick: () => { S.hinted = true; attempt(parseFloat(slider.value)); } }, 'Pull!');
      const measBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => measure() }, 'Measure it for me');
      const pushBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => push() }, 'Push an electron in');
      const resetBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => { S.N = S.Z; S.esc = null; say('Back to a plain atom.'); sync(); } }, 'Make it plain again');
      dock.appendChild(h('section', {},
        h('div', { class: 'row' }, h('h2', {}, 'Pull'), pullOut),
        h('div', { class: 'range-wrap' }, slider, h('div', { class: 'range-ends' }, h('span', {}, 'gentle'), h('span', {}, 'hard'))),
        h('div', { class: 'actions' }, pullBtn, measBtn),
        h('p', { class: 'hint' }, 'Or drag the outer electron straight off the atom. Only a hard enough pull will do it.'),
        h('h2', { class: 'sub-h' }, 'The other way'),
        h('div', { class: 'actions' }, pushBtn, resetBtn)));

      const goalsHost = h('section', {}, h('h2', {}, 'Try'));
      const goals = BL.goals(goalsHost, 'shells', GOALS);
      dock.appendChild(goalsHost);

      /* ---------------- aux: status, facts, graph ---------------- */
      const statusP = h('p', { class: 'status', 'aria-live': 'polite' }, 'Pick an atom and pull on its outer electron.');
      const facts = h('dl', { class: 'facts' });
      aux.appendChild(h('section', { class: 'panel' }, statusP, facts));

      const chart = BL.stage(h('div'), '3.4 / 1', { label: 'Graph of the energy needed to pull off an electron, for each atom you have measured.', focusable: false });
      chart.wrap.classList.add('flat', 'hist');
      const vBtns = [1, 2].map((v) => h('button', { type: 'button', 'aria-pressed': String(v === 1), onclick: () => { S.view = v; sync(); } }, v === 1 ? 'First electron off' : 'Second electron off'));
      const fillBtn = h('button', { type: 'button', class: 'action ghost', onclick: () => fillAll() }, 'Measure the rest for me');
      aux.appendChild(h('section', { class: 'panel' },
        h('div', { class: 'row' }, h('h2', {}, 'What it cost to pull'), h('div', { class: 'seg', role: 'group', 'aria-label': 'Which electron to graph' }, vBtns)),
        chart.wrap,
        h('div', { class: 'actions' }, fillBtn),
        h('p', { class: 'hint' }, 'Tap a bar position on the graph to jump to that atom. Each dot is something you measured.')));

      function say(t) { S.status = t; statusP.textContent = t; }
      /* The measured value, in brackets, only when the numbers are switched on.
         Every sentence below has to read correctly with it missing. */
      const ev = (v) => (BL.nums ? ' (' + fmt(v) + ' eV)' : '');

      /* ---------------- actions ---------------- */
      function choose(Z) {
        S.Z = Z; S.N = Z; S.esc = null; S.shake = null; S.ramp = null; S.pull = 0; slider.value = '0'; S.hinted = true;
        say(el().name + ': ' + Z + ' protons and ' + Z + ' electrons. Pull on the outer one.');
        sync(); syncPull();
      }
      function record() {
        if (S.N !== S.Z && A.isFull(S.N)) S.nobleIons.add(S.Z);
        if (S.nobleIons.size >= 3) goals.done('same');
      }
      function attempt(P) {
        const c = cost(), e = el();
        S.ramp = null;
        if (c == null || which() === 0 && S.N < S.Z) { say('This app stops at two electrons off. Make it plain again to start over.'); return; }
        if (S.N === S.Z + 1 && e.ea <= 0) return;
        if (P >= c - 1e-9) {
          const w = which();
          if (w === 1) { S.m1.set(S.Z, c); S.manual.add(S.Z); } else if (w === 2) S.m2.set(S.Z, c);
          S.esc = { t: 0, ke: P - c, cost: c };
          S.N -= 1; S.shake = null;
          const word = w === 0 ? 'the extra' : ord[w];
          say('It let go. Taking the ' + word + ' electron off ' + el().name.toLowerCase() + ' cost ' + BL.words.cost(c) + ev(c) + '.' + (P - c > 0.5 ? ' You were pulling harder than that, and the rest sent it flying' + ev(P - c) + '.' : ''));
          goals.done('pull');
          if (w === 1 && c < 6) goals.done('easy');
          if (w === 1 && c > 20) goals.done('tight');
          if (S.manual.size >= 8) goals.done('pattern');
          if (w === 1 && S.N === S.Z - 1) { /* first one is off */ }
          if (S.N === S.Z - 2 && ['Li', 'Na', 'K'].includes(e.sym)) goals.done('cliff');
          record(); sync();
        } else {
          S.shake = { t: 0, a: clamp(P / c, 0.05, 1) };
          say('Held on. You were not pulling hard enough' + ev(P) + '. It shook and settled back.');
        }
      }
      function measure() {
        if (cost() == null) { say('There is nothing more to pull here. Make it plain again first.'); return; }
        S.ramp = { P: 0 }; S.hinted = true;
      }
      function fillAll() {
        A.EL.forEach((e) => { S.m1.set(e.Z, e.ie); S.m2.set(e.Z, e.ie2 || null); });
        say('All twenty first-electron costs are on the graph.'); sync();
      }
      function push() {
        const e = el(); S.hinted = true;
        if (S.N < S.Z) {
          const back = S.N === S.Z - 1 ? e.ie : e.ie2;
          S.N += 1; S.esc = null;
          say('It went back in and gave out exactly as much as it cost to take off' + ev(S.N === S.Z ? e.ie : e.ie2) + '.');
          void back; record(); sync(); return;
        }
        if (S.N === S.Z && e.ea > 0) {
          S.N += 1; S.flash = { t: 0, e: e.ea };
          say('Welcome. ' + e.name + ' took the extra electron, and gave out energy for doing it' + ev(e.ea) + ' — that is what “wanting one” looks like.');
          goals.done('welcome'); record(); sync(); return;
        }
        S.shake = { t: 0, a: 1, bounce: true };
        say(S.N === S.Z ? 'It bounced off. ' + e.name + ' does not want an extra electron.' : 'It bounced off. A second extra electron is not welcome here.');
        if (S.N === S.Z && e.ea <= 0) goals.done('refuse');
      }

      /* ---------------- reading the atom ---------------- */
      function sync() {
        chips.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === S.Z)));
        vBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === S.view)));
        const sh = A.shellsN(S.N), k = sh.length, e = el(), chg = S.Z - S.N;
        const cap = k ? ({ 1: 2, 2: 8, 3: 8, 4: 2 }[k] || 2) : 0;
        facts.textContent = '';
        const row = (a, b) => facts.appendChild(h('div', { class: 'fact' }, h('dt', {}, a), h('dd', {}, b)));
        row('Atom', e.name + (chg ? ' (' + (chg > 0 ? '+' + chg : '−' + (-chg)) + ' ion)' : ''));
        row('Protons / electrons', S.Z + ' / ' + S.N + (chg ? '  → charge ' + (chg > 0 ? '+' : '−') + Math.abs(chg) : ''));
        row('Electrons in each shell', sh.length ? sh.join(' · ') : '—');
        row('Outer shell', k ? sh[k - 1] + ' of ' + cap + (sh[k - 1] === cap ? ' (full)' : '') : '—');
        row('Pull the outer electron feels', k ? '+' + A.zeff(S.N, S.Z).toFixed(1) + '  (the nucleus is +' + S.Z + ', but the inner electrons cancel some)' : '—');
        pushBtn.disabled = false;
        measBtn.disabled = cost() == null || S.N > S.Z;
        pullBtn.disabled = cost() == null || S.N > S.Z && false;
        fillBtn.hidden = S.m1.size >= 20;
      }
      function syncPull() { pullOut.textContent = ''; pullOut.append(BL.words.pull(S.pull), BL.numv(' · ' + fmt(S.pull) + ' eV')); }
      choose(11);

      /* ---------------- geometry ---------------- */
      const geom = () => {
        const W = stage.w, H = stage.h, R = Math.min(W, H) * 0.45;
        const top = Math.max(3, A.shellsN(S.Z).length);
        return { W, H, cx: W / 2, cy: H / 2 + 10, R, rs: (n) => R * (0.24 + 0.72 * (n - 1) / (top - 1)) * 0.98 };
      };
      /* where the outermost electron sits, and the outward direction there */
      function handle() {
        const g = geom(), sh = A.shellsN(S.N), k = sh.length;
        if (!k) return null;
        const cap = { 1: 2, 2: 8, 3: 8, 4: 2 }[k] || 2, c = sh[k - 1];
        const ang = S.theta / k + (c - 1) * 2 * Math.PI / cap - Math.PI / 2;
        return { g, k, ang, r: g.rs(k), x: g.cx + Math.cos(ang) * g.rs(k), y: g.cy + Math.sin(ang) * g.rs(k) };
      }

      BL.drag(stage.canvas, {
        pick: (p) => { const hd = handle(); if (!hd || cost() == null || S.N > S.Z) return null; return Math.hypot(p.x - hd.x, p.y - hd.y) < 26 ? { hd } : null; },
        move: (a, p, start) => {
          const hd = handle(); if (!hd) return;
          S.dragging = true; S.hinted = true;
          const d = Math.hypot(p.x - hd.g.cx, p.y - hd.g.cy);
          const t = clamp((d - hd.r) / (hd.g.R * 0.55), 0, 1);
          S.pull = Math.round(PMAX * t * t * 10) / 10; slider.value = String(S.pull); syncPull();
          S.dragAng = Math.atan2(p.y - hd.g.cy, p.x - hd.g.cx);
        },
        end: () => { S.dragging = false; const P = S.pull; attempt(P); S.pull = 0; slider.value = '0'; syncPull(); },
      });
      stage.canvas.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); attempt(parseFloat(slider.value)); }
      });

      /* ---------------- chart picking ---------------- */
      BL.drag(chart.canvas, {
        pick: () => ({}),
        move: (a, p, start) => { if (!start) return; const Z = clamp(Math.floor(((p.x - 28) / (chart.w - 40)) * 20) + 1, 1, 20); choose(Z); },
      });

      /* ---------------- frame ---------------- */
      function frame(dt) {
        const pal = BL.pal, { W, H, cx, cy, R, rs } = geom();
        if (!BL.reduced) S.theta += dt * 0.6;

        // an automatic ramp
        if (S.ramp) {
          S.ramp.P += dt * 28; S.pull = Math.min(S.ramp.P, PMAX); slider.value = String(S.pull); syncPull();
          const c = cost();
          if (c != null && S.ramp.P >= c) { const P = S.ramp.P; S.ramp = null; attempt(P); S.pull = 0; slider.value = '0'; syncPull(); }
          else if (S.ramp && S.ramp.P > PMAX) { S.ramp = null; S.pull = 0; syncPull(); }
        } else if (!S.dragging && S.pull > 0 && !S.shake && Number(slider.value) === 0) S.pull = 0;

        ctx.clearRect(0, 0, W, H);
        const sh = A.shellsN(S.N), k = sh.length, chg = S.Z - S.N, c0 = cost();
        const hd = handle();

        // rings
        const maxShell = Math.max(3, A.shellsN(S.Z).length);
        for (let n = 1; n <= maxShell; n++) {
          ctx.beginPath(); ctx.arc(cx, cy, rs(n), 0, 7);
          ctx.lineWidth = n === k ? 3 : 2; ctx.strokeStyle = n === k ? BL.alpha(pal.electron, 0.9) : pal.line2;
          ctx.setLineDash(n === k ? [] : [4, 6]); ctx.stroke(); ctx.setLineDash([]);
        }

        // electrons and empty slots
        const strain = hd && c0 ? clamp(S.pull / c0, 0, 0.98) : 0;
        const shakeA = S.shake ? (1 - S.shake.t / 0.7) * (S.shake.bounce ? 5 : 3 + 7 * S.shake.a) : 0;
        if (S.shake) { S.shake.t += dt; if (S.shake.t > 0.7) S.shake = null; }
        for (let n = 1; n <= k; n++) {
          const c = sh[n - 1], cap = { 1: 2, 2: 8, 3: 8, 4: 2 }[n] || 2, rr = rs(n), isOuter = n === k;
          const slots = isOuter ? cap : c;
          for (let i = 0; i < slots; i++) {
            const a = S.theta / n + i * 2 * Math.PI / slots - Math.PI / 2;
            let x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
            if (i >= c) {                                        // an empty place on the outer shell
              ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.setLineDash([4, 4]); ctx.lineWidth = 2.5; ctx.strokeStyle = pal.ui; ctx.stroke(); ctx.setLineDash([]);
              continue;
            }
            const isHandle = isOuter && i === c - 1;
            if (isHandle) {
              const out = S.dragging && S.dragAng != null ? S.dragAng : a, d = strain * R * 0.3 + (c0 && S.dragging && S.pull >= c0 ? 24 : 0);
              const sx = shakeA ? Math.sin(S.shake ? S.shake.t * 60 : 0) * shakeA : 0;
              x += Math.cos(out) * d + sx; y += Math.sin(out) * d;
              if (d > 2) { ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); ctx.lineTo(x, y); ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]); ctx.strokeStyle = BL.mix(pal.line2, pal.neg, strain); ctx.stroke(); ctx.setLineDash([]); }
            }
            ctx.beginPath(); ctx.arc(x, y, isOuter ? 9.5 : 8, 0, 7);
            ctx.fillStyle = isOuter ? pal.electron : BL.mix(pal.electron, pal.fg, 0.5); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = pal.panel; ctx.stroke();
            if (isHandle && !S.hinted && !BL.reduced) {
              const pulse = 1 + 0.2 * Math.sin(performance.now() / 260);
              ctx.beginPath(); ctx.arc(x, y, 18 * pulse, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = pal.fg; ctx.stroke();
            }
          }
        }

        // the electron that got away
        if (S.esc) {
          S.esc.t += dt;
          const t = S.esc.t, hd2 = S.escFrom || (S.escFrom = handleAtEscape());
          const v = 120 + 55 * Math.sqrt(Math.max(0, S.esc.ke)), d = R * 0.14 + v * t;
          const x = hd2.x + Math.cos(hd2.ang) * d, y = hd2.y + Math.sin(hd2.ang) * d, a = clamp(1 - t / 1.6, 0, 1);
          if (a > 0) { ctx.globalAlpha = a; BL.bigBall(ctx, x, y, 9.5, pal.electron, pal.panel); ctx.globalAlpha = 1; }
          else { S.esc = null; S.escFrom = null; }
        }
        if (S.flash) { S.flash.t += dt; const t = S.flash.t; if (t > 1) S.flash = null; else { ctx.beginPath(); ctx.arc(cx, cy, rs(k) * (0.6 + t * 0.6), 0, 7); ctx.lineWidth = 4; ctx.strokeStyle = BL.alpha(pal.electron, 1 - t); ctx.stroke(); } }

        // the nucleus
        const nr = R * 0.085 + Math.sqrt(S.Z) * 1.6;
        ctx.beginPath(); ctx.arc(cx, cy, nr, 0, 7); ctx.fillStyle = pal.pos; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = pal.panel; ctx.stroke();
        ctx.fillStyle = ink(pal.pos); ctx.font = BL.font(700, 14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('+' + S.Z, cx, cy + 1); ctx.textBaseline = 'alphabetic';

        // labels
        const f = BL.fs(13);
        const name = el().sym + (chg ? (chg > 0 ? (chg > 1 ? chg : '') + '⁺' : (chg < -1 ? -chg : '') + '⁻').replace(/^/, '') : '');
        ctx.fillStyle = pal.fg; ctx.font = BL.font(800, 28, true); ctx.textAlign = 'left'; ctx.fillText(name, 16, 8 + BL.fs(28));
        ctx.font = BL.font(400, 14); ctx.fillStyle = pal.muted; ctx.fillText(el().name, 16, 8 + BL.fs(28) + BL.fs(14) * 1.4);
        if (k) {
          const cap = { 1: 2, 2: 8, 3: 8, 4: 2 }[k] || 2;
          BL.label(ctx, 'outer shell: ' + sh[k - 1] + ' of ' + cap, W - 14, 14 + f, { font: BL.font(700, 13), align: 'right', border: pal.electron });
        }
        if (S.pull > 0 && c0) {
          BL.label(ctx, 'pulling ' + BL.words.pull(S.pull) + (BL.nums ? ' · ' + fmt(S.pull) + ' eV' : ''), cx, H - 16 - f * 0.4, { font: BL.font(700, 14), border: pal.ui });
        } else if (!S.hinted) {
          BL.label(ctx, 'drag the glowing electron outward', cx, H - 16 - f * 0.4, { font: BL.font(700, 14), border: pal.ui });
        }

        drawChart();
      }
      function handleAtEscape() {
        // the electron has just been removed: place it where the outer electron was (one more electron than now)
        const g = geom(), sh = A.shellsN(S.N + 1), k = sh.length, cap = { 1: 2, 2: 8, 3: 8, 4: 2 }[k] || 2, c = sh[k - 1];
        const ang = S.theta / k + (c - 1) * 2 * Math.PI / cap - Math.PI / 2, r = g.rs(k);
        return { x: g.cx + Math.cos(ang) * r, y: g.cy + Math.sin(ang) * r, ang: S.dragAng != null && S.dragging ? S.dragAng : ang };
      }

      function drawChart() {
        const c = chart.ctx, W = chart.w, H = chart.h, pal = BL.pal; if (!W) return;
        c.clearRect(0, 0, W, H);
        const f = BL.fs(13), m = { l: 34, r: 8, t: f * 1.2, b: f * 2.4 };
        const ymax = S.view === 1 ? 28 : 80, store = S.view === 1 ? S.m1 : S.m2;
        const X = (Z) => m.l + ((Z - 0.5) / 20) * (W - m.l - m.r), Y = (v) => H - m.b - (v / ymax) * (H - m.b - m.t);
        c.font = BL.font(400, 13); c.fillStyle = pal.muted; c.textAlign = 'right';
        const ticks = ymax === 28 ? [0, 10, 20] : [0, 20, 40, 60, 80];
        ticks.forEach((v) => { c.strokeStyle = pal.line; c.lineWidth = 1; c.beginPath(); c.moveTo(m.l, Y(v)); c.lineTo(W - m.r, Y(v)); c.stroke(); c.fillText(String(v), m.l - 6, Y(v) + 4); });
        c.textAlign = 'center';
        A.EL.forEach((e) => {
          const cur = e.Z === S.Z, noble = A.isFull(e.Z);
          c.fillStyle = cur ? pal.fg : pal.muted; c.font = BL.font(cur ? 800 : 400, 13);
          c.fillText(e.sym, X(e.Z), H - m.b + f * 1.25);
          if (cur) { c.fillStyle = pal.electron; c.fillRect(X(e.Z) - 10, H - m.b + f * 1.5, 20, 3); }
        });
        // line through measured, in atom order
        const pts = A.EL.filter((e) => store.get(e.Z) != null).map((e) => [e.Z, store.get(e.Z)]);
        c.strokeStyle = BL.alpha(pal.ui, 0.55); c.lineWidth = 2;
        c.beginPath(); let pen = false, prev = 0;
        pts.forEach(([Z, v]) => { if (Z - prev !== 1) pen = false; const x = X(Z), y = Y(Math.min(v, ymax)); if (pen) c.lineTo(x, y); else c.moveTo(x, y); pen = true; prev = Z; }); c.stroke();
        pts.forEach(([Z, v]) => {
          const x = X(Z), y = Y(Math.min(v, ymax)), cur = Z === S.Z;
          c.beginPath(); c.arc(x, y, cur ? 7 : 5.5, 0, 7); c.fillStyle = A.isFull(Z) ? pal.electron : pal.ui; c.fill(); c.lineWidth = 2; c.strokeStyle = pal.panel; c.stroke();
        });
        if (!pts.length) { c.fillStyle = pal.muted; c.font = BL.font(400, 14); c.textAlign = 'center'; c.fillText('Nothing measured yet. Pull on some atoms.', (W + m.l) / 2, H / 2); }
      }

      const loop = BL.loop(frame);
      loop.start();
      return { destroy() { loop.stop(); stage.destroy(); chart.destroy(); } };
    },
  });
})();
