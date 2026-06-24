"use client";

import { useState } from "react";

const ESTABLISHMENT_TYPES = [
  { key: "postos", label: "🩺 Postos de Saúde" },
  { key: "hospitais", label: "🏥 Hospitais Públicos" },
  { key: "farmacias", label: "💊 Farmácias Populares" },
  { key: "odontologia", label: "😷 Unidades Odontológicas" },
  { key: "laboratorios", label: "💉 Laboratórios" },
  { key: "clinicas", label: "👩🏻‍⚕️ Clínicas" },
] as const;

interface CepSearchFormProps {
  onSearch: (cep: string, types: string[]) => void;
  onClear: () => void;
  loading: boolean;
}

export default function CepSearchForm({
  onSearch,
  onClear,
  loading,
}: CepSearchFormProps) {
  const [cep, setCep] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  function handleTypeToggle(key: string) {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cep.trim() && selectedTypes.length > 0) {
      onSearch(cep.trim(), selectedTypes);
    }
  }

  function handleClear() {
    setCep("");
    setSelectedTypes([]);
    onClear();
  }

  return (
    <div className="bg-white p-5 text-center text-black">
      <p className="mb-1 text-base">
        Digite seu CEP abaixo e seja guiado gratuitamente
      </p>
      <p className="mb-4 text-base">
        até o estabelecimento SUS mais próximo do seu endereço.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
        <input
          type="text"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          placeholder="Digite um CEP válido (ex: 20210150)"
          className="w-auto rounded-md border border-gray-300 px-4 py-2.5 text-base outline-none focus:border-blue-500 text-center"
          size={30}
          maxLength={9}
          disabled={loading}
          autoComplete="off"
          name="cep-search"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md text-left">
          {ESTABLISHMENT_TYPES.map((type) => (
            <label
              key={type.key}
              className="flex items-center gap-2 cursor-pointer text-sm p-1.5 rounded hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedTypes.includes(type.key)}
                onChange={() => handleTypeToggle(type.key)}
                className="w-4 h-4 accent-red-600"
                disabled={loading}
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>

        {cep.trim() && selectedTypes.length === 0 && (
          <p className="text-xs text-red-500">
            Selecione pelo menos um tipo de estabelecimento.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !cep.trim() || selectedTypes.length === 0}
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
