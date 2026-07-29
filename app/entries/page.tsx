"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PeriodPicker, { type Period } from "@/components/PeriodPicker";
import PrintButton from "@/components/PrintButton";

interface EntryData {
  _id: string;
  dateAD: string;
  dateBS: string;
  farmerId: string;
  farmerName?: string;
  milkType: "cow" | "buffalo";
  morningQty: number;
  eveningQty: number;
  fatPercent: number;
  rateUsed: number;
}

function EntriesInner() {
  const searchParams = useSearchParams();
  const preselectedFarmer = searchParams.get("farmerId") || "";
  const [farmers, setFarmers] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [period, setPeriod] = useState<Period>({ type: "thisMonth" });
  const [selectedFarmer, setSelectedFarmer] = useState(preselectedFarmer);
  const [loading, setLoading] = useState(true);

  const fetchFarmers = useCallback(async () => {
    const res = await fetch("/api/farmers");
    const json = await res.json();
    setFarmers(json);
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    let from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    let to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

    if (period.type === "twoMonths") {
      const fromMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const fromYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      from = `${fromYear}-${String(fromMonth + 1).padStart(2, "0")}-01`;
      to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
    } else if (period.type === "thisYear") {
      from = `${now.getFullYear()}-01-01`;
      to = `${now.getFullYear()}-12-31`;
    } else if (period.type === "allTime") {
      from = "2000-01-01";
      to = "2099-12-31";
    } else if (period.type === "custom" && period.from && period.to) {
      from = period.from;
      to = period.to;
    }

    const params = new URLSearchParams();
    if (selectedFarmer) params.set("farmerId", selectedFarmer);
    params.set("dateFrom", from);
    params.set("dateTo", to);
    const res = await fetch(`/api/entries?${params}`);
    const data = await res.json() as EntryData[];

    const farmerMap = new Map(farmers.map(f => [f._id, f.name]));
    const enriched = data.map(e => ({
      ...e,
      farmerName: farmerMap.get(e.farmerId) || e.farmerId,
    }));

    setEntries(enriched);
    setLoading(false);
  }, [selectedFarmer, period, farmers]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const cowEntries = entries.filter((e) => e.milkType === "cow");
  const buffaloEntries = entries.filter((e) => e.milkType === "buffalo");
  const cowTotal = cowEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
  const buffaloTotal = buffaloEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);

  const grouped = entries.reduce((acc, e) => {
    if (!acc[e.dateBS]) acc[e.dateBS] = [];
    acc[e.dateBS].push(e);
    return acc;
  }, {} as Record<string, EntryData[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Entries 📋</h1>
        <PrintButton />
      </div>

      <div className="p-4 bg-white rounded-xl border space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedFarmer}
            onChange={(e) => setSelectedFarmer(e.target.value)}
            className="px-4 py-2 border rounded-lg text-base"
          >
            <option value="">All Farmers</option>
            {farmers.map((f) => (
              <option key={f._id} value={f._id}>{f.name} ({f.code})</option>
            ))}
          </select>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-cow rounded-lg border">
            <p className="text-sm text-gray-600">Cow Total</p>
            <p className="text-xl font-bold">{cowTotal.toFixed(1)} L</p>
          </div>
          <div className="p-3 bg-buffalo rounded-lg border">
            <p className="text-sm text-gray-600">Buffalo Total</p>
            <p className="text-xl font-bold">{buffaloTotal.toFixed(1)} L</p>
          </div>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-4 print:space-y-2">
        {sortedDates.map((date) => {
          const dayEntries = grouped[date];
          const dayCow = dayEntries.filter((e) => e.milkType === "cow");
          const dayBuffalo = dayEntries.filter((e) => e.milkType === "buffalo");
          const dayCowTotal = dayCow.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
          const dayBuffaloTotal = dayBuffalo.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);

          return (
            <div key={date} className="p-4 bg-white rounded-xl border print:break-inside-avoid">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{date}</h3>
                <span className="text-sm text-gray-600">
                  Cow: {dayCowTotal.toFixed(1)}L | Buffalo: {dayBuffaloTotal.toFixed(1)}L
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1 px-2">Farmer</th>
                      <th className="py-1 px-2">Type</th>
                      <th className="py-1 px-2 text-right">Morning</th>
                      <th className="py-1 px-2 text-right">Evening</th>
                      <th className="py-1 px-2 text-right">Total</th>
                      <th className="py-1 px-2 text-right">Fat %</th>
                      <th className="py-1 px-2 text-right">Rate</th>
                      <th className="py-1 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayEntries.map((e) => (
                      <tr key={e._id} className="border-b">
                        <td className="py-1 px-2">{e.farmerName || e.farmerId}</td>
                        <td className="py-1 px-2 capitalize">{e.milkType}</td>
                        <td className="py-1 px-2 text-right">{e.morningQty.toFixed(1)}</td>
                        <td className="py-1 px-2 text-right">{e.eveningQty.toFixed(1)}</td>
                        <td className="py-1 px-2 text-right font-medium">{(e.morningQty + e.eveningQty).toFixed(1)}</td>
                        <td className="py-1 px-2 text-right">{e.fatPercent.toFixed(1)}</td>
                        <td className="py-1 px-2 text-right">{e.rateUsed.toFixed(2)}</td>
                        <td className="py-1 px-2 text-right font-medium">
                          Rs. {((e.morningQty + e.eveningQty) * e.rateUsed).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && entries.length === 0 && (
        <p className="text-gray-500 text-center py-8">No entries found for the selected period.</p>
      )}
    </div>
  );
}

export default function EntriesPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <EntriesInner />
    </Suspense>
  );
}
