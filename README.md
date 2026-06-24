# Saúde em Foco

Aplicativo web para localização e roteirização até estabelecimentos de saúde do SUS no Brasil.

**Produção:** https://saude2026.vercel.app/

## Stack

- **Next.js 16** (App Router, TypeScript strict)
- **Tailwind CSS v4**
- **Leaflet** (mapa interativo via OpenStreetMap)
- **Turso** (SQLite distribuído — 181k+ estabelecimentos CNES)
- **Drizzle ORM**
- **Zod** (validação de schemas)

## Funcionalidades

- Validação de CEP via ViaCEP
- Geocodificação com load balancing entre OpenCage, Nominatim e LocationIQ (sorteio aleatório + cache em memória 1h)
- Filtro obrigatório por tipo de estabelecimento (Postos, Hospitais, Farmácias, Odontologia, Laboratórios, Clínicas)
- Busca dos 10 estabelecimentos mais próximos em até 20km (haversine + bounding box)
- Mapa interativo com marcadores e rota de carro (OpenRouteService)
- Link e botão para navegação via Waze
- Barra de status mobile vermelha (theme-color)
- Scrollbar vermelha customizada
- Mobile-first, responsivo

## Arquitetura

```
src/
├── app/
│   ├── api/
│   │   ├── cep/          # Validação CEP (ViaCEP)
│   │   ├── geocode/      # Geocodificação balanceada
│   │   ├── establishments/ # Busca por proximidade + tipo
│   │   └── route/        # Rota carro (OpenRouteService)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── icon.png          # Favicon (Next.js file convention)
├── components/
│   ├── MapView.tsx       # Wrapper com dynamic ssr:false
│   ├── CepSearchForm.tsx # Input CEP + checkboxes tipo
│   ├── EstablishmentList.tsx
│   ├── EstablishmentCard.tsx
│   ├── WazeButton.tsx
│   └── Footer.tsx
├── hooks/
│   └── useSearch.ts      # Estado global de busca
├── lib/
│   ├── db/
│   │   ├── client.ts     # Turso lazy init
│   │   └── schema.ts     # Drizzle schema
│   ├── services/
│   │   ├── geocode-balancer.ts  # Round-robin + cache
│   │   ├── opencage.ts
│   │   ├── nominatim.ts
│   │   ├── locationiq.ts
│   │   ├── openroute.ts
│   │   └── viacep.ts
│   ├── utils/
│   │   └── retry.ts      # Backoff exponencial + jitter
│   └── validators/
│       └── coordinates.ts # Haversine + validação Brasil
└── types/
    └── index.ts
```

## Setup local

```bash
npm install
cp .env.example .env.local
# Preencha as variáveis em .env.local
npm run dev
```

## Seed do banco

```bash
# Coloque o CSV em _legacy/downloaded_data.csv
export $(grep -v '^#' .env.local | xargs)
npx tsx scripts/seed-turso.ts

# Adicionar coluna tp_unidade (tipo de estabelecimento)
npx tsx scripts/add-tp-unidade.ts
```

## Deploy

Deploy automático na Vercel via push no branch `main`.

Environment variables no dashboard Vercel:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `OPENCAGE_API_KEY`
- `OPENROUTESERVICE_API_KEY`

## Notas técnicas

- Leaflet requer `img { max-width: none !important }` dentro de `.leaflet-container` para funcionar com Tailwind v4 (preflight reseta max-width dos tiles)
- MapView usa `dynamic(() => import(...), { ssr: false })` para evitar acesso a `window` no server
- O banco Turso tem índices em: uf, cidade, coordenadas (lat/lng), co_cnes, tp_unidade
- Retry com backoff exponencial em todas as chamadas a APIs externas
