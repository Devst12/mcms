"use client";

import { useState, useEffect } from "react";
import AdvanceForm from "@/components/AdvanceForm";
import { getAdvancesLocal, getFarmersLocal, saveFarmersLocal } from "@/lib/indexed-db";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface AdvanceData {
  _id: string;
  farmerId: string;
  dateAD: string;
  dateBS: string;
  amount: number;
  note: string;
  settled: boolean;
  createdAt: string;
}

export default function AdvancesPage() {
  const [farmers, setFarmers] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [advances, setAdvances] = useState<AdvanceData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdvances = async () => {
    try {
      const local = await getAdvancesLocal() as unknown as AdvanceData[];
      setAdvances(local);
      const response = await fetchWithTimeout("/api/advances", {}, 8000);
      if (!response.ok) throw new Error("Could not load advances");
      const remote = await response.json() as AdvanceData[];
      if (!Array.isArray(remote)) return;
      const byId = new Map<string, AdvanceData>();
      for (const advance of [...remote, ...local]) {
        byId.set(advance._id || (advance as AdvanceData & { id?: string }).id || `${advance.farmerId}_${advance.dateAD}_${advance.amount}`, advance);
      }
      setAdvances([...byId.values()]);
    } catch {
      // Keep locally saved advances visible when offline or the server is unavailable.
    } finally {
      setLoading(false);
    }
  };

  const loadFarmers = async () => {
    try {
      const local = await getFarmersLocal() as unknown as Array<{ _id: string; name: string; code: string }>;
      if (local.length) setFarmers(local);
      const response = await fetchWithTimeout("/api/farmers", {}, 8000);
      if (!response.ok) throw new Error("Could not load farmers");
      const remote = await response.json();
      if (Array.isArray(remote)) {
        setFarmers(remote);
        await saveFarmersLocal(remote);
      }
    } catch {
      // Cached farmers keep the advance form usable without a connection.
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFarmers();
      void loadAdvances();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const farmerMap = new Map(farmers.map((f) => [f._id, `${f.name} (${f.code})`]));

  const pendingAdvances = advances.filter((a) => !a.settled);
  const settledAdvances = advances.filter((a) => a.settled);
  const totalPending = pendingAdvances.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">अग्रिम रकम</h1>
          <p className="text-[12.5px] text-gray-400 font-medium">
            {pendingAdvances.length} बाँकी · Rs. {totalPending.toFixed(2)}
          </p>
        </div>

        <AdvanceForm farmers={farmers} onAdvanceAdded={loadAdvances} />

        {/* Pending Advances */}
        {pendingAdvances.length > 0 && (
          <div className="rounded-2xl bg-amber-50 px-4 py-4">
            <h2 className="text-[13px] font-bold text-amber-800 mb-2.5">बाँकी अग्रिम</h2>
            <div className="space-y-2">
              {pendingAdvances.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-gray-900 truncate">
                      {farmerMap.get(a.farmerId) || a.farmerId}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {a.dateBS} · {a.note || "Advance"}
                    </p>
                  </div>
                  <p className="shrink-0 ml-2 font-bold text-[15px] text-red-600 tabular-nums">
                    Rs. {a.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settled Advances */}
        {settledAdvances.length > 0 && (
          <details className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <summary className="px-4 py-3 flex items-center justify-between cursor-pointer select-none">
              <span className="text-[13px] font-bold text-gray-900">
                मिलाइएको <span className="text-gray-400 font-medium">({settledAdvances.length})</span>
              </span>
              <span className="text-gray-300 text-[11px]">▾</span>
            </summary>
            <div className="px-2 pb-2 space-y-1">
              {settledAdvances.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between rounded-xl px-2.5 py-2.5 opacity-60 hover:opacity-100 hover:bg-gray-50 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 truncate">
                      {farmerMap.get(a.farmerId) || a.farmerId}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {a.dateBS} · {a.note || "Advance"}
                    </p>
                  </div>
                  <p className="shrink-0 ml-2 text-[13px] font-semibold text-gray-400 line-through tabular-nums">
                    Rs. {a.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Empty state */}
        {advances.length === 0 && !loading && (
          <div className="rounded-2xl bg-white shadow-sm text-center py-10 px-6">
            <p className="text-3xl mb-3">💰</p>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">अझै अग्रिम रकम छैन</h2>
            <p className="text-[13px] text-gray-400">माथिको फारम बाट किसानलाई अग्रिम दिनुहोस्।</p>
          </div>
        )}
      </div>
    </div>
  );
}
