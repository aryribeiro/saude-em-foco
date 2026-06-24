"use client";

import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates, RouteGeometry } from "@/types";

interface MapContentProps {
  userCoords: Coordinates;
  estCoords: Coordinates;
  estName: string;
  route: RouteGeometry | null;
}

const userIcon = L.divIcon({
  html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;font-size:22px;">🏠</div>',
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const estIcon = L.divIcon({
  html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#dc2626;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"><span style="color:white;font-size:16px;font-weight:bold;">+</span></div>',
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function FitBounds({ userCoords, estCoords }: { userCoords: Coordinates; estCoords: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([
      [userCoords.lat, userCoords.lng],
      [estCoords.lat, estCoords.lng],
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    setTimeout(() => map.invalidateSize(), 200);
  }, [map, userCoords.lat, userCoords.lng, estCoords.lat, estCoords.lng]);

  return null;
}

export default function MapContent({ userCoords, estCoords, estName, route }: MapContentProps) {
  return (
    <MapContainer
      center={[userCoords.lat, userCoords.lng]}
      zoom={14}
      style={{ height: "450px", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
        <Tooltip>Você está aqui</Tooltip>
      </Marker>

      <Marker position={[estCoords.lat, estCoords.lng]} icon={estIcon}>
        <Tooltip>{estName}</Tooltip>
      </Marker>

      {route && route.coordinates.length > 0 && (
        <Polyline
          positions={route.coordinates}
          pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.8 }}
        />
      )}

      <FitBounds userCoords={userCoords} estCoords={estCoords} />
    </MapContainer>
  );
}
