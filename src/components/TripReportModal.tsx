import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  FileDown, 
  Printer, 
  Share2, 
  Check, 
  Compass, 
  Calendar, 
  Route, 
  Star, 
  Sparkles, 
  Bike, 
  ShieldCheck, 
  Clock, 
  ChevronDown,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  CheckSquare,
  MapPin,
  Camera,
  Fuel,
  UtensilsCrossed,
  Bed,
  Layers,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import { LogEntry } from './Logbook';
import { TripStage } from './TripStagesManager';
import { cn } from '../lib/utils';

export interface TripReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  pilotName: string;
  pilotClub?: string;
  pilotMotorcycle?: string;
  pilotId?: string;
  initialSelectedTripId?: string;
  exclusiveTripMode?: boolean; // Se true, abre tela exclusiva com apenas a viagem selecionada
  onOpenAllTrips?: () => void; // Ação para ir à página Diário & Checklist para ver todas
}

const STAGE_LABELS: Record<string, string> = {
  scenic: 'Mirante / Ponto Turístico',
  fuel: 'Abastecimento Estratégico',
  food: 'Almoço / Gastronomia',
  sleep: 'Pernoite / Hotel',
  meet: 'Ponto de Encontro',
  service: 'Oficina / Apoio',
  custom: 'Parada Programada'
};

// Helper universal e resiliente para disparo de downloads no navegador
function triggerDownload(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
    return;
  } catch (e1) {
    console.warn('createObjectURL download failed, trying FileReader:', e1);
  }

  try {
    const reader = new FileReader();
    reader.onload = () => {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = reader.result as string;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1500);
    };
    reader.readAsDataURL(blob);
  } catch (e2) {
    console.error('All download methods failed:', e2);
  }
}

// Sanitização de texto para garantir compatibilidade com fontes padrão do jsPDF
function cleanPdfText(str?: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos combinados para compatibilidade estrita
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim();
}

