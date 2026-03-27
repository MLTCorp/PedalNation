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
