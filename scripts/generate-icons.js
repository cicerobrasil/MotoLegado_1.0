import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// MotoLegado Official Icon ("M" Brand Logo)
// Dark Navy Blue (#001b3d) background, Salmon Orange (#ff751f) box with bold "M", and "OTOLEGADO" text.
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Fundo Azul Escuro Oficial (#001b3d) -->
  <rect width="512" height="512" rx="96" fill="#001b3d" />

  <!-- Caixa Salmão Oficial (#ff751f) -->
  <rect x="146" y="80" width="220" height="220" rx="44" fill="#ff751f" />
  
  <!-- Letra M em Azul (#001b3d) -->
  <text x="256" y="246" 
        font-family="'Outfit', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-weight="900" font-size="180" fill="#001b3d" text-anchor="middle">M</text>

  <!-- OTO (Branco #ffffff) + LEGADO (Salmão #ff751f) -->
  <text x="256" y="385" 
        font-family="'Outfit', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-weight="900" font-size="56" letter-spacing="-1" text-anchor="middle">
    <tspan fill="#ffffff">OTO</tspan><tspan fill="#ff751f">LEGADO</tspan>
  </text>
</svg>
`;

// Maskable Icon: Full bleed #001b3d background, inner elements scaled inside the 80% safe circle
const svgMaskableContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Fundo Totalmente Preenchido para Máscara Circular/Squircle do Android (Sem corte nos cantos) -->
  <rect width="512" height="512" fill="#001b3d" />

  <!-- Elementos Centrais rigorosamente dentro da Safe Zone (80% central) -->
  <g transform="translate(0, 10)">
    <rect x="166" y="90" width="180" height="180" rx="36" fill="#ff751f" />
    <text x="256" y="226" 
          font-family="'Outfit', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-weight="900" font-size="148" fill="#001b3d" text-anchor="middle">M</text>
    <text x="256" y="340" 
          font-family="'Outfit', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-weight="900" font-size="46" letter-spacing="-1" text-anchor="middle">
      <tspan fill="#ffffff">OTO</tspan><tspan fill="#ff751f">LEGADO</tspan>
    </text>
  </g>
</svg>
`;

// Favicon Especial de Alta Legibilidade (32x32 e abas do navegador)
// Foca no símbolo icônico da marca "M" em destaque central
const svgFaviconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Fundo Azul Escuro Oficial (#001b3d) -->
  <rect width="512" height="512" rx="96" fill="#001b3d" />

  <!-- Caixa Salmão Oficial (#ff751f) -->
  <rect x="76" y="76" width="360" height="360" rx="72" fill="#ff751f" />
  
  <!-- Letra M em Azul (#001b3d) com máxima nitidez e presença -->
  <text x="256" y="348" 
        font-family="'Outfit', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-weight="900" font-size="290" fill="#001b3d" text-anchor="middle">M</text>
</svg>
`;

async function main() {
  const publicDir = path.resolve('public');

  console.log('Generating updated SVG icons...');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), svgMaskableContent, 'utf-8');

  console.log('Rendering PNG icons with sharp...');
  const svgBuffer = Buffer.from(svgContent);
  const maskableBuffer = Buffer.from(svgMaskableContent);
  const faviconBuffer = Buffer.from(svgFaviconContent);

  // 1. Favicon 32x32 (Otimizado para abas do navegador com o símbolo M central de alto contraste)
  await sharp(faviconBuffer).resize(32, 32).png({ quality: 100, compressionLevel: 9 }).toFile(path.join(publicDir, 'favicon-32x32.png'));

  // 2. Apple Touch Icon 180x180 (iOS Home Screen)
  await sharp(svgBuffer).resize(180, 180).png({ quality: 100 }).toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 3. PWA 192x192 (Android e PWA Standard)
  await sharp(svgBuffer).resize(192, 192).png({ quality: 100 }).toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 4. PWA 512x512 (Splash Screen e PWA High-Res)
  await sharp(svgBuffer).resize(512, 512).png({ quality: 100 }).toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 5. PWA Maskable 512x512 (Ícone adaptativo Android dentro da Safe Zone)
  await sharp(maskableBuffer).resize(512, 512).png({ quality: 100 }).toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 6. High-Resolution Brand Assets (1024px e 2048px Ultra HD)
  await sharp(svgBuffer).resize(1024, 1024).png().toFile(path.join(publicDir, 'motolegado-emblema-1024.png'));
  await sharp(svgBuffer).resize(2048, 2048).png().toFile(path.join(publicDir, 'motolegado-emblema-2048.png'));
  await sharp(svgBuffer).resize(1024, 1024).png().toFile(path.join(publicDir, 'motolegado-logo-1024.png'));
  await sharp(svgBuffer).resize(2048, 2048).png().toFile(path.join(publicDir, 'motolegado-logo-2048.png'));

  // 7. Versão Transparente
  const transparentSvg = svgContent.replace(/<rect width="512" height="512"[^>]+>/, '');
  fs.writeFileSync(path.join(publicDir, 'motolegado-emblema-transparente.svg'), transparentSvg, 'utf-8');
  const transparentSvgBuffer = Buffer.from(transparentSvg);

  await sharp(transparentSvgBuffer).resize(1024, 1024).png().toFile(path.join(publicDir, 'motolegado-emblema-transparente-1024.png'));
  await sharp(transparentSvgBuffer).resize(2048, 2048).png().toFile(path.join(publicDir, 'motolegado-emblema-transparente-2048.png'));

  console.log('All brand kit assets and icons generated successfully with the official "M" design!');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
