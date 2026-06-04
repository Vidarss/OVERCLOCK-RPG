import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ENEMIES_DIR = './public/assets/enemies';
const OUTPUT_SIZE = 512;

function isChromaKeyGreen(r, g, b) {
  // Remove any greenish backgrounds - very aggressive
  // This captures the teal/cyan greens that AI generates
  // (~#3ED68C, ~#5FDAA3, ~#2ECC71, etc.)
  
  // If green is the strongest channel and reasonably bright
  if (g > 150 && g > r && g > b) {
    // And there's a significant gap between green and other channels
    const greenDominance = g - Math.max(r, b);
    if (greenDominance > 30) return true;
  }
  
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
    
    if (isChromaKeyGreen(r, g, b)) {
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
  // Get files from main directory and all subdirectories
  const getAllPngFiles = (dir) => {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(getAllPngFiles(fullPath));
      } else if (item.name.endsWith('.png')) {
        files.push(fullPath);
      }
    }
    return files;
  };

  const files = getAllPngFiles(ENEMIES_DIR);
  
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
