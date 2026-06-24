import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { establishments } from "@/lib/db/schema";
import { and, between, eq, inArray, sql } from "drizzle-orm";
import { haversine } from "@/lib/validators/coordinates";

export const dynamic = "force-dynamic";

const TYPE_MAP: Record<string, number[]> = {
  postos: [1, 2],
  hospitais: [5, 7, 15],
  farmacias: [71],
  odontologia: [36],
  laboratorios: [4],
  clinicas: [36],
};

export async function GET(request: NextRequest) {
  const db = getDb();
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);
  const city = searchParams.get("city");
  const types = searchParams.get("types");

  if (city) {
    const rows = await db
      .select()
      .from(establishments)
      .where(
        and(
          eq(establishments.hasCoords, 0),
          sql`UPPER(${establishments.cidade}) = UPPER(${city})`
        )
      )
      .limit(20);

    return NextResponse.json({
      establishments: rows.map(mapRow),
      type: "without_coords",
    });
  }

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Parâmetros lat e lng são obrigatórios." },
      { status: 400 }
    );
  }

  // Parse types filter
  const tpValues = parseTypes(types);

  // First try within 1km (DELTA ~0.009 degrees)
  let results = await searchByRadius(db, lat, lng, 0.009, tpValues, limit);

  // If not enough results within 1km, expand to 15km (DELTA ~0.135 degrees)
  if (results.length === 0) {
    results = await searchByRadius(db, lat, lng, 0.135, tpValues, limit);
  }

  return NextResponse.json({
    establishments: results,
    type: "with_coords",
  });
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
    eq(establishments.hasCoords, 1),
    between(establishments.latitude, lat - delta, lat + delta),
    between(establishments.longitude, lng - delta, lng + delta),
  ];

  if (tpValues.length > 0) {
    conditions.push(inArray(establishments.tpUnidade, tpValues));
  }

  const rows = await db
    .select()
    .from(establishments)
    .where(and(...conditions));

  const maxDistKm = delta === 0.009 ? 1 : 15;

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
    hasCoords: row.hasCoords === 1,
  };
}
