import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Sparkles, Layers, Shield } from 'lucide-react';
import { LogoMark } from './LogoMark';

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
                <span>Identidade Visual Oficial</span>
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                LOGO OFICIAL <span className="text-[#ff751f]">MOTOLEGADO</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Badge Azul (<code className="text-[#99c0ff]">#001b3d</code>) com caixa Salmão (<code className="text-[#ff751f]">#ff751f</code>), OTO em Branco (<code className="text-white">#ffffff</code>) e LEGADO em Salmão.
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
            {/* 1. Logo Horizontal Principal */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center group hover:border-[#ff751f]/40 transition-all">
              <div className="w-full h-32 rounded-2xl p-4 bg-slate-900/90 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <LogoMark size="md" showGlow={false} />
              </div>
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Layers size={14} className="text-[#ff751f]" />
                Logo Horizontal (SVG / PNG)
              </span>
              <p className="text-[11px] text-slate-400 mt-1 mb-4 leading-relaxed">
                Versão horizontal para websites, cabeçalhos, camisetas, adesivos de moto e banners.
              </p>
              <div className="mt-auto w-full space-y-2">
                <button
                  type="button"
                  onClick={() => downloadFile('/motolegado-logo.svg', 'motolegado-logo-oficial.svg')}
                  className="w-full py-2.5 px-3 bg-[#ff751f] hover:bg-[#ff853a] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-[#ff751f]/20"
                >
                  <Download size={14} />
                  <span>Baixar Vetor SVG</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile('/motolegado-logo-2048.png', 'motolegado-logo-2048.png')}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download size={14} />
                  <span>Baixar PNG HD (2048px)</span>
                </button>
              </div>
            </div>

            {/* 2. Ícone Quadrado / App & Favicon */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center group hover:border-[#ff751f]/40 transition-all">
              <div className="w-32 h-32 rounded-2xl p-2 bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform overflow-hidden">
                <img
                  src="/icon.svg"
                  alt="Logo MotoLegado Quadrado"
                  className="w-full h-full object-contain rounded-xl shadow-lg"
                />
              </div>
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Shield size={14} className="text-blue-400" />
                Ícone App / Favicon (SVG)
              </span>
              <p className="text-[11px] text-slate-400 mt-1 mb-4 leading-relaxed">
                Formato quadrado com cantos curvos para ícone de PWA, redes sociais e avatares.
              </p>
              <div className="mt-auto w-full space-y-2">
                <button
                  type="button"
                  onClick={() => downloadFile('/icon.svg', 'motolegado-app-icon.svg')}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download size={14} />
                  <span>Baixar SVG Quadrado</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3.5 rounded-xl bg-[#001b3d]/60 border border-[#ff751f]/30 text-center">
            <p className="text-[11px] text-slate-200">
              💡 <strong>Cores Oficiais da Marca:</strong> Salmão (<code className="text-[#ff751f] font-mono font-bold">#ff751f</code>), Azul (<code className="text-[#7bb0ff] font-mono font-bold">#001b3d</code>) e Branco (<code className="text-white font-mono font-bold">#ffffff</code>).
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
