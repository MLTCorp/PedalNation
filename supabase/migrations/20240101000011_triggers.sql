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
