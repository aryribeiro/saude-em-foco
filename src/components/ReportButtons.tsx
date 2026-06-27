"use client";

import { useState, useCallback } from "react";

interface ReportButtonsProps {
  coCnes: string;
}

function getDeviceFingerprint(): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("fp", 2, 2);
  }
  const canvasData = canvas.toDataURL();

  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth.toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvasData.slice(-50),
  ];

  return parts.join("|");
}

export default function ReportButtons({ coCnes }: ReportButtonsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [okEnabled, setOkEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openLightbox = useCallback(() => {
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setOkEnabled(true);
  }, []);

  const handleReport = useCallback(async () => {
    if (!okEnabled || loading || done) return;

    setLoading(true);
    setError(null);

    try {
      const fingerprint = getDeviceFingerprint();
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coCnes, deviceFingerprint: fingerprint }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDone(true);
      } else {
        setError(data.error ?? "Erro ao registrar.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [coCnes, okEnabled, loading, done]);

  return (
    <>
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-sm text-gray-600 italic">O local não existe?</span>
        <button
          onClick={openLightbox}
          className="rounded-md border-2 border-red-600 px-3 py-1.5 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
        >
          Preciso de Ajuda
        </button>
        <button
          onClick={handleReport}
          disabled={!okEnabled || loading || done}
          className={`rounded-md px-4 py-1.5 font-semibold text-sm text-white transition-colors flex items-center gap-2 ${
            okEnabled && !done
              ? "bg-red-600 hover:bg-red-700 cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading && (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          OK
        </button>
      </div>

      {done && (
        <p className="text-sm text-green-600 font-medium text-right mt-1">
          Obrigado pelo registro!
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500 text-right mt-1">{error}</p>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
          onClick={closeLightbox}
        >
          <div
            className="bg-white rounded-lg p-6 mx-4 max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-800 text-sm leading-relaxed">
              Infelizmente, alguns dados fornecidos pelo governo federal (DataSUS)
              usados em nosso web app, apontam para estabelecimentos que não existem
              mais ou estabelecimentos com coordenadas erradas.
            </p>
            <p className="text-gray-800 text-sm leading-relaxed mt-3">
              Para registrar sua reclamação de um local que está desativado a muitos
              anos ou que não existe no endereço indicado pelo web app, feche esse
              aviso e clique no botão vermelho{" "}
              <strong>OK</strong> que a partir de agora estará ativo para registro
              de reclamações.
            </p>
            <button
              onClick={closeLightbox}
              className="mt-5 w-full rounded-md bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
