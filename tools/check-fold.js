/* Does Fold fold the way a protein does?

   Fold claims nothing is told what shape to be: the order of the beads is the
   only input and the water does the rest. So the model has to earn that. These
   run the 3D chain in Node and check the behaviours the instrument teaches:

     - a real-looking sequence collapses with its greasy beads inside;
     - a chain with nothing greasy in it does not ball up;
     - a chain that is all greasy balls up tighter than any other;
     - heat undoes the shape, and the backbone lets go of itself;
     - two chains that were loose at the same moment fasten to each other,
       and that is still true after they cool.

   Run: node tools/check-fold.js */
const F = require('./../js/life/fold3.js');

const SEQ = {
  real: 'wet,plus,grease,grease,grease,wet,minus,grease,grease,wet,plus,grease,grease,minus,wet,wet',
  greasy: Array(16).fill('grease').join(','),
  wet: Array(16).fill('wet').join(','),
  mid: 'wet,wet,wet,grease,grease,grease,grease,grease,grease,grease,grease,grease,wet,wet,wet,wet',
};
const run = (seq, T, steps, nch, seed) => {
  const W = F.create({ seq: seq.split(','), T, nch: nch || 1, seed: seed || 3 });
  for (let i = 0; i < steps; i++) F.step(W, 0.006);
  return W;
};

let bad = 0;
const is = (ok, note) => { if (!ok) bad++; console.log((ok ? 'ok   ' : 'FAIL ') + note); };
const mean = (a) => a.reduce((t, x) => t + x, 0) / a.length;

console.log('--- a sequence folds, and the greasy beads end up inside ---');
const real = [1, 2, 3].map((seed) => F.levels(run(SEQ.real, 300, 8000, 1, seed)));
is(real.every((l) => l.compact > 0.6), 'a real-looking sequence collapses (compactness ' + real.map((l) => l.compact.toFixed(2)).join(', ') + ')');
is(real.every((l) => l.buried > 0.4), 'with its greasy beads inside (buried ' + real.map((l) => l.buried.toFixed(2)).join(', ') + ')');
const mid = F.levels(run(SEQ.mid, 300, 8000));
is(mid.buried > 0.4, 'greasy-in-the-middle buries the middle (' + mid.buried.toFixed(2) + ')');

console.log('\n--- nothing greasy, nothing to fold round ---');
const wet = F.levels(run(SEQ.wet, 300, 8000));
const greasy = F.levels(run(SEQ.greasy, 300, 8000));
is(wet.compact < 0.2, 'an all water-loving chain stays loose (compactness ' + wet.compact.toFixed(2) + ')');
is(greasy.rg < real[0].rg, 'an all-greasy chain packs tighter than a mixed one (' + greasy.rg.toFixed(2) + ' vs ' + real[0].rg.toFixed(2) + ')');
is(greasy.rg > 0.7, 'but not into a point: the beads still take up room (' + greasy.rg.toFixed(2) + ')');

console.log('\n--- heat undoes it ---');
const hot = F.levels(run(SEQ.real, 378, 8000));
is(hot.rg > mean(real.map((l) => l.rg)) * 1.2, 'a hot chain is looser than a folded one (' + hot.rg.toFixed(2) + ' vs ' + mean(real.map((l) => l.rg)).toFixed(2) + ')');
is(hot.holds === 0, 'and the backbone has let go of itself');
is(real.every((l) => l.holds >= 4), 'where cool it was holding itself in several places (' + real.map((l) => l.holds).join(', ') + ')');

console.log('\n--- cooked, it does not come back ---');
const two = F.create({ seq: SEQ.real.split(','), T: 300, nch: 2, seed: 2 });
for (let i = 0; i < 6000; i++) F.step(two, 0.006);
is(two.links.length === 0, 'two folded chains are separate');
two.T = 378;
for (let i = 0; i < 8000; i++) F.step(two, 0.006);
const linked = two.links.length;
is(linked >= 3, 'loose and hot, they fasten to each other (' + linked + ' places)');
two.T = 300;
for (let i = 0; i < 6000; i++) F.step(two, 0.006);
is(two.links.length === linked, 'and cooled back down, every one is still there (' + two.links.length + ')');

console.log('\n--- a folded chain can be pulled straight, and folds back up ---');
for (const seed of [1, 2, 3]) {
  const W = run(SEQ.real, 300, 8000, 1, seed);
  const before = F.levels(W).rg;
  W.grab = { i: 0, x: W.p[0].x, y: W.p[0].y, z: W.p[0].z };
  for (let i = 0; i < 4000; i++) { W.grab.x = Math.min(7, W.grab.x + 0.004); F.step(W, 0.006); }
  const held = F.levels(W).rg;
  W.grab = null;
  for (let i = 0; i < 8000; i++) F.step(W, 0.006);
  const after = F.levels(W);
  is(held > before * 2.2, 'seed ' + seed + ': pulled out (' + before.toFixed(2) + ' -> ' + held.toFixed(2) + ')');
  is(after.compact > 0.6 && after.buried > 0.4, 'seed ' + seed + ': and let go, it folds back up with its greasy beads inside (' + after.rg.toFixed(2) + ')');
}

console.log('');
console.log(bad ? bad + ' checks failed' : 'all Fold checks passed');
process.exit(bad ? 1 : 0);
