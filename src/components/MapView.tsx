"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Coordinates, RouteGeometry } from "@/types";

interface MapViewProps {
  userCoords: Coordinates;
  estCoords: Coordinates;
  estName: string;
  route: RouteGeometry | null;
}

export default function MapView({ userCoords, estCoords, estName, route }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current).setView([userCoords.lat, userCoords.lng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const userIcon = L.divIcon({
      html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;font-size:22px;">🏠</div>',
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
      .addTo(map)
      .bindTooltip("Você está aqui");

    const estIcon = L.divIcon({
      html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#dc2626;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"><span style="color:white;font-size:16px;font-weight:bold;">+</span></div>',
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker([estCoords.lat, estCoords.lng], { icon: estIcon })
      .addTo(map)
      .bindTooltip(estName);

    if (route && route.coordinates.length > 0) {
      L.polyline(route.coordinates, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
    }

    const bounds = L.latLngBounds([
      [userCoords.lat, userCoords.lng],
      [estCoords.lat, estCoords.lng],
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

    setTimeout(() => map.invalidateSize(), 200);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [userCoords.lat, userCoords.lng, estCoords.lat, estCoords.lng, estName, route]);

  return (
    <div className="mt-4 rounded-lg border border-gray-300 shadow-sm" style={{ height: "450px", width: "100%", overflow: "hidden" }}>
      <div ref={containerRef} id="leaflet-map" style={{ height: "450px", width: "100%", position: "relative" }} />
    </div>
  );
}
