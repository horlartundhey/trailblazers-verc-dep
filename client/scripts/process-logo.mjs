// Processes the raw logo (transparent PNG) into:
//  1. src/assets/images/logo.png — square, white background, padded —
//     used in the Navbar header (rounded via CSS there).
//  2. public/favicon-*.png — same square logo but with rounded corners
//     baked into the pixels (favicons don't get CSS treatment), at the
//     sizes browsers/iOS actually request.
//
// Run with: node scripts/process-logo.mjs <path-to-source-logo.png>
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');

const srcPath = process.argv[2];
if (!srcPath) {
  console.error('Usage: node scripts/process-logo.mjs <path-to-source-logo.png>');
  process.exit(1);
}

const PADDING_RATIO = 0.14; // whitespace around the trimmed mark, as a fraction of canvas size
const CANVAS = 512;

const roundedMask = (size, radius) => Buffer.from(
  `<svg width="${size}" height="${size}"><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
);

async function main() {
  const input = await readFile(srcPath);

  // 1. Trim transparent padding, then flatten onto white.
  const trimmed = await sharp(input).trim().flatten({ background: '#ffffff' }).toBuffer();
  const meta = await sharp(trimmed).metadata();

  const inner = Math.round(CANVAS * (1 - PADDING_RATIO * 2));
  const resized = await sharp(trimmed)
    .resize({ width: inner, height: inner, fit: 'contain', background: '#ffffff' })
    .toBuffer();

  // Pad out to a square white canvas.
  const square = await sharp({
    create: { width: CANVAS, height: CANVAS, channels: 3, background: '#ffffff' },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toBuffer();

  // --- Header logo (square, white bg, no baked-in rounding — CSS handles that) ---
  const headerOut = path.join(clientRoot, 'src', 'assets', 'images', 'logo.png');
  await writeFile(headerOut, square);
  console.log('Wrote', headerOut, `(${CANVAS}x${CANVAS}, from ${meta.width}x${meta.height} trimmed source)`);

  // --- Favicons (rounded corners baked in) ---
  const publicDir = path.join(clientRoot, 'public');
  await mkdir(publicDir, { recursive: true });

  const sizes = [
    { file: 'favicon-32.png', size: 32, radiusRatio: 0.22 },
    { file: 'favicon-192.png', size: 192, radiusRatio: 0.22 },
    { file: 'apple-touch-icon.png', size: 180, radiusRatio: 0 }, // iOS applies its own mask
    { file: 'favicon-512.png', size: 512, radiusRatio: 0.22 },
  ];

  for (const { file, size, radiusRatio } of sizes) {
    let img = sharp(square).resize(size, size);
    if (radiusRatio > 0) {
      const mask = roundedMask(size, Math.round(size * radiusRatio));
      img = img.composite([{ input: mask, blend: 'dest-in' }]).png();
    } else {
      img = img.png();
    }
    const buf = await img.toBuffer();
    await writeFile(path.join(publicDir, file), buf);
    console.log('Wrote', file, `(${size}x${size}${radiusRatio ? ', rounded' : ''})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
