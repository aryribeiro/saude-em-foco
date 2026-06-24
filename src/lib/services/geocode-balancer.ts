import type { Coordinates } from "@/types";
import { geocodeFromCep, geocodeFromAddress } from "./opencage";
import { geocodeNominatim } from "./nominatim";
import { geocodeLocationIQ } from "./locationiq";

type GeoResult = { coords: Coordinates | null; error: string | null };
type GeoProvider = (query: string) => Promise<GeoResult>;

const cache = new Map<string, { coords: Coordinates; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

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

function buildProviders(apiKey: string): GeoProvider[] {
  const opencage: GeoProvider = async (query) => {
    if (query.match(/^\d{5}-?\d{3}$/)) {
      return geocodeFromCep(query, apiKey);
    }
    return geocodeFromAddress(query, apiKey);
  };

  const nominatim: GeoProvider = async (query) => {
    return geocodeNominatim(query);
  };

  const locationiq: GeoProvider = async (query) => {
    return geocodeLocationIQ(query);
  };

  return [opencage, nominatim, locationiq];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function geocodeBalanced(
  query: string,
  apiKey: string
): Promise<GeoResult> {
  const cacheKey = query.replace(/\D/g, "") || query.toLowerCase().trim();

  const cached = getCached(cacheKey);
  if (cached) return { coords: cached, error: null };

  const providers = shuffle(buildProviders(apiKey));

  for (const provider of providers) {
    const result = await provider(query);
    if (result.coords) {
      setCache(cacheKey, result.coords);
      return result;
    }
  }

  return { coords: null, error: "Nenhum serviço de geocodificação retornou resultado." };
}
