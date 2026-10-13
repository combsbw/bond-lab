/* Does a lipid actually make what the chapter says it makes?

   Two Faces claims that two tails under a big head give a sheet, one tail
   gives balls, and no head at all gives a droplet — and the whole point is
   that nothing in the model puts them there. So the model has to earn it.
   If it does not, the instrument is asserting an answer it has not got, and
   that is exactly the kind of thing this lab exists not to do.

   Run: node tools/check-lipid.js */
const L = require('./../js/life/lipid.js');

function settle(opts, steps) {
  const W = L.create(opts);
  for (let i = 0; i < (steps || 16000); i++) L.step(W, 0.008);
  return W;
}

let bad = 0;
const is = (got, want, note) => {
  const ok = got === want;
  if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + String(got).padEnd(10) + (ok ? '' : '(wanted ' + want + ') ') + note);
};

console.log('--- what each shape of molecule makes, over several seeds ---');
for (const [name, opts, want] of [
  ['two tails, big head', { tails: 2, head: true, n: 40 }, 'sheet'],
  ['one tail (soap)', { tails: 1, head: true, n: 36 }, 'micelles'],
  ['three tails, no head', { tails: 3, head: false, n: 20 }, 'droplet'],
]) {
  const got = [];
  for (let seed = 1; seed <= 6; seed++) {
    const W = settle(Object.assign({ seed }, opts));
    got.push(L.shape(W).kind);
  }
  /* A sheet with its two ends tucked round is a closed bag, which is what a
     real bilayer does too and what a cell is, so both count. */
  const hits = got.filter((k) => k === want || (want === 'sheet' && k === 'vesicle')).length;
  is(hits >= 5, true, name + ' -> ' + got.join(', ') + ' (wanted mostly ' + want + ')');
}

console.log('\n--- the tails get out of the water whatever shape it ends up ---');
for (const [name, opts] of [['phospholipid', { tails: 2, head: true, n: 40 }], ['soap', { tails: 1, head: true, n: 36 }], ['fat', { tails: 3, head: false, n: 20 }]]) {
  const W = settle(Object.assign({ seed: 3 }, opts));
  const hid = L.hidden(W);
  is(hid > 0.4, true, name + ' hides its tails (' + hid.toFixed(2) + ')');
}
const loose = L.create({ tails: 2, head: true, n: 40, seed: 3 });
is(L.hidden(loose) < 0.3, true, 'scattered to start with, they are not hidden (' + L.hidden(loose).toFixed(2) + ')');

console.log('\n--- kinked tails cannot pack the way straight ones do ---');
/* The honest claim. This flat model does not reproduce a membrane freezing —
   measured by how far a lipid travels, the kinked one comes out slightly
   slower, which is the wrong way round and not something the instrument
   claims. What it does get right is the mechanism underneath: a bent tail
   cannot lie flat against its neighbour anywhere along its length, so a sheet
   full of them never packs tight. That is the thing that decides whether a fat
   is solid, and it is what the instrument's bar reads. */
const packed = (kink) => {
  let tot = 0;
  for (let seed = 1; seed <= 4; seed++) {
    const W = settle({ tails: 2, head: true, n: 40, seed, kink, T: 300 });
    tot += L.packing(W);
  }
  return tot / 4;
};
const straight = packed(0), kinked = packed(1);
is(straight > kinked * 1.25, true, 'straight tails pack far tighter than kinked ones (' + straight.toFixed(2) + ' vs ' + kinked.toFixed(2) + ')');

console.log('');
console.log(bad ? bad + ' checks failed' : 'all lipid checks passed');
process.exit(bad ? 1 : 0);
