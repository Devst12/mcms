"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getFarmersLocal, saveFarmersLocal } from "@/lib/indexed-db";

interface FarmerData {
  _id: string;
  code: string;
  name: string;
  phone: string;
  active: boolean;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export default function FarmersList() {
  const [farmers, setFarmers] = useState<FarmerData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const local = await getFarmersLocal() as unknown as FarmerData[];
          if (!cancelled && local.length) setFarmers(local);
          const response = await fetchWithTimeout("/api/farmers", {}, 8000);
          if (!response.ok) throw new Error("Could not load farmers");
          const remote = await response.json();
          if (Array.isArray(remote)) {
            await saveFarmersLocal(remote);
            const latest = await getFarmersLocal() as unknown as FarmerData[];
            if (!cancelled) setFarmers(latest);
          }
        } catch {
          // Cached farmers remain available when offline.
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const filtered = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.phone.includes(search)
  );

  const activeFarmers = filtered.filter((f) => f.active);
  const inactiveFarmers = filtered.filter((f) => !f.active);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">किसानहरू</h1>
            <p className="text-[12.5px] text-gray-400 font-medium">
              {loading ? "…" : `${activeFarmers.length} सक्रिय`}
            </p>
          </div>
          <Link
            href="/farmers/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 text-white font-semibold text-[13px] shadow-sm active:opacity-80 transition-opacity"
          >
            <UserPlus size={15} strokeWidth={2.2} />
            थप्नुहोस्
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[15px]">🔍</span>
          <input
            type="text"
            placeholder="नाम, कोड वा फोनले खोज्नुहोस्…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white shadow-sm text-[14px] font-semibold text-gray-800 placeholder:text-gray-300 placeholder:font-normal outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow"
          />
        </div>

        {/* Active Farmers */}
        {activeFarmers.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-0.5">सक्रिय</h2>
            {activeFarmers.map((f) => (
              <Link key={f._id} href={`/farmers/${f._id}`} className="block">
                <div className="flex items-center gap-3 rounded-2xl bg-white shadow-sm px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold text-gray-500">
                    {getInitials(f.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-gray-900 truncate">{f.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {f.code}
                      {f.phone ? ` · ${f.phone}` : ""}
                    </p>
                  </div>
                  <span className="ml-2 shrink-0 text-gray-300 text-lg leading-none">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Inactive Farmers */}
        {inactiveFarmers.length > 0 && (
          <details className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <summary className="px-4 py-3 flex items-center justify-between cursor-pointer select-none">
              <span className="text-[13px] font-bold text-gray-900">
                निष्क्रिय <span className="text-gray-400 font-medium">({inactiveFarmers.length})</span>
              </span>
              <span className="text-gray-300 text-[11px]">▾</span>
            </summary>
            <div className="px-2 pb-2 space-y-1">
              {inactiveFarmers.map((f) => (
                <Link key={f._id} href={`/farmers/${f._id}`} className="block">
                  <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 opacity-60 hover:opacity-100 hover:bg-gray-50 transition-all">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-400">
                      {getInitials(f.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-bold text-gray-900 truncate">{f.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {f.code}
                        {f.phone ? ` · ${f.phone}` : ""}
                      </p>
                    </div>
                    <span className="ml-2 shrink-0 text-gray-300 text-lg leading-none">›</span>
                  </div>
                </Link>
              ))}
            </div>
          </details>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white shadow-sm text-center py-10 px-6">
            <p className="text-3xl mb-3">👨‍🌾</p>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">
              {search ? "कोही फेला परेन" : "अझै किसान थपिएको छैन"}
            </h2>
            <p className="text-[13px] text-gray-400 mb-5">
              {search
                ? "अर्को नाम, कोड वा फोन नम्बर प्रयास गर्नुहोस्।"
                : "दूध संकलन सुरु गर्न पहिलो किसान थप्नुहोस्।"}
            </p>
            {!search && (
              <Link
                href="/farmers/new"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-[15px] shadow-sm active:opacity-80 transition-opacity"
              >
                <span className="text-lg leading-none">➕</span>
                किसान थप्नुहोस्
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
