/* Bond Lab core: tiny helpers shared by every instrument.
   Plain scripts on purpose (no modules, no build) so the site runs from
   GitHub Pages, from a USB stick, or by double-clicking index.html. */
(function () {
  'use strict';
  const BL = (window.BL = window.BL || {});

  /* Instrument registry. Instruments call BL.register() as their script loads;
     app.js reads BL.sims once everything is in. */
  BL.sims = [];
  BL.register = (sim) => BL.sims.push(sim);

  BL.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  BL.lerp = (a, b, t) => a + (b - a) * t;
  BL.randn = () => {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  /* Per-browser memory (goal ticks, display settings). Never required for anything to work. */
  BL.store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('bondlab.' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('bondlab.' + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
  };

  /* -------------------------------------------------------------------
     Display: light/dark, text size, contrast, calm motion.
     CSS reads data-* attributes on <html>. Canvas drawing reads BL.pal
     (colors, refreshed whenever the theme changes) and BL.ts (text scale).
     ------------------------------------------------------------------- */
  const SIZES = [1, 1.15, 1.3];
  const mqDark = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  const mqMotion = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const mqContrast = window.matchMedia ? matchMedia('(prefers-contrast: more)') : null;

  const D = { theme: 'auto', size: 0, contrast: false, calm: false };
  Object.assign(D, BL.store.get('display', {}));
  D.size = BL.clamp(parseInt(D.size, 10) || 0, 0, SIZES.length - 1);
  BL.display = D;

  BL.ts = SIZES[D.size];
  BL.pal = {};
  Object.defineProperty(BL, 'reduced', { get: () => D.calm || !!(mqMotion && mqMotion.matches) });

  const VARS = ['bg', 'panel', 'panel-2', 'line', 'line-2', 'fg', 'muted', 'ui', 'ui-ink', 'electron', 'pos', 'neg', 'cloud', 'wash',
    't-covalent', 't-ionic', 't-hydrogen', 't-dipole', 't-iondipole', 't-vdw'];
  const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());   // 'line-2' -> 'line2'

  BL.readPalette = function () {
    const cs = getComputedStyle(document.documentElement);
    const p = {};
    VARS.forEach((v) => { p[camel(v)] = cs.getPropertyValue('--' + v).trim(); });
    p.dark = document.documentElement.dataset.theme === 'dark';
    p.types = { covalent: p.tCovalent, ionic: p.tIonic, hydrogen: p.tHydrogen, dipole: p.tDipole, iondipole: p.tIondipole, vdw: p.tVdw };
    BL.pal = p;
    return p;
  };

  BL.applyDisplay = function () {
    const root = document.documentElement;
    const dark = D.theme === 'dark' || (D.theme === 'auto' && mqDark && mqDark.matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.ts = String(D.size);
    root.dataset.contrast = (D.contrast || (D.theme === 'auto' && mqContrast && mqContrast.matches && false)) ? 'high' : 'normal';
    root.dataset.calm = D.calm ? 'yes' : 'no';
    BL.ts = SIZES[D.size];
    BL.readPalette();
    window.dispatchEvent(new Event('bl-display'));
  };
  BL.setDisplay = function (patch) {
    Object.assign(D, patch);
    BL.store.set('display', { theme: D.theme, size: D.size, contrast: D.contrast, calm: D.calm });
    BL.applyDisplay();
  };
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', () => { if (D.theme === 'auto') BL.applyDisplay(); });

  /* hex '#rrggbb' + alpha -> 'rgba(...)'. Cached, because canvas code calls it every frame. */
  const aCache = new Map();
  BL.alpha = function (hex, a) {
    const key = hex + '|' + a;
    let v = aCache.get(key);
    if (!v) {
      const n = parseInt(hex.slice(1), 16);
      v = 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
      if (aCache.size > 4000) aCache.clear();
      aCache.set(key, v);
    }
    return v;
  };
  BL.rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  BL.mix = (a, b, t) => {
    const x = BL.rgb(a), y = BL.rgb(b);
    return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',') + ')';
  };

  /* Canvas text. Nothing is ever drawn smaller than 13 CSS px, and everything follows the text-size setting. */
  BL.FONT = '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", "Segoe UI", system-ui, -apple-system, sans-serif';
  BL.FONT_D = '"Bricolage Grotesque", "Atkinson Hyperlegible Next", "Segoe UI", system-ui, sans-serif';
  BL.fs = (px) => Math.max(13, Math.round(px * BL.ts * 10) / 10);
  BL.font = (weight, px, display) => weight + ' ' + BL.fs(px) + 'px ' + (display ? BL.FONT_D : BL.FONT);

  /* A label on a small rounded plate, so text stays readable over anything. */
  BL.label = function (ctx, text, x, y, o) {
    o = o || {};
    const pal = BL.pal;
    ctx.font = o.font || BL.font(500, 14);
    const tw = ctx.measureText(text).width, pad = o.pad == null ? 6 : o.pad, fsz = parseFloat(ctx.font.match(/(\d+(\.\d+)?)px/)[1]);
    const w = tw + pad * 2, h = fsz + 8;
    const align = o.align || 'center';
    const x0 = align === 'center' ? x - w / 2 : align === 'left' ? x : x - w;
    if (o.bg !== false) {
      ctx.fillStyle = o.bg || BL.alpha(pal.panel, 0.88);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x0, y - h / 2, w, h, 7); else ctx.rect(x0, y - h / 2, w, h);
      ctx.fill();
      if (o.border) { ctx.lineWidth = 1.2; ctx.strokeStyle = o.border; ctx.stroke(); }
    }
    ctx.fillStyle = o.color || pal.fg;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x0 + pad, y + 0.5);
    ctx.textBaseline = 'alphabetic';
    return { x: x0, y: y - h / 2, w, h };
  };

  /* Minimal element builder: h('div', {class:'x', onclick: fn}, child, 'text') */
  BL.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return el;
  };

  /* A canvas that fills a fixed-aspect box and stays crisp on retina screens. */
  BL.stage = function (host, aspect, opts) {
    opts = opts || {};
    const wrap = BL.h('div', { class: 'stage' });
    const canvas = BL.h('canvas', { class: 'stage-canvas' });
    if (opts.label) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', opts.label); }
    if (opts.focusable) canvas.setAttribute('tabindex', '0');
    wrap.appendChild(canvas);
    host.appendChild(wrap);
    wrap.style.aspectRatio = aspect;
    const s = { wrap, canvas, ctx: canvas.getContext('2d'), w: 0, h: 0, dpr: 1, onresize: null };
    const fit = () => {
      const r = wrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.w = r.width;
      s.h = r.height;
      canvas.width = Math.round(r.width * s.dpr);
      canvas.height = Math.round(r.height * s.dpr);
      s.ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      if (s.onresize) s.onresize();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    fit();
    s.destroy = () => ro.disconnect();
    return s;
  };

  /* Pointer dragging that works for mouse, pen and touch.
     pick(p) -> truthy handle to start a drag, or falsy.
     move(handle, p, isStart), end(handle, p), hover(p) optional. */
  BL.drag = function (canvas, { pick, move, end, hover }) {
    let active = null;
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e) => {
      const p = pos(e);
      const hit = pick(p);
      if (!hit) return;
      active = hit;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
      move(active, p, true);
    };
    const onMove = (e) => {
      const p = pos(e);
      if (active) { move(active, p, false); return; }
      const over = pick(p);
      canvas.style.cursor = over ? 'grab' : 'default';
      if (hover) hover(p, over);
    };
    const onUp = (e) => {
      if (!active) return;
      const a = active;
      active = null;
      canvas.style.cursor = 'default';
      if (end) end(a, pos(e));
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', () => { if (hover && !active) hover(null, null); });
    return { isDragging: () => !!active };
  };

  /* requestAnimationFrame loop with a clamped dt. */
  BL.loop = function (fn) {
    let id = 0, last = 0, running = false;
    const tick = (t) => {
      if (!running) return;
      // rAF's first timestamp can precede performance.now(), so never let dt go negative
      const raw = (t - last) / 1000;
      const dt = raw > 0 ? Math.min(0.05, raw) : 0.016;
      last = t;
      fn(dt, t / 1000);
      id = requestAnimationFrame(tick);
    };
    return {
      start() { if (running) return; running = true; last = performance.now(); id = requestAnimationFrame(tick); },
      stop() { running = false; cancelAnimationFrame(id); },
    };
  };

  /* Quiet challenges. They are prompts, not lessons: the check happens
     when the learner actually produces the situation. */
  BL.goals = function (host, simId, defs) {
    const key = 'goals.' + simId;
    const done = new Set(BL.store.get(key, []));
    const items = {};
    const list = BL.h('ul', { class: 'goals', 'aria-label': 'Things to try' });
    const say = BL.h('div', { class: 'sr-only', 'aria-live': 'polite' });
    defs.forEach((g) => {
      const li = BL.h('li', { class: 'goal' + (done.has(g.id) ? ' done' : '') },
        BL.h('span', { class: 'goal-mark', 'aria-hidden': 'true' }),
        BL.h('span', { class: 'goal-text' }, g.text),
        BL.h('span', { class: 'sr-only' }, done.has(g.id) ? ' (done)' : ''));
      items[g.id] = li;
      list.appendChild(li);
    });
    host.appendChild(list);
    host.appendChild(say);
    return {
      el: list,
      done(id) {
        if (done.has(id) || !items[id]) return;
        done.add(id);
        BL.store.set(key, [...done]);
        const li = items[id];
        li.classList.add('done', 'just');
        li.lastChild.textContent = ' (done)';
        say.textContent = 'Done: ' + (defs.find((g) => g.id === id) || {}).text;
        setTimeout(() => li.classList.remove('just'), 1600);
      },
      has: (id) => done.has(id),
    };
  };

  /* How many goals has this browser completed for an instrument? */
  BL.goalsDone = (simId) => (BL.store.get('goals.' + simId, []) || []).length;

  BL.applyDisplay();
})();
