/**
 * Script to generate placeholder animal images
 * Run this once to create the placeholder images in assets/animals/
 * 
 * Usage: node scripts/generatePlaceholderImages.js
 */

const fs = require('fs');
const path = require('path');

// Colors for each animal species (matching SPECIES_COLORS in animalImages.ts)
const SPECIES_COLORS = {
  cattle: '#8B4513',   // Brown
  sheep: '#F5F5DC',    // Beige  
  goat: '#D2691E',     // Chocolate
  pig: '#FFB6C1',      // Light Pink
  chicken: '#FFD700',  // Gold
  duck: '#90EE90',     // Light Green
  turkey: '#CD853F',   // Peru
  horse: '#2F4F4F',    // Dark Slate Gray
  rabbit: '#F5DEB3',   // Wheat
  default: '#808080',  // Gray
};

// Simple 1x1 pixel PNG generator (creates a solid color placeholder)
function createSimplePNG(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // PNG file structure for a 1x1 pixel image
  // This creates a minimal valid PNG that can be scaled
  const width = 100;
  const height = 100;
  
  // Create raw pixel data (RGBA for each pixel, with filter byte at start of each row)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // Filter byte (none)
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b, 255); // RGBA
    }
  }

  // Deflate the raw data (using zlib)
  const zlib = require('zlib');
  const deflated = zlib.deflateSync(Buffer.from(rawData), { level: 9 });

  // CRC32 calculation
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // Build PNG chunks
  const chunks = [];
  
  // PNG signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // Bit depth
  ihdr.writeUInt8(6, 9);  // Color type (RGBA)
  ihdr.writeUInt8(0, 10); // Compression method
  ihdr.writeUInt8(0, 11); // Filter method
  ihdr.writeUInt8(0, 12); // Interlace method
  
  const ihdrType = Buffer.from('IHDR');
  const ihdrLen = Buffer.alloc(4);
  ihdrLen.writeUInt32BE(13, 0);
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(crc32(Buffer.concat([ihdrType, ihdr])), 0);
  chunks.push(ihdrLen, ihdrType, ihdr, ihdrCrc);
  
  // IDAT chunk
  const idatType = Buffer.from('IDAT');
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(deflated.length, 0);
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(Buffer.concat([idatType, deflated])), 0);
  chunks.push(idatLen, idatType, deflated, idatCrc);
  
  // IEND chunk
  const iendType = Buffer.from('IEND');
  const iendLen = Buffer.alloc(4);
  iendLen.writeUInt32BE(0, 0);
  const iendCrc = Buffer.alloc(4);
  iendCrc.writeUInt32BE(crc32(iendType), 0);
  chunks.push(iendLen, iendType, iendCrc);
  
  return Buffer.concat(chunks);
}

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'assets', 'animals');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate placeholder images for each species
console.log('Generating placeholder animal images...\n');

Object.entries(SPECIES_COLORS).forEach(([species, color]) => {
  const filename = `${species}.png`;
  const filepath = path.join(outputDir, filename);
  
  try {
    const pngBuffer = createSimplePNG(color);
    fs.writeFileSync(filepath, pngBuffer);
    console.log(`✓ Created ${filename} (${color})`);
  } catch (error) {
    console.error(`✗ Failed to create ${filename}: ${error.message}`);
  }
});

console.log('\nPlaceholder images generated successfully!');
console.log(`Output directory: ${outputDir}`);

