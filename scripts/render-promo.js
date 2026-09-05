// Requires an existing Playwright installation and Microsoft Edge; installs nothing.
// See materials/promo/README.md for usage and output sizes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const promo = path.join(root, 'materials/promo');
const assets = [
  ['banner-1-hero.html', 'materials/promo/1-hero.png', 1280, 800],
  ['banner-2-how-it-works.html', 'materials/promo/2-how-it-works.png', 1280, 800],
  ['banner-3-features.html', 'materials/promo/3-features.png', 1280, 800],
  ['promo-tile-440x280.html', 'materials/promo/tile-440x280.png', 440, 280],
  ['marquee-1400x560.html', 'materials/promo/marquee-1400x560.png', 1400, 560],
  ['og-cover-1200x630.html', 'docs/images/og-cover.png', 1200, 630],
];

(async () => {
  fs.mkdirSync(path.join(promo, 'retina'), { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PROMO_BROWSER_PATH || '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  });
  try {
    for (const [source, output, width, height] of assets) {
      for (const scale of [1, 2]) {
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
        try {
          await page.goto(pathToFileURL(path.join(promo, source)).href);
          await page.evaluate(() => document.fonts.ready);
          const issues = await page.evaluate(() => {
            const issues = [];
            for (const img of document.images) {
              if (!img.complete || !img.naturalWidth) issues.push('Missing image: ' + img.src);
            }
            // Inspect actual text rectangles, excluding decorative backgrounds outside the canvas.
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              const node = walker.currentNode;
              if (!node.textContent.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(node);
              for (const rect of range.getClientRects()) {
                if (rect.width && rect.height && (rect.left < -1 || rect.top < -1 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1)) {
                  issues.push('Text outside canvas: ' + node.textContent.trim());
                }
                for (let el = node.parentElement; el; el = el.parentElement) {
                  const style = getComputedStyle(el);
                  const box = el.getBoundingClientRect();
                  if ((['hidden', 'clip'].includes(style.overflowX) && (rect.left < box.left - 1 || rect.right > box.right + 1)) ||
                      (['hidden', 'clip'].includes(style.overflowY) && (rect.top < box.top - 1 || rect.bottom > box.bottom + 1))) {
                    issues.push('Clipped text: ' + node.textContent.trim());
                  }
                }
              }
            }
            return [...new Set(issues)];
          });
          assert.deepEqual(issues, [], source);
          const destination = scale === 1
            ? path.join(root, output)
            : path.join(promo, 'retina', path.basename(output, '.png') + '@2x.png');
          const png = await page.screenshot({ path: destination, animations: 'disabled' });
          assert.equal(png.readUInt32BE(16), width * scale);
          assert.equal(png.readUInt32BE(20), height * scale);
          assert.equal(png[24], 8);
          assert.equal(png[25], 2); // 24-bit RGB, no alpha.
          console.log(`${path.relative(root, destination)}: ${width * scale}x${height * scale}, RGB, text bounds OK`);
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
