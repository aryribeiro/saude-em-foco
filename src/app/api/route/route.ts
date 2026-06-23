import { NextRequest, NextResponse } from "next/server";
import { getRoute } from "@/lib/services/openroute";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { route: null, error: "Chave da API não configurada." },
      { status: 500 }
    );
  }

  if (!from || !to) {
    return NextResponse.json(
      { route: null, error: "Parâmetros from e to são obrigatórios (lat,lng)." },
      { status: 400 }
    );
  }

  const [fromLat, fromLng] = from.split(",").map(Number);
  const [toLat, toLng] = to.split(",").map(Number);

  if ([fromLat, fromLng, toLat, toLng].some(isNaN)) {
    return NextResponse.json(
      { route: null, error: "Coordenadas inválidas." },
      { status: 400 }
    );
  }

  const result = await getRoute(
    { lat: fromLat, lng: fromLng },
    { lat: toLat, lng: toLng },
    apiKey
  );

  return NextResponse.json(result);
}
