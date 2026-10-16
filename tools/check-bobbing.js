// usage: node tools/check-bobbing.js
// Bobbing for Catalase's rate model against what the real bench lab shows.
global.window = global; global.BL = {};
new Function('BL', require('fs').readFileSync(__dirname + '/../js/cell/catalase.js', 'utf8')).call(global);
const C = global.BL.catalase;
let bad = 0;
const is = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
// a seeded normal, so a run is repeatable
let seed = 7; const u = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const rnd = () => Math.sqrt(-2 * Math.log(u() + 1e-9)) * Math.cos(6.2832 * u());

console.log('--- the four dilutions of the 3% bottle ---');
const T = C.CUPS.filter((c) => c.pct > 0).map((c) => C.time0(c.pct, false));
console.log('     ideal times (s): ' + T.map((t) => t.toFixed(1)).join(', '));
is(T.every((t, i) => i === 0 || t < T[i - 1]), 'a stronger peroxide always rises sooner');
is(T[0] > T[3] * 1.4, 'the weakest cup is much slower than the strongest (' + (T[0] / T[3]).toFixed(1) + '×)');
is(T.every((t) => t > 8 && t < 60), 'every time is a plausible number of seconds for a bench lab');

console.log('\n--- diminishing returns: the enzyme saturates ---');
const gain1 = T[0] - T[1], gain2 = T[2] - T[3];
is(gain1 > 2 * gain2, 'going from 25% to 50% saves much more time than 75% to 100% (' + gain1.toFixed(1) + ' s against ' + gain2.toFixed(1) + ' s)');
is(C.time0(3, false) > C.time0(1.5, false) / 2, 'doubling the peroxide from 1.5% to 3% does not halve the time (' + C.time0(1.5, false).toFixed(1) + ' -> ' + C.time0(3, false).toFixed(1) + ')');
const speed = (p) => 1 / C.time0(p, false);
is(speed(3) / speed(1.5) < 1.3, 'the speed barely changes up there (×' + (speed(3) / speed(1.5)).toFixed(2) + ' for twice the peroxide)');
is(C.busy(0.1) < 0.1 && C.busy(30) > 0.9, 'the enzyme is idle with almost no peroxide and nearly flat out with a lot');

console.log('\n--- the controls ---');
is(C.time0(0, false) === Infinity, 'in plain water the paper never rises');
is(C.trial(3, true, rnd) === Infinity, 'with boiled yeast it never rises, however strong the peroxide');
is(C.bubbles(3, true) === 0 && C.bubbles(0, false) === 0, 'and neither makes any oxygen');
is(C.bubbles(3, false) > C.bubbles(0.75, false), 'more peroxide, more bubbles');

console.log('\n--- trials scatter a little ---');
const runs = Array.from({ length: 400 }, () => C.trial(3, false, rnd));
const mean = runs.reduce((a, b) => a + b, 0) / runs.length, sd = Math.sqrt(runs.reduce((a, b) => a + (b - mean) ** 2, 0) / runs.length);
is(Math.abs(mean / C.time0(3, false) - 1) < 0.02, 'the average of many runs sits on the ideal time (' + mean.toFixed(1) + ' against ' + C.time0(3, false).toFixed(1) + ')');
is(sd / mean > 0.04 && sd / mean < 0.1, 'trials differ by about ' + (100 * sd / mean).toFixed(0) + '% — close, never identical');
// the order of the cups survives the scatter far more often than not, except between the two strongest
let kept = 0, N = 300; for (let i = 0; i < N; i++) { const a = C.trial(0.75, false, rnd), b = C.trial(1.5, false, rnd); if (a > b) kept++; } 
is(kept / N > 0.9, 'the 25% cup is nearly always slower than the 50% cup (' + (100 * kept / N).toFixed(0) + '% of runs)');
let swap = 0; for (let i = 0; i < N; i++) { const a = C.trial(2.25, false, rnd), b = C.trial(3, false, rnd); if (a < b) swap++; }
is(swap / N > 0.1, 'but the 75% and 100% cups sometimes swap (' + (100 * swap / N).toFixed(0) + '% of runs): near saturation, scatter hides the difference');
console.log(bad ? '\n' + bad + ' failed' : '\nall Bobbing checks passed');
process.exit(bad ? 1 : 0);
