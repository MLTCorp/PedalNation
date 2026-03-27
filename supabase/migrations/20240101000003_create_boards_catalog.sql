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
