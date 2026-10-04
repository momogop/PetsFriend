import "./globals.css";

export const metadata = {
  title: "Pets Friend",
  description: "Mahallende köpeğine denk biri var",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="font-body">
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
