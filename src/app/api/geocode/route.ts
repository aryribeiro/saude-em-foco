import { NextRequest, NextResponse } from "next/server";
import { geocodeBalanced } from "@/lib/services/geocode-balancer";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");
  const apiKey = process.env.OPENCAGE_API_KEY ?? "";

  if (!address) {
    return NextResponse.json(
      { coords: null, error: "Informe o endereço." },
      { status: 400 }
    );
  }

  const result = await geocodeBalanced(address, apiKey);
  return NextResponse.json(result);
}
