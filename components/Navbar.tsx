"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, ClipboardList, Users, MoreHorizontal, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { getUnsyncedItems, markSynced } from "@/lib/indexed-db";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

// Left/right of the center FAB — "दूध थप्नुहोस्" is promoted to its own
// floating action button instead of competing as a fifth flat tab.
const leftNav = [
  { href: "/", label: "घर", icon: Home },
  { href: "/entries", label: "विवरण", icon: ClipboardList },
];

const rightNav = [
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

function NavItem({ href, label, Icon, active }: { href: string; label: string; Icon: typeof Home; active: boolean }) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        if (!navigator.onLine) {
          event.preventDefault();
          window.location.assign(href);
        }
      }}
      className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-colors ${
        active ? "text-gray-900" : "text-gray-400"
      }`}
    >
      <Icon size={21} strokeWidth={active ? 2.4 : 1.8} />
      <span className={`text-[10px] leading-tight ${active ? "font-bold" : "font-medium"}`}>{label}</span>
    </Link>
  );
}

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function Navbar() {
  const pathname = usePathname();
  const [pendingSync, setPendingSync] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const syncInFlight = useRef(false);
  const syncAgain = useRef(false);

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
    window.addEventListener("local-data-saved", updatePendingCount);
    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    const interval = setInterval(updatePendingCount, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("local-data-saved", updatePendingCount);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const handleSync = useCallback(async () => {
    if (syncInFlight.current) {
      syncAgain.current = true;
      return;
    }
    syncInFlight.current = true;
    setSyncing(true);
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

      const res = await fetchWithTimeout("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }, 10000);

      if (res.ok) {
        const result = await res.json();
        const successful = new Map<string, { serverId?: string }>(
          (result.results || [])
            .filter((r: { success: boolean }) => r.success)
            .map((r: { id: string; serverId?: string }) => [r.id, { serverId: r.serverId }])
        );
        for (const item of items) {
          const result = item.id ? successful.get(item.id) : undefined;
          if (item.id && result) {
            await markSynced(
              item.collection,
              item.id,
              item.collection === "entries" && result.serverId ? { _id: result.serverId } : {}
            );
          }
        }
        const [remainingEntries, remainingCompanies, remainingAdvances] = await Promise.all([
          getUnsyncedItems("entries"),
          getUnsyncedItems("company_collections"),
          getUnsyncedItems("advances"),
        ]);
        setPendingSync(remainingEntries.length + remainingCompanies.length + remainingAdvances.length);
      }
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      syncInFlight.current = false;
      setSyncing(false);
      if (syncAgain.current) {
        syncAgain.current = false;
        window.setTimeout(() => window.dispatchEvent(new Event("local-data-saved")), 0);
      }
    }
  }, []);

  useEffect(() => {
    const syncWhenOnline = () => {
      if (navigator.onLine) void handleSync();
    };
    window.addEventListener("online", syncWhenOnline);
    window.addEventListener("local-data-saved", syncWhenOnline);
    if (navigator.onLine) syncWhenOnline();
    const interval = setInterval(syncWhenOnline, 60000);
    return () => {
      window.removeEventListener("online", syncWhenOnline);
      window.removeEventListener("local-data-saved", syncWhenOnline);
      clearInterval(interval);
    };
  }, [handleSync]);

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      alert("To install: open your browser menu and choose Add to Home Screen or Install app.");
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={() => setShowMore(false)}
        />
      )}

      {!isOnline && (
        <div role="status" className="fixed bottom-[calc(76px+var(--safe-area-bottom))] left-3 right-3 z-20 mx-auto max-w-md rounded-xl bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-900 shadow-sm">
          Offline · saved entries will sync when connected
        </div>
      )}

      {showMore && (
        <div className="fixed bottom-[calc(72px+var(--safe-area-bottom))] left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-3 pb-5 pt-3 animate-slide-up">
          <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

          <div className="grid grid-cols-4 gap-2">
            {moreNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center justify-center min-h-[52px] rounded-xl text-[11.5px] font-semibold px-1 text-center transition-colors ${
                    active ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                void installApp();
                setShowMore(false);
              }}
              className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl text-[11.5px] font-semibold bg-blue-50 text-blue-700"
            >
              <span aria-hidden="true">⬇</span>
              <span>Install app</span>
            </button>
            <button
              onClick={() => {
                handleSync();
                setShowMore(false);
              }}
              className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl text-[11.5px] font-semibold bg-gray-50 text-gray-600 relative"
            >
              <RefreshCw size={18} strokeWidth={pendingSync > 0 ? 2.4 : 1.8} className={syncing ? "animate-spin" : ""} />
              <span>पठाउन बाँकी</span>
              {pendingSync > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingSync > 9 ? "9+" : pendingSync}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-8px_24px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "var(--safe-area-bottom)" }}
      >
        <div className="relative flex items-center justify-around max-w-screen-xl mx-auto px-2 h-[72px]">
          {leftNav.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} active={isActive(item.href)} />
          ))}

          {/* Center FAB — the one primary action, lifted above the bar */}
          <Link
            href="/entry"
            aria-label="दूध थप्नुहोस्"
            className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-gray-900 text-white shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={26} strokeWidth={2.4} />
          </Link>

          {rightNav.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} active={isActive(item.href)} />
          ))}

          <button
            onClick={() => setShowMore(!showMore)}
            className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-colors ${
              showMore ? "text-gray-900" : "text-gray-400"
            }`}
          >
            <MoreHorizontal size={21} strokeWidth={showMore ? 2.4 : 1.8} />
            <span className={`text-[10px] leading-tight ${showMore ? "font-bold" : "font-medium"}`}>थप विकल्प</span>
            {pendingSync > 0 && (
              <span className="absolute top-0 right-2 min-w-[16px] h-4 px-1 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {pendingSync > 9 ? "9+" : pendingSync}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
