export default function Footer() {
  return (
    <footer className="mt-8 pb-4 text-center">
      <p className="font-bold mb-3">Seja guiado via Waze!</p>
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-sm">
        <span>🩺 Postos de Saúde</span>
        <span>🏥 Hospitais Públicos</span>
        <span>💊 Farmácias Populares</span>
        <span>😷 Unidades Odontológicas</span>
        <span>💉 Laboratórios</span>
        <span>👩🏻‍⚕️ Clínicas</span>
      </div>
      <p className="text-xs text-gray-500 mt-4">
        openDataSUS | CNES | IBGE | ViaCEP | OpenCage | OpenRouteService |
        OpenStreetMap | Nominatim | LocationIQ | Waze
      </p>
    </footer>
  );
}
