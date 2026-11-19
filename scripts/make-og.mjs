// Renders public/og.png (1200x630) with Playwright: dark background, gold wordmark, headline, brand coin.
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const b64 = (p) => readFileSync(p).toString('base64');
const coin = `data:image/jpeg;base64,${b64('public/coin-face.jpg')}`;
const bg = existsSync('public/bg/hero.jpg') ? `url(data:image/jpeg;base64,${b64('public/bg/hero.jpg')})` : 'none';

const html = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=JetBrains+Mono:wght@500&display=block" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#07070A ${bg} center/cover;position:relative;overflow:hidden;font-family:'Luckiest Guy',sans-serif}
  .dim{position:absolute;inset:0;background:rgba(7,7,10,.66)}
  .wrap{position:absolute;inset:0;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
  .mark{color:#E8B04B;font-size:40px;letter-spacing:.1em}
  h1{color:#F3EEE4;font-size:112px;line-height:.95;font-weight:400;letter-spacing:.01em}
  h1 span{color:#E8B04B;display:block}
  .eyebrow{font-family:'JetBrains Mono',monospace;color:#E8B04B;font-size:20px;letter-spacing:.18em;text-transform:uppercase}
  .coin{position:absolute;right:70px;top:115px;width:400px;height:400px;border-radius:50%;border:16px solid #E8B04B;
        box-shadow:0 0 0 3px #8C6420, inset 0 0 0 3px #8C6420;background:url(${coin}) center/cover}
</style></head><body><div class="dim"></div><div class="coin"></div>
<div class="wrap"><div class="mark">CATCOIN</div><h1>The Dog Era<span>Is Over.</span></h1><div class="eyebrow">No leash. No owner. No apology.</div></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('og.png written');
