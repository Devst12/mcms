import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Dudh Hisab — दूध हिसाब",
  description: "Milk Collection Management System",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ne" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col pb-[calc(64px+var(--safe-area-bottom))]"
        style={{ paddingBottom: "calc(64px + var(--safe-area-bottom))" }}
      >
        <ServiceWorkerRegistration />
        <main className="flex-1 overflow-auto">{children}</main>
        <Navbar />
      </body>
    </html>
  );
}
