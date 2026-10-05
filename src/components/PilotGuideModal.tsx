import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  BookOpen,
  Route,
  Trophy,
  Shield,
  Store,
  CheckSquare,
  Search,
  Sparkles,
  ExternalLink,
  X,
  Gauge,
  Award,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Flame,
  Wrench,
  Fuel,
  Users,
  Eye,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useTour } from '../context/TourContext';
import { cn } from '../lib/utils';

type CategoryFilter = 'all' | 'telemetry' | 'logbook' | 'gamification' | 'routes' | 'motoclub' | 'partners' | 'safety';

interface GuideTopic {
  id: string;
  category: CategoryFilter;
  categoryLabel: string;
  title: string;
  summary: string;
  icon: typeof Compass;
  badgeColor: string;
  badgeBg: string;
  routePath?: string;
  routeLabel?: string;
  content: React.ReactNode;
}

export function PilotGuideModal() {
  const { isGuideModalOpen, closeGuideModal, startTour } = useTour();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Pre-trip checklist state stored locally
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    pneus: false,
    oleo: false,
    relacao: false,
    freios: false,
    eletrica: false,
    bagagem: false,
    equipamento: false
  });

  const toggleChecklistItem = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedChecklistCount = Object.values(checklist).filter(Boolean).length;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGuideModalOpen) {
        closeGuideModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGuideModalOpen, closeGuideModal]);

  const topics: GuideTopic[] = useMemo(() => [
    {
      id: 'telemetry',
      category: 'telemetry',
      categoryLabel: 'Telemetria & Painel',
      title: 'Central de Telemetria & Odômetro',
      summary: 'Acompanhe seus quilômetros acumulados, velocidade média e gráfico de viagens em tempo real.',
      icon: Gauge,
      badgeColor: 'text-orange-400',
      badgeBg: 'bg-orange-500/15 border-orange-500/30',
      routePath: '/dashboard',
      routeLabel: 'Ir para Central do Piloto',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            O painel central de telemetria é o coração do piloto no <strong>MotoLegado</strong>. Ele resume todas as suas estatísticas de pilotagem atualizadas automaticamente a cada novo registro do seu Diário de Bordo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider block">Odômetro Geral</span>
              <p className="text-white font-bold mt-0.5">Soma total de todos os KMs percorridos em viagens validadas.</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Gráfico Mensal</span>
              <p className="text-white font-bold mt-0.5">Evolução de quilometragem por mês para acompanhar sua frequência na estrada.</p>
            </div>
          </div>
          <p className="text-slate-400 text-xs">
            💡 <em>Dica: Mesmo pilotos sem viagens anteriores contam com uma telemetria demonstrativa para conhecer a estrutura do gráfico e das métricas.</em>
          </p>
        </div>
      )
    },
    {
      id: 'logbook',
      category: 'logbook',
      categoryLabel: 'Diário de Bordo',
      title: 'Como Registrar Viagens & Fotos',
      summary: 'Cadastre suas viagens de moto, adicione fotos das paradas e calcule sua pontuação automaticamente.',
      icon: BookOpen,
      badgeColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30',
      routePath: '/logbook',
      routeLabel: 'Abrir Diário de Bordo',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            O <strong>Diário de Bordo</strong> é a sua caderneta digital na estrada. Cada viagem registrada documenta seu legado e calcula automaticamente a distância percorrida.
          </p>
          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-white block">Odômetro Inicial e Final</strong>
                <span className="text-slate-400 text-xs">Basta digitar a quilometragem de saída e de chegada. O sistema calcula a distância real percorrida na hora.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-white block">Fotos da Estrada & Paisagens</strong>
                <span className="text-slate-400 text-xs">Envie fotos tiradas na hora pelo celular ou da galeria. Elas ficam salvas no servidor e aparecem no mural.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-white block">Cálculo de Pontos para o Ranking</strong>
                <span className="text-slate-400 text-xs">Cada KM rodado rende pontos para subir de patente e conquistar novas insígnias estradeiras.</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'gamification',
      category: 'gamification',
      categoryLabel: 'Patentes & Ranking',
      title: 'Sistema de Patentes e Pontuação',
      summary: 'Conheça os 5 níveis de patente estradeira e saiba como acumular pontos para alcançar o topo.',
      icon: Trophy,
      badgeColor: 'text-yellow-400',
      badgeBg: 'bg-yellow-500/15 border-yellow-500/30',
      routePath: '/ranking',
      routeLabel: 'Ver Ranking Global',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            No MotoLegado, seu respeito na estrada é medido em quilômetros reais rodados. O sistema possui <strong>5 patentes progressivas</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">🥉 Asfalto (0 a 499 pts)</span>
              <p className="text-slate-300 text-xs mt-0.5">Primeiros passos e primeiras curvas na plataforma.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-blue-500/30">
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">🥈 Cruzador (500 a 1.499 pts)</span>
              <p className="text-slate-300 text-xs mt-0.5">Piloto assíduo dos passeios e bate-voltas de fim de semana.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-purple-500/30">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">🥇 Veterano (1.500 a 3.499 pts)</span>
              <p className="text-slate-300 text-xs mt-0.5">Experiência consolidada em viagens estaduais e interestaduais.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-orange-500/30">
              <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider">🛡️ Guardião (3.500 a 6.999 pts)</span>
              <p className="text-slate-300 text-xs mt-0.5">Líder de comboio respeitado com centenas de horas na estrada.</p>
            </div>
            <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/40">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <span>👑</span> Lenda do Asfalto (7.000+ pts)
              </span>
              <p className="text-slate-300 text-xs mt-0.5">O mais alto escalão estradeiro do MotoLegado, homenageado no hall de honra.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'routes',
      category: 'routes',
      categoryLabel: 'Rotas & GPS',
      title: 'Roteiros Estradeiros & Alertas',
      summary: 'Descubra rotas recomendadas por motociclistas com avisos de curvas, pavimento e paradas.',
      icon: Route,
      badgeColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
      routePath: '/routes',
      routeLabel: 'Explorar Roteiros',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Navegue por roteiros selecionados a dedo pela comunidade com informações cruciais para quem viaja em duas rodas:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-300">
            <li><strong>Condições do Asfalto:</strong> Alertas sobre trechos em obras, buracos ou pista escorregadia.</li>
            <li><strong>Pontos de Apoio:</strong> Postos com combustível de alta octanagem, borracharias e lanchonetes estradeiras.</li>
            <li><strong>Curvas e Paisagens:</strong> Graus de dificuldade de curvas (serra, serpiginosas) e mirantes para fotos.</li>
            <li><strong>Traçado GPX:</strong> Baixe arquivos para carregar diretamente no seu GPS Garmin ou celular.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'motoclub',
      category: 'motoclub',
      categoryLabel: 'Clubes & Irmandades',
      title: 'Moto Clubes Oficiais & Coletes',
      summary: 'Conheça irmandades registradas, acompanhe murais internos e exiba seu brasão.',
      icon: Shield,
      badgeColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/15 border-blue-500/30',
      routePath: '/motoclub',
      routeLabel: 'Conhecer Moto Clubes',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            O MotoLegado integra a cultura dos Moto Clubes, Motogrupos e Irmandades de todo o Brasil:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <strong className="text-white text-xs block">Brasão no Perfil</strong>
              <p className="text-slate-400 text-xs mt-0.5">Integrantes aprovados exibem o escudo do seu clube no perfil público e rankings.</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <strong className="text-white text-xs block">Mural de Avisos</strong>
              <p className="text-slate-400 text-xs mt-0.5">Comunicação direta com o comando do clube sobre passeios, aniversários e encontros.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'partners',
      category: 'partners',
      categoryLabel: 'Parceiros Oficiais',
      title: 'Rede de Vantagens & Descontos',
      summary: 'Economize em oficinas mecânicas, pousadas e postos de combustível credenciados.',
      icon: Store,
      badgeColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/15 border-purple-500/30',
      routePath: '/partners',
      routeLabel: 'Ver Parceiros Oficiais',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Pilotos ativos no MotoLegado contam com descontos de <strong>10% a 25%</strong> em estabelecimentos homologados:
          </p>
          <div className="space-y-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <strong className="text-white text-xs block">Oficinas Mecânicas & Pneus</strong>
                <span className="text-slate-400 text-[11px]">Revisões periódicas, troca de óleo e montagem de pneus.</span>
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">15% a 25% OFF</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <strong className="text-white text-xs block">Pousadas & Hotéis Estradeiros</strong>
                <span className="text-slate-400 text-[11px]">Estacionamento coberto para motos e café da manhã antecipado.</span>
              </div>
              <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/30">10% a 20% OFF</span>
            </div>
          </div>
          <p className="text-slate-400 text-xs">
            Basta apresentar a tela do seu perfil do MotoLegado no caixa do estabelecimento parceiro.
          </p>
        </div>
      )
    },
    {
      id: 'safety',
      category: 'safety',
      categoryLabel: 'Segurança & Checklist',
      title: 'Checklist Mecânico Pré-Viagem (7 Pontos)',
      summary: 'Verificação vital de 7 itens antes de girar a chave e acelerar na estrada.',
      icon: CheckSquare,
      badgeColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/15 border-rose-500/30',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            A segurança começa antes de ligar o motor. Utilize este checklist interativo antes de cada viagem:
          </p>
          <div className="space-y-2 pt-1">
            {[
              { key: 'pneus', label: '1. Pneus & Calibragem', desc: 'Calibragem correta a frio (conforme manual com/sem carga) e verificação do indicador TWI.' },
              { key: 'oleo', label: '2. Nível do Óleo do Motor', desc: 'Verificar com a moto nivelada e motor frio. Troca em dia para evitar superaquecimento.' },
              { key: 'relacao', label: '3. Relação / Transmissão', desc: 'Folga da corrente entre 2 a 3 cm e lubrificação com spray apropriado.' },
              { key: 'freios', label: '4. Pastilhas & Fluido de Freio', desc: 'Espessura mínima das pastilhas e nível do reservatório DOT sem vazamentos.' },
              { key: 'eletrica', label: '5. Iluminação & Sinalização', desc: 'Farol alto/baixo, lanterna traseira, luz de freio e quatro piscas funcionando.' },
              { key: 'bagagem', label: '6. Bagageiro & Fixação', desc: 'Alforjes bem amarrados sem risco de encostar no escapamento quente ou roda.' },
              { key: 'equipamento', label: '7. EPIs do Piloto', desc: 'Capacete com viseira limpa, jaqueta com proteções, luvas, botas e capa de chuva.' },
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleChecklistItem(item.key)}
                className={cn(
                  "w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer",
                  checklist[item.key]
                    ? "bg-emerald-950/40 border-emerald-500/50 text-white"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                  checklist[item.key]
                    ? "bg-emerald-500 border-emerald-400 text-slate-950"
                    : "border-slate-700 bg-slate-900"
                )}>
                  {checklist[item.key] && <CheckCircle2 size={14} className="stroke-[3]" />}
                </div>
                <div>
                  <strong className={cn("text-xs block", checklist[item.key] ? "text-emerald-400" : "text-white")}>
                    {item.label}
                  </strong>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{item.desc}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-slate-300 text-xs flex items-center justify-between">
            <span>Progresso da Verificação:</span>
            <span className="font-black text-orange-400 font-mono text-sm">
              {completedChecklistCount} de 7 concluídos
            </span>
          </div>
        </div>
      )
    }
  ], [checklist]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const matchCat = activeCategory === 'all' || t.category === activeCategory;
      const matchQuery = !searchQuery.trim() || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [topics, activeCategory, searchQuery]);

  if (!isGuideModalOpen) return null;

  const handleStartTourClick = () => {
    closeGuideModal();
    // Start step-by-step spotlight tour
    startTour(true);
  };

  const handleNavigateTopic = (path?: string) => {
    if (!path) return;
    closeGuideModal();
    navigate(path);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900 border-2 border-orange-500/50 rounded-3xl max-w-3xl w-full shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800 bg-[#001b3d]/90 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-inner">
                <Compass size={24} className="animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/30">
                    MANUAL DO PILOTO
                  </span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">• MotoLegado v2.4</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black uppercase italic tracking-tight text-white mt-0.5">
                  Guia do Piloto & Central de Ajuda
                </h2>
              </div>
            </div>

            <button
              onClick={closeGuideModal}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Fechar Guia do Piloto"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick CTA Banner for Interactive Spotlight Tour */}
          <div className="bg-gradient-to-r from-orange-600/25 via-amber-600/15 to-transparent border-b border-orange-500/20 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-orange-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">Quer uma demonstração na prática?</span>
                <span className="text-[11px] text-slate-300">Faça o tour interativo com holofotes luminosos guiados na tela.</span>
              </div>
            </div>

            <button
              onClick={handleStartTourClick}
              className="btn-primary py-2 px-3.5 text-xs font-black uppercase tracking-wider shrink-0 self-start sm:self-center cursor-pointer shadow-md"
            >
              <Compass size={14} />
              <span>Iniciar Tour na Tela</span>
            </button>
          </div>

          {/* Search & Categories Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40 space-y-3 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar assunto no guia (ex: ranking, fotos, odômetro, parceiros, colete)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500/70 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: 'all', label: 'Tudo' },
                { id: 'telemetry', label: 'Telemetria' },
                { id: 'logbook', label: 'Diário de Bordo' },
                { id: 'gamification', label: 'Patentes & Ranking' },
                { id: 'routes', label: 'Rotas & GPS' },
                { id: 'motoclub', label: 'Moto Clubes' },
                { id: 'partners', label: 'Parceiros' },
                { id: 'safety', label: 'Checklist & Segurança' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id as CategoryFilter);
                    setSelectedTopicId(null);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[11px] whitespace-nowrap transition-all cursor-pointer border",
                    activeCategory === cat.id
                      ? "bg-orange-500 text-slate-950 border-orange-400 font-black shadow-sm"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topics List Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
            {filteredTopics.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Search size={32} className="mx-auto text-slate-600" />
                <h4 className="text-sm font-bold text-slate-300">Nenhum tópico encontrado</h4>
                <p className="text-xs text-slate-500">Tente buscar por outras palavras-chave ou limpe o filtro.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="btn-ghost text-xs mt-2 py-1.5 px-3 text-orange-400"
                >
                  Limpar Busca
                </button>
              </div>
            ) : (
              filteredTopics.map(topic => {
                const IconComponent = topic.icon;
                const isExpanded = selectedTopicId === topic.id || filteredTopics.length === 1;

                return (
                  <div
                    key={topic.id}
                    className="rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all overflow-hidden"
                  >
                    {/* Topic Header Accordion */}
                    <button
                      onClick={() => setSelectedTopicId(isExpanded ? null : topic.id)}
                      className="w-full p-4 flex items-center justify-between text-left gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", topic.badgeBg, topic.badgeColor)}>
                          <IconComponent size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border", topic.badgeBg, topic.badgeColor)}>
                              {topic.categoryLabel}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-black uppercase italic tracking-tight text-white mt-1 group-hover:text-orange-400 transition-colors truncate">
                            {topic.title}
                          </h3>
                        </div>
                      </div>

                      <ChevronRight 
                        size={18} 
                        className={cn("text-slate-500 transition-transform duration-200 shrink-0", isExpanded && "rotate-90 text-orange-400")} 
                      />
                    </button>

                    {/* Topic Collapsible Content */}
                    {isExpanded && (
                      <div className="px-4 pb-5 pt-1 border-t border-slate-800/80 space-y-4">
                        {topic.content}

                        {/* Action Link to the specific app section */}
                        {topic.routePath && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => handleNavigateTopic(topic.routePath)}
                              className="btn-primary py-2 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                            >
                              <span>{topic.routeLabel || 'Acessar Área'}</span>
                              <ExternalLink size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-[#001b3d]/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>MotoLegado • Estrada, Honra e Respeito</span>
            </span>

            <button
              onClick={closeGuideModal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
            >
              Fechar Guia
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
