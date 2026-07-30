"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, ClipboardList, Users, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { getUnsyncedItems } from "@/lib/indexed-db";

const primaryNav = [
  { href: "/", label: "घर", icon: Home },
  { href: "/entry", label: "दूध थप्नुहोस्", icon: Plus },
  { href: "/entries", label: "विवरण", icon: ClipboardList },
  { href: "/farmers", label: "किसान", icon: Users },
];

const moreNav = [
  { href: "/reconcile", label: "मिलान" },
  { href: "/company", label: "कम्पनी" },
  { href: "/rates", label: "दर" },
  { href: "/advances", label: "अग्रिम" },
  { href: "/reports/monthly", label: "प्रतिवेदन" },
  { href: "/reports/payments", label: "भुक्तानी" },
  { href: "/slip", label: "स्लिप" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [pendingSync, setPendingSync] = useState(0);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const updatePendingCount = async () => {
      try {
        const entries = await getUnsyncedItems("entries");
        const companies = await getUnsyncedItems("company_collections");
        const advances = await getUnsyncedItems("advances");
        if (!cancelled) setPendingSync(entries.length + companies.length + advances.length);
      } catch {
        // ignore
      }
    };
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleSync = async () => {
    try {
      const entries = await getUnsyncedItems("entries");
      const companies = await getUnsyncedItems("company_collections");
      const advances = await getUnsyncedItems("advances");

      const items = [
        ...entries.map((e: Record<string, unknown>) => ({ id: (e as { id?: string }).id, collection: "entries" as const, data: e })),
        ...companies.map((c: Record<string, unknown>) => ({ id: (c as { id?: string }).id, collection: "company_collections" as const, data: c })),
        ...advances.map((a: Record<string, unknown>) => ({ id: (a as { id?: string }).id, collection: "advances" as const, data: a })),
      ];

      if (items.length === 0) {
        setPendingSync(0);
        return;
      }

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        const result = await res.json();
        const successIds = new Set(
          (result.results || [])
            .filter((r: { success: boolean }) => r.success)
            .map((r: { id: string }) => r.id)
        );
        for (const item of items) {
          if (item.id && successIds.has(item.id)) {
            await (await import("@/lib/indexed-db")).markSynced(item.collection, item.id);
          }
        }
        await (await import("@/lib/indexed-db")).clearSyncQueue();
        setPendingSync(0);
      }
    } catch (err) {
      console.error("Sync failed", err);
    }
  };

  return (
    <>
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setShowMore(false)}
        />
      )}

      {showMore && (
        <div className="fixed bottom-[calc(64px+var(--safe-area-bottom))] left-0 right-0 z-50 bg-white border-t-2 border-gray-800 rounded-t-2xl shadow-[0_-4px_0_rgba(0,0,0,0.15)] px-2 pb-4 pt-2 animate-slide-up">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
          <div className="grid grid-cols-4 gap-1">
            {moreNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl text-xs font-bold transition-colors ${
                    active ? "bg-blue-100 text-blue-700 border-2 border-blue-300" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { handleSync(); setShowMore(false); }}
              className="flex flex-col items-center justify-center min-h-[48px] rounded-xl text-xs font-bold transition-colors text-gray-600 hover:bg-gray-100"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={pendingSync > 0 ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              <span className="mt-0.5">पठाउन बाँकी</span>
            </button>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-gray-800 shadow-[0_-4px_0_rgba(0,0,0,0.15)]"
        style={{ paddingBottom: "var(--safe-area-bottom)" }}
      >
        <div className="flex items-center justify-around max-w-screen-xl mx-auto px-2 h-16">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isAddTab = item.href === "/entry";
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center min-w-[60px] min-h-[56px] px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  isAddTab
                    ? "bg-blue-600 text-white shadow-[2px_2px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                    : active
                      ? "text-blue-700 bg-blue-50 border-2 border-blue-300"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Icon size={isAddTab ? 26 : 22} strokeWidth={active || isAddTab ? 2.5 : 1.5} />
                <span className="mt-0.5 text-[10px] leading-tight">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center min-w-[60px] min-h-[44px] px-3 py-1 rounded-xl text-xs font-bold transition-colors relative ${
              showMore ? "text-blue-700 bg-blue-50 border-2 border-blue-300" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={showMore ? 2.5 : 1.5} />
            <span className="mt-0.5 text-[10px] leading-tight">थप विकल्प</span>
            {pendingSync > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {pendingSync > 9 ? "9+" : pendingSync}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}