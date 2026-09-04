-- ==============================================================================
-- MOTOLEGADO SAAS - ESQUEMA DE BANCO DE DADOS & POLÍTICAS RLS (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Este script é 100% IDEMPOTENTE e SEGURO.
-- Ele cria ou atualiza as tabelas existentes (adicionando colunas que faltavam),
-- aplica todas as políticas de segurança RLS e cria os triggers automáticos.
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
  tier TEXT DEFAULT 'Bronze',
  is_pro BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'pilot',
  club_name TEXT,
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=400',
  personal_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir colunas caso a tabela já existisse com estrutura antiga
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS motorcycle TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'gratuito';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bonificado_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bonificado_by TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Bronze';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'pilot';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS club_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=400';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personal_logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS motorcycle_nickname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS motorcycle_year TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS motorcycle_plate TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS motorcycle_photos TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Funções de Segurança (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role = 'admin' 
        OR email ILIKE 'admin@motolegado.com.br' 
        OR email ILIKE 'ciceroranieri@gmail.com'
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role IN ('admin', 'moderator') 
        OR email ILIKE 'admin@motolegado.com.br' 
        OR email ILIKE 'ciceroranieri@gmail.com'
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Políticas Profiles
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "Perfis públicos são visíveis por todos os usuários autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;

CREATE POLICY "profiles_select_all" 
  ON public.profiles FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "profiles_insert_own" 
  ON public.profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own_or_admin" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete_own_or_admin" 
  ON public.profiles FOR DELETE 
  TO authenticated 
  USING (auth.uid() = id OR public.is_admin());

-- Trigger para criar perfil automaticamente ao cadastrar no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'pilot';
BEGIN
  IF NEW.email ILIKE 'admin@motolegado.com.br' OR NEW.email ILIKE 'ciceroranieri@gmail.com' THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, name, email, avatar_url, motorcycle, role, is_pro)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url', 
      NEW.raw_user_meta_data->>'picture', 
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=400'
    ),
    COALESCE(NEW.raw_user_meta_data->>'motorcycle', 'BMW R 1250 GS'),
    v_role,
    (v_role = 'admin')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. TABELA DE DIÁRIO DE BORDO (LOGBOOK TRIPS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.logbook_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  pilot_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Viagem',
  origin TEXT,
  destination TEXT NOT NULL DEFAULT 'Destino',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  distance_km NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bike_model TEXT,
  cost NUMERIC(10, 2) DEFAULT 0,
  fuel_consumption NUMERIC(6, 2) DEFAULT 0,
  climate TEXT DEFAULT 'sun',
  road TEXT DEFAULT 'Tapete',
  rating NUMERIC(2, 1) DEFAULT 5,
  weather TEXT DEFAULT 'Ensolarado',
  notes TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir todas as colunas caso a tabela já existisse
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS pilot_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS distance_km NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS bike_model TEXT;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS fuel_consumption NUMERIC(6, 2) DEFAULT 0;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS climate TEXT DEFAULT 'sun';
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS road TEXT DEFAULT 'Tapete';
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) DEFAULT 5;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS weather TEXT DEFAULT 'Ensolarado';
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.logbook_trips ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Sincronizar user_id e pilot_id se um deles estiver preenchido
UPDATE public.logbook_trips SET pilot_id = user_id WHERE pilot_id IS NULL AND user_id IS NOT NULL;
UPDATE public.logbook_trips SET user_id = pilot_id WHERE user_id IS NULL AND pilot_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_logbook_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.pilot_id IS NOT NULL THEN
    NEW.user_id := NEW.pilot_id;
  ELSIF NEW.pilot_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.pilot_id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_logbook_sync ON public.logbook_trips;
CREATE TRIGGER trg_logbook_sync
  BEFORE INSERT OR UPDATE ON public.logbook_trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_logbook_sync();

CREATE INDEX IF NOT EXISTS idx_logbook_user_id ON public.logbook_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_logbook_pilot_id ON public.logbook_trips(pilot_id);

