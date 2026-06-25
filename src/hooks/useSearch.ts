"use client";

import { useState, useCallback } from "react";
import type {
  CepResult,
  Coordinates,
  Establishment,
  RouteGeometry,
} from "@/types";

interface SearchState {
  loading: boolean;
  cepData: CepResult | null;
  userCoords: Coordinates | null;
  establishments: Establishment[];
  selectedIndex: number;
  route: RouteGeometry | null;
  error: string | null;
  noCoords: boolean;
  establishmentsWithoutCoords: Establishment[];
  routeLoading: boolean;
}

const initialState: SearchState = {
  loading: false,
  cepData: null,
  userCoords: null,
  establishments: [],
  selectedIndex: 0,
  route: null,
  error: null,
  noCoords: false,
  establishmentsWithoutCoords: [],
  routeLoading: false,
};

export function useSearch() {
  const [state, setState] = useState<SearchState>(initialState);

  const search = useCallback(async (cep: string, types: string[]) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const cepRes = await fetch(`/api/cep?q=${encodeURIComponent(cep)}`);
      const cepJson = await cepRes.json();

      if (!cepJson.valid) {
        setState((s) => ({ ...s, loading: false, error: cepJson.error }));
        return;
      }

      const cepData: CepResult = cepJson.data;
      const address = `${cepData.logradouro}, ${cepData.bairro}, ${cepData.localidade}, ${cepData.uf}`;

      const geoRes = await fetch(
        `/api/geocode?cep=${encodeURIComponent(cep)}&address=${encodeURIComponent(address)}`
      );
      const geoJson = await geoRes.json();

      if (!geoJson.coords) {
        setState((s) => ({
          ...s,
          loading: false,
          cepData,
          error: geoJson.error || "Não foi possível obter coordenadas.",
        }));
        return;
      }

      const userCoords: Coordinates = geoJson.coords;
      const typesParam = types.join(",");

      const estRes = await fetch(
        `/api/establishments?lat=${userCoords.lat}&lng=${userCoords.lng}&limit=20&types=${encodeURIComponent(typesParam)}`
      );
      const estJson = await estRes.json();

      if (
        estJson.type === "with_coords" &&
        estJson.establishments.length > 0
      ) {
        setState((s) => ({
          ...s,
          loading: false,
          cepData,
          userCoords,
          establishments: estJson.establishments,
          selectedIndex: 0,
          noCoords: false,
          establishmentsWithoutCoords: [],
        }));
      } else {
        const noCoordsRes = await fetch(
          `/api/establishments?city=${encodeURIComponent(cepData.localidade)}`
        );
        const noCoordsJson = await noCoordsRes.json();

        setState((s) => ({
          ...s,
          loading: false,
          cepData,
          userCoords,
          establishments: [],
          noCoords: true,
          establishmentsWithoutCoords: noCoordsJson.establishments ?? [],
        }));
      }
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        error: "Erro de conexão. Tente novamente.",
      }));
    }
  }, []);

  const selectEstablishment = useCallback((index: number) => {
    setState((s) => ({ ...s, selectedIndex: index, route: null }));
  }, []);

  const loadRoute = useCallback(
    async (from: Coordinates, to: Coordinates) => {
      setState((s) => ({ ...s, routeLoading: true }));
      try {
        const res = await fetch(
          `/api/route?from=${from.lat},${from.lng}&to=${to.lat},${to.lng}`
        );
        const json = await res.json();
        setState((s) => ({
          ...s,
          route: json.route ?? null,
          routeLoading: false,
        }));
      } catch {
        setState((s) => ({ ...s, routeLoading: false }));
      }
    },
    []
  );

  const clear = useCallback(() => {
    setState(initialState);
  }, []);

  return { state, search, selectEstablishment, loadRoute, clear };
}
