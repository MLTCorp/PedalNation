# PRD — Pedal Nation PoC
## Plataforma de Pedalboard Virtual com Monetização por Afiliados

**Versão:** 1.0.0
**Data:** 26/03/2026
**Autor:** Sincron IA Digital
**Cliente:** Gabriel Gama (Kamikaze) & Thiago HC
**Classificação:** Confidencial

---

# Sumário

1. Visão Geral do Projeto
2. Análise de Mercado & Concorrência
3. Personas & Jornadas
4. Arquitetura de Informação
5. Funcionalidades — Blueprint (MoSCoW)
6. Fluxos de Usuário
7. Especificação Funcional Detalhada
8. Modelo de Dados
9. Stack Técnico & Arquitetura
10. UI/UX — Design System
11. SEO & Growth Strategy
12. Monetização
13. Plano de Testes
14. Roadmap & Cronograma
15. Riscos & Mitigações
16. Apêndices

---

# 1. Visão Geral do Projeto

## 1.1 Contexto

O mercado de pedais de guitarra movimenta bilhões globalmente. Guitarristas — tanto profissionais quanto hobbyistas — precisam planejar a montagem de seus pedalboards: quais pedais usar, se cabem no board físico, como organizar layers (cima/baixo da plataforma), e onde comprar.

Hoje, a principal ferramenta para isso é o **Pedal Playground** (pedalplayground.com) — um projeto open-source mantido por doações, com UX limitada, sem monetização, e sem features que o mercado demanda.

## 1.2 Oportunidade

Nenhum concorrente atual:
- Oferece links de compra (afiliado) nos pedais
- Tem sistema de layers para boards complexos
- Possui busca inteligente (a busca do Pedal Playground é "burra")
- Foca no mercado brasileiro (100% em inglês hoje)
- Gera receita com o tráfego existente

O Pedal Playground, mesmo precário, já atrai tráfego significativo. Uma versão melhor, com monetização e foco no Brasil (com expansão global), representa uma oportunidade clara de "money left on the table".

## 1.3 Visão do Produto

> Uma plataforma onde qualquer guitarrista pode montar seu pedalboard virtual, descobrir pedais novos e comprá-los com um clique — gerando receita para a plataforma via links de afiliado.

**Uma frase:** "Monte seu pedalboard, descubra pedais, compre com um clique."

## 1.4 Objetivos de Negócio

| Objetivo | Métrica | Meta (6 meses) |
|----------|---------|-----------------|
| Tráfego orgânico | Visitantes únicos/mês | 10.000+ |
| Engajamento | Boards criados/mês | 2.000+ |
| Monetização | Cliques em links de afiliado/mês | 500+ |
| Conversão | Taxa de clique → compra | 1-3% |
| SEO | Palavras-chave rankeando top 10 | 50+ |

## 1.5 Stakeholders

| Nome | Papel | Foco |
|------|-------|------|
| Gabriel Gama (Kamikaze) | Co-founder, Product Expert | Expertise técnica em pedais, early adopter, produtor de conteúdo YouTube |
| Thiago HC | Co-founder, Business | Estratégia de negócio, monetização, growth |
| Sincron IA | Desenvolvimento | Arquitetura, desenvolvimento, deploy |

## 1.6 Escopo da PoC

**Dentro do escopo:**
- Editor de pedalboard visual completo
- Catálogo de pedais com imagens e specs
- Links de afiliado com rastreamento UTM
- Busca inteligente
- Export de boards (JPG + lista)
- Admin dashboard básico
- Profile de usuário e boards públicos

**Fora do escopo (futuro):**
- E-commerce próprio / carrinho / pagamento
- Comunidade completa com posts e comentários
- Blog automático (Fase 2)
- Espaço Indie para makers (Fase 2)
- Cálculos avançados: voltagem, impedância, sine wave (Fase 3)
- DMs entre usuários (vetado permanentemente)

---

# 2. Análise de Mercado & Concorrência

## 2.1 Concorrentes Diretos

### Pedal Playground (pedalplayground.com)
- **Status:** Líder de mercado por inércia
- **Modelo:** Gratuito, mantido por doações
- **Pontos fortes:** Base de pedais extensa, reconhecimento da comunidade
- **Pontos fracos:**
  - Sem layers → impossível organizar boards complexos
  - Sem snap/grid → posicionamento impreciso e frustrante
  - Busca "burra" → não encontra pedais com variações de nome
  - Sem info nos pedais → clicou e nada acontece
  - Sem link de compra → zero monetização
  - Export horrível → sem download de imagem decente
  - Servidor instável → vive pedindo doações
  - Sem comunidade → zero social
  - Interface datada → parece 2010

### Outros concorrentes menores
- **Pedalboard Planner** — apps mobile limitados
- **Pedaltrain** — ferramenta própria (só boards deles)
- **ModularGrid** (eurorack) — referência de UX mas para synths, não pedais

## 2.2 SWOT

| | Positivo | Negativo |
|---|----------|----------|
| **Interno** | Stack moderna (SvelteFlow), UX superior, monetização from day 1, expertise técnica do Kamikaze | Time pequeno, sem base de usuários inicial, precisa construir catálogo do zero |
| **Externo** | Mercado carente de ferramenta boa, nenhum concorrente monetiza, conteúdo BR inexistente | Pedal Playground tem brand recognition, guitarristas são conservadores, scraping pode ter limitações legais |

## 2.3 Diferencial Competitivo

1. **Layers** — ninguém tem. É a feature #1 para power users
2. **Links de afiliado** — ninguém monetiza. Dinheiro na mesa
3. **Busca inteligente** — fuzzy search que entende variações
4. **Info + história** — cada pedal é uma página rica (SEO!)
5. **Foco Brasil** — conteúdo em PT-BR, pedais nacionais, makers indie
6. **Export profissional** — JPG limpo com marca d'água da plataforma

---

# 3. Personas & Jornadas

## 3.1 Persona 1: Guitarrista Dentista (60% do público)

**Nome:** Ricardo, 38 anos, São Paulo
**Profissão:** Dentista, toca guitarra como hobby
**Renda:** Alta — compra equipamento sem muita pesquisa de preço
**Comportamento:**
- Tem 5-8 pedais, quer expandir
- Não sabe montar pedalboard sozinho
- Busca referências visuais ("quero um board tipo o do John Mayer")
- Compra por impulso se achar legal
- Não frequenta fóruns técnicos

