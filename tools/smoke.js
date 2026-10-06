// usage: NODE_PATH=<playwright> node tools/smoke.js <theme> [width] [height] [size]. Visits every route, reports errors and overflow, saves screenshots to $BL_OUT
const { chromium } = require('playwright');
const OUT = process.env.BL_OUT || require('os').tmpdir() + '/';
(async () => {
  const [theme = 'dark', w = '1280', hh = '900', size = '0'] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +hh }, hasTouch: +w < 600 });
  await ctx.addInitScript((d) => localStorage.setItem('bondlab.display', JSON.stringify(d)), { theme, size: +size });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/Failed to load/.test(m.text())) errs.push(m.type() + ' ' + m.text()); });
  await page.goto('file://' + require('path').resolve(__dirname, '..') + '/index.html'); await page.waitForTimeout(500);
  const ids = await page.evaluate(() => BL.sims.map((s) => s.id));
  console.log('sims:', ids.join(', '));
  await page.screenshot({ path: OUT + `hub-${theme}-${w}.png`, fullPage: true });
  for (const id of ids) {
    await page.goto('file://' + require('path').resolve(__dirname, '..') + '/index.html#/' + id); await page.waitForTimeout(1500);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    await page.screenshot({ path: OUT + `${id}-${theme}-${w}-${size}.png`, fullPage: true });
    console.log(id.padEnd(10), over ? 'HORIZONTAL OVERFLOW' : 'ok');
  }
  console.log('errors:', errs.join('\n') || 'none'); await b.close();
})();
