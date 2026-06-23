# Saúde em Foco

Aplicativo web para localização e roteirização até estabelecimentos de saúde do SUS no Brasil.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS**
- **Leaflet** (mapa interativo)
- **Turso** (SQLite distribuído — 181k estabelecimentos CNES)
- **Drizzle ORM**

## Funcionalidades

- Validação de CEP (ViaCEP)
- Geocodificação (OpenCage)
- Busca dos 5 estabelecimentos mais próximos (haversine + bounding box)
- Mapa interativo com rota de carro (OpenRouteService)
- Correção de coordenadas persistente (Turso)
- Link/botão para navegação no Waze
- Mobile-first, responsivo

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
npm run seed
```

## Deploy

Deploy automático na Vercel. Environment variables configuradas no dashboard:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `OPENCAGE_API_KEY`
- `OPENROUTESERVICE_API_KEY`
