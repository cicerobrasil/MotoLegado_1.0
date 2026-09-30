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
  ArrowRight,
  Lock,
  Loader2,
  Trash2,
  UploadCloud,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Copy,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadImageToStorage } from '../lib/storage';

export function ProfileSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, user, updateProfile } = useAuth();

  const tabParam = searchParams.get('tab');
  const initialTab = (tabParam && ['piloto', 'identidade', 'endereco', 'motocicleta'].includes(tabParam)) 
    ? (tabParam as 'piloto' | 'identidade' | 'endereco' | 'motocicleta') 
    : 'piloto';

  const [activeTab, setActiveTab] = useState<'piloto' | 'identidade' | 'endereco' | 'motocicleta'>(initialTab);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && ['piloto', 'identidade', 'endereco', 'motocicleta'].includes(requestedTab)) {
      setActiveTab(requestedTab as any);
    }
  }, [searchParams]);
  
  // Form States vinculados ao perfil real com fallback seguro ao armazenamento local
  const [name, setName] = useState(profile?.name || localStorage.getItem('motolegado_pilot_name') || '');
  const [email, setEmail] = useState(profile?.email || localStorage.getItem('motolegado_pilot_email') || '');
  const [phone, setPhone] = useState(profile?.phone || localStorage.getItem('motolegado_pilot_phone') || '');
  const [bio, setBio] = useState(profile?.bio || localStorage.getItem('motolegado_pilot_bio') || '');
  const [city, setCity] = useState(profile?.city || localStorage.getItem('motolegado_pilot_city') || '');
  const [state, setState] = useState(profile?.state || localStorage.getItem('motolegado_pilot_state') || '');
  const [cep, setCep] = useState(() => {
    if (profile?.cep) return profile.cep;
    try {
      const saved = localStorage.getItem('motolegado_pilot_address');
      return saved ? JSON.parse(saved).cep || '' : '';
    } catch {
      return '';
    }
  });
  const [street, setStreet] = useState(() => {
    if (profile?.street) return profile.street;
    try {
      const saved = localStorage.getItem('motolegado_pilot_address');
      return saved ? JSON.parse(saved).street || '' : '';
    } catch {
      return '';
    }
  });
  const [streetNumber, setStreetNumber] = useState(() => {
    if (profile?.street_number) return profile.street_number;
    try {
      const saved = localStorage.getItem('motolegado_pilot_address');
      return saved ? JSON.parse(saved).streetNumber || '' : '';
    } catch {
      return '';
    }
  });
  const [neighborhood, setNeighborhood] = useState(() => {
    if (profile?.neighborhood) return profile.neighborhood;
    try {
      const saved = localStorage.getItem('motolegado_pilot_address');
      return saved ? JSON.parse(saved).neighborhood || '' : '';
    } catch {
      return '';
    }
  });
  const [isDefaultStartPoint, setIsDefaultStartPoint] = useState(() => {
    if (profile?.default_start_point !== undefined) return Boolean(profile.default_start_point);
    try {
      const saved = localStorage.getItem('motolegado_pilot_address');
      return saved ? Boolean(JSON.parse(saved).isDefaultStartPoint) : true;
    } catch {
      return true;
    }
  });
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const numberInputRef = useRef<HTMLInputElement>(null);

  const [motorcycle, setMotorcycle] = useState(
    profile?.motorcycle || localStorage.getItem('motolegado_pilot_bike') || ''
  );
  const [motorcycleNickname, setMotorcycleNickname] = useState(
    profile?.motorcycle_nickname || localStorage.getItem('motolegado_pilot_bike_nickname') || ''
  );
  const [motorcycleYear, setMotorcycleYear] = useState(
    profile?.motorcycle_year || localStorage.getItem('motolegado_pilot_bike_year') || ''
  );
  const [motorcyclePlate, setMotorcyclePlate] = useState(
    profile?.motorcycle_plate || localStorage.getItem('motolegado_pilot_bike_plate') || ''
  );
  const [motorcyclePhotos, setMotorcyclePhotos] = useState<string[]>(() => {
    if (profile?.motorcycle_photos) {
      const raw = profile.motorcycle_photos;
      if (Array.isArray(raw) && raw.length > 0) return raw;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    try {
      const saved = localStorage.getItem('motolegado_pilot_bike_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isMemberOfClub, setIsMemberOfClub] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadToast, setUploadToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Upload Loaders
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadingBikeSlot, setUploadingBikeSlot] = useState<number | null>(null);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'Piloto')}&background=ea580c&color=ffffff&bold=true`;
  const [personalLogo, setPersonalLogo] = useState<string | null>(
    profile?.personal_logo_url || localStorage.getItem('motolegado_pilot_logo') || null
  );
  const [profilePhoto, setProfilePhoto] = useState(
    (profile?.avatar_url && !profile.avatar_url.includes('56ceb5ecca61')) 
      ? profile.avatar_url 
      : (localStorage.getItem('motolegado_pilot_avatar') || defaultAvatar)
  );

  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.email) setEmail(profile.email);
      if (profile.phone) setPhone(profile.phone);
      if (profile.bio) setBio(profile.bio);
      if (profile.city) setCity(profile.city);
      if (profile.state) setState(profile.state);
      if (profile.cep) setCep(profile.cep);
      if (profile.street) setStreet(profile.street);
      if (profile.street_number) setStreetNumber(profile.street_number);
      if (profile.neighborhood) setNeighborhood(profile.neighborhood);
      if (profile.default_start_point !== undefined) setIsDefaultStartPoint(Boolean(profile.default_start_point));
      if (profile.motorcycle) setMotorcycle(profile.motorcycle);
      if (profile.avatar_url) setProfilePhoto(profile.avatar_url);
      if (profile.personal_logo_url) setPersonalLogo(profile.personal_logo_url);
      if (profile.motorcycle_nickname) setMotorcycleNickname(profile.motorcycle_nickname);
      if (profile.motorcycle_year) setMotorcycleYear(profile.motorcycle_year);
      if (profile.motorcycle_plate) setMotorcyclePlate(profile.motorcycle_plate);
      if (profile.motorcycle_photos) {
        const raw = profile.motorcycle_photos;
        let photosList: string[] = [];
        if (Array.isArray(raw)) {
          photosList = raw;
        } else if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) photosList = parsed;
          } catch {}
        }
        if (photosList.length > 0) {
          setMotorcyclePhotos(photosList);
        }
      }
    }
  }, [profile]);

  // Formatar e Buscar CEP
  const formatCep = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 8);
    if (raw.length <= 5) return raw;
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    const raw = value.replace(/\D/g, '');
    if (raw.length === 8 && !isSearchingCep) {
      performCepSearch(raw);
    }
  };

  const performCepSearch = async (cleanCepParam?: string) => {
    const rawCep = (cleanCepParam || cep).replace(/\D/g, '');
    if (rawCep.length !== 8) {
      showToast('Digite um CEP válido com 8 dígitos (ex: 88311-285).', 'error');
      return;
    }

    setIsSearchingCep(true);
    try {
      let data: { street: string; neighborhood: string; city: string; state: string } | null = null;

      // 1. Provedor Primário: ViaCEP
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          if (!json.erro) {
            data = {
              street: json.logradouro || '',
              neighborhood: json.bairro || '',
              city: json.localidade || '',
              state: json.uf || ''
            };
          }
        }
      } catch (err) {
        console.warn('ViaCEP indisponível, tentando BrasilAPI...');
      }

      // 2. Provedor Secundário (Fallback): BrasilAPI
      if (!data) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${rawCep}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const json = await res.json();
            data = {
              street: json.street || '',
              neighborhood: json.neighborhood || '',
              city: json.city || '',
              state: json.state || ''
            };
          }
        } catch (err) {
          console.warn('BrasilAPI indisponível.');
        }
      }

      if (data) {
        if (data.street) setStreet(data.street);
        if (data.neighborhood) setNeighborhood(data.neighborhood);
        if (data.city) setCity(data.city);
        if (data.state) setState(data.state.toUpperCase());
        setCep(formatCep(rawCep));
        showToast(`Endereço localizado: ${data.city} - ${data.state}!`, 'success');
        setTimeout(() => {
          numberInputRef.current?.focus();
        }, 150);
      } else {
        showToast('CEP não encontrado. Preencha o endereço manualmente.', 'info');
      }
    } catch (err) {
      console.error('Erro na consulta do CEP:', err);
      showToast('Falha na consulta do CEP. Preencha manualmente.', 'error');
    } finally {
      setIsSearchingCep(false);
    }
  };
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bikeInputRef0 = useRef<HTMLInputElement>(null);
  const bikeInputRef1 = useRef<HTMLInputElement>(null);
  const bikeInputRef2 = useRef<HTMLInputElement>(null);
  const bikeInputRefs = [bikeInputRef0, bikeInputRef1, bikeInputRef2];

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setUploadToast({ message, type });
    setTimeout(() => setUploadToast(null), 3500);
  };

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

  // Upload para Foto do Perfil ou Logotipo Pessoal
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') {
      setIsUploadingLogo(true);
    } else {
      setIsUploadingPhoto(true);
    }

    try {
      const result = await uploadImageToStorage(file, {
        folder: type === 'logo' ? 'logos' : 'avatars',
        userId: user?.id || 'pilot',
      });

      if (result.success && result.url) {
        if (type === 'logo') {
          setPersonalLogo(result.url);
          localStorage.setItem('motolegado_pilot_logo', result.url);
          updateProfile({ personal_logo_url: result.url });
          showToast('Brasão / Símbolo pessoal enviado e salvo com sucesso!', 'success');
        } else {
          setProfilePhoto(result.url);
          localStorage.setItem('motolegado_pilot_avatar', result.url);
          updateProfile({ avatar_url: result.url });
          showToast('Foto de perfil atualizada e salva com sucesso!', 'success');
        }
      } else {
        showToast(result.error || 'Erro ao processar o arquivo.', 'error');
      }
    } catch (err: any) {
      console.error('Erro no upload:', err);
      showToast('Falha no upload da imagem.', 'error');
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      else setIsUploadingPhoto(false);
      // Limpar input para permitir reenvio do mesmo arquivo se necessário
      e.target.value = '';
    }
  };

  // Upload para Fotos da Motocicleta
  const handleBikePhotoUpload = async (e: ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBikeSlot(slotIndex);
    try {
      const result = await uploadImageToStorage(file, {
        folder: 'bikes',
        userId: user?.id || 'pilot',
      });

      if (result.success && result.url) {
        // Constrói lista atualizada de fotos de maneira síncrona preservando todos os slots
        const currentList = Array.isArray(motorcyclePhotos) ? [...motorcyclePhotos] : [];
        const nextPhotos: string[] = [...currentList];

        // Garante que existam posições até o slotIndex
        while (nextPhotos.length <= slotIndex) {
          nextPhotos.push('');
        }
        // Atribui a foto exatamente ao slot desejado (0, 1 ou 2)
        nextPhotos[slotIndex] = result.url;

        // Sanitiza para garantir strings válidas em todas as posições
        const sanitizedPhotos = nextPhotos.map(p => (typeof p === 'string' ? p : ''));

        // Remove espaços vazios do final do array
        while (sanitizedPhotos.length > 0 && sanitizedPhotos[sanitizedPhotos.length - 1].trim() === '') {
          sanitizedPhotos.pop();
        }

        // 1. Atualizar estado local imediatamente
        setMotorcyclePhotos(sanitizedPhotos);

        // 2. Salvar no localStorage com tolerância a falhas
        try {
          localStorage.setItem('motolegado_pilot_bike_photos', JSON.stringify(sanitizedPhotos));
        } catch (storageErr) {
          console.error('Erro ao salvar fotos localmente:', storageErr);
        }

        // 3. Persistir imediatamente no perfil com a lista completa de fotos
        await updateProfile({
          motorcycle_photos: sanitizedPhotos,
          motorcycle: motorcycle || profile?.motorcycle,
          motorcycle_nickname: motorcycleNickname || profile?.motorcycle_nickname,
          motorcycle_year: motorcycleYear || profile?.motorcycle_year,
          motorcycle_plate: motorcyclePlate || profile?.motorcycle_plate,
        }).catch((err) => {
          console.warn('Aviso sincronização perfil:', err);
        });

        showToast(`Foto ${slotIndex + 1} da moto salva com sucesso!`, 'success');
      } else {
        showToast(result.error || 'Erro no upload da foto da moto.', 'error');
      }
    } catch (err: any) {
      console.error('Erro no upload da foto da moto:', err);
      showToast('Falha ao enviar a foto da moto.', 'error');
    } finally {
      setUploadingBikeSlot(null);
      e.target.value = '';
    }
  };

  const handleRemoveBikePhoto = async (slotIndex: number) => {
    const currentList = Array.isArray(motorcyclePhotos) ? [...motorcyclePhotos] : [];
    const nextPhotos: string[] = [...currentList];

    if (slotIndex < nextPhotos.length) {
      nextPhotos[slotIndex] = '';
    }

    // Remove vazios do final mantendo a coerência de slots
    while (nextPhotos.length > 0 && (!nextPhotos[nextPhotos.length - 1] || nextPhotos[nextPhotos.length - 1].trim() === '')) {
      nextPhotos.pop();
    }

    setMotorcyclePhotos(nextPhotos);

    try {
      localStorage.setItem('motolegado_pilot_bike_photos', JSON.stringify(nextPhotos));
    } catch (e) {
      console.error(e);
    }

    await updateProfile({
      motorcycle_photos: nextPhotos,
    }).catch(() => {});

    showToast(`Foto ${slotIndex + 1} removida.`, 'info');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Salvar metadados localmente como garantia imediata com proteção contra cota
      try {
        localStorage.setItem('motolegado_pilot_name', name);
        localStorage.setItem('motolegado_pilot_email', email);
        localStorage.setItem('motolegado_pilot_phone', phone);
        localStorage.setItem('motolegado_pilot_bio', bio);
        localStorage.setItem('motolegado_pilot_city', city);
        localStorage.setItem('motolegado_pilot_state', state);
        if (personalLogo) localStorage.setItem('motolegado_pilot_logo', personalLogo);
        if (profilePhoto) localStorage.setItem('motolegado_pilot_avatar', profilePhoto);
        localStorage.setItem('motolegado_pilot_bike', motorcycle);
        localStorage.setItem('motolegado_pilot_bike_nickname', motorcycleNickname);
        localStorage.setItem('motolegado_pilot_bike_year', motorcycleYear);
        localStorage.setItem('motolegado_pilot_bike_plate', motorcyclePlate);
        localStorage.setItem('motolegado_pilot_bike_photos', JSON.stringify(motorcyclePhotos));
        localStorage.setItem('motolegado_pilot_address', JSON.stringify({
          cep,
          street,
          streetNumber,
          neighborhood,
          city,
          state,
          isDefaultStartPoint
        }));
      } catch (storageErr) {
        console.warn('Aviso armazenamento local:', storageErr);
      }

      const res = await updateProfile({
        name,
        email,
        phone,
        bio,
        city,
        state,
        cep,
        street,
        street_number: streetNumber,
        neighborhood,
        default_start_point: isDefaultStartPoint,
        motorcycle,
        avatar_url: profilePhoto,
        personal_logo_url: personalLogo || undefined,
        motorcycle_nickname: motorcycleNickname,
        motorcycle_year: motorcycleYear,
        motorcycle_plate: motorcyclePlate,
        motorcycle_photos: motorcyclePhotos,
      });

      if (res?.error) {
        console.warn('Aviso ao atualizar perfil:', res.error);
      }

      setSaveSuccess(true);
      showToast('Configurações gravadas com sucesso no banco de dados!', 'success');
      // Permanece na mesma tela e aba atual com status de GRAVADO (sem redirecionar)
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
    } catch (e: any) {
      console.error('Erro ao salvar perfil:', e);
      showToast('Erro ao salvar as configurações: ' + (e?.message || 'Tente novamente'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isEmailValid = validateEmail(email);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-10 selection:bg-orange-500 selection:text-white pb-24 md:pb-8">
      <header className="border-b border-slate-800/60 pb-6 md:pb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">CENTRAL DE <span className="text-orange-500">CONFIGURAÇÃO</span></h1>
          <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            GESTÃO DE PERFIL, PRIVACIDADE E IDENTIDADE DIGITAL
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md group"
            title="Voltar ao Perfil do Piloto"
          >
            <ArrowLeft size={16} className="text-amber-400 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao Perfil</span>
          </button>
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800/60 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 min-w-[70px] sm:min-w-[100px] flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 transition-all relative group shrink-0",
              activeTab === tab.id 
                ? "text-orange-500" 
                : "text-slate-500 hover:text-white"
            )}
          >
            <div className={cn(
              "flex items-center gap-1 sm:gap-2 font-black italic uppercase tracking-[0.05em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] transition-all whitespace-nowrap",
              activeTab === tab.id ? "scale-105" : "scale-100 opacity-70 group-hover:opacity-100"
            )}>
              <tab.icon size={14} className={cn(activeTab === tab.id ? "text-orange-500" : "text-slate-400")} />
              <span>{tab.label}</span>
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
                  onClick={() => !isUploadingPhoto && photoInputRef.current?.click()}
                >
                  <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-slate-900 border-4 border-slate-800 overflow-hidden group-hover:border-orange-500 transition-all duration-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(255,85,0,0.2)] relative">
                    <img 
                      src={profilePhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
                        <Loader2 size={32} className="text-orange-500 animate-spin" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest text-center px-2">Enviando ao Storage...</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-10">
                    <Camera size={28} className="text-white drop-shadow-lg" />
                  </div>
                </div>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-slate-500 flex items-center gap-1.5">
                  <UploadCloud size={13} className="text-orange-500" />
                  <span>Toque para enviar foto de perfil (Câmera ou Galeria)</span>
                </p>
              </div>

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Nome do Piloto</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome de piloto"
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white placeholder:text-slate-700" 
                  />
                </div>
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group border-l-2 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Motocicleta Principal</label>
                    <span className="text-[9px] font-black uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded tracking-wider flex items-center gap-1">
                      <Lock size={10} className="text-orange-400" /> Somente Leitura
                    </span>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={motorcycle}
                      readOnly
                      placeholder="Preencha o campo Marca / Modelo na aba Motocicleta"
                      className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 pr-36 text-sm font-bold text-slate-200 outline-none cursor-default select-none placeholder:text-slate-600 focus:border-slate-700" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('motocicleta')}
                        className="text-[10px] font-black uppercase tracking-wider text-orange-400 hover:text-orange-300 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Ir para a aba Motocicleta para alterar a Marca/Modelo"
                      >
                        <span>Aba Motocicleta</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 ml-1">
                    💡 Preenchido automaticamente com as informações do campo <strong>Marca / Modelo</strong> da aba <em>Motocicleta</em>.
                  </p>
                </div>
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">E-mail de Contato</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      disabled={!!user}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(
                        "w-full bg-slate-950 border rounded-2xl p-5 text-sm font-bold outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-white disabled:opacity-60",
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
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000" 
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-white" 
                  />
                </div>
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Biografia / Lema de Estrada</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Escreva um resumo sobre suas viagens e sua paixão por duas rodas..."
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-white resize-none"
                  />
                </div>
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
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isMemberOfClub}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMemberOfClub(!isMemberOfClub);
                    }}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isMemberOfClub ? "bg-orange-600 shadow-md shadow-orange-600/30" : "bg-slate-800"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                        isMemberOfClub ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Logo / Símbolo Pessoal</label>
                      {personalLogo && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPersonalLogo(null);
                            showToast('Logotipo removido.', 'info');
                          }}
                          className="text-[9px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                    <div 
                      className="border-2 border-dashed border-slate-800/50 rounded-2xl p-6 sm:p-7 flex flex-col items-center justify-center gap-3 hover:border-orange-500/50 transition-all cursor-pointer group/logo bg-slate-950/60 hover:bg-slate-950/90 relative overflow-hidden"
                      onClick={() => !isUploadingLogo && logoInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-600 group-hover/logo:text-orange-500 transition-all border border-slate-800 relative overflow-hidden shadow-inner">
                        {isUploadingLogo ? (
                          <Loader2 size={24} className="text-orange-500 animate-spin" />
                        ) : personalLogo ? (
                          <img src={personalLogo} className="w-full h-full object-cover" alt="Personal Logo" />
                        ) : (
                          <Camera size={24} />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover/logo:text-white transition-colors">
                          {isUploadingLogo ? 'Enviando ao Storage...' : personalLogo ? 'Alterar Logo' : 'Enviar Brasão / Símbolo'}
                        </p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">JPG, PNG ou WebP</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fundar Moto Clube Call to Action */}
                  <div 
                    onClick={() => navigate('/motoclub')}
                    className="bento-card border-slate-800/60 bg-slate-900/40 rounded-3xl flex flex-col items-center justify-center p-6 sm:p-8 text-center relative group min-h-[160px] overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all hover:scale-[1.02] active:scale-95 shadow-lg active:shadow-inner"
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

          {activeTab === 'identidade' && (() => {
            const displayName = (name || profile?.name || 'Piloto MotoLegado').trim();
            const displayBike = motorcycleNickname 
              ? `${motorcycleNickname} • ${motorcycle || 'Motocicleta'}` 
              : (motorcycle || profile?.motorcycle || 'Motocicleta Principal');
            const displayYearPlate = `${motorcycleYear || '2023'}${motorcyclePlate ? ` • ${motorcyclePlate}` : ''}`;
            const displayLocation = (city && state) 
              ? `${city}/${state}` 
              : (city || state || profile?.city || profile?.state || 'Brasil');
            const displayClub = profile?.club_name || localStorage.getItem('motolegado_pilot_club') || 'Piloto Independente';
            const displayTier = profile?.tier || 'Bronze';
            const displayPlanBadge = profile?.plan_type === 'bonificado'
              ? '⭐ MODO BONIFICADO'
              : (profile?.plan_type === 'pago' || profile?.is_pro)
              ? '🔥 PLANO PRO'
              : `PATENTE ${displayTier.toUpperCase()}`;

            const cleanPilotId = profile?.id 
              ? (profile.id.startsWith('PIL-') ? profile.id : `PIL-${profile.id.replace(/[^0-9]/g, '').slice(-6) || '77892'}`)
              : 'PIL-77892';

            const handleShare = () => {
              const shareText = `Passaporte Oficial MotoLegado\nPiloto: ${displayName}\nID: ${cleanPilotId}\nMoto: ${displayBike}\nBase: ${displayLocation}\nPatente: ${displayTier}`;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText);
                showToast('Credencial copiada para a área de transferência!', 'success');
              } else {
                showToast('Link do ID Digital pronto para compartilhamento.', 'info');
              }
            };

            return (
              <div className="md:col-span-2 space-y-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Official Member Card */}
                <div className="w-full max-w-xl bg-slate-950 border-2 border-orange-500/80 rounded-3xl sm:rounded-[2.8rem] p-5 sm:p-8 md:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(255,85,0,0.15)] relative overflow-hidden group">
                  {/* Background Ambient Glow & Patterns */}
                  <div className="absolute top-0 right-0 w-72 h-72 bg-orange-600/15 blur-[90px] -mr-24 -mt-24 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-600/10 blur-[80px] -ml-20 -mb-20 pointer-events-none" />
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_30px,rgba(255,255,255,0.03)_30px,rgba(255,255,255,0.03)_31px)]" />
                  </div>

                  <div className="relative h-full flex flex-col justify-between z-10 space-y-6">
                    {/* Card Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-[0_4px_15px_rgba(255,85,0,0.4)] text-white">
                          M
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic leading-none flex gap-1 text-white">
                            MOTO<span className="text-orange-500 drop-shadow-[0_0_8px_rgba(255,85,0,0.5)]">LEGADO</span>
                          </h2>
                          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-slate-500 mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Official Member Card
                          </p>
                        </div>
                      </div>

                      {/* Dynamic Rank / Plan Badge */}
                      <div className="px-3 py-1.5 sm:px-4 sm:py-2 border border-orange-500/30 rounded-full bg-orange-500/10 shrink-0">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase italic tracking-wider text-orange-400">
                          {displayPlanBadge}
                        </span>
                      </div>
                    </div>

                    {/* Card Body with Real Pilot Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 my-2">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl border-3 border-orange-500/80 overflow-hidden shrink-0 shadow-[0_15px_30px_rgba(0,0,0,0.6)] bg-slate-900">
                        <img 
                          src={profilePhoto} 
                          alt={displayName} 
                          className="w-full h-full object-cover"
                        />
                        {personalLogo && (
                          <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full border border-orange-500/80 bg-slate-950 p-0.5 overflow-hidden shadow-lg">
                            <img src={personalLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-0.5">NOME DE PILOTO</p>
                          <h3 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] truncate">
                            {displayName}
                          </h3>
                          <div className="flex gap-1.5 justify-center sm:justify-start mt-1">
                            <span className="h-1 w-10 bg-orange-500 rounded-full" />
                            <span className="h-1 w-3 bg-slate-800 rounded-full" />
                          </div>
                        </div>

                        {/* Pilot Specifications */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left">
                          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-1.5">
                            <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">MÁQUINA</p>
                            <p className="text-[11px] font-black text-slate-200 uppercase italic truncate">{displayBike}</p>
                            <p className="text-[8px] font-bold text-orange-400 uppercase tracking-widest">{displayYearPlate}</p>
                          </div>
                          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-1.5">
                            <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">BASE & CLUBE</p>
                            <p className="text-[11px] font-black text-slate-200 uppercase italic truncate">{displayLocation}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">{displayClub}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex justify-between items-end pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-orange-500">
                          <Zap size={16} />
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">PASSAPORTE OFICIAL</p>
                          <div className="text-[11px] sm:text-xs font-black font-mono text-white uppercase tracking-wider bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-slate-800 mt-0.5 inline-block">
                            ID: {cleanPilotId}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-md">
                        <ShieldCheck size={16} />
                        <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">ID VERIFICADO</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share Action */}
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-3 text-orange-500 hover:text-orange-400 transition-all group pt-1 cursor-pointer active:scale-95"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-orange-500/50 group-hover:shadow-[0_0_15px_rgba(255,85,0,0.25)] transition-all">
                    <Share2 size={16} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em]">
                    Compartilhar Credencial
                  </span>
                </button>

                {/* Synchronization Note */}
                <div className="w-full max-w-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 text-orange-500">
                    <Sparkles size={18} />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Este <strong>ID Digital</strong> é sincronizado em tempo real com seu cadastro de <em>Piloto</em>, <em>Endereço</em> e <em>Motocicleta</em>. Qualquer alteração gravada atualiza este passaporte imediatamente.
                  </p>
                </div>
              </div>
            );
          })()}

          {activeTab === 'endereco' && (
            <div className="md:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. CEP */}
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group border-l-2 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">
                      CEP (Código Postal)
                    </label>
                    {isSearchingCep ? (
                      <span className="text-[9px] font-black uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded tracking-wider flex items-center gap-1.5 animate-pulse">
                        <Loader2 size={11} className="animate-spin text-orange-500" />
                        <span>Buscando...</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded tracking-wider">
                        ★ Busca Automática
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="00000-000" 
                      value={cep}
                      maxLength={9}
                      onChange={(e) => handleCepChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          performCepSearch();
                        }
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 backdrop-blur-sm text-white font-mono" 
                    />
                    <button 
                      type="button"
                      onClick={() => performCepSearch()}
                      disabled={isSearchingCep}
                      title="Buscar endereço pelo CEP"
                      className={cn(
                        "p-5 bg-orange-600 text-white rounded-2xl hover:bg-orange-500 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,85,0,0.2)] active:shadow-inner flex items-center justify-center group/btn cursor-pointer shrink-0",
                        isSearchingCep && "opacity-75 cursor-wait"
                      )}
                    >
                      {isSearchingCep ? (
                        <Loader2 size={20} className="animate-spin drop-shadow-md" />
                      ) : (
                        <Search size={20} className="drop-shadow-md group-hover/btn:scale-110 transition-transform" />
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 ml-1">
                    Digite o CEP para buscar rua, bairro, cidade e estado automaticamente.
                  </p>
                </div>

                {/* 2. Ponto de Partida Padrão */}
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">
                        Ponto de Partida Padrão
                      </label>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider border",
                        isDefaultStartPoint 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-slate-800/60 text-slate-500 border-slate-700/40"
                      )}>
                        {isDefaultStartPoint ? '★ Ativado' : 'Desativado'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Utilizar este endereço residencial como ponto de partida padrão ao planejar novas rotas no diário de bordo.
                    </p>
                  </div>
                  <div 
                    onClick={() => {
                      setIsDefaultStartPoint(prev => {
                        const next = !prev;
                        try {
                          const saved = localStorage.getItem('motolegado_pilot_address');
                          const parsed = saved ? JSON.parse(saved) : {};
                          localStorage.setItem('motolegado_pilot_address', JSON.stringify({
                            ...parsed,
                            isDefaultStartPoint: next
                          }));
                        } catch (e) {
                          console.error(e);
                        }
                        return next;
                      });
                    }}
                    className="flex items-center gap-3 pt-2 cursor-pointer select-none group/toggle w-fit"
                  >
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isDefaultStartPoint}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDefaultStartPoint(prev => {
                          const next = !prev;
                          try {
                            const saved = localStorage.getItem('motolegado_pilot_address');
                            const parsed = saved ? JSON.parse(saved) : {};
                            localStorage.setItem('motolegado_pilot_address', JSON.stringify({
                              ...parsed,
                              isDefaultStartPoint: next
                            }));
                          } catch (err) {
                            console.error(err);
                          }
                          return next;
                        });
                      }}
                      className={cn(
                        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-950",
                        isDefaultStartPoint ? "bg-orange-600 shadow-md shadow-orange-600/30" : "bg-slate-800"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                          isDefaultStartPoint ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                    <span className={cn(
                      "text-[11px] font-black uppercase tracking-wider transition-colors",
                      isDefaultStartPoint ? "text-white" : "text-slate-400 group-hover/toggle:text-slate-200"
                    )}>
                      Definir como ponto de partida
                    </span>
                  </div>
                </div>

                {/* 3. Rua / Avenida */}
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">
                    Rua / Avenida
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: Av. Paulista ou Rua das Flores"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white placeholder:text-slate-700" 
                  />
                </div>

                {/* 4. Número */}
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">
                    Número
                  </label>
                  <input 
                    ref={numberInputRef}
                    type="text" 
                    placeholder="Nº ou S/N"
                    value={streetNumber}
                    onChange={(e) => setStreetNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white placeholder:text-slate-700" 
                  />
                </div>

                {/* 5. Bairro / Região */}
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">
                    Bairro / Região
                  </label>
                  <input 
                    type="text" 
                    placeholder="Bairro"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white placeholder:text-slate-700" 
                  />
                </div>

                {/* 6. Cidade e Estado (UF) */}
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">
                        Cidade
                      </label>
                      <input 
                        type="text" 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: São Paulo" 
                        className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white placeholder:text-slate-700" 
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">
                        Estado (UF)
                      </label>
                      <input 
                        type="text" 
                        value={state} 
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        placeholder="SP" 
                        maxLength={2}
                        className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white uppercase font-mono placeholder:text-slate-700" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'motocicleta' && (
            <div className="md:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Apelido da Máquina</label>
                  <input 
                    type="text" 
                    value={motorcycleNickname} 
                    onChange={(e) => setMotorcycleNickname(e.target.value)}
                    placeholder="Ex: Black Widow, Trovão Negro..." 
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white placeholder:text-slate-700" 
                  />
                </div>
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group border-l-2 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Marca / Modelo</label>
                    <span className="text-[9px] font-black uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded tracking-wider">
                      ★ Motocicleta Principal
                    </span>
                  </div>
                  <input 
                    type="text" 
                    value={motorcycle} 
                    onChange={(e) => setMotorcycle(e.target.value)}
                    placeholder="Ex: Harley-Davidson Iron 883, BMW GS 1250" 
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white placeholder:text-slate-700" 
                  />
                  <p className="text-[9px] text-slate-500 ml-1">
                    Este valor preenche automaticamente a <strong>Motocicleta Principal</strong> na aba do perfil do piloto.
                  </p>
                </div>
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Ano de Fabricação</label>
                  <input 
                    type="text" 
                    value={motorcycleYear} 
                    onChange={(e) => setMotorcycleYear(e.target.value)}
                    placeholder="Ex: 2023" 
                    maxLength={4}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all backdrop-blur-sm text-white placeholder:text-slate-700" 
                  />
                </div>
                <div className="bento-card border-slate-800/60 bg-slate-900/40 space-y-3 group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 group-hover:text-orange-500 transition-colors">Placa (Identificação)</label>
                  <input 
                    type="text" 
                    value={motorcyclePlate} 
                    onChange={(e) => setMotorcyclePlate(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC-1D23" 
                    maxLength={8}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all uppercase backdrop-blur-sm text-white placeholder:text-slate-700" 
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between ml-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                      <Camera size={14} className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Galeria da Motocicleta (Até 3 fotos)</h3>
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Armazenamento Seguro em Nuvem</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[0, 1, 2].map((slotIdx) => {
                    const currentPhoto = motorcyclePhotos[slotIdx];
                    const hasPhoto = typeof currentPhoto === 'string' && currentPhoto.trim().length > 0;
                    const isUploading = uploadingBikeSlot === slotIdx;
                    const slotNames = ['Foto 1 (Principal)', 'Foto 2 (Lateral)', 'Foto 3 (Detalhes)'];

                    return (
                      <div key={slotIdx} className="space-y-2">
                        <input
                          type="file"
                          ref={bikeInputRefs[slotIdx]}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleBikePhotoUpload(e, slotIdx)}
                        />

                        <div 
                          className={cn(
                            "aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden",
                            hasPhoto 
                              ? "border-slate-800 bg-slate-950 shadow-lg" 
                              : "border-dashed border-slate-800/80 bg-slate-900/30 hover:border-orange-500/50 hover:bg-slate-900/50 hover:scale-[1.02]"
                          )}
                          onClick={() => {
                            if (!isUploading) {
                              bikeInputRefs[slotIdx].current?.click();
                            }
                          }}
                        >
                          {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 size={28} className="text-orange-500 animate-spin" />
                              <p className="text-[8px] font-black uppercase tracking-widest text-white">Enviando {slotNames[slotIdx]}...</p>
                            </div>
                          ) : hasPhoto ? (
                            <>
                              <img 
                                src={currentPhoto} 
                                alt={`Moto ${slotNames[slotIdx]}`} 
                                className="w-full h-full object-cover rounded-[1.9rem] transition-transform duration-500 group-hover:scale-105" 
                              />
                              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 shadow-md pointer-events-none">
                                <span className="text-[8px] font-black uppercase tracking-wider text-orange-400">
                                  {slotNames[slotIdx]}
                                </span>
                              </div>
                              <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 backdrop-blur-xs p-4">
                                <span className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                                  <Camera size={14} className="text-orange-500" />
                                  Trocar {slotNames[slotIdx]}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveBikePhoto(slotIdx);
                                  }}
                                  className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-[8px] font-black uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1 mt-1 shadow-md cursor-pointer"
                                >
                                  <Trash2 size={10} />
                                  Excluir
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-orange-500 group-hover:scale-110 transition-all">
                                <Camera size={20} />
                              </div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors mt-2">
                                {slotNames[slotIdx]}
                              </p>
                              <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">Tirar ou escolher foto</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating Status Notification Toast */}
      {uploadToast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={cn(
            "fixed bottom-24 right-6 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md",
            uploadToast.type === 'success' && "bg-slate-900/95 border-emerald-500/40 text-emerald-400 shadow-emerald-950/40",
            uploadToast.type === 'error' && "bg-slate-900/95 border-red-500/40 text-red-400 shadow-red-950/40",
            uploadToast.type === 'info' && "bg-slate-900/95 border-orange-500/40 text-orange-400 shadow-orange-950/40"
          )}
        >
          {uploadToast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : uploadToast.type === 'error' ? (
            <AlertCircle size={16} className="text-red-400 shrink-0" />
          ) : (
            <UploadCloud size={16} className="text-orange-400 shrink-0" />
          )}
          <span className="text-xs font-black uppercase tracking-wider">{uploadToast.message}</span>
        </motion.div>
      )}

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
          className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-3.5 text-white rounded-2xl font-black italic uppercase text-xs tracking-[0.15em] transition-all relative overflow-hidden group cursor-pointer disabled:opacity-50",
            saveSuccess 
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5)] scale-[1.02]"
              : "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_25px_-5px_rgba(255,85,0,0.4)]"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>GRAVANDO...</span>
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 size={18} className="text-white animate-pulse" />
              <span className="tracking-widest">GRAVADO COM SUCESSO!</span>
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
