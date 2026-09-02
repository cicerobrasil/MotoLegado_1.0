import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  User, 
  MapPin, 
  Tablet as Motorcycle, 
  Check, 
  ArrowLeft, 
  Zap, 
  QrCode,
  Calendar,
  Award,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export function MotoClubApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const pilotName = profile?.name || 'Piloto MotoLegado';
  const pilotEmail = profile?.email || '';
  const pilotBike = profile?.motorcycle || 'Motocicleta Principal';
  const pilotPoints = profile?.points ?? 0;
  const pilotTier = profile?.tier || 'Bronze';
  const pilotAvatar = (profile?.avatar_url && !profile.avatar_url.includes('56ceb5ecca61'))
    ? profile.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(pilotName)}&background=ea580c&color=ffffff&bold=true`;

  const pilot = {
    name: pilotName,
    nickname: pilotName.split(' ')[0] || 'Piloto',
    id: `ID #${profile?.id ? profile.id.slice(0, 8).toUpperCase() : 'ML-001'}`,
    city: profile?.city || 'Brasil',
    motorcycle: pilotBike,
    experience: `${pilotTier} (${pilotPoints} PTS)`,
    kmTraveled: `${pilotPoints * 2} KM`,
    photo: pilotAvatar
  };

  const handleSendApplication = () => {
    setStatus('sending');

    // Persist real application request
    try {
      const existingStr = localStorage.getItem('motolegado_club_applications');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newApp = {
        id: `app_${Date.now()}`,
        clubId: id,
        pilotId: profile?.id || `pilot_${Date.now()}`,
        pilotName,
        pilotEmail,
        pilotBike,
        pilotAvatar,
        appliedAt: new Date().toISOString()
      };
      localStorage.setItem('motolegado_club_applications', JSON.stringify([newApp, ...existing]));
    } catch (e) {
      console.error('Error saving club application', e);
    }

    setTimeout(() => {
      setStatus('sent');
      setTimeout(() => {
        navigate(`/motoclubes`);
      }, 1800);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white animate-in fade-in duration-700 p-6 md:p-12">
      {/* Navigation */}
      <nav className="max-w-4xl mx-auto mb-12">
        <button 
          onClick={() => navigate(`/motoclub/${id}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cancelar Solicitação</span>
        </button>
      </nav>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Digital ID Visual */}
        <div className="relative">
          <div className="absolute -inset-4 bg-orange-600/20 blur-3xl opacity-30 rounded-full animate-pulse"></div>
          
          <motion.div 
            initial={{ rotateY: -15, rotateX: 5 }}
            animate={{ rotateY: 0, rotateX: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-1 overflow-hidden shadow-2xl"
          >
            {/* ID Header Overlay */}
            <div className="bg-slate-900/80 backdrop-blur-md p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Shield size={24} className="text-orange-500" />
                 <div>
                   <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">ID DIGITAL</h2>
                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Piloto Certificado v2.0</p>
                 </div>
              </div>
              <QrCode size={32} className="text-slate-700" />
            </div>

            {/* ID Body */}
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-orange-600/30 p-1 bg-slate-900 shadow-inner">
                   <img src={pilot.photo} className="w-full h-full object-cover rounded-xl grayscale hover:grayscale-0 transition-all duration-500" alt="Pilot" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">{pilot.nickname}</h3>
                  <p className="text-sm font-bold text-slate-400">{pilot.name}</p>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] pt-2">{pilot.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-2">
                    <MapPin size={10} /> CIDADE BASE
                  </span>
                  <p className="text-xs font-black text-white">{pilot.city}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-2">
                    <Motorcycle size={10} /> MOTOCICLETA
                  </span>
                  <p className="text-xs font-black text-white">{pilot.motorcycle}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-2">
                    <Calendar size={10} /> EXPERIÊNCIA
                  </span>
                  <p className="text-xs font-black text-white">{pilot.experience}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-2">
                    <Zap size={10} /> ESTRADA
                  </span>
                  <p className="text-xs font-black text-white">{pilot.kmTraveled}</p>
                </div>
              </div>

              {/* Badges Footer */}
              <div className="pt-6 border-t border-slate-800 flex items-center gap-3">
                 <div className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-[8px] font-bold text-slate-500 uppercase tracking-widest">Documento Verificado</div>
                 <div className="px-3 py-1 bg-orange-600/10 rounded-lg border border-orange-500/20 text-[8px] font-bold text-orange-500 uppercase tracking-widest">Elite member</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Application Content */}
        <div className="space-y-10">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-orange-600/10 border border-orange-500/20">
               <Award size={14} className="text-orange-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Solicitação de Ingresso</span>
            </div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-[0.9]">
              PRONTO PARA O <span className="text-orange-600">BATISMO?</span>
            </h1>
            <p className="text-slate-400 font-medium leading-relaxed max-w-md">
              Sua ID Digital será enviada para o comando do clube. Eles irão analisar seu histórico de estrada e conduta antes da aprovação.
            </p>
          </header>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-5 bg-slate-900/30 border border-slate-800 rounded-3xl group hover:border-orange-500/30 transition-all">
               <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                  <Check size={20} />
               </div>
               <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1 italic">Vínculo de Irmandade</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Ao ingressar, você se compromete com o regulamento interno e o respeito mútuo entre os pilotos.</p>
               </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-slate-900/30 border border-slate-800 rounded-3xl group hover:border-orange-500/30 transition-all">
               <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                  <User size={20} />
               </div>
               <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1 italic">Acesso Privado</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Liberação instantânea ao Mural do Clube e calendários de viagens após a aprovação.</p>
               </div>
            </div>
          </div>

          <button 
            disabled={status !== 'idle'}
            onClick={handleSendApplication}
            className={cn(
              "w-full py-6 text-white rounded-[2rem] font-black italic uppercase tracking-[0.3em] text-lg hover:scale-[1.03] active:scale-95 transition-all relative group overflow-hidden",
              status === 'sent' 
                ? "bg-green-600 shadow-[0_20px_50px_-10px_rgba(22,163,74,0.4)]" 
                : "bg-gradient-to-r from-orange-700 to-orange-500 shadow-[0_20px_50px_-10px_rgba(255,85,0,0.4)]"
            )}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center justify-center gap-4">
              {status === 'idle' && <>QUERO SER MEMBRO <Zap size={24} className="fill-white" /></>}
              {status === 'sending' && <>ENVIANDO... <Clock size={24} className="animate-spin" /></>}
              {status === 'sent' && <>SOLICITAÇÃO ENVIADA! <Check size={24} /></>}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
