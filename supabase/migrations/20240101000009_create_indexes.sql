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
