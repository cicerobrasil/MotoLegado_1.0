import React, { useState } from 'react';
import { Smartphone, Download, Share2, PlusSquare, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { cn } from '../lib/utils';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'header' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'sidebar',
  className 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running standalone, do not show
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Fallback guide for iOS Safari or manual installation instructions
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer group text-left",
            "bg-gradient-to-r from-orange-600/15 via-orange-500/10 to-amber-500/5 border-orange-500/30 hover:border-orange-500/60 hover:from-orange-600/25",
            className
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-105 group-hover:bg-orange-600 group-hover:text-white transition-all shrink-0">
              <Smartphone size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase italic tracking-wider text-white group-hover:text-orange-400 transition-colors">
                Instalar no Celular
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                App PWA • Sem Loja
              </p>
            </div>
          </div>
          <Download size={14} className="text-orange-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
        </button>
      )}

      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-600/20 border border-orange-500/40 text-orange-400 hover:bg-orange-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer",
            className
          )}
        >
          <Smartphone size={13} />
          <span>Instalar App</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={cn(
            "w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all cursor-pointer",
            className
          )}
          title="Instalar MotoLegado no seu celular"
        >
          <Download size={16} />
        </button>
      )}

      {/* Installation Instruction Modal for iOS / Safari / Unsupported Prompt */}
      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black italic uppercase text-white tracking-tight">
                      Instalar MotoLegado
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {isIOS ? 'Guia para iPhone / iPad (Safari)' : 'Instalação Rápida'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Steps */}
              <div className="mt-5 space-y-4">
                {isIOS ? (
                  <>
                    <div className="flex items-start gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                        <Share2 size={15} />
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="font-bold text-white block mb-0.5">1. Toque em Compartilhar</span>
                        No rodapé do Safari do iPhone, toque no ícone de compartilhamento (quadrado com seta apontando para cima).
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                        <PlusSquare size={15} />
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="font-bold text-white block mb-0.5">2. Adicionar à Tela de Início</span>
                        Role para baixo no menu e selecione a opção <strong>"Adicionar à Tela de Início"</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                        <CheckCircle2 size={15} />
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="font-bold text-white block mb-0.5">3. Pronto para Pilotar!</span>
                        O ícone do MotoLegado aparecerá como um app nativo na sua tela, sem barras de navegador.
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                        <Download size={15} />
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="font-bold text-white block mb-0.5">Menu do Navegador</span>
                        Abra o menu de opções do seu navegador (três pontos no canto superior direito do Chrome / Edge).
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                        <Smartphone size={15} />
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="font-bold text-white block mb-0.5">Instalar Aplicativo</span>
                        Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Selo de Segurança e Verificação */}
              <div className="mt-4 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-slate-300">
                  <span className="font-bold text-emerald-400 block">Tecnologia PWA Oficial & Segura</span>
                  O MotoLegado roda direto do navegador oficial. Não instala arquivos executáveis estranhos, não lê suas fotos ou arquivos e não ocupa espaço de armazenamento.
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Entendi, Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
