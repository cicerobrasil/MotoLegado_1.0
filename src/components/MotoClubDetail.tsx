import { useParams, useNavigate } from 'react-router-dom';
import { Shield, MapPin, Users, Calendar, ExternalLink, Trophy, UserCheck, ArrowLeft, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function MotoClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data for the specific club (id=1, focusing on Devoradores de Asfalto style)
  const club = {
    name: 'DEVORADORES DE ASFALTO',
    city: 'CURITIBA, PR',
    membersCount: 154,
    estYear: 2021,
    description: 'Unidos pela estrada e pela liberdade. Nascido nas ruas de Curitiba, o Devoradores de Asfalto busca integrar pilotos que amam viagens de longa distância e mecânica clássica.',
    banner: 'https://images.unsplash.com/photo-1558981852-4211a0978665?auto=format&fit=crop&q=80&w=1600',
    stats: {
      titles: '12 Gold',
      activePilots: '45 Ativos'
    },
    command: {
      president: {
        name: 'Ricardo "Veludo"',
        role: 'PRESIDENTE',
        km: '9.8K KM',
        photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200'
      },
      vice: {
        name: 'Marcos "Ninja"',
        role: 'VICE-PRESIDENTE',
        km: '8.4K KM',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
      },
      secretary: {
        name: 'Ana "Sombra"',
        role: 'SECRETÁRIA',
        km: '7.2K KM',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200'
      },
      roadCaptain: {
        name: 'Beto "Trovoada"',
        role: 'ROAD CAPTAIN',
        km: '12.1K KM',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
      },
      treasurer: {
        name: 'Carla "Fênix"',
        role: 'TESOUREIRA',
        km: '5.9K KM',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white animate-in fade-in duration-500">
      {/* Navigation Bar */}
      <nav className="p-6">
        <button 
          onClick={() => navigate('/motoclubes')}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Voltar para lista</span>
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pb-20 space-y-12">
        {/* Header Section */}
        <div className="relative rounded-[3rem] overflow-hidden group shadow-2xl">
          {/* Banner */}
          <div className="h-[400px] relative">
            <img src={club.banner} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000" alt="Banner" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" />
          </div>

          {/* Content Over Banner */}
          <div className="absolute inset-0 p-12 flex items-end">
            <div className="flex flex-col md:flex-row items-center gap-8 w-full">
              {/* Logo Shield */}
              <div className="relative group/logo">
                <div className="w-40 h-40 rounded-full bg-orange-600 flex items-center justify-center shadow-[0_0_50px_rgba(255,85,0,0.4)] border-4 border-slate-950 relative z-10">
                  <Shield size={72} className="text-slate-950" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-slate-950 rounded-full border-4 border-orange-600 flex items-center justify-center z-20">
                  <Shield size={18} className="text-orange-600" />
                </div>
              </div>

              {/* Club Info Text */}
              <div className="flex-1 text-center md:text-left space-y-4">
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] text-white">
            {club.name}
          </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-orange-500">
                    <MapPin size={14} />
                    {club.city}
                  </span>
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-300">
                    <Users size={14} />
                    {club.membersCount} MEMBROS
                  </span>
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-300">
                    <Calendar size={14} />
                    EST. {club.estYear}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => navigate(`/motoclub/${id}/mural`)}
                className="px-8 py-4 bg-orange-600/90 hover:bg-orange-600 text-white rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl group/btn overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                MURAL DO CLUBE
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* ESTRUTURA DE COMANDO */}
          <div className="lg:col-span-8 space-y-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
              ESTRUTURA DE COMANDO
              <div className="h-px flex-1 bg-slate-800"></div>
            </h2>

            {/* President High-Level Card */}
            <div className="relative flex items-center gap-6 group">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-3xl border-4 border-orange-600/50 p-1 group-hover:border-orange-500 transition-colors">
                  <img src={club.command.president.photo} className="w-full h-full object-cover rounded-2xl" alt="President" />
                </div>
                <div className="absolute -top-3 -right-3 bg-slate-950 p-2 rounded-full border border-orange-500/30">
                   <Crown size={14} className="text-orange-500" />
                </div>
              </div>
              <div className="flex-1 bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-8 flex items-center justify-between group-hover:bg-slate-900/60 transition-all">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 flex items-center gap-2">
                    <Shield size={12} className="text-orange-500" />
                    {club.command.president.role}
                  </p>
                  <p className="text-2xl font-black text-white mt-1">{club.command.president.name}</p>
                </div>
                <div className="bg-orange-600/10 border border-orange-500/20 px-4 py-2 rounded-xl">
                   <span className="text-[10px] font-black text-orange-500">{club.command.president.km}</span>
                </div>
              </div>
            </div>

            {/* Other Leaders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {[club.command.vice, club.command.secretary, club.command.roadCaptain, club.command.treasurer].map((leader, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-6 flex items-center gap-4 hover:bg-slate-900/60 transition-all group">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-800 group-hover:border-orange-500/30 transition-colors shrink-0">
                    <img src={leader.photo} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Leader" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1 block">{leader.role}</p>
                    <p className="font-black italic uppercase text-white tracking-tighter">{leader.name}</p>
                    <p className="text-[9px] font-black text-orange-500 tracking-widest mt-0.5">{leader.km}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INFO DO CLUBE */}
          <div className="lg:col-span-4 space-y-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">INFO DO CLUBE</h2>
            
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-10 space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                  <Shield size={120} className="text-slate-800" />
               </div>

               <div className="space-y-4 relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">O RELATO DA SEDE</p>
                 <p className="text-[13px] font-bold text-slate-400 leading-relaxed italic">
                   "{club.description}"
                 </p>
               </div>

               <div className="grid grid-cols-2 gap-4 relative z-10">
                 <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl space-y-2 group hover:border-orange-500/30 transition-all text-center">
                    <Trophy size={20} className="text-orange-500 mx-auto" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">TÍTULOS</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{club.stats.titles}</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl space-y-2 group hover:border-orange-500/30 transition-all text-center">
                    <Users size={20} className="text-orange-500 mx-auto" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">PILOTOS</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{club.stats.activePilots.split(' ')[0]}</p>
                 </div>
               </div>

               <button 
                  onClick={() => navigate(`/motoclub/${id}/apply`)}
                  className="w-full py-5 bg-slate-800/50 hover:bg-white hover:text-slate-950 border border-slate-700/50 rounded-[1.5rem] text-[10px] font-black italic uppercase tracking-[0.25em] transition-all transform hover:scale-[1.02] active:scale-95 z-10 relative"
               >
                  CANDIDATAR-SE À VAGA
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const Crown = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);
