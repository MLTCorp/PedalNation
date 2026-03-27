-- Seed data: 5 popular guitar pedals for development

INSERT INTO public.pedals (
  name, slug, brand, category, subcategory,
  width_mm, height_mm, depth_mm,
  image_url, thumbnail_url, specs,
  meta_title, meta_description, keywords,
  is_active, is_verified
) VALUES
(
  'Boss DS-1 Distortion',
  'boss-ds-1-distortion',
  'Boss',
  'distortion',
  'hard-distortion',
  70.0, 59.0, 55.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/boss-ds-1.jpg',
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/boss-ds-1-thumb.jpg',
  '{"voltage": "9V DC", "current_ma": 5, "bypass_type": "buffered", "mono_stereo": "mono", "description": "O Boss DS-1 e um dos pedais de distorcao mais vendidos de todos os tempos, com tom classico e iconico. Circuito simples e robusto que entrega crunch agressivo e sustain longo.", "history": "Lancado em 1978, o DS-1 foi usado por Kurt Cobain, Joe Satriani e Steve Vai. E conhecido pelo seu tom agressivo e sustain longo, sendo o pedal de distorcao mais vendido da historia."}'::JSONB,
  'Boss DS-1 Distortion | Specs e Onde Comprar | Pedal Nation',
  'O Boss DS-1 e o pedal de distorcao mais iconico do mundo. Confira specs completas, historia e onde comprar com o melhor preco.',
  ARRAY['boss ds-1', 'pedal distortion', 'distortion pedal', 'boss pedals', 'guitarra', 'kurt cobain pedal'],
  TRUE, TRUE
),
(
  'Ibanez Tube Screamer TS9',
  'ibanez-tube-screamer-ts9',
  'Ibanez',
  'overdrive',
  'tube-overdrive',
  72.0, 126.0, 53.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/ibanez-ts9.jpg',
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/ibanez-ts9-thumb.jpg',
  '{"voltage": "9V DC", "current_ma": 10, "bypass_type": "true bypass", "mono_stereo": "mono", "description": "O Ibanez TS9 Tube Screamer e o overdrive favorito de Stevie Ray Vaughan e John Mayer. Tom quente e organico que empurra qualquer amplificador.", "history": "O Tube Screamer original (TS-808) foi lancado em 1979. O TS9 e a redicao oficial que mantem o circuito original amado por guitarristas de blues e rock."}'::JSONB,
  'Ibanez Tube Screamer TS9 | Specs e Onde Comprar | Pedal Nation',
  'O Ibanez TS9 Tube Screamer e o overdrive mais famoso do mundo. Usado por Stevie Ray Vaughan e John Mayer. Specs, historia e preco.',
  ARRAY['tube screamer', 'ts9', 'ibanez', 'overdrive pedal', 'blues pedal', 'stevie ray vaughan pedal'],
  TRUE, TRUE
),
(
  'Electro-Harmonix Big Muff Pi',
  'electro-harmonix-big-muff-pi',
  'Electro-Harmonix',
  'fuzz',
  'sustain-fuzz',
  115.0, 70.0, 50.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/ehx-big-muff.jpg',
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/ehx-big-muff-thumb.jpg',
  '{"voltage": "9V DC", "current_ma": 15, "bypass_type": "true bypass", "mono_stereo": "mono", "description": "O Big Muff Pi e o fuzz mais lendario ja criado, com sustain infinito e som encorpado. Perfeito para solos agressivos e riffs pesados.", "history": "Criado em 1969 por Mike Matthews, o Big Muff foi usado por Jimi Hendrix, Carlos Santana e Billy Corgan do Smashing Pumpkins."}'::JSONB,
  'Electro-Harmonix Big Muff Pi | Specs e Onde Comprar | Pedal Nation',
  'O Big Muff Pi e o pedal fuzz mais iconico da historia. Usado por Jimi Hendrix e Billy Corgan. Specs completas e onde comprar.',
  ARRAY['big muff', 'fuzz pedal', 'electro-harmonix', 'ehx', 'pedal fuzz guitarra', 'billy corgan pedal'],
  TRUE, TRUE
),
(
  'MXR Phase 90',
  'mxr-phase-90',
  'MXR',
  'modulation',
  'phaser',
  72.0, 121.0, 38.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/mxr-phase-90.jpg',
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/mxr-phase-90-thumb.jpg',
  '{"voltage": "9V DC", "current_ma": 6, "bypass_type": "buffered", "mono_stereo": "mono", "description": "O MXR Phase 90 e o phaser mais famoso de todos os tempos, com som suave e musical. Um unico knob controla a velocidade do efeito, simples e eficaz.", "history": "Lancado em 1972, o Phase 90 foi usado por Eddie Van Halen no icônico solo de Eruption. E o phaser de referencia para guitarristas de rock e funk."}'::JSONB,
  'MXR Phase 90 | Specs e Onde Comprar | Pedal Nation',
  'O MXR Phase 90 e o phaser favorito de Eddie Van Halen. Specs tecnicas, historia e melhores precos no Brasil.',
  ARRAY['mxr phase 90', 'phaser pedal', 'mxr', 'pedal modulacao', 'eddie van halen', 'pedal phaser'],
  TRUE, TRUE
),
(
  'TC Electronic Hall of Fame 2 Reverb',
  'tc-electronic-hall-of-fame-2-reverb',
  'TC Electronic',
  'reverb',
  'hall-reverb',
  72.0, 121.0, 55.0,
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/tc-hof2.jpg',
  'https://ehlsnvfzhrtyscsgimdm.supabase.co/storage/v1/object/public/pedals/tc-hof2-thumb.jpg',
  '{"voltage": "9V DC", "current_ma": 100, "bypass_type": "true bypass", "mono_stereo": "stereo", "description": "O Hall of Fame 2 e o reverb digital mais versatil do mercado, com MASH footswitch sensivel a pressao e compatibilidade com TonePrint.", "history": "A linha Hall of Fame da TC Electronic e referencia em reverb digital desde 2011. A versao 2 trouxe o inovador MASH footswitch e compatibilidade com TonePrint para tons customizados."}'::JSONB,
  'TC Electronic Hall of Fame 2 | Specs e Onde Comprar | Pedal Nation',
  'O TC Electronic Hall of Fame 2 e o melhor reverb digital custo-beneficio do mercado. Specs, comparativo e onde comprar.',
  ARRAY['hall of fame', 'tc electronic', 'reverb pedal', 'reverb digital', 'pedal reverb', 'toneprint'],
  TRUE, TRUE
)
ON CONFLICT (slug) DO NOTHING;
