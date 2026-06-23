import { callWithBackoff, fetchWithTimeout } from "@/lib/utils/retry";
import type { Coordinates, RouteGeometry } from "@/types";

export async function getRoute(
  from: Coordinates,
  to: Coordinates,
  apiKey: string
): Promise<{ route: RouteGeometry | null; error: string | null }> {
  try {
    const data = await callWithBackoff(
      async () => {
        const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`;
        const res = await fetchWithTimeout(url, { timeoutMs: 15000 });
        if (!res.ok) throw new Error(`ORS HTTP ${res.status}`);
        return res.json();
      },
      { maxAttempts: 3, retryOn: isTransient }
    );

    if (data.features && data.features.length > 0) {
      const coords: [number, number][] =
        data.features[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number]
        );
      return { route: { coordinates: coords }, error: null };
    }

    return { route: null, error: "Não foi possível gerar a rota." };
  } catch {
    return { route: null, error: "Erro de conexão com o serviço de rotas." };
  }
}

function isTransient(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") return true;
  return true;
}
