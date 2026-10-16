// usage: node tools/check-cell.js
// The Cell Lab's table of structures against the chapter's own chart ("Where does it live?"), and the
// chapter's master boundary: membrane-bound rooms are what eukaryotes have and bacteria do not.
global.window = global; global.BL = {};
new Function('BL', require('fs').readFileSync(__dirname + '/../js/cell/kit.js', 'utf8')).call(global, global.BL);
const K = global.BL.cell;
let bad = 0;
const is = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };

console.log('--- the table says what the chapter\'s chart says ---');
// [structure id, animal, plant, bacteria], copied from the one-page chart in Chapter 4's reference sheet
const CHART = [
  ['wall', 0, 1, 1], ['membrane', 1, 1, 1], ['cytoplasm', 1, 1, 1], ['mito', 1, 1, 0], ['ribosome', 1, 1, 1], ['er', 1, 1, 0], ['golgi', 1, 1, 0],
  ['lysosome', 1, 0, 0], ['peroxisome', 1, 1, 0], ['vacuole', 1, 1, 0], ['centrosome', 1, 0, 0], ['nucleus', 1, 1, 0], ['dna', 1, 1, 1],
  ['capsule', 0, 0, 1], ['pili', 0, 0, 1], ['cilia', 1, 0, 0], ['flagella', 1, 1, 1], ['nucleoid', 0, 0, 1], ['plasmid', 0, 1, 1],
];
CHART.forEach(([id, a, p, b]) => {
  const s = K.struct(id);
  is(s && s.animal === a && s.plant === p && s.bact === b, id + ' — animal ' + a + ', plant ' + p + ', bacterium ' + b);
});
is(CHART.length === 19, 'all 19 chart rows are checked');

console.log('\n--- the six jobs ---');
const byFn = {}; K.STRUCTS.forEach((s) => { (byFn[s.fn] = byFn[s.fn] || []).push(s.id); });
K.FN.forEach((f) => is((byFn[f.id] || []).length > 0, f.name + ': ' + (byFn[f.id] || []).join(', ')));
// the function table in the chapter's framework
const TABLE = { struct: ['membrane', 'cytoskeleton', 'wall'], energy: ['mito', 'chloro'], protein: ['ribosome', 'er', 'golgi'], store: ['lysosome', 'peroxisome', 'vacuole'], divide: ['centrosome'], genetic: ['nucleus', 'nucleoid', 'plasmid'] };
Object.keys(TABLE).forEach((f) => is(TABLE[f].every((id) => K.struct(id).fn === f), 'the chapter files ' + TABLE[f].join(', ') + ' under ' + f));
is(K.STRUCTS.every((s) => K.fn(s.fn)), 'every structure has a real job');

console.log('\n--- the master boundary ---');
const rooms = K.STRUCTS.filter((s) => s.kind === 'room');
is(rooms.length >= 8, rooms.length + ' rooms: ' + rooms.map((s) => s.id).join(', '));
is(rooms.every((s) => s.bact === 0), 'every room is missing from a bacterium — the rule predicts the chart');
is(K.STRUCTS.filter((s) => s.bact === 1).every((s) => s.kind !== 'room'), 'everything a bacterium does have is not a room');
is(K.rooms('bact').length === 0, 'a bacterium has no rooms at all');
is(K.rooms('animal').length > K.rooms('plant').length - 1 && K.rooms('plant').length >= 7, 'animals and plants both have most of the rooms (' + K.rooms('animal').length + ' and ' + K.rooms('plant').length + ')');
// the rule runs one way. Say where the other way fails, because that is worth teaching and is not in the chapter
const euOnlyNotRoom = K.STRUCTS.filter((s) => s.bact === 0 && s.kind !== 'room' && s.kind !== 'boundary' && (s.animal || s.plant));
console.log('     eukaryote-only things that are NOT rooms (the rule does not run backwards): ' + euOnlyNotRoom.map((s) => s.id).join(', '));
is(euOnlyNotRoom.some((s) => s.id === 'centrosome'), 'the centrosome is eukaryote-only but has no membrane of its own — the chapter\'s sheet calls it membrane-bound; it is not');

console.log('\n--- the layouts ---');
['animal', 'plant', 'bact'].forEach((t) => {
  const L = K.layout(t), want = K.STRUCTS.filter((s) => s[t]).map((s) => s.id);
  const drawn = new Set(L.map((i) => i.s));
  const bad2 = [...drawn].filter((id) => !K.struct(id) || !K.struct(id)[t]);
  is(bad2.length === 0, t + ': nothing is drawn that this cell should not have' + (bad2.length ? ' (' + bad2.join(', ') + ')' : ''));
  is(L.every((i) => i.p && isFinite(i.p.x + i.p.y + i.p.z)), t + ': every placed thing has a position');
});
is(!K.layout('bact').some((i) => K.struct(i.s).kind === 'room'), 'the bacterium is drawn with no rooms in it');
is(K.layout('plant').some((i) => i.s === 'vacuole' && i.big), 'the plant has the one big central vacuole');
is(JSON.stringify(K.layout('animal')) === JSON.stringify(K.layout('animal')), 'a cell is the same cell every time');

console.log(bad ? '\n' + bad + ' failed' : '\nall Cell checks passed');
process.exit(bad ? 1 : 0);