**Jornada:**
1. Pesquisa no Google "como montar pedalboard"
2. Encontra a plataforma via SEO/blog
3. Cria board virtual com seus pedais
4. Descobre novos pedais nas recomendações
5. Clica no link de afiliado → compra

## 3.2 Persona 2: Guitarrista Profissional / Early Adopter (25%)

**Nome:** Gabriel (baseado no Kamikaze), 35 anos, EUA/Brasil
**Profissão:** Músico profissional / produtor de pedais
**Comportamento:**
- Board complexo com 15+ pedais e layers
- Precisa planejar antes de comprar (cabe? funciona?)
- Conhece specs técnicas (amperagem, impedância)
- Influencia outros guitarristas
- Quer features avançadas (snap, layers, loop switch)

**Jornada:**
1. Já conhece o Pedal Playground e odeia as limitações
2. Descobre a plataforma pelo boca-a-boca ou YouTube
3. Migra porque tem layers e snap grid
4. Cria boards complexos, compartilha nas redes
5. Atrai seguidores para a plataforma (growth orgânico)

## 3.3 Persona 3: Lojista / Afiliado (15%)

**Nome:** Fernando, 42 anos, dono de loja online de pedais
**Comportamento:**
- Quer aparecer nos links de compra
- Precisa de métricas (cliques, conversões)
- Paga por posicionamento ou aceita comissão

**Jornada:**
1. Recebe contato da plataforma
2. Cadastra seus produtos com links
3. Monitora dashboard de cliques
4. Renova parceria baseado em resultados

---

# 4. Arquitetura de Informação

## 4.1 Mapa do Site

```
pedalnation.com/
├── / (Home)
│   ├── Hero + CTA "Monte seu board"
│   ├── Boards em destaque
│   └── Pedais populares
│
├── /builder (Editor de Pedalboard) ★ CORE
│   ├── Canvas principal (SvelteFlow)
│   ├── Painel lateral: catálogo de pedais
│   ├── Painel lateral: catálogo de boards
│   ├── Painel de propriedades (info do pedal selecionado)
│   ├── Toolbar: layers, zoom, export, share
│   └── Modal: salvar / publicar board
│
├── /pedals (Catálogo de Pedais)
│   ├── /pedals?category=distortion (filtros)
│   ├── /pedals?brand=boss (filtros)
│   └── /pedals/[slug] (Página do Pedal) ★ SEO
│       ├── Imagem, specs, história
│       ├── Link de compra (afiliado)
│       ├── "Quem usa esse pedal também usa..."
│       └── Reviews (futuro)
│
├── /boards (Boards Públicos)
│   ├── Feed de boards compartilhados
│   ├── Filtro por estilo musical
│   └── /boards/[id] (Board público)
│       ├── Visualização do board
│       ├── Lista de pedais com links
│       └── "Duplicar este board"
│
├── /profile/[username] (Perfil)
│   ├── Boards do usuário
│   ├── Lista "Tenho" / "Quero ter"
│   └── Bio básica
│
├── /auth (Login/Registro)
│   ├── Google OAuth
│   ├── Email + senha
│   └── Login social (futuro)
│
└── /admin (Área Administrativa) 🔒
    ├── /admin/dashboard (KPIs)
    ├── /admin/pedals (Gestão do catálogo)
    ├── /admin/links (Controle de afiliados)
    ├── /admin/boards (Moderação)
    └── /admin/users (Gestão de usuários)
```

## 4.2 Hierarquia de Navegação

**Header (sempre visível):**
- Logo Pedal Nation
- Builder | Catálogo | Boards | [Avatar/Login]

**No Builder:**
- Sidebar esquerda: Catálogo de pedais (busca + categorias)
- Sidebar direita: Propriedades do pedal selecionado
- Toolbar superior: Layers | Zoom | Grid | Export | Share | Save

---

# 5. Funcionalidades — Blueprint (MoSCoW)

## 5.1 Must Have (P0) — PoC/Fase 1

| ID | Feature | Descrição | Complexidade |
|----|---------|-----------|-------------|
| F01 | **Editor de Pedalboard** | Canvas visual com drag & drop de pedais e boards | Alta |
| F02 | **Sistema de Layers** | Camadas (top/bottom) tipo Adobe, com visibilidade toggle | Média |
| F03 | **Snap Grid** | Grid magnético para alinhamento automático | Média |
| F04 | **Catálogo de Pedais** | Base de dados com imagem, dimensões, specs, marca | Alta |
| F05 | **Busca Inteligente** | Fuzzy search com tolerância a erros e sinônimos | Média |
| F06 | **Links de Afiliado** | Cada pedal com link de compra + UTM tracking | Baixa |
| F07 | **Info Panel** | Ao clicar/hover no pedal: specs, história, link de compra | Média |
| F08 | **Export JPG** | Exportar board como imagem com marca d'água + lista de equipamentos | Média |
| F09 | **Boards Customizados** | Criar board com dimensões customizadas (polegadas/cm) | Baixa |
| F10 | **Catálogo de Boards** | Base de pedalboards comerciais (Boss, Pedaltrain, etc.) com dimensões reais | Média |
| F11 | **Admin: Cadastro de Equipamentos** | CRUD de pedais e boards no admin | Média |
| F12 | **Admin: Controle de Links** | Gerenciar links de afiliado por pedal | Baixa |
| F13 | **Admin: Dashboard** | Métricas de views, cliques em links, boards criados | Média |
| F14 | **Auth** | Login/registro (Google OAuth + email) | Baixa |
| F15 | **Salvar Boards** | Usuário logado salva seus boards | Baixa |
| F16 | **Duplicar Boards** | Copiar board próprio ou público | Baixa |
| F17 | **Páginas de Pedal (SEO)** | Cada pedal tem página dedicada indexável | Média |

## 5.2 Should Have (P1) — Fase 2

| ID | Feature | Descrição |
|----|---------|-----------|
| F20 | **Boards Públicos / Feed** | Publicar boards e ver feed da comunidade |
| F21 | **"Tenho" / "Quero ter"** | Botões em cada pedal para criar listas pessoais |
| F22 | **Profile Público** | Página do usuário com seus boards e listas |
| F23 | **Filtro por Estilo Musical** | "Boards de blues", "boards de metal" |
| F24 | **Blog Automático** | Posts gerados via scraping + tradução de conteúdo gringo |
| F25 | **Ranking de Boards** | Votação e ranking semanal/mensal |
| F26 | **AdSense** | Monetização adicional via Google Ads |
| F27 | **Email Remarketing** | Re-engajamento de quem clicou mas não comprou |
| F28 | **"Quem tem X também usa Y"** | Recomendação baseada em boards da comunidade |

