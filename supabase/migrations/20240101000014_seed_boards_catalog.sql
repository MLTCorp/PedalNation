-- Seed data: 3 commercial pedalboards for development

INSERT INTO public.boards_catalog (
  name, slug, brand, width_mm, height_mm, image_url, affiliate_url, is_active
) VALUES
(
  'Pedaltrain Metro 20',
  'pedaltrain-metro-20',
  'Pedaltrain',
  508.0, 203.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/boards/pedaltrain-metro-20.jpg',
  'https://www.amazon.com.br/s?k=pedaltrain+metro+20',
  TRUE
),
(
  'Boss BCB-60',
  'boss-bcb-60',
  'Boss',
  524.0, 380.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/boards/boss-bcb-60.jpg',
  'https://www.amazon.com.br/s?k=boss+bcb+60',
  TRUE
),
(
  'Rockboard Quad 4.1',
  'rockboard-quad-4-1',
  'Rockboard',
  557.0, 242.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/rockboard-quad-41.jpg',
  'https://www.amazon.com.br/s?k=rockboard+quad+4.1',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;
