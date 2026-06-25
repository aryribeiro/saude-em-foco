import type { Coordinates } from "@/types";
import { geocodeFromAddress } from "./opencage";
import { geocodeGeoapify } from "./geoapify";

type GeoResult = { coords: Coordinates | null; error: string | null };

const cache = new Map<string, { coords: Coordinates; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60;

function getCached(key: string): Coordinates | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.coords;
}

function setCache(key: string, coords: Coordinates) {
  if (cache.size > 5000) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { coords, ts: Date.now() });
}

export async function geocodeBalanced(
  query: string,
  apiKey: string
): Promise<GeoResult> {
  const cacheKey = query.toLowerCase().trim();

  const cached = getCached(cacheKey);
  if (cached) return { coords: cached, error: null };

  // OpenCage with full address (CEP alone doesn't work for Brazil)
  const opencageResult = await geocodeFromAddress(query, apiKey);
  if (opencageResult.coords) {
    setCache(cacheKey, opencageResult.coords);
    return opencageResult;
  }

  const geoapifyKey = process.env.GEOAPIFY_API_KEY;
  if (geoapifyKey) {
    const geoapifyResult = await geocodeGeoapify(query, geoapifyKey);
    if (geoapifyResult.coords) {
      setCache(cacheKey, geoapifyResult.coords);
      return geoapifyResult;
    }
  }

  return { coords: null, error: "Não foi possível geocodificar o endereço." };
}
