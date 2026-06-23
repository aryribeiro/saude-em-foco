"use client";

import type { Establishment } from "@/types";

interface EstablishmentListProps {
  establishments: Establishment[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function EstablishmentList({
  establishments,
  selectedIndex,
  onSelect,
}: EstablishmentListProps) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">
        Estabelecimentos de Saúde Próximos
      </h3>
      <p className="text-sm text-gray-600 mb-3">Selecione um estabelecimento:</p>
      <div className="flex flex-col gap-1">
        {establishments.map((est, idx) => (
          <label
            key={est.coCnes}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
              idx === selectedIndex
                ? "bg-blue-50 border border-blue-300"
                : "hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="establishment"
              checked={idx === selectedIndex}
              onChange={() => onSelect(idx)}
              className="accent-red-600"
            />
            <span className="text-sm">
              {idx + 1}. {est.noFantasia}{" "}
              {est.distance !== undefined && (
                <span className="text-gray-500">
                  ({est.distance.toFixed(2)} km)
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
