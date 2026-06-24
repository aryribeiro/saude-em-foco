import { createClient } from "@libsql/client";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";

const TURSO_URL = process.env.TURSO_DATABASE_URL!;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

async function main() {
  // Add column if not exists
  try {
    await client.execute(`ALTER TABLE establishments ADD COLUMN tp_unidade INTEGER`);
    console.log("Column tp_unidade added.");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("duplicate column")) {
      console.log("Column tp_unidade already exists.");
    } else {
      throw e;
    }
  }

  // Create index
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_establishments_tp ON establishments(tp_unidade)`);

  // Read CSV and update
  const csvPath = resolve(__dirname, "../../saude-teste/downloaded_data.csv");
  console.log(`Reading CSV: ${csvPath}`);

  const rl = createInterface({
    input: createReadStream(csvPath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let lineNum = 0;
  let batch: { cnes: string; tp: number }[] = [];
  let totalUpdated = 0;

  for await (const rawLine of rl) {
    lineNum++;

    if (lineNum === 1) {
      headers = rawLine.split(",").map((h) => h.trim());
      continue;
    }

    const fields = parseCsvLine(rawLine);
    const cnesIdx = headers.indexOf("CO_CNES");
    const tpIdx = headers.indexOf("TP_UNIDADE");

    if (cnesIdx < 0 || tpIdx < 0) {
      console.error("Headers not found");
      process.exit(1);
    }

    const cnes = fields[cnesIdx]?.trim();
    const tp = parseInt(fields[tpIdx]?.trim(), 10);

    if (cnes && !isNaN(tp)) {
      batch.push({ cnes, tp });
    }

    if (batch.length >= 500) {
      await updateBatch(batch);
      totalUpdated += batch.length;
      if (totalUpdated % 5000 === 0) {
        console.log(`  Updated ${totalUpdated} rows...`);
      }
      batch = [];
    }
  }

  if (batch.length > 0) {
    await updateBatch(batch);
    totalUpdated += batch.length;
  }

  console.log(`Done! Updated ${totalUpdated} rows with tp_unidade.`);
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
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

async function updateBatch(batch: { cnes: string; tp: number }[]) {
  const stmts = batch.map(({ cnes, tp }) => ({
    sql: `UPDATE establishments SET tp_unidade = ? WHERE co_cnes = ?`,
    args: [tp, cnes],
  }));
  await client.batch(stmts, "write");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
