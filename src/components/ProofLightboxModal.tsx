import React from 'react';
import { X, ShieldCheck, MapPin, Calendar, Clock, Download, Compass, Tag } from 'lucide-react';
import { DocumentaryProof, DocumentaryProofType } from '../types';
import { PROOF_TYPES } from './DocumentaryCameraModal';

interface ProofLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  proof: DocumentaryProof | null;
  tripTitle?: string;
}

export function ProofLightboxModal({
  isOpen,
  onClose,
  proof,
  tripTitle
}: ProofLightboxModalProps) {
  if (!isOpen || !proof) return null;

  const typeMeta = PROOF_TYPES.find((t) => t.id === proof.type) || {
    label: 'Prova Documental',
    icon: '📸',
    desc: 'Registro fotográfico da rota'
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = proof.url;
    a.download = `motolegado_prova_${proof.type}_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{typeMeta.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {typeMeta.label}
                </h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={11} /> PROVA CERTIFICADA
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {tripTitle || proof.location || 'Roteiro Concluído'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Baixar Foto Original"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Imagem Central */}
        <div className="relative flex-1 bg-black flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[350px]">
          <img
            src={proof.url}
            alt={proof.caption || typeMeta.label}
            className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Rodapé com Informações da Prova */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
          {proof.caption && (
            <p className="text-xs font-bold text-white bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              "{proof.caption}"
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-medium text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock size={13} className="text-orange-500" />
              <span>Registrado em: <strong className="text-white">{proof.timestamp}</strong></span>
            </div>

            {proof.coords && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin size={13} className="text-orange-500" />
                <span>GPS: <strong className="text-white">{proof.coords.latitude}, {proof.coords.longitude}</strong></span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-300">
              <Compass size={13} className="text-orange-500" />
              <span>Finalidade: <strong className="text-white">{typeMeta.desc}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
