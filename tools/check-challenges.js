// usage: node tools/check-challenges.js js/quiz.js js/life/quiz.js
// Could a learner who knows no chemistry pick the right answer anyway? Measures the tells that let them:
// the correct option being the longest, the shortest, or the only / most technical-sounding one.
// Chance is 25%. A bank written to the rule in GUIDELINES.md sits well under that for every line; any
// question this lists by id should have its distractors rewritten, not the correct answer shortened.
const fs = require('fs');
function load(file) {
  const out = [];
  global.BL = { quizAdd: (b) => out.push(...b) };
  new Function('BL', fs.readFileSync(file, 'utf8'))(global.BL);
  return out;
}
const TECH = /\b(bond\w*|hydrogen\w*|covalent|molecul\w*|atom\w*|electron\w*|enzyme\w*|protein\w*|polymer\w*|hydroxyl\w*|carboxyl\w*|amine\w*|amino|ester\w*|hydrolys\w*|dehydrat\w*|ion|ions|ionic|polar\w*|charge\w*|acid\w*|alkali\w*|base|bases|oxid\w*|oxygen|carbon|nitrogen|sulfur|phosphate\w*|glucose|sugars?|cellulose|starch|lipid\w*|membrane\w*|nucleotide\w*|chain\w*|ring\w*|receptor\w*|solub\w*|dissolv\w*|react\w*)\b/gi;
for (const f of process.argv.slice(2)) {
  const B = load(f);
  let longest = 0, tech = 0, onlyTech = 0, shortest = 0;
  const detail = [];
  B.forEach((q) => {
    const L = q.choices.map((c) => c.t.length);
    const T = q.choices.map((c) => (c.t.match(TECH) || []).length);
    const i = q.choices.findIndex((c) => c.ok);
    if (L[i] === Math.max(...L)) { longest++; detail.push('LONGEST  ' + q.id); }
    if (L[i] === Math.min(...L) && L.filter((v) => v === L[i]).length === 1 && L[i] < Math.max(...L) - 18) detail.push('SHORTEST ' + q.id);
    if (L[i] === Math.min(...L) && L.filter((v) => v === L[i]).length === 1 && L[i] < Math.max(...L) - 18) shortest++;
    if (T[i] === Math.max(...T) && T.filter((t) => t === T[i]).length === 1) { tech++; detail.push('TECHNICAL ' + q.id); }
    if (T[i] > 0 && T.filter((t) => t > 0).length === 1) { onlyTech++; detail.push('ONLY-TECH ' + q.id); }
  });
  const n = B.length;
  const pc = (x) => x + '/' + n + ' (' + Math.round((x / n) * 100) + '%)';
  console.log('\n' + f + ' — ' + n + ' questions, chance would be 25%');
  console.log('  correct answer is strictly the longest:   ' + pc(longest));
  console.log('  correct answer is strictly the shortest:  ' + pc(shortest));
  console.log('  correct answer is uniquely most technical:' + pc(tech));
  console.log('  correct answer is the only technical one: ' + pc(onlyTech));
  if (detail.length) console.log('  ' + detail.join('\n  '));
}
