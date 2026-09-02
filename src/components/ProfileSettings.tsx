import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Tablet as Motorcycle, 
  Camera, 
  Check, 
  Shield, 
  Search, 
  Palette, 
  Share2, 
  Zap, 
  AlertCircle, 
  Plus, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProfileSettings() {
  const navigate = useNavigate();
  const { profile, user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'piloto' | 'identidade' | 'endereco' | 'motocicleta'>('piloto');
  
  // Form States vinculados ao perfil real
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || '');
  const [motorcycle, setMotorcycle] = useState(profile?.motorcycle || '');
  const [isMemberOfClub, setIsMemberOfClub] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'Piloto')}&background=ea580c&color=ffffff&bold=true`;
  const [personalLogo, setPersonalLogo] = useState<string | null>(profile?.personal_logo_url || null);
  const [profilePhoto, setProfilePhoto] = useState((profile?.avatar_url && !profile.avatar_url.includes('56ceb5ecca61')) ? profile.avatar_url : defaultAvatar);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setMotorcycle(profile.motorcycle || '');
      if (profile.avatar_url) setProfilePhoto(profile.avatar_url);
      if (profile.personal_logo_url) setPersonalLogo(profile.personal_logo_url);
    }
  }, [profile]);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'piloto', label: 'PILOTO', icon: User },
    { id: 'endereco', label: 'ENDEREÇO', icon: MapPin },
    { id: 'motocicleta', label: 'MOTOCICLETA', icon: Motorcycle },
    { id: 'identidade', label: 'ID DIGITAL', icon: Palette },
  ];

  const validateEmail = (val: string) => {
    return String(val)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.substring(0, 2)}) ${raw.substring(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.substring(0, 2)}) ${raw.substring(2, 7)}-${raw.substring(7, 11)}`;
    }
    setPhone(formatted.substring(0, 15));
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'photo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') setPersonalLogo(reader.result as string);
        else setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfile({
        name,
        phone,
        bio,
        city,
        state,
        motorcycle,
        avatar_url: profilePhoto,
        personal_logo_url: personalLogo || undefined
      });
      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 800);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const isEmailValid = validateEmail(email);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-10 selection:bg-orange-500 selection:text-white pb-24 md:pb-8">
      <header className="border-b border-slate-800/60 pb-6 md:pb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <button
            onClick={() => navigate('/profile')}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao Perfil do Piloto</span>
          </button>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">CENTRAL DE <span className="text-orange-500">CONFIGURAÇÃO</span></h1>
          <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            GESTÃO DE PERFIL, PRIVACIDADE E IDENTIDADE DIGITAL
          </p>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="self-start md:self-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>Sair do Ajuste</span>
        </button>
      </header>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800/60 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 min-w-[100px] flex flex-col items-center justify-center gap-2 py-3 sm:py-4 px-2 transition-all relative group shrink-0",
              activeTab === tab.id 
                ? "text-orange-500" 
                : "text-slate-500 hover:text-white"
            )}
          >
            <div className={cn(
              "flex items-center gap-1.5 sm:gap-2 font-black italic uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] transition-all whitespace-nowrap",
              activeTab === tab.id ? "scale-105" : "scale-100 opacity-70 group-hover:opacity-100"
            )}>
              <tab.icon size={14} className={cn(activeTab === tab.id ? "text-orange-500" : "text-slate-400")} />
              {tab.label}
            </div>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 shadow-[0_0_20px_rgba(255,85,0,0.4)]" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {activeTab === 'piloto' && (
            <div className="md:col-span-2 space-y-8 sm:space-y-12">
              {/* Profile Photo Header Component */}
              <div className="flex flex-col items-center space-y-3">
                <input 
                  type="file" 
                  ref={photoInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'photo')}
                />
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-slate-900 border-4 border-slate-800 overflow-hidden group-hover:border-orange-500 transition-all duration-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(255,85,0,0.2)]">
                    <img 
                      src={profilePhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Camera size={28} className="text-white drop-shadow-lg" />
                  </div>
                </div>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-slate-500">Toque para enviar foto de perfil</p>
              </div>

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Nome do Piloto</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome de piloto"
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-white" 
                  />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Motocicleta Principal</label>
                  <input 
                    type="text" 
                    value={motorcycle}
                    onChange={(e) => setMotorcycle(e.target.value)}
                    placeholder="Ex: BMW R 1250 GS, Triumph Tiger 900..."
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-white" 
                  />
                </div>
                <div className="space-y-2 sm:space-y-3 relative">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">E-mail de Contato</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      disabled={!!user}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(
                        "w-full bg-slate-950 border rounded-2xl p-4 sm:p-5 text-xs sm:text-sm font-bold outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-white disabled:opacity-60",
                        email === "" 
                          ? "border-slate-800/50 focus:border-orange-500" 
                          : isEmailValid 
                            ? "border-emerald-500/50 focus:border-emerald-500 pr-12" 
                            : "border-red-500/50 focus:border-red-500 pr-12"
                      )} 
                    />
                    {email !== "" && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2">
                        {isEmailValid ? (
                          <Check size={18} className="text-emerald-500" />
                        ) : (
                          <AlertCircle size={18} className="text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000" 
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-white" 
                  />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Biografia / Lema de Estrada</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Escreva um resumo sobre suas viagens e sua paixão por duas rodas..."
                  className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-white resize-none"
                />
              </div>

              {/* Visual Identity Section */}
              <div className="space-y-6 pt-2">
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-orange-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Identidade Visual</h3>
                </div>

                <div 
                  className={cn(
                    "bento-card border-slate-800/50 transition-all p-4 sm:p-6 flex items-center justify-between group/card cursor-pointer",
                    isMemberOfClub ? "bg-orange-600/5 border-orange-500/30" : "bg-slate-900/10"
                  )}
                  onClick={() => setIsMemberOfClub(!isMemberOfClub)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 bg-slate-950 border rounded-xl flex items-center justify-center transition-colors shadow-lg shrink-0",
                      isMemberOfClub ? "border-orange-500/50 text-orange-500" : "border-slate-800 text-slate-600 group-hover/card:text-orange-500"
                    )}>
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-tight text-white">Sou membro de um Moto Clube</h4>
                      <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Ative para vincular seu brasão oficial</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isMemberOfClub}
                      readOnly
                    />
                    <div className="w-10 h-5 sm:w-12 sm:h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] sm:after:top-[3px] after:left-[2px] sm:after:left-[3px] after:bg-white after:rounded-full after:h-[16px] sm:after:h-[18px] after:w-[16px] sm:after:w-[18px] after:transition-all peer-checked:bg-orange-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Logo / Símbolo Pessoal</label>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                    <div 
                      className="border-2 border-dashed border-slate-800/30 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center gap-3 hover:border-orange-500/50 transition-all cursor-pointer group bg-slate-900/10 hover:bg-slate-900/20"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-slate-600 group-hover:text-orange-500 transition-all border border-slate-800 relative overflow-hidden">
                        {personalLogo ? (
                          <img src={personalLogo} className="w-full h-full object-cover" alt="Personal Logo" />
                        ) : (
                          <Camera size={20} />
                        )}
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 group-hover:text-white transition-colors">
                        {personalLogo ? 'Alterar Logo' : 'Selecionar Imagem'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Fundar Moto Clube Call to Action */}
                  <div 
                    onClick={() => navigate('/motoclub')}
                    className="bg-slate-900/40 border border-slate-800/60 rounded-3xl flex flex-col items-center justify-center p-6 sm:p-8 text-center relative group min-h-[160px] overflow-hidden backdrop-blur-md cursor-pointer hover:bg-orange-600/10 transition-all hover:scale-[1.02] active:scale-95 shadow-lg active:shadow-inner"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                       <Plus size={20} className="text-orange-500" />
                    </div>
                    <div className="relative">
                      <Shield size={40} className="text-orange-600/40 group-hover:text-orange-500 transition-colors drop-shadow-[0_0_15px_rgba(255,85,0,0.2)]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Plus size={18} className="text-white bg-orange-600 rounded-full p-1" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-[12px] font-black italic uppercase tracking-tighter text-white">Fundar Novo Clube</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Crie sua própria lenda</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'identidade' && (
            <div className="md:col-span-2 space-y-6 flex flex-col items-center">
              {/* Member Card */}
              <div className="w-full max-w-xl bg-slate-950 border-2 border-orange-600 rounded-3xl sm:rounded-[2.8rem] p-5 sm:p-8 md:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(255,85,0,0.1)] relative overflow-hidden group">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none transition-opacity group-hover:opacity-15">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent)]"></div>
                  <div className="h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_30px,rgba(255,255,255,0.02)_30px,rgba(255,255,255,0.02)_31px)]"></div>
                </div>

                <div className="relative h-full flex flex-col justify-between z-10 space-y-6">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center font-black text-xl sm:text-3xl shadow-[0_4px_15px_rgba(255,85,0,0.4)] transform -rotate-1">M</div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic leading-none flex gap-1">
                          MOTO<span className="text-orange-600 drop-shadow-[0_0_8px_rgba(255,85,0,0.5)]">LEGADO</span>
                        </h2>
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-slate-500 mt-1 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-orange-600 rounded-full animate-pulse"></span>
                          Official Member Card
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 sm:px-5 sm:py-2 border border-orange-500/20 rounded-full bg-orange-500/5 transition-colors group-hover:bg-orange-500/10">
                      <span className="text-[9px] sm:text-[11px] font-black uppercase italic tracking-widest text-orange-500">ROLEZINHO</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 my-2">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl border-4 border-orange-600/80 overflow-hidden shrink-0 shadow-[0_20px_40px_rgba(0,0,0,0.4)] transform hover:scale-105 transition-transform duration-500">
                      <img 
                        src={profilePhoto} 
                        alt="Member" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] text-slate-500">NOME DE PILOTO</p>
                      <h3 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">Alex Rider</h3>
                      <div className="flex gap-2 justify-center sm:justify-start">
                        <span className="h-0.5 w-12 bg-orange-600 rounded-full"></span>
                        <span className="h-0.5 w-4 bg-slate-800 rounded-full"></span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                        <Zap className="text-orange-500" size={18} />
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-bold font-mono text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-slate-900/50 px-3 py-1 rounded-md border border-slate-800/50">
                        ID: PIL-977264
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-white/95 rounded-[1rem] sm:rounded-[1.2rem] shadow-xl transform group-hover:rotate-6 transition-transform">
                      <Shield size={28} className="text-black sm:w-9 sm:h-9" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Action */}
              <button className="flex items-center gap-3 text-orange-500 hover:text-orange-400 transition-all group pt-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-orange-500/50 group-hover:shadow-[0_0_15px_rgba(255,85,0,0.2)] transition-all">
                  <Share2 size={16} className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">Compartilhar Credencial</span>
              </button>
            </div>
          )}

          {activeTab === 'endereco' && (
            <div className="md:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row items-end gap-5 max-w-md">
                <div className="flex-1 w-full space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">CEP</label>
                  <input type="text" placeholder="00000-000" className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-white" />
                </div>
                <button className="p-5 bg-orange-600 text-white rounded-2xl hover:bg-orange-500 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,85,0,0.2)] active:shadow-inner flex items-center justify-center group/btn">
                  <Search size={22} className="drop-shadow-md group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-9 space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Rua / Avenida</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all backdrop-blur-sm text-white" />
                </div>
                <div className="md:col-span-3 space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Número</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all backdrop-blur-sm text-white md:col-span-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Bairro / Região</label>
                  <input 
                    type="text" 
                    placeholder="Bairro"
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all backdrop-blur-sm text-white" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Cidade</label>
                    <input 
                      type="text" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: São Paulo" 
                      className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all backdrop-blur-sm text-white" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Estado (UF)</label>
                    <input 
                      type="text" 
                      value={state} 
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder="SP" 
                      maxLength={2}
                      className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all backdrop-blur-sm text-white uppercase" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 px-2">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" id="start-point" />
                  <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-orange-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"></div>
                </div>
                <label htmlFor="start-point" className="text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-white transition-colors">
                  Definir como ponto de partida padrão
                </label>
              </div>
            </div>
          )}

          {activeTab === 'motocicleta' && (
            <div className="md:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-4 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Apelido da Máquina</label>
                  <input type="text" placeholder="Ex: Black Widow" className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white" />
                </div>
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-4 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Marca / Modelo</label>
                  <input type="text" defaultValue="Harley-Davidson Iron 883" className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white" />
                </div>
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-4 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Ano</label>
                  <input type="text" defaultValue="2022" className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white" />
                </div>
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-4 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Placa</label>
                  <input type="text" defaultValue="ABC-1D23" className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all uppercase backdrop-blur-sm text-white" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                    <Camera size={14} className="text-orange-500" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Galeria da Moto (3 fotos)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square border-2 border-dashed border-slate-800/60 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-orange-500/50 transition-all cursor-pointer group bg-slate-900/40 hover:bg-slate-900/50 hover:scale-[1.02]">
                      <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-orange-500 group-hover:scale-110 transition-all">
                        <Camera size={20} />
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 group-hover:text-white transition-colors">Foto {i}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <footer className="sticky bottom-0 z-30 -mx-8 -mb-8 px-8 py-5 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => navigate('/profile')}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl font-black italic uppercase text-xs tracking-wider transition-all shadow-md group"
        >
          <ArrowLeft size={18} className="text-amber-400 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar ao Perfil do Piloto</span>
        </button>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-black italic uppercase text-xs tracking-[0.15em] hover:from-orange-500 hover:to-orange-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_25px_-5px_rgba(255,85,0,0.4)] relative overflow-hidden group cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>GRAVANDO...</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check size={18} className="text-white" />
              <span>SALVO COM SUCESSO!</span>
            </>
          ) : (
            <>
              <Check size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="relative drop-shadow-md">GRAVAR REGISTRO</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
