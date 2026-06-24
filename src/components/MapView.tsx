"use client";

import { useEffect, useRef } from "react";
import type { Coordinates, RouteGeometry } from "@/types";
import L from "leaflet";

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

  const userIcon = L.divIcon({
    html: '<i class="fa-solid fa-house" style="color: #2563eb; font-size: 20px;"></i>',
    className: "custom-div-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  const estIcon = L.divIcon({
    html: '<i class="fa-solid fa-plus" style="color: #dc2626; font-size: 20px;"></i>',
    className: "custom-div-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [userCoords.lat, userCoords.lng],
      14
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      estMarkerRef.current = null;
      routeLineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers and view when coords change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // User marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
        icon: userIcon,
      })
        .addTo(map)
        .bindTooltip("Você está aqui");
    }

    // Establishment marker
    if (estMarkerRef.current) {
      estMarkerRef.current.setLatLng([estCoords.lat, estCoords.lng]);
      estMarkerRef.current.setTooltipContent(estName);
    } else {
      estMarkerRef.current = L.marker([estCoords.lat, estCoords.lng], {
        icon: estIcon,
      })
        .addTo(map)
        .bindTooltip(estName);
    }

    // Fit bounds to show both markers
    const bounds = L.latLngBounds([
      [userCoords.lat, userCoords.lng],
      [estCoords.lat, estCoords.lng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCoords.lat, userCoords.lng, estCoords.lat, estCoords.lng, estName]);

  // Update route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old route
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // Draw new route
    if (route) {
      routeLineRef.current = L.polyline(route.coordinates, {
        color: "blue",
        weight: 3,
        opacity: 0.8,
      }).addTo(map);
    }
  }, [route]);

  return (
    <div className="map-section">
      <div ref={containerRef} style={{ height: "500px", width: "100%" }} />
    </div>
  );
}
