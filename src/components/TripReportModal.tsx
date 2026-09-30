import React, { useState, useMemo } from 'react';
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
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import { LogEntry } from './Logbook';
import { cn } from '../lib/utils';

interface TripReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  pilotName: string;
  pilotClub?: string;
  pilotMotorcycle?: string;
  pilotId?: string;
}

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

export function TripReportModal({
  isOpen,
  onClose,
  logs,
  pilotName,
  pilotClub,
  pilotMotorcycle,
  pilotId,
}: TripReportModalProps) {
  const [dateFilter, setDateFilter] = useState<'all' | 'year' | '6months' | '30days'>('all');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedCSV, setCopiedCSV] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filtrar logs de acordo com o período selecionado
  const filteredLogs = useMemo(() => {
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

  // Cálculos de Telemetria
  const metrics = useMemo(() => {
    let totalKm = 0;
    let maxKm = 0;
    let longestTripTitle = '';
    let totalRating = 0;

    filteredLogs.forEach((log) => {
      const km = parseFloat(String(log.distance).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      totalKm += km;
      if (km > maxKm) {
        maxKm = km;
        longestTripTitle = `${log.origin || 'Origem'} → ${log.destination || 'Destino'}`;
      }
      totalRating += log.rating || 5;
    });

    const avgKm = filteredLogs.length > 0 ? Math.round(totalKm / filteredLogs.length) : 0;
    const avgRating = filteredLogs.length > 0 ? (totalRating / filteredLogs.length).toFixed(1) : '5.0';

    return {
      totalKm: Math.round(totalKm),
      totalTrips: filteredLogs.length,
      avgKm,
      maxKm: Math.round(maxKm),
      longestTripTitle: longestTripTitle || 'N/A',
      avgRating,
    };
  }, [filteredLogs]);

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
        'Título da Viagem',
        'Origem',
        'Destino',
        'Distância (KM)',
        'Duração Estimada',
        'Motocicleta',
        'Condição do Asfalto',
        'Clima',
        'Avaliação (1-5)',
        'Notas e Diário'
      ];

      const rows = filteredLogs.length > 0 
        ? filteredLogs.map((log) => [
            `"${log.date || ''}"`,
            `"${(log.title || '').replace(/"/g, '""')}"`,
            `"${(log.origin || '').replace(/"/g, '""')}"`,
            `"${(log.destination || '').replace(/"/g, '""')}"`,
            `"${String(log.distance || 0).replace(/"/g, '""')}"`,
            `"${(log.duration || '').replace(/"/g, '""')}"`,
            `"${(log.bike || pilotMotorcycle || '').replace(/"/g, '""')}"`,
            `"${(log.road || '').replace(/"/g, '""')}"`,
            `"${(log.climate || '').replace(/"/g, '""')}"`,
            `"${log.rating || 5}"`,
            `"${(log.content || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
          ])
        : [[
            `"${new Date().toISOString().slice(0, 10)}"`,
            `"Exemplo: Primeira Expedição"`,
            `"São Paulo"`,
            `"Curitiba"`,
            `"408"`,
            `"5h 30min"`,
            `"${(pilotMotorcycle || 'Moto Cadastrada').replace(/"/g, '""')}"`,
            `"Tapete"`,
            `"Ensolarado"`,
            `"5"`,
            `"Modelo de relatório MotoLegado emitido"`
          ]];

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const safeName = (pilotName || 'Piloto').toLowerCase().replace(/\s+/g, '_');
      const today = new Date().toISOString().slice(0, 10);
      const filename = `MotoLegado_Relatorio_Viagens_${safeName}_${today}.csv`;

      triggerDownload(blob, filename);

      setStatusMessage({ 
        text: `Arquivo "${filename}" baixado com sucesso!`, 
        type: 'success' 
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Erro na exportação CSV:', err);
      setStatusMessage({ text: 'Falha ao baixar CSV. Tente copiar o resumo ou gerar em PDF.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Geração e Download Direto do Arquivo PDF (.pdf) com jsPDF
  const handleGeneratePDF = () => {
    setIsGenerating(true);
    setStatusMessage({ text: 'Compilando e gerando arquivo PDF...', type: 'info' });

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Top Header Brand Bar (Dark Slate / Orange)
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
      doc.text('PLATAFORMA OFICIAL DO MOTOCICLISMO · DIÁRIO DE BORDO & TELEMETRIA', 14, 18);

      // Report ID & Date
      doc.setFontSize(8);
      doc.setFont('courier', 'bold');
      doc.setTextColor(251, 146, 60); // orange-400
      doc.text(`ID: ${reportId}`, pageWidth - 14, 11, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Emissão: ${issueDate}`, pageWidth - 14, 17, { align: 'right' });

      // Title Section
      let y = 35;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text('DOSSIÊ OFICIAL DO PILOTO', 14, y);

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Relatório oficial de expedições, quilometragem certificada e histórico de asfalto.', 14, y);

      // Pilot Credentials Box
      y += 6;
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('PILOTO:', 18, y + 6);
      doc.text('MOTO CLUBE:', 78, y + 6);
      doc.text('MOTOCICLETA:', 138, y + 6);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(pilotName || 'Piloto MotoLegado', 18, y + 13);

      doc.setTextColor(217, 119, 6); // amber-600
      doc.text(pilotClub || 'Piloto Independente', 78, y + 13);

      doc.setTextColor(15, 23, 42);
      doc.text(pilotMotorcycle || 'Moto Cadastrada', 138, y + 13);

      // Telemetry Metrics Grid (4 cards)
      y += 24;
      const cardWidth = (pageWidth - 28 - 9) / 4;
      const stats = [
        { label: 'KM TOTAL', val: `${metrics.totalKm.toLocaleString()} KM`, color: [234, 88, 12] },
        { label: 'EXPEDIÇÕES', val: `${metrics.totalTrips}`, color: [15, 23, 42] },
        { label: 'MÉDIA / VIAGEM', val: `${metrics.avgKm.toLocaleString()} KM`, color: [217, 119, 6] },
        { label: 'NOTA ESTRADAS', val: `${metrics.avgRating} / 5.0`, color: [16, 185, 129] },
      ];

      stats.forEach((st, idx) => {
        const cx = 14 + idx * (cardWidth + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cx, y, cardWidth, 15, 2, 2, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(st.label, cx + 3, y + 4.5);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(st.color[0], st.color[1], st.color[2]);
        doc.text(st.val, cx + 3, y + 11.5);
      });

      // Table Header Section
      y += 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`REGISTRO DE EXPEDIÇÕES (${filteredLogs.length})`, 14, y);

      y += 4;
      // Table Header Row
      doc.setFillColor(15, 23, 42);
      doc.rect(14, y, pageWidth - 28, 6.5, 'F');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('DATA', 17, y + 4.5);
      doc.text('TÍTULO / EXPEDIÇÃO', 38, y + 4.5);
      doc.text('TRAJETO (ORIGEM → DESTINO)', 96, y + 4.5);
      doc.text('DISTÂNCIA', 156, y + 4.5);
      doc.text('ESTRADA', 176, y + 4.5);

      y += 6.5;

      if (filteredLogs.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma viagem registrada no período selecionado.', 18, y + 8);
        y += 16;
      } else {
        doc.setFontSize(7);
        filteredLogs.forEach((log, index) => {
          // Check page break
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 16;
            // Repeat Table Header
            doc.setFillColor(15, 23, 42);
            doc.rect(14, y, pageWidth - 28, 6.5, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('DATA', 17, y + 4.5);
            doc.text('TÍTULO / EXPEDIÇÃO', 38, y + 4.5);
            doc.text('TRAJETO (ORIGEM → DESTINO)', 96, y + 4.5);
            doc.text('DISTÂNCIA', 156, y + 4.5);
            doc.text('ESTRADA', 176, y + 4.5);
            y += 6.5;
          }

          // Row background alternate
          if (index % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, y, pageWidth - 28, 7.5, 'F');
          }
          doc.setDrawColor(241, 245, 249);
          doc.line(14, y + 7.5, pageWidth - 14, y + 7.5);

          doc.setFont('courier', 'normal');
          doc.setTextColor(100, 116, 139);
          const dateStr = log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '—';
          doc.text(dateStr, 17, y + 5);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          const safeTitle = (log.title || 'Sem Título').substring(0, 30);
          doc.text(safeTitle, 38, y + 5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          const safeRoute = `${log.origin || 'Partida'} → ${log.destination || 'Chegada'}`.substring(0, 34);
          doc.text(safeRoute, 96, y + 5);

          doc.setFont('courier', 'bold');
          doc.setTextColor(234, 88, 12);
          const distStr = log.distance ? `${log.distance} KM` : '—';
          doc.text(distStr, 156, y + 5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          const roadStr = (log.road || 'Padrão').split(' ')[0].substring(0, 12);
          doc.text(roadStr, 176, y + 5);

          y += 7.5;
        });
      }

      // Footer with page numbering
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240);
        doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Documento emitido via MotoLegado · Autenticação: ${reportId}`, 14, pageHeight - 6);
        doc.text(`Página ${p} de ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
      }

      const safeName = (pilotName || 'Piloto').toLowerCase().replace(/\s+/g, '_');
      const today = new Date().toISOString().slice(0, 10);
      const filename = `MotoLegado_Relatorio_Viagens_${safeName}_${today}.pdf`;

      // Download real PDF
      doc.save(filename);

      setStatusMessage({ 
        text: `Arquivo "${filename}" gerado e baixado com sucesso!`, 
        type: 'success' 
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Erro ao gerar PDF com jsPDF:', err);
      // Tentativa de fallback via window.print() se suportado
      try {
        window.print();
        setStatusMessage({ text: 'Menu de impressão aberto.', type: 'info' });
      } catch (printErr) {
        setStatusMessage({ text: 'Falha ao gerar PDF. Baixe a planilha CSV como alternativa.', type: 'error' });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Compartilhamento Rápido no WhatsApp
  const handleShareWhatsApp = () => {
    const text = 
      `🏍️ *RELATÓRIO DE EXPEDIÇÕES MOTOLEGADO*\n` +
      `👤 *Piloto:* ${pilotName || 'Piloto'}\n` +
      `🛡️ *Moto Clube:* ${pilotClub || 'Independente'}\n` +
      `🔥 *Máquina:* ${pilotMotorcycle || 'Moto Cadastrada'}\n\n` +
      `📊 *Telemetria Acumulada:*\n` +
      `🛣️ *Quilometragem Total:* ${metrics.totalKm.toLocaleString()} KM\n` +
      `📍 *Expedições Concluídas:* ${metrics.totalTrips}\n` +
      `⚡ *Média por Viagem:* ${metrics.avgKm.toLocaleString()} KM\n` +
      `⭐ *Avaliação Média das Pistas:* ${metrics.avgRating}/5.0\n\n` +
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

  // 4. Copiar Tabela em Texto para Área de Transferência
  const handleCopyClipboard = () => {
    const lines = [
      `RELATÓRIO DE VIAGENS MOTOLEGADO - ${pilotName || 'PILOTO'}`,
      `Quilometragem Total: ${metrics.totalKm.toLocaleString()} KM | Viagens: ${metrics.totalTrips}`,
      `----------------------------------------------------------------`,
      ...filteredLogs.map(l => `${l.date || '—'} | ${l.title || 'Sem título'} | ${l.origin || ''} -> ${l.destination || ''} | ${l.distance || 0} KM`),
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
        
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
          }
        ` }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar / Header */}
          <div className="no-print p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <FileDown size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black italic uppercase text-white tracking-tight">
                    RELATÓRIOS DO DIÁRIO DE BORDO
                  </h2>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-wider">
                    Plano Pro & VIP
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exporte o dossiê oficial das suas expedições em PDF direto e planilha CSV.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={20} />
            </button>
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

          {/* Quick Action Controls & Filters Bar */}
          <div className="no-print p-4 sm:px-6 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            {/* Filter by Period */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Período:</span>
              <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
                {[
                  { id: 'all', label: 'Todas as Viagens' },
                  { id: 'year', label: 'Este Ano' },
                  { id: '6months', label: 'Últimos 6 Meses' },
                  { id: '30days', label: 'Últimos 30 Dias' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDateFilter(f.id as any)}
                    className={cn(
                      "px-2.5 sm:px-3 py-1 rounded-lg transition-all text-[11px] font-black uppercase tracking-wider cursor-pointer",
                      dateFilter === f.id
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Export Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleExportCSV}
                className="btn-secondary py-2 px-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:border-emerald-500/50 hover:text-emerald-400 active:scale-95 transition-transform disabled:opacity-50"
                title="Baixar planilha compatível com Excel e Google Sheets"
              >
                <FileSpreadsheet size={15} className="text-emerald-400" />
                <span>BAIXAR CSV</span>
              </button>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGeneratePDF}
                className="btn-primary py-2 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-600/20 active:scale-95 transition-transform disabled:opacity-50"
                title="Gerar e baixar o relatório oficial em formato PDF"
              >
                <Download size={15} />
                <span>BAIXAR PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCopyClipboard}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Copiar dados para área de transferência"
              >
                {copiedCSV ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="hidden sm:inline text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Compartilhar resumo no WhatsApp"
              >
                {copiedShare ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="hidden sm:inline">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Document Content / Print Preview Area */}
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-6">
            
            {/* The printable card container */}
            <div id="printable-report" className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-slate-200">
              
              {/* Document Header */}
              <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-orange-500 font-black tracking-widest text-sm uppercase">MOTOLEGADO</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">PLATAFORMA OFICIAL DO MOTOCICLISMO</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tight print-text-dark">
                    DOSSIÊ DO DIÁRIO DE BORDO
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 print-text-muted">
                    Relatório oficial de expedições, quilometragem certificada e histórico de asfalto.
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
                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider print-text-muted">EXPEDIÇÕES CONCLUÍDAS</div>
                  <div className="text-xl sm:text-2xl font-black italic text-white mt-1 print-text-dark">
                    {metrics.totalTrips} <span className="text-xs text-slate-500 font-sans print-text-muted">viagens</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 print-card">
                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider print-text-muted">MÉDIA POR EXPEDIÇÃO</div>
                  <div className="text-xl sm:text-2xl font-black italic text-amber-400 mt-1 font-mono">
                    {metrics.avgKm.toLocaleString()} <span className="text-xs text-slate-500 font-sans print-text-muted">KM</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 print-card">
                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider print-text-muted">ESTRADAS AVALIADAS</div>
                  <div className="text-xl sm:text-2xl font-black italic text-emerald-400 mt-1 flex items-center gap-1.5 print-text-dark">
                    <Star size={16} className="fill-emerald-400 text-emerald-400" />
                    <span>{metrics.avgRating}</span>
                    <span className="text-xs text-slate-500 font-sans print-text-muted">/ 5.0</span>
                  </div>
                </div>
              </div>

              {/* Table of Trips */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase italic tracking-wider text-white print-text-dark flex items-center gap-2">
                    <Route size={16} className="text-orange-500" />
                    <span>Registro Detalhado das Viagens ({filteredLogs.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500 print-text-muted">
                    Ordenado cronologicamente
                  </span>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                    Nenhuma viagem registrada no período selecionado.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left border-collapse print-table">
                      <thead>
                        <tr className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-800">
                          <th className="p-3">Data</th>
                          <th className="p-3">Título da Expedição</th>
                          <th className="p-3">Trajeto (Origem → Destino)</th>
                          <th className="p-3 text-right">Distância</th>
                          <th className="p-3">Pista / Clima</th>
                          <th className="p-3 text-center">Nota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '—'}
                            </td>
                            <td className="p-3 font-bold text-white italic uppercase print-text-dark">
                              {log.title || 'Sem Título'}
                              {log.content && (
                                <p className="text-[10px] text-slate-400 font-normal line-clamp-1 mt-0.5 print-text-muted">
                                  {log.content}
                                </p>
                              )}
                            </td>
                            <td className="p-3 text-slate-300 print-text-dark">
                              <span className="font-semibold">{log.origin || 'Partida'}</span>
                              <span className="text-orange-500 mx-1.5 font-bold">→</span>
                              <span className="font-semibold">{log.destination || 'Chegada'}</span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-orange-400 whitespace-nowrap">
                              {log.distance ? `${log.distance} KM` : '—'}
                            </td>
                            <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap print-text-muted">
                              <span>{log.road || 'Padrão'}</span>
                            </td>
                            <td className="p-3 text-center font-bold text-amber-400 whitespace-nowrap">
                              ⭐ {log.rating || 5}/5
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  Página 1 de 1 · Código Seguro: <span className="font-mono text-slate-400 print-text-dark">{reportId}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Modal Bottom Footer Actions */}
          <div className="no-print p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 shrink-0" />
              <span>Clique em <strong>BAIXAR PDF</strong> para obter o documento oficial ou <strong>BAIXAR CSV</strong> para planilhas.</span>
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
                disabled={isGenerating}
                onClick={handleExportCSV}
                className="btn-secondary py-2 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <FileSpreadsheet size={15} className="text-emerald-400" />
                <span>BAIXAR CSV</span>
              </button>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGeneratePDF}
                className="btn-primary py-2 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-lg shadow-orange-600/20"
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
