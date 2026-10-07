/* Does Meet predict the right kind of bond?

   This exists because it once did not. An earlier version handed out a flat
   payback to every pair regardless of who was taking the electron, so any atom
   with a low ionization energy could "afford" to give one to anything at all —
   including another alkali metal. The instrument cheerfully drew Na⁺K⁻ and
   called it ionic, which is the single most wrong thing a module about what
   bonds with what could possibly say.

   The fix was to scale the payback by how much harder the taker grips: you
   only get a + ball and a − ball if the electron actually stays put. These
   checks pin that down. Run: node tools/check-meet.js */
const A = require('./../js/atoms.js');

/* Kept in step with js/meet.js. If you change the model there, change it here
   and watch which of the cases below move. */
const PAYBACK = 6.0, CALL = 1.0, GRIP = 1.6;
const pull = (el) => (el.ie + el.ea) / 2;
const nGive = (el) => { const v = A.valenceN(el.Z); return Math.min(2, v <= 3 ? v : 1); };
const nTake = (el) => { const v = A.valenceN(el.Z); return Math.min(2, v >= 5 ? 8 - v : 1); };

function run(giver, taker) {
  const n = Math.min(nGive(giver), nTake(taker));
  const cost = giver.ie + (n >= 2 && giver.ie2 ? giver.ie2 : 0);
  const gap = Math.max(0, pull(taker) - pull(giver));
  return { n, gap, net: n * n * PAYBACK * (1 - Math.exp(-gap / GRIP)) + n * taker.ea - cost };
}
function verdict(x, y) {
  if (x === y) return 'share';
  const a = A.bySym[x], b = A.bySym[y];
  const net = Math.max(run(a, b).net, run(b, a).net);
  return net > CALL ? 'ionic' : net < -CALL ? 'share' : 'close';
}

let bad = 0;
const is = (x, y, want, note) => {
  const got = verdict(x, y);
  const ok = got === want;
  if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + (x + '–' + y).padEnd(8) + got.padEnd(7) + (ok ? '' : '(wanted ' + want + ') ') + note);
};

console.log('--- metals together: never ionic, whatever the ionization energies say ---');
is('Na', 'K', 'share', 'the pair that was being drawn as Na⁺K⁻');
is('K', 'Li', 'share', 'two cheap givers');
is('Na', 'Ca', 'share', 'no pull gap to drive anything');
is('Ca', 'Mg', 'share', 'group 2 with group 2');
is('Al', 'Na', 'share', 'an alloy, not a salt');
is('Na', 'Na', 'share', 'an element with itself');

console.log('\n--- real salts: must still be ionic ---');
is('Na', 'Cl', 'ionic', 'table salt');
is('K', 'Cl', 'ionic', 'a salt substitute');
is('Li', 'F', 'ionic', 'a battery salt');
is('Mg', 'O', 'ionic', 'two electrons at once');
is('Ca', 'Cl', 'ionic', 'road grit');
is('Ca', 'O', 'ionic', 'quicklime');
is('Na', 'O', 'ionic', 'sodium oxide');
is('Mg', 'Cl', 'ionic', 'magnesium chloride');

console.log('\n--- molecules: must still be shared ---');
is('O', 'H', 'share', 'water');
is('C', 'H', 'share', 'methane');
is('N', 'H', 'share', 'ammonia');
is('C', 'O', 'share', 'carbon dioxide');
is('H', 'F', 'share', 'very polar, still molecular');
is('H', 'Cl', 'share', 'hydrogen chloride');
is('S', 'H', 'share', 'hydrogen sulfide');
is('P', 'Cl', 'share', 'phosphorus trichloride');
is('Si', 'O', 'share', 'silica, a covalent network');
is('C', 'C', 'share', 'diamond');

console.log('\n--- genuinely borderline: must land in the middle, not at an end ---');
is('Be', 'F', 'close', 'beryllium fluoride really is in between');
is('Li', 'H', 'close', 'lithium hydride');

console.log('\n--- the whole table: no two metals may ever come out ionic ---');
const EL = A.EL.filter((e) => !['He', 'Ne', 'Ar'].includes(e.sym));
const METALS = ['Li', 'Be', 'Na', 'Mg', 'Al', 'K', 'Ca'];
let pairs = 0, ionic = 0, metalPairs = 0;
for (let i = 0; i < EL.length; i++) {
  for (let j = i + 1; j < EL.length; j++) {
    const x = EL[i].sym, y = EL[j].sym;
    pairs++;
    const v = verdict(x, y);
    if (v !== 'ionic') continue;
    ionic++;
    if (METALS.includes(x) && METALS.includes(y)) {
      console.log('FAIL ' + x + '–' + y + ' two metals, called ionic');
      metalPairs++; bad++;
    }
  }
}
console.log('ok   ' + pairs + ' pairs checked, ' + ionic + ' ionic, ' + metalPairs + ' of them metal+metal');

/* Known misses, stated rather than hidden. Both are small, highly charged
   cations that distort an anion far enough to make the bond covalent —
   Fajans' rules — which measured ionization energies and electron affinities
   cannot see on their own. Two out of 136 pairs, both genuinely borderline. */
console.log('\n--- known misses (reported, not asserted) ---');
['Al,Cl,aluminium chloride is really covalent', 'Si,F,silicon tetrafluoride is really covalent']
  .forEach((row) => { const [x, y, note] = row.split(','); console.log('     ' + (x + '–' + y).padEnd(8) + verdict(x, y).padEnd(7) + note); });

console.log('');
console.log(bad ? bad + ' checks failed' : 'all Meet checks passed');
process.exit(bad ? 1 : 0);
