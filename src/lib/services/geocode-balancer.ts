import type { Coordinates } from "@/types";
import { geocodeFromCep, geocodeFromAddress } from "./opencage";
import { geocodeNominatim } from "./nominatim";
import { geocodeLocationIQ } from "./locationiq";

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
    // CEP: OpenCage first (most accurate for Brazilian CEPs), then fallbacks
    const opencageResult = await geocodeFromCep(query, apiKey);
    if (opencageResult.coords) {
      setCache(cacheKey, opencageResult.coords);
      return opencageResult;
    }

    const nominatimResult = await geocodeNominatim(query + ", Brazil");
    if (nominatimResult.coords) {
      setCache(cacheKey, nominatimResult.coords);
      return nominatimResult;
    }

    const locationiqResult = await geocodeLocationIQ(query + ", Brazil");
    if (locationiqResult.coords) {
      setCache(cacheKey, locationiqResult.coords);
      return locationiqResult;
    }
  } else {
    // Address: rotate between services for load balancing
    const providers = [
      () => geocodeFromAddress(query, apiKey),
      () => geocodeNominatim(query),
      () => geocodeLocationIQ(query),
    ];

    // Shuffle for load distribution on address queries
    for (let i = providers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [providers[i], providers[j]] = [providers[j], providers[i]];
    }

    for (const provider of providers) {
      const result = await provider();
      if (result.coords) {
        setCache(cacheKey, result.coords);
        return result;
      }
    }
  }

  return { coords: null, error: "Nenhum serviço de geocodificação retornou resultado." };
}
