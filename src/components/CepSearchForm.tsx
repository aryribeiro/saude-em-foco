"use client";

import { useState } from "react";

interface CepSearchFormProps {
  onSearch: (cep: string) => void;
  onClear: () => void;
  loading: boolean;
}

export default function CepSearchForm({
  onSearch,
  onClear,
  loading,
}: CepSearchFormProps) {
  const [cep, setCep] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cep.trim()) onSearch(cep.trim());
  }

  function handleClear() {
    setCep("");
    onClear();
  }

  return (
    <div className="bg-white p-5 text-center text-black">
      <p className="mb-4 text-base">
        Digite seu CEP abaixo e seja guiado gratuitamente até o estabelecimento
        de saúde mais próximo.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
        <input
          type="text"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          placeholder="Digite um CEP válido (ex: 20210150)"
          className="w-full max-w-md rounded-md border border-gray-300 px-4 py-2.5 text-base outline-none focus:border-blue-500"
          maxLength={9}
          disabled={loading}
          autoComplete="off"
          name="cep-search"
        />
        <button
          type="submit"
          disabled={loading || !cep.trim()}
          className="rounded-md bg-red-600 px-6 py-2.5 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>
      <button
        onClick={handleClear}
        className="mt-3 text-sm text-gray-600 underline hover:text-gray-800"
      >
        Limpar / Nova Busca
      </button>
    </div>
  );
}
