import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallButton } from './PWAInstallButton';

export const PWAInstallBanner: React.FC = () => {
  const { isInstalled } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('motolegado_pwa_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  if (isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('motolegado_pwa_banner_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-18 lg:bottom-5 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900/95 border border-orange-500/30 rounded-2xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(234,88,12,0.4)] shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase italic tracking-tight text-white">
                  Instalar MotoLegado
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[8px] font-black uppercase tracking-wider">
                  <Sparkles size={8} /> PWA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                Acesse instantâneo direto da sua tela inicial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton variant="header" className="py-2 px-3 text-[11px]" />
            <button
              type="button"
              onClick={handleDismiss}
              className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Dispensar banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
