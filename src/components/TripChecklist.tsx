import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  FileText, 
  Wrench, 
  Shield, 
  Smartphone, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Copy, 
  Check, 
  Package,
  Layers,
  Search,
  X,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { TripChecklistItem, ChecklistCategory } from '../types';

interface TripChecklistProps {
  onTripStartReady?: () => void;
  onClose?: () => void;
  compact?: boolean;
}

const DEFAULT_CHECKLIST_ITEMS: Omit<TripChecklistItem, 'completed'>[] = [
  // Documentos & Identificação
  {
    id: 'doc-cnh',
    category: 'documents',
    label: 'CNH Original ou CNH Digital atualizada',
    description: 'Verifique a validade da habilitação na carteira digital.',
    isRequired: true,
  },
  {
    id: 'doc-crlv',
    category: 'documents',
    label: 'Documento da Moto (CRLV-e quitado)',
    description: 'Comprovante de licenciamento do ano corrente baixado em PDF.',
    isRequired: true,
  },
  {
    id: 'doc-insurance',
    category: 'documents',
    label: 'Telefone do Seguro / Assistência 24h (Guincho)',
    description: 'Salve o número com DDD e o cartão da apólice no celular.',
    isRequired: true,
  },
  {
    id: 'doc-cash',
    category: 'documents',
    label: 'Dinheiro em espécie para pedágios e balsas',
    description: 'Muitos pedágios do interior ainda não aceitam Pix ou cartão.',
    isRequired: false,
  },

  // Peças Sobressalentes & Reparos
  {
    id: 'part-tire-repair',
    category: 'parts',
    label: 'Kit Reparo de Pneu (Macarrão ou Câmara Reserva)',
    description: 'Inclui aplicador, lixa, cola e tubos ou cápsulas de CO2.',
    isRequired: true,
  },
  {
    id: 'part-chain-link',
    category: 'parts',
    label: 'Emenda de Corrente de Transmissão (Master Link)',
    description: 'Tenha o elo compatível com o passo da sua corrente (ex: 520 ou 525).',
    isRequired: true,
  },
  {
    id: 'part-fuse-bulb',
    category: 'parts',
    label: 'Fusíveis reserva (10A, 15A, 30A) e Lâmpadas',
    description: 'Verifique a caixa de fusíveis da moto antes de sair.',
    isRequired: true,
  },
  {
    id: 'part-cables',
    category: 'parts',
    label: 'Cabos de Embreagem / Acelerador e Quebra-Galho',
    description: 'Ou kit universal de cabos e niples de aperto rápido.',
    isRequired: false,
  },
  {
    id: 'part-chain-lube',
    category: 'parts',
    label: 'Spray Lubrificante de Corrente portátil',
    description: 'Lubrifique a cada 400-500 km rodados ou após chuva forte.',
    isRequired: true,
  },

  // Ferramentas Mecânicas
  {
    id: 'tool-hex-torx',
    category: 'tools',
    label: 'Jogo de Chaves Allen (Hex) / Torx da moto',
    description: 'Medidas mais comuns do chassi e carenagens da sua motocicleta.',
    isRequired: true,
  },
  {
    id: 'tool-wrenches',
    category: 'tools',
    label: 'Chaves combinadas (8, 10, 12, 14, 17mm)',
    description: 'Essenciais para ajuste de espelho, pedais, roda e esticador de corrente.',
    isRequired: true,
  },
  {
    id: 'tool-pliers-wire',
    category: 'tools',
    label: 'Alicate multiuso ou de pressão + Fita Isolante',
    description: 'Permite desentortar pedais e fixar componentes soltos no asfalto.',
    isRequired: true,
  },
  {
    id: 'tool-zip-ties',
    category: 'tools',
    label: 'Abraçadeiras de Nylon (Enforca-Gato / Silver Tape)',
    description: 'Salva carenagens, retrovisores e bagageiros em qualquer emergência.',
    isRequired: true,
  },
  {
    id: 'tool-inflator',
    category: 'tools',
    label: 'Mini Bomba ou Calibrador Portátil Elétrico',
    description: 'Para conferir a calibragem com pneu frio nos postos de combustível.',
    isRequired: false,
  },

  // Equipamentos de Segurança & Piloto
  {
    id: 'safe-helmet-visor',
    category: 'safety',
    label: 'Capacete com viseira limpa (sem riscos) + Viseira Cristal',
    description: 'Se usar viseira fumê de dia, leve a transparente para pilotagem noturna.',
    isRequired: true,
  },
  {
    id: 'safe-jacket-pants',
    category: 'safety',
    label: 'Jaqueta e Calça com proteções CE (ombro, cotovelo, joelho)',
    description: 'Equipamento técnico de cordura ou couro ajustado ao corpo.',
    isRequired: true,
  },
  {
    id: 'safe-gloves-boots',
    category: 'safety',
    label: 'Luvas de cano longo e Botas de pilotagem com proteção de tornozelo',
    description: 'Protege contra detritos na rodovia e quedas em baixa velocidade.',
    isRequired: true,
  },
  {
    id: 'safe-rain-suit',
    category: 'safety',
    label: 'Capa de Chuva e Polainas impermeáveis',
    description: 'Acondicione na parte mais acessível do baú ou alforje.',
    isRequired: true,
  },
  {
    id: 'safe-first-aid',
    category: 'safety',
    label: 'Kit Primeiros Socorros básico (Gaze, antisséptico, analgésico)',
    description: 'Inclua seus medicamentos de uso contínuo para a duração da viagem.',
    isRequired: true,
  },

  // Logística, Eletrônicos & Conforto
  {
    id: 'log-powerbank',
    category: 'logistics',
    label: 'Powerbank de alta capacidade + Cabo de celular reserva',
    description: 'Garanta energia para o GPS caso a tomada 12V/USB da moto falhe.',
    isRequired: true,
  },
  {
    id: 'log-offline-maps',
    category: 'logistics',
    label: 'Mapas baixados Offline (Google Maps / Organic Maps)',
    description: 'Faça o download das regiões sem sinal de celular no trajeto.',
    isRequired: true,
  },
  {
    id: 'log-spare-key',
    category: 'logistics',
    label: 'Chave reserva da moto guardada com o garupa ou em bolso seguro',
    description: 'Nunca deixe a chave reserva trancada dentro do baú da própria moto.',
    isRequired: true,
  },
  {
    id: 'log-straps',
    category: 'logistics',
    label: 'Elásticos / Aranha (Rede de bagagem) e Cintas de fixação extra',
    description: 'Reaperte a amarração a cada parada de abastecimento.',
    isRequired: false,
  }
];