## 5.3 Nice to Have (P2) — Fase 3

| ID | Feature | Descrição |
|----|---------|-----------|
| F30 | **Cálculo de Voltagem/Amperagem** | Power supply calculator integrado |
| F31 | **Cálculo de Impedância** | Análise de impedância entrada/saída |
| F32 | **Simulação Sine Wave** | Visualização do sinal passando pela chain |
| F33 | **Loop Switch não-linear** | Conectar saídas/entradas visualmente |
| F34 | **Espaço Indie** | Perfil para makers independentes |
| F35 | **"Julguem meu Board"** | Feature social gamificada |
| F36 | **Board do Mês** | Curadoria mensal com destaque |
| F37 | **Selo "Feito no Brasil"** | Destaque para pedais nacionais |
| F38 | **Tier Pro** | Funcionalidades avançadas pagas |

---

# 6. Fluxos de Usuário

## 6.1 Fluxo Principal: Montar Pedalboard

```
[Usuário acessa /builder]
    │
    ├─→ Seleciona board (catálogo ou custom)
    │       │
    │       ├─→ Board comercial (ex: Pedaltrain Classic 2)
    │       └─→ Board customizado (define dimensões)
    │
    ├─→ Board aparece no canvas
    │
    ├─→ Busca pedal na sidebar esquerda
    │       │
    │       ├─→ Digita nome/marca → fuzzy search
    │       ├─→ Filtra por categoria (distortion, delay, etc.)
    │       └─→ Resultado: cards com imagem + nome + dimensões
    │
    ├─→ Arrasta pedal para o canvas
    │       │
    │       ├─→ Snap automático no grid
    │       ├─→ Pode mover, girar (90°), redimensionar
    │       └─→ Layer automático (top por padrão)
    │
    ├─→ Clica no pedal posicionado
    │       │
    │       └─→ Info Panel (direita) mostra:
    │               ├─→ Nome, marca, imagem
    │               ├─→ Dimensões, peso
    │               ├─→ Specs técnicos
    │               ├─→ Breve história
    │               └─→ 🛒 BOTÃO "Comprar" (link afiliado)
    │
    ├─→ Gerencia Layers
    │       ├─→ Toggle visibilidade top/bottom
    │       ├─→ Move pedal entre layers
    │       └─→ Seleciona todos de um layer
    │
    ├─→ Export
    │       ├─→ JPG do board (com marca d'água)
    │       └─→ Lista de equipamentos (nome + link)
    │
    └─→ Salvar / Compartilhar
            ├─→ Salva no perfil (requer login)
            ├─→ Compartilha link público
            └─→ Duplica board existente
```

## 6.2 Fluxo de Monetização (Afiliado)

```
[Usuário vê pedal no builder OU na página do pedal]
    │
    ├─→ Clica em "Comprar" ou "Ver preço"
    │
    ├─→ Sistema gera URL com UTM:
    │       https://loja.com/pedal-x?utm_source=pedalnation
    │       &utm_medium=builder
    │       &utm_campaign=pedal-slug
    │       &utm_content=user-id
    │
    ├─→ Redirect para loja do afiliado (nova aba)
    │
    ├─→ Evento registrado no analytics:
    │       { pedal, user, source, timestamp }
    │
    └─→ Admin dashboard atualiza métricas
```

## 6.3 Fluxo Admin: Cadastrar Pedal

```
[Admin acessa /admin/pedals]
    │
    ├─→ Clica "Novo Pedal"
    │
    ├─→ Preenche formulário:
    │       ├─→ Nome, marca, categoria
    │       ├─→ Dimensões (largura x altura x profundidade em mm)
    │       ├─→ Upload imagem (fundo transparente PNG)
    │       ├─→ Specs técnicos (voltagem, amperagem, etc.)
    │       ├─→ Descrição / história
    │       ├─→ Link de afiliado principal
    │       └─→ Links alternativos (múltiplas lojas)
    │
    ├─→ Preview no builder (como vai ficar)
    │
    └─→ Publica → disponível no catálogo
```

---

# 7. Especificação Funcional Detalhada

## 7.1 F01 — Editor de Pedalboard (Canvas)

**Tecnologia:** SvelteFlow (baseado em xyflow)

**Comportamento do Canvas:**
- Área infinita com zoom (scroll wheel) e pan (drag em área vazia)
- Zoom: 25% a 400%, com botões de zoom to fit
- Background: grid pontilhado sutil (desligável)
- Dimensões reais: 1 unidade do canvas = 1mm real
- Escala visual: ruler nas bordas mostrando polegadas/cm

**Elementos no Canvas:**
- **Boards:** Retângulos com dimensões reais, cor sólida, borda arredondada
- **Pedais:** Imagens PNG com dimensões reais proporcionais, draggable
- **Cabos:** (futuro) Conexões visuais entre pedais

**Interações:**
- Drag & drop do catálogo para o canvas
- Mover pedais (snap to grid quando ativo)
- Rotação: 0°, 90°, 180°, 270° (botão ou atalho R)
- Seleção múltipla: Shift+click ou rubber band
- Delete: tecla Del ou backspace
- Undo/Redo: Ctrl+Z / Ctrl+Shift+Z
- Copiar/Colar: Ctrl+C / Ctrl+V

**Toolbar:**
| Ação | Ícone | Atalho | Descrição |
|------|-------|--------|-----------|
| Layers | 📑 | L | Toggle painel de layers |
| Snap Grid | 🧲 | G | Liga/desliga snap |
| Zoom In | 🔍+ | Ctrl++ | Aproximar |
| Zoom Out | 🔍- | Ctrl+- | Afastar |
| Fit | ⬜ | Ctrl+0 | Zoom to fit |
| Export | 📷 | Ctrl+E | Exportar JPG + lista |
| Share | 🔗 | Ctrl+K | Gerar link público |
| Save | 💾 | Ctrl+S | Salvar board |

## 7.2 F02 — Sistema de Layers

**Conceito:** Baseado no modelo Adobe/Canva de camadas.

**Layers disponíveis:**
- **Top Layer** (default) — Pedais em cima do board
- **Bottom Layer** — Pedais embaixo da plataforma (power supply, cabeamento)
- **Board Layer** (locked) — O board físico em si

