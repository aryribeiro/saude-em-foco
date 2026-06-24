import { NextRequest, NextResponse } from "next/server";
import { geocodeBalanced } from "@/lib/services/geocode-balancer";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cep = searchParams.get("cep");
  const address = searchParams.get("address");
  const apiKey = process.env.OPENCAGE_API_KEY ?? "";

  if (cep) {
    const result = await geocodeBalanced(cep, apiKey);
    if (result.coords) return NextResponse.json(result);

    if (address) {
      const fallback = await geocodeBalanced(address, apiKey);
      return NextResponse.json(fallback);
    }

    return NextResponse.json(result);
  }

  if (address) {
    const result = await geocodeBalanced(address, apiKey);
    return NextResponse.json(result);
  }

  return NextResponse.json(
    { coords: null, error: "Informe cep ou address." },
    { status: 400 }
  );
}
