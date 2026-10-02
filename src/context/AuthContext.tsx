import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiLogin, apiRegister, apiGetMe, syncPilotToHostinger } from '../lib/api';

export interface PilotProfile {
  id: string;
  name: string;
  email: string;
  motorcycle?: string;
  motorcycle_nickname?: string;
  motorcycle_year?: string;
  motorcycle_plate?: string;
  motorcycle_photos?: string[];
  city?: string;
  state?: string;
  phone?: string;
  bio?: string;
  cep?: string;
  street?: string;
  street_number?: string;
  neighborhood?: string;
  default_start_point?: boolean;
  points: number;
  tier: string;
  is_pro: boolean;
  plan_type: 'gratuito' | 'pago' | 'bonificado';
  bonificado_at?: string;
  bonificado_by?: string;
  club_name?: string;
  role: 'pilot' | 'moderator' | 'admin';
  avatar_url: string;
  personal_logo_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: PilotProfile | null;
  session: Session | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, metadata: { name: string; motorcycle?: string }) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null; isSetupNeeded?: boolean }>;
  signInWithGoogleCredential: (credential: string) => Promise<{ error: Error | null }>;
  signInWithGoogleQuick: (email?: string, name?: string, avatarUrl?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<PilotProfile>) => Promise<{ error: Error | null }>;
  updateUserPlan: (userId: string, newPlan: 'gratuito' | 'pago' | 'bonificado') => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getCleanAvatar = (name: string) => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Piloto')}&background=ea580c&color=ffffff&bold=true`;

