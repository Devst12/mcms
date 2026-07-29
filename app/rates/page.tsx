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
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Rates ⚙️</h1>

      <div className="p-4 bg-white rounded-xl border">
        <h2 className="font-semibold mb-2">Current Rate Slabs (Cow 🐄)</h2>
        {cowRateSlabs.length === 0 && <p className="text-gray-500">No rate slabs defined</p>}
        {cowRateSlabs.map((slab) => (
          <div key={slab._id} className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Effective from: {slab.effectiveFromAD}</p>
            <div className="mt-2 space-y-1">
              {slab.slabs.map((s, i) => (
                <p key={i} className="text-base">{s.minFat}% - {s.maxFat}%: Rs. {s.rate}/L</p>
              ))}
            </div>
          </div>
        ))}
        <form onSubmit={(e) => handleSubmit(e, "cow")} className="mt-4 p-3 bg-cow rounded-lg border">
          <h3 className="font-semibold mb-2">Add Cow Rate Slab</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <input type="date" value={effectiveFromAD} onChange={(e) => setEffectiveFromAD(e.target.value)} required className="px-3 py-2 border rounded-lg min-h-touch" />
          </div>
          <div className="space-y-2 mb-2">
            {cowSlabs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input type="number" step="0.1" value={s.minFat} onChange={(e) => updateSlab("cow", i, "minFat", e.target.value)} placeholder="Min Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
                <input type="number" step="0.1" value={s.maxFat} onChange={(e) => updateSlab("cow", i, "maxFat", e.target.value)} placeholder="Max Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
                <input type="number" step="0.1" value={s.rate} onChange={(e) => updateSlab("cow", i, "rate", e.target.value)} placeholder="Rate" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addSlabRow("cow")} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm mr-2">+ Add Row</button>
          <button type="submit" className="px-4 py-2 min-h-touch bg-green-600 text-white rounded-lg font-medium">Save Cow Slab</button>
        </form>
      </div>

      <div className="p-4 bg-white rounded-xl border">
        <h2 className="font-semibold mb-2">Current Rate Slabs (Buffalo 🐃)</h2>
        {buffaloRateSlabs.length === 0 && <p className="text-gray-500">No rate slabs defined</p>}
        {buffaloRateSlabs.map((slab) => (
          <div key={slab._id} className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Effective from: {slab.effectiveFromAD}</p>
            <div className="mt-2 space-y-1">
              {slab.slabs.map((s, i) => (
                <p key={i} className="text-base">{s.minFat}% - {s.maxFat}%: Rs. {s.rate}/L</p>
              ))}
            </div>
          </div>
        ))}
        <form onSubmit={(e) => handleSubmit(e, "buffalo")} className="mt-4 p-3 bg-buffalo rounded-lg border">
          <h3 className="font-semibold mb-2">Add Buffalo Rate Slab</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <input type="date" value={effectiveFromAD} onChange={(e) => setEffectiveFromAD(e.target.value)} required className="px-3 py-2 border rounded-lg min-h-touch" />
          </div>
          <div className="space-y-2 mb-2">
            {buffaloSlabs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input type="number" step="0.1" value={s.minFat} onChange={(e) => updateSlab("buffalo", i, "minFat", e.target.value)} placeholder="Min Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
                <input type="number" step="0.1" value={s.maxFat} onChange={(e) => updateSlab("buffalo", i, "maxFat", e.target.value)} placeholder="Max Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
                <input type="number" step="0.1" value={s.rate} onChange={(e) => updateSlab("buffalo", i, "rate", e.target.value)} placeholder="Rate" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addSlabRow("buffalo")} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm mr-2">+ Add Row</button>
          <button type="submit" className="px-4 py-2 min-h-touch bg-green-600 text-white rounded-lg font-medium">Save Buffalo Slab</button>
        </form>
      </div>
    </div>
  );
}
