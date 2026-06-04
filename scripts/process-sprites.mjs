import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ENEMIES_DIR = './public/assets/enemies';
const OUTPUT_SIZE = 512; // Final size
const PURPLE_THRESHOLD = 40; // How close to purple to remove

// Purple backgrounds to remove: #1a0a2e and #0a0a2e
const PURPLE_TARGETS = [
  { r: 26, g: 10, b: 46 },   // #1a0a2e
  { r: 10, g: 10, b: 46 },   // #0a0a2e
  { r: 20, g: 10, b: 40 },   // close variants
  { r: 15, g: 8, b: 35 },
  { r: 25, g: 15, b: 50 },
  { r: 30, g: 15, b: 55 },
  { r: 18, g: 12, b: 42 },
];

function isCloseToBackground(r, g, b) {
  for (const target of PURPLE_TARGETS) {
    const dist = Math.sqrt(
      Math.pow(r - target.r, 2) +
      Math.pow(g - target.g, 2) +
      Math.pow(b - target.b, 2)
    );
    if (dist < PURPLE_THRESHOLD) return true;
  }
  // Also check if it's very dark purple/blue (low R, low G, higher B)
  if (r < 50 && g < 30 && b < 70 && b > g) return true;
  return false;
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
    
    if (isCloseToBackground(r, g, b)) {
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
