const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const D = require('./diagrams');
(async () => {
  const out = path.resolve(__dirname, '..', 'diagrams');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 2.5, viewport: { width: 1100, height: 900 } });
  const pg = await ctx.newPage();
  for (const [name, html] of Object.entries(D)) {
    const only = process.argv[2]; if (only && !name.startsWith(only)) continue;
    const f = path.join(out, name + '.html'); fs.writeFileSync(f, html);
    await pg.goto('file://' + f); await pg.waitForTimeout(150);
    const el = await pg.$('#canvas');
    await el.screenshot({ path: path.join(out, name + '.png') });
    console.log('rendered', name);
  }
  await browser.close();
})();
