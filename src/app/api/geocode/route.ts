import { NextRequest, NextResponse } from "next/server";
import { geocodeFromCep, geocodeFromAddress } from "@/lib/services/opencage";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cep = searchParams.get("cep");
  const address = searchParams.get("address");
  const apiKey = process.env.OPENCAGE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { coords: null, error: "Chave da API não configurada." },
      { status: 500 }
    );
  }

  if (cep) {
    const result = await geocodeFromCep(cep, apiKey);
    if (result.coords) return NextResponse.json(result);

    if (address) {
      const fallback = await geocodeFromAddress(address, apiKey);
      return NextResponse.json(fallback);
    }

    return NextResponse.json(result);
  }

  if (address) {
    const result = await geocodeFromAddress(address, apiKey);
    return NextResponse.json(result);
  }

  return NextResponse.json(
    { coords: null, error: "Informe cep ou address." },
    { status: 400 }
  );
}
