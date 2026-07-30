"use client";

import { useState, useEffect, useCallback } from "react";
import PeriodPicker, { type Period } from "@/components/PeriodPicker";

type ReconciliationData = {
  cow: { farmerTotal: number; companyTotal: number; diff: number; diffPercent: number; status: "match" | "shortage" | "excess" };
  buffalo: { farmerTotal: number; companyTotal: number; diff: number; diffPercent: number; status: "match" | "shortage" | "excess" };
  combined: { farmerTotal: number; companyTotal: number; diff: number; diffPercent: number; status: "match" | "shortage" | "excess" };
};

export default function ReconcilePage() {
  const [period, setPeriod] = useState<Period>({ type: "thisMonth" });
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("period", period.type);
    if (period.from) params.set("from", period.from);
    if (period.to) params.set("to", period.to);
    const res = await fetch(`/api/reconcile?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const renderStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      match: "bg-green-100 text-green-700 border-green-400",
      shortage: "bg-red-100 text-red-700 border-red-400",
      excess: "bg-amber-100 text-amber-700 border-amber-400",
    };
    const labels: Record<string, string> = {
      match: "Match ✓",
      shortage: "Shortage ⚠️",
      excess: "Excess ⚠️",
    };
    return (
      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border-2 ${colors[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-4 pb-8">
      <h1 className="text-2xl font-bold">Reconciliation ⚖️</h1>

      <div className="card">
        <PeriodPicker value={period} onChange={setPeriod} />
        <button
          onClick={loadData}
          disabled={loading}
          className="w-full px-5 py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {data && (
        <div className="space-y-3">
          {/* Cow */}
          <div className="card bg-cow border-gray-800">
            <h3 className="text-lg font-bold mb-3">🐄 Cow Milk</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Farmer Total</span>
                <span className="text-lg font-bold tabular-nums">{data.cow.farmerTotal.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Company Reported</span>
                <span className="text-lg font-bold tabular-nums">{data.cow.companyTotal.toFixed(1)} L</span>
              </div>
              <div className="border-t-2 border-gray-600 pt-2 flex items-center justify-between">
                <span className="text-sm font-bold">Difference</span>
                <span className={`text-lg font-bold tabular-nums ${
                  data.cow.status === "match" ? "text-green-700" :
                  data.cow.status === "shortage" ? "text-red-600" : "text-amber-600"
                }`}>
                  {data.cow.diff >= 0 ? "+" : ""}{data.cow.diff.toFixed(1)} L ({data.cow.diffPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="pt-1">{renderStatusBadge(data.cow.status)}</div>
            </div>
          </div>

          {/* Buffalo */}
          <div className="card bg-buffalo border-gray-800">
            <h3 className="text-lg font-bold mb-3">🐃 Buffalo Milk</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Farmer Total</span>
                <span className="text-lg font-bold tabular-nums">{data.buffalo.farmerTotal.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Company Reported</span>
                <span className="text-lg font-bold tabular-nums">{data.buffalo.companyTotal.toFixed(1)} L</span>
              </div>
              <div className="border-t-2 border-gray-600 pt-2 flex items-center justify-between">
                <span className="text-sm font-bold">Difference</span>
                <span className={`text-lg font-bold tabular-nums ${
                  data.buffalo.status === "match" ? "text-green-700" :
                  data.buffalo.status === "shortage" ? "text-red-600" : "text-amber-600"
                }`}>
                  {data.buffalo.diff >= 0 ? "+" : ""}{data.buffalo.diff.toFixed(1)} L ({data.buffalo.diffPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="pt-1">{renderStatusBadge(data.buffalo.status)}</div>
            </div>
          </div>

          {/* Combined */}
          <div className="card bg-blue-50 border-blue-400">
            <h3 className="text-lg font-bold mb-3">📊 Combined</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Farmer Total</span>
                <span className="text-lg font-bold tabular-nums">{data.combined.farmerTotal.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Company Reported</span>
                <span className="text-lg font-bold tabular-nums">{data.combined.companyTotal.toFixed(1)} L</span>
              </div>
              <div className="border-t-2 border-blue-300 pt-2 flex items-center justify-between">
                <span className="text-sm font-bold">Difference</span>
                <span className={`text-lg font-bold tabular-nums ${
                  data.combined.status === "match" ? "text-green-700" :
                  data.combined.status === "shortage" ? "text-red-600" : "text-amber-600"
                }`}>
                  {data.combined.diff >= 0 ? "+" : ""}{data.combined.diff.toFixed(1)} L ({data.combined.diffPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="pt-1">{renderStatusBadge(data.combined.status)}</div>
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">⚖️</p>
          <p className="text-gray-600 font-bold">Select a period and click Refresh.</p>
        </div>
      )}
    </div>
  );
}
