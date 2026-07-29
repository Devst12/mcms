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
  milkType: "cow" | "buffalo";
  morningQty: number;
  eveningQty: number;
  fatPercent: number;
  rateUsed: number;
}

function SlipInner({ initialFarmerId }: { initialFarmerId?: string }) {
  const searchParams = useSearchParams();
  const farmerId = searchParams.get("farmerId") || initialFarmerId || "";
  const [farmers, setFarmers] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [selectedFarmer, setSelectedFarmer] = useState(farmerId);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [period, setPeriod] = useState<Period>({ type: "thisMonth" });
  const [loading, setLoading] = useState(true);

  const fetchFarmers = useCallback(async () => {
    const res = await fetch("/api/farmers");
    const json = await res.json();
    setFarmers(json);
  }, []);

  const loadEntries = useCallback(async () => {
    if (!selectedFarmer) return;
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

    const res = await fetch(`/api/entries?farmerId=${selectedFarmer}&dateFrom=${from}&dateTo=${to}`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, [selectedFarmer, period]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const selected = farmers.find((f) => f._id === selectedFarmer);
  const cowEntries = entries.filter((e) => e.milkType === "cow");
  const buffaloEntries = entries.filter((e) => e.milkType === "buffalo");
  const cowTotal = cowEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
  const buffaloTotal = buffaloEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
  const totalAmount = entries.reduce((s, e) => s + (e.morningQty + e.eveningQty) * e.rateUsed, 0);

  const grouped = entries.reduce((acc, e) => {
    if (!acc[e.dateBS]) acc[e.dateBS] = [];
    acc[e.dateBS].push(e);
    return acc;
  }, {} as Record<string, EntryData[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Slip 🧾 पर्ची</h1>
        <PrintButton />
      </div>

      <div className="p-4 bg-white rounded-xl border space-y-3">
        <select
          value={selectedFarmer}
          onChange={(e) => setSelectedFarmer(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg text-base"
        >
          <option value="">Select Farmer</option>
          {farmers.map((f) => (
            <option key={f._id} value={f._id}>{f.name} ({f.code})</option>
          ))}
        </select>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {!selectedFarmer ? (
        <p className="text-gray-500 text-center py-8">Select a farmer to view slip.</p>
      ) : loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No entries found for this period.</p>
      ) : (
        <div className="space-y-4 print:space-y-2">
          <div className="p-4 bg-white rounded-xl border print:border-0">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">Milk Collection Slip</h2>
              <p className="text-lg">{selected?.name} | {selected?.code}</p>
              <p className="text-sm text-gray-600">
                {period.type === "custom" && period.from && period.to
                  ? `${period.from} to ${period.to}`
                  : period.type === "thisMonth"
                    ? "This Month"
                    : period.type === "twoMonths"
                      ? "Last 2 Months"
                      : period.type === "thisYear"
                        ? "This Year"
                        : "All Time"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-cow rounded-lg border">
                <h3 className="font-semibold">Cow 🐄</h3>
                <p>Morning: {cowEntries.reduce((s, e) => s + e.morningQty, 0).toFixed(1)} L</p>
                <p>Evening: {cowEntries.reduce((s, e) => s + e.eveningQty, 0).toFixed(1)} L</p>
                <p className="font-bold">Total: {cowTotal.toFixed(1)} L</p>
              </div>
              <div className="p-3 bg-buffalo rounded-lg border">
                <h3 className="font-semibold">Buffalo 🐃</h3>
                <p>Morning: {buffaloEntries.reduce((s, e) => s + e.morningQty, 0).toFixed(1)} L</p>
                <p>Evening: {buffaloEntries.reduce((s, e) => s + e.eveningQty, 0).toFixed(1)} L</p>
                <p className="font-bold">Total: {buffaloTotal.toFixed(1)} L</p>
              </div>
            </div>

            <div className="border-t pt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Daily Breakdown</h3>
                <p className="font-bold">Total Amount: Rs. {totalAmount.toFixed(2)}</p>
              </div>
              <div className="space-y-3">
                {sortedDates.map((date) => {
                  const dayEntries = grouped[date];
                  const dayCow = dayEntries.filter((e) => e.milkType === "cow");
                  const dayBuffalo = dayEntries.filter((e) => e.milkType === "buffalo");
                  const dayCowTotal = dayCow.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
                  const dayBuffaloTotal = dayBuffalo.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
                  const dayAmount = dayEntries.reduce((s, e) => s + (e.morningQty + e.eveningQty) * e.rateUsed, 0);

                  return (
                    <div key={date} className="border rounded-lg overflow-hidden print:break-inside-avoid">
                      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                        <span className="font-medium">{date}</span>
                        <span className="text-sm text-gray-600">
                          Cow: {dayCowTotal.toFixed(1)}L | Buffalo: {dayBuffaloTotal.toFixed(1)}L | Rs. {dayAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
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
                                <td className="py-1 px-2">{selected?.name}</td>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SlipClient({ initialFarmerId }: { initialFarmerId?: string }) {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <SlipInner initialFarmerId={initialFarmerId} />
    </Suspense>
  );
}
