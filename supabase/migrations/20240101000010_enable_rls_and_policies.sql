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
