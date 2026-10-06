import "./globals.css";
import SWRegister from "../components/SWRegister";

export const metadata = {
  title: "Pets Friend",
  description: "Köpeğin için en yakın yürüyüş arkadaşını bul",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f97316",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="font-body">
        <div className="app-shell">{children}</div>
        <SWRegister />
      </body>
    </html>
  );
}
