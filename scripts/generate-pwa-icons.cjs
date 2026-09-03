const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const publicDir = path.resolve(__dirname, '../public');
  const iconSvgPath = path.join(publicDir, 'icon.svg');
  const iconMaskableSvgPath = path.join(publicDir, 'icon-maskable.svg');

  const svgBuffer = fs.readFileSync(iconSvgPath);
  const maskableSvgBuffer = fs.readFileSync(iconMaskableSvgPath);

  console.log('Generating PWA Icons...');

  // 1. pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created pwa-192x192.png');

  // 2. pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created pwa-512x512.png');

  // 3. pwa-maskable-512x512.png
  await sharp(maskableSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created pwa-maskable-512x512.png');

  // 4. apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // 5. favicon-32x32.png
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✓ Created favicon-32x32.png');

  console.log('All PWA assets generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
