import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ENEMIES_DIR = './public/assets/enemies';
const OUTPUT_SIZE = 512;
const BLACK_THRESHOLD = 30; // How close to black to remove

function isCloseToBlack(r, g, b) {
  // Remove pure black and near-black pixels
  return r < BLACK_THRESHOLD && g < BLACK_THRESHOLD && b < BLACK_THRESHOLD;
}

async function processImage(filePath) {
  console.log(`Processing: ${filePath}`);
  
  const image = sharp(filePath);
  const metadata = await image.metadata();
  
  // Get raw pixel data
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Process pixels - remove purple background
  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    if (isCloseToBlack(r, g, b)) {
      pixels[i + 3] = 0; // Set alpha to 0 (transparent)
    }
  }
  
  // Create new image with transparent background, resize to OUTPUT_SIZE
  await sharp(pixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(filePath + '.tmp');
  
  // Replace original
  fs.renameSync(filePath + '.tmp', filePath);
  console.log(`Done: ${filePath}`);
}

async function main() {
  const files = fs.readdirSync(ENEMIES_DIR)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(ENEMIES_DIR, f));
  
  console.log(`Found ${files.length} images to process`);
  
  for (const file of files) {
    try {
      await processImage(file);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }
  
  console.log('All done!');
}

main();
