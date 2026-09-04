import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Send, Plus, Map, X, Compass, Calendar, Bike, MapPin, Clock, Cloud, CloudRain, Sun, Zap, Moon, Star, Sparkles, ArrowLeft, Camera, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadImageToStorage } from '../lib/storage';
import { UpgradeModal } from './UpgradeModal';

export interface LogEntry {
  id: string;
  title: string;
  date: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  bike: string;
  climate: string;
  road: string;
  rating: number;
  content: string;
  image: string;
}

export function Logbook() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [bike, setBike] = useState(profile?.motorcycle || '');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [climate, setClimate] = useState('sun');
  const [road, setRoad] = useState('Tapete (Perfeita)');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const tripPhotoInputRef = useRef<HTMLInputElement>(null);

  const pilotMotorcycle = profile?.motorcycle || '';

  const isProOrBonificado = Boolean(
    profile?.is_pro ||
    profile?.plan_type === 'bonificado' ||
    profile?.plan_type === 'pago' ||
    profile?.role === 'admin'
  );

  // Contagem de registros do mês atual para validação do limite gratuito (até 5 registros por mês)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthLogsCount = logs.filter(l => l.date && l.date.startsWith(currentMonth)).length;
  const isFreeLimitReached = !isProOrBonificado && thisMonthLogsCount >= 5;

  const handleOpenForm = () => {
    if (isFreeLimitReached) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setIsFormOpen(true);
  };

  const handleTripPhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const result = await uploadImageToStorage(file, {
        folder: 'trips',
        userId: user?.id || 'pilot',
      });

      if (result.success && result.url) {
        setImage(result.url);
      } else {
        alert(result.error || 'Erro ao fazer upload da imagem.');
      }
    } catch (err) {
      console.error('Erro no upload da foto da viagem:', err);
      alert('Falha ao processar a foto.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Load logs on mount / auth change
  useEffect(() => {
    if (isSupabaseConfigured && user) {
      supabase
        .from('logbook_trips')
        .select('*')
        .eq('pilot_id', user.id)
        .order('date', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mappedLogs: LogEntry[] = data.map((t: any) => ({
              id: t.id,
              title: t.title,
              date: t.date || new Date().toISOString().split('T')[0],
              origin: t.origin,
              destination: t.destination,
              distance: String(t.distance_km || 0),
              duration: '2h 30min',
              bike: t.bike_model || profile?.motorcycle || 'Motocicleta',
              climate: 'sun',
              road: 'Tapete (Perfeita)',
              rating: t.rating || 5,
              content: t.notes || '',
              image: t.photos?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800'
            }));
            setLogs(mappedLogs);
          } else {
            setLogs([]);
          }
        });
    } else {
      const saved = localStorage.getItem('motolegado_logs');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLogs(parsed);
            return;
          }
        } catch (e) {
          console.error('Error loading logbook from localStorage', e);
        }
      }
      setLogs([]);
    }
  }, [user, isSupabaseConfigured]);

  const saveLogsToStorage = async (newEntry: LogEntry) => {
    if (isSupabaseConfigured && user) {
      try {
        await supabase.from('logbook_trips').insert({
          pilot_id: user.id,
          title: newEntry.title,
          origin: newEntry.origin,
          destination: newEntry.destination,
          distance_km: parseInt(newEntry.distance, 10) || 0,
          bike_model: newEntry.bike,
          rating: newEntry.rating,
          notes: newEntry.content,
          date: new Date().toISOString().split('T')[0],
          photos: [newEntry.image]
        });
      } catch (err) {
        console.error('Erro ao gravar logbook no Supabase:', err);
      }
    }

    const updated = [newEntry, ...logs];
    setLogs(updated);
    localStorage.setItem('motolegado_logs', JSON.stringify(updated));
  };

  const handleFinish = async () => {
    if (!title.trim()) {
      alert('Por favor, informe o título da viagem.');
      return;
    }

    const newEntry: LogEntry = {
      id: Date.now().toString(),
      title: title.toUpperCase(),
      date: date || new Date().toLocaleDateString('pt-BR'),
      origin: origin || 'Cidade de Origem',
      destination: destination || 'Cidade de Destino',
      distance: distance ? distance.replace(/\D/g, '') || '100' : '100',
      duration: duration || '2h 30min',
      bike: bike || profile?.motorcycle || 'Motocicleta',
      climate,
      road,
      rating,
      content: content || 'Viagem concluída com sucesso e registrada no diário de bordo.',
      image: image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800'
    };

    await saveLogsToStorage(newEntry);

    // Reset Form
    setTitle('');
    setOrigin('');
    setDestination('');
    setDistance('');
    setDuration('');
    setContent('');
    setImage('');
    setIsFormOpen(false);
  };

  const handleGenerateAiStory = () => {
    const t = title || 'Giro pelo Interior';
    const o = origin || 'Florianópolis';
    const d = destination || 'Serra Catarinense';
    const km = distance || '220';
    
    setContent(`Partida ao amanhecer em ${o} com destino a ${d}. O trecho de ${km}km surpreendeu pela excelente fluidez do tráfego e trechos de curvas envolventes. Parada estratégica no mirante para fotos e um café quente. A moto manteve desempenho exemplar durante toda a travessia, consolidando mais um registro memorável no diário de bordo do MotoLegado.`);
  };

  if (isFormOpen) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 bg-slate-950 min-h-screen">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/profile')}
              className="mb-3 inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Voltar ao Perfil do Piloto</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase">
              DIÁRIO DE <span className="text-orange-500">BORDO</span>
            </h1>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/40 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] overflow-hidden"
        >
          {/* Form Header */}
          <div className="p-5 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0">
                 <Compass size={18} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white italic uppercase">GRAVAR NOVA LENDA</h2>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">PREENCHA OS DADOS TÉCNICOS DA SUA JORNADA</p>
              </div>
            </div>
            <button 
              onClick={() => setIsFormOpen(false)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 sm:p-8 md:p-10 space-y-6 sm:space-y-10">
            {/* Title Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">TÍTULO DO ROTEIRO / NOME DA VIAGEM</label>
              <div className="relative group">
                <Compass className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 group-focus-within:scale-110 transition-transform" size={18} />
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dê um nome para sua aventura (ex: Tour das Serras)"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-5 pl-16 pr-8 text-sm font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Technical Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">LOCAL DE PARTIDA</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50" size={16} />
                  <input 
                    type="text" 
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="De onde partiu?" 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">DATA DO ROTEIRO</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50" size={16} />
                  <input 
                    type="text" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="15/05/2026" 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">MOTO UTILIZADA</label>
                <div className="relative">
                  <Bike className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50" size={16} />
                  <input 
                    type="text" 
                    value={bike}
                    onChange={(e) => setBike(e.target.value)}
                    placeholder="Iron 883" 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">DESTINO FINAL</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50" size={16} />
                  <input 
                    type="text" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Aonde chegou?" 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">DISTÂNCIA TOTAL (KM)</label>
                <div className="relative">
                  <Compass className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50 rotate-45" size={16} />
                  <input 
                    type="text" 
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="Ex: 340km" 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">DURAÇÃO DA VIAGEM</label>
                <div className="relative">
                  <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50" size={16} />
                  <input 
                    type="text" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ex: 5h 30min" 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50" 
                  />
                </div>
              </div>
            </div>

            {/* Condition Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">CONDIÇÃO CLIMÁTICA</label>
                <div className="flex gap-3">
                  {[
                    { id: 'sun', icon: Sun },
                    { id: 'rain', icon: CloudRain },
                    { id: 'cloud', icon: Cloud },
                    { id: 'zap', icon: Zap },
                    { id: 'moon', icon: Moon },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setClimate(item.id)}
                      className={cn(
                        "w-10 h-10 rounded-full border flex items-center justify-center transition-all",
                        climate === item.id 
                          ? "bg-orange-500 border-orange-500 text-slate-900 shadow-lg shadow-orange-500/20" 
                          : "border-slate-800 text-slate-600 hover:text-slate-300"
                      )}
                    >
                      <item.icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">ESTADO DA ESTRADA</label>
                <select 
                  value={road}
                  onChange={(e) => setRoad(e.target.value)}
                  className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 px-6 text-[13px] font-bold text-white focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
                >
                  <option value="Tapete (Perfeita)">Tapete (Perfeita)</option>
                  <option value="Razoável">Razoável</option>
                  <option value="Crítica (Buracos)">Crítica (Buracos)</option>
                  <option value="Chão Batido / Terra">Chão Batido / Terra</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center">AVALIAÇÃO DA ROTA</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1"
                    >
                      <Star size={20} className={cn(s <= rating ? "text-orange-500 fill-orange-500" : "text-slate-800")} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Media & Story */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">FOTO DA VIAGEM / CAPA</label>
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="text-[9px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      <span>Remover Foto</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={tripPhotoInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleTripPhotoUpload}
                />

                <div className="space-y-3">
                  <div
                    onClick={() => !isUploadingPhoto && tripPhotoInputRef.current?.click()}
                    className={cn(
                      "w-full aspect-[2/1] rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group",
                      image 
                        ? "border-slate-800 bg-slate-950 shadow-lg" 
                        : "border-dashed border-slate-800/80 bg-slate-900/20 hover:border-orange-500/50 hover:bg-slate-900/40"
                    )}
                  >
                    {isUploadingPhoto ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={32} className="text-orange-500 animate-spin" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Enviando para o Supabase Storage...</span>
                      </div>
                    ) : image ? (
                      <>
                        <img src={image} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 backdrop-blur-xs">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                            <Camera size={16} className="text-orange-500" />
                            Trocar Foto
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center p-4">
                        <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-orange-500 group-hover:scale-110 transition-all">
                          <Camera size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                            Tirar Foto ou Escolher da Galeria
                          </p>
                          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                            Salva automaticamente no Supabase Storage
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <input 
                    type="text" 
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Ou cole uma URL externa se preferir..." 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">O RELATO DO PILOTO</label>
                  <button 
                    type="button"
                    onClick={handleGenerateAiStory}
                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/10 border border-orange-500/20 rounded-full text-[8px] font-black text-orange-500 uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all group"
                  >
                    <Sparkles size={10} className="group-hover:rotate-12 transition-transform" />
                    IA: GERAR RELATO
                  </button>
                </div>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Conte os detalhes da aventura, os obstáculos e a emoção de cada curva..."
                  className="w-full aspect-[2/1] bg-slate-950/30 border border-slate-800 rounded-[2rem] p-8 text-sm font-medium text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end items-center gap-8 pt-10 border-t border-slate-800">
               <button 
                 type="button"
                 onClick={() => setIsFormOpen(false)}
                 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors"
                >
                 DESCARTAR
               </button>
               <button 
                 type="button"
                 onClick={handleFinish}
                 className="px-12 py-4 bg-orange-600 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-orange-600/20 group hover:bg-orange-500 transition-all active:scale-95"
               >
                 <Send size={18} className="text-white group-hover:translate-x-1 transition-transform" />
                 <span className="text-[11px] font-black text-white uppercase tracking-widest">FINALIZAR REGISTRO</span>
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const totalKmCalculated = logs.reduce((acc, curr) => {
    const num = parseInt(curr.distance, 10);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-12 bg-slate-950 min-h-screen">
      {/* Header Section */}
      <header className="border-b border-slate-800/60 pb-6 sm:pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div>
           <button
             onClick={() => navigate('/profile')}
             className="mb-3 inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md group"
           >
             <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
             <span>Voltar ao Perfil do Piloto</span>
           </button>
           <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
             DIÁRIO DE <span className="text-orange-500">BORDO</span>
           </h1>
           <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-3 flex items-center gap-2">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             ONDE CADA KM RODADO VIRA UMA LENDA IMORTAL
           </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Plan Quota Badge */}
          {!isProOrBonificado ? (
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono flex items-center gap-2">
              <span className="text-slate-400">Modo Gratuito:</span>
              <span className={cn(
                "font-bold",
                thisMonthLogsCount >= 5 ? "text-rose-400 font-black" : "text-emerald-400"
              )}>
                {thisMonthLogsCount}/5 viagens este mês
              </span>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-center gap-2">
              <Sparkles size={13} className="text-amber-400" />
              <span className="font-bold">
                Viagens Ilimitadas ({profile?.plan_type === 'bonificado' ? '🎁 Modo Bonificado' : '🔥 Pro VIP'})
              </span>
            </div>
          )}

          <button 
            onClick={handleOpenForm}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-black rounded-xl text-[10px] sm:text-[11px] font-black tracking-[0.2em] uppercase italic transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            + NOVO REGISTRO
          </button>
        </div>
      </header>

      {logs.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full aspect-[21/9] min-h-[350px] sm:min-h-[500px] border-2 border-dashed border-slate-800/40 rounded-3xl sm:rounded-[3rem] flex flex-col items-center justify-center bg-slate-900/5 overflow-hidden p-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,85,0,0.03)_0%,transparent_70%)]" />
          
          <div className="relative flex flex-col items-center text-center px-4 max-w-2xl">
            <div 
              onClick={handleOpenForm}
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-white mb-6 sm:mb-10 shadow-2xl group cursor-pointer hover:border-orange-500/50 transition-all"
            >
              <Send size={24} className="sm:w-8 sm:h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter mb-4 sm:mb-6">
              O ASFALTO ESTÁ CHAMANDO
            </h2>
            
            <p className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.25em] leading-relaxed">
              SUA LENDA AINDA NÃO FOI ESCRITA. CLIQUE NO BOTÃO DE NOVO <br className="hidden md:block" />
              REGISTRO PARA COMEÇAR SUA HISTÓRIA.
            </p>

            <button 
              onClick={handleOpenForm}
              className="mt-8 sm:mt-12 flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-orange-500 transition-colors"
            >
              <Map size={14} />
              Criar meu primeiro registro
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {logs.map((log, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={log.id}
              className="bg-slate-900/40 border border-slate-800/60 rounded-3xl sm:rounded-[2.5rem] overflow-hidden group hover:border-orange-500/20 transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Image Side */}
                <div className="lg:col-span-4 aspect-video lg:aspect-auto relative overflow-hidden">
                   <img src={log.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={log.title} />
                   <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-transparent lg:hidden" />
                </div>
                
                {/* Content Side */}
                <div className="lg:col-span-8 p-5 sm:p-8 md:p-10 flex flex-col justify-between space-y-6 sm:space-y-8">
                   <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none">{log.date}</p>
                          <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">{log.title}</h3>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} size={14} className={cn("fill-current", idx < log.rating ? "text-orange-500" : "text-slate-800")} />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 py-4 sm:py-6 border-y border-slate-800/30">
                        <div>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">DE / PARA</p>
                          <p className="text-[10px] font-black text-white uppercase italic truncate">{log.origin.split('/')[0]} ➔ {log.destination.split('/')[0]}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">DISTÂNCIA</p>
                          <p className="text-[10px] font-black text-white uppercase italic">{log.distance} KM</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">TEMPO</p>
                          <p className="text-[10px] font-black text-white uppercase italic">{log.duration}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">RODOVIA</p>
                          <p className="text-[10px] font-black text-orange-500 uppercase italic truncate">{log.road.split(' ')[0]}</p>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed italic">
                        "{log.content}"
                      </p>
                   </div>

                   <div className="flex flex-wrap items-center justify-between gap-3 pt-2 sm:pt-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                           <Bike size={16} />
                         </div>
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{log.bike}</p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest",
                        log.climate === 'sun' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" : "bg-slate-800 border-slate-700 text-slate-400"
                      )}>
                        <Sun size={12} /> CÉU LIMPO
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Stats Overlay */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
        {[
          { label: 'Total de Registros', value: logs.length.toString().padStart(2, '0') },
          { label: 'Km Rodados Acumulados', value: `${totalKmCalculated} KM` },
          { label: 'Fotos Publicadas', value: (logs.length * 4).toString().padStart(2, '0') },
        ].map((stat, i) => (
          <div key={i} className="p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-slate-900/40 border border-slate-800/60 text-center">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 sm:mb-2">{stat.label}</p>
            <p className="text-2xl sm:text-3xl font-black text-orange-500 tracking-tighter italic">{stat.value}</p>
          </div>
        ))}
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        feature="diario_ilimitado" 
      />
    </div>
  );
}

