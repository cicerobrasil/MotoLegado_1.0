import React from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-amber-950/90 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <WifiOff size={16} className="animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-white">Modo Offline Ativo</p>
            <p className="text-[10px] text-amber-300/80 font-medium">Você está pilotando sem sinal. Dados em cache disponíveis.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
