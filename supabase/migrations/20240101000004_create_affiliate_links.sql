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
