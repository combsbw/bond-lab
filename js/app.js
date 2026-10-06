/* Bond Lab app shell: hash router, hub page, Display menu. */
(function () {
  'use strict';
  const { h } = BL;

  const FIELDS = [
    { id: 'atoms', name: 'Atoms', lede: 'Where the electrons are, why they sit where they sit, and why the outer ones are the only ones that ever meet anybody.' },
    { id: 'bonding', name: 'Bonding', lede: 'What happens when two atoms meet — and why every kind of bond you have ever been given a name for is one dial at a different setting.' },
    { id: 'water', name: 'Water', lede: 'One small bent molecule, and everything it does because of the way it holds on.' },
  ];

  /* The one idea the whole Bonding section hangs off. It sits at the top of the
     hub as a strip you can walk into, because a learner who has it will see
     the rest as variations instead of as a list to memorise. */
  const SPINE = [
    ['shared evenly', 'covalent'],
    ['shared unevenly', 'polar covalent'],
    ['nearly taken', 'very polar'],
    ['handed over', 'ionic'],
  ];

  /* Instruments not built yet. They show on the hub so the shape of the whole lab is visible. */
  const PLANNED = [
  ];

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
    document.title = 'Bond Lab';
    setCrumb([]);
    view.appendChild(h('div', { class: 'hub-head' },
      h('h1', {}, 'Bond Lab'),
      h('p', {}, 'Instruments for things too small to see. Poke them and watch what answers.')));

    // the spine: one dial, four names, and a way in
    view.appendChild(h('a', { class: 'spine', href: '#/spectrum' },
      h('div', { class: 'spine-head' },
        h('h2', {}, 'It is all one dial'),
        h('p', {}, 'Covalent, polar, ionic, hydrogen bonds, van der Waals — not a list of five different things. One question, asked at different settings: how evenly do two atoms share their electrons? Start here.')),
      h('div', { class: 'spine-band', 'aria-hidden': 'true' },
        SPINE.map(([word, book]) => h('span', {}, h('b', {}, word), h('i', {}, book)))),
      h('span', { class: 'spine-go' }, 'Open The Spectrum →')));

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
  }

  function showSim(sim, params) {
    document.title = sim.name + ' · Bond Lab';
    const field = FIELDS.find((f) => f.id === sim.field);
    setCrumb([{ text: 'Lab', href: '#/' }, { text: field ? field.name : '' }, { text: sim.name }]);
    const slots = {
      stage: h('div', { class: 'slot-stage' }),
      aux: h('div', { class: 'slot-aux' }),
      dock: h('aside', { class: 'dock slot-dock', 'aria-label': sim.name + ' controls' }),
      params,
    };
    // one plain sentence saying what the learner is about to look at, before
    // any of the instrument's own machinery gets a word in
    if (sim.lede) slots.stage.appendChild(h('p', { class: 'stage-cap' }, sim.lede));
    view.appendChild(h('div', { class: 'sim' }, slots.stage, slots.aux, slots.dock));
    current = sim.mount(slots);
    /* Every instrument ends with the everyday questions it can settle. They go
       last, under the readouts, so the learner meets them having already
       played — which is the only order in which they are worth anything. */
    if (BL.challenges) {
      BL.challenges(slots.aux, {
        sim: sim.id,
        title: 'Why this matters',
        lede: 'Ordinary things that come out of what you have just been poking. Commit to an answer, then go back up and settle it.',
      });
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
        h('span', {}, 'Show the numbers', h('small', {}, 'Adds the measured values — kilojoules, kelvin, electron volts, ångströms — on top of the plain words. Off is the normal way round.'))));
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
  document.getElementById('foot-note').textContent = 'v1.0';
  // Instruments register themselves when their scripts load, before this file runs.
  route();
})();
