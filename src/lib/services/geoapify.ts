import { fetchWithTimeout } from "@/lib/utils/retry";
import type { Coordinates } from "@/types";

export async function geocodeGeoapify(
  address: string,
  apiKey: string
): Promise<{ coords: Coordinates | null; error: string | null }> {
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&filter=countrycode:br&format=json&apiKey=${apiKey}`;
    const res = await fetchWithTimeout(url, { timeoutMs: 10000 });
    if (!res.ok) return { coords: null, error: `Geoapify HTTP ${res.status}` };

    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      if (result.lat && result.lon && result.rank?.confidence > 0.5) {
        return { coords: { lat: result.lat, lng: result.lon }, error: null };
      }
    }
    return { coords: null, error: "Nenhum resultado Geoapify." };
  } catch {
    return { coords: null, error: "Erro de conexão Geoapify." };
  }
}