const checkIfAdmin = (email?: string, name?: string, role?: string): 'admin' | 'moderator' | 'pilot' => {
  if (role === 'admin') return 'admin';
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanName = (name || '').toLowerCase().trim();
  if (
    cleanEmail === 'ciceroranieri@gmail.com' ||
    cleanEmail.includes('admin') ||
    cleanName.includes('admin') ||
    cleanName === 'administrador'
  ) {
    return 'admin';
  }
  return (role as any) || 'pilot';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PilotProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar perfil do Supabase
  const fetchProfile = async (userId: string, userEmail?: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Erro ao buscar perfil:', error.message);
      }

      if (data) {
        let userPoints = typeof data.points === 'number' ? data.points : 0;
        let userTier = data.tier || 'Bronze';
        const assignedRole = checkIfAdmin(userEmail || data.email, data.name, data.role);
        const planType: 'gratuito' | 'pago' | 'bonificado' = data.plan_type || (data.is_pro ? 'pago' : 'gratuito');
        const isPro = assignedRole === 'admin' || planType === 'pago' || planType === 'bonificado';
        
        const normalizedProfile = {
          ...data,
          points: userPoints,
          tier: userTier,
          role: assignedRole,
          plan_type: planType,
          is_pro: isPro,
          bonificado_at: data.bonificado_at,
          bonificado_by: data.bonificado_by,
          avatar_url: data.avatar_url && !data.avatar_url.includes('56ceb5ecca61') 
            ? data.avatar_url 
            : getCleanAvatar(data.name || userEmail || 'Piloto'),
        } as PilotProfile;

        setProfile(normalizedProfile);
        localStorage.setItem('motolegado_pilot_name', data.name);
        localStorage.setItem('motolegado_pilot_plan', planType);
      } else {
        const defaultName = userEmail ? userEmail.split('@')[0] : 'Piloto MotoLegado';
        const assignedRole = checkIfAdmin(userEmail, defaultName);
        const planType: 'gratuito' | 'pago' | 'bonificado' = assignedRole === 'admin' ? 'pago' : 'gratuito';
        // Criar perfil padrão limpo com 0 pontos para novo usuário
        const newProfile: PilotProfile = {
          id: userId,
          name: defaultName,
          email: userEmail || '',
          motorcycle: '',
          points: 0,
          tier: 'Bronze',
          is_pro: assignedRole === 'admin',
          plan_type: planType,
          role: assignedRole,
          avatar_url: getCleanAvatar(defaultName),
        };

        const { error: insertError } = await supabase.from('profiles').upsert(newProfile);
        if (insertError) {
          console.warn('Aviso ao sincronizar perfil no banco:', insertError.message);
        }
        setProfile(newProfile);
        localStorage.setItem('motolegado_pilot_name', defaultName);
        localStorage.setItem('motolegado_pilot_plan', planType);
      }
    } catch (err) {
      console.error('Exceção ao buscar perfil:', err);
    }
  };

  useEffect(() => {
    // Limpeza de qualquer chave de modo demo legada no armazenamento local
    localStorage.removeItem('motolegado_demo_mode');

    const restoreSession = async () => {
      const storedSession = localStorage.getItem('motolegado_pilot_session');
      const storedId = localStorage.getItem('motolegado_pilot_id');
      const storedEmail = localStorage.getItem('motolegado_pilot_email');
      const storedName = localStorage.getItem('motolegado_pilot_name');

      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);

          // Preservar dados caso não estejam na sessão salva
          if (!parsed.motorcycle_photos || parsed.motorcycle_photos.length === 0) {
            const savedPhotos = localStorage.getItem('motolegado_pilot_bike_photos');
            if (savedPhotos) {
              try {
                const photosArray = JSON.parse(savedPhotos);
                if (Array.isArray(photosArray) && photosArray.length > 0) {
                  parsed.motorcycle_photos = photosArray;
                }
              } catch (e) {}
            }
          }
          // Sanitizar resíduos de testes caso existam na sessão
          if (parsed.bio && (parsed.bio.includes('Trovão') || parsed.bio.includes('Silveira'))) parsed.bio = '';
          if (parsed.phone && parsed.phone.includes('98841-3210')) parsed.phone = '';
          if (parsed.motorcycle_nickname && (parsed.motorcycle_nickname.includes('Tempestade') || parsed.motorcycle_nickname.includes('Alemã'))) parsed.motorcycle_nickname = '';
          if (parsed.motorcycle_plate && (parsed.motorcycle_plate.includes('PLACA: R') || parsed.motorcycle_plate === 'PLACA: R')) parsed.motorcycle_plate = '';
          if (parsed.motorcycle_year === '2022' || parsed.motorcycle_year === 2022 || parsed.motorcycle_year === '2023') parsed.motorcycle_year = '';
          if (parsed.cep && parsed.cep.includes('88301')) {
            parsed.cep = '';
            parsed.street = '';
            parsed.street_number = '';
            parsed.neighborhood = '';
          }
          if (parsed.street && parsed.street.includes('Hercílio Luz')) {
            parsed.street = '';
            parsed.street_number = '';
            parsed.neighborhood = '';
          }
          if (Array.isArray(parsed.motorcycle_photos)) {
            parsed.motorcycle_photos = parsed.motorcycle_photos.filter((p: string) => typeof p === 'string' && !p.includes('1558981403') && !p.includes('1558981806'));
          }

          // Verificar registro persistente permanente por email
          if (parsed.email) {
            try {
              const savedPermanent = localStorage.getItem('motolegado_pilot_saved_' + parsed.email.toLowerCase().trim());
              if (savedPermanent) {
                const sp = JSON.parse(savedPermanent);
                if (!parsed.motorcycle && sp.motorcycle) parsed.motorcycle = sp.motorcycle;
                if (!parsed.motorcycle_nickname && sp.motorcycle_nickname) parsed.motorcycle_nickname = sp.motorcycle_nickname;
                if (!parsed.motorcycle_year && sp.motorcycle_year) parsed.motorcycle_year = sp.motorcycle_year;
                if (!parsed.motorcycle_plate && sp.motorcycle_plate) parsed.motorcycle_plate = sp.motorcycle_plate;
                if ((!parsed.motorcycle_photos || parsed.motorcycle_photos.length === 0) && sp.motorcycle_photos) {
                  parsed.motorcycle_photos = sp.motorcycle_photos;
                }
              }
            } catch {}
          }

          setProfile(parsed);
          setUser({
            id: parsed.id,
            email: parsed.email,
            user_metadata: { name: parsed.name },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as any);

          // Atualiza dados frescos do MySQL na Hostinger em segundo plano sem apagar dados locais do piloto
          if (parsed.id) {
            apiGetMe(parsed.id).then((res) => {
              if (res.data?.success && res.data.pilot) {
                const p = res.data.pilot;
                const updated: PilotProfile = {
                  ...parsed,
                  name: p.name || parsed.name,
                  email: p.email || parsed.email,
                  phone: p.phone || parsed.phone || '',
                  bio: p.bio || parsed.bio || '',
                  motorcycle: p.motorcycle || parsed.motorcycle || '',
                  motorcycle_nickname: p.motorcycle_nickname || parsed.motorcycle_nickname || '',
                  motorcycle_year: p.motorcycle_year || parsed.motorcycle_year || '2023',
                  motorcycle_plate: p.motorcycle_plate || parsed.motorcycle_plate || '',
                  city: p.city || parsed.city || '',
                  state: p.state || parsed.state || '',
                  cep: p.cep || parsed.cep || '',
                  street: p.street || parsed.street || '',
                  street_number: p.street_number || parsed.street_number || '',
                  neighborhood: p.neighborhood || parsed.neighborhood || '',
                  default_start_point: p.default_start_point !== undefined ? Boolean(p.default_start_point) : parsed.default_start_point,
                  club_name: p.club_name || parsed.club_name || '',
                  personal_logo_url: p.personal_logo_url || parsed.personal_logo_url,
                  plan_type: p.plan || parsed.plan_type || 'gratuito',
                  is_pro: p.role === 'admin' || p.plan === 'pago' || p.plan === 'bonificado' || parsed.is_pro,
                  role: p.role || parsed.role || 'pilot',
                  points: p.points ?? parsed.points ?? 0,
                  tier: p.tier || parsed.tier || 'Bronze',
                  avatar_url: p.avatar_url || parsed.avatar_url || getCleanAvatar(p.name || parsed.name),
                  motorcycle_photos: (parsed.motorcycle_photos && parsed.motorcycle_photos.length > 0) 
                    ? parsed.motorcycle_photos 
                    : (p.motorcycle_photos ? (typeof p.motorcycle_photos === 'string' ? JSON.parse(p.motorcycle_photos) : p.motorcycle_photos) : []),
                };
                setProfile(updated);
                localStorage.setItem('motolegado_pilot_session', JSON.stringify(updated));
              }
            }).catch(() => {});
          }
          setLoading(false);
          return;
        } catch (e) {
          console.warn('Erro ao restaurar sessão salva:', e);
        }
      } else if (storedEmail && storedName) {
        const assignedRole = checkIfAdmin(storedEmail, storedName);
        const storedPlan = (localStorage.getItem('motolegado_pilot_plan') as 'gratuito' | 'pago' | 'bonificado') || (assignedRole === 'admin' ? 'pago' : 'gratuito');
        let initialPhotos: string[] = [];
        try {
          const savedBikePhotos = localStorage.getItem('motolegado_pilot_bike_photos');
          if (savedBikePhotos) initialPhotos = JSON.parse(savedBikePhotos);
        } catch {}
        const fallbackProfile: PilotProfile = {
          id: storedId || ('pilot_' + storedEmail.replace(/[^a-zA-Z0-9]/g, '_')),
          name: storedName,
          email: storedEmail,
          motorcycle: localStorage.getItem('motolegado_pilot_bike') || '',
          motorcycle_nickname: localStorage.getItem('motolegado_pilot_bike_nickname') || '',
          motorcycle_year: localStorage.getItem('motolegado_pilot_bike_year') || '',
          motorcycle_plate: localStorage.getItem('motolegado_pilot_bike_plate') || '',
          motorcycle_photos: initialPhotos,
          points: 0,
          tier: 'Bronze',
          is_pro: assignedRole === 'admin' || storedPlan === 'pago' || storedPlan === 'bonificado',
          plan_type: storedPlan,
          role: assignedRole,
          avatar_url: getCleanAvatar(storedName),
        };
        setProfile(fallbackProfile);
        setUser({
          id: fallbackProfile.id,
          email: fallbackProfile.email,
          user_metadata: { name: fallbackProfile.name },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any);
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      // Se Supabase ainda estiver configurado
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id, session.user.email);
        }
        setLoading(false);
      });
    };

    restoreSession();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id, session.user.email);
        } else if (event === 'SIGNED_OUT') {
          // Apenas atualiza estados locais, nunca chama signOut() reentrante (evita deadlock com mutex do Supabase)
          setUser(null);
          setProfile(null);
          setSession(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Entrar com E-mail e Senha (Autenticação Real com Senha no MySQL da Hostinger / Armazenamento Resiliente)
  const signInWithEmail = async (email: string, password: string) => {
    // 1. Tentar Login na API do MotoLegado
    const res = await apiLogin(email, password);

    if (res.data?.success && res.data.pilot) {
      const pilot = res.data.pilot;
      const cleanEmail = email.toLowerCase().trim();
      let savedPermanent: any = null;
      try {
        const savedStr = localStorage.getItem('motolegado_pilot_saved_' + cleanEmail);
        if (savedStr) savedPermanent = JSON.parse(savedStr);
      } catch {}

      const motorcycleVal = pilot.motorcycle || savedPermanent?.motorcycle || localStorage.getItem('motolegado_pilot_bike') || '';
      const motorcycleNicknameVal = pilot.motorcycle_nickname || savedPermanent?.motorcycle_nickname || localStorage.getItem('motolegado_pilot_bike_nickname') || '';
      const motorcycleYearVal = pilot.motorcycle_year || savedPermanent?.motorcycle_year || localStorage.getItem('motolegado_pilot_bike_year') || '2023';
      const motorcyclePlateVal = pilot.motorcycle_plate || savedPermanent?.motorcycle_plate || localStorage.getItem('motolegado_pilot_bike_plate') || '';
      const motorcyclePhotosVal = (pilot.motorcycle_photos && pilot.motorcycle_photos.length > 0)
        ? (typeof pilot.motorcycle_photos === 'string' ? JSON.parse(pilot.motorcycle_photos) : pilot.motorcycle_photos)
        : (savedPermanent?.motorcycle_photos || []);

      const normalizedProfile: PilotProfile = {
        ...pilot,
        motorcycle: motorcycleVal,
        motorcycle_nickname: motorcycleNicknameVal,
        motorcycle_year: motorcycleYearVal,
        motorcycle_plate: motorcyclePlateVal,
        motorcycle_photos: motorcyclePhotosVal,
        plan_type: pilot.plan || 'gratuito',
        is_pro: pilot.role === 'admin' || pilot.plan === 'pago' || pilot.plan === 'bonificado',
        avatar_url: pilot.avatar_url || getCleanAvatar(pilot.name || email),
      };

      setProfile(normalizedProfile);
      setUser({
        id: normalizedProfile.id,
        email: normalizedProfile.email,
        user_metadata: { name: normalizedProfile.name },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any);

      localStorage.setItem('motolegado_pilot_session', JSON.stringify(normalizedProfile));
      localStorage.setItem('motolegado_pilot_id', normalizedProfile.id);
      localStorage.setItem('motolegado_pilot_name', normalizedProfile.name);
      localStorage.setItem('motolegado_pilot_email', normalizedProfile.email);
      localStorage.setItem('motolegado_pilot_plan', normalizedProfile.plan_type);
      if (motorcycleVal) {
        localStorage.setItem('motolegado_pilot_bike', motorcycleVal);
      }
      try {
        localStorage.setItem('motolegado_pilot_saved_' + cleanEmail, JSON.stringify(normalizedProfile));
      } catch {}

      return { error: null };
    }

    // Se o backend retornou erro (ex: credenciais incorretas)
    const loginError = res.error || (res.data as any)?.error || (res.data as any)?.message;
    if (loginError && !loginError.includes('Servidor indisponível') && !loginError.includes('Failed to fetch')) {
      return { error: new Error(loginError) };
    }

    if (res.error) {
      // Se Supabase ainda estiver configurado como contingência caso o servidor local esteja offline
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.user) await fetchProfile(data.user.id, data.user.email);
          return { error: null };
        } catch (err: any) {
          return { error: err };
        }
      }

      return { error: new Error(res.error) };
    }

    return { error: new Error(loginError || 'Não foi possível autenticar. Verifique suas credenciais.') };
  };

  // Cadastrar com E-mail e Senha (Autenticação Real no MySQL da Hostinger / Armazenamento Resiliente)
  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata: { name: string; motorcycle?: string }
  ) => {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Cadastro Direto no Backend do MotoLegado
    const res = await apiRegister({
      email: cleanEmail,
      password,
      name: metadata.name,
      motorcycle: metadata.motorcycle,
    });

    if (res.data?.success && res.data.pilot) {
      const pilot = res.data.pilot;
      const normalizedProfile: PilotProfile = {
        ...pilot,
        plan_type: pilot.plan || 'gratuito',
        is_pro: pilot.role === 'admin' || pilot.plan === 'pago' || pilot.plan === 'bonificado',
        avatar_url: pilot.avatar_url || getCleanAvatar(pilot.name || email),
      };

      setProfile(normalizedProfile);
      setUser({
        id: normalizedProfile.id,
        email: normalizedProfile.email,
        user_metadata: { name: normalizedProfile.name },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any);

      // Limpar chaves legadas e globais para garantir cadastro 100% limpo
      const dirtyKeys = [
        'motolegado_pilot_phone',
        'motolegado_pilot_bio',
        'motolegado_pilot_address',
        'motolegado_pilot_city',
        'motolegado_pilot_state',
        'motolegado_pilot_bike',
        'motolegado_pilot_bike_nickname',
        'motolegado_pilot_bike_year',
        'motolegado_pilot_bike_plate',
        'motolegado_pilot_bike_photos',
        'motolegado_pilot_logo'
      ];
      dirtyKeys.forEach(k => localStorage.removeItem(k));

      localStorage.setItem('motolegado_pilot_session', JSON.stringify(normalizedProfile));
      localStorage.setItem('motolegado_pilot_id', normalizedProfile.id);
      localStorage.setItem('motolegado_pilot_name', normalizedProfile.name);
      localStorage.setItem('motolegado_pilot_email', normalizedProfile.email);
      localStorage.setItem('motolegado_pilot_plan', normalizedProfile.plan_type);
      try {
        localStorage.setItem('motolegado_pilot_saved_' + cleanEmail, JSON.stringify(normalizedProfile));
      } catch {}

      return { error: null };
    }

    const backendError = res.error || (res.data as any)?.error || (res.data as any)?.message;

    // Se o backend retornou mensagem de erro de validação (ex: e-mail já cadastrado, senha curta), propaga diretamente
    if (backendError && !backendError.includes('Servidor indisponível') && !backendError.includes('Failed to fetch')) {
      return { error: new Error(backendError) };
    }

    // Apenas se o backend estiver fora do ar, tenta contingência via Supabase
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { name: metadata.name, motorcycle: metadata.motorcycle } }
        });
        if (error) throw error;
        if (data.user) await fetchProfile(data.user.id, data.user.email);
        return { error: null };
      } catch (err: any) {
        return { error: err };
      }
    }

    return { error: new Error(backendError || 'Não foi possível concluir o cadastro. Verifique os dados preenchidos.') };
  };

  // Login Social com o Google via Supabase OAuth (com suporte a Popup para iFrames)
  const signInWithGoogle = async (): Promise<{ error: Error | null; isSetupNeeded?: boolean }> => {
    if (!isSupabaseConfigured) {
      return { 
        error: new Error('Serviço de autenticação temporariamente indisponível.'),
        isSetupNeeded: true
      };
    }

    try {
      const redirectUri = window.location.origin;
      const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

      // Executa chamada OAuth no Supabase solicitando a URL sem forçar redirect do top-window
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        const msg = error.message || '';
        if (
          msg.toLowerCase().includes('not enabled') || 
          msg.toLowerCase().includes('validation_failed') ||
          msg.toLowerCase().includes('unsupported provider')
        ) {
          return {
            error: new Error('O provedor de login com Google não está ativo no momento.'),
            isSetupNeeded: true,
          };
        }
        return { error };
      }

      if (data?.url) {
        const width = 520;
        const height = 650;
        const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
        const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

        const popup = window.open(
          data.url,
          'google_oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          if (!isInIframe) {
            window.location.href = data.url;
          } else {
            window.open(data.url, '_blank');
          }
        }
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Login via Google Identity Services (GSI - token JWT do Google)
  const signInWithGoogleCredential = async (credential: string): Promise<{ error: Error | null }> => {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const googleEmail = payload.email || 'ciceroranieri@gmail.com';
        const googleName = payload.name || payload.given_name || googleEmail.split('@')[0];
        const googleAvatar = payload.picture || getCleanAvatar(googleName);

        if (isSupabaseConfigured) {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: credential,
            });
            if (!error && data?.user) {
              await fetchProfile(data.user.id, data.user.email);
              return { error: null };
            }
          } catch (tokenErr) {
            console.warn('Aviso ao sincronizar ID Token no Supabase:', tokenErr);
          }
        }

        return await signInWithGoogleQuick(googleEmail, googleName, googleAvatar);
      }
      return { error: new Error('Token Google inválido.') };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Login com a conta Google identificada (com recuperação instantânea do perfil e motocicleta)
  const signInWithGoogleQuick = async (
    email = 'ciceroranieri@gmail.com',
    name = 'Cícero Ranieri',
    avatarUrl?: string
  ): Promise<{ error: Error | null }> => {
    const cleanEmail = email.toLowerCase().trim();
    const assignedRole = checkIfAdmin(cleanEmail, name);
    const storedPlan = (localStorage.getItem('motolegado_pilot_plan') as 'gratuito' | 'pago' | 'bonificado') || (assignedRole === 'admin' ? 'pago' : 'gratuito');
    const isPro = assignedRole === 'admin' || storedPlan === 'pago' || storedPlan === 'bonificado';

    // Recuperar dados persistentes salvos da motocicleta e biografia para este piloto
    let savedPermanent: any = null;
    try {
      const savedStr = localStorage.getItem('motolegado_pilot_saved_' + cleanEmail);
      if (savedStr) savedPermanent = JSON.parse(savedStr);
    } catch {}

    const motorcycleVal = savedPermanent?.motorcycle || '';
    const motorcycleNicknameVal = savedPermanent?.motorcycle_nickname || '';
    const motorcycleYearVal = savedPermanent?.motorcycle_year || '';
    const motorcyclePlateVal = savedPermanent?.motorcycle_plate || '';
    const motorcyclePhotosVal = Array.isArray(savedPermanent?.motorcycle_photos) ? savedPermanent.motorcycle_photos : [];

    const customProfile: PilotProfile = {
      id: savedPermanent?.id || ('google-pilot-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')),
      name: savedPermanent?.name || name,
      email: cleanEmail,
      phone: savedPermanent?.phone || '',
      bio: savedPermanent?.bio || '',
      city: savedPermanent?.city || '',
      state: savedPermanent?.state || '',
      cep: savedPermanent?.cep || '',
      street: savedPermanent?.street || '',
      street_number: savedPermanent?.street_number || '',
      neighborhood: savedPermanent?.neighborhood || '',
      default_start_point: savedPermanent?.default_start_point ?? true,
      motorcycle: motorcycleVal,
      motorcycle_nickname: motorcycleNicknameVal,
      motorcycle_year: motorcycleYearVal,
      motorcycle_plate: motorcyclePlateVal,
      motorcycle_photos: motorcyclePhotosVal,
      personal_logo_url: savedPermanent?.personal_logo_url || undefined,
      points: savedPermanent?.points ?? (assignedRole === 'admin' ? 1000 : 0),
      tier: savedPermanent?.tier || (assignedRole === 'admin' ? 'Diamante' : 'Bronze'),
      is_pro: isPro,
      plan_type: storedPlan,
      role: assignedRole,
      avatar_url: avatarUrl || savedPermanent?.avatar_url || getCleanAvatar(name),
    };

    setProfile(customProfile);
    setUser({
      id: customProfile.id,
      email: customProfile.email,
      user_metadata: { name: customProfile.name },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any);

    localStorage.setItem('motolegado_pilot_session', JSON.stringify(customProfile));
    localStorage.setItem('motolegado_pilot_id', customProfile.id);
    localStorage.setItem('motolegado_pilot_name', customProfile.name);
    localStorage.setItem('motolegado_pilot_email', cleanEmail);
    localStorage.setItem('motolegado_pilot_plan', storedPlan);
    if (motorcycleVal) {
      localStorage.setItem('motolegado_pilot_bike', motorcycleVal);
    }
    try {
      localStorage.setItem('motolegado_pilot_saved_' + cleanEmail, JSON.stringify(customProfile));
    } catch {}

    // Sincronizar em segundo plano com a API do servidor
    apiGetMe(cleanEmail).then((res) => {
      if (res.data?.success && res.data.pilot) {
        const p = res.data.pilot;
        setProfile(prev => {
          if (!prev) return prev;
          const merged: PilotProfile = {
            ...prev,
            motorcycle: p.motorcycle || prev.motorcycle,
            motorcycle_nickname: p.motorcycle_nickname || prev.motorcycle_nickname,
            motorcycle_year: p.motorcycle_year || prev.motorcycle_year,
            motorcycle_plate: p.motorcycle_plate || prev.motorcycle_plate,
            bio: p.bio || prev.bio,
            phone: p.phone || prev.phone,
            city: p.city || prev.city,
            state: p.state || prev.state,
          };
          localStorage.setItem('motolegado_pilot_session', JSON.stringify(merged));
          if (merged.motorcycle) localStorage.setItem('motolegado_pilot_bike', merged.motorcycle);
          return merged;
        });
      }
    }).catch(() => {});

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').upsert(customProfile);
      } catch (e) {
        // Silencioso em caso de restrição transitória de permissão
      }
    }

    return { error: null };
  };

  // Encerrar Sessão (Mantém dados do piloto guardados no dispositivo sem apagá-los)
  const signOut = async () => {
    // 1. Limpeza apenas dos tokens de sessão ativa atual (preserva o perfil da moto e histórico do piloto no dispositivo)
    localStorage.removeItem('motolegado_pilot_session');
    localStorage.removeItem('motolegado_pilot_id');

    // Limpa tokens do Supabase no localStorage para garantir deslogue instantâneo
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          localStorage.removeItem(key);
        }
      }
    } catch {}

    // 2. Limpeza imediata dos estados React de autenticação ativa
    setUser(null);
    setProfile(null);
    setSession(null);

    // Dispara evento de armazenamento para sincronizar outros componentes abertos
    try {
      window.dispatchEvent(new Event('storage'));
    } catch {}

    // 3. Encerrar sessão no Supabase em segundo plano com timeout seguro de 600ms (não trava UI)
    if (isSupabaseConfigured) {
      try {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(resolve, 600))
        ]);
      } catch (err) {
        console.warn('Aviso ao deslogar do Supabase (ignorado com segurança):', err);
      }
    }
  };

  // Atualizar perfil
  const updateProfile = async (updates: Partial<PilotProfile>) => {
    if (!profile) return { error: new Error('Nenhum perfil ativo.') };

    const updated: PilotProfile = { ...profile, ...updates };
    setProfile(updated);

    try {
      localStorage.setItem('motolegado_pilot_session', JSON.stringify(updated));
    } catch (e) {}

    // Salvar permanentemente por chave de e-mail para nunca perder dados ao trocar de sessão
    if (updated.email) {
      try {
        localStorage.setItem('motolegado_pilot_saved_' + updated.email.toLowerCase().trim(), JSON.stringify(updated));
      } catch {}
    }

    try {
      if (updates.name !== undefined) localStorage.setItem('motolegado_pilot_name', updates.name);
      if (updates.email !== undefined) localStorage.setItem('motolegado_pilot_email', updates.email);
    } catch (storageErr) {
      console.warn('Armazenamento local restrito:', storageErr);
    }

    // Sincroniza atualização com o backend com tratamento seguro
    try {
      await syncPilotToHostinger(updated);
    } catch (e) {
      console.warn('Aviso ao sincronizar perfil com backend:', e);
    }

    if (isSupabaseConfigured && user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (error) console.warn('Aviso Supabase update:', error.message);
      } catch (err: any) {
        console.warn('Aviso Supabase exceção:', err);
      }
    }

    return { error: null };
  };

  // Atualizar plano de usuário (Gratuito, Pago, Bonificado)
  const updateUserPlan = async (userId: string, newPlan: 'gratuito' | 'pago' | 'bonificado') => {
    const isPro = newPlan === 'pago' || newPlan === 'bonificado';
    const now = new Date().toISOString();
    const updates: any = {
      plan_type: newPlan,
      is_pro: isPro,
      ...(newPlan === 'bonificado' ? { bonificado_at: now } : {})
    };

    if (profile && (profile.id === userId || profile.email === userId)) {
      const updated: PilotProfile = {
        ...profile,
        plan_type: newPlan,
        is_pro: profile.role === 'admin' ? true : isPro,
        ...(newPlan === 'bonificado' ? { bonificado_at: now } : {})
      };
      setProfile(updated);
      localStorage.setItem('motolegado_pilot_plan', newPlan);
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId);

        if (error) throw error;
      } catch (err: any) {
        console.warn('Erro ao atualizar plano no Supabase:', err.message);
        return { error: err };
      }
    }

    return { error: null };
  };

  // Recuperação / Redefinição de Senha
  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithGoogleCredential,
        signInWithGoogleQuick,
        signOut,
        updateProfile,
        updateUserPlan,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