export function TripReportModal({
  isOpen,
  onClose,
  logs,
  pilotName,
  pilotClub,
  pilotMotorcycle,
  pilotId,
  initialSelectedTripId,
  exclusiveTripMode,
  onOpenAllTrips,
}: TripReportModalProps) {
  const [dateFilter, setDateFilter] = useState<'all' | 'year' | '6months' | '30days'>('all');
  const [selectedTripId, setSelectedTripId] = useState<string>('all');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedCSV, setCopiedCSV] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sincroniza se o usuário abriu o modal a partir de um card específico
  useEffect(() => {
    if (initialSelectedTripId) {
      setSelectedTripId(initialSelectedTripId);
    } else if (exclusiveTripMode && logs.length > 0) {
      setSelectedTripId(logs[0].id);
    } else {
      setSelectedTripId('all');
    }
  }, [initialSelectedTripId, isOpen, exclusiveTripMode, logs]);

  // Filtrar logs de acordo com o período selecionado
  const filteredByDateLogs = useMemo(() => {
    if (dateFilter === 'all') return logs;
    const now = new Date();
    return logs.filter((log) => {
      if (!log.date) return true;
      const logDate = new Date(log.date);
      if (isNaN(logDate.getTime())) return true;
      const diffMs = now.getTime() - logDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (dateFilter === '30days') return diffDays <= 30;
      if (dateFilter === '6months') return diffDays <= 180;
      if (dateFilter === 'year') return logDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [logs, dateFilter]);

  // Logs a serem exibidos e exportados (todos ou roteiro individual selecionado)
  const displayLogs = useMemo(() => {
    if (selectedTripId !== 'all') {
      const found = logs.find(l => l.id === selectedTripId);
      if (found) return [found];
    }
    return filteredByDateLogs;
  }, [logs, filteredByDateLogs, selectedTripId]);

  // Cálculos de Telemetria
  const metrics = useMemo(() => {
    let totalKm = 0;
    let maxKm = 0;
    let longestTripTitle = '';
    let totalRating = 0;
    let totalCompletedStages = 0;

    displayLogs.forEach((log) => {
      const km = parseFloat(String(log.distance).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      totalKm += km;
      if (km > maxKm) {
        maxKm = km;
        longestTripTitle = `${log.origin || 'Origem'} → ${log.destination || 'Destino'}`;
      }
      totalRating += log.rating || 5;
      if (log.stages && log.stages.length > 0) {
        totalCompletedStages += log.stages.length;
      }
    });

    const avgKm = displayLogs.length > 0 ? Math.round(totalKm / displayLogs.length) : 0;
    const avgRating = displayLogs.length > 0 ? (totalRating / displayLogs.length).toFixed(1) : '5.0';

    return {
      totalKm: Math.round(totalKm),
      totalTrips: displayLogs.length,
      avgKm,
      maxKm: Math.round(maxKm),
      longestTripTitle: longestTripTitle || 'N/A',
      avgRating,
      totalCompletedStages
    };
  }, [displayLogs]);

  const reportId = useMemo(() => {
    return `ML-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }, []);

  const issueDate = useMemo(() => {
    return new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // 1. Exportação para Planilha CSV com download automático
  const handleExportCSV = () => {
    setIsGenerating(true);
    setStatusMessage({ text: 'Gerando e baixando planilha CSV...', type: 'info' });

    try {
      const headers = [
        'Data',
        'Título do Roteiro',
        'Origem',
        'Destino',
        'Distância (KM)',
        'Duração Estimada',
        'Motocicleta',
        'Período',
        'Condição do Asfalto',
        'Clima',
        'Avaliação (1-5)',
        'Total de Etapas Concluídas',
        'Detalhamento das Etapas',
        'Notas e Diário'
      ];

      const rows = displayLogs.length > 0 
        ? displayLogs.map((log) => {
            const stagesSummary = (log.stages || [])
              .map((st, i) => `${i + 1}. [OK] ${st.name} (${STAGE_LABELS[st.type] || st.type}${st.kmMark ? ` - KM ${st.kmMark}` : ''})`)
              .join(' | ');

            const periodLabel = (log as any).period === 'night' ? 'De noite' : ((log as any).period === 'all_day' ? 'O dia todo' : 'De dia');
            const climateLabel = Array.isArray((log as any).climates) && (log as any).climates.length > 0
              ? (log as any).climates.join(', ')
              : (log.climate || 'Sol');

            return [
              `"${log.date || ''}"`,
              `"${(log.title || '').replace(/"/g, '""')}"`,
              `"${(log.origin || '').replace(/"/g, '""')}"`,
              `"${(log.destination || '').replace(/"/g, '""')}"`,
              `"${String(log.distance || 0).replace(/"/g, '""')}"`,
              `"${(log.duration || '').replace(/"/g, '""')}"`,
              `"${(log.bike || pilotMotorcycle || '').replace(/"/g, '""')}"`,
              `"${periodLabel}"`,
              `"${(log.road || '').replace(/"/g, '""')}"`,
              `"${climateLabel.replace(/"/g, '""')}"`,
              `"${log.rating || 5}"`,
              `"${log.stages?.length || 0}"`,
              `"${stagesSummary.replace(/"/g, '""')}"`,
              `"${(log.content || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
            ];
          })
        : [[
            `"${new Date().toISOString().slice(0, 10)}"`,
            `"Exemplo: Roteiro Serra do Rio do Rastro"`,
            `"Florianópolis"`,
            `"Bom Jardim da Serra"`,
            `"230"`,
            `"4h 30min"`,
            `"${(pilotMotorcycle || 'Moto Cadastrada').replace(/"/g, '""')}"`,
            `"Tapete"`,
            `"Ensolarado"`,
            `"5"`,
            `"2"`,
            `"1. [OK] Mirante Serra (Mirante) | 2. [OK] Posto Cascata (Abastecimento)"`,
            `"Roteiro oficial MotoLegado emitido"`
          ]];

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const safeName = (pilotName || 'Piloto').toLowerCase().replace(/\s+/g, '_');
      const today = new Date().toISOString().slice(0, 10);
      const filename = `MotoLegado_Diario_Roteiros_${safeName}_${today}.csv`;

      triggerDownload(blob, filename);

      setStatusMessage({ 
        text: `Arquivo "${filename}" baixado com sucesso!`, 
        type: 'success' 
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Erro na exportação CSV:', err);
      setStatusMessage({ text: 'Falha ao baixar CSV. Tente gerar em PDF ou imprimir.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Geração e Download do Arquivo PDF (.pdf) com jsPDF
  const handleGeneratePDF = () => {
    setIsGenerating(true);
    setStatusMessage({ text: 'Compilando e gerando arquivo PDF com roteiros e etapas...', type: 'info' });

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Top Header Brand Bar (Dark Slate 900 / Orange 600)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 26, 'F');

      doc.setFillColor(234, 88, 12); // orange-600
      doc.rect(0, 24, pageWidth, 2, 'F');

      // Brand Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('MOTOLEGADO', 14, 12);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text('DIARIO DE BORDO OFICIAL · ROTEIROS E ETAPAS CONCLUIDAS', 14, 18);

      // Report ID & Date
      doc.setFontSize(8);
      doc.setFont('courier', 'bold');
      doc.setTextColor(251, 146, 60); // orange-400
      doc.text(`ID: ${reportId}`, pageWidth - 14, 11, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Emissao: ${issueDate}`, pageWidth - 14, 17, { align: 'right' });

      // Title Section
      let y = 35;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      
      const isSingleMode = selectedTripId !== 'all';
      doc.text(
        isSingleMode 
          ? 'DOSSIE DE ROTEIRO & ETAPAS CONCLUIDAS' 
          : 'DOSSIE DO DIARIO DE BORDO & HISTORICO DE ROTEIROS', 
        14, 
        y
      );

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Relatorio oficial com historico de quilometragem, rotas percorridas e pontos de parada certificados.', 
        14, 
        y
      );

      // Pilot Credentials Box
      y += 6;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('PILOTO:', 18, y + 5.5);
      doc.text('MOTO CLUBE:', 78, y + 5.5);
      doc.text('MOTOCICLETA:', 138, y + 5.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(cleanPdfText(pilotName || 'Piloto MotoLegado'), 18, y + 12);

      doc.setTextColor(217, 119, 6); // amber-600
      doc.text(cleanPdfText(pilotClub || 'Piloto Independente'), 78, y + 12);

      doc.setTextColor(15, 23, 42);
      doc.text(cleanPdfText(pilotMotorcycle || 'Moto Cadastrada'), 138, y + 12);

      // Telemetry Metrics Grid (4 cards)
      y += 22;
      const cardWidth = (pageWidth - 28 - 9) / 4;
      const stats = [
        { label: 'KM TOTAL', val: `${metrics.totalKm.toLocaleString()} KM`, color: [234, 88, 12] },
        { label: 'ROTEIROS', val: `${metrics.totalTrips}`, color: [15, 23, 42] },
        { label: 'ETAPAS CONCLUIDAS', val: `${metrics.totalCompletedStages}`, color: [16, 185, 129] },
        { label: 'NOTA MEDIA', val: `${metrics.avgRating} / 5.0`, color: [217, 119, 6] },
      ];

      stats.forEach((st, idx) => {
        const cx = 14 + idx * (cardWidth + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cx, y, cardWidth, 14, 2, 2, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(st.label, cx + 3, y + 4.5);

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(st.color[0], st.color[1], st.color[2]);
        doc.text(st.val, cx + 3, y + 10.5);
      });

      // Section Title: Roteiros e Etapas
      y += 18;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`REGISTRO DE ROTEIROS E ETAPAS CONCLUIDAS (${displayLogs.length})`, 14, y);

      y += 4;

      if (displayLogs.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum roteiro registrado no periodo selecionado.', 18, y + 8);
        y += 16;
      } else {
        displayLogs.forEach((log, index) => {
          // Previsão de altura necessária para o card do roteiro + etapas
          const stagesCount = log.stages?.length || 0;
          const estimatedHeight = 24 + (stagesCount > 0 ? 8 + stagesCount * 5 : 0);

          if (y + estimatedHeight > pageHeight - 20) {
            doc.addPage();
            y = 16;
          }

          // Header do Roteiro (Faixa escura)
          doc.setFillColor(15, 23, 42);
          doc.roundedRect(14, y, pageWidth - 28, 7, 1, 1, 'F');

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          const safeDate = log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '—';
          doc.text(`[${safeDate}] ${cleanPdfText(log.title || 'ROTEIRO')}`, 17, y + 5);

          doc.setFont('courier', 'bold');
          doc.setTextColor(251, 146, 60);
          const distStr = log.distance ? `${log.distance} KM` : '—';
          doc.text(distStr, pageWidth - 18, y + 5, { align: 'right' });

          y += 7;

          // Trajeto e Detalhes Técnicos
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);

          const contentHeight = stagesCount > 0 ? 10 + stagesCount * 5.2 : 12;
          doc.rect(14, y, pageWidth - 28, contentHeight, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);
          const safeOrigin = cleanPdfText(log.origin || 'Partida');
          const safeDest = cleanPdfText(log.destination || 'Chegada');
          doc.text(`Trajeto: ${safeOrigin} -> ${safeDest}`, 17, y + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          const roadClean = cleanPdfText(log.road || 'Normal');
          const periodPdf = cleanPdfText((log as any).period === 'night' ? 'De noite' : ((log as any).period === 'all_day' ? 'O dia todo' : 'De dia'));
          const climatePdf = cleanPdfText(Array.isArray((log as any).climates) && (log as any).climates.length > 0 ? (log as any).climates.join(', ') : (log.climate || 'Sol'));
          doc.text(`Estrada: ${roadClean} | Periodo: ${periodPdf} | Clima: ${climatePdf} | Avaliacao: ${log.rating || 5}/5.0`, 17, y + 8.5);

          // Renderização das Etapas Concluídas (Stages)
          if (stagesCount > 0) {
            let stageY = y + 13;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(234, 88, 12); // orange-600
            doc.text(`ETAPAS & PONTOS DE PARADA CONCLUIDOS (${stagesCount}):`, 17, stageY);

            stageY += 4;
            log.stages!.forEach((st, sidx) => {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(6.5);
              doc.setTextColor(16, 185, 129); // emerald
              doc.text(`[OK]`, 18, stageY);

              doc.setFont('helvetica', 'normal');
              doc.setTextColor(30, 41, 59);
              const stageTypeLabel = cleanPdfText(STAGE_LABELS[st.type] || st.type);
              const stageName = cleanPdfText(st.name || 'Parada');
              const kmPart = st.kmMark ? ` - KM ${cleanPdfText(st.kmMark)}` : '';
              const notesPart = st.notes ? ` (${cleanPdfText(st.notes)})` : '';

              doc.text(`Etapa ${sidx + 1}: ${stageName} [${stageTypeLabel}]${kmPart}${notesPart}`, 25, stageY);
              stageY += 4.5;
            });

            y += contentHeight + 4;
          } else {
            y += contentHeight + 4;
          }
        });
      }

      // Rodapé oficial em todas as páginas
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240);
        doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Documento emitido via Diario de Bordo MotoLegado · Autenticacao: ${reportId}`, 14, pageHeight - 6);
        doc.text(`Pagina ${p} de ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
      }

      const safeName = (pilotName || 'Piloto').toLowerCase().replace(/\s+/g, '_');
      const today = new Date().toISOString().slice(0, 10);
      const filename = `MotoLegado_Diario_Roteiros_${safeName}_${today}.pdf`;

      // Download do PDF
      doc.save(filename);

      setStatusMessage({ 
        text: `Arquivo "${filename}" gerado e baixado com sucesso!`, 
        type: 'success' 
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Erro ao gerar PDF com jsPDF:', err);
      // Tentativa de fallback via window.print() se falhar
      try {
        window.print();
        setStatusMessage({ text: 'Menu de impressão aberto para salvar como PDF.', type: 'info' });
      } catch (printErr) {
        setStatusMessage({ text: 'Falha ao gerar PDF. Baixe a planilha CSV como alternativa.', type: 'error' });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Impressão direta pelo navegador (permite Salvar como PDF nativo de alta resolução)
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error('Erro ao disparar impressão:', e);
      setStatusMessage({ text: 'Use o botão "BAIXAR PDF" para obter o arquivo.', type: 'info' });
    }
  };

  // 4. Compartilhamento Rápido no WhatsApp
  const handleShareWhatsApp = () => {
    const text = 
      `🏍️ *RELATÓRIO DO DIÁRIO DE BORDO - MOTOLEGADO*\n` +
      `👤 *Piloto:* ${pilotName || 'Piloto'}\n` +
      `🛡️ *Moto Clube:* ${pilotClub || 'Independente'}\n` +
      `🔥 *Máquina:* ${pilotMotorcycle || 'Moto Cadastrada'}\n\n` +
      `📊 *Resumo de Telemetria:*\n` +
      `🛣️ *Quilometragem Acumulada:* ${metrics.totalKm.toLocaleString()} KM\n` +
      `📍 *Roteiros Concluídos:* ${metrics.totalTrips}\n` +
      `🏁 *Etapas e Paradas Certificadas:* ${metrics.totalCompletedStages}\n` +
      `⭐ *Avaliação Média:* ${metrics.avgRating}/5.0\n\n` +
      `_Emitido via Diário de Bordo Oficial MotoLegado_`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    }

    try {
      const encoded = encodeURIComponent(text);
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    } catch (e) {
      // Ignora bloqueio de popup
    }
  };

  // 5. Copiar Tabela em Texto para Área de Transferência
  const handleCopyClipboard = () => {
    const lines = [
      `RELATÓRIO DO DIÁRIO DE BORDO MOTOLEGADO - ${pilotName || 'PILOTO'}`,
      `Quilometragem Total: ${metrics.totalKm.toLocaleString()} KM | Roteiros: ${metrics.totalTrips} | Etapas Concluídas: ${metrics.totalCompletedStages}`,
      `----------------------------------------------------------------`,
      ...displayLogs.map(l => {
        const stStr = l.stages && l.stages.length > 0 ? ` [${l.stages.length} etapas]` : '';
        return `${l.date || '—'} | ${l.title || 'Sem título'} | ${l.origin || ''} -> ${l.destination || ''} | ${l.distance || 0} KM${stStr}`;
      }),
    ];
    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n'));
      setCopiedCSV(true);
      setTimeout(() => setCopiedCSV(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
        
        {/* Print Stylesheet for Browser Printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-report, #printable-report * {
              visibility: visible !important;
            }
            #printable-report {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              background: #ffffff !important;
              color: #0f172a !important;
              border: none !important;
              box-shadow: none !important;
            }
            .no-print {
              display: none !important;
            }
            .print-table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-top: 15px !important;
            }
            .print-table th, .print-table td {
              border: 1px solid #cbd5e1 !important;
              padding: 8px 10px !important;
              font-size: 11px !important;
              color: #0f172a !important;
            }
            .print-table th {
              background-color: #f1f5f9 !important;
              font-weight: bold !important;
              text-transform: uppercase !important;
            }
            .print-card {
              border: 1px solid #cbd5e1 !important;
              background-color: #f8fafc !important;
              color: #0f172a !important;
              padding: 10px !important;
              border-radius: 8px !important;
            }
            .print-text-dark {
              color: #0f172a !important;
            }
            .print-text-muted {
              color: #64748b !important;
            }
            .print-badge {
              border: 1px solid #cbd5e1 !important;
              background-color: #f1f5f9 !important;
              color: #0f172a !important;
            }
          }
        ` }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar / Header */}
          <div className="no-print p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                <FileDown size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black italic uppercase text-white tracking-tight">
                    {exclusiveTripMode ? 'VISUALIZAR ROTEIRO COMPLETO' : 'EXPORTAR DIÁRIO DE BORDO'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase tracking-wider font-mono">
                    {exclusiveTripMode ? 'VIAGEM SELECIONADA' : 'PDF & Impressão'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {exclusiveTripMode 
                    ? 'Exibição detalhada e exclusiva da viagem selecionada com telemetria, paradas e provas documentais.'
                    : 'Salve seus roteiros e etapas concluídas em formato PDF para impressão física ou arquivamento digital.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {exclusiveTripMode && onOpenAllTrips && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAllTrips();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/40 text-orange-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Abrir página Diário & Checklist para ver todas as viagens"
                >
                  <BookOpen size={13} />
                  <span className="hidden sm:inline">Ver Todos os Roteiros</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Status Message / Notification Toast */}
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "no-print px-6 py-2.5 flex items-center gap-2.5 text-xs font-bold border-b",
                  statusMessage.type === 'success' && "bg-emerald-950/60 border-emerald-500/30 text-emerald-300",
                  statusMessage.type === 'info' && "bg-sky-950/60 border-sky-500/30 text-sky-300",
                  statusMessage.type === 'error' && "bg-rose-950/60 border-rose-500/30 text-rose-300"
                )}
              >
                {statusMessage.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                {statusMessage.type === 'info' && <Sparkles size={16} className="text-sky-400 shrink-0" />}
                {statusMessage.type === 'error' && <AlertCircle size={16} className="text-rose-400 shrink-0" />}
                <span>{statusMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters Bar: Roteiro & Período */}
          <div className="no-print p-4 sm:px-6 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            
            {/* Seletor de Roteiro Individual ou Todos */}
            <div className="flex flex-wrap items-center gap-3">
              {exclusiveTripMode ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Route size={14} className="text-orange-500" />
                    Viagem Exclusiva:
                  </span>
                  <span className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white max-w-[280px] sm:max-w-md truncate">
                    {displayLogs[0]?.title || 'Roteiro Selecionado'}
                  </span>
                  {onOpenAllTrips && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAllTrips();
                      }}
                      className="text-[10px] text-slate-400 hover:text-orange-400 uppercase font-bold underline transition-colors cursor-pointer ml-1"
                    >
                      (Ver todas no Diário)
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Route size={14} className="text-orange-500" />
                    Roteiro:
                  </span>
                  <select
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-orange-500/60 max-w-[220px] sm:max-w-xs"
                  >
                    <option value="all">Todos os Roteiros ({filteredByDateLogs.length})</option>
                    {logs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title || 'Roteiro sem título'} {l.stages?.length ? `(${l.stages.length} etapas)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Período (apenas quando vendo todos) */}
              {!exclusiveTripMode && selectedTripId === 'all' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Período:</span>
                  <div className="inline-flex p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
                    {[
                      { id: 'all', label: 'Tudo' },
                      { id: 'year', label: 'Ano' },
                      { id: '6months', label: '6M' },
                      { id: '30days', label: '30D' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setDateFilter(f.id as any)}
                        className={cn(
                          "px-2 sm:px-2.5 py-1 rounded-lg transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer",
                          dateFilter === f.id
                            ? "bg-orange-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Export Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary py-2 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:border-slate-600 active:scale-95 transition-transform"
                title="Abrir diálogo de impressão do navegador ou Salvar como PDF nativo"
              >
                <Printer size={15} className="text-slate-300" />
                <span className="hidden sm:inline">IMPRIMIR</span>
              </button>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleExportCSV}
                className="btn-secondary py-2 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:border-emerald-500/50 hover:text-emerald-400 active:scale-95 transition-transform disabled:opacity-50"
                title="Baixar planilha compatível com Excel e Google Sheets"
              >
                <FileSpreadsheet size={15} className="text-emerald-400" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGeneratePDF}
                className="btn-primary py-2 px-3.5 sm:px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-600/20 active:scale-95 transition-transform disabled:opacity-50"
                title="Gerar e baixar arquivo PDF completo com roteiros e etapas concluídas"
              >
                <Download size={15} />
                <span>BAIXAR PDF</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Compartilhar resumo no WhatsApp"
              >
                {copiedShare ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              </button>
            </div>
          </div>

          {/* Document Content / Print Preview Area */}
          <div className="p-3 sm:p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
            
            {/* The printable card container */}
            <div id="printable-report" className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6 text-slate-200">
              
              {/* Document Header */}
              <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-orange-500 font-black tracking-widest text-sm uppercase">MOTOLEGADO</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">DIÁRIO DE BORDO OFICIAL</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tight print-text-dark">
                    {selectedTripId !== 'all' ? 'DOSSIÊ DE ROTEIRO & ETAPAS' : 'DOSSIÊ OFICIAL DE ROTEIROS'}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 print-text-muted">
                    Histórico consolidado de roteiros percorridos, quilometragem certificada e etapas concluídas.
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs print-card p-2 sm:p-0 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest print-text-muted">AUTENTICAÇÃO</div>
                  <div className="font-mono font-bold text-orange-400 text-sm">{reportId}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 print-text-muted">Emitido em: {issueDate}</div>
                </div>
              </div>

              {/* Pilot & Machine Identity Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 print-card">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block print-text-muted">PILOTO</span>
                  <span className="text-base font-black text-white italic uppercase print-text-dark">{pilotName || 'Piloto Não Identificado'}</span>
                  {pilotId && (
                    <span className="block text-[10px] font-mono text-slate-400 mt-0.5 print-text-muted">ID: {pilotId}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block print-text-muted">MOTO CLUBE</span>
                  <span className="text-sm font-black text-amber-400 uppercase italic print-text-dark flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck size={14} className="text-amber-500" />
                    {pilotClub || 'Piloto Independente'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block print-text-muted">MÁQUINA PRINCIPAL</span>
                  <span className="text-sm font-black text-white uppercase italic print-text-dark flex items-center gap-1.5 mt-0.5">
                    <Bike size={14} className="text-orange-500" />
                    {pilotMotorcycle || 'Motocicleta Cadastrada'}
                  </span>
                </div>
              </div>

              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 print-card">
                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider print-text-muted">QUILOMETRAGEM TOTAL</div>
                  <div className="text-xl sm:text-2xl font-black italic text-orange-400 mt-1 font-mono">
                    {metrics.totalKm.toLocaleString()} <span className="text-xs text-slate-500 font-sans print-text-muted">KM</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 print-card">
                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider print-text-muted">ROTEIROS CONCLUÍDOS</div>
                  <div className="text-xl sm:text-2xl font-black italic text-white mt-1 print-text-dark">
                    {metrics.totalTrips} <span className="text-xs text-slate-500 font-sans print-text-muted">expedições</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 print-card">
                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider print-text-muted">ETAPAS CONCLUÍDAS</div>
                  <div className="text-xl sm:text-2xl font-black italic text-emerald-400 mt-1 font-mono flex items-center gap-1.5">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>{metrics.totalCompletedStages}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 print-card">
                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider print-text-muted">ESTRADAS AVALIADAS</div>
                  <div className="text-xl sm:text-2xl font-black italic text-amber-400 mt-1 flex items-center gap-1.5 print-text-dark">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    <span>{metrics.avgRating}</span>
                    <span className="text-xs text-slate-500 font-sans print-text-muted">/ 5.0</span>
                  </div>
                </div>
              </div>

              {/* Roteiros e Etapas Detalhadas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase italic tracking-wider text-white print-text-dark flex items-center gap-2">
                    <Route size={16} className="text-orange-500" />
                    <span>Roteiros e Etapas Concluídas ({displayLogs.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500 print-text-muted">
                    Certificado pelo Diário de Bordo
                  </span>
                </div>

                {displayLogs.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                    Nenhum roteiro registrado no período selecionado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayLogs.map((log, idx) => (
                      <div 
                        key={log.id || idx}
                        className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-4 sm:p-5 space-y-4 print-card"
                      >
                        {/* Header do Roteiro */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-mono text-slate-400 print-text-muted">
                                {log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '—'}
                              </span>
                              <span className="text-slate-600">·</span>
                              <h4 className="text-base font-black italic uppercase text-white tracking-wide print-text-dark">
                                {log.title || 'Roteiro Sem Título'}
                              </h4>
                            </div>
                            <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mt-1 print-text-dark">
                              <MapPin size={13} className="text-orange-500 shrink-0" />
                              <span>{log.origin || 'Partida'}</span>
                              <span className="text-orange-500">➔</span>
                              <span>{log.destination || 'Destino'}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono font-bold text-xs print-badge">
                              {log.distance ? `${log.distance} KM` : '—'}
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold print-badge">
                              ⭐ {log.rating || 5}/5
                            </span>
                          </div>
                        </div>

                        {/* Informações Cadastradas no Diário (Período, Clima e Estrada) */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] print-card">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold uppercase print-badge">
                            {(log as any).period === 'night' ? '🌙 De noite' : ((log as any).period === 'all_day' ? '⏳ O dia todo' : '☀️ De dia')}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold uppercase print-badge">
                            🌤️ {Array.isArray((log as any).climates) && (log as any).climates.length > 0
                              ? (log as any).climates.map((c: string) => c === 'sun' ? 'Sol' : c === 'rain' ? 'Chuva' : c === 'cloud' ? 'Nublado' : c === 'zap' ? 'Tempestade' : c === 'fog' ? 'Neblina' : c === 'wind' ? 'Vento Forte' : c).join(' • ')
                              : (log.climate || 'Sol')}
                          </span>
                          {log.road && (
                            <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold uppercase print-badge">
                              🛣️ {log.road}
                            </span>
                          )}
                        </div>

                        {/* Observações / Descrição */}
                        {log.content && (
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300 leading-relaxed print:bg-white print:border-slate-300 print-text-dark">
                            <p className="italic">{log.content}</p>
                          </div>
                        )}

                        {/* Seção de Etapas Concluídas */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5 print-text-dark">
                              <CheckCircle2 size={13} className="text-emerald-400" />
                              Etapas & Paradas Concluídas ({log.stages?.length || 0}):
                            </span>
                            {(!log.stages || log.stages.length === 0) && (
                              <span className="text-[10px] text-slate-500 italic print-text-muted">
                                Trajeto direto sem paradas intermediárias registradas.
                              </span>
                            )}
                          </div>

                          {log.stages && log.stages.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {log.stages.map((st, sidx) => (
                                <div 
                                  key={st.id || sidx}
                                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5 print-card"
                                >
                                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check size={12} className="stroke-[3]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="text-xs font-bold text-white uppercase truncate print-text-dark">
                                        {sidx + 1}. {st.name}
                                      </p>
                                      {st.kmMark && (
                                        <span className="text-[10px] font-mono text-orange-400 font-bold shrink-0 print-text-dark">
                                          KM {st.kmMark}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 print-text-muted">
                                      <span className="font-semibold text-slate-300 print-text-dark">
                                        {STAGE_LABELS[st.type] || st.type}
                                      </span>
                                      {st.notes && (
                                        <>
                                          <span>·</span>
                                          <span className="italic truncate">{st.notes}</span>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Provas Fotográficas Documentais */}
                        {((log.documentaryProofs && log.documentaryProofs.length > 0) || (log.photos && log.photos.length > 0)) && (
                          <div className="pt-2 border-t border-slate-800/60 print:border-slate-300">
                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5 mb-2 print-text-dark">
                              <Camera size={13} className="text-orange-500" />
                              Provas Fotográficas Certificadas ({log.documentaryProofs?.length || log.photos?.length || 0}):
                            </span>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {log.documentaryProofs && log.documentaryProofs.length > 0 ? (
                                log.documentaryProofs.map((p) => (
                                  <div key={p.id} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-800 print-card shrink-0 bg-black">
                                    <img src={p.url} alt="Prova" className="w-full h-full object-cover" />
                                  </div>
                                ))
                              ) : (
                                log.photos?.map((url, idx) => (
                                  <div key={idx} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-800 print-card shrink-0 bg-black">
                                    <img src={url} alt="Prova" className="w-full h-full object-cover" />
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Official Seal and Certificate Footer */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 uppercase font-bold tracking-wider print-text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <span>Documento gerado pelo sistema de telemetria e passaporte do piloto MotoLegado</span>
                </div>
                <div>
                  Página 1 de 1 · Código de Autenticação: <span className="font-mono text-slate-400 print-text-dark">{reportId}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Modal Bottom Footer Actions */}
          <div className="no-print p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 shrink-0" />
              <span>Clique em <strong>BAIXAR PDF</strong> para salvar seu arquivo ou <strong>IMPRIMIR</strong> para enviar diretamente à impressora.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary py-2 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <Printer size={15} />
                <span>IMPRIMIR</span>
              </button>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGeneratePDF}
                className="btn-primary py-2 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-lg shadow-orange-600/20 disabled:opacity-50"
              >
                <Download size={15} />
                <span>BAIXAR PDF</span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
