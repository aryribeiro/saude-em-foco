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
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: unknown = null;

    import("leaflet").then((L) => {
      if (!containerRef.current) return;

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

      // User marker
      const userIcon = L.divIcon({
        html: '<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;"><span style="color:#2563eb;font-size:20px;">🏠</span></div>',
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .addTo(m)
        .bindTooltip("Você está aqui");

      // Establishment marker
      const estIcon = L.divIcon({
        html: '<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;background:#dc2626;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"><span style="color:white;font-size:14px;font-weight:bold;">+</span></div>',
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      L.marker([estCoords.lat, estCoords.lng], { icon: estIcon })
        .addTo(m)
        .bindTooltip(estName);

      // Route polyline
      if (route && route.coordinates.length > 0) {
        L.polyline(route.coordinates, {
          color: "#2563eb",
          weight: 4,
          opacity: 0.8,
        }).addTo(m);
      }

      // Fit bounds
      const bounds = L.latLngBounds([
        [userCoords.lat, userCoords.lng],
        [estCoords.lat, estCoords.lng],
      ]);
      m.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

      setTimeout(() => m.invalidateSize(), 200);

      map = m;
      mapRef.current = m;
    });

    return () => {
      if (map && typeof (map as { remove: () => void }).remove === "function") {
        (map as { remove: () => void }).remove();
      }
      mapRef.current = null;
    };
  }, [userCoords.lat, userCoords.lng, estCoords.lat, estCoords.lng, estName, route]);

  return (
    <div className="mt-4 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
      <div ref={containerRef} style={{ height: "450px", width: "100%" }} />
    </div>
  );
}
