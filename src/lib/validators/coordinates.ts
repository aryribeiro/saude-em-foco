import { z } from "zod";
import type { Coordinates } from "@/types";

export const coordinatesSchema = z.object({
  lat: z.number().min(-33.0).max(5.0),
  lng: z.number().min(-74.0).max(-34.0),
});

export function isRoutable(from: Coordinates, to: Coordinates): boolean {
  const validFrom =
    from.lat >= -33.0 &&
    from.lat <= 5.0 &&
    from.lng >= -74.0 &&
    from.lng <= -34.0;
  const validTo =
    to.lat >= -33.0 &&
    to.lat <= 5.0 &&
    to.lng >= -74.0 &&
    to.lng <= -34.0;

  if (!validFrom || !validTo) return false;

  const distance = haversine(from, to);
  return distance <= 100;
}

export function haversine(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
