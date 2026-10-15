import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Check, 
  Navigation, 
  Globe, 
  MapPin, 
  Compass, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Route } from '../types';
import { 
  buildGpsExportDataFromRoute, 
  exportRouteToGpx, 
  exportRouteToKml,
  GpsExportData 
} from '../lib/gpsExport';
import { estimateRouteMetrics } from './Routes';
import { cn } from '../lib/utils';

interface GpsExportModalProps {
  route: Route | null;
  isOpen: boolean;
  onClose: () => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export function GpsExportModal({ route, isOpen, onClose, onToast }: GpsExportModalProps) {
  const [downloadedGpx, setDownloadedGpx] = useState(false);
  const [downloadedKml, setDownloadedKml] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'garmin' | 'tomtom' | 'apps' | 'google'>('garmin');
  const [showWaypointsList, setShowWaypointsList] = useState(false);

  if (!isOpen || !route) return null;

  const metrics = estimateRouteMetrics(route);
  const exportData: GpsExportData = buildGpsExportDataFromRoute(route);

  const handleDownloadGpx = () => {
    try {
      exportRouteToGpx(route);
      setDownloadedGpx(true);
      if (onToast) {
        onToast(`Arquivo GPX gerado para "${route.name}". Pronto para transferir ao seu GPS!`, 'success');
      }
      setTimeout(() => setDownloadedGpx(false), 4000);
    } catch (err) {
      if (onToast) {
        onToast('Erro ao exportar arquivo GPX.', 'error');
      }
    }
  };

  const handleDownloadKml = () => {
    try {
      exportRouteToKml(route);
      setDownloadedKml(true);
      if (onToast) {
        onToast(`Arquivo KML gerado para "${route.name}". Pronto para o Google Earth / My Maps!`, 'success');
      }
      setTimeout(() => setDownloadedKml(false), 4000);
    } catch (err) {
      if (onToast) {
        onToast('Erro ao exportar arquivo KML.', 'error');
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ff751f]/10 border border-[#ff751f]/30 flex items-center justify-center text-[#ff751f]">
                <Navigation size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                  Exportar para GPS Externo
                </h3>
                <p className="text-xs text-slate-400">
                  Compatível com Garmin, TomTom, BMW Connected e Google Earth
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            
            {/* Route Summary Pill */}
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ff751f]">
                  Roteiro Selecionado
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {route.difficulty || 'Médio'}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-black italic uppercase tracking-tight text-white">
                {route.name}
              </h4>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-900">
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin size={12} className="text-[#ff751f] shrink-0" />
                  <strong className="text-white truncate max-w-[200px]">{route.mapsAddress}</strong>
                </span>
                <span>•</span>
                <span>Distância: <strong className="text-[#ff751f] font-mono">~{metrics.distance} km</strong></span>
                <span>•</span>
                <span>Tempo: <strong className="text-white font-mono">{metrics.duration}</strong></span>
              </div>
            </div>

            {/* Export Format Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* GPX Format */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 hover:border-[#ff751f]/50 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-md">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ff751f]/10 text-[#ff751f] border border-[#ff751f]/30 text-[10px] font-black font-mono uppercase">
                      .GPX 1.1
                    </span>
                    <Navigation size={18} className="text-[#ff751f]" />
                  </div>

                  <h5 className="text-sm font-black italic uppercase text-white">
                    Formato GPX Universal
                  </h5>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Padrão global para <strong>Garmin Zūmo</strong>, <strong>TomTom Rider</strong>, <strong>BMW Motorrad</strong>, <strong>OsmAnd</strong>, <strong>Gaia GPS</strong> e <strong>Calimoto</strong>.
                  </p>

                  <ul className="text-[10px] text-slate-500 space-y-0.5 font-medium pt-1">
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                      Waypoints com alertas de paradas
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                      Navegação curva-a-curva (RTE)
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                      Traçado do percurso contínuo (TRK)
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadGpx}
                  className={cn(
                    "mt-4 w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95",
                    downloadedGpx
                      ? "bg-emerald-600 text-white"
                      : "bg-[#ff751f] hover:bg-[#ff853a] text-slate-950 shadow-[#ff751f]/20"
                  )}
                >
                  {downloadedGpx ? (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      <span>GPX Baixado!</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Baixar Arquivo GPX</span>
                    </>
                  )}
                </button>
              </div>

              {/* KML Format */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-md">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-black font-mono uppercase">
                      .KML 2.2
                    </span>
                    <Globe size={18} className="text-sky-400" />
                  </div>

                  <h5 className="text-sm font-black italic uppercase text-white">
                    Formato Google KML
                  </h5>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Ideal para visualização 3D no <strong>Google Earth</strong>, importação no <strong>Google My Maps</strong>, <strong>Organic Maps</strong> e <strong>Maps.me</strong>.
                  </p>

                  <ul className="text-[10px] text-slate-500 space-y-0.5 font-medium pt-1">
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 size={11} className="text-sky-400 shrink-0" />
                      Linha estilizada Laranja MotoLegado
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 size={11} className="text-sky-400 shrink-0" />
                      Pins 3D para Origem e Destino
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 size={11} className="text-sky-400 shrink-0" />
                      Visualização de satélite em alta resolução
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadKml}
                  className={cn(
                    "mt-4 w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95",
                    downloadedKml
                      ? "bg-emerald-600 text-white"
                      : "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20"
                  )}
                >
                  {downloadedKml ? (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      <span>KML Baixado!</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Baixar Arquivo KML</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Waypoints Viewer Collapsible */}
            <div className="border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowWaypointsList(!showWaypointsList)}
                className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Compass size={14} className="text-[#ff751f]" />
                  <span>Pontos e Coordenadas do Roteiro ({exportData.waypoints.length} waypoints)</span>
                </span>
                {showWaypointsList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <AnimatePresence>
                {showWaypointsList && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-3.5 pt-0 space-y-2 border-t border-slate-900"
                  >
                    {exportData.waypoints.map((wpt, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            wpt.type === 'start' ? "bg-emerald-400" : (wpt.type === 'end' ? "bg-red-400" : "bg-orange-400")
                          )} />
                          <span className="text-white font-bold truncate max-w-[220px]">{wpt.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {wpt.lat.toFixed(4)}, {wpt.lon.toFixed(4)}
                        </span>
                      </div>
                    ))}
                    <div className="text-[10px] text-slate-500 pt-1 text-center font-mono">
                      + {exportData.trackPoints.length} pontos de curva interpolados no traçado
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* GPS Instructions Guide */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-300">
                <HelpCircle size={14} className="text-[#ff751f]" />
                <span>Como importar para o seu GPS ou Aplicativo:</span>
              </div>

              {/* Guide Tabs */}
              <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'garmin', label: 'Garmin' },
                  { id: 'tomtom', label: 'TomTom' },
                  { id: 'apps', label: 'Celular/App' },
                  { id: 'google', label: 'G. Earth' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveGuideTab(t.id as any)}
                    className={cn(
                      "py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer",
                      activeGuideTab === t.id
                        ? "bg-[#ff751f] text-slate-950 font-black"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Guide Content */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {activeGuideTab === 'garmin' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Cpu size={14} className="text-[#ff751f]" /> Garmin Zūmo / Drive / Explore:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                      <li>Baixe o arquivo <strong>.GPX</strong> acima.</li>
                      <li>Conecte o seu GPS Garmin no computador via cabo USB.</li>
                      <li>Copie o arquivo para a pasta <code className="text-[#ff751f] bg-slate-900 px-1 rounded">Garmin/GPX/</code> da memória interna ou cartão SD.</li>
                      <li><em>Ou pelo celular:</em> Abra o arquivo GPX baixado usando o aplicativo <strong>Garmin Drive</strong> ou <strong>Garmin Explore</strong> para sincronizar via Bluetooth.</li>
                    </ol>
                  </div>
                )}

                {activeGuideTab === 'tomtom' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Cpu size={14} className="text-[#ff751f]" /> TomTom Rider / MyDrive:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                      <li>Baixe o arquivo <strong>.GPX</strong> acima.</li>
                      <li>Acesse o site ou app <strong>TomTom MyDrive</strong>.</li>
                      <li>Vá em <em>"Meus Percursos"</em> &gt; <em>"Importar arquivo GPX"</em>.</li>
                      <li>O percurso será sincronizado automaticamente com seu TomTom Rider via Wi-Fi.</li>
                    </ol>
                  </div>
                )}

                {activeGuideTab === 'apps' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Smartphone size={14} className="text-[#ff751f]" /> OsmAnd, Calimoto, Gaia GPS & BMW Connected:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                      <li>Baixe o arquivo <strong>.GPX</strong> diretamente no seu celular.</li>
                      <li>Abra os downloads do celular e toque no arquivo <strong>.gpx</strong>.</li>
                      <li>Selecione o seu app favorito (OsmAnd, Calimoto, Gaia GPS, BMW Connected ou Strava) para abrir e iniciar a navegação curva-a-curva mesmo sem sinal de internet!</li>
                    </ol>
                  </div>
                )}

                {activeGuideTab === 'google' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Globe size={14} className="text-sky-400" /> Google Earth & Google My Maps:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                      <li>Baixe o arquivo <strong>.KML</strong> acima.</li>
                      <li>No <strong>Google Earth</strong>, vá em <em>Arquivo &gt; Abrir</em> e selecione o .kml para sobrevoar o trajeto em 3D.</li>
                      <li>No <strong>Google My Maps</strong> (<a href="https://mymaps.google.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">mymaps.google.com</a>), clique em <em>"Importar camada"</em> e escolha o .kml para salvar no seu Google Maps pessoal.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Compass size={13} className="text-[#ff751f]" />
              MotoLegado GPS Export Suite
            </span>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GpsExportModal;
