"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearch } from "@/hooks/useSearch";
import CepSearchForm from "@/components/CepSearchForm";
import EstablishmentList from "@/components/EstablishmentList";
import EstablishmentCard from "@/components/EstablishmentCard";
import WazeButton from "@/components/WazeButton";
import Footer from "@/components/Footer";
import { isRoutable } from "@/lib/validators/coordinates";
import type { Coordinates } from "@/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Home() {
  const { state, search, selectEstablishment, loadRoute, clear } = useSearch();

  const selectedEst =
    state.establishments.length > 0
      ? state.establishments[state.selectedIndex]
      : null;

  useEffect(() => {
    if (!selectedEst || !state.userCoords) return;
    if (!selectedEst.latitude || !selectedEst.longitude) return;

    const from: Coordinates = state.userCoords;
    const to: Coordinates = {
      lat: selectedEst.latitude,
      lng: selectedEst.longitude,
    };

    if (isRoutable(from, to)) {
      loadRoute(from, to);
    }
  }, [selectedEst?.coCnes, state.userCoords, loadRoute]);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-8">
      <h1 className="header-title">🩺 Saúde em Foco ❤️</h1>

      <CepSearchForm onSearch={search} onClear={clear} loading={state.loading} />

      {state.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {state.error}
        </div>
      )}

      {state.cepData && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Endereço do CEP</h3>
          <p>
            <strong>Logradouro:</strong> {state.cepData.logradouro}
          </p>
          <p>
            <strong>Bairro:</strong> {state.cepData.bairro}
          </p>
          <p>
            <strong>Cidade/UF:</strong> {state.cepData.localidade}/
            {state.cepData.uf}
          </p>
        </div>
      )}

      {state.noResults && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
          <p className="font-bold">
            Nenhum estabelecimento do tipo selecionado encontrado em um raio de
            20 km.
          </p>
          <p className="mt-1 text-sm">
            Tente selecionar outros tipos ou verifique o CEP informado.
          </p>
        </div>
      )}

      {state.establishments.length > 0 && (
        <>
          <EstablishmentList
            establishments={state.establishments}
            selectedIndex={state.selectedIndex}
            onSelect={selectEstablishment}
          />

          {selectedEst && (
            <div className="mt-4">
              <EstablishmentCard establishment={selectedEst} />

              {state.userCoords &&
                selectedEst.latitude &&
                selectedEst.longitude && (
                  <>
                    {state.routeLoading && (
                      <p className="text-gray-500 mt-2">Gerando mapa e rota...</p>
                    )}
                    <MapView
                      key={selectedEst.coCnes}
                      userCoords={state.userCoords}
                      estCoords={{
                        lat: selectedEst.latitude,
                        lng: selectedEst.longitude,
                      }}
                      estName={selectedEst.noFantasia ?? "Estabelecimento"}
                      route={state.route}
                    />

                    {!state.route && !state.routeLoading && (
                      <p className="text-yellow-600 mt-2 text-sm">
                        Não foi possível gerar a rota detalhada, mas o mapa mostra
                        as localizações.
                      </p>
                    )}

                    <WazeButton
                      lat={selectedEst.latitude}
                      lng={selectedEst.longitude}
                    />
                  </>
                )}
            </div>
          )}
        </>
      )}

      <Footer />
    </div>
  );
}
