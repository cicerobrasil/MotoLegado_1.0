import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Sparkles, Layers, Shield } from 'lucide-react';

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandKitModal: React.FC<BrandKitModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase rounded-full mb-2">
                <Sparkles size={12} />
                <span>Kit de Marca Oficial</span>
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                BAIXAR EMBLEMA DO <span className="text-orange-500">MOTOLEGADO</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Arquivos oficiais em altíssima resolução para camisetas, adesivos, redes sociais e gráficas.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            {/* 1. Transparente (Camisetas, Adesivos, Canva) */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center group hover:border-orange-500/40 transition-all">
              <div className="w-32 h-32 rounded-2xl p-3 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] bg-slate-900/90 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <img
                  src="/motolegado-emblema-transparente-1024.png"
                  alt="Emblema Fundo Transparente"
                  className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                />
              </div>
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Layers size={14} className="text-orange-400" />
                Fundo Transparente (PNG)
              </span>
              <p className="text-[11px] text-slate-400 mt-1 mb-4 leading-relaxed">
                Apenas o brasão puro. Perfeito para Canva, Photoshop, camisetas e adesivos.
              </p>
              <div className="mt-auto w-full space-y-2">
                <button
                  type="button"
                  onClick={() => downloadFile('/motolegado-emblema-transparente-2048.png', 'motolegado-emblema-transparente-2048.png')}
                  className="w-full py-2.5 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-orange-600/20"
                >
                  <Download size={14} />
                  <span>Baixar Ultra HD (2048px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile('/motolegado-emblema-transparente.svg', 'motolegado-emblema-vetor.svg')}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download size={13} />
                  <span>Baixar Vetor SVG</span>
                </button>
              </div>
            </div>

            {/* 2. Com Placa / Badge Escura (Redes Sociais, Perfil) */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center group hover:border-orange-500/40 transition-all">
              <div className="w-32 h-32 rounded-2xl p-2 bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <img
                  src="/motolegado-emblema-1024.png"
                  alt="Emblema Completo com Badge"
                  className="w-full h-full object-contain rounded-xl shadow-lg"
                />
              </div>
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Shield size={14} className="text-orange-400" />
                Badge Completo (PNG)
              </span>
              <p className="text-[11px] text-slate-400 mt-1 mb-4 leading-relaxed">
                Com a placa escura de proteção e borda laranja. Ideal para fotos de perfil e posts.
              </p>
              <div className="mt-auto w-full space-y-2">
                <button
                  type="button"
                  onClick={() => downloadFile('/motolegado-emblema-2048.png', 'motolegado-emblema-badge-2048.png')}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download size={14} />
                  <span>Baixar Ultra HD (2048px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile('/icon.svg', 'motolegado-badge-vetor.svg')}
                  className="w-full py-2 px-3 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download size={13} />
                  <span>Baixar Vetor SVG</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/20 text-center">
            <p className="text-[11px] text-orange-300">
              💡 <strong>Dica Pro:</strong> Use o arquivo <strong>SVG</strong> caso vá enviar para uma gráfica imprimir camisas, adesivos de vinil ou banners sem limite de tamanho.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
