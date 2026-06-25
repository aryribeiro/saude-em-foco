import { callWithBackoff, fetchWithTimeout } from "@/lib/utils/retry";
import type { Coordinates } from "@/types";
import { z } from "zod";

const opencageResultSchema = z.object({
  results: z.array(
    z.object({
      geometry: z.object({ lat: z.number(), lng: z.number() }),
      components: z.object({ country_code: z.string().optional() }).passthrough(),
    })
  ),
});

export async function geocodeFromCep(
  cep: string,
  apiKey: string
): Promise<{ coords: Coordinates | null; error: string | null }> {
  const digits = cep.replace(/\D/g, "");
  const formatted = `${digits.slice(0, 5)}-${digits.slice(5)}, Brazil`;
  return geocode(formatted, apiKey);
}

export async function geocodeFromAddress(
  address: string,
  apiKey: string
): Promise<{ coords: Coordinates | null; error: string | null }> {
  return geocode(address, apiKey);
}

async function geocode(
  query: string,
  apiKey: string
): Promise<{ coords: Coordinates | null; error: string | null }> {
  try {
    const data = await callWithBackoff(
      async () => {
        const url = `https://api.opencagedata.com/geocode/v1/json?key=${apiKey}&q=${encodeURIComponent(query)}&countrycode=br`;
        const res = await fetchWithTimeout(url, { timeoutMs: 15000 });
        if (!res.ok) throw new Error(`OpenCage HTTP ${res.status}`);
        return res.json();
      },
      { maxAttempts: 3, retryOn: isTransient }
    );

    const parsed = opencageResultSchema.parse(data);
    for (const result of parsed.results) {
      if (result.components.country_code?.toLowerCase() === "br") {
        return {
          coords: { lat: result.geometry.lat, lng: result.geometry.lng },
          error: null,
        };
      }
    }

    return { coords: null, error: "Nenhum resultado encontrado no Brasil." };
  } catch {
    return { coords: null, error: "Erro de conexão com a API OpenCage." };
  }
}

function isTransient(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") return true;
  return true;
}
