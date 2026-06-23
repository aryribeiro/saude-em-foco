import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { coordinateCorrections, establishments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const correctionSchema = z.object({
  coCnes: z.string().min(1),
  latitude: z.number().min(-33).max(5),
  longitude: z.number().min(-74).max(-34),
});

export async function GET(request: NextRequest) {
  const db = getDb();
  const searchParams = request.nextUrl.searchParams;
  const cnes = searchParams.get("cnes");

  if (cnes) {
    const rows = await db
      .select()
      .from(coordinateCorrections)
      .where(eq(coordinateCorrections.coCnes, cnes));
    return NextResponse.json({ correction: rows[0] ?? null });
  }

  const all = await db.select().from(coordinateCorrections);
  return NextResponse.json({ corrections: all });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  try {
    const body = await request.json();
    const parsed = correctionSchema.parse(body);

    await db
      .insert(coordinateCorrections)
      .values({
        coCnes: parsed.coCnes,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        source: "user",
      })
      .onConflictDoUpdate({
        target: coordinateCorrections.coCnes,
        set: {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          source: "user",
        },
      });

    await getDb()
      .update(establishments)
      .set({
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        hasCoords: 1,
      })
      .where(eq(establishments.coCnes, parsed.coCnes));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Erro ao salvar correção." },
      { status: 500 }
    );
  }
}
