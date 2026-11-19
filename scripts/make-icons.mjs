// Builds favicon + apple-touch-icon from the brand logo (circular crop of the coin).
import sharp from 'sharp';

const src = 'brand/catcoin-logo.jpg';
const cx = 586, cy = 666, r = 552;
const crop = await sharp(src)
  .extract({ left: cx - r, top: cy - r, width: r * 2, height: r * 2 })
  .toBuffer();
const mask = Buffer.from(`<svg width="${r * 2}" height="${r * 2}"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`);
const round = await sharp(crop).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
await sharp(round).resize(64, 64).png().toFile('public/favicon.png');
// apple-touch-icon: opaque background
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#07070A' } })
  .composite([{ input: await sharp(round).resize(164, 164).toBuffer(), left: 8, top: 8 }])
  .png()
  .toFile('public/apple-touch-icon.png');
console.log('icons written');

// Coin face texture for the 3D CatCoin (inner artwork, without the outer olive ring).
const fr = 515;
await sharp(src)
  .extract({ left: cx - fr, top: cy - fr, width: fr * 2, height: fr * 2 })
  .resize(1024, 1024)
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/coin-face.jpg');
console.log('coin face written');