**Painel de Layers (sidebar):**
```
┌─ Layers ──────────────┐
│ 👁️ 🔒  Board Layer    │  ← Sempre no fundo
│ 👁️     Bottom Layer   │  ← Toggle visibilidade
│ 👁️     Top Layer ✦    │  ← Layer ativo (editando)
└────────────────────────┘
```

**Interações:**
- Clique no 👁️: toggle visibilidade
- Clique no nome: ativa layer para edição
- Drag pedal entre layers: move para outro layer
- Quando bottom está oculto, pedais de cima ficam opacos
- Quando bottom está visível, board fica semi-transparente

**Regra de negócio:** Ao selecionar um layer, só pedais daquele layer são editáveis. Isso resolve o problema do Kamikaze de ter que mover tudo para acessar o que está embaixo.

## 7.3 F05 — Busca Inteligente

**Problema atual (Pedal Playground):** Busca por "breaker" não encontra "Blues Breaker" se estiver escrito junto.

**Solução:**

Motor de busca com:
- **Fuzzy matching** (Levenshtein distance ≤ 2)
- **Tokenização** por palavras (busca parcial)
- **Sinônimos** (ex: "dist" → "distortion")
- **Busca por categoria** (ex: "delay" mostra todos os delays)
- **Busca por marca** (ex: "boss" mostra todos Boss)
- **Busca por cor** (futuro — ex: "azul" mostra pedais azuis)

**Implementação:** Fuse.js no client-side (rápido, sem server roundtrip) com índice pré-construído.

**UX:**
```
┌─ Buscar Pedal ──────────────────┐
│ 🔍 blues break                  │
├─────────────────────────────────┤
│ 📦 Marshall Blues Breaker       │
│    Marshall | Overdrive | 12x7cm│
│ 📦 King of Tone (Blues variant) │
│    AnalogMan | Overdrive | 11x6 │
│ 📦 Morning Glory                │
│    JHS | Overdrive | 11x6cm    │
└─────────────────────────────────┘
```

## 7.4 F06 — Links de Afiliado com UTM

**Estrutura do link:**

```
https://{loja_url}/{produto_path}
  ?utm_source=pedalnation
  &utm_medium={contexto}        // builder | catalog | pedal-page | board-share
  &utm_campaign={pedal_slug}    // boss-blues-driver
  &utm_content={user_id}        // tracking individual (opcional)
  &ref={affiliate_code}         // código de afiliado específico da loja
```

**Prioridade de links (por pedal):**
1. Link direto do fabricante (se programa de afiliado existir)
2. Link de e-commerce parceiro (Reverb, Sweetwater, Amazon)
3. Link genérico de busca (Google Shopping)

**Admin gerencia:**
- Múltiplos links por pedal (ex: Reverb BR, Amazon US, Sweetwater)
- Link primário (exibido no botão) vs. links alternativos
- UTMs configuráveis por campanha
- Ativar/desativar links por região

## 7.5 F08 — Export JPG + Lista

**Export inclui:**
1. **Imagem JPG** (alta resolução, 300dpi):
   - Board completo renderizado
   - Marca d'água sutil "pedalnation.com" no canto inferior
   - Fundo clean (branco ou escuro, escolha do usuário)

2. **Lista de Equipamentos** (PDF ou texto):
   ```
   Pedalboard: Meu Setup Blues
   Board: Pedaltrain Classic 2 (61x31cm)

   Top Layer:
   1. Boss TU-3 Tuner — Ver preço: [link]
   2. Marshall Blues Breaker — Ver preço: [link]
   3. Strymon Timeline — Ver preço: [link]

   Bottom Layer:
   1. Voodoo Lab Pedal Power 2+ — Ver preço: [link]

   Criado em pedalnation.com
   ```

## 7.6 F13 — Admin Dashboard

**Métricas principais:**
- Total de boards criados (hoje, semana, mês)
- Total de pedais no catálogo
- Cliques em links de afiliado (por pedal, por loja, por dia)
- Pedais mais populares (mais adicionados em boards)
- Top boards públicos (mais visualizados)
- Usuários registrados / ativos

**Visualizações (shadcn-svelte charts):**
- Gráfico de linha: cliques em afiliado ao longo do tempo
- Bar chart: top 10 pedais mais populares
- Pie chart: distribuição por categoria de pedal
- Tabela: últimos cliques com UTM completo

---

# 8. Modelo de Dados

## 8.1 Entidades Principais

### `pedals` — Catálogo de Pedais
```sql
CREATE TABLE pedals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,                    -- "Blues Breaker"
  slug          TEXT UNIQUE NOT NULL,             -- "marshall-blues-breaker"
  brand         TEXT NOT NULL,                    -- "Marshall"
  category      TEXT NOT NULL,                    -- "overdrive"
  subcategory   TEXT,                             -- "transparent-overdrive"

  -- Dimensões físicas (em mm)
  width_mm      NUMERIC NOT NULL,                -- 120
  height_mm     NUMERIC NOT NULL,                -- 70
  depth_mm      NUMERIC,                         -- 55

  -- Visual
  image_url     TEXT NOT NULL,                    -- URL da imagem PNG (fundo transparente)
  thumbnail_url TEXT,                             -- Thumbnail para listagens
  color_hex     TEXT,                             -- Cor dominante (para busca visual futura)

  -- Specs técnicos
  voltage       TEXT,                             -- "9V"
  current_ma    NUMERIC,                         -- 25 (mA)
  bypass_type   TEXT,                             -- "true-bypass" | "buffered"
  mono_stereo   TEXT DEFAULT 'mono',             -- "mono" | "stereo"

  -- Conteúdo
  description   TEXT,                             -- Descrição curta
  history       TEXT,                             -- História do pedal
  specs_json    JSONB,                           -- Specs adicionais flexíveis

  -- SEO
  meta_title    TEXT,
  meta_desc     TEXT,
  keywords      TEXT[],

  -- Status
  is_active     BOOLEAN DEFAULT true,
  is_verified   BOOLEAN DEFAULT false,           -- Verificado pela equipe
  source        TEXT,                             -- "scrape" | "manual" | "api"

  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pedals_slug ON pedals(slug);
CREATE INDEX idx_pedals_brand ON pedals(brand);
CREATE INDEX idx_pedals_category ON pedals(category);
CREATE INDEX idx_pedals_search ON pedals USING gin(to_tsvector('english', name || ' ' || brand));
```

