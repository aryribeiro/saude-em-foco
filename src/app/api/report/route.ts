import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { establishments, reportLogs } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const MAX_REPORTS = 10;
const RATE_LIMIT_REPORTS = 5;
const RATE_LIMIT_HOURS = 24;

async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value + (process.env.REPORT_SALT ?? "saude-em-foco-salt"));
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const db = getDb();

  let body: { coCnes: string; deviceFingerprint: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { coCnes, deviceFingerprint } = body;

  if (!coCnes || !deviceFingerprint || deviceFingerprint.length < 8) {
    return NextResponse.json(
      { error: "Dados insuficientes." },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  const ipHash = await hashValue(ip);
  const deviceHash = await hashValue(deviceFingerprint);

  // Check if this IP+device already reported this establishment
  const existing = await db
    .select()
    .from(reportLogs)
    .where(
      and(
        eq(reportLogs.coCnes, coCnes),
        eq(reportLogs.ipHash, ipHash),
        eq(reportLogs.deviceHash, deviceHash)
      )
    );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Você já registrou uma reclamação para este estabelecimento." },
      { status: 429 }
    );
  }

  // Rate limit: max 5 reports per 24h from same IP+device
  const cutoff = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000).toISOString();
  const recentReports = await db
    .select()
    .from(reportLogs)
    .where(
      and(
        eq(reportLogs.ipHash, ipHash),
        eq(reportLogs.deviceHash, deviceHash),
        sql`${reportLogs.createdAt} > ${cutoff}`
      )
    );

  if (recentReports.length >= RATE_LIMIT_REPORTS) {
    return NextResponse.json(
      { error: "Limite de 5 reclamações em 24 horas atingido. Tente novamente amanhã." },
      { status: 429 }
    );
  }

  // Get current report count
  const estRow = await db
    .select({ reports: establishments.reports })
    .from(establishments)
    .where(eq(establishments.coCnes, coCnes))
    .limit(1);

  if (!estRow || estRow.length === 0) {
    return NextResponse.json(
      { error: "Estabelecimento não encontrado." },
      { status: 404 }
    );
  }

  const currentReports = estRow[0].reports ?? 0;
  if (currentReports >= MAX_REPORTS) {
    return NextResponse.json(
      { error: "Este estabelecimento já atingiu o limite de reclamações." },
      { status: 409 }
    );
  }

  // Insert report log
  await db.insert(reportLogs).values({
    coCnes,
    ipHash,
    deviceHash,
    createdAt: new Date().toISOString(),
  });

  // Increment reports counter
  await db.run(
    sql`UPDATE establishments SET reports = reports + 1 WHERE co_cnes = ${coCnes}`
  );

  const newCount = currentReports + 1;

  return NextResponse.json({
    success: true,
    reports: newCount,
    hidden: newCount >= MAX_REPORTS,
  });
}
