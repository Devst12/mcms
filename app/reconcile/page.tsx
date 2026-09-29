"use client";

import { useState, useEffect, useCallback } from "react";
import PeriodPicker, { type Period } from "@/components/PeriodPicker";

type ReconciliationData = {
  cow: { farmerTotal: number; companyTotal: number; diff: number; diffPercent: number; status: "match" | "shortage" | "excess" };
  buffalo: { farmerTotal: number; companyTotal: number; diff: number; diffPercent: number; status: "match" | "shortage" | "excess" };
  combined: { farmerTotal: number; companyTotal: number; diff: number; diffPercent: number; status: "match" | "shortage" | "excess" };
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    match: "bg-green-50 text-green-700",
    shortage: "bg-red-50 text-red-600",
    excess: "bg-amber-50 text-amber-600",
  };
  const labels: Record<string, string> = {
    match: "मिल्यो ✓",
    shortage: "कमी ⚠️",
    excess: "बढी ⚠️",
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {labels[status] || status}
    </span>
  );
}

function StatRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12.5px] text-gray-500">{label}</span>
      <span className={`text-[15px] tabular-nums ${strong ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
        {value}
      </span>
    </div>
  );
}

function ReconcileCard({
  title,
  icon,
  soft,
  data,
}: {
  title: string;
  icon: string;
  soft: string;
  data: ReconciliationData["combined"];
}) {
  return (
    <div className={`rounded-2xl px-4 py-4 ${soft}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900">
          <span className="text-base leading-none">{icon}</span> {title}
        </h3>
        <StatusBadge status={data.status} />
      </div>
      <div className="space-y-2">
        <StatRow label="किसान जम्मा" value={`${data.farmerTotal.toFixed(1)} L`} />
        <StatRow label="कम्पनी" value={`${data.companyTotal.toFixed(1)} L`} />
        <div className="border-t border-black/5 pt-2 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-gray-600">फरक</span>
          <span
            className={`text-[15px] font-bold tabular-nums ${
              data.status === "match" ? "text-green-700" : data.status === "shortage" ? "text-red-600" : "text-amber-600"
            }`}
          >
            {data.diff >= 0 ? "+" : ""}
            {data.diff.toFixed(1)} L ({data.diffPercent.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ReconcilePage() {
  const [period, setPeriod] = useState<Period>({ type: "thisMonth" });
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("period", period.type);
      if (period.from) params.set("from", period.from);
      if (period.to) params.set("to", period.to);
      const res = await fetch(`/api/reconcile?${params}`);
      const json = await res.json();
      if (json && json.cow && json.buffalo && json.combined) setData(json);
      else setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Header */}
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">मिलान</h1>

        {/* Filters */}
        <div className="rounded-2xl bg-white shadow-sm px-4 py-4 space-y-3">
          <PeriodPicker value={period} onChange={setPeriod} />
          <button
            onClick={loadData}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-[14px] shadow-sm disabled:opacity-40 active:opacity-80 transition-opacity"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {loading && !data && (
          <div className="text-center py-10 text-gray-400 text-[13px] font-medium">Loading…</div>
        )}

        {data && (
          <div className="space-y-3">
            <ReconcileCard title="गाई" icon="🐄" soft="bg-amber-50" data={data.cow} />
            <ReconcileCard title="भैंसी" icon="🐃" soft="bg-teal-50" data={data.buffalo} />
            <ReconcileCard title="जम्मा" icon="📊" soft="bg-white shadow-sm" data={data.combined} />
          </div>
        )}

        {!data && !loading && (
          <div className="rounded-2xl bg-white shadow-sm text-center py-10 px-6">
            <p className="text-3xl mb-3">⚖️</p>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">अझै डाटा छैन</h2>
            <p className="text-[13px] text-gray-400">अवधि छान्नुहोस् र Refresh थिच्नुहोस्।</p>
          </div>
        )}
      </div>
    </div>
  );
}
