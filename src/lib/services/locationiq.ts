import { fetchWithTimeout } from "@/lib/utils/retry";
import type { Coordinates } from "@/types";

export async function geocodeLocationIQ(
  query: string
): Promise<{ coords: Coordinates | null; error: string | null }> {
  try {
    const url = `https://us1.locationiq.com/v1/search?q=${encodeURIComponent(query)}&countrycodes=br&format=json&limit=1&key=pk.0`;
    const res = await fetchWithTimeout(url, { timeoutMs: 10000 });
    if (!res.ok) return { coords: null, error: `LocationIQ HTTP ${res.status}` };

    const data = await res.json();
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { coords: { lat, lng }, error: null };
      }
    }
    return { coords: null, error: "Nenhum resultado LocationIQ." };
  } catch {
    return { coords: null, error: "Erro de conexão LocationIQ." };
  }
}
