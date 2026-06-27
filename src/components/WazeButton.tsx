"use client";

import { useState } from "react";

interface WazeButtonProps {
  lat: number;
  lng: number;
}

export default function WazeButton({ lat, lng }: WazeButtonProps) {
  const [copied, setCopied] = useState(false);
  const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(wazeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Erro ao copiar. Copie manualmente: " + wazeUrl);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <a
        href={wazeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-600 font-medium underline hover:text-red-800"
      >
        Abrir no Waze
      </a>
      <button
        onClick={handleCopy}
        className="rounded-md bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 w-fit"
      >
        {copied ? "Link copiado!" : "Copiar Link do Waze"}
      </button>
    </div>
  );
}
