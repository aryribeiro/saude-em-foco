export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CepResult {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export interface Establishment {
  id: number;
  coCnes: string;
  noFantasia: string | null;
  noRazaoSocial: string | null;
  noLogradouro: string | null;
  nuEndereco: string | null;
  noBairro: string | null;
  coCep: string | null;
  cidade: string | null;
  uf: string;
  latitude: number | null;
  longitude: number | null;
  nuTelefone: string | null;
  dsTurnoAtendimento: string | null;
  distance?: number;
}

export interface RouteGeometry {
  coordinates: [number, number][];
}
