export default function Footer() {
  return (
    <footer className="mt-8 pb-4 text-center">
      <p className="font-bold mb-3">Seja guiado via Waze!</p>
      <p className="text-sm">
        🩺 Postos de Saúde | 🏥 Hospitais Públicos
      </p>
      <p className="text-sm">
        😷 Unidades Odontológicas | 👩🏻‍⚕️ Clínicas
      </p>
      <p className="text-sm">
        💊 Farmácias Populares | 💉 Laboratórios
      </p>
      <p className="text-xs text-gray-500 mt-4">
        openDataSUS | CNES | IBGE | ViaCEP | OpenCage | OpenRouteService |
        OpenStreetMap | Nominatim | LocationIQ | Waze
      </p>
    </footer>
  );
}
