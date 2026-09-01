// One-off script to compress oversized source images in src/assets/images.
// Resizes to a sane max width for web display and re-encodes at a reasonable
// quality. Run with: node scripts/compress-images.mjs
import sharp from 'sharp';
import { statSync } from 'fs';
import { readFile, writeFile, rename } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'src', 'assets', 'images');

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 78;
const PNG_QUALITY = 78;

const targets = [
  'gal_one.jpg', 'gal_two.jpg', 'gal_three.jpg', 'gal_four.jpg',
  'gal_five.jpg', 'gal_six.jpg', 'gal_sev.jpg', 'gal_eigh.jpg',
  'IMG_0286-1.jpg', 'IMG_0533.jpg', 'collage.png',
];

const fmt = (n) => (n / 1024).toFixed(0) + ' KB';

for (const file of targets) {
  const filePath = path.join(imagesDir, file);
  const before = statSync(filePath).size;
  const inputBuffer = await readFile(filePath);
  const meta = await sharp(inputBuffer).metadata();

  const pipeline = sharp(inputBuffer).resize({
    width: MAX_WIDTH,
    withoutEnlargement: true,
  });

  const ext = path.extname(file).toLowerCase();
  const buffer = ext === '.png'
    ? await pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9 }).toBuffer()
    : await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();

  const tmpPath = filePath + '.tmp';
  await writeFile(tmpPath, buffer);
  await rename(tmpPath, filePath);
  const after = buffer.length;

  console.log(
    `${file}: ${meta.width}x${meta.height} ${fmt(before)} -> ${fmt(after)} ` +
    `(${(100 - (after / before) * 100).toFixed(0)}% smaller)`
  );
}
