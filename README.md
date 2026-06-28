<img width="695" height="691" alt="image" src="https://github.com/user-attachments/assets/4a621d7f-7125-4aed-85ea-33ee09848724" />

O Saúde em Foco é um aplicativo web para localização e roteirização até estabelecimentos de saúde do SUS no Brasil.

**Produção:** https://saude2026.vercel.app/

## Dados

- **191.600+** estabelecimentos de saúde ativos
- **27 estados** + Distrito Federal
- **5.200+** municípios cobertos
- Fonte: CNES/DataSUS (base 2026), com coordenadas verificadas e corrigidas por múltiplas APIs de geocodificação
- Classificação por tipo: Postos de Saúde, Hospitais, Farmácias, Clínicas, Laboratórios, Odontologia

## Funcionalidades

- Busca por CEP com validação e geocodificação precisa
- Filtro por tipo de estabelecimento (seleção obrigatória)
- Listagem dos estabelecimentos mais próximos em até 20 km
- Mapa interativo com marcadores e rota de carro
- Navegação direta via Waze (link + cópia rápida)
- Sistema comunitário de denúncias: usuários podem reportar estabelecimentos desativados ou com endereço incorreto, melhorando a qualidade dos dados continuamente
- Mobile-first, responsivo
- Barra de status mobile temática

## Stack

- **Next.js 16** (App Router, TypeScript strict, Turbopack)
- **Tailwind CSS v4**
- **Leaflet** (mapa interativo via OpenStreetMap)
- **Turso** (SQLite distribuído)
- **Drizzle ORM**
- **Zod** (validação de schemas)

## Setup local

```bash
npm install
cp .env.example .env.local
# Preencha as variáveis em .env.local
npm run dev
```

## Deploy

Deploy automático na Vercel via push no branch `main`.
