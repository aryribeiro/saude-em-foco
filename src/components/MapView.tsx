"use client";

import { useEffect, useRef } from "react";
import type { Coordinates, RouteGeometry } from "@/types";

interface MapViewProps {
  userCoords: Coordinates;
  estCoords: Coordinates;
  estName: string;
  route: RouteGeometry | null;
}

export default function MapView({
  userCoords,
  estCoords,
  estName,
  route,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    (async () => {
      const mod = await import("leaflet");
      const L = mod.default ?? mod;

      if (cancelled || !containerRef.current) return;

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)[
        "_getIconUrl"
      ];
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const m = L.map(containerRef.current, {
        center: [userCoords.lat, userCoords.lng],
        zoom: 14,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(m);

      const userIcon = L.divIcon({
        html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;font-size:22px;">🏠</div>',
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .addTo(m)
        .bindTooltip("Você está aqui");

      const estIcon = L.divIcon({
        html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#dc2626;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"><span style="color:white;font-size:16px;font-weight:bold;">+</span></div>',
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker([estCoords.lat, estCoords.lng], { icon: estIcon })
        .addTo(m)
        .bindTooltip(estName);

      if (route && route.coordinates.length > 0) {
        L.polyline(route.coordinates, {
          color: "#2563eb",
          weight: 4,
          opacity: 0.8,
        }).addTo(m);
      }

      const bounds = L.latLngBounds([
        [userCoords.lat, userCoords.lng],
        [estCoords.lat, estCoords.lng],
      ]);
      m.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

      setTimeout(() => m.invalidateSize(), 200);

      mapRef.current = m;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [userCoords.lat, userCoords.lng, estCoords.lat, estCoords.lng, estName, route]);

  return (
    <div className="mt-4 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
      <div ref={containerRef} style={{ height: "450px", width: "100%" }} />
    </div>
  );
}
