"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MilkTypeToggle from "@/components/MilkTypeToggle";
import { getTodayBs } from "@/lib/nepali-dates";
import { saveEntryLocal, queueForSync } from "@/lib/indexed-db";

export const dynamic = 'force-dynamic';

interface Farmer {
  _id: string;
  name: string;
  code: string;
}

function resolveRate(fatPercent: number, slabs: { minFat: number; maxFat: number; rate: number }[]): number {
  if (!slabs.length || fatPercent <= 0) return 0;
  const slab = slabs.find(s => fatPercent >= s.minFat && fatPercent < s.maxFat);
  if (!slab) {
    const last = slabs[slabs.length - 1];
    if (fatPercent >= last.minFat) return last.rate;
    return slabs[0]?.rate || 0;
  }
  return slab.rate;
}

function DailyEntryInner() {
  const searchParams = useSearchParams();
  const preselectedFarmer = searchParams.get("farmerId") || "";
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [milkType, setMilkType] = useState<"cow" | "buffalo">("cow");
  const [dateBS, setDateBS] = useState(getTodayBs());
  const [entries, setEntries] = useState<Record<string, { morning: string; evening: string; fat: string }>>({});
  const [slabs, setSlabs] = useState<{ minFat: number; maxFat: number; rate: number }[]>([]);
  const [ratesLoaded, setRatesLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/farmers")
      .then((r) => r.json())
      .then(setFarmers);
  }, []);

  useEffect(() => {
    const loadSlabs = async () => {
      const dateAd = await (await import("@/lib/nepali-dates")).bsToAd(dateBS);
      const res = await fetch(`/api/rates?milkType=${milkType}&dateAD=${dateAd}`);
      if (res.ok) {
        const data = await res.json();
        setSlabs(data?.slabs || []);
      }
      setRatesLoaded(true);
    };
    loadSlabs();
  }, [milkType, dateBS]);

  const updateEntry = (farmerId: string, field: string, value: string) => {
    setEntries((prev) => ({
      ...prev,
      [farmerId]: { ...prev[farmerId], [field]: value },
    }));
  };

  const handleSave = async (farmerId: string) => {
    const e = entries[farmerId];
    if (!e || (!e.morning && !e.evening)) return;
    const morningQty = parseFloat(e.morning) || 0;
    const eveningQty = parseFloat(e.evening) || 0;
    const fatPercent = parseFloat(e.fat) || 0;
    const rateUsed = resolveRate(fatPercent, slabs);
    const dateAd = await (await import("@/lib/nepali-dates")).bsToAd(dateBS);
    const entry = {
      id: `${dateBS}_${farmerId}_${milkType}_${Date.now()}`,
      dateAD: dateAd,
      dateBS,
      farmerId,
      milkType,
      morningQty,
      eveningQty,
      fatPercent,
      rateUsed,
      synced: false,
      editHistory: [],
      createdAt: new Date().toISOString(),
    };
    try {
      await saveEntryLocal(entry);
      await queueForSync({ id: entry.id, collection: "entries", data: entry, timestamp: Date.now() });
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error("Failed to sync entry");
    } catch (err) {
      console.error("Save entry failed", err);
      alert("Failed to save entry. Please try again.");
      return;
    }
    setEntries((prev) => {
      const next = { ...prev };
      delete next[farmerId];
      return next;
    });
  };

  const getRateForFarmer = (farmerId: string) => {
    const e = entries[farmerId];
    if (!e || !e.fat) return null;
    const fat = parseFloat(e.fat) || 0;
    return resolveRate(fat, slabs);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Daily Entry 📝</h1>
      <div className="flex items-center gap-4">
        <MilkTypeToggle value={milkType} onChange={setMilkType} />
        <input
          type="text"
          value={dateBS}
          onChange={(e) => setDateBS(e.target.value)}
          className="px-4 py-3 min-h-touch border rounded-lg text-base w-40"
        />
      </div>
      <div className="space-y-3">
        {farmers.map((f) => {
          const e = entries[f._id] || {};
          const previewRate = getRateForFarmer(f._id);
          return (
            <div key={f._id} className={`p-4 rounded-xl border ${preselectedFarmer === f._id ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-large">{f.name} ({f.code})</p>
                {previewRate !== null && (
                  <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    Rate: Rs. {previewRate}/L
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-gray-600">☀️ Morning (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={e.morning || ""}
                    onChange={(e) => updateEntry(f._id, "morning", e.target.value)}
                    className="w-full px-3 py-2 min-h-touch border rounded-lg text-base"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">🌙 Evening (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={e.evening || ""}
                    onChange={(e) => updateEntry(f._id, "evening", e.target.value)}
                    className="w-full px-3 py-2 min-h-touch border rounded-lg text-base"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={e.fat || ""}
                    onChange={(e) => updateEntry(f._id, "fat", e.target.value)}
                    className="w-full px-3 py-2 min-h-touch border rounded-lg text-base"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => handleSave(f._id)}
                    className="w-full px-4 py-2 min-h-touch bg-green-600 text-white rounded-lg font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DailyEntry() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <DailyEntryInner />
    </Suspense>
  );
}
