import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const TURSO_URL = process.env.TURSO_DATABASE_URL!;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

async function main() {
  const dataPath = resolve(__dirname, "../backup/establishments_2026_05.json");
  console.log(`Loading data from: ${dataPath}`);
  const data = JSON.parse(readFileSync(dataPath, "utf-8"));
  console.log(`Records to upload: ${data.length}`);

  // Drop and recreate table
  console.log("Dropping old table...");
  await client.execute("DROP TABLE IF EXISTS establishments");

  console.log("Creating new table...");
  await client.execute(`
    CREATE TABLE establishments (
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
      tp_unidade INTEGER,
      has_coords INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create indexes
  console.log("Creating indexes...");
  await client.execute("CREATE INDEX idx_establishments_uf ON establishments(uf)");
  await client.execute("CREATE INDEX idx_establishments_cidade ON establishments(cidade)");
  await client.execute("CREATE INDEX idx_establishments_coords ON establishments(latitude, longitude)");
  await client.execute("CREATE INDEX idx_establishments_cnes ON establishments(co_cnes)");
  await client.execute("CREATE INDEX idx_establishments_tp ON establishments(tp_unidade)");

  // Insert in batches
  const BATCH_SIZE = 200;
  let inserted = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const stmts = batch.map((row: Record<string, unknown>) => ({
      sql: `INSERT OR IGNORE INTO establishments
            (co_cnes, no_fantasia, no_razao_social, no_logradouro, nu_endereco, no_bairro, co_cep, cidade, uf, co_ibge, latitude, longitude, nu_telefone, ds_turno_atendimento, tp_unidade, has_coords)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.co_cnes,
        row.no_fantasia || null,
        row.no_razao_social || null,
        row.no_logradouro || null,
        row.nu_endereco || null,
        row.no_bairro || null,
        row.co_cep || null,
        row.cidade || "",
        row.uf || "??",
        row.co_ibge || null,
        row.latitude ?? null,
        row.longitude ?? null,
        row.nu_telefone || "Nao informado",
        row.ds_turno_atendimento || "Nao informado",
        row.tp_unidade ?? null,
        row.has_coords ?? 0,
      ],
    }));

    await client.batch(stmts, "write");
    inserted += batch.length;

    if (inserted % 5000 === 0 || inserted === data.length) {
      console.log(`  Inserted ${inserted}/${data.length} (${Math.round(inserted / data.length * 100)}%)`);
    }
  }

  // Verify
  const countRes = await client.execute("SELECT COUNT(*) as total, SUM(has_coords) as with_coords FROM establishments");
  console.log("\n=== UPLOAD COMPLETE ===");
  console.log(`  Total: ${countRes.rows[0].total}`);
  console.log(`  With coords: ${countRes.rows[0].with_coords}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
