import { useState, useRef, ChangeEvent } from 'react';
import { Shield, MapPin, Crown, Calendar, Image as ImageIcon, Check, Info, Tag, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export function MotoClub() {
  const [logo, setLogo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') setLogo(reader.result as string);
        else setBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="border-b border-slate-800/60 pb-8">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
          FUNDAR NOVO <span className="text-orange-600">MOTO CLUBE</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse"></span>
          Comece sua própria lenda. Defina as regras, recrute os irmãos.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Form Fields */}
        <div className="md:col-span-8 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Nome do MC</label>
            <input 
              type="text" 
              placeholder="Ex: Falcões da Noite" 
              className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/20 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Cidade Base / Sede</label>
            <div className="relative">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
              <input 
                type="text" 
                placeholder="Ex: Curitiba, PR" 
                className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 pl-14 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/20 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Nome do Presidente</label>
              <div className="relative">
                <Crown className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
                <input 
                  type="text" 
                  defaultValue="Piloto Convidado" 
                  className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 pl-14 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/20 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm"
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Data de Fundação</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
                <input 
                  type="text" 
                  defaultValue="15/05/2026" 
                  className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 pl-14 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/20 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Categoria do Clube</label>
            <div className="relative group">
              <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
              <select 
                defaultValue=""
                className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 pl-14 text-sm font-bold focus:border-orange-500 focus:bg-slate-900/20 outline-none transition-all text-white backdrop-blur-sm appearance-none cursor-pointer"
              >
                <option value="" disabled>Selecione o perfil do clube...</option>
                <option value="Cruiser">Cruiser (Harley, Custom, etc)</option>
                <option value="Touring">Touring (Viagens Longas)</option>
                <option value="Mixed">Misto (Big Trail e Aventura)</option>
                <option value="Sport">Sport (Alta Performance)</option>
                <option value="Classic">Classic / Retro</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 transition-colors group-hover:text-orange-500">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Logo Upload */}
        <div className="md:col-span-4 flex flex-col items-center">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-6 w-full text-center">Brasão do Clube (Logo)</label>
          <input 
            type="file" 
            ref={logoInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'logo')}
          />
          <div 
            onClick={() => logoInputRef.current?.click()}
            className={cn(
              "w-full aspect-square bg-slate-900/20 border-2 border-dashed border-slate-800/40 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-orange-500/50 transition-all group overflow-hidden relative",
              logo ? "border-solid border-orange-600/30" : ""
            )}
          >
            {logo ? (
              <img src={logo} className="w-full h-full object-contain p-6" alt="Logo preview" />
            ) : (
              <>
                <Shield size={32} className="text-slate-800 group-hover:text-orange-500 transition-colors" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 group-hover:text-white">Carregar</span>
              </>
            )}
            <div className="absolute inset-0 bg-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Banner Upload Section */}
      <div className="space-y-6">
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Capa do Clube (Banner)</label>
        <input 
          type="file" 
          ref={bannerInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'banner')}
        />
        <div 
          onClick={() => bannerInputRef.current?.click()}
          className="w-full aspect-[3/1] bg-slate-900/10 border-2 border-dashed border-slate-800/30 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-orange-500/30 transition-all group overflow-hidden relative"
        >
          {banner ? (
            <img src={banner} className="w-full h-full object-cover" alt="Banner preview" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-orange-500 transition-all">
                <ImageIcon size={24} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white">Selecione uma foto épica para o banner</p>
            </>
          )}
          <div className="absolute inset-0 bg-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Description Section */}
      <div className="space-y-6">
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Lema / Descrição</label>
        <div className="relative group">
          <div className="absolute top-5 left-5 text-slate-700 group-focus-within:text-orange-600 transition-colors">
            <Info size={18} />
          </div>
          <textarea 
            placeholder="Qual a filosofia deste moto clube?"
            className="w-full bg-slate-950 border border-slate-800/50 rounded-[2rem] p-8 pl-14 text-sm font-medium focus:border-orange-500 focus:bg-slate-900/20 outline-none transition-all h-40 resize-none placeholder:text-slate-700 italic backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Action Footer */}
      <footer className="flex justify-end pt-8 pb-16">
        <button className="flex items-center gap-4 px-16 py-5 bg-gradient-to-r from-orange-700 to-orange-500 text-white rounded-[2rem] font-black italic uppercase tracking-[0.2em] hover:from-orange-600 hover:to-orange-400 hover:scale-[1.03] active:scale-[0.97] transition-all shadow-[0_20px_40px_-10px_rgba(255,85,0,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(255,85,0,0.4)] group overflow-hidden relative">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Check size={22} className="group-hover:rotate-12 transition-transform" />
          <span className="relative drop-shadow-md">FUNDAR CLUBE</span>
        </button>
      </footer>
    </div>
  );
}
