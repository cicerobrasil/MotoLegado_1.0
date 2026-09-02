import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface PilotProfile {
  id: string;
  name: string;
  email: string;
  motorcycle?: string;
  city?: string;
  state?: string;
  phone?: string;
  bio?: string;
  points: number;
  tier: string;
  is_pro: boolean;
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
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<PilotProfile>) => Promise<{ error: Error | null }>;
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
        
        const normalizedProfile = {
          ...data,
          points: userPoints,
          tier: userTier,
          role: assignedRole,
          avatar_url: data.avatar_url && !data.avatar_url.includes('56ceb5ecca61') 
            ? data.avatar_url 
            : getCleanAvatar(data.name || userEmail || 'Piloto'),
        } as PilotProfile;

        setProfile(normalizedProfile);
        localStorage.setItem('motolegado_pilot_name', data.name);
      } else {
        const defaultName = userEmail ? userEmail.split('@')[0] : 'Piloto MotoLegado';
        const assignedRole = checkIfAdmin(userEmail, defaultName);
        // Criar perfil padrão limpo com 0 pontos para novo usuário
        const newProfile: PilotProfile = {
          id: userId,
          name: defaultName,
          email: userEmail || '',
          motorcycle: '',
          points: 0,
          tier: 'Bronze',
          is_pro: assignedRole === 'admin',
          role: assignedRole,
          avatar_url: getCleanAvatar(defaultName),
        };

        const { error: insertError } = await supabase.from('profiles').upsert(newProfile);
        if (insertError) {
          console.warn('Aviso ao sincronizar perfil no banco:', insertError.message);
        }
        setProfile(newProfile);
        localStorage.setItem('motolegado_pilot_name', defaultName);
      }
    } catch (err) {
      console.error('Exceção ao buscar perfil:', err);
    }
  };

  useEffect(() => {
    // Limpeza de qualquer chave de modo demo legada no armazenamento local
    localStorage.removeItem('motolegado_demo_mode');

    if (!isSupabaseConfigured) {
      // Se Supabase não estiver configurado, checa se há sessão autenticada localmente salva
      const storedName = localStorage.getItem('motolegado_pilot_name');
      const storedEmail = localStorage.getItem('motolegado_pilot_email');
      
      if (storedEmail && storedName) {
        const assignedRole = checkIfAdmin(storedEmail, storedName);
        setProfile({
          id: 'local-pilot-' + storedEmail,
          name: storedName,
          email: storedEmail,
          motorcycle: localStorage.getItem('motolegado_pilot_bike') || '',
          points: 0,
          tier: 'Bronze',
          is_pro: assignedRole === 'admin',
          role: assignedRole,
          avatar_url: getCleanAvatar(storedName),
        });
      }
      setLoading(false);
      return;
    }

    // Inicializar sessão ativa no Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    // Escutar alterações de autenticação (login, logout, refresh de token, OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Entrar com E-mail e Senha
  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Fallback de autenticação local limpa
      const name = email.split('@')[0];
      const assignedRole = checkIfAdmin(email, name);
      const customProfile: PilotProfile = { 
        id: 'local-pilot-' + email,
        email, 
        name,
        motorcycle: '',
        points: 0,
        tier: 'Bronze',
        is_pro: assignedRole === 'admin',
        role: assignedRole,
        avatar_url: getCleanAvatar(name),
      };
      setProfile(customProfile);
      localStorage.setItem('motolegado_pilot_name', customProfile.name);
      localStorage.setItem('motolegado_pilot_email', email);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchProfile(data.user.id, data.user.email);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Cadastrar com E-mail e Senha
  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata: { name: string; motorcycle?: string }
  ) => {
    if (!isSupabaseConfigured) {
      const name = metadata.name || email.split('@')[0];
      const assignedRole = checkIfAdmin(email, name);
      const customProfile: PilotProfile = {
        id: 'local-pilot-' + email,
        name,
        email,
        motorcycle: metadata.motorcycle || '',
        points: 0,
        tier: 'Bronze',
        is_pro: assignedRole === 'admin',
        role: assignedRole,
        avatar_url: getCleanAvatar(name),
      };
      setProfile(customProfile);
      localStorage.setItem('motolegado_pilot_name', customProfile.name);
      localStorage.setItem('motolegado_pilot_email', email);
      if (metadata.motorcycle) {
        localStorage.setItem('motolegado_pilot_bike', metadata.motorcycle);
      }
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.name,
            name: metadata.name,
            motorcycle: metadata.motorcycle,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await fetchProfile(data.user.id, data.user.email);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Login Social com o Google via Supabase OAuth
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      return { 
        error: new Error('As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam ser configuradas no arquivo .env para ativar o login com Google.') 
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Encerrar Sessão
  const signOut = async () => {
    localStorage.removeItem('motolegado_pilot_email');
    localStorage.removeItem('motolegado_pilot_bike');
    localStorage.removeItem('motolegado_demo_mode');
    setUser(null);
    setProfile(null);
    setSession(null);

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Erro ao deslogar do Supabase:', err);
      }
    }
  };

  // Atualizar perfil
  const updateProfile = async (updates: Partial<PilotProfile>) => {
    if (!profile) return { error: new Error('Nenhum perfil ativo.') };

    const updated = { ...profile, ...updates };
    setProfile(updated);
    if (updates.name) {
      localStorage.setItem('motolegado_pilot_name', updates.name);
    }

    if (isSupabaseConfigured && user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (error) throw error;
      } catch (err: any) {
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
        signOut,
        updateProfile,
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
