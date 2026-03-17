import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "NWSL · Scores & Schedule",
  description: "2026 NWSL season schedule, live scores, and where to watch every game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} antialiased`} style={{ background: '#000', color: '#fff', minHeight: '100dvh' }}>
        <Header />
        <main className="pb-safe">
          {children}
        </main>
      </body>
    </html>
  );
}
