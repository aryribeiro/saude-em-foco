import { fetchWithTimeout } from "@/lib/utils/retry";
import type { Coordinates } from "@/types";

export async function geocodeNominatim(
  query: string
): Promise<{ coords: Coordinates | null; error: string | null }> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=br&format=json&limit=1`;
    const res = await fetchWithTimeout(url, {
      timeoutMs: 10000,
      headers: {
        "User-Agent": "SaudeEmFoco/1.0 (health-facility-finder)",
      },
    });
    if (!res.ok) return { coords: null, error: `Nominatim HTTP ${res.status}` };

    const data = await res.json();
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { coords: { lat, lng }, error: null };
      }
    }
    return { coords: null, error: "Nenhum resultado Nominatim." };
  } catch {
    return { coords: null, error: "Erro de conexão Nominatim." };
  }
}