const CATEGORY_META: Record<ChecklistCategory, { label: string; shortLabel: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  documents: {
    label: 'Documentos',
    shortLabel: 'Docs',
    icon: FileText,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
  },
  parts: {
    label: 'Peças & Reparos',
    shortLabel: 'Peças',
    icon: Package,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  },
  tools: {
    label: 'Ferramentas',
    shortLabel: 'Ferramentas',
    icon: Wrench,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30'
  },
  safety: {
    label: 'Segurança & Equipamento',
    shortLabel: 'Segurança',
    icon: Shield,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  logistics: {
    label: 'Eletrônicos & Conforto',
    shortLabel: 'Eletrônicos',
    icon: Smartphone,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  }
};

const STORAGE_KEY = 'motolegado_trip_checklist_v1';

export function TripChecklist({ onTripStartReady, onClose, compact = false }: TripChecklistProps) {
  const [items, setItems] = useState<TripChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar checklist do localStorage', e);
    }
    return DEFAULT_CHECKLIST_ITEMS.map(it => ({ ...it, completed: false }));
  });

  const [activeCategory, setActiveCategory] = useState<ChecklistCategory | 'all'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistCategory>('tools');
  const [newIsRequired, setNewIsRequired] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isDesktopFullScreen, setIsDesktopFullScreen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Erro ao persistir checklist', e);
    }
  }, [items]);

  // Lock body scroll on mobile off-canvas to ensure smooth touch handling
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    // On small screens, prevent the background page from scrolling
    if (window.innerWidth < 768 || isDesktopFullScreen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isDesktopFullScreen]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newItem: TripChecklistItem = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      category: newCategory,
      isRequired: newIsRequired,
      completed: false,
      isCustom: true
    };

    setItems(prev => [newItem, ...prev]);
    setNewLabel('');
    setIsAddingCustom(false);

    // Scroll to top of list smoothly to show the new item
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckAll = () => {
    setItems(prev => prev.map(item => ({ ...item, completed: true })));
  };

  const handleUncheckAll = () => {
    if (window.confirm('Deseja desmarcar todos os itens e começar uma nova checagem para a próxima viagem?')) {
      setItems(prev => prev.map(item => ({ ...item, completed: false })));
    }
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Restaurar os itens originais recomendados pelo MotoLegado? Seus itens personalizados serão mantidos.')) {
      const customItems = items.filter(i => i.isCustom);
      const defaults = DEFAULT_CHECKLIST_ITEMS.map(it => ({ ...it, completed: false }));
      setItems([...defaults, ...customItems]);
    }
  };

  // Metrics
  const totalCount = items.length;
  const completedCount = items.filter(i => i.completed).length;
  const requiredCount = items.filter(i => i.isRequired).length;
  const completedRequiredCount = items.filter(i => i.isRequired && i.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isReadyForTrip = requiredCount > 0 && completedRequiredCount === requiredCount;

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // Status filter
      if (filterMode === 'pending' && item.completed) {
        return false;
      }
      if (filterMode === 'completed' && !item.completed) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesLabel = item.label.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        return matchesLabel || matchesDesc;
      }
      return true;
    });
  }, [items, activeCategory, filterMode, searchQuery]);

  // Copy formatted WhatsApp summary
  const handleCopySummary = async () => {
    const lines: string[] = [];
    lines.push(`🏍️ *CHECKLIST PRÉ-VIAGEM - MOTOLEGADO*`);
    lines.push(`📊 *Progresso Geral:* ${progressPercent}% (${completedCount}/${totalCount} itens checados)`);
    lines.push(`🚨 *Itens Obrigatórios:* ${completedRequiredCount}/${requiredCount} concluídos`);
    lines.push(`Status: ${isReadyForTrip ? '✅ PRONTO PARA O ASFALTO' : '⚠️ ATENÇÃO: PENDÊNCIAS RESTANTES'}`);
    lines.push(``);

    const categories: ChecklistCategory[] = ['documents', 'parts', 'tools', 'safety', 'logistics'];
    categories.forEach(cat => {
      const catItems = items.filter(i => i.category === cat);
      if (catItems.length === 0) return;
      lines.push(`*${CATEGORY_META[cat].label.toUpperCase()}*`);
      catItems.forEach(i => {
        lines.push(`${i.completed ? '✅' : '⬜'} ${i.label}${i.isRequired ? ' *(Obrigatório)*' : ''}`);
      });
      lines.push(``);
    });

    lines.push(`_Gerado pelo MotoLegado - Diário de Bordo Oficial_`);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar checklist', err);
    }
  };

  return (
    <div 
      className={cn(
        // Mobile: Off-canvas full-screen overlay with fixed viewport isolation
        // Desktop: Clean embedded view or full-screen overlay when toggled
        "fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 h-[100dvh] max-h-[100dvh] overflow-hidden select-none",
        isDesktopFullScreen 
          ? "md:fixed md:inset-0 md:z-50 md:h-[100dvh] md:max-h-[100dvh]" 
          : "md:relative md:inset-auto md:z-auto md:h-auto md:max-h-none md:overflow-visible md:bg-transparent"
      )}
    >
      
      {/* =========================================================================
          1. STICKY TOP HEADER (Always accessible, above any mobile menus or keyboard)
          ========================================================================= */}
      <header className={cn(
        "shrink-0 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/90 flex items-center justify-between gap-3 z-20",
        compact ? "px-3 py-2.5" : "px-4 sm:px-6 py-3.5"
      )}>
        
        {/* Left: Back / Close & Title */}
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              aria-label="Voltar para a página anterior"
            >
              <ArrowLeft size={18} />
              <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Voltar</span>
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                <Wrench size={13} />
              </div>
              <h2 className="text-sm sm:text-base font-black italic uppercase tracking-tight text-white truncate">
                CHECKLIST <span className="text-orange-500">PRÉ-VIAGEM</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isReadyForTrip ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              )} />
              <p className="text-[10px] font-bold text-slate-400 truncate">
                {isReadyForTrip ? 'Moto liberada pro asfalto' : `${requiredCount - completedRequiredCount} obrigatórios pendentes`}
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions: Share, Fullscreen Toggle (desktop) & Close Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* WhatsApp Share Button */}
          <button
            onClick={handleCopySummary}
            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            title="Copiar resumo para WhatsApp"
          >
            {copiedSummary ? (
              <>
                <Check size={13} className="text-emerald-400 shrink-0" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={13} className="text-slate-400 shrink-0" />
                <span className="hidden sm:inline">Compartilhar</span>
                <span className="sm:hidden">Zap</span>
              </>
            )}
          </button>

          {/* Desktop Fullscreen Toggle */}
          <button
            onClick={() => setIsDesktopFullScreen(prev => !prev)}
            className="hidden md:flex p-2 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-xl transition-all cursor-pointer"
            title={isDesktopFullScreen ? "Sair do modo tela cheia" : "Modo Oficina / Tela Cheia"}
          >
            {isDesktopFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
              aria-label="Fechar Checklist"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>


      {/* =========================================================================
          2. STICKY SUB-BAR (Progress, Action Controls & Responsive Filters)
          ========================================================================= */}
      <div className="shrink-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 space-y-3 z-10">
        
        {/* Progress bar and Quick Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Progress Indicator */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 max-w-xs bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  isReadyForTrip 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
              <span className={cn("font-black", isReadyForTrip ? "text-emerald-400" : "text-orange-400")}>
                {progressPercent}%
              </span>
              <span className="text-slate-500">
                ({completedCount}/{totalCount})
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            {onTripStartReady && (
              <button
                onClick={onTripStartReady}
                className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-600/30"
                title="Iniciar registro no diário de bordo"
              >
                <CheckCircle2 size={13} className="shrink-0" />
                <span>Iniciar Viagem</span>
              </button>
            )}

            <button
              onClick={() => setIsAddingCustom(true)}
              className="py-1.5 px-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-orange-600/30"
            >
              <Plus size={13} className="shrink-0" />
              <span>Novo Item</span>
            </button>

            <button
              onClick={handleCheckAll}
              className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
              title="Marcar todos os itens como concluídos"
            >
              Marcar Todos
            </button>

            <button
              onClick={handleUncheckAll}
              className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
              title="Limpar todas as marcações"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Categories Horizontal Scroll Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "py-1.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
              activeCategory === 'all'
                ? "bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/30"
                : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white"
            )}
          >
            <Layers size={13} />
            <span>Todos</span>
            <span className="text-[10px] font-mono opacity-80">({completedCount}/{totalCount})</span>
          </button>

          {(Object.keys(CATEGORY_META) as ChecklistCategory[]).map(catKey => {
            const meta = CATEGORY_META[catKey];
            const CatIcon = meta.icon;
            const count = items.filter(i => i.category === catKey).length;
            const done = items.filter(i => i.category === catKey && i.completed).length;

            return (
              <button
                key={catKey}
                onClick={() => setActiveCategory(catKey)}
                className={cn(
                  "py-1.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
                  activeCategory === catKey
                    ? "bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/30"
                    : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white"
                )}
              >
                <CatIcon size={13} />
                <span>{meta.shortLabel}</span>
                <span className={cn(
                  "text-[10px] font-mono px-1 rounded",
                  done === count && count > 0 ? "text-emerald-400 font-bold" : "opacity-80"
                )}>
                  ({done}/{count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Status Filter (text-base on mobile prevents iOS keyboard auto-zoom!) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-0.5">
          <div className="relative sm:col-span-7">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar item, ferramenta ou documento..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-base sm:text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                aria-label="Limpar busca"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="sm:col-span-5">
            <select
              value={filterMode}
              onChange={e => setFilterMode(e.target.value as any)}
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-300 text-base sm:text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">Filtro: Ver Todos ({totalCount})</option>
              <option value="pending">Apenas Pendentes ({totalCount - completedCount})</option>
              <option value="completed">Apenas Concluídos ({completedCount})</option>
            </select>
          </div>
        </div>

      </div>


      {/* =========================================================================
          3. SCROLLABLE BODY (Accessible items list, responsive to virtual keyboard)
          ========================================================================= */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-4 sm:px-6 py-4 space-y-4 pb-24 md:pb-12"
      >
        
        {/* Empty Search / Filter Result */}
        {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-slate-900/30 border border-dashed border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <CheckCircle2 size={22} />
            </div>
            <h3 className="text-base font-black italic uppercase text-white tracking-wide">
              {searchQuery ? 'Nenhum item encontrado' : 'Nenhum item neste filtro'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery 
                ? `Não encontramos nada correspondente a "${searchQuery}".` 
                : 'Você completou todos os itens desta categoria ou filtro.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn-secondary py-2 px-4 text-xs font-bold uppercase tracking-wider"
              >
                Limpar Busca
              </button>
            )}
          </div>
        ) : activeCategory === 'all' && !searchQuery.trim() ? (
          /* Grouped by category when viewing ALL */
          <div className="space-y-6">
            {(Object.keys(CATEGORY_META) as ChecklistCategory[]).map(catKey => {
              const catItems = filteredItems.filter(i => i.category === catKey);
              if (catItems.length === 0) return null;
              const meta = CATEGORY_META[catKey];
              const CatIcon = meta.icon;
              const catDone = catItems.filter(i => i.completed).length;

              return (
                <section key={catKey} className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-lg border", meta.color)}>
                        <CatIcon size={14} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        {meta.label}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                        {catDone}/{catItems.length}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveCategory(catKey)}
                      className="text-[10px] text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Apenas esta →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                    {catItems.map(item => (
                      <ChecklistItemCard 
                        key={item.id} 
                        item={item} 
                        onToggle={() => toggleItem(item.id)} 
                        onDelete={() => handleDeleteItem(item.id)} 
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Flat list for single category or active search */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            {filteredItems.map(item => (
              <ChecklistItemCard 
                key={item.id} 
                item={item} 
                onToggle={() => toggleItem(item.id)} 
                onDelete={() => handleDeleteItem(item.id)} 
              />
            ))}
          </div>
        )}

        {/* Road Advice & Defaults Restore Footer */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs">
          <p className="text-[11px] font-medium text-slate-400 text-center sm:text-left">
            💡 <strong>Dica do Piloto:</strong> Verifique calibragem com os pneus frios e lubrifique a relação a cada 400 km rodados.
          </p>

          <button
            onClick={handleRestoreDefaults}
            className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-orange-400 transition-colors shrink-0 cursor-pointer"
          >
            Restaurar Itens Originais
          </button>
        </div>

      </div>


      {/* =========================================================================
          4. MODAL / BOTTOM SHEET: ADICIONAR NOVO ITEM (KEYBOARD-SAFE)
          ========================================================================= */}
      <AnimatePresence>
        {isAddingCustom && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            
            {/* Backdrop click to dismiss */}
            <div 
              className="absolute inset-0" 
              onClick={() => setIsAddingCustom(false)} 
            />

            {/* Modal Card */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-slate-900 border border-orange-500/40 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Plus size={15} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Novo Item no Checklist
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                    Nome do Item / Equipamento
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="Ex: Carregador por indução, Óleo 20W50 500ml..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-base text-white placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as ChecklistCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-base sm:text-xs font-bold text-white outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="documents">Documentos & Identificação</option>
                    <option value="parts">Peças Sobressalentes & Reparos</option>
                    <option value="tools">Ferramentas Mecânicas</option>
                    <option value="safety">Segurança & Equipamento do Piloto</option>
                    <option value="logistics">Eletrônicos & Conforto</option>
                  </select>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newIsRequired}
                      onChange={e => setNewIsRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 bg-slate-900 border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Item Obrigatório</span>
                      <span className="text-[10px] text-slate-400 block">Exigido para a liberação de viagem no status geral</span>
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="btn-secondary py-3 text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-primary py-3 text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Salvar Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

/**
 * Subcomponent: Individual Checklist Item Card
 * Optimized for touch targets on mobile (min 56px height) and rapid tapping with motorcycle gloves.
 */
function ChecklistItemCard({ 
  item, 
  onToggle, 
  onDelete 
}: { 
  item: TripChecklistItem; 
  onToggle: () => void; 
  onDelete: () => void; 
}) {
  const meta = CATEGORY_META[item.category];
  const CatIcon = meta.icon;

  return (
    <div
      onClick={onToggle}
      className={cn(
        "p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-start justify-between gap-3 group active:scale-[0.99]",
        item.completed
          ? "bg-slate-950/70 border-emerald-500/25 hover:border-emerald-500/40"
          : "bg-slate-900/60 border-slate-800/80 hover:border-orange-500/40 hover:bg-slate-900"
      )}
    >
      {/* Left Check Icon & Content */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="mt-0.5 shrink-0 text-slate-500 group-hover:text-orange-400 transition-colors p-0.5"
          aria-label={item.completed ? "Desmarcar item" : "Marcar item"}
        >
          {item.completed ? (
            <CheckCircle2 size={20} className="text-emerald-400 fill-emerald-500/20" />
          ) : (
            <Circle size={20} className="text-slate-600 group-hover:text-orange-400" />
          )}
        </button>

        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn(
              "text-xs font-bold leading-snug transition-colors",
              item.completed 
                ? "text-slate-400 line-through decoration-slate-600" 
                : "text-white"
            )}>
              {item.label}
            </span>

            {item.isRequired && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[9px] font-black uppercase tracking-wider shrink-0">
                Obrigatório
              </span>
            )}

            {item.isCustom && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[9px] font-black uppercase tracking-wider shrink-0">
                Personalizado
              </span>
            )}
          </div>

          {item.description && (
            <p className={cn(
              "text-[11px] leading-relaxed",
              item.completed ? "text-slate-600" : "text-slate-400"
            )}>
              {item.description}
            </p>
          )}

          {/* Category Pill */}
          <div className="pt-0.5">
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider",
              meta.color
            )}>
              <CatIcon size={9} />
              <span>{meta.label}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Action: Delete if custom */}
      {item.isCustom && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors shrink-0 cursor-pointer"
          title="Excluir item personalizado"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