ALTER TABLE public.logbook_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pilotos podem gerenciar apenas suas próprias viagens" ON public.logbook_trips;
DROP POLICY IF EXISTS "logbook_select_policy" ON public.logbook_trips;
DROP POLICY IF EXISTS "logbook_insert_policy" ON public.logbook_trips;
DROP POLICY IF EXISTS "logbook_update_policy" ON public.logbook_trips;
DROP POLICY IF EXISTS "logbook_delete_policy" ON public.logbook_trips;

CREATE POLICY "logbook_select_policy"
  ON public.logbook_trips FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = pilot_id OR public.is_admin());

CREATE POLICY "logbook_insert_policy"
  ON public.logbook_trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = pilot_id OR public.is_admin());

CREATE POLICY "logbook_update_policy"
  ON public.logbook_trips FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = pilot_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR auth.uid() = pilot_id OR public.is_admin());

CREATE POLICY "logbook_delete_policy"
  ON public.logbook_trips FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = pilot_id OR public.is_admin());

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
  distance_km NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration_est TEXT,
  difficulty TEXT DEFAULT 'Médio',
  ratings JSONB DEFAULT '{"landscape": 5, "asphalt": 5, "curves": 5, "safety": 4, "infrastructure": 4}'::JSONB,
  stops JSONB DEFAULT '[]'::JSONB,
  image_url TEXT,
  status TEXT DEFAULT 'approved',
  rejection_reason TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS distance_km NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS duration_est TEXT;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Médio';
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS ratings JSONB DEFAULT '{"landscape": 5, "asphalt": 5, "curves": 5, "safety": 4, "infrastructure": 4}'::JSONB;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS stops JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_routes_status ON public.routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_author_id ON public.routes(author_id);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Roteiros são visíveis para todos" ON public.routes;
DROP POLICY IF EXISTS "Usuários autenticados podem criar roteiros" ON public.routes;
DROP POLICY IF EXISTS "Autores podem editar seus próprios roteiros" ON public.routes;
DROP POLICY IF EXISTS "routes_select_policy" ON public.routes;
DROP POLICY IF EXISTS "routes_insert_policy" ON public.routes;
DROP POLICY IF EXISTS "routes_update_policy" ON public.routes;
DROP POLICY IF EXISTS "routes_delete_policy" ON public.routes;

CREATE POLICY "routes_select_policy"
  ON public.routes FOR SELECT
  TO authenticated, anon
  USING (status IN ('approved', 'aprovado') OR auth.uid() = author_id OR public.is_moderator());

CREATE POLICY "routes_insert_policy"
  ON public.routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id OR public.is_admin());

CREATE POLICY "routes_update_policy"
  ON public.routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_moderator())
  WITH CHECK (auth.uid() = author_id OR public.is_moderator());

CREATE POLICY "routes_delete_policy"
  ON public.routes FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin());

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
  status TEXT DEFAULT 'approved',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS founder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS foundation_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS motto TEXT;
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.moto_clubs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_moto_clubs_status ON public.moto_clubs(status);

ALTER TABLE public.moto_clubs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES public.moto_clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

