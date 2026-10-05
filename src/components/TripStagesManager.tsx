import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Fuel, 
  UtensilsCrossed, 
  Camera, 
  Bed, 
  Flag, 
  Wrench, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  ExternalLink, 
  Sparkles, 
  Check, 
  Loader2, 
  X,
  Share2,
  Info
} from 'lucide-react';
import { apiParseGoogleMapsRoute } from '../lib/api';

export type StageType = 'fuel' | 'food' | 'scenic' | 'sleep' | 'meet' | 'service' | 'custom';

export interface TripStage {
  id: string;
  name: string;
  type: StageType;
  notes?: string;
  kmMark?: string;
  estimatedTime?: string;
}

export const STAGE_TYPE_CONFIG: Record<StageType, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; border: string }> = {
  scenic: {
    label: 'Mirante / Ponto Turístico',
    icon: Camera,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30'
  },
  fuel: {
    label: 'Abastecimento Estratégico',
    icon: Fuel,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30'
  },
  food: {
    label: 'Almoço / Gastronomia',
    icon: UtensilsCrossed,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30'
  },
  sleep: {
    label: 'Pernoite / Hospedagem',
    icon: Bed,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30'
  },
  meet: {
    label: 'Ponto de Encontro / Comboio',
    icon: Flag,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30'
  },
  service: {
    label: 'Oficina / Apoio Técnico',
    icon: Wrench,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30'
  },
  custom: {
    label: 'Parada Geral',
    icon: MapPin,
    color: 'text-slate-300',
    bg: 'bg-slate-800/50',
    border: 'border-slate-700'
  }
};

interface TripStagesManagerProps {
  origin: string;
  setOrigin: (origin: string) => void;
  destination: string;
  setDestination: (destination: string) => void;
  stages: TripStage[];
  setStages: React.Dispatch<React.SetStateAction<TripStage[]>>;
  setTitle?: (title: string) => void;
  currentTitle?: string;
  onMapsUrlGenerated?: (url: string) => void;
  setDistance?: (distance: string) => void;
  setDuration?: (duration: string) => void;
}

