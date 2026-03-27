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
