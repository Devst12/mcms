"use client";

import { useState, useEffect } from "react";
import { getTodayAd } from "@/lib/nepali-dates";

interface RateSlab {
  _id: string;
  milkType: "cow" | "buffalo";
  effectiveFromAD: string;
  slabs: { minFat: number; maxFat: number; rate: number }[];
}

export default function RatesPage() {
  const [slabs, setSlabs] = useState<RateSlab[]>([]);
  const [effectiveFromAD, setEffectiveFromAD] = useState(getTodayAd());
  const [cowSlabs, setCowSlabs] = useState([{ minFat: "", maxFat: "", rate: "" }]);
  const [buffaloSlabs, setBuffaloSlabs] = useState([{ minFat: "", maxFat: "", rate: "" }]);

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then(setSlabs);
  }, []);

  const cowRateSlabs = slabs.filter((s) => s.milkType === "cow").sort((a, b) => b.effectiveFromAD.localeCompare(a.effectiveFromAD));
  const buffaloRateSlabs = slabs.filter((s) => s.milkType === "buffalo").sort((a, b) => b.effectiveFromAD.localeCompare(a.effectiveFromAD));

  const handleSubmit = async (e: React.FormEvent, type: "cow" | "buffalo") => {
    e.preventDefault();
    const slabData = type === "cow" ? cowSlabs : buffaloSlabs;
    const parsed = slabData
      .filter((s) => s.minFat && s.maxFat && s.rate)
      .map((s) => ({ minFat: parseFloat(s.minFat), maxFat: parseFloat(s.maxFat), rate: parseFloat(s.rate) }));

    await fetch("/api/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milkType: type, effectiveFromAD, slabs: parsed }),
    });

    const refreshed = await fetch("/api/rates").then((r) => r.json());
    setSlabs(refreshed);
    if (type === "cow") setCowSlabs([{ minFat: "", maxFat: "", rate: "" }]);
    else setBuffaloSlabs([{ minFat: "", maxFat: "", rate: "" }]);
  };

  const updateSlab = (type: "cow" | "buffalo", index: number, field: string, value: string) => {
    if (type === "cow") {
      setCowSlabs((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    } else {
      setBuffaloSlabs((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    }
  };

  const addSlabRow = (type: "cow" | "buffalo") => {
    if (type === "cow") setCowSlabs((prev) => [...prev, { minFat: "", maxFat: "", rate: "" }]);
    else setBuffaloSlabs((prev) => [...prev, { minFat: "", maxFat: "", rate: "" }]);
  };

  return (
    <div className="p-4 space-y-4 pb-8">
      <h1 className="text-2xl font-bold">Rates ⚙️</h1>

      {/* Cow Rate Slabs */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3">🐄 Cow Rate Slabs</h2>
        {cowRateSlabs.length === 0 && (
          <p className="text-gray-500 text-sm mb-3">No rate slabs defined yet.</p>
        )}
        {cowRateSlabs.map((slab) => (
          <div key={slab._id} className="bg-cow border-2 border-gray-300 rounded-xl p-3 mb-3">
            <p className="text-xs font-bold text-gray-600 mb-2">
              Effective: {slab.effectiveFromAD}
            </p>
            <div className="space-y-1">
              {slab.slabs.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200">
                  <span className="text-sm font-bold">{s.minFat}% – {s.maxFat}%</span>
                  <span className="text-sm font-bold text-green-700 tabular-nums">Rs. {s.rate}/L</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Add new cow slab form */}
        <details className="mt-3">
          <summary className="text-sm font-bold text-blue-600 cursor-pointer">+ Add Cow Rate Slab</summary>
          <form onSubmit={(e) => handleSubmit(e, "cow")} className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-600">Effective Date (AD)</label>
              <input
                type="date"
                value={effectiveFromAD}
                onChange={(e) => setEffectiveFromAD(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white"
              />
            </div>
            <div className="space-y-2">
              {cowSlabs.map((s, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={s.minFat}
                    onChange={(e) => updateSlab("cow", i, "minFat", e.target.value)}
                    placeholder="Min Fat %"
                    required
                    className="px-3 py-3 border-2 border-gray-800 rounded-xl text-sm font-bold text-center"
                  />
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={s.maxFat}
                    onChange={(e) => updateSlab("cow", i, "maxFat", e.target.value)}
                    placeholder="Max Fat %"
                    required
                    className="px-3 py-3 border-2 border-gray-800 rounded-xl text-sm font-bold text-center"
                  />
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={s.rate}
                    onChange={(e) => updateSlab("cow", i, "rate", e.target.value)}
                    placeholder="Rate Rs."
                    required
                    className="px-3 py-3 border-2 border-gray-800 rounded-xl text-sm font-bold text-center"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addSlabRow("cow")}
                className="px-4 py-3 min-h-touch bg-gray-200 text-gray-700 rounded-xl font-bold text-sm border-2 border-gray-400"
              >
                + Add Row
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 min-h-touch bg-green-600 text-white rounded-xl font-bold text-sm shadow-[2px_2px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                Save Cow Slab
              </button>
            </div>
          </form>
        </details>
      </div>

      {/* Buffalo Rate Slabs */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3">🐃 Buffalo Rate Slabs</h2>
        {buffaloRateSlabs.length === 0 && (
          <p className="text-gray-500 text-sm mb-3">No rate slabs defined yet.</p>
        )}
        {buffaloRateSlabs.map((slab) => (
          <div key={slab._id} className="bg-buffalo border-2 border-gray-600 rounded-xl p-3 mb-3">
            <p className="text-xs font-bold text-gray-700 mb-2">
              Effective: {slab.effectiveFromAD}
            </p>
            <div className="space-y-1">
              {slab.slabs.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-300">
                  <span className="text-sm font-bold">{s.minFat}% – {s.maxFat}%</span>
                  <span className="text-sm font-bold text-green-700 tabular-nums">Rs. {s.rate}/L</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Add new buffalo slab form */}
        <details className="mt-3">
          <summary className="text-sm font-bold text-blue-600 cursor-pointer">+ Add Buffalo Rate Slab</summary>
          <form onSubmit={(e) => handleSubmit(e, "buffalo")} className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-600">Effective Date (AD)</label>
              <input
                type="date"
                value={effectiveFromAD}
                onChange={(e) => setEffectiveFromAD(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white"
              />
            </div>
            <div className="space-y-2">
              {buffaloSlabs.map((s, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={s.minFat}
                    onChange={(e) => updateSlab("buffalo", i, "minFat", e.target.value)}
                    placeholder="Min Fat %"
                    required
                    className="px-3 py-3 border-2 border-gray-800 rounded-xl text-sm font-bold text-center"
                  />
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={s.maxFat}
                    onChange={(e) => updateSlab("buffalo", i, "maxFat", e.target.value)}
                    placeholder="Max Fat %"
                    required
                    className="px-3 py-3 border-2 border-gray-800 rounded-xl text-sm font-bold text-center"
                  />
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={s.rate}
                    onChange={(e) => updateSlab("buffalo", i, "rate", e.target.value)}
                    placeholder="Rate Rs."
                    required
                    className="px-3 py-3 border-2 border-gray-800 rounded-xl text-sm font-bold text-center"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addSlabRow("buffalo")}
                className="px-4 py-3 min-h-touch bg-gray-200 text-gray-700 rounded-xl font-bold text-sm border-2 border-gray-400"
              >
                + Add Row
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 min-h-touch bg-green-600 text-white rounded-xl font-bold text-sm shadow-[2px_2px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                Save Buffalo Slab
              </button>
            </div>
          </form>
        </details>
      </div>
    </div>
  );
}
