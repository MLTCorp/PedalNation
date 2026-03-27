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
