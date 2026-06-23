import { NextRequest, NextResponse } from "next/server";
import { validateCep } from "@/lib/services/viacep";
import { cepSchema } from "@/lib/validators/cep";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawCep = searchParams.get("q") ?? "";

  const parsed = cepSchema.safeParse(rawCep);
  if (!parsed.success) {
    return NextResponse.json(
      { valid: false, error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const result = await validateCep(parsed.data);
  if (!result.valid) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}
