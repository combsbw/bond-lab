/* The app shell both labs run on: hash router, hub page, Display menu.

   Bond Lab (index.html) and the Life Lab (life.html) are the same machine with
   different instruments loaded. Each entry point loads a config file —
   js/lab-bond.js or js/lab-life.js — that sets BL.lab before this runs, and
   everything on the hub comes from there. Instruments register themselves into
   BL.sims as their own scripts load, so BL.sims only ever holds the ones that
   entry point asked for. */
(function () {
  'use strict';
  const { h } = BL;

  const L = BL.lab || { name: 'Lab', tagline: '', fields: [] };
  const FIELDS = L.fields || [];
  const PLANNED = L.planned || [];

  const plannedArt = '<svg viewBox="0 0 200 120" aria-hidden="true"><circle cx="100" cy="60" r="24" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="2" stroke-dasharray="4 6"/></svg>';

  const view = document.getElementById('view');
  const crumb = document.getElementById('crumb');
  let current = null;

  function setCrumb(parts) {
    crumb.textContent = '';
    parts.forEach((p, i) => {
      if (i) crumb.appendChild(h('span', { class: 'sep', 'aria-hidden': 'true' }, '/'));
      const last = i === parts.length - 1;
      crumb.appendChild(p.href ? h('a', { href: p.href }, p.text) : h('span', { class: last ? 'here' : 'mid', 'aria-current': last ? 'page' : null }, p.text));
    });
  }

  function teardown() {
    if (current && current.destroy) current.destroy();
    current = null;
    view.textContent = '';
  }

  function showHub() {
    document.title = L.name;
    setCrumb([]);
    view.appendChild(h('div', { class: 'hub-head' },
      h('h1', {}, L.name),
      h('p', {}, L.tagline)));

    /* The spine: the one idea the whole lab hangs off, as a strip you can walk
       into. A learner who has it sees the rest as variations instead of as a
       list to memorise, which is the difference between this and a textbook. */
    const sp = L.spine;
    if (sp) {
      view.appendChild(h('a', { class: 'spine', href: sp.href },
        h('div', { class: 'spine-head' }, h('h2', {}, sp.title), h('p', {}, sp.blurb)),
        h('div', { class: 'spine-band' + (sp.tone ? ' tone-' + sp.tone : ''), 'aria-hidden': 'true' },
          sp.rows.map(([word, book]) => h('span', {}, h('b', {}, word), h('i', {}, book)))),
        h('span', { class: 'spine-go' }, sp.go)));
    }

    FIELDS.forEach((f) => {
      const built = BL.sims.filter((s) => s.field === f.id).sort((a, b) => (a.order || 0) - (b.order || 0));
      const planned = PLANNED.filter((p) => p.field === f.id);
      const done = built.reduce((n, s) => n + Math.min(BL.goalsDone(s.id), s.goals.length), 0);
      const total = built.reduce((n, s) => n + s.goals.length, 0);

      const tiles = h('div', { class: 'tiles' });
      built.forEach((s) => {
        const pips = h('span', { class: 'pips', 'aria-hidden': 'true' });
        const d = BL.goalsDone(s.id);
        s.goals.forEach((g, i) => pips.appendChild(h('span', { class: 'pip' + (i < d ? ' on' : '') })));
        tiles.appendChild(h('a', { class: 'tile', href: '#/' + s.id },
          h('div', { class: 'tile-art', html: s.art }),
          h('div', {}, h('h3', {}, s.name), h('p', {}, s.tagline)),
          h('div', { class: 'tile-foot' }, pips, h('span', {}, Math.min(d, s.goals.length) + ' of ' + s.goals.length + ' tried'))));
      });
      planned.forEach((p) => {
        tiles.appendChild(h('div', { class: 'tile planned' },
          h('div', { class: 'tile-art', html: plannedArt }),
          h('div', {}, h('h3', {}, p.name), h('p', {}, p.tagline)),
          h('div', { class: 'tile-foot' }, h('span', { class: 'tag' }, 'In the works'))));
      });

      const section = h('section', { class: 'field', 'aria-labelledby': 'f-' + f.id },
        h('div', { class: 'field-head' },
          h('h2', { id: 'f-' + f.id }, f.name),
          h('span', { class: 'tally' }, built.length ? done + ' of ' + total + ' things tried' : 'Coming')),
        h('p', { class: 'field-lede' }, f.lede),
        tiles);

      // the everyday questions for this field, shut until somebody wants them
      if (BL.challenges) {
        const sc = BL.quizScore(f.id);
        if (sc.total) {
          const host = h('div', { class: 'ch-host' });
          BL.challenges(host, {
            field: f.id,
            title: 'Why this matters',
            lede: 'Ordinary things — a burst pipe, a street lamp, a beaded windscreen — that come straight out of this section. Commit to an answer, then go into the instrument named underneath and settle it for yourself.',
          });
          section.appendChild(BL.fold(
            sc.total + ' everyday challenges' + (sc.done ? ' · ' + sc.done + ' answered' : ''),
            host));
        }
      }
      view.appendChild(section);
    });

    /* The neighbouring labs. The chapters build on each other, so each hub says
       where the one before and the one after are. `sibling` is the one-neighbour
       form; `siblings` is a list. */
    const neighbours = L.siblings || (L.sibling ? [L.sibling] : []);
    neighbours.forEach((n, i) => {
      view.appendChild(h('a', { class: 'spine sibling', href: n.href, style: i ? 'margin-top:14px' : null },
        h('div', { class: 'spine-head' },
          h('span', { class: 'tag' }, n.kicker),
          h('h2', {}, n.title),
          h('p', {}, n.blurb)),
        h('span', { class: 'spine-go' }, n.go)));
    });
  }

  function showSim(sim, params) {
    document.title = sim.name + ' · ' + L.name;
    const field = FIELDS.find((f) => f.id === sim.field);
    setCrumb([{ text: 'Lab', href: '#/' }, { text: field ? field.name : '' }, { text: sim.name }]);
    const slots = {
      stage: h('div', { class: 'slot-stage' }),
      aux: h('div', { class: 'slot-aux' }),
      dock: h('aside', { class: 'dock slot-dock', 'aria-label': sim.name + ' controls' }),
      ask: h('div', { class: 'slot-ask' }),
      params,
    };
    // one plain sentence saying what the learner is about to look at, before
    // any of the instrument's own machinery gets a word in
    if (sim.lede) slots.stage.appendChild(h('p', { class: 'stage-cap' }, sim.lede));
    view.appendChild(h('div', { class: 'sim' }, slots.stage, slots.aux, slots.dock, slots.ask));
    current = sim.mount(slots);
    /* Every instrument ends with the everyday questions it can settle. They go
       last — under the readouts, the controls and the things to try — and shut,
       the same way they sit on the hub, so the learner meets them having
       already played and nobody has to scroll past them to get to the work. */
    if (BL.challenges && BL.quizFor({ sim: sim.id }).length) {
      const total = BL.quizFor({ sim: sim.id }).length;
      const host = h('div', { class: 'ch-host ch-sim' });
      const words = () => {
        const done = BL.quizFor({ sim: sim.id }).filter((q) => (BL.store.get('quiz', {}) || {})[q.id]).length;
        return 'Why this matters · ' + total + ' everyday challenge' + (total === 1 ? '' : 's') + (done ? ' · ' + done + ' answered' : '');
      };
      const fold = BL.fold(words(), host);
      BL.challenges(host, {
        sim: sim.id,
        title: 'Why this matters',
        lede: 'Ordinary things that come out of what you have just been poking. Commit to an answer, then go back up and settle it.',
        onanswer: () => { fold.firstChild.textContent = words(); },
      });
      slots.ask.appendChild(fold);
    }
  }

  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const id = parts[0];
    teardown();
    const sim = BL.sims.find((s) => s.id === id);
    if (sim) showSim(sim, parts.slice(1).map(decodeURIComponent)); else showHub();
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  }

  /* ---------------- Display menu ---------------- */
  const btn = document.getElementById('display-btn');
  const pop = document.getElementById('display-pop');

  function seg(label, current, opts, onpick) {
    const group = h('div', { class: 'seg', role: 'group', 'aria-label': label });
    opts.forEach(([val, text]) => {
      const b = h('button', { type: 'button', 'aria-pressed': String(String(current) === String(val)), onclick: () => { onpick(val); buildPop(); } }, text);
      group.appendChild(b);
    });
    return h('div', {}, h('h2', {}, label), group);
  }

  function buildPop() {
    const D = BL.display;
    pop.textContent = '';
    pop.append(
      seg('Look', D.theme, [['auto', 'Match device'], ['light', 'Light'], ['dark', 'Dark']], (v) => BL.setDisplay({ theme: v })),
      seg('Text size', D.size, [[0, 'Normal'], [1, 'Large'], [2, 'Extra large']], (v) => BL.setDisplay({ size: parseInt(v, 10) })),
      h('label', { class: 'check' },
        h('input', { type: 'checkbox', checked: D.contrast ? 'checked' : null, onchange: (e) => { BL.setDisplay({ contrast: e.target.checked }); } }),
        h('span', {}, 'High contrast', h('small', {}, 'Black and white with strong outlines.'))),
      h('label', { class: 'check' },
        h('input', { type: 'checkbox', checked: D.calm ? 'checked' : null, onchange: (e) => { BL.setDisplay({ calm: e.target.checked }); } }),
        h('span', {}, 'Calm motion', h('small', {}, 'Stops pulsing hints and slows movement.'))),
      h('label', { class: 'check' },
        h('input', { type: 'checkbox', checked: D.nums ? 'checked' : null, onchange: (e) => { BL.setDisplay({ nums: e.target.checked }); } }),
        h('span', {}, 'Show the numbers', h('small', {}, 'Adds the measured values — kilojoules, kelvin, electron volts, ångströms — on top of the plain words. Off is the normal way round.'))),
      progressBlock());
  }

  /* What this lab remembers about you, and the way to make it forget.
     Each instrument has its own “start this one over” under its list of
     things to try; this is the whole lab at once. The two labs share one
     store, so this only clears the one you are in. */
  function progressBlock() {
    const p = BL.labProgress();
    return h('div', { class: 'progress-block' },
      h('h2', {}, 'Progress'),
      h('p', { class: 'hint' }, p.done + ' of ' + p.total + ' things tried'
        + (p.quiz ? ', and ' + p.quiz + ' challenge' + (p.quiz === 1 ? '' : 's') + ' answered' : '')
        + '. Kept in this browser only — nothing leaves the device, and another browser or another device starts fresh.'),
      h('div', { class: 'actions' },
        BL.confirmBtn('Reset ' + L.name + '’s progress', 'Tap again — this cannot be undone', () => {
          BL.resetLab();
          closePop(true);
        })),
      h('p', { class: 'hint' }, 'Clears the ticks, the calls you committed to and the challenge answers for ' + L.name + '. The other lab is left alone, and so are these display settings.'));
  }
  const closePop = (focusBtn) => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focusBtn) btn.focus(); };
  btn.addEventListener('click', () => {
    const open = pop.hidden;
    if (open) { buildPop(); pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); const f = pop.querySelector('button'); if (f) f.focus(); } else closePop(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) closePop(true); });
  document.addEventListener('pointerdown', (e) => { if (!pop.hidden && !pop.contains(e.target) && !btn.contains(e.target)) closePop(false); });

  /* The sticky stage sits just under the header, whatever height the header has. */
  const bar = document.getElementById('bar');
  const fitBar = () => document.documentElement.style.setProperty('--bar-h', bar.getBoundingClientRect().height + 'px');
  new ResizeObserver(fitBar).observe(bar);
  fitBar();

  window.addEventListener('hashchange', route);
  /* A reset has to show: the hub's pips and tallies, and any instrument on
     screen, are all built from what was just thrown away. */
  window.addEventListener('bl-progress-reset', route);
  document.getElementById('foot-note').textContent = L.version || 'v1.0';
  // Instruments register themselves when their scripts load, before this file runs.
  route();
})();
