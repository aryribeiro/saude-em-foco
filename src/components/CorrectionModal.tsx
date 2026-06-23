"use client";

import { useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/types";
import L from "leaflet";

interface CorrectionModalProps {
  estCoords: Coordinates;
  userCoords: Coordinates;
  estName: string;
  coCnes: string;
  onSave: (coords: Coordinates) => void;
  onCancel: () => void;
}

export default function CorrectionModal({
  estCoords,
  userCoords,
  estName,
  coCnes,
  onSave,
  onCancel,
}: CorrectionModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [newCoords, setNewCoords] = useState<Coordinates | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView(
      [estCoords.lat, estCoords.lng],
      16
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

    const estIcon = L.divIcon({
      html: '<i class="fa-solid fa-plus" style="color: #dc2626; font-size: 20px;"></i>',
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

    const marker = L.marker([estCoords.lat, estCoords.lng], {
      icon: estIcon,
      draggable: true,
    })
      .addTo(map)
      .bindTooltip(`${estName} - Arraste para corrigir`)
      .bindPopup("Arraste este marcador para a localização correta");

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setNewCoords({ lat: pos.lat, lng: pos.lng });
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setNewCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      map.remove();
    };
  }, [estCoords, userCoords, estName]);

  async function handleSave() {
    if (!newCoords) return;
    setSaving(true);
    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coCnes,
          latitude: newCoords.lat,
          longitude: newCoords.lng,
        }),
      });
      if (res.ok) {
        onSave(newCoords);
      } else {
        alert("Erro ao salvar correção.");
      }
    } catch {
      alert("Erro de conexão ao salvar correção.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="coord-correction">
      <h3 className="text-lg font-semibold mb-2">Corrigir Localização</h3>
      <p className="text-sm mb-3">
        Clique no mapa ou arraste o marcador vermelho para a localização correta
        do estabelecimento.
      </p>
      <div ref={mapRef} style={{ height: "500px", width: "100%" }} />
      {newCoords && (
        <p className="mt-2 text-sm text-green-700">
          Nova localização: {newCoords.lat.toFixed(6)}, {newCoords.lng.toFixed(6)}
        </p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={!newCoords || saving}
          className="rounded-md bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar Correção"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md bg-gray-400 px-4 py-2 text-white font-medium hover:bg-gray-500"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
