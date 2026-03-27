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