### `boards_catalog` — Catálogo de Pedalboards Comerciais
```sql
CREATE TABLE boards_catalog (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,                    -- "Pedaltrain Classic 2"
  slug          TEXT UNIQUE NOT NULL,
  brand         TEXT NOT NULL,                    -- "Pedaltrain"
  width_mm      NUMERIC NOT NULL,
  height_mm     NUMERIC NOT NULL,
  image_url     TEXT,
  affiliate_url TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### `affiliate_links` — Links de Afiliado por Pedal
```sql
CREATE TABLE affiliate_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedal_id      UUID REFERENCES pedals(id),
  store_name    TEXT NOT NULL,                    -- "Reverb" | "Sweetwater" | "Amazon"
  url           TEXT NOT NULL,
  affiliate_code TEXT,
  region        TEXT DEFAULT 'global',           -- "br" | "us" | "global"
  is_primary    BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_affiliate_pedal ON affiliate_links(pedal_id);
```

### `users` — Usuários
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  username      TEXT UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  auth_provider TEXT DEFAULT 'email',            -- "email" | "google"
  role          TEXT DEFAULT 'user',             -- "user" | "admin"
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### `user_boards` — Boards Salvos pelos Usuários
```sql
CREATE TABLE user_boards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  title         TEXT NOT NULL DEFAULT 'Meu Board',
  slug          TEXT,
  description   TEXT,

  -- Board base (comercial ou custom)
  board_type    TEXT NOT NULL,                    -- "catalog" | "custom"
  board_catalog_id UUID REFERENCES boards_catalog(id),
  custom_width_mm  NUMERIC,
  custom_height_mm NUMERIC,

  -- Conteúdo do board (JSON com posições dos pedais)
  canvas_data   JSONB NOT NULL DEFAULT '{}',
  /*
    canvas_data = {
      "nodes": [
        {
          "id": "node-1",
          "pedal_id": "uuid",
          "position": { "x": 100, "y": 200 },
          "rotation": 0,
          "layer": "top"
        }
      ],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    }
  */

  -- Social
  is_public     BOOLEAN DEFAULT false,
  genre_tags    TEXT[],                           -- ["blues", "rock"]
  views_count   INTEGER DEFAULT 0,
  likes_count   INTEGER DEFAULT 0,

  -- Thumbnail
  thumbnail_url TEXT,

  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_boards_user ON user_boards(user_id);
CREATE INDEX idx_boards_public ON user_boards(is_public) WHERE is_public = true;
```

### `link_clicks` — Tracking de Cliques em Afiliado
```sql
CREATE TABLE link_clicks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID REFERENCES affiliate_links(id),
  pedal_id      UUID REFERENCES pedals(id),
  user_id       UUID REFERENCES users(id),       -- Null se não logado
  source        TEXT NOT NULL,                    -- "builder" | "catalog" | "pedal-page"
  utm_params    JSONB,
  ip_hash       TEXT,                             -- Hash do IP (anonimizado)
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clicks_pedal ON link_clicks(pedal_id);
CREATE INDEX idx_clicks_date ON link_clicks(created_at);
```

### `user_pedal_lists` — "Tenho" / "Quero Ter" (Fase 2)
```sql
CREATE TABLE user_pedal_lists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  pedal_id      UUID REFERENCES pedals(id),
  list_type     TEXT NOT NULL,                    -- "own" | "wishlist"
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, pedal_id, list_type)
);
```

## 8.2 Diagrama ER (Simplificado)

```
┌──────────┐     ┌─────────────────┐     ┌──────────────────┐
│  users   │────<│  user_boards    │     │  boards_catalog  │
└──────────┘     │  canvas_data    │────>│  (pedalboards)   │
     │           └─────────────────┘     └──────────────────┘
     │
     │           ┌──────────┐     ┌──────────────────┐
     └──────────<│link_clicks│────>│ affiliate_links  │
                 └──────────┘     └────────┬─────────┘
                                           │
                                  ┌────────▼─────────┐
                                  │     pedals       │
                                  │  (catálogo)      │
                                  └──────────────────┘
