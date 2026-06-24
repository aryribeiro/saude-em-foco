"use client";

import { useEffect, useRef, useState } from "react";
import type { Coordinates, RouteGeometry } from "@/types";

interface MapViewProps {
  userCoords: Coordinates;
  estCoords: Coordinates;
  estName: string;
  route: RouteGeometry | null;
}

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

function waitForLeaflet(): Promise<typeof import("leaflet")> {
  return new Promise((resolve) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    const interval = setInterval(() => {
      if (window.L) {
        clearInterval(interval);
        resolve(window.L);
      }
    }, 50);
  });
}

export default function MapView({ userCoords, estCoords, estName, route }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    waitForLeaflet().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const L = window.L;

    const map = L.map(containerRef.current, {
      center: [userCoords.lat, userCoords.lng],
      zoom: 14,
    });

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
  }, [ready, userCoords.lat, userCoords.lng, estCoords.lat, estCoords.lng, estName, route]);

  return (
    <div className="mt-4 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
      <div ref={containerRef} style={{ height: "450px", width: "100%" }} />
    </div>
  );
}
