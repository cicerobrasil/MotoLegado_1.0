import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Route } from '../types';

export interface RoutePdfOptions {
  pilotName?: string;
  pilotClub?: string;
}

/**
 * Loads an image URL to base64 Data URL using a temporary canvas.
 * Falls back gracefully if CORS prevents direct canvas export.
 */
async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 600;
          canvas.height = img.naturalHeight || img.height || 400;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        } catch {
          // CORS security block on canvas
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Generates a high-quality, professional printable PDF document
 * with all route specifications, metrics, rider tips, and a scannable Google Maps QR Code.
 */
export async function generateRoutePdfDocument(
  route: Route,
  options: RoutePdfOptions = {}
): Promise<{ doc: jsPDF; filename: string; blobUrl: string }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let currentY = margin;

  const pilotName = options.pilotName || 'Piloto Convidado';
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const googleMapsUrl = route.mapsUrl || (
    route.mapsAddress.startsWith('http')
      ? route.mapsAddress
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(route.mapsAddress)}`
  );

  // Generate QR Code for Google Maps navigation
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(googleMapsUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.warn('QR Code generation fallback:', err);
  }

  // Attempt to load route photo
  let routeImageBase64: string | null = null;
  if (route.image) {
    try {
      routeImageBase64 = await getBase64ImageFromUrl(route.image);
    } catch {
      routeImageBase64 = null;
    }
  }

  // Helper for drawing section headers
  const drawSectionHeader = (title: string, yPos: number): number => {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(margin, yPos, contentWidth, 7, 1.5, 1.5, 'F');
    
    // Left decorative bar
    doc.setFillColor(249, 115, 22); // orange-500
    doc.rect(margin, yPos, 2.5, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title.toUpperCase(), margin + 5, yPos + 4.8);

    return yPos + 10;
  };

  // Helper to check and handle page overflows
  const ensureSpace = (neededHeight: number): number => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = margin;
      drawPageBorderAndFooter();
    }
    return currentY;
  };

  // Page numbering and footer
  const drawPageBorderAndFooter = () => {
    const totalPages = (doc as any).internal.getNumberOfPages();
    const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

    // Bottom subtle border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('MOTOTOUR PRO • ROTEIROS DE PILOTAGEM • PILOTE SEMPRE EQUIPADO', margin, pageHeight - 7.5);
    doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - margin, pageHeight - 7.5, { align: 'right' });
  };

  // ==========================================
  // 1. TOP HEADER & BRANDING BANNER
  // ==========================================
  // Header background (dark slate-900)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'F');

  // Orange accent stripe
  doc.setFillColor(249, 115, 22);
  doc.rect(margin, currentY, contentWidth, 2, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('MOTOTOUR PRO', margin + 6, currentY + 11);

  // Subtitle badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(249, 115, 22);
  doc.text('GUIA OFICIAL DE ROTEIRO & ROADBOOK', margin + 6, currentY + 16.5);

  // Metadata on right side of header
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Emissão: ${currentDate}`, pageWidth - margin - 6, currentY + 9.5, { align: 'right' });
  doc.text(`Piloto: ${pilotName}`, pageWidth - margin - 6, currentY + 14.5, { align: 'right' });
  doc.text(`Status: APROVADO PARA PILOTAGEM`, pageWidth - margin - 6, currentY + 19.5, { align: 'right' });

  currentY += 30;

  // ==========================================
  // 2. ROUTE TITLE & ESSENTIAL METRICS BOX
  // ==========================================
  const titleBoxHeight = routeImageBase64 ? 44 : 32;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, titleBoxHeight, 2, 2, 'FD');

  const textStartX = margin + 5;
  const maxTitleWidth = routeImageBase64 ? contentWidth - 65 : contentWidth - 10;

  // Route Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  const routeNameWrapped = doc.splitTextToSize(route.name.toUpperCase(), maxTitleWidth);
  doc.text(routeNameWrapped, textStartX, currentY + 7);

  const titleLinesCount = Array.isArray(routeNameWrapped) ? routeNameWrapped.length : 1;
  const afterTitleY = currentY + 7 + (titleLinesCount * 5);

  // Location / Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const addressWrapped = doc.splitTextToSize(`Destino: ${route.mapsAddress}`, maxTitleWidth);
  doc.text(addressWrapped, textStartX, afterTitleY);

  // Pill Badges: Difficulty & Rating
  const badgeY = afterTitleY + 6.5;

  // Difficulty Pill
  doc.setFillColor(249, 115, 22);
  doc.roundedRect(textStartX, badgeY, 32, 5.5, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`DIFICULDADE: ${route.difficulty.toUpperCase()}`, textStartX + 16, badgeY + 4, { align: 'center' });

  // Rating Pill
  const ratingPillX = textStartX + 35;
  doc.setFillColor(245, 158, 11); // amber-500
  doc.roundedRect(ratingPillX, badgeY, 44, 5.5, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`AVALIAÇÃO: ${route.rating.toFixed(1)} / 5.0 (${route.totalRatingsCount || 0} aval.)`, ratingPillX + 22, badgeY + 4, { align: 'center' });

  // If photo is available, render on right side of title card
  if (routeImageBase64) {
    try {
      const imgWidth = 54;
      const imgHeight = 36;
      const imgX = pageWidth - margin - imgWidth - 4;
      const imgY = currentY + 4;
      doc.addImage(routeImageBase64, 'JPEG', imgX, imgY, imgWidth, imgHeight, undefined, 'FAST');
      // Thin border around image
      doc.setDrawColor(203, 213, 225);
      doc.rect(imgX, imgY, imgWidth, imgHeight, 'D');
    } catch (imgErr) {
      console.warn('Could not embed photo in PDF:', imgErr);
    }
  }

  currentY += titleBoxHeight + 5;

  // ==========================================
  // 3. TECHNICAL SPECIFICATIONS & TRACK RATINGS
  // ==========================================
  currentY = drawSectionHeader('Especificações e Avaliação Técnica da Pista', currentY);

  const metrics = [
    { label: 'Asfalto / Piso', score: route.ratingMetrics.asfalto, desc: 'Qualidade do pavimento e aderência' },
    { label: 'Curvas & Traçado', score: route.ratingMetrics.curvas, desc: 'Raio das curvas e desnível técnico' },
    { label: 'Paisagem & Visual', score: route.ratingMetrics.paisagem, desc: 'Mirantes, beleza cênica e atrativos' },
    { label: 'Segurança na Pista', score: route.ratingMetrics.seguranca, desc: 'Sinalização, acostamento e barreiras' },
    { label: 'Infraestrutura', score: route.ratingMetrics.infraestrutura, desc: 'Postos, oficinas e paradas de apoio' },
  ];

  const colWidth = (contentWidth - 8) / 5;
  const metricBoxHeight = 19;

  metrics.forEach((m, idx) => {
    const boxX = margin + idx * (colWidth + 2);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, currentY, colWidth, metricBoxHeight, 1.5, 1.5, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label.toUpperCase(), boxX + colWidth / 2, currentY + 4.5, { align: 'center' });

    // Score
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(249, 115, 22);
    doc.text(`${m.score.toFixed(1)}`, boxX + colWidth / 2, currentY + 11.5, { align: 'center' });

    // Scale / stars
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('de 5.0 estrelas', boxX + colWidth / 2, currentY + 16, { align: 'center' });
  });

  currentY += metricBoxHeight + 5;

  // ==========================================
  // 4. NAVIGATION & GPS QR CODE BOX
  // ==========================================
  currentY = drawSectionHeader('Navegação e Mapa Interativo (Google Maps)', currentY);

  const navBoxHeight = 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, navBoxHeight, 2, 2, 'FD');

  // Insert QR Code on left
  const qrSize = 30;
  const qrX = margin + 3;
  const qrY = currentY + 3;

  if (qrCodeDataUrl) {
    try {
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      // Border around QR
      doc.setDrawColor(226, 232, 240);
      doc.rect(qrX, qrY, qrSize, qrSize, 'D');
    } catch (e) {
      console.warn('QR Code drawing error:', e);
    }
  }

  // Navigation Instructions beside QR Code
  const navTextX = qrX + qrSize + 5;
  const maxNavWidth = contentWidth - (qrSize + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ESCANEIE COM O CELULAR PARA ABRIR O MAPA & GPS', navTextX, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const navDesc = 'Aponte a câmera do seu smartphone ou aplicativo GPS para o QR Code ao lado para iniciar a navegação curva a curva diretamente no Google Maps.';
  const navDescWrapped = doc.splitTextToSize(navDesc, maxNavWidth);
  doc.text(navDescWrapped, navTextX, currentY + 13);

  // Link / Address representation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(234, 88, 12); // orange-600
  const linkText = `Link direto: ${googleMapsUrl.substring(0, 75)}${googleMapsUrl.length > 75 ? '...' : ''}`;
  doc.text(linkText, navTextX, currentY + 29);

  currentY += navBoxHeight + 5;

  // ==========================================
  // 5. ROUTE DESCRIPTION & HIGHLIGHTS
  // ==========================================
  ensureSpace(35);
  currentY = drawSectionHeader('Descrição do Percurso e Atrativos do Roteiro', currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const descriptionText = route.description || 'Nenhuma descrição adicional informada para este roteiro.';
  const descriptionLines = doc.splitTextToSize(descriptionText, contentWidth - 4);

  // Draw background box for description
  const descHeight = Math.max(16, descriptionLines.length * 4.5 + 6);
  ensureSpace(descHeight);
  
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, descHeight, 1.5, 1.5, 'FD');

  doc.text(descriptionLines, margin + 3, currentY + 5.5);
  currentY += descHeight + 5;

  // ==========================================
  // 6. RIDER TIPS & TECHNICAL INSTRUCTIONS
  // ==========================================
  ensureSpace(35);
  currentY = drawSectionHeader('Dicas Técnicas e Instruções para Pilotos', currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const tipsText = route.riderTips || 
    'Atenção à calibragem dos pneus antes de pegar a estrada. Verifique o nível de combustível antes dos trechos de serra e mantenha distância segura dos demais veículos. Pilote sempre equipado com capacete, jaqueta protetora, luvas e botas.';
  
  const tipsLines = doc.splitTextToSize(tipsText, contentWidth - 4);
  const tipsHeight = Math.max(16, tipsLines.length * 4.5 + 6);
  ensureSpace(tipsHeight);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, tipsHeight, 1.5, 1.5, 'FD');

  doc.text(tipsLines, margin + 3, currentY + 5.5);
  currentY += tipsHeight + 5;

  // Finalize all pages with footers
  const totalPagesCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPagesCount; p++) {
    doc.setPage(p);
    drawPageBorderAndFooter();
  }

  // Generate safe sanitized filename
  const cleanName = route.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  const filename = `Roteiro_${cleanName}_MotoTour.pdf`;

  // Output blob
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return { doc, filename, blobUrl };
}

/**
 * Triggers direct download of the generated PDF file.
 */
export async function downloadRoutePdf(route: Route, options: RoutePdfOptions = {}): Promise<string> {
  const { doc, filename } = await generateRoutePdfDocument(route, options);
  doc.save(filename);
  return filename;
}

/**
 * Triggers the browser print dialog for the generated PDF document.
 */
export async function printRoutePdf(route: Route, options: RoutePdfOptions = {}): Promise<void> {
  const { blobUrl } = await generateRoutePdfDocument(route, options);
  
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;
  
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Fallback: open in new tab if iframe printing blocked
      window.open(blobUrl, '_blank');
    }
    // Cleanup iframe after a delay
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  };
}