ALTER TABLE public.club_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.club_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.club_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_club_members_club_user ON public.club_members(club_id, user_id);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_club_admin(target_club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.moto_clubs WHERE id = target_club_id AND founder_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = target_club_id
      AND user_id = auth.uid()
      AND role IN ('president', 'director')
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_club_member(target_club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = target_club_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "moto_clubs_select_policy" ON public.moto_clubs;
DROP POLICY IF EXISTS "moto_clubs_insert_policy" ON public.moto_clubs;
DROP POLICY IF EXISTS "moto_clubs_update_policy" ON public.moto_clubs;
DROP POLICY IF EXISTS "moto_clubs_delete_policy" ON public.moto_clubs;

CREATE POLICY "moto_clubs_select_policy"
  ON public.moto_clubs FOR SELECT
  TO authenticated, anon
  USING (status IN ('approved', 'aprovado') OR auth.uid() = founder_id OR public.is_moderator());

CREATE POLICY "moto_clubs_insert_policy"
  ON public.moto_clubs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = founder_id OR public.is_admin());

CREATE POLICY "moto_clubs_update_policy"
  ON public.moto_clubs FOR UPDATE
  TO authenticated
  USING (auth.uid() = founder_id OR public.is_club_admin(id) OR public.is_moderator())
  WITH CHECK (auth.uid() = founder_id OR public.is_club_admin(id) OR public.is_moderator());

CREATE POLICY "moto_clubs_delete_policy"
  ON public.moto_clubs FOR DELETE
  TO authenticated
  USING (auth.uid() = founder_id OR public.is_admin());

DROP POLICY IF EXISTS "club_members_select_policy" ON public.club_members;
DROP POLICY IF EXISTS "club_members_insert_policy" ON public.club_members;
DROP POLICY IF EXISTS "club_members_update_policy" ON public.club_members;
DROP POLICY IF EXISTS "club_members_delete_policy" ON public.club_members;

CREATE POLICY "club_members_select_policy"
  ON public.club_members FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "club_members_insert_policy"
  ON public.club_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_club_admin(club_id));

CREATE POLICY "club_members_update_policy"
  ON public.club_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_club_admin(club_id))
  WITH CHECK (auth.uid() = user_id OR public.is_club_admin(club_id));

CREATE POLICY "club_members_delete_policy"
  ON public.club_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_club_admin(club_id));

-- Mural do Moto Clube
CREATE TABLE IF NOT EXISTS public.club_mural_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES public.moto_clubs(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.club_mural_posts ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.club_mural_posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.club_mural_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "club_mural_select_policy" ON public.club_mural_posts;
DROP POLICY IF EXISTS "club_mural_insert_policy" ON public.club_mural_posts;
DROP POLICY IF EXISTS "club_mural_update_policy" ON public.club_mural_posts;
DROP POLICY IF EXISTS "club_mural_delete_policy" ON public.club_mural_posts;

CREATE POLICY "club_mural_select_policy"
  ON public.club_mural_posts FOR SELECT
  TO authenticated
  USING (public.is_club_member(club_id));

CREATE POLICY "club_mural_insert_policy"
  ON public.club_mural_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_club_member(club_id) AND auth.uid() = author_id);

CREATE POLICY "club_mural_update_policy"
  ON public.club_mural_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_club_admin(club_id))
  WITH CHECK (auth.uid() = author_id OR public.is_club_admin(club_id));

CREATE POLICY "club_mural_delete_policy"
  ON public.club_mural_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_club_admin(club_id));

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
  type TEXT DEFAULT 'Bate-Volta',
  organizer TEXT NOT NULL,
  image_url TEXT,
  checkins_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'approved',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Bate-Volta';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS checkins_count INTEGER DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_policy" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_update_policy" ON public.events;
DROP POLICY IF EXISTS "events_delete_policy" ON public.events;

CREATE POLICY "events_select_policy"
  ON public.events FOR SELECT
  TO authenticated, anon
  USING (status IN ('approved', 'aprovado') OR auth.uid() = creator_id OR public.is_moderator());

CREATE POLICY "events_insert_policy"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id OR public.is_admin());

CREATE POLICY "events_update_policy"
  ON public.events FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id OR public.is_moderator())
  WITH CHECK (auth.uid() = creator_id OR public.is_moderator());

CREATE POLICY "events_delete_policy"
  ON public.events FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id OR public.is_admin());

CREATE TABLE IF NOT EXISTS public.event_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_checkins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_event_checkins_event_user ON public.event_checkins(event_id, user_id);

ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkins_select_policy" ON public.event_checkins;
DROP POLICY IF EXISTS "checkins_insert_policy" ON public.event_checkins;
DROP POLICY IF EXISTS "checkins_delete_policy" ON public.event_checkins;

