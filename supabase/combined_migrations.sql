-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- Table: pedals
-- Stores all guitar pedals with their specs, SEO metadata, and status
CREATE TABLE IF NOT EXISTS public.pedals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  brand            TEXT NOT NULL,
  category         TEXT NOT NULL,
  subcategory      TEXT,
  -- Physical dimensions in millimeters
  width_mm         NUMERIC(6,1),
  height_mm        NUMERIC(6,1),
  depth_mm         NUMERIC(6,1),
  -- Images
  image_url        TEXT,
  thumbnail_url    TEXT,
  -- Flexible specs: voltage, current_ma, bypass_type, mono_stereo, description, history, etc.
  specs            JSONB DEFAULT '{}'::JSONB,
  -- SEO fields
  meta_title       TEXT,
  meta_description TEXT,
  keywords         TEXT[],
  -- Status
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  -- Timestamps
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pedals IS 'Guitar pedals catalog with full specs and SEO metadata';
COMMENT ON COLUMN public.pedals.specs IS 'Flexible JSONB: voltage, current_ma, bypass_type, mono_stereo, description, history';
-- Table: boards_catalog
-- Commercial pedalboard catalog (Pedaltrain, Boss, Rockboard, etc.)
CREATE TABLE IF NOT EXISTS public.boards_catalog (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  brand         TEXT NOT NULL,
  width_mm      NUMERIC(6,1) NOT NULL,
  height_mm     NUMERIC(6,1) NOT NULL,
  image_url     TEXT,
  affiliate_url TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.boards_catalog IS 'Commercial pedalboard catalog with dimensions for canvas sizing';
-- Table: affiliate_links
-- Affiliate store links for each pedal with UTM tracking support
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedal_id       UUID NOT NULL REFERENCES public.pedals(id) ON DELETE CASCADE,
  store_name     TEXT NOT NULL,
  url            TEXT NOT NULL,
  affiliate_code TEXT,
  region         TEXT NOT NULL DEFAULT 'BR',
  is_primary     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.affiliate_links IS 'Affiliate store links per pedal. is_primary marks the featured link shown first';
-- Table: users
-- Public user profiles linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT NOT NULL UNIQUE,
  username       TEXT UNIQUE,
  display_name   TEXT,
  avatar_url     TEXT,
  auth_provider  TEXT DEFAULT 'email',
  role           TEXT NOT NULL DEFAULT 'user',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Public user profiles. id references auth.users. role: user|admin';
COMMENT ON COLUMN public.users.auth_provider IS 'Authentication provider: email, google';
-- Table: user_boards
-- User-created pedalboard layouts with canvas data
CREATE TABLE IF NOT EXISTS public.user_boards (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description       TEXT,
  board_type        TEXT NOT NULL DEFAULT 'custom',
  -- Optional reference to a commercial board template
  board_catalog_id  UUID REFERENCES public.boards_catalog(id) ON DELETE SET NULL,
  -- Custom board dimensions (used when board_type = 'custom')
  custom_width_mm   NUMERIC(6,1),
  custom_height_mm  NUMERIC(6,1),
  -- SvelteFlow canvas state: nodes (pedals), edges, viewport
  canvas_data       JSONB DEFAULT '{}'::JSONB,
  is_public         BOOLEAN NOT NULL DEFAULT FALSE,
  genre_tags        TEXT[] DEFAULT '{}',
  views_count       INTEGER NOT NULL DEFAULT 0,
  likes_count       INTEGER NOT NULL DEFAULT 0,
  thumbnail_url     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Each user can only have one board with a given slug
  UNIQUE(user_id, slug)
);

COMMENT ON TABLE public.user_boards IS 'User pedalboard layouts. canvas_data stores SvelteFlow state (nodes, edges, viewport)';
COMMENT ON COLUMN public.user_boards.canvas_data IS 'SvelteFlow state: {nodes: [{id, type, position, data: {pedal_id, rotation, layer}}, ...], edges: [...], viewport: {x, y, zoom}}';
COMMENT ON COLUMN public.user_boards.board_type IS 'Type: custom (free dimensions) or catalog (uses boards_catalog dimensions)';
-- Table: link_clicks
-- Analytics tracking for affiliate link clicks
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  pedal_id          UUID NOT NULL REFERENCES public.pedals(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  source            TEXT NOT NULL DEFAULT 'unknown',
  utm_params        JSONB DEFAULT '{}'::JSONB,
  ip_hash           TEXT,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.link_clicks IS 'Affiliate link click tracking for analytics and revenue reporting';
COMMENT ON COLUMN public.link_clicks.source IS 'Where the click originated: pedal-page, builder, catalog, etc.';
COMMENT ON COLUMN public.link_clicks.utm_params IS 'UTM tracking params: {utm_source, utm_medium, utm_campaign, utm_content}';
COMMENT ON COLUMN public.link_clicks.ip_hash IS 'SHA256 hash of IP for analytics without storing personal data';
-- Table: user_pedal_lists
-- User wish lists, owned lists, and favorites
CREATE TABLE IF NOT EXISTS public.user_pedal_lists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pedal_id    UUID NOT NULL REFERENCES public.pedals(id) ON DELETE CASCADE,
  list_type   TEXT NOT NULL DEFAULT 'wishlist',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_pedal_list UNIQUE(user_id, pedal_id, list_type)
);

COMMENT ON TABLE public.user_pedal_lists IS 'User curated lists of pedals. list_type: wishlist, owned, favorites';
COMMENT ON CONSTRAINT unique_user_pedal_list ON public.user_pedal_lists IS 'Prevents duplicate entries per user+pedal+list_type combination';
-- Indexes for performance optimization

-- GIN full-text search index on pedals (name + brand in Portuguese)
CREATE INDEX IF NOT EXISTS idx_pedals_fts ON public.pedals
  USING GIN(to_tsvector('portuguese', COALESCE(name, '') || ' ' || COALESCE(brand, '')));

-- GIN trigram index for fuzzy search with pg_trgm
CREATE INDEX IF NOT EXISTS idx_pedals_name_trgm ON public.pedals USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pedals_brand_trgm ON public.pedals USING GIN(brand gin_trgm_ops);

-- Slug indexes (unique lookups)
CREATE INDEX IF NOT EXISTS idx_pedals_slug ON public.pedals(slug);
CREATE INDEX IF NOT EXISTS idx_boards_catalog_slug ON public.boards_catalog(slug);
CREATE INDEX IF NOT EXISTS idx_user_boards_slug ON public.user_boards(slug);

-- Brand and category indexes for catalog filtering
CREATE INDEX IF NOT EXISTS idx_pedals_brand ON public.pedals(brand);
CREATE INDEX IF NOT EXISTS idx_pedals_category ON public.pedals(category);
CREATE INDEX IF NOT EXISTS idx_pedals_is_active ON public.pedals(is_active) WHERE is_active = TRUE;

-- Link clicks indexes (analytics queries by date and pedal)
CREATE INDEX IF NOT EXISTS idx_link_clicks_created_at ON public.link_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_pedal_id ON public.link_clicks(pedal_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_affiliate_link_id ON public.link_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_pedal_date ON public.link_clicks(pedal_id, created_at DESC);

-- User boards indexes (by user and is_public for community boards)
CREATE INDEX IF NOT EXISTS idx_user_boards_user_id ON public.user_boards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_boards_is_public ON public.user_boards(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_boards_user_public ON public.user_boards(user_id, is_public);

-- Affiliate links indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_links_pedal_id ON public.affiliate_links(pedal_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_is_active ON public.affiliate_links(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_affiliate_links_primary ON public.affiliate_links(pedal_id, is_primary) WHERE is_primary = TRUE;
-- Row Level Security (RLS) policies for all tables

-- Enable RLS
ALTER TABLE public.pedals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pedal_lists ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- PEDALS: Public read (active only), Admin full access
-- ===================================================================
CREATE POLICY "pedals_public_read" ON public.pedals
  FOR SELECT USING (is_active = true);

CREATE POLICY "pedals_admin_all" ON public.pedals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===================================================================
-- BOARDS_CATALOG: Public read (active only), Admin full access
-- ===================================================================
CREATE POLICY "boards_catalog_public_read" ON public.boards_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY "boards_catalog_admin_all" ON public.boards_catalog
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===================================================================
-- AFFILIATE_LINKS: Public read (active only), Admin full access
-- ===================================================================
CREATE POLICY "affiliate_links_public_read" ON public.affiliate_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "affiliate_links_admin_all" ON public.affiliate_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===================================================================
-- USERS: Own profile only, Admin full access
-- ===================================================================
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = 'user'); -- prevent self-promotion

CREATE POLICY "users_admin_all" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===================================================================
-- USER_BOARDS: Private by default, public read when is_public=true
-- ===================================================================
-- Anyone can read public boards
CREATE POLICY "user_boards_public_read" ON public.user_boards
  FOR SELECT USING (is_public = true);

-- Owners have full access to their own boards
CREATE POLICY "user_boards_owner_all" ON public.user_boards
  FOR ALL USING (user_id = auth.uid());

-- ===================================================================
-- LINK_CLICKS: Anonymous INSERT allowed, Admin SELECT only
-- ===================================================================
-- Allow any visitor to register a click (no auth required)
CREATE POLICY "link_clicks_insert_anon" ON public.link_clicks
  FOR INSERT WITH CHECK (true);

-- Only admins can query click analytics
CREATE POLICY "link_clicks_admin_select" ON public.link_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===================================================================
-- USER_PEDAL_LISTS: Owner access only
-- ===================================================================
CREATE POLICY "user_pedal_lists_owner_all" ON public.user_pedal_lists
  FOR ALL USING (user_id = auth.uid());
-- Triggers for automatic timestamp management

-- Function: auto-update updated_at on any UPDATE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to pedals
CREATE TRIGGER pedals_updated_at
  BEFORE UPDATE ON public.pedals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Apply updated_at trigger to user_boards
CREATE TRIGGER user_boards_updated_at
  BEFORE UPDATE ON public.user_boards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- Auth trigger: auto-create user profile when a new auth.users record is created
-- This handles both email/password and OAuth (Google) sign-ups

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, auth_provider, display_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires AFTER INSERT on auth.users (handles all sign-up methods)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Auto-creates public.users record for new auth.users. Used for US-007 auth flow.';
-- Seed data: 5 popular guitar pedals for development

INSERT INTO public.pedals (
  name, slug, brand, category, subcategory,
  width_mm, height_mm, depth_mm,
  image_url, thumbnail_url, specs,
  meta_title, meta_description, keywords,
  is_active, is_verified
) VALUES
(
  'Boss DS-1 Distortion',
  'boss-ds-1-distortion',
  'Boss',
  'distortion',
  'hard-distortion',
  70.0, 59.0, 55.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/boss-ds-1.jpg',
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/boss-ds-1-thumb.jpg',
  '{"voltage": "9V DC", "current_ma": 5, "bypass_type": "buffered", "mono_stereo": "mono", "description": "O Boss DS-1 e um dos pedais de distorcao mais vendidos de todos os tempos, com tom classico e iconico. Circuito simples e robusto que entrega crunch agressivo e sustain longo.", "history": "Lancado em 1978, o DS-1 foi usado por Kurt Cobain, Joe Satriani e Steve Vai. E conhecido pelo seu tom agressivo e sustain longo, sendo o pedal de distorcao mais vendido da historia."}'::JSONB,
  'Boss DS-1 Distortion | Specs e Onde Comprar | Pedal Nation',
  'O Boss DS-1 e o pedal de distorcao mais iconico do mundo. Confira specs completas, historia e onde comprar com o melhor preco.',
  ARRAY['boss ds-1', 'pedal distortion', 'distortion pedal', 'boss pedals', 'guitarra', 'kurt cobain pedal'],
  TRUE, TRUE
),
(
  'Ibanez Tube Screamer TS9',
  'ibanez-tube-screamer-ts9',
  'Ibanez',
  'overdrive',
  'tube-overdrive',
  72.0, 126.0, 53.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/ibanez-ts9.jpg',
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/ibanez-ts9-thumb.jpg',
  '{"voltage": "9V DC", "current_ma": 10, "bypass_type": "true bypass", "mono_stereo": "mono", "description": "O Ibanez TS9 Tube Screamer e o overdrive favorito de Stevie Ray Vaughan e John Mayer. Tom quente e organico que empurra qualquer amplificador.", "history": "O Tube Screamer original (TS-808) foi lancado em 1979. O TS9 e a redicao oficial que mantem o circuito original amado por guitarristas de blues e rock."}'::JSONB,
  'Ibanez Tube Screamer TS9 | Specs e Onde Comprar | Pedal Nation',
  'O Ibanez TS9 Tube Screamer e o overdrive mais famoso do mundo. Usado por Stevie Ray Vaughan e John Mayer. Specs, historia e preco.',
  ARRAY['tube screamer', 'ts9', 'ibanez', 'overdrive pedal', 'blues pedal', 'stevie ray vaughan pedal'],
  TRUE, TRUE
),
(
  'Electro-Harmonix Big Muff Pi',
  'electro-harmonix-big-muff-pi',
  'Electro-Harmonix',
  'fuzz',
  'sustain-fuzz',
  115.0, 70.0, 50.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/ehx-big-muff.jpg',
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/ehx-big-muff-thumb.jpg',
  '{"voltage": "9V DC", "current_ma": 15, "bypass_type": "true bypass", "mono_stereo": "mono", "description": "O Big Muff Pi e o fuzz mais lendario ja criado, com sustain infinito e som encorpado. Perfeito para solos agressivos e riffs pesados.", "history": "Criado em 1969 por Mike Matthews, o Big Muff foi usado por Jimi Hendrix, Carlos Santana e Billy Corgan do Smashing Pumpkins."}'::JSONB,
  'Electro-Harmonix Big Muff Pi | Specs e Onde Comprar | Pedal Nation',
  'O Big Muff Pi e o pedal fuzz mais iconico da historia. Usado por Jimi Hendrix e Billy Corgan. Specs completas e onde comprar.',
  ARRAY['big muff', 'fuzz pedal', 'electro-harmonix', 'ehx', 'pedal fuzz guitarra', 'billy corgan pedal'],
  TRUE, TRUE
),
(
  'MXR Phase 90',
  'mxr-phase-90',
  'MXR',
  'modulation',
  'phaser',
  72.0, 121.0, 38.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/mxr-phase-90.jpg',
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/mxr-phase-90-thumb.jpg',
  '{"voltage": "9V DC", "current_ma": 6, "bypass_type": "buffered", "mono_stereo": "mono", "description": "O MXR Phase 90 e o phaser mais famoso de todos os tempos, com som suave e musical. Um unico knob controla a velocidade do efeito, simples e eficaz.", "history": "Lancado em 1972, o Phase 90 foi usado por Eddie Van Halen no icônico solo de Eruption. E o phaser de referencia para guitarristas de rock e funk."}'::JSONB,
  'MXR Phase 90 | Specs e Onde Comprar | Pedal Nation',
  'O MXR Phase 90 e o phaser favorito de Eddie Van Halen. Specs tecnicas, historia e melhores precos no Brasil.',
  ARRAY['mxr phase 90', 'phaser pedal', 'mxr', 'pedal modulacao', 'eddie van halen', 'pedal phaser'],
  TRUE, TRUE
),
(
  'TC Electronic Hall of Fame 2 Reverb',
  'tc-electronic-hall-of-fame-2-reverb',
  'TC Electronic',
  'reverb',
  'hall-reverb',
  72.0, 121.0, 55.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/tc-hof2.jpg',
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/tc-hof2-thumb.jpg',
  '{"voltage": "9V DC", "current_ma": 100, "bypass_type": "true bypass", "mono_stereo": "stereo", "description": "O Hall of Fame 2 e o reverb digital mais versatil do mercado, com MASH footswitch sensivel a pressao e compatibilidade com TonePrint.", "history": "A linha Hall of Fame da TC Electronic e referencia em reverb digital desde 2011. A versao 2 trouxe o inovador MASH footswitch e compatibilidade com TonePrint para tons customizados."}'::JSONB,
  'TC Electronic Hall of Fame 2 | Specs e Onde Comprar | Pedal Nation',
  'O TC Electronic Hall of Fame 2 e o melhor reverb digital custo-beneficio do mercado. Specs, comparativo e onde comprar.',
  ARRAY['hall of fame', 'tc electronic', 'reverb pedal', 'reverb digital', 'pedal reverb', 'toneprint'],
  TRUE, TRUE
)
ON CONFLICT (slug) DO NOTHING;
-- Seed data: 3 commercial pedalboards for development

INSERT INTO public.boards_catalog (
  name, slug, brand, width_mm, height_mm, image_url, affiliate_url, is_active
) VALUES
(
  'Pedaltrain Metro 20',
  'pedaltrain-metro-20',
  'Pedaltrain',
  508.0, 203.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/boards/pedaltrain-metro-20.jpg',
  'https://www.amazon.com.br/s?k=pedaltrain+metro+20',
  TRUE
),
(
  'Boss BCB-60',
  'boss-bcb-60',
  'Boss',
  524.0, 380.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/boards/boss-bcb-60.jpg',
  'https://www.amazon.com.br/s?k=boss+bcb+60',
  TRUE
),
(
  'Rockboard Quad 4.1',
  'rockboard-quad-4-1',
  'Rockboard',
  557.0, 242.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/rockboard-quad-41.jpg',
  'https://www.amazon.com.br/s?k=rockboard+quad+4.1',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;
