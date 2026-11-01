// Screenshots of index.html at desktop and phone widths, with a terrain hover on desktop.
// Usage: npm install && npm run shot   → PNG files in tools/out/
// If cdnjs is unreachable (sandboxed CI, offline), Three.js is served from node_modules instead.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(__dirname, 'out');
const localThree = path.join(root, 'node_modules/three/build/three.min.js');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [name, w, h] of [['desktop', 1280, 1060], ['phone', 400, 1000]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const logs = [];
    page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
    if (fs.existsSync(localThree)) {
      await page.route('**/three.js/r128/three.min.js', (r) => r.fulfill({ path: localThree, contentType: 'text/javascript' }));
    }
    await page.goto('file://' + path.join(root, 'index.html'));
    await page.waitForTimeout(1500);
    const box = await page.locator('#terrain').boundingBox();
    if (name === 'desktop') {
      await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.6);
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: path.join(out, `${name}.png`), clip: { x: 0, y: box.y - 10, width: w, height: Math.min(h - box.y + 10, box.height + 300) } });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(name, 'horizontal overflow:', overflow, logs.length ? logs.join(' | ') : 'no console messages');
    await page.close();
  }
  await browser.close();
})();