export const TripStagesManager: React.FC<TripStagesManagerProps> = ({
  origin,
  setOrigin,
  destination,
  setDestination,
  stages,
  setStages,
  setTitle,
  currentTitle,
  onMapsUrlGenerated,
  setDistance,
  setDuration
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Gera o link oficial do Google Maps com todos os pontos
  const getGoogleMapsDirectionsUrl = () => {
    if (!origin && !destination) return '';
    const originParam = encodeURIComponent(origin || 'Ponto de Partida');
    const destParam = encodeURIComponent(destination || origin || 'Destino');
    const validStages = stages.filter(s => s.name.trim().length > 0);
    const waypointsParam = validStages.length > 0
      ? `&waypoints=${validStages.map(s => encodeURIComponent(s.name.trim())).join('|')}`
      : '';
    return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}${waypointsParam}&travelmode=driving`;
  };

  // Adicionar uma nova etapa/parada manualmente
  const handleAddStage = () => {
    const newStage: TripStage = {
      id: 'stage_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: '',
      type: 'scenic',
      notes: ''
    };
    setStages(prev => [...prev, newStage]);
  };

  // Atualizar campo de uma etapa
  const handleUpdateStage = (id: string, updates: Partial<TripStage>) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Remover etapa
  const handleRemoveStage = (id: string) => {
    setStages(prev => prev.filter(s => s.id !== id));
  };

  // Mover etapa para cima
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setStages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  // Mover etapa para baixo
  const handleMoveDown = (index: number) => {
    if (index >= stages.length - 1) return;
    setStages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  // Processar importação de link ou texto do Google Maps
  const handleProcessImport = async () => {
    const clean = importInput.trim();
    if (!clean) {
      setImportFeedback({ type: 'error', message: 'Cole o link compartilhado do Google Maps ou descreva a rota.' });
      return;
    }

    setIsImporting(true);
    setImportFeedback(null);

    try {
      const res = await apiParseGoogleMapsRoute(clean);
      if (res.error || !res.data || !res.data.success) {
        setImportFeedback({ 
          type: 'error', 
          message: res.error || 'Não foi possível decodificar a rota. Verifique se o link possui origem e destino.' 
        });
        setIsImporting(false);
        return;
      }

      const { 
        origin: parsedOrigin, 
        destination: parsedDest, 
        suggestedStages, 
        title: parsedTitle, 
        fullRouteUrl,
        estimatedDistanceKm,
        estimatedDuration 
      } = res.data;

      if (parsedOrigin) {
        setOrigin(parsedOrigin);
      }
      if (parsedDest) {
        setDestination(parsedDest);
      }

      if (suggestedStages && suggestedStages.length > 0) {
        const newStages: TripStage[] = suggestedStages.map((s, idx) => ({
          id: 'stage_' + Date.now() + '_' + idx,
          name: s.name,
          type: s.type || 'scenic',
          notes: s.notes || ''
        }));
        setStages(newStages);
      }

      // Preenchimento automático da distância e duração
      const finalKm = estimatedDistanceKm || res.data.estimatedDistanceKm;
      const finalDuration = estimatedDuration || res.data.estimatedDuration;

      if (setDistance && finalKm) {
        setDistance(`${finalKm}km`);
      }
      if (setDuration && finalDuration) {
        setDuration(finalDuration);
      }

      if (setTitle && (!currentTitle || currentTitle.trim() === 'EXPEDIÇÃO PERSONALIZADA' || currentTitle.trim() === 'NOVO ROTEIRO')) {
        if (parsedTitle) {
          setTitle(parsedTitle.toUpperCase());
        }
      }

      if (onMapsUrlGenerated && fullRouteUrl) {
        onMapsUrlGenerated(fullRouteUrl);
      }

      const metricDetails = [
        finalKm ? `${finalKm} km` : null,
        finalDuration ? finalDuration : null
      ].filter(Boolean).join(' • ');

      setImportFeedback({ 
        type: 'success', 
        message: `✓ Rota importada! ${metricDetails ? `Distância & Tempo: ${metricDetails} | ` : ''}${suggestedStages?.length || 0} paradas identificadas.` 
      });

      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportInput('');
        setImportFeedback(null);
      }, 1600);

    } catch (err: any) {
      setImportFeedback({ 
        type: 'error', 
        message: 'Erro de comunicação ao processar rota: ' + (err?.message || String(err)) 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const fullMapsUrl = getGoogleMapsDirectionsUrl();

  return (
    <div className="space-y-4 pt-2">
      {/* Barra de Ações e Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-orange-400 flex items-center gap-2">
            <Navigation size={15} className="text-orange-500 animate-pulse" />
            Etapas & Paradas do Roteiro
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {stages.length} {stages.length === 1 ? 'parada' : 'paradas'}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cadastre mirantes, paradas para café, abastecimento e pernoite ao longo do percurso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Importar Google Maps */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Sparkles size={14} className="text-sky-400" />
            <span>Importar do Google Maps</span>
          </button>

          {/* Botão Adicionar Parada */}
          <button
            type="button"
            onClick={handleAddStage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all cursor-pointer shadow-md shadow-orange-500/20 active:scale-95"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Adicionar Parada</span>
          </button>
        </div>
      </div>

      {/* Modal / Expansor de Importação do Google Maps */}
      {isImportModalOpen && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-500/40 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400 font-black text-xs uppercase tracking-wider">
              <Share2 size={16} />
              <span>Importar Roteiro do Google Maps</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsImportModalOpen(false);
                setImportFeedback(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            No aplicativo do Google Maps no celular ou computador, crie seu trajeto com paradas, clique em <strong className="text-white">Compartilhar</strong> e cole o link aqui:
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="Ex: https://maps.app.goo.gl/... ou Curitiba -> Morretes -> Antonina"
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-400 outline-none transition-colors"
            />
            <button
              type="button"
              disabled={isImporting}
              onClick={handleProcessImport}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-sky-500/20"
            >
              {isImporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Calculando Rota...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Processar Rota & Calcular Métricas</span>
                </>
              )}
            </button>
          </div>

          {importFeedback && (
            <div className={`text-xs p-3 rounded-xl border flex items-center gap-2 ${
              importFeedback.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {importFeedback.type === 'success' ? <Check size={15} /> : <Info size={15} />}
              <span>{importFeedback.message}</span>
            </div>
          )}
        </div>
      )}

      {/* TIMELINE VISUAL DE ETAPAS */}
      <div className="relative pl-6 sm:pl-8 space-y-3 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-orange-500 before:to-rose-500">
        
        {/* NÓ DE ORIGEM */}
        <div className="relative flex items-center gap-3">
          <div className="absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30 z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="flex-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">Ponto de Partida</span>
              <span className="text-xs font-bold text-white truncate max-w-[280px] sm:max-w-none block">
                {origin || <span className="text-slate-500 italic">Informe a cidade de origem acima</span>}
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400/80 px-2 py-0.5 rounded-lg bg-emerald-500/10">Início</span>
          </div>
        </div>

        {/* NÓS INTERMEDIÁRIOS (PARADAS / ETAPAS) */}
        {stages.map((stage, index) => {
          const config = STAGE_TYPE_CONFIG[stage.type] || STAGE_TYPE_CONFIG.scenic;
          const IconComp = config.icon;

          return (
            <div key={stage.id} className="relative flex items-start gap-3 group/stage">
              {/* Marcador do Nó */}
              <div className="absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center z-10 group-hover/stage:border-orange-500 transition-colors shadow-sm">
                <span className="text-[10px] font-black text-orange-400">{index + 1}</span>
              </div>

              {/* Card da Etapa */}
              <div className="flex-1 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${config.bg} ${config.color} border ${config.border}`}>
                      <IconComp size={15} />
                    </div>
                    <span className="text-xs font-black uppercase text-slate-300">
                      Parada {index + 1}
                    </span>
                  </div>

                  {/* Seletor de Categoria da Parada */}
                  <div className="flex items-center gap-1">
                    <select
                      value={stage.type}
                      onChange={(e) => handleUpdateStage(stage.id, { type: e.target.value as StageType })}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-300 focus:border-orange-500 outline-none cursor-pointer"
                    >
                      <option value="scenic">📸 Mirante / Ponto Turístico</option>
                      <option value="fuel">⛽ Abastecimento</option>
                      <option value="food">🍽️ Almoço / Gastronomia</option>
                      <option value="sleep">🏨 Pernoite / Hotel</option>
                      <option value="meet">🛣️ Ponto de Encontro</option>
                      <option value="service">🔧 Oficina / Apoio</option>
                      <option value="custom">📍 Parada Geral</option>
                    </select>

                    {/* Botões de Reordenação */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      title="Mover para cima"
                      className="p-1 rounded-md text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={index === stages.length - 1}
                      onClick={() => handleMoveDown(index)}
                      title="Mover para baixo"
                      className="p-1 rounded-md text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown size={15} />
                    </button>

                    {/* Excluir Parada */}
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(stage.id)}
                      title="Remover esta parada"
                      className="p-1 rounded-md text-slate-500 hover:text-red-400 transition-colors ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Campos de Nome do Local e Observações */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => handleUpdateStage(stage.id, { name: e.target.value })}
                    placeholder="Nome do local (ex: Mirante Serra da Graciosa)"
                    className="w-full bg-slate-900/90 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder:text-slate-400 outline-none"
                  />
                  <input
                    type="text"
                    value={stage.notes || ''}
                    onChange={(e) => handleUpdateStage(stage.id, { notes: e.target.value })}
                    placeholder="Observação (ex: Café, foto e abastecer podium)"
                    className="w-full bg-slate-900/90 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* NÓ DE DESTINO */}
        <div className="relative flex items-center gap-3">
          <div className="absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border-2 border-rose-500 flex items-center justify-center shadow-md shadow-rose-500/30 z-10">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="flex-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">Ponto de Chegada</span>
              <span className="text-xs font-bold text-white truncate max-w-[280px] sm:max-w-none block">
                {destination || <span className="text-slate-500 italic">Informe a cidade de destino acima</span>}
              </span>
            </div>
            <span className="text-[10px] font-bold text-rose-400/80 px-2 py-0.5 rounded-lg bg-rose-500/10">Destino</span>
          </div>
        </div>

      </div>

      {/* Botões de Rodapé: Contagem e Navegação no Google Maps */}
      {origin && destination && (
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-[11px] text-slate-400 font-medium">
            Roteiro com <strong className="text-white">{stages.length + 2} pontos</strong> no trajeto.
          </span>

          <a
            href={fullMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition-all hover:scale-105"
          >
            <ExternalLink size={13} />
            <span>Navegar Trajeto com {stages.length} {stages.length === 1 ? 'Parada' : 'Paradas'} no Google Maps</span>
          </a>
        </div>
      )}
    </div>
  );
};
