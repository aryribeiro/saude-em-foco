import { createClient } from "@libsql/client";
import { readFileSync, createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";

const TURSO_URL = process.env.TURSO_DATABASE_URL!;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local");
  process.exit(1);
}

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const UF_MAP: Record<string, string> = {
  "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
  "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL",
  "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP", "41": "PR",
  "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF",
};

const REPLACEMENTS: [string, string][] = [
  ["Ã£", "ã"], ["Ã¡", "á"], ["Ã¢", "â"], ["Ã©", "é"],
  ["Ãª", "ê"], ["Ã­", "í"], ["Ã³", "ó"], ["Ã´", "ô"],
  ["Ãº", "ú"], ["Ã§", "ç"], ["NÃ£", "Não"],
];

function normalize(text: string): string {
  let result = text;
  for (const [from, to] of REPLACEMENTS) {
    result = result.replaceAll(from, to);
  }
  return result;
}

function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").padStart(8, "0");
  if (digits.length < 8) return raw;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

async function createTables() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS establishments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      co_cnes TEXT NOT NULL UNIQUE,
      no_fantasia TEXT,
      no_razao_social TEXT,
      no_logradouro TEXT,
      nu_endereco TEXT,
      no_bairro TEXT,
      co_cep TEXT,
      cidade TEXT,
      uf TEXT NOT NULL,
      co_ibge TEXT,
      latitude REAL,
      longitude REAL,
      nu_telefone TEXT,
      ds_turno_atendimento TEXT,
      has_coords INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_establishments_uf ON establishments(uf)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_establishments_cidade ON establishments(cidade)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_establishments_coords ON establishments(latitude, longitude)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_establishments_cnes ON establishments(co_cnes)`);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS coordinate_corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      co_cnes TEXT NOT NULL UNIQUE,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      source TEXT DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  console.log("Tables created.");
}

async function seedEstablishments() {
  const csvPath = resolve(__dirname, "../_legacy/downloaded_data.csv");
  console.log(`Reading CSV from: ${csvPath}`);

  const rl = createInterface({
    input: createReadStream(csvPath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let lineNum = 0;
  let batch: string[][] = [];
  let totalInserted = 0;

  for await (const rawLine of rl) {
    lineNum++;

    if (lineNum === 1) {
      headers = parseCsvLine(rawLine);
      console.log(`Headers (${headers.length}): ${headers.slice(0, 10).join(", ")}...`);
      continue;
    }

    const fields = parseCsvLine(rawLine);
    if (fields.length < headers.length - 2) continue;

    batch.push(fields);

    if (batch.length >= 200) {
      await insertBatch(headers, batch);
      totalInserted += batch.length;
      if (totalInserted % 2000 === 0) {
        console.log(`  Inserted ${totalInserted} rows...`);
      }
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(headers, batch);
    totalInserted += batch.length;
  }

  console.log(`Total rows inserted: ${totalInserted}`);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ";" && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

async function insertBatch(headers: string[], batch: string[][]) {
  const colIndex = (name: string) => headers.indexOf(name);

  const stmts = batch.map((fields) => {
    const getField = (name: string): string => {
      const idx = colIndex(name);
      return idx >= 0 && idx < fields.length ? fields[idx] : "";
    };

    const coCnes = getField("CO_CNES");
    const coIbge = getField("CO_IBGE");
    const uf = UF_MAP[coIbge.slice(0, 2)] ?? "";
    const rawCep = getField("CO_CEP");
    const lat = parseFloat(getField("NU_LATITUDE"));
    const lng = parseFloat(getField("NU_LONGITUDE"));
    const hasCoords = !isNaN(lat) && !isNaN(lng) ? 1 : 0;

    return {
      sql: `INSERT OR IGNORE INTO establishments
            (co_cnes, no_fantasia, no_razao_social, no_logradouro, nu_endereco, no_bairro, co_cep, cidade, uf, co_ibge, latitude, longitude, nu_telefone, ds_turno_atendimento, has_coords)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        coCnes,
        normalize(getField("NO_FANTASIA")) || null,
        normalize(getField("NO_RAZAO_SOCIAL")) || null,
        normalize(getField("NO_LOGRADOURO")) || null,
        getField("NU_ENDERECO") || null,
        normalize(getField("NO_BAIRRO")) || null,
        rawCep ? formatCep(rawCep) : null,
        normalize(getField("CIDADE") || getField("NO_MUNICIPIO") || ""),
        uf || "??",
        coIbge || null,
        hasCoords ? lat : null,
        hasCoords ? lng : null,
        getField("NU_TELEFONE") || "Não informado",
        normalize(getField("DS_TURNO_ATENDIMENTO")) || "Não informado",
        hasCoords,
      ],
    };
  });

  await client.batch(stmts, "write");
}

async function seedCorrections() {
  const correctionsPath = resolve(__dirname, "../_legacy/coord_corrections.json");
  let corrections: Record<string, { lat: number; lng: number }>;

  try {
    const raw = readFileSync(correctionsPath, "utf-8");
    corrections = JSON.parse(raw);
  } catch {
    console.log("No coord_corrections.json found, skipping.");
    return;
  }

  const entries = Object.entries(corrections);
  console.log(`Importing ${entries.length} coordinate corrections...`);

  const batchSize = 100;
  for (let i = 0; i < entries.length; i += batchSize) {
    const chunk = entries.slice(i, i + batchSize);
    const stmts = chunk.map(([cnes, { lat, lng }]) => ({
      sql: `INSERT OR REPLACE INTO coordinate_corrections (co_cnes, latitude, longitude, source) VALUES (?, ?, ?, 'imported')`,
      args: [cnes, lat, lng],
    }));
    await client.batch(stmts, "write");
  }

  // Apply corrections to establishments
  for (const [cnes, { lat, lng }] of entries) {
    await client.execute({
      sql: `UPDATE establishments SET latitude = ?, longitude = ?, has_coords = 1 WHERE co_cnes = ?`,
      args: [lat, lng, cnes],
    });
  }

  console.log(`Applied ${entries.length} coordinate corrections.`);
}

async function main() {
  console.log("Starting seed...");
  console.log(`Database: ${TURSO_URL}`);

  await createTables();
  await seedEstablishments();
  await seedCorrections();

  console.log("Seed complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
