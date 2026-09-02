-- ==============================================================================
-- MOTOLEGADO SAAS - SUPABASE POSTGRESQL DATABASE SCHEMA
-- ==============================================================================
-- Este script cria toda a estrutura de tabelas, índices, triggers e políticas RLS
-- (Row Level Security) para o MotoLegado.
-- Pode ser executado diretamente no SQL Editor do seu projeto Supabase.
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABELA DE PERFIS DE PILOTOS (PROFILES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  motorcycle TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  bio TEXT,
  points INTEGER DEFAULT 100,
  tier TEXT DEFAULT 'Bronze', -- 'Bronze', 'Prata', 'Ouro', 'Lenda da Estrada', 'Globetrotter'
  is_pro BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'pilot', -- 'pilot', 'moderator', 'admin'
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=400',
  personal_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Profiles
CREATE POLICY "Perfis públicos são visíveis por todos os usuários autenticados" 
  ON public.profiles FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil" 
  ON public.profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao cadastrar novo usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, motorcycle)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=400'),
    COALESCE(NEW.raw_user_meta_data->>'motorcycle', 'BMW R 1250 GS')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. TABELA DE DIÁRIO DE BORDO (LOGBOOK TRIPS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.logbook_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  km NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost NUMERIC(10, 2) DEFAULT 0,
  fuel_consumption NUMERIC(6, 2) DEFAULT 0, -- km/l
  weather TEXT DEFAULT 'Ensolarado',
  notes TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.logbook_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pilotos podem gerenciar apenas suas próprias viagens"
  ON public.logbook_trips FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 4. TABELA DE ROTEIROS (ROUTES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km NUMERIC(10, 2) NOT NULL,
  duration_est TEXT,
  difficulty TEXT DEFAULT 'Médio', -- 'Fácil', 'Médio', 'Difícil', 'Especialista'
  ratings JSONB DEFAULT '{"landscape": 5, "asphalt": 5, "curves": 5, "safety": 4, "infrastructure": 4}'::JSONB,
  stops JSONB DEFAULT '[]'::JSONB,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roteiros são visíveis para todos"
  ON public.routes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Usuários autenticados podem criar roteiros"
  ON public.routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Autores podem editar seus próprios roteiros"
  ON public.routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- ==============================================================================
-- 5. TABELA DE MOTO CLUBES & MEMBROS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.moto_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  foundation_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  description TEXT,
  rules TEXT,
  motto TEXT,
  status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moto_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moto Clubes aprovados são visíveis para todos"
  ON public.moto_clubs FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Usuários autenticados podem fundar Moto Clubes"
  ON public.moto_clubs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Presidentes/Fundadores podem atualizar seus Moto Clubes"
  ON public.moto_clubs FOR UPDATE
  TO authenticated
  USING (auth.uid() = founder_id);

-- Membros dos Moto Clubes
CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES public.moto_clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member', -- 'president', 'director', 'road_captain', 'member', 'applicant'
  status TEXT DEFAULT 'active', -- 'active', 'pending_approval', 'inactive'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros são visíveis para todos"
  ON public.club_members FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Usuários podem solicitar entrada no clube"
  ON public.club_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Diretoria e próprio usuário podem gerenciar associação"
  ON public.club_members FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.club_members cm 
      WHERE cm.club_id = public.club_members.club_id 
        AND cm.user_id = auth.uid() 
        AND cm.role IN ('president', 'director')
    )
  );

-- Mural Interno do Moto Clube
CREATE TABLE IF NOT EXISTS public.club_mural_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES public.moto_clubs(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'urgent'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.club_mural_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas membros ativos podem ver e postar no mural"
  ON public.club_mural_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = public.club_mural_posts.club_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

-- ==============================================================================
-- 6. TABELA DE EVENTOS & CHECK-INS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  city TEXT,
  state TEXT,
  type TEXT DEFAULT 'Bate-Volta', -- 'Bate-Volta', 'Encontro Nacional', 'MotoFest', 'Track Day'
  organizer TEXT NOT NULL,
  image_url TEXT,
  checkins_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eventos aprovados são visíveis por todos"
  ON public.events FOR SELECT
  TO authenticated, anon
  USING (status = 'approved' OR auth.uid() = creator_id);

CREATE POLICY "Usuários autenticados podem criar eventos"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Check-ins de Eventos
CREATE TABLE IF NOT EXISTS public.event_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Check-ins são visíveis para todos"
  ON public.event_checkins FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Usuários podem fazer e desfazer seu check-in"
  ON public.event_checkins FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 7. TABELA DE PARCEIROS CREDENCIADOS (PARTNERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Oficina Especializada', 'Boutique & Acessórios', 'Ponto de Encontro / Pub', 'Hospedagem Mototurismo'
  discount_desc TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  verified BOOLEAN DEFAULT TRUE,
  rating NUMERIC(3, 2) DEFAULT 4.9,
  logo_url TEXT,
  status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parceiros aprovados são visíveis para todos"
  ON public.partners FOR SELECT
  TO authenticated, anon
  USING (status = 'approved' OR auth.uid() = owner_id);

CREATE POLICY "Empresas podem solicitar credenciamento"
  ON public.partners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- ==============================================================================
-- 8. TABELA DE COMUNIDADE & FEED
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Relato de Estrada', -- 'Relato de Estrada', 'Alerta / Condições', 'Dúvida Técnica', 'Classificados'
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publicações da comunidade são visíveis para todos"
  ON public.community_posts FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Usuários autenticados podem criar posts"
  ON public.community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Autores podem deletar seus próprios posts"
  ON public.community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Denúncias de Moderação
CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem reportar conteúdos"
  ON public.community_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- ==============================================================================
-- 9. CONFIGURAÇÃO DE STORAGE (BUCKETS DE FOTOS)
-- ==============================================================================
-- Executar para criar os buckets de armazenamento de fotos:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('motolegado-media', 'motolegado-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Mídias públicas são acessíveis por todos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'motolegado-media');

CREATE POLICY "Usuários autenticados podem fazer upload de fotos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'motolegado-media');

-- FIM DO SCRIPT DE SCHEMA
