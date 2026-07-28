"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import MilkTypeToggle from "@/components/MilkTypeToggle";
import { getTodayBs } from "@/lib/nepali-dates";
import { saveEntryLocal, queueForSync } from "@/lib/indexed-db";

interface Farmer {
  _id: string;
  name: string;
  code: string;
}

export default function DailyEntry() {
  const searchParams = useSearchParams();
  const preselectedFarmer = searchParams.get("farmerId") || "";
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [milkType, setMilkType] = useState<"cow" | "buffalo">("cow");
  const [dateBS, setDateBS] = useState(getTodayBs());
  const [entries, setEntries] = useState<Record<string, { morning: string; evening: string; fat: string }>>({});

  useEffect(() => {
    fetch("/api/farmers")
      .then((r) => r.json())
      .then(setFarmers);
  }, []);

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
      rateUsed: 0,
      synced: false,
      editHistory: [],
      createdAt: new Date().toISOString(),
    };
    await saveEntryLocal(entry);
    await queueForSync({ id: entry.id, collection: "entries", data: entry, timestamp: Date.now() });
    setEntries((prev) => {
      const next = { ...prev };
      delete next[farmerId];
      return next;
    });
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
          return (
            <div key={f._id} className={`p-4 rounded-xl border ${preselectedFarmer === f._id ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-large">{f.name} ({f.code})</p>
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
