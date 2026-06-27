import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { establishments } from "@/lib/db/schema";
import { and, between, inArray, sql } from "drizzle-orm";
import { haversine } from "@/lib/validators/coordinates";

export const dynamic = "force-dynamic";

const TYPE_MAP: Record<string, number[]> = {
  postos: [1, 2, 73],
  hospitais: [5, 7, 15, 20],
  farmacias: [43],
  odontologia: [36],
  laboratorios: [4],
  clinicas: [36, 71],
};

export async function GET(request: NextRequest) {
  const db = getDb();
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const types = searchParams.get("types");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Parâmetros lat e lng são obrigatórios." },
      { status: 400 }
    );
  }

  const tpValues = parseTypes(types);
  const results = await searchByRadius(db, lat, lng, 0.18, tpValues, limit);

  return NextResponse.json({ establishments: results });
}

function parseTypes(types: string | null): number[] {
  if (!types) return [];
  const keys = types.split(",").map((t) => t.trim().toLowerCase());
  const values: number[] = [];
  for (const key of keys) {
    if (TYPE_MAP[key]) {
      values.push(...TYPE_MAP[key]);
    }
  }
  return [...new Set(values)];
}

async function searchByRadius(
  db: ReturnType<typeof getDb>,
  lat: number,
  lng: number,
  delta: number,
  tpValues: number[],
  limit: number
) {
  const conditions = [
    between(establishments.latitude, lat - delta, lat + delta),
    between(establishments.longitude, lng - delta, lng + delta),
    sql`${establishments.reports} < 10`,
  ];

  if (tpValues.length > 0) {
    conditions.push(inArray(establishments.tpUnidade, tpValues));
  }

  const rows = await db
    .select()
    .from(establishments)
    .where(and(...conditions));

  const maxDistKm = 20;

  return rows
    .map((row) => ({
      ...mapRow(row),
      distance: haversine(
        { lat, lng },
        { lat: row.latitude!, lng: row.longitude! }
      ),
    }))
    .filter((r) => r.distance <= maxDistKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

function mapRow(row: typeof establishments.$inferSelect) {
  return {
    id: row.id,
    coCnes: row.coCnes,
    noFantasia: row.noFantasia,
    noRazaoSocial: row.noRazaoSocial,
    noLogradouro: row.noLogradouro,
    nuEndereco: row.nuEndereco,
    noBairro: row.noBairro,
    coCep: row.coCep,
    cidade: row.cidade,
    uf: row.uf,
    latitude: row.latitude,
    longitude: row.longitude,
    nuTelefone: row.nuTelefone ?? "Não informado",
    dsTurnoAtendimento: row.dsTurnoAtendimento ?? "Não informado",
    tpUnidade: row.tpUnidade,
  };
}
