"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const estMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return;

    const L = await import("leaflet");
    leafletRef.current = L;

    // Fix default icon paths for bundler environments
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)["_getIconUrl"];
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(containerRef.current, {
      center: [userCoords.lat, userCoords.lng],
      zoom: 14,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Force resize after mount to fix grey tiles
    setTimeout(() => map.invalidateSize(), 100);

    updateMarkers(L);
    updateRoute(L);
  }, []);

  const updateMarkers = useCallback((L?: typeof import("leaflet")) => {
    const lib = L || leafletRef.current;
    const map = mapRef.current;
    if (!lib || !map) return;

    const userIcon = lib.divIcon({
      html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;"><i class="fa-solid fa-house" style="color:#2563eb;font-size:18px;"></i></div>',
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const estIcon = lib.divIcon({
      html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#dc2626;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"><i class="fa-solid fa-plus" style="color:white;font-size:14px;"></i></div>',
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // User marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    userMarkerRef.current = lib
      .marker([userCoords.lat, userCoords.lng], { icon: userIcon })
      .addTo(map)
      .bindTooltip("Você está aqui");

    // Establishment marker
    if (estMarkerRef.current) {
      estMarkerRef.current.remove();
    }
    estMarkerRef.current = lib
      .marker([estCoords.lat, estCoords.lng], { icon: estIcon })
      .addTo(map)
      .bindTooltip(estName);

    // Fit bounds
    const bounds = lib.latLngBounds([
      [userCoords.lat, userCoords.lng],
      [estCoords.lat, estCoords.lng],
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
  }, [userCoords, estCoords, estName]);

  const updateRoute = useCallback((L?: typeof import("leaflet")) => {
    const lib = L || leafletRef.current;
    const map = mapRef.current;
    if (!lib || !map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (route && route.coordinates.length > 0) {
      routeLineRef.current = lib
        .polyline(route.coordinates, {
          color: "#2563eb",
          weight: 4,
          opacity: 0.8,
        })
        .addTo(map);
    }
  }, [route]);

  // Initialize map once
  useEffect(() => {
    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
        estMarkerRef.current = null;
        routeLineRef.current = null;
        leafletRef.current = null;
      }
    };
  }, [initMap]);

  // Update markers when coords/name change
  useEffect(() => {
    if (mapRef.current && leafletRef.current) {
      updateMarkers();
    }
  }, [updateMarkers]);

  // Update route
  useEffect(() => {
    if (mapRef.current && leafletRef.current) {
      updateRoute();
    }
  }, [updateRoute]);

  return (
    <div className="mt-4 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
      <div ref={containerRef} style={{ height: "450px", width: "100%", zIndex: 0 }} />
    </div>
  );
}
