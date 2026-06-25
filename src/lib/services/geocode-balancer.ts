import type { Coordinates } from "@/types";
import { geocodeFromCep, geocodeFromAddress } from "./opencage";

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
  const cacheKey = query.replace(/\D/g, "") || query.toLowerCase().trim();

  const cached = getCached(cacheKey);
  if (cached) return { coords: cached, error: null };

  const isCep = /^\d{5}-?\d{3}$/.test(query.trim());

  if (isCep) {
    const result = await geocodeFromCep(query, apiKey);
    if (result.coords) {
      setCache(cacheKey, result.coords);
      return result;
    }
  }

  const result = await geocodeFromAddress(query, apiKey);
  if (result.coords) {
    setCache(cacheKey, result.coords);
    return result;
  }

  return { coords: null, error: "Não foi possível geocodificar o endereço." };
}
