import type { Metadata } from "next";
import { Geist, Geist_Mono, Mukta } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dudh Hisab — दूध हिसाब",
  description: "Milk Collection Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ne"
      className={`${geistSans.variable} ${geistMono.variable} ${mukta.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col pb-[calc(64px+var(--safe-area-bottom))]"
        style={{ paddingBottom: "calc(64px + var(--safe-area-bottom))" }}
      >
        <main className="flex-1 overflow-auto">{children}</main>
        <Navbar />
      </body>
    </html>
  );
}