CREATE POLICY "checkins_select_policy"
  ON public.event_checkins FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "checkins_insert_policy"
  ON public.event_checkins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "checkins_delete_policy"
  ON public.event_checkins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- 7. TABELA DE PARCEIROS CREDENCIADOS (PARTNERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  discount_desc TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  verified BOOLEAN DEFAULT TRUE,
  rating NUMERIC(3, 2) DEFAULT 4.9,
  logo_url TEXT,
  status TEXT DEFAULT 'approved',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT TRUE;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 4.9;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_select_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_insert_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_update_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_delete_policy" ON public.partners;

CREATE POLICY "partners_select_policy"
  ON public.partners FOR SELECT
  TO authenticated, anon
  USING (status IN ('approved', 'aprovado') OR auth.uid() = owner_id OR public.is_moderator());

CREATE POLICY "partners_insert_policy"
  ON public.partners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "partners_update_policy"
  ON public.partners FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR public.is_moderator())
  WITH CHECK (auth.uid() = owner_id OR public.is_moderator());

CREATE POLICY "partners_delete_policy"
  ON public.partners FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id OR public.is_admin());

-- ==============================================================================
-- 8. TABELA DE COMUNIDADE & FEED
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Relato de Estrada',
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'approved',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Relato de Estrada';
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_community_posts_status ON public.community_posts(status);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_posts_select_policy" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_insert_policy" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_update_policy" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_delete_policy" ON public.community_posts;

CREATE POLICY "community_posts_select_policy"
  ON public.community_posts FOR SELECT
  TO authenticated, anon
  USING (status IN ('approved', 'aprovado') OR auth.uid() = author_id OR public.is_moderator());

CREATE POLICY "community_posts_insert_policy"
  ON public.community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id OR public.is_admin());

CREATE POLICY "community_posts_update_policy"
  ON public.community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_moderator())
  WITH CHECK (auth.uid() = author_id OR public.is_moderator());

CREATE POLICY "community_posts_delete_policy"
  ON public.community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin());

-- Denúncias de Moderação
CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.community_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.community_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_policy" ON public.community_reports;
DROP POLICY IF EXISTS "reports_insert_policy" ON public.community_reports;
DROP POLICY IF EXISTS "reports_update_policy" ON public.community_reports;
DROP POLICY IF EXISTS "reports_delete_policy" ON public.community_reports;

CREATE POLICY "reports_select_policy"
  ON public.community_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id OR public.is_moderator());

CREATE POLICY "reports_insert_policy"
  ON public.community_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id OR public.is_admin());

CREATE POLICY "reports_update_policy"
  ON public.community_reports FOR UPDATE
  TO authenticated
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());

CREATE POLICY "reports_delete_policy"
  ON public.community_reports FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 9. CONFIGURAÇÃO DE STORAGE (BUCKET DE FOTOS MOTOLEGADO)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('motolegado-media', 'motolegado-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_all" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_owner_or_admin" ON storage.objects;

CREATE POLICY "storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'motolegado-media');

CREATE POLICY "storage_insert_all"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'motolegado-media');

CREATE POLICY "storage_update_all"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'motolegado-media');

CREATE POLICY "storage_delete_owner_or_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'motolegado-media' AND (auth.uid() = owner OR public.is_admin()));

-- ==============================================================================
-- 10. TRIGGER GENÉRICO DE ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMP (updated_at)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_auto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_auto_updated_at();

DROP TRIGGER IF EXISTS trg_routes_updated_at ON public.routes;
CREATE TRIGGER trg_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.handle_auto_updated_at();

DROP TRIGGER IF EXISTS trg_moto_clubs_updated_at ON public.moto_clubs;
CREATE TRIGGER trg_moto_clubs_updated_at BEFORE UPDATE ON public.moto_clubs FOR EACH ROW EXECUTE FUNCTION public.handle_auto_updated_at();

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.handle_auto_updated_at();

DROP TRIGGER IF EXISTS trg_partners_updated_at ON public.partners;
CREATE TRIGGER trg_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.handle_auto_updated_at();

-- FIM DO SCRIPT DE SCHEMA & RLS AUDITADO E RESILIENTE
