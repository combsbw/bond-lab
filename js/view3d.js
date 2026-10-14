/* View3D: one way to turn a solid over, everywhere in the lab.

   Anything that is really a three-dimensional object — a molecule, a crystal,
   a chain — should be something a learner can pick up. That has to feel the
   same in every instrument or it is a new thing to learn each time, so this
   is the one place that decides how:

     one finger or mouse   turns it, and lets go with a little momentum
     two fingers           pinch to zoom, and twisting does nothing surprising
     wheel                 zooms
     double tap / click    brings it back to where it started
     arrow keys            turn it, for anyone who cannot drag
     tap without moving    is a click on whatever is under the finger

   The last one is the interesting one. Most of these canvases also want to be
   clicked — a hydrogen to grow, a bond to pick, a base to change — so a press
   is not known to be a turn until it has moved. `pick(p)` can claim a press
   before that (to drag an atom, say); otherwise it becomes a turn if it moves
   and a `tap(p)` if it does not.

   Projection is perspective, gently, because with none at all a rotating
   molecule has no depth cue and reads as a flat thing that is being squashed.
   Everything drawn goes through one depth-sorted list so what is in front is
   really drawn in front. */
(function () {
  'use strict';
  const BL = window.BL;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  BL.view3d = function (canvas, o) {
    o = o || {};
    const V = {
      yaw: o.yaw == null ? 0.6 : o.yaw, pitch: o.pitch == null ? 0.3 : o.pitch,
      zoom: 1, vy: 0, vp: 0,
      auto: o.auto == null ? 0.35 : o.auto,         // idle spin, radians a second; 0 for none
      userTurned: false, turned: 0,                  // how far the learner has turned it, in radians
      persp: o.persp == null ? 0.16 : o.persp,
      home: { yaw: o.yaw == null ? 0.6 : o.yaw, pitch: o.pitch == null ? 0.3 : o.pitch },
      cx: 0, cy: 0, scale: 100, cam: 6,
      onturn: o.onturn || null, tap: o.tap || null, pick: o.pick || null, drag: o.drag || null, end: o.end || null, hover: o.hover || null,
    };
    canvas.style.touchAction = 'none';
    canvas.setAttribute('tabindex', canvas.getAttribute('tabindex') || '0');

    const pts = new Map();                // active pointers
    let press = null, pinch = null, last = 0;

    const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    canvas.addEventListener('pointerdown', (e) => {
      const p = pos(e);
      pts.set(e.pointerId, p);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (pts.size === 2) {                // a second finger turns a press into a pinch
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: V.zoom };
        press = null; return;
      }
      V.vy = V.vp = 0;
      const claimed = V.pick ? V.pick(p) : null;
      press = { x0: p.x, y0: p.y, x: p.x, y: p.y, t: performance.now(), moved: 0, claimed, lastMove: performance.now() };
      last = performance.now();
      if (claimed) canvas.style.cursor = 'grabbing';
      e.preventDefault();
    });

    canvas.addEventListener('pointermove', (e) => {
      const p = pos(e);
      if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
      if (pinch && pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        V.zoom = clamp(pinch.z * (d / Math.max(1, pinch.d)), 0.45, 3.2);
        return;
      }
      if (!press) { if (V.hover) V.hover(p); return; }
      const dx = p.x - press.x, dy = p.y - press.y;
      press.x = p.x; press.y = p.y;
      press.moved += Math.abs(dx) + Math.abs(dy);
      if (press.claimed) { if (V.drag) V.drag(press.claimed, p, dx, dy); return; }
      if (press.moved < 5) return;         // still might be a tap
      const now = performance.now(), dt = Math.max(0.008, (now - last) / 1000);
      last = now; press.lastMove = now;
      const k = 0.0105;
      V.yaw += dx * k; V.pitch = clamp(V.pitch + dy * k, -1.55, 1.55);
      V.vy = (dx * k) / dt * 0.6; V.vp = (dy * k) / dt * 0.6;     // momentum on release
      V.turned += (Math.abs(dx) + Math.abs(dy)) * k;
      V.userTurned = true;
      canvas.style.cursor = 'grabbing';
      if (V.onturn) V.onturn(V);
    });

    const up = (e) => {
      const p = pos(e);
      pts.delete(e.pointerId);
      if (pinch) { if (pts.size < 2) pinch = null; return; }
      if (!press) return;
      const pr = press; press = null;
      // let go after holding still and it should stay put, not coast on the last flick
      if (performance.now() - pr.lastMove > 90) { V.vy = 0; V.vp = 0; }
      canvas.style.cursor = '';
      if (pr.claimed) { if (V.end) V.end(pr.claimed, p, pr.moved); return; }
      if (pr.moved < 5) {
        // a tap. Two quick ones in the same place bring the view home.
        const now = performance.now();
        if (V._tapAt && now - V._tapAt < 320 && Math.hypot(p.x - V._tapX, p.y - V._tapY) < 24) { V.home_(); V._tapAt = 0; return; }
        V._tapAt = now; V._tapX = p.x; V._tapY = p.y;
        if (V.tap) V.tap(p);
      }
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); press = null; pinch = null; canvas.style.cursor = ''; });
    canvas.addEventListener('pointerleave', () => { if (!press && V.hover) V.hover(null); });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      V.zoom = clamp(V.zoom * Math.exp(-e.deltaY * 0.0015), 0.45, 3.2);
    }, { passive: false });
    canvas.addEventListener('keydown', (e) => {
      const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (k) {
        e.preventDefault();
        V.yaw += k[0] * 0.16; V.pitch = clamp(V.pitch + k[1] * 0.16, -1.55, 1.55);
        V.turned += 0.16; V.userTurned = true; if (V.onturn) V.onturn(V);
      } else if (e.key === '+' || e.key === '=') V.zoom = clamp(V.zoom * 1.12, 0.45, 3.2);
      else if (e.key === '-') V.zoom = clamp(V.zoom / 1.12, 0.45, 3.2);
      else if (e.key === '0' || e.key === 'Home') V.home_();
    });

    /* Back to where it started, with a glide rather than a jump. */
    V.home_ = () => { V.goal = { yaw: V.home.yaw, pitch: V.home.pitch, zoom: 1 }; V.vy = V.vp = 0; V.userTurned = false; };

    /* Per-frame: momentum, the glide home, and the idle spin. */
    V.step = function (dt) {
      if (V.goal) {
        const g = V.goal, e = 1 - Math.exp(-dt * 7);
        let dy = ((g.yaw - V.yaw + Math.PI) % TAU + TAU) % TAU - Math.PI;
        V.yaw += dy * e; V.pitch += (g.pitch - V.pitch) * e; V.zoom += (g.zoom - V.zoom) * e;
        if (Math.abs(dy) < 0.004 && Math.abs(g.pitch - V.pitch) < 0.004 && Math.abs(g.zoom - V.zoom) < 0.004) V.goal = null;
        return;
      }
      if (!press || press.claimed) {
        if (Math.abs(V.vy) > 0.01 || Math.abs(V.vp) > 0.01) {
          V.yaw += V.vy * dt; V.pitch = clamp(V.pitch + V.vp * dt, -1.55, 1.55);
          const f = Math.exp(-dt * 3.2);
          V.vy *= f; V.vp *= f;
        } else if (!V.userTurned && V.auto && !BL.reduced && !(press && press.claimed)) V.yaw += V.auto * dt;
      }
    };

    /* Set the frame this is drawn into. `radius` is the molecule's radius in
       its own units, so a big one and a small one both fill the stage. */
    V.frame = function (w, h, radius, mid) {
      V.w = w; V.h = h;
      V.mid = mid || { x: 0, y: 0, z: 0 };
      V.scale = Math.min(w - 36, h - 60) / (Math.max(0.5, radius) * 2.15) * V.zoom;
      V.cam = Math.max(0.5, radius) * (1 / Math.max(0.01, V.persp)) + radius;
      V.cx = w / 2; V.cy = h / 2 + 6;
      V.cy_ = Math.cos(V.yaw); V.sy_ = Math.sin(V.yaw); V.cp_ = Math.cos(V.pitch); V.sp_ = Math.sin(V.pitch);
      V.R = Math.max(0.5, radius);
    };

    /* A point in the object's own space -> a place on the screen, a depth,
       and how big things should look there. */
    V.project = function (p) {
      const x = p.x - V.mid.x, y = p.y - V.mid.y, z = p.z - V.mid.z;
      const x1 = x * V.cy_ + z * V.sy_, z1 = -x * V.sy_ + z * V.cy_;
      const y2 = y * V.cp_ - z1 * V.sp_, z2 = y * V.sp_ + z1 * V.cp_;
      const f = V.persp ? V.cam / (V.cam - z2) : 1;
      return { x: V.cx + x1 * V.scale * f, y: V.cy + y2 * V.scale * f, z: z2, s: f, d: clamp(0.5 + z2 / (V.R * 2.1), 0.15, 1) };
    };

    /* And the other way for a depth already known — used to drag something
       in the plane of the screen rather than into or out of it. */
    V.unproject = function (sx, sy, z2) {
      const f = V.persp ? V.cam / (V.cam - z2) : 1;
      const x1 = (sx - V.cx) / (V.scale * f), y2 = (sy - V.cy) / (V.scale * f);
      // the exact inverse of the two rotations in project()
      const y = y2 * V.cp_ + z2 * V.sp_;
      const zr = -y2 * V.sp_ + z2 * V.cp_;
      const x = x1 * V.cy_ - zr * V.sy_, z = x1 * V.sy_ + zr * V.cy_;
      return { x: x + V.mid.x, y: y + V.mid.y, z: z + V.mid.z };
    };

    /* A hint that this is a thing to turn, drawn on the canvas in the corner
       so it is there before anybody reads anything. */
    V.cue = function (ctx, pal) {
      if (V.userTurned || V.turned > 1.2 || BL.reduced) return;
      const x = V.w - 26, y = V.h - 24, t = performance.now() / 700;
      ctx.save();
      ctx.strokeStyle = BL.alpha(pal.ui, 0.55 + 0.35 * Math.sin(t)); ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y, 12, 0.4 + t * 0.3, 0.4 + t * 0.3 + 4.4); ctx.stroke();
      const a = 0.4 + t * 0.3 + 4.4;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
      ctx.lineTo(x + Math.cos(a - 0.5) * 18, y + Math.sin(a - 0.5) * 18);
      ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
      ctx.lineTo(x + Math.cos(a + 0.45) * 6, y + Math.sin(a + 0.45) * 6); ctx.stroke();
      ctx.restore();
    };

    /* A depth-sorted list. Push {z, draw}, then flush(). */
    V.list = [];
    V.add = (z, draw) => { V.list.push({ z, draw }); };
    V.flush = () => { V.list.sort((a, b) => a.z - b.z); V.list.forEach((it) => it.draw()); V.list.length = 0; };

    return V;
  };

  /* -------------------------------------------------------------------
     Little shared 3D drawing: a lit sphere and a stick, both depth-aware,
     so every instrument's solids look like they belong together.
     ------------------------------------------------------------------- */
  /* Like BL.mix but hands back '#rrggbb', which is what every colour helper
     downstream of it (the sphere shading, the label contrast test) expects. */
  BL.mixHex = function (a, b, t) {
    const x = BL.rgb(a), y = BL.rgb(b);
    return '#' + x.map((v2, i) => Math.round(v2 + (y[i] - v2) * clamp(t, 0, 1)).toString(16).padStart(2, '0')).join('');
  };
  const tint = (col, bg, k) => BL.mix(col, bg, clamp(k, 0, 1));

  /* r is in screen pixels already; q is a projected point. */
  BL.sphere3 = function (ctx, q, r, color, label, o) {
    o = o || {};
    const pal = BL.pal, rr = Math.max(2, r * (0.7 + 0.38 * q.d));
    const col = tint(color, pal.bg, (1 - q.d) * 0.7);
    const gx = q.x - rr * 0.3, gy = q.y - rr * 0.34;
    const g = ctx.createRadialGradient(gx, gy, Math.max(0.5, rr * 0.08), q.x, q.y, rr);
    g.addColorStop(0, BL.mix(col, '#ffffff', 0.45));
    g.addColorStop(0.58, col);
    g.addColorStop(1, BL.mix(col, '#000000', pal.dark ? 0.1 : 0.22));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(q.x, q.y, rr, 0, TAU); ctx.fill();
    if (o.ring) { ctx.lineWidth = Math.max(2.5, rr * 0.22); ctx.strokeStyle = o.ring; ctx.stroke(); }
    else { ctx.lineWidth = 1.2; ctx.strokeStyle = BL.alpha(pal.fg, 0.28); ctx.stroke(); }
    if (label && rr >= 7) {
      ctx.save();
      const hex = col.startsWith('#') ? col : color;
      const lum = (() => { try { const c = BL.rgb(hex.startsWith('#') ? hex : color); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; } catch (e) { return 0.3; } })();
      ctx.font = BL.font(800, rr * (label.length > 1 ? 0.78 : 1.0));
      ctx.fillStyle = lum > 0.56 ? '#0b1412' : '#ffffff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, q.x, q.y + rr * 0.05);
      ctx.restore();
    }
  };

  /* How big a sphere of nominal radius r is drawn at a projected point. */
  BL.sphereR = (q, r) => Math.max(2, r * (0.7 + 0.38 * q.d));

  BL.stick3 = function (ctx, a, b, w, o) {
    o = o || {};
    const pal = BL.pal, d = Math.min(a.d, b.d);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = o.color || BL.alpha(pal.fg, 0.2 + 0.55 * d);
    if (o.dash) ctx.setLineDash(o.dash);
    const order = o.order || 1, W = Math.max(1.5, w * (0.6 + 0.5 * d));
    let dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L;
    /* Start and stop at the surfaces of the two spheres rather than at their
       centres, so a stick never stripes across the front of an atom. ta and tb
       are the two atoms' screen radii. */
    if (o.ta != null || o.tb != null) {
      const ta = Math.min(o.ta || 0, L * 0.45), tb = Math.min(o.tb || 0, L * 0.45);
      const ux = dx / L, uy = dy / L;
      a = { x: a.x + ux * ta, y: a.y + uy * ta }; b = { x: b.x - ux * tb, y: b.y - uy * tb };
    }
    const offs = order >= 3 ? [-W * 0.95, 0, W * 0.95] : order === 2 ? [-W * 0.52, W * 0.52] : [0];
    ctx.lineWidth = order >= 3 ? W * 0.48 : order === 2 ? W * 0.58 : W;
    offs.forEach((k) => { ctx.beginPath(); ctx.moveTo(a.x + px * k, a.y + py * k); ctx.lineTo(b.x + px * k, b.y + py * k); ctx.stroke(); });
    ctx.restore();
  };

  /* Vectors, the same few every 3D instrument wants. */
  const v = (x, y, z) => ({ x, y, z });
  BL.v3 = {
    v, add: (a, b) => v(a.x + b.x, a.y + b.y, a.z + b.z), sub: (a, b) => v(a.x - b.x, a.y - b.y, a.z - b.z),
    mul: (a, k) => v(a.x * k, a.y * k, a.z * k), dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
    cross: (a, b) => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x),
    len: (a) => Math.hypot(a.x, a.y, a.z),
    unit(a) { const L = Math.hypot(a.x, a.y, a.z) || 1e-9; return v(a.x / L, a.y / L, a.z / L); },
    perp(u) { const r = Math.abs(u.x) < 0.9 ? v(1, 0, 0) : v(0, 1, 0); const c = BL.v3.cross(u, r); return BL.v3.unit(c); },
    /* turn p about a unit axis by ang (Rodrigues) */
    spin(p, axis, ang) {
      const c = Math.cos(ang), s = Math.sin(ang), k = BL.v3;
      return k.add(k.add(k.mul(p, c), k.mul(k.cross(axis, p), s)), k.mul(axis, k.dot(axis, p) * (1 - c)));
    },
  };
})();
