import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { establishments } from "@/lib/db/schema";
import { and, between, eq, sql } from "drizzle-orm";
import { haversine } from "@/lib/validators/coordinates";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const db = getDb();
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const limit = parseInt(searchParams.get("limit") ?? "5", 10);
  const city = searchParams.get("city");

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

  const DELTA_LAT = 0.45;
  const DELTA_LNG = 0.55;

  const rows = await db
    .select()
    .from(establishments)
    .where(
      and(
        eq(establishments.hasCoords, 1),
        between(establishments.latitude, lat - DELTA_LAT, lat + DELTA_LAT),
        between(establishments.longitude, lng - DELTA_LNG, lng + DELTA_LNG)
      )
    );

  const withDistance = rows
    .map((row) => ({
      ...mapRow(row),
      distance: haversine(
        { lat, lng },
        { lat: row.latitude!, lng: row.longitude! }
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return NextResponse.json({
    establishments: withDistance,
    type: "with_coords",
  });
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
    hasCoords: row.hasCoords === 1,
  };
}
