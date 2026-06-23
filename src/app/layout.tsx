import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saúde em Foco",
  description:
    "Encontre o estabelecimento de saúde mais próximo de você. Postos, hospitais, farmácias, laboratórios e clínicas do SUS.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
