import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-8 pb-4 text-center">
      <p className="font-bold mb-3 flex items-center justify-center gap-1">
        <Image src="/waze.png" alt="Waze" width={22} height={22} />
        Seja guiado via Waze!
      </p>
      <p className="text-xs text-gray-500 mt-4">
        openDataSUS | CNES | IBGE | ViaCEP | OpenCage | OpenRouteService |
        OpenStreetMap | Geoapify
      </p>
    </footer>
  );
}
