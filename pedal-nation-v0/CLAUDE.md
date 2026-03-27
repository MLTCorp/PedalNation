# Pedal Nation — PoC Build Instructions

You are building a Pedalboard Builder web app. Read PRD.md for full context.

## Stack (already installed)
- SvelteKit 2 (TypeScript)
- @xyflow/svelte (SvelteFlow) — for the pedalboard canvas editor
- @supabase/supabase-js + @supabase/ssr — database, auth, storage
- Tailwind CSS 4 + @tailwindcss/vite
- bits-ui + lucide-svelte — UI components
- fuse.js — fuzzy search
- html-to-image — canvas export
- @sveltejs/adapter-vercel — deployment

## Supabase
- Project ID: ehlsnvfzhrtyscsgimdm  
- URL: https://ehlsnvfzhrtyscsgimdm.supabase.co
- Use env vars: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY
- Create a .env.example with these vars (don't put actual keys)

## What to Build (Sprint 1-2 focus for PoC)

### 1. Core Layout
- Dark mode by default (#0F0F0F bg, #FF6B35 accent)
- 3-panel layout: left sidebar (catalog) + center canvas + right sidebar (info panel)
- Top header: logo "Pedal Nation" + nav (Builder | Catalog | Boards)
- Responsive: builder is desktop-only, catalog/boards work on mobile

### 2. Pedalboard Editor (/builder)
- SvelteFlow canvas with custom nodes for pedals
- Each pedal node: shows pedal image, name, dimensions
- Drag pedals from left catalog sidebar onto canvas
- Snap to grid (toggleable)
- Layer system: Top Layer / Bottom Layer with visibility toggle
- Toolbar: Layers, Grid toggle, Zoom controls, Export, Save
- Board background: rectangle representing the physical pedalboard with real dimensions
- Keyboard shortcuts: R (rotate 90°), Delete, Ctrl+Z/Y, G (grid), L (layers)

### 3. Pedal Catalog (left sidebar + /pedals)
- Search bar with Fuse.js fuzzy search
- Filter by category (Overdrive, Distortion, Delay, Reverb, Tuner, Compressor, etc.)
- Filter by brand
- Pedal cards: thumbnail + name + brand + dimensions
- Drag from catalog to canvas

### 4. Pedal Info Panel (right sidebar)
- Shows when a pedal is selected on canvas
- Pedal image (larger)
- Name, brand, category
- Dimensions (width x height mm)
- Specs (voltage, current, bypass type)
- Description/history
- BUY button (accent color) → affiliate link with UTM params
- Secondary links to other stores

### 5. Pedal Pages (/pedals/[slug]) — SSR for SEO
- Full page for each pedal
- Image, all specs, description, history
- Buy links with UTM
- Schema.org Product markup
- Meta tags + OG tags

### 6. Database Schema (Supabase)
Create migration files in supabase/migrations/:

Tables needed:
- pedals (id, name, slug, brand, category, width_mm, height_mm, image_url, voltage, current_ma, bypass_type, description, history, is_active)
- boards_catalog (id, name, slug, brand, width_mm, height_mm, image_url)
- affiliate_links (id, pedal_id FK, store_name, url, affiliate_code, region, is_primary, is_active)
- link_clicks (id, affiliate_link_id FK, pedal_id FK, source, utm_params JSONB, created_at)

### 7. Seed Data
Create a seed script with ~30 popular pedals with real data:
- Boss TU-3, Boss BD-2, Boss DS-1, Boss DD-8, Boss CE-2W
- MXR Dyna Comp, MXR Phase 90, MXR Carbon Copy
- Strymon Timeline, Strymon BigSky, Strymon Mobius
- Electro-Harmonix Big Muff, EHX POG2, EHX Soul Food
- JHS Morning Glory, JHS Angry Charlie
- Walrus Audio Julia, Walrus Audio Slo
- Ibanez Tube Screamer TS9
- Klon Centaur (placeholder)
- TC Electronic Polytune, TC Flashback
- Wampler Tumnus
- ProCo RAT
- Way Huge Green Rhino
- Fulltone OCD
- Chase Bliss Mood
- Eventide H9

Use realistic dimensions (in mm). For images, use placeholder URLs pointing to /pedal-images/[brand]-[model].png — we'll add real images later.

### 8. Export
- Button to export canvas as JPG (html-to-image)
- Watermark "pedalnation.com" in bottom corner
- Also export equipment list as text

### 9. Admin area (/admin)
- Protected route (check for admin role)
- Dashboard: show counts (pedals, boards created, clicks)
- Pedals CRUD table
- Affiliate links management

### 10. Vercel Config
- Use @sveltejs/adapter-vercel
- Configure for edge functions where appropriate
- SSR for /pedals/[slug] pages

## Design System
- Colors: bg #0F0F0F, surface #1A1A1A, surface-2 #252525, border #333, accent #FF6B35, text #F5F5F5, text-secondary #999
- Font: Inter (import from Google Fonts)
- Border radius: 8px default, 12px for cards
- Use Tailwind for all styling

## File Structure
```
src/
  lib/
    components/
      builder/        # Canvas, toolbar, layers panel
      catalog/         # Search, filter, pedal cards
      info-panel/      # Pedal info sidebar
      ui/              # Reusable UI components
    stores/            # Svelte stores (selected pedal, layers, etc.)
    supabase/          # Supabase client setup
    types/             # TypeScript types
    utils/             # Helpers (utm builder, export, etc.)
    data/              # Seed data, categories
  routes/
    +layout.svelte     # Main layout with header
    +layout.server.ts  # Supabase session
    +page.svelte       # Home page
    builder/
      +page.svelte     # Builder page
    pedals/
      +page.svelte     # Catalog page
      [slug]/
        +page.server.ts # SSR load
        +page.svelte    # Pedal detail
    boards/
      +page.svelte     # Public boards
    admin/
      +layout.svelte   # Admin layout
      +page.svelte     # Dashboard
      pedals/
        +page.svelte   # CRUD
    auth/
      +page.svelte     # Login
    api/
      clicks/
        +server.ts     # Track affiliate clicks
```

## Critical Rules
- DO NOT use any API keys or secrets in client code
- Use .env for Supabase anon key and URL only
- Make the builder work WITHOUT auth (save requires login)
- The builder MUST work even with no DB connection (use local seed data as fallback)
- Dark mode is default and only mode for now
- Every pedal page must have proper meta tags for SEO
- Use TypeScript strictly

When completely finished, run: openclaw system event --text "Done: Pedal Nation PoC built - SvelteKit app with pedalboard editor, catalog, and admin" --mode now
