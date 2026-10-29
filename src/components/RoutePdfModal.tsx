import React, { useState } from 'react';
import { 
  FileText, Download, Printer, ExternalLink, X, Check, Loader2, 
  MapPin, Star, ShieldCheck, Sparkles, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Route } from '../types';
import { generateRoutePdfDocument } from '../utils/routePdfExport';

interface RoutePdfModalProps {
  route: Route | null;
  pilotName?: string;
  onClose: () => void;
}

export const RoutePdfModal: React.FC<RoutePdfModalProps> = ({
  route,
  pilotName = 'Piloto Convidado',
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [generatedPdf, setGeneratedPdf] = useState<{ doc: any; filename: string; blobUrl: string } | null>(null);

  if (!route) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      setActionDone(null);
      
      let pdfData = generatedPdf;
      if (!pdfData) {
        pdfData = await generateRoutePdfDocument(route, { pilotName });
        setGeneratedPdf(pdfData);
      }

      pdfData.doc.save(pdfData.filename);
      setActionDone('Arquivo PDF baixado com sucesso!');
      setTimeout(() => setActionDone(null), 4000);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPdf = async () => {
    try {
      setIsGenerating(true);
      setActionDone(null);

      let pdfData = generatedPdf;
      if (!pdfData) {
        pdfData = await generateRoutePdfDocument(route, { pilotName });
        setGeneratedPdf(pdfData);
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = pdfData.blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setActionDone('Diálogo de impressão aberto!');
        } catch {
          window.open(pdfData!.blobUrl, '_blank');
          setActionDone('PDF aberto para impressão.');
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
          setActionDone(null);
        }, 30000);
      };
    } catch (err) {
      console.error('Erro ao imprimir PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenInNewTab = async () => {
    try {
      setIsGenerating(true);
      let pdfData = generatedPdf;
      if (!pdfData) {
        pdfData = await generateRoutePdfDocument(route, { pilotName });
        setGeneratedPdf(pdfData);
      }
      window.open(pdfData.blobUrl, '_blank');
    } catch (err) {
      console.error('Erro ao abrir PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
                <FileText size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black italic uppercase text-white tracking-tight">
                  EXPORTAR PARA PDF
                </h3>
                <p className="text-[11px] text-slate-400">
                  Imprima ou salve o roteiro com especificações técnicas e mapa
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Route Preview Card */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-black uppercase">
                    {route.difficulty}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <Star size={11} className="fill-amber-400" />
                    {route.rating.toFixed(1)} / 5.0
                  </span>
                </div>
                <h4 className="text-sm font-black uppercase text-white line-clamp-1">
                  {route.name}
                </h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin size={12} className="text-orange-500 shrink-0" />
                  <span className="line-clamp-1">{route.mapsAddress}</span>
                </p>
              </div>

              {route.image && (
                <img
                  src={route.image}
                  alt={route.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                />
              )}
            </div>

            {/* Inclusions summary */}
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>5 Métricas de Pista</span>
              </div>
              <div className="flex items-center gap-1.5">
                <QrCode size={13} className="text-amber-400" />
                <span>QR Code Google Maps</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-orange-400" />
                <span>Dicas de Pilotagem</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText size={13} className="text-sky-400" />
                <span>Formato A4 Otimizado</span>
              </div>
            </div>
          </div>

          {/* Feedback message if any */}
          {actionDone && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Check size={15} />
              <span>{actionDone}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadPdf}
              className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Gerando PDF com Mapa & Métricas...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>SALVAR COMO PDF (DOWNLOAD)</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isGenerating}
                onClick={handlePrintPdf}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
                title="Abrir o diálogo de impressão da sua impressora"
              >
                <Printer size={15} className="text-orange-400" />
                <span>IMPRIMIR</span>
              </button>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleOpenInNewTab}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
                title="Abrir o PDF em uma nova aba do navegador"
              >
                <ExternalLink size={15} className="text-sky-400" />
                <span>VISUALIZAR</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            O documento inclui especificações de asfalto, curvas, segurança, atrativos e um QR Code de navegação curva a curva para celular.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
