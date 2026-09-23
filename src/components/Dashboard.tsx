import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Calendar, Store, Percent, Route, BookOpen, CheckCircle, Plus, MapPin, Trophy } from 'lucide-react';
import { MotoEvent } from './Events';
import { Partner } from './Partners';
import { LogEntry } from './Logbook';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getPilotLiveGamification } from '../lib/gamification';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<MotoEvent[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Load Events
    const savedEvents = localStorage.getItem('motolegado_events');
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (e) {
        console.error('Error reading motolegado_events', e);
      }
    }

    // Load Partners
    const savedPartners = localStorage.getItem('motolegado_partners');
    if (savedPartners) {
      try {
        setPartners(JSON.parse(savedPartners));
      } catch (e) {
        console.error('Error reading motolegado_partners', e);
      }
    }

    // Load Logbook (from Supabase if configured and logged in)
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
              duration: '2h',
              bike: t.bike_model || profile?.motorcycle || 'Motocicleta',
              climate: 'sun',
              road: 'Boa',
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
      const savedLogs = localStorage.getItem('motolegado_logs');
      if (savedLogs) {
        try {
          setLogs(JSON.parse(savedLogs));
        } catch (e) {
          console.error('Error reading motolegado_logs', e);
        }
      }
    }
  }, [user, isSupabaseConfigured]);

  const checkedInEvents = events.filter(evt => evt.checkedIn);
  const displayEvents = checkedInEvents.length > 0 ? checkedInEvents.slice(0, 3) : events.slice(0, 3);
  const highlightedPartners = partners.filter(p => p.highlight).slice(0, 2);
  const displayPartners = highlightedPartners.length > 0 ? highlightedPartners : partners.slice(0, 2);

  // Calculate live total distance from actual pilot logs
  const loggedKm = logs.reduce((acc, log) => {
    const val = parseInt(log.distance, 10);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalKmCombined = loggedKm;

  // Active or latest trip
  const latestLog = logs.length > 0 ? logs[0] : null;

  // Dynamic telemetry chart data
  const chartKmData = [
    { name: 'Jan', km: logs.length > 0 ? Math.round(loggedKm * 0.15) : 0 },
    { name: 'Fev', km: logs.length > 0 ? Math.round(loggedKm * 0.25) : 0 },
    { name: 'Mar', km: logs.length > 0 ? Math.round(loggedKm * 0.35) : 0 },
    { name: 'Abr', km: logs.length > 0 ? Math.round(loggedKm * 0.15) : 0 },
    { name: 'Mai', km: logs.length > 0 ? Math.round(loggedKm * 0.10) : 0 },
  ];

  // Live Gamification Engine (KM + Eventos + Diário + Badges)
  const gamification = useMemo(() => {
    return getPilotLiveGamification(logs, events);
  }, [logs, events]);

  const { pointsBreakdown, rankInfo, badges } = gamification;
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col gap-6 overflow-y-auto bg-slate-950">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/60 pb-6 md:pb-8 gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">DASH<span className="text-orange-500">BOARD</span></h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            TELEMETRIA, EVENTOS E DIÁRIO DE BORDO EM TEMPO REAL
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            data-tour="dashboard-ranking"
            onClick={() => navigate('/achievements')}
            className="btn-secondary flex items-center gap-1.5 border-amber-500/40 text-amber-400 hover:text-white"
          >
            <Trophy size={15} className="text-amber-400" />
            <span className="font-mono">{rankInfo.currentTier.icon} {pointsBreakdown.totalPoints.toLocaleString()} PTS</span>
          </button>
          <button
            onClick={() => navigate('/logbook')}
            className="btn-secondary"
          >
            <BookOpen size={15} className="text-[#ff751f]" />
            <span>Diário ({logs.length})</span>
          </button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Active Route Main Box */}
        <div data-tour="dashboard-telemetry" className="col-span-12 lg:col-span-8 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="px-3.5 py-1 bg-orange-600/20 text-orange-400 text-[9px] sm:text-[10px] font-black uppercase italic rounded-full border border-orange-500/30">
                ÚLTIMA ROTA REGISTRADA
              </span>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-black italic uppercase mt-2 sm:mt-3 tracking-tighter text-white">
                {latestLog ? latestLog.title : 'Nenhuma Viagem Registrada'}
              </h2>
              <p className="text-slate-400 mt-1 flex items-center gap-2 sm:gap-3 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                <MapPin size={12} className="text-orange-500 shrink-0" />
                {latestLog ? `${latestLog.origin} ➔ ${latestLog.destination}` : 'Inicie seu primeiro roteiro no diário de bordo'}
              </p>
            </div>

            <button
              data-tour="dashboard-logbook"
              onClick={() => navigate('/logbook')}
              className="btn-primary w-full sm:w-auto self-start sm:self-center"
            >
              <Plus size={15} />
              <span>NOVO REGISTRO</span>
            </button>
          </div>

          <div className="flex-1 min-h-[220px] bg-slate-950/60 rounded-2xl border border-slate-800/50 p-4 relative overflow-hidden backdrop-blur-sm flex flex-col justify-between">
             <div className="h-44 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartKmData}>
                    <defs>
                      <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff5500" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#ff5500" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#ff5500' }}
                    />
                    <Area type="monotone" dataKey="km" stroke="#ff5500" strokeWidth={3} fill="url(#colorKm)" />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
             
             <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest pt-2 border-t border-slate-900">
               <span>TELEMETRIA DE QUILOMETRAGEM ACUMULADA</span>
               <span className="text-orange-500">{loggedKm} KM REGISTRADOS NO DIÁRIO</span>
             </div>
          </div>
        </div>

        {/* Adventures & Logbook Sidebar Box */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <BookOpen size={14} className="text-orange-500" />
                Diário de Bordo Recente
              </h3>
              <button 
                onClick={() => navigate('/logbook')} 
                className="text-[9px] text-amber-400 font-black uppercase tracking-widest hover:underline"
              >
                VER TODOS ({logs.length})
              </button>
            </div>

            <div className="space-y-3">
              {logs.slice(0, 3).map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => navigate('/logbook')}
                  className="flex gap-4 items-center group cursor-pointer p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/50 transition-all border border-slate-800/80 hover:border-orange-500/40"
                >
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shrink-0 group-hover:border-orange-500 transition-colors">
                    <img src={log.image} alt={log.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black uppercase italic tracking-tight text-white group-hover:text-orange-400 transition-colors truncate">
                      {log.title}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                      {log.date} • {log.distance} KM
                    </p>
                  </div>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Nenhuma viagem registrada no diário de bordo.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/logbook')}
            className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={14} className="text-orange-500" />
            <span>Cadastrar Nova Aventura</span>
          </button>
        </div>

        {/* Checked In Events Section */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Calendar size={14} className="text-amber-500" />
                Eventos com Check-in / Confirmados ({checkedInEvents.length})
              </h3>
              <button 
                onClick={() => navigate('/events')} 
                className="text-[9px] text-amber-400 font-black uppercase tracking-widest hover:underline"
              >
                VER AGENDA
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayEvents.map((adv) => (
                <div 
                  key={adv.id} 
                  onClick={() => navigate('/events')}
                  className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-amber-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {adv.category}
                    </span>
                    {adv.checkedIn && (
                      <span className="text-[8px] font-black uppercase text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle size={10} /> Presença
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase italic tracking-tight text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {adv.title}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 line-clamp-1">
                      {adv.date} • {adv.location}
                    </p>
                  </div>
                </div>
              ))}

              {displayEvents.length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-500 text-xs">
                  Nenhum evento agendado no momento.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Benefícios e Parceiros */}
        <div 
          onClick={() => navigate('/partners')}
          className="col-span-12 lg:col-span-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 flex flex-col justify-between cursor-pointer group hover:border-orange-500/30 transition-all"
        >
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Store size={14} className="text-orange-500" />
                Parceiros em Destaque
              </h3>
              <span className="text-[8px] text-orange-400 font-extrabold uppercase tracking-widest bg-orange-600/10 border border-orange-500/30 px-2.5 py-1 rounded-full">
                OFICINAS E BENEFÍCIOS
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayPartners.map((pt) => (
                <div key={pt.id} className="flex gap-3 items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 group-hover:border-slate-700 transition-all">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shrink-0">
                    <img src={pt.image} className="w-full h-full object-cover" alt={pt.name} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black uppercase italic tracking-tight text-white group-hover:text-orange-400 transition-colors truncate">{pt.name}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-orange-400">
                      <Percent size={10} className="shrink-0" />
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wide truncate">
                        {pt.discount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {displayPartners.length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-500 text-xs">
                  Nenhum parceiro cadastrado no momento.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/50">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ver rede credenciada completa</span>
            <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-orange-500 group-hover:border-orange-500 transition-colors">
              ➔
            </span>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <Route size={22} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] truncate">DISTÂNCIA TOTAL</p>
            <div className="text-xl font-black italic text-white tracking-tighter">
              {totalKmCombined.toLocaleString()} <span className="text-xs not-italic text-orange-500 uppercase font-black">KM</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium">+{pointsBreakdown.kmPoints} pts no asfalto</p>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Calendar size={22} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] truncate">EVENTOS PARTICIPADOS</p>
            <div className="text-xl font-black italic text-white tracking-tighter">
              {checkedInEvents.length.toString().padStart(2, '0')} <span className="text-xs not-italic text-sky-400 uppercase font-black">CHECK-INS</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium">+{pointsBreakdown.eventPoints} pts de eventos</p>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <BookOpen size={22} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] truncate">DIÁRIO DE BORDO</p>
            <div className="text-xl font-black italic text-white tracking-tighter">
              {logs.length.toString().padStart(2, '0')} <span className="text-xs not-italic text-purple-400 uppercase font-black">EXPEDIÇÕES</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium">+{pointsBreakdown.tripPoints} pts de relatos</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/achievements')}
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-900 border border-amber-500/40 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 flex items-center gap-4 cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
            {rankInfo.currentTier.icon}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex items-center justify-between">
              <p className="text-amber-500 text-[8px] font-black uppercase tracking-[0.2em] truncate">PATENTE & BADGES</p>
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest group-hover:underline">VER HUB ➔</span>
            </div>
            <div className="text-xl font-black italic text-white tracking-tighter truncate">
              {rankInfo.currentTier.title}
            </div>
            <p className="text-[9px] text-slate-400 font-medium font-mono">
              <strong className="text-amber-400">{pointsBreakdown.totalPoints.toLocaleString()} PTS</strong> • {unlockedBadgesCount}/{badges.length} Badges
            </p>
          </div>
        </div>
      </main>

      <footer className="flex flex-col sm:flex-row gap-3 justify-between items-center text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em] pb-4 border-t border-slate-900 pt-4 text-center sm:text-left">
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-8">
          <span className="flex items-center gap-2"><span className="w-1 h-1 bg-green-500 rounded-full"></span>GPS: ATIVO (L1/L5)</span>
          <span>LAT: -26.3045 LON: -48.8456</span>
        </div>
        <div>
          © 2026 MOTOLEGADO ENGINEERING SYSTEMS
        </div>
      </footer>
    </div>
  );
}

