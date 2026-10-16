/* Bobbing for Catalase: how fast the paper rises, as a function of how much peroxide there is.

   Pure model, no DOM, so tools/check-bobbing.js can hold it to what the real lab shows.

   The bench lab: a filter-paper disc soaked in yeast (which makes the enzyme catalase) is dropped into
   hydrogen peroxide, and the time for it to rise to the surface is the dependent variable. The enzyme
   turns peroxide into water and oxygen, 2 H2O2 -> 2 H2O + O2; the oxygen collects as bubbles on the
   paper, and when there are enough of them the paper floats up. So time-to-rise is a way of watching a
   reaction rate: more reaction, more bubbles sooner.

   The rate is the usual saturating one, v = Vmax * c / (Km + c): doubling the peroxide helps a lot when
   there is little and hardly at all when the enzyme is already busy, which is the whole point of the
   second half of the chapter's enzyme story (Hurry Up reached the same idea from the other side). The
   time is then
        t = t0 + B / v          t0: the paper has to sink and settle first, B: the oxygen needed to float it
   with a few percent of ordinary scatter on top, because no two bits of paper soak up the same yeast.

   Boiled yeast has no working catalase and the paper never rises, and neither does the plain-water
   control, which has nothing to break down. Those two get Infinity; the instrument stops waiting at a
   cap and calls it "did not rise".

   The numbers are chosen so the four standard cups (a quarter, half, three quarters and all of the 3%
   bottle) come out the way a real tray does: seconds, falling, flattening. They are not measurements. */
(function () {
  'use strict';
  const C = {
    STOCK: 3,            // % hydrogen peroxide in the bottle
    KM: 1.5,             // % at which the enzyme is half as busy as it can get
    T0: 3.5,             // s for the paper to sink and settle
    BV: 8,               // B / Vmax, in seconds: how long Vmax would take to make enough oxygen
    SCATTER: 0.07,       // relative spread between trials
    CAP: 45,             // s the instrument waits before calling it
    CUPS: [
      { id: 'water', name: 'Water', pct: 0, frac: 0 },
      { id: 'c25', name: '25%', pct: 0.75, frac: 0.25 },
      { id: 'c50', name: '50%', pct: 1.5, frac: 0.5 },
      { id: 'c75', name: '75%', pct: 2.25, frac: 0.75 },
      { id: 'c100', name: '100%', pct: 3, frac: 1 },
    ],
  };
  /* how busy the enzyme is, 0..1 */
  C.busy = (pct) => (pct <= 0 ? 0 : pct / (C.KM + pct));
  /* the ideal time for a clean run, or Infinity */
  C.time0 = (pct, boiled) => (pct <= 0 || boiled ? Infinity : C.T0 + C.BV * (C.KM + pct) / pct);
  /* one run, with the scatter a real piece of paper brings. rnd is a function returning a standard normal. */
  C.trial = (pct, boiled, rnd) => { const t = C.time0(pct, boiled); return t === Infinity ? Infinity : t * Math.exp((rnd ? rnd() : 0) * C.SCATTER); };
  /* oxygen bubbles per second at this strength: how fast the reaction is going */
  C.bubbles = (pct, boiled) => (boiled ? 0 : 7 * C.busy(pct));
  (window.BL = window.BL || {}).catalase = C;
})();
