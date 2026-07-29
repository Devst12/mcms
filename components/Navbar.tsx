"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, Building2, BarChart3, Scale, Wallet, Receipt, Settings, RefreshCw, ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { getUnsyncedItems, markSynced, clearSyncQueue } from "@/lib/indexed-db";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/farmers", label: "किसान", icon: Users },
  { href: "/entry", label: "Entry", icon: FileText },
  { href: "/entries", label: "All Entries", icon: ClipboardList },
  { href: "/company", label: "Company", icon: Building2 },
  { href: "/reports/monthly", label: "Reports", icon: BarChart3 },
  { href: "/reconcile", label: "Reconcile", icon: Scale },
  { href: "/advances", label: "Advances", icon: Wallet },
  { href: "/slip", label: "Slip", icon: Receipt },
  { href: "/rates", label: "Rates", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [pendingSync, setPendingSync] = useState(0);

  const updatePendingCount = async () => {
    try {
      const entries = await getUnsyncedItems("entries");
      const companies = await getUnsyncedItems("company_collections");
      const advances = await getUnsyncedItems("advances");
      setPendingSync(entries.length + companies.length + advances.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    try {
      const entries = await getUnsyncedItems("entries");
      const companies = await getUnsyncedItems("company_collections");
      const advances = await getUnsyncedItems("advances");

      const items = [
        ...entries.map((e: Record<string, unknown>) => ({ id: (e as { id?: string }).id, collection: "entries", data: e })),
        ...companies.map((c: Record<string, unknown>) => ({ id: (c as { id?: string }).id, collection: "company_collections", data: c })),
        ...advances.map((a: Record<string, unknown>) => ({ id: (a as { id?: string }).id, collection: "advances", data: a })),
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
            await markSynced(item.collection, item.id);
          }
        }
        await clearSyncQueue();
        setPendingSync(0);
      }
    } catch (err) {
      console.error("Sync failed", err);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-between px-2 py-1 max-w-screen-xl mx-auto">
        <div className="flex overflow-x-auto gap-1 flex-1 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center min-h-touch min-w-[60px] px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  active ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon size={20} />
                <span className="mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex flex-col items-center ml-2 pl-2 border-l border-gray-200">
          <button
            onClick={handleSync}
            className="flex items-center justify-center min-h-touch min-w-[48px] px-2 py-1 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900"
            title="Sync Now"
          >
            <RefreshCw size={20} />
          </button>
          {pendingSync > 0 && (
            <span className="text-[10px] text-red-600 font-bold">{pendingSync}</span>
          )}
        </div>
      </div>
    </nav>
  );
}
