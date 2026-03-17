import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NWSL Schedule 2026",
  description: "National Women's Soccer League 2026 season schedule, scores, and where to watch",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased bg-gray-50 min-h-screen`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
