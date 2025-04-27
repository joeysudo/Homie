const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to create an icon
function createIcon(size, color, outputPath) {
  // Create canvas with specified size
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  
  // Draw 'H' letter
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.7)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', size / 2, size / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Created icon: ${outputPath}`);
}

// Create colored icons
createIcon(16, '#88c0d0', 'icons/icon16.png');
createIcon(48, '#88c0d0', 'icons/icon48.png');
createIcon(128, '#88c0d0', 'icons/icon128.png');

// Create greyscale icons
createIcon(16, '#b0b0b0', 'icons/icon16_grey.png');
createIcon(48, '#b0b0b0', 'icons/icon48_grey.png');
createIcon(128, '#b0b0b0', 'icons/icon128_grey.png');

console.log('All icons generated successfully!'); 