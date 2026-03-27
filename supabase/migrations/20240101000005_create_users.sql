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
