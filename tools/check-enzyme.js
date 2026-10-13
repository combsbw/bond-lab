/* Does Hurry Up reproduce the lab it is a model of?

   Chapter 3's bench lab is Fruity Enzymes: gelatin mixed with fresh pineapple
   juice held at three temperatures, then all three chilled. The expected
   result, and the only one worth a learner's time, is three different
   outcomes from one variable:

     juice kept on ice      -> sets    (the enzyme is slowed, not stopped)
     juice at room warmth   -> runny   (the enzyme cuts the chains)
     juice boiled, then cooled -> sets (the enzyme is gone and is not coming back)

   The third tube is the whole point: cold is reversible and hot is not. If the
   model ever stops producing those three, the instrument is teaching the wrong
   lesson and this fails. Run: node tools/check-enzyme.js */

/* Kept in step with js/life/enzyme.js. Change one, change the other. */
const T_ICE = 277, T_ROOM = 294, T_WARM = 320, T_HOT = 358, T_FRAY = 318;
const BENCH = 5;
const act = (T) => Math.exp((T - 278) / 13);
const fray = (T) => (T > T_FRAY ? 0.02 * Math.exp((T - T_FRAY) / 6) : 0);
const sat = (c) => c / (c + 0.35);
const rate = (enz, alive, T, sub) => enz * alive * act(T) * sat(sub) * 0.012 + 0.0004 * act(T) * sat(sub);
const left = (enz, alive, T, sub) => (enz === 0 ? 1 : Math.exp(-rate(enz, alive, T, sub) * BENCH * 8));
const sets = (enz, alive, T, sub) => left(enz, alive, T, sub) > 0.55;

let bad = 0;
const is = (got, want, note) => {
  const ok = got === want;
  if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + String(got).padEnd(6) + (ok ? '' : '(wanted ' + want + ') ') + note);
};

console.log('--- the three tubes, full juice and full gelatin ---');
is(sets(1, 1, T_ICE, 1), true, 'juice on ice: the enzyme is slowed enough that the chains survive');
is(sets(1, 1, T_ROOM, 1), false, 'juice at room warmth: the chains get cut and it never sets');
is(sets(1, 0, T_ROOM, 1), true, 'juice boiled then cooled: no working enzyme left, so it sets');

console.log('\n--- the controls the lab actually uses ---');
is(sets(0, 1, T_ROOM, 1), true, 'no juice at all: plain gelatin sets, which is what gelatin does');
is(sets(1, 1, T_WARM, 1), false, 'warm juice, before it has had time to come apart: still cuts');

console.log('\n--- an enzyme speeds up with heat, then falls off a cliff ---');
let last = 0, rose = 0, peakT = 0, peak = 0;
for (let T = T_ICE; T <= 335; T++) {
  // what one bowl's rate would be after ten seconds held at this temperature
  let alive = 1;
  for (let k = 0; k < 100; k++) alive *= Math.exp(-fray(T) * 0.1);
  const r = rate(1, alive, T, 1);
  if (r > last) rose++;
  if (r > peak) { peak = r; peakT = T; }
  last = r;
}
is(peakT > T_ROOM && peakT < T_FRAY + 8, true, 'the peak lands past room warmth and around where it starts fraying (at ' + (peakT - 273) + ' °C)');
is(rate(1, 1, 335, 1) > rate(1, 1, T_ROOM, 1), true, 'a still-folded enzyme really is faster when hot — the cliff is the unfolding, not the chemistry');

console.log('\n--- unfolding is one-way ---');
let alive = 1;
for (let k = 0; k < 200; k++) alive *= Math.exp(-fray(T_HOT) * 0.05);   // ten seconds at near boiling
is(alive < 0.01, true, 'ten seconds near boiling leaves essentially nothing folded (' + (alive * 100).toFixed(4) + '%)');
is(sets(1, alive, T_ROOM, 1), true, 'and cooling it back down does not bring it back: the tube sets');

console.log('\n--- more substrate stops helping ---');
const r1 = rate(1, 1, T_ROOM, 0.2), r2 = rate(1, 1, T_ROOM, 0.4), r3 = rate(1, 1, T_ROOM, 0.8), r4 = rate(1, 1, T_ROOM, 1.6);
is(r2 / r1 > 1.3, true, 'doubling a small amount of gelatin nearly doubles the rate (×' + (r2 / r1).toFixed(2) + ')');
is(r4 / r3 < 1.2, true, 'doubling a large amount barely moves it (×' + (r4 / r3).toFixed(2) + ') — the enzymes are already busy');

console.log('');
console.log(bad ? bad + ' checks failed' : 'all Hurry Up checks passed');
process.exit(bad ? 1 : 0);