```

---

# 9. Stack Técnico & Arquitetura

## 9.1 Decisões de Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Framework** | SvelteKit | SSR + SSG para SEO, performance excepcional, DX excelente |
| **Editor Visual** | SvelteFlow (xyflow) | Lib madura para node-based editors, drag & drop nativo, customizável |
| **UI Components** | shadcn-svelte | Design system moderno, Tailwind-based, acessível |
| **Styling** | Tailwind CSS 4 | Utility-first, produtividade alta, bundle otimizado |
| **Database** | Supabase (PostgreSQL) | Auth pronta, Realtime, Storage, Row Level Security |
| **Auth** | Supabase Auth | Google OAuth + email, JWT automático |
| **Storage** | Supabase Storage | Imagens dos pedais, thumbnails dos boards |
| **Search (client)** | Fuse.js | Fuzzy search performante no browser |
| **Export (canvas)** | html-to-image | Render do canvas SvelteFlow para JPG/PNG |
| **Deploy** | Vercel | Edge functions, preview deploys, CDN global |
| **Analytics** | Posthog (self-hosted ou cloud) | Event tracking, funnels, feature flags |
| **Monitoring** | Sentry | Error tracking |

## 9.2 Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │                SvelteKit App                     │   │
│  │  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │   │
│  │  │ SvelteFlow │  │ shadcn   │  │  Fuse.js    │  │   │
│  │  │ (Editor)   │  │ (UI)     │  │  (Search)   │  │   │
│  │  └────────────┘  └──────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                    VERCEL EDGE                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         SvelteKit Server (SSR + API)             │   │
│  │  • Server routes /api/*                          │   │
│  │  • SSR for SEO pages (/pedals/[slug])            │   │
│  │  • Static generation for catalog pages           │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    SUPABASE                              │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │ PostgreSQL │  │  Auth    │  │  Storage (S3)       │ │
│  │ (Database) │  │ (OAuth)  │  │  (Pedal images)     │ │
│  └────────────┘  └──────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 9.3 Estratégia de Rendering (SEO-first)

| Rota | Rendering | Motivo |
|------|-----------|--------|
| `/` (Home) | SSG + ISR | Conteúdo semi-estático, atualiza a cada hora |
| `/builder` | CSR (SPA) | App interativo, não precisa de SSR |
| `/pedals` | SSG | Catálogo estático, rebuild no deploy |
| `/pedals/[slug]` | SSR | Página indexável, dados dinâmicos |
| `/boards/[id]` | SSR | Board público, compartilhável |
| `/profile/[user]` | SSR | Perfil público |
| `/admin/*` | CSR | Área protegida, sem SEO |

## 9.4 API Routes Principais

```
GET    /api/pedals                    → Lista pedais (paginado, filtros)
GET    /api/pedals/[slug]             → Detalhe do pedal
GET    /api/pedals/search?q=          → Busca (fallback server-side)
GET    /api/boards-catalog            → Lista boards comerciais
POST   /api/boards                    → Criar/salvar board (auth)
GET    /api/boards/[id]               → Carregar board
PUT    /api/boards/[id]               → Atualizar board (auth)
DELETE /api/boards/[id]               → Deletar board (auth)
POST   /api/boards/[id]/duplicate     → Duplicar board (auth)
POST   /api/clicks                    → Registrar clique em afiliado
GET    /api/boards/public             → Feed de boards públicos

-- Admin (role: admin)
GET    /api/admin/dashboard           → Métricas agregadas
POST   /api/admin/pedals              → CRUD pedais
PUT    /api/admin/pedals/[id]         → Update pedal
POST   /api/admin/links               → CRUD links afiliado
GET    /api/admin/clicks              → Relatório de cliques
```

## 9.5 Aquisição de Imagens dos Pedais

**Estratégia em camadas:**

1. **APIs públicas:**
   - **Reverb API** (reverb.com/developers) — marketplace de pedais, tem imagens de alta qualidade + specs + preços
   - **Sweetwater** — não tem API pública, mas tem URLs previsíveis de imagens
   - **Thomann API** — disponível para afiliados

2. **Web Scraping (batch, não real-time):**
   - Scrape das páginas de produto dos fabricantes (Boss, MXR, Strymon, etc.)
   - Extrair: nome, dimensões, imagem, specs
   - Processar imagens: remover fundo (rembg), normalizar dimensões

3. **Manual (Kamikaze):**
   - Pedais raros ou indie que não estão em nenhuma API
   - Gabriel fotografa e manda specs
   - Upload via admin dashboard

4. **Pipeline de processamento de imagem:**
   ```
   Imagem original
     → rembg (remove background)
     → Resize proporcional (max 800px lado maior)
     → Salvar PNG transparente no Supabase Storage
     → Gerar thumbnail (200px) para catálogo
   ```

**Meta para PoC:** 200+ pedais populares (Boss, MXR, Strymon, Electro-Harmonix, JHS, Walrus Audio) + 20 boards comerciais (Pedaltrain, Boss, etc.)

---

# 10. UI/UX — Design System

## 10.1 Diretrizes Gerais

- **Filosofia:** Dark mode como padrão (guitarristas preferem), light mode disponível
- **Inspiração:** Ableton Live (editor), Figma (painel lateral), Discord (comunidade)
- **Mobile:** Responsive, mas builder é desktop-first. Mobile mostra catálogo e boards públicos

## 10.2 Paleta de Cores

**Dark Mode (padrão):**
```
Background:     #0F0F0F (quase preto)
Surface:        #1A1A1A (cards, painéis)
Surface-2:      #252525 (hover, elevated)
Border:         #333333
Text Primary:   #F5F5F5
Text Secondary: #999999
Accent:         #FF6B35 (laranja elétrico — energia, rock)
Accent Hover:   #FF8B5E
Success:        #22C55E
Warning:        #F59E0B
Error:          #EF4444
Link:           #60A5FA
```

**Light Mode:**
```
Background:     #FAFAFA
Surface:        #FFFFFF
Border:         #E5E5E5
Text Primary:   #1A1A1A
Accent:         #E85D2A
```

## 10.3 Tipografia

```
Headlines:      Inter (700, 600)
Body:           Inter (400, 500)
Mono/Specs:     JetBrains Mono
Sizes:          12px body, 14px emphasis, 18px h3, 24px h2, 32px h1
```

## 10.4 Componentes-Chave (shadcn-svelte)

| Componente | Uso | Customização |
|------------|-----|-------------|
| **Command** (⌘K) | Busca de pedais | Fuzzy search, ícones de categoria |
| **Sheet** (sidebar) | Catálogo lateral, info panel | Resizable, collapsible |
| **Card** | Pedal card, board card | Image + info compact |
| **Button** | CTAs de compra | Accent color, icon prefix |
| **Dialog** | Salvar board, export | Confirmação, opções |
| **Tabs** | Categorias, layers | Inline no editor |
| **Badge** | Tags de categoria, "NEW" | Color-coded por tipo |
| **Tooltip** | Info rápida ao hover | Specs do pedal |
| **Avatar** | Perfil do usuário | Com status online |
| **DropdownMenu** | Ações no board | Duplicar, deletar, compartilhar |
| **ResizablePanel** | Layout 3-column do builder | Left sidebar + canvas + right sidebar |

## 10.5 Layout do Builder (Wireframe Textual)

```
┌────────────────────────────────────────────────────────────────┐
│  🎸 Pedal Nation    Builder | Catálogo | Boards    [👤 Login]  │
├────────┬──────────────────────────────────────┬────────────────┤
│        │  Toolbar: [Layers] [Grid] [Zoom]     │                │
│ 🔍 Bus │  [Export] [Share] [Save]              │  INFO PANEL    │
│ ca     │                                       │                │
│        │ ┌─────────────────────────────────┐   │ Boss TU-3      │
│ Catego │ │                                 │   │ ┌────────────┐ │
│ rias   │ │     CANVAS (SvelteFlow)         │   │ │  [imagem]  │ │
│ ▸ Over │ │                                 │   │ └────────────┘ │
│ ▸ Dist │ │  ┌──────────────────────┐       │   │ Marca: Boss    │
│ ▸ Dela │ │  │   PEDALBOARD         │       │   │ Tipo: Tuner    │
│ ▸ Reve │ │  │  ┌─────┐ ┌─────┐    │       │   │ 74x129mm       │
│ ▸ Tune │ │  │  │TU-3 │ │BD-2 │    │       │   │ 9V / 55mA      │
│ ▸ Comp │ │  │  └─────┘ └─────┘    │       │   │                │
│        │ │  │  ┌──────────┐       │       │   │ True Bypass    │
│ Resul- │ │  │  │ Timeline │       │       │   │                │
│ tados: │ │  │  └──────────┘       │       │   │ 🛒 Comprar     │
│ ┌────┐ │ │  └──────────────────────┘       │   │ R$ 450 Reverb  │
│ │TU-3│ │ │                                 │   │ R$ 420 Amazon  │
│ └────┘ │ │  Layers: [Top ✦] [Bottom]       │   │                │
│ ┌────┐ │ └─────────────────────────────────┘   │ ★ Quero ter    │
│ │BD-2│ │                                       │ ✓ Tenho        │
│ └────┘ │                                       │                │
├────────┴───────────────────────────────────────┴────────────────┤
│  Status: 3 pedais • Board: Pedaltrain Classic 2 (61x31cm)     │
└────────────────────────────────────────────────────────────────┘
```

---

# 11. SEO & Growth Strategy

## 11.1 SEO On-Page

**Páginas indexáveis de alto valor:**

1. **Páginas de Pedal** (`/pedals/boss-blues-driver`)
   - Title: "Boss Blues Driver BD-2 — Specs, Review, Onde Comprar | Pedal Nation"
   - H1: Nome do pedal
   - Conteúdo: descrição, specs, história, comparações
   - Schema markup: Product (com price, availability)
   - Internal links: "Quem usa BD-2 também usa..."

2. **Páginas de Categoria** (`/pedals?category=overdrive`)
   - Title: "Melhores Pedais de Overdrive 2026 | Pedal Nation"
   - Lista com filtros, bom para long-tail keywords

3. **Boards Públicos** (`/boards/[id]`)
   - Title: "Board de Blues — {user} | Pedal Nation"
   - User-generated content = SEO fuel
   - Schema markup: ItemList

**Keywords alvo (PT-BR):**
- "pedalboard montagem" / "como montar pedalboard"
- "pedal de guitarra" + nome específico
- "melhor pedal overdrive" / "melhor pedal delay"
- "pedaleira guitarrista" / "setup pedais"
- "[marca] [modelo] review" (ex: "boss bd-2 review")

## 11.2 Technical SEO

- **SSR/SSG** para todas as páginas públicas
- **Sitemap dinâmico** com todas as páginas de pedais e boards
- **Open Graph** + Twitter Cards para compartilhamento
- **Structured data** (JSON-LD) em cada página de pedal
- **Core Web Vitals** otimizados (Vercel Edge + Svelte = rápido)
- **Hreflang** preparado para expansão (pt-BR → en)

## 11.3 Growth Channels

| Canal | Prioridade | Estratégia |
|-------|-----------|-----------|
| SEO Orgânico | P0 | Páginas de pedal indexadas, conteúdo PT-BR |
| YouTube Kamikaze | P1 | Reviews mencionando a plataforma |
| Reddit/Facebook Groups | P1 | Compartilhar boards, "julguem meu setup" |
| Backlinks | P1 | Outreach para blogs de música |
| Google Ads (futuro) | P2 | Campanhas para "comprar pedal X" |

---

# 12. Monetização

## 12.1 Revenue Streams

| Stream | Fase | Modelo |
|--------|------|--------|
| **Links de Afiliado** | PoC (F1) | Comissão por clique/venda via UTM. Reverb paga ~3-7%, Amazon ~4-8% |
| **AdSense** | F2 | Display ads em páginas de catálogo e boards públicos |
| **Email Remarketing** | F2 | Re-engajamento de quem clicou mas não comprou |
| **Tier Pro** | F3 | Assinatura mensal para features avançadas (cálculos, etc.) |
| **Patrocínio** | F3 | Marcas pagam destaque no catálogo |

## 12.2 Projeção Conservadora (12 meses)

| Mês | Visitantes/mês | Boards criados | Cliques afiliado | Receita estimada |
|-----|---------------|----------------|-------------------|-----------------|
| 1-2 | 500 | 100 | 15 | $50-100 |
| 3-4 | 2.000 | 500 | 100 | $200-500 |
| 5-6 | 5.000 | 1.500 | 300 | $500-1.500 |
| 7-9 | 10.000 | 3.000 | 600 | $1.500-3.000 |
| 10-12 | 20.000 | 6.000 | 1.200 | $3.000-7.000 |

*Baseado em taxa de clique ~3% e conversão ~1-3% com ticket médio de pedal $80-200.*

## 12.3 Break-even Analysis

- **Investimento Fase 1:** $4.500
- **Investimento Fase 2:** $2.500
- **Manutenção mensal:** R$400/mês (~$80)
- **Hosting (Vercel + Supabase):** ~$50/mês
- **Total mensal operacional:** ~$130/mês

**Break-even estimado:** Mês 7-9 com tráfego orgânico crescente.

---

# 13. Plano de Testes

## 13.1 Testes Funcionais Prioritários

| ID | Feature | Cenário de Teste | Critério de Aceitação |
|----|---------|-------------------|----------------------|
| T01 | Drag & Drop | Arrastar pedal do catálogo para o canvas | Pedal aparece na posição correta com imagem e dimensões reais |
| T02 | Snap Grid | Mover pedal com grid ativo | Pedal alinha automaticamente nos pontos do grid |
| T03 | Layers | Toggle visibilidade do bottom layer | Pedais do bottom somem/aparecem, top layer não afetado |
| T04 | Busca | Buscar "blues break" (parcial) | Retorna "Blues Breaker" e similares |
| T05 | Export JPG | Exportar board com 5+ pedais | JPG gerado com qualidade, marca d'água presente |
| T06 | Link Afiliado | Clicar em "Comprar" no info panel | Abre nova aba com URL + UTMs corretos |
| T07 | Salvar Board | Salvar, sair, voltar | Board carrega exatamente como salvo |
| T08 | Board Custom | Criar board 30x15 polegadas | Board aparece com dimensões corretas |
| T09 | Duplicar | Duplicar board público de outro user | Cópia criada no perfil do usuário |
| T10 | Mobile | Acessar catálogo no mobile | Layout responsivo, cards legíveis |

## 13.2 Testes de Performance

- Lighthouse score > 90 em páginas SSR
- Canvas fluido com 20+ pedais (>30fps)
- Busca retorna em <100ms (Fuse.js client-side)
- Tempo de carregamento inicial do builder < 3s

## 13.3 Testes de SEO

- Cada página de pedal tem: title, meta description, OG tags, JSON-LD
- Sitemap inclui todas as páginas de pedais
- Robots.txt permite indexação das páginas públicas
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms

---

# 14. Roadmap & Cronograma

## 14.1 Fase 1 — PoC / MVP (8 semanas)

### Sprint 1 (Semana 1-2): Foundation
- [ ] Setup SvelteKit + Supabase + Vercel
- [ ] Schema do banco de dados (migrations)
- [ ] SvelteFlow: canvas básico com drag & drop
- [ ] Catálogo de boards (10 modelos populares)
- [ ] Scraping pipeline: primeiros 50 pedais (Boss, MXR)

### Sprint 2 (Semana 3-4): Core Editor
- [ ] Sistema de layers (top/bottom toggle)
- [ ] Snap grid com toggle
- [ ] Busca inteligente (Fuse.js)
- [ ] Info panel (specs + história)
- [ ] Rotação e seleção múltipla
- [ ] Scraping: +100 pedais (Strymon, EHX, JHS, Walrus)

### Sprint 3 (Semana 5-6): Monetização + Auth
- [ ] Links de afiliado com UTM em cada pedal
- [ ] Tracking de cliques (analytics)
- [ ] Auth: Google OAuth + email
- [ ] Salvar/carregar boards
- [ ] Board customizado (dimensões)
- [ ] Scraping: +50 pedais (completar 200)

### Sprint 4 (Semana 7-8): Polish + Launch
- [ ] Export JPG + lista de equipamentos
- [ ] Boards públicos + duplicar
- [ ] Admin dashboard (métricas, CRUD pedais, links)
- [ ] Páginas de pedal (SEO)
- [ ] Páginas de categoria
- [ ] Sitemap, OG tags, JSON-LD
- [ ] Mobile responsive (catálogo e boards)
- [ ] QA + bug fixes
- [ ] Deploy produção

### Entregáveis Fase 1:
✅ Editor de pedalboard funcional com layers e snap
✅ 200+ pedais no catálogo com imagens
✅ Links de afiliado com tracking
✅ Busca inteligente
✅ Export profissional
✅ Páginas indexáveis (SEO)
✅ Admin dashboard

## 14.2 Fase 2 — Comunidade & Growth (12 semanas)

- Profile público com boards e listas
- "Tenho" / "Quero ter" em cada pedal
- Feed de boards públicos com filtro por gênero
- Blog automático (scraping + tradução de conteúdo gringo)
- Ranking de boards (votação)
- AdSense integrado
- Email remarketing
- Recomendações "quem tem X usa Y"
- Glossário de pedais (SEO)

## 14.3 Fase 3 — Pro Features (TBD)

- Cálculos de voltagem/amperagem
- Impedância de sinal
- Simulação sine wave
- Loop switch não-linear
- Espaço Indie makers
- "Julguem meu board" gamificado
- Board do mês
- Tier Pro (assinatura)

---

# 15. Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Scraping de imagens bloqueado | Média | Alto | Usar APIs oficiais (Reverb), fallback para imagens genéricas, manual entry |
| Pedal Playground copia features | Baixa | Médio | Projeto open-source, um dev, sem recursos. Velocidade é vantagem |
| Baixo tráfego orgânico inicial | Alta | Médio | Content marketing via YouTube Kamikaze, grupos de Facebook |
| Programas de afiliado recusam | Média | Alto | Começar com Amazon (fácil aprovação), Reverb, e links diretos |
| Canvas performance com muitos pedais | Baixa | Alto | SvelteFlow é otimizado; virtualizar nodes fora do viewport |
| Gabriel/HC mudam escopo durante dev | Média | Médio | PRD aprovado, sprints definidos, change request formal |
| Questões legais (imagens/marcas) | Baixa | Alto | Fair use para imagens de produto com link de compra; similar ao Google Shopping |

---

# 16. Apêndices

## A. Referências de Mercado

- **Pedal Playground:** https://pedalplayground.com
- **Reverb.com:** Principal marketplace de pedais (referência de dados)
- **Sweetwater.com:** E-commerce premium de áudio
- **Thomann.de:** Maior e-commerce de música da Europa
- **ModularGrid.net:** Referência de UX para planejamento de equipamento

## B. Stack Detalhado

```json
{
  "framework": "SvelteKit 2.x",
  "editor": "@xyflow/svelte (SvelteFlow)",
  "ui": "shadcn-svelte + bits-ui",
  "css": "Tailwind CSS 4",
  "db": "Supabase (PostgreSQL 15)",
  "auth": "Supabase Auth (Google OAuth)",
  "storage": "Supabase Storage",
  "search": "Fuse.js",
  "export": "html-to-image",
  "analytics": "PostHog",
  "monitoring": "Sentry",
  "deploy": "Vercel",
  "scraping": "Cheerio + Puppeteer (batch jobs)",
  "image_processing": "rembg (Python) + sharp (Node)"
}
```

## C. Feedback do Kamikaze/HC no Miro (Consolidado)

| Comentário | Ação Tomada |
|-----------|-------------|
| "Preciso entender melhor a qualidade das buscas" | F05: Busca inteligente com Fuse.js, fuzzy matching |
| "Blog automático não precisa na fase 1" | Movido para Fase 2 |
| "Espaço Indie não necessário na fase 1" | Movido para Fase 3 |
| "Nice to have - versão mais simples. Focar no export" | Social simplificado, export priorizado (F08) |
| "Interação → Profile. Ideia concreta do profile" | Redesenhado como Profile (F22, Fase 2) |
| "Preciso de mais detalhes do AdSense" | Movido para Fase 2 com spec detalhado |
| "Must Have: Dashboard" | F13 priorizado em P0 |
| "Must Have: Cadastro de Equipamentos" | F11 priorizado em P0 |

## D. Condições Comerciais (Proposta Sincron)

| Item | Valor | Prazo |
|------|-------|-------|
| Fase 1 — Ferramenta completa | $4.500 | 2 meses |
| Fase 2 — Comunidade + Growth | $2.500 | 3 meses |
| Manutenção (opcional) | R$400/mês | Mensal, sem fidelidade |
| Fase 1: Pagamento | Entrada + 30 + 60 dias | |
| Fase 2: Pagamento | Entrada + 30 + 60 + 90 dias | |
| Garantia | 90 dias de correções por fase | |

---

*Documento gerado por Sincron IA Digital — sincronia.digital*
*Versão 1.0.0 | 26/03/2026 | Confidencial*
