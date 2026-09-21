import { useAccessibility, ThemeMode, FontSizeScale } from '../context/AccessibilityContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Moon, Zap, Type, RotateCcw, Eye, Sparkles, Check } from 'lucide-react';

export function AccessibilityModal() {
  const {
    isModalOpen,
    closeModal,
    theme,
    fontSize,
    highContrast,
    setTheme,
    setFontSize,
    toggleHighContrast,
    resetDefaults,
  } = useAccessibility();

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-slate-900 border-2 border-orange-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-white overflow-hidden relative"
          >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Eye size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                  <span>Conforto Visual & Leitura</span>
                  <Sparkles size={16} className="text-orange-400" />
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  Ajuste o tamanho do texto e contraste para facilitar sua leitura.
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Fechar configurações de acessibilidade"
            >
              <X size={20} />
            </button>
          </div>

          {/* 1. Tamanho da Fonte */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black uppercase italic tracking-wide text-white flex items-center gap-2">
                <Type size={18} className="text-orange-500" />
                <span>Tamanho da Letra</span>
              </label>
              <span className="text-xs font-bold text-orange-400 uppercase">
                {fontSize === 'normal' && 'Padrão (100%)'}
                {fontSize === 'large' && 'Grande (+15%)'}
                {fontSize === 'xlarge' && 'Extra Grande (+30%)'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  { id: 'normal', label: 'Padrão', preview: 'Aa' },
                  { id: 'large', label: 'Grande', preview: 'Aa+' },
                  { id: 'xlarge', label: 'Extra', preview: 'AA++' },
                ] as { id: FontSizeScale; label: string; preview: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFontSize(item.id)}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    fontSize === item.id
                      ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-base font-black italic">{item.preview}</span>
                  <span className="text-xs font-bold uppercase">{item.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Aumenta todos os textos, botões e informações das viagens e tabelas no aplicativo.
            </p>
          </div>

          {/* 2. Tema Visual (Claro, Escuro, Alto Contraste) */}
          <div className="space-y-3">
            <label className="text-sm font-black uppercase italic tracking-wide text-white flex items-center gap-2">
              <Sun size={18} className="text-orange-500" />
              <span>Modo de Exibição & Luz</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  {
                    id: 'dark',
                    label: 'Noturno Nítido',
                    desc: 'Ideal para baixa luz',
                    icon: Moon,
                  },
                  {
                    id: 'light',
                    label: 'Modo Claro (Dia)',
                    desc: 'Fundo claro e nítido sob o sol',
                    icon: Sun,
                  },
                  {
                    id: 'high-contrast',
                    label: 'Alto Contraste',
                    desc: 'Preto puro e letras brancas',
                    icon: Zap,
                  },
                ] as { id: ThemeMode; label: string; desc: string; icon: any }[]
              ).map((mode) => {
                const IconComponent = mode.icon;
                const isSelected = theme === mode.id;

                return (
                  <button
                    key={mode.id}
                    onClick={() => setTheme(mode.id)}
                    className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <IconComponent
                        size={20}
                        className={isSelected ? 'text-orange-400' : 'text-slate-400'}
                      />
                      {isSelected && <Check size={16} className="text-orange-400 font-bold" />}
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase italic text-white leading-tight">
                        {mode.label}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">
                        {mode.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Reforço de Nitidez */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase italic text-white flex items-center gap-1.5">
                <Zap size={15} className="text-amber-400" />
                <span>Reforço de Bordas e Contorno</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Destaca bordas e intensifica as cores dos botões e painéis.
              </p>
            </div>
            <button
              onClick={toggleHighContrast}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                highContrast ? 'bg-orange-500' : 'bg-slate-800'
              }`}
              aria-label="Alternar reforço de nitidez"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                  highContrast ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              onClick={resetDefaults}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Restaurar Padrão</span>
            </button>
            <button
              onClick={closeModal}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-orange-600/20 cursor-pointer"
            >
              Aplicar & Fechar
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
