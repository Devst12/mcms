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

  const statusIcon = (status: string) => {
    switch (status) {
      case "match": return "✅";
      case "shortage": return "⚠️";
      case "excess": return "⚠️";
      default: return "";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "match": return "text-match bg-green-100";
      case "shortage": return "text-shortage bg-red-100";
      case "excess": return "text-excess bg-amber-100";
      default: return "";
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Reconciliation ⚖️</h1>
      <PeriodPicker value={period} onChange={setPeriod} />
      <button onClick={loadData} disabled={loading} className="px-4 py-3 min-h-touch bg-blue-600 text-white rounded-lg font-medium">
        {loading ? "Loading..." : "Refresh"}
      </button>

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border">
              <h3 className="font-semibold text-lg mb-2">🐄 Cow Milk</h3>
              <div className="space-y-1 text-sm">
                <p>Farmer Total: <span className="font-bold">{data.cow.farmerTotal.toFixed(1)} L</span></p>
                <p>Company Total: <span className="font-bold">{data.cow.companyTotal.toFixed(1)} L</span></p>
                <p>Difference: <span className={`font-bold ${data.cow.status === "match" ? "text-match" : data.cow.status === "shortage" ? "text-shortage" : "text-excess"}`}>{data.cow.diff.toFixed(1)} L ({data.cow.diffPercent.toFixed(1)}%)</span></p>
                <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor(data.cow.status)}`}>
                  {statusIcon(data.cow.status)} {data.cow.status.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <h3 className="font-semibold text-lg mb-2">🐃 Buffalo Milk</h3>
              <div className="space-y-1 text-sm">
                <p>Farmer Total: <span className="font-bold">{data.buffalo.farmerTotal.toFixed(1)} L</span></p>
                <p>Company Total: <span className="font-bold">{data.buffalo.companyTotal.toFixed(1)} L</span></p>
                <p>Difference: <span className={`font-bold ${data.buffalo.status === "match" ? "text-match" : data.buffalo.status === "shortage" ? "text-shortage" : "text-excess"}`}>{data.buffalo.diff.toFixed(1)} L ({data.buffalo.diffPercent.toFixed(1)}%)</span></p>
                <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor(data.buffalo.status)}`}>
                  {statusIcon(data.buffalo.status)} {data.buffalo.status.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <h3 className="font-semibold text-lg mb-2">📊 Combined</h3>
              <div className="space-y-1 text-sm">
                <p>Farmer Total: <span className="font-bold">{data.combined.farmerTotal.toFixed(1)} L</span></p>
                <p>Company Total: <span className="font-bold">{data.combined.companyTotal.toFixed(1)} L</span></p>
                <p>Difference: <span className={`font-bold ${data.combined.status === "match" ? "text-match" : data.combined.status === "shortage" ? "text-shortage" : "text-excess"}`}>{data.combined.diff.toFixed(1)} L ({data.combined.diffPercent.toFixed(1)}%)</span></p>
                <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor(data.combined.status)}`}>
                  {statusIcon(data.combined.status)} {data.combined.status.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
