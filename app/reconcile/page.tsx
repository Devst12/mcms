"use client";

import { useState, useEffect, useCallback } from "react";
import PeriodPicker, { type Period } from "@/components/PeriodPicker";

export default function ReconcilePage() {
  const [period, setPeriod] = useState<Period>({ type: "thisMonth" });
  const [data, setData] = useState<Array<{
    farmerId: string;
    farmerName: string;
    farmerCow: number;
    farmerBuffalo: number;
    companyCow: number;
    companyBuffalo: number;
    cowDiff: number;
    buffaloDiff: number;
    totalDiff: number;
    status: "match" | "shortage" | "excess";
  }>>([]);
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

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Reconciliation ⚖️</h1>
      <PeriodPicker value={period} onChange={setPeriod} />
      <button onClick={loadData} disabled={loading} className="px-4 py-3 min-h-touch bg-blue-600 text-white rounded-lg font-medium">
        {loading ? "Loading..." : "Refresh"}
      </button>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-2">Farmer</th>
              <th className="py-2 px-2">Farmer Cow</th>
              <th className="py-2 px-2">Company Cow</th>
              <th className="py-2 px-2">Farmer Buffalo</th>
              <th className="py-2 px-2">Company Buffalo</th>
              <th className="py-2 px-2">Total Diff</th>
              <th className="py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.farmerId} className="border-b">
                <td className="py-2 px-2 font-medium">{row.farmerName}</td>
                <td className="py-2 px-2">{row.farmerCow.toFixed(1)}</td>
                <td className="py-2 px-2">{row.companyCow.toFixed(1)}</td>
                <td className="py-2 px-2">{row.farmerBuffalo.toFixed(1)}</td>
                <td className="py-2 px-2">{row.companyBuffalo.toFixed(1)}</td>
                <td className={`py-2 px-2 font-bold ${row.totalDiff === 0 ? "text-match" : row.totalDiff < 0 ? "text-shortage" : "text-excess"}`}>
                  {row.totalDiff.toFixed(1)}
                </td>
                <td className="py-2 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.status === "match" ? "bg-green-100 text-match" : row.status === "shortage" ? "bg-red-100 text-shortage" : "bg-amber-100 text-excess"
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
