"use client";

import { useEffect, useRef } from "react";
import type { Coordinates, RouteGeometry } from "@/types";
import L from "leaflet";

interface MapViewProps {
  userCoords: Coordinates;
  estCoords: Coordinates;
  estName: string;
  route: RouteGeometry | null;
  confidence: number;
}

export default function MapView({
  userCoords,
  estCoords,
  estName,
  route,
  confidence,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView(
      [userCoords.lat, userCoords.lng],
      13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const userIcon = L.divIcon({
      html: '<i class="fa-solid fa-house" style="color: #2563eb; font-size: 20px;"></i>',
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

    L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
      .addTo(map)
      .bindTooltip("Você está aqui");

    const markerColor =
      confidence < 40 ? "#6b7280" : confidence < 70 ? "#f97316" : "#dc2626";

    const estIcon = L.divIcon({
      html: `<i class="fa-solid fa-plus" style="color: ${markerColor}; font-size: 20px;"></i>`,
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

    L.marker([estCoords.lat, estCoords.lng], { icon: estIcon })
      .addTo(map)
      .bindTooltip(estName)
      .bindPopup(`${estName}<br>Confiança: ${confidence.toFixed(0)}%`);

    if (confidence < 60) {
      L.circle([estCoords.lat, estCoords.lng], {
        radius: 300,
        color: "orange",
        fillOpacity: 0.2,
      })
        .addTo(map)
        .bindTooltip("Área aproximada - A localização exata pode variar");
    }

    if (route) {
      L.polyline(route.coordinates, {
        color: "blue",
        weight: 2.5,
        opacity: 0.8,
      }).addTo(map);

      const bounds = L.latLngBounds([
        [userCoords.lat, userCoords.lng],
        [estCoords.lat, estCoords.lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [userCoords, estCoords, estName, route, confidence]);

  return (
    <div className="map-section">
      <div ref={mapRef} style={{ height: "500px", width: "100%" }} />
    </div>
  );
}
