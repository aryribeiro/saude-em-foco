"use client";

import dynamic from "next/dynamic";
import type { Coordinates, RouteGeometry } from "@/types";

const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div className="mt-4 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
      <div style={{ height: "450px", width: "100%" }} className="flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    </div>
  ),
});

interface MapViewProps {
  userCoords: Coordinates;
  estCoords: Coordinates;
  estName: string;
  route: RouteGeometry | null;
}

export default function MapView({ userCoords, estCoords, estName, route }: MapViewProps) {
  return (
    <div className="mt-4 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
      <MapContent
        userCoords={userCoords}
        estCoords={estCoords}
        estName={estName}
        route={route}
      />
    </div>
  );
}
