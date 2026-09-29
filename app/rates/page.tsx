"use client";

import { useState, useEffect } from "react";
import { getTodayAd } from "@/lib/nepali-dates";

interface RateSlab {
  _id: string;
  milkType: "cow" | "buffalo";
  effectiveFromAD: string;
  slabs: { minFat: number; maxFat: number; rate: number }[];
}

type MilkType = "cow" | "buffalo";

interface SlabRow {
  minFat: string;
  maxFat: string;
  rate: string;
}

const MILK_ACCENT = {
  cow: { soft: "bg-amber-50", heading: "text-amber-800" },
  buffalo: { soft: "bg-teal-50", heading: "text-teal-800" },
} as const;

const inputClass =
  "w-full px-3 py-2.5 rounded-lg bg-gray-50 text-[14px] font-semibold text-center tabular-nums text-gray-900 placeholder:text-gray-300 placeholder:font-normal outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow";

const emptyRow = (): SlabRow => ({ minFat: "", maxFat: "", rate: "" });

function SlabList({ type, list }: { type: MilkType; list: RateSlab[] }) {
  const accent = MILK_ACCENT[type];
  if (list.length === 0) {
    return <p className="text-[12.5px] text-gray-400 mb-3">अझै दर तोकिएको छैन।</p>;
  }
  return (
    <div className="space-y-2.5">
      {list.map((slab) => (
        <div key={slab._id} className={`rounded-xl ${accent.soft} px-3.5 py-3`}>
          <p className={`text-[11px] font-bold mb-2 ${accent.heading}`}>
            लागू: {slab.effectiveFromAD}
          </p>
          <div className="space-y-1">
            {slab.slabs.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
              >
                <span className="text-[13px] font-semibold tabular-nums text-gray-700">
                  {s.minFat}% – {s.maxFat}%
                </span>
                <span className="text-[13px] font-bold tabular-nums text-gray-900">Rs. {s.rate}/L</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlabForm({
  type,
  rows,
  onRowsChange,
  effectiveFromAD,
  onEffectiveFromChange,
  onSubmit,
  saving,
}: {
  type: MilkType;
  rows: SlabRow[];
  onRowsChange: (rows: SlabRow[]) => void;
  effectiveFromAD: string;
  onEffectiveFromChange: (v: string) => void;
  onSubmit: (e: React.FormEvent, type: MilkType) => void;
  saving: boolean;
}) {
  const updateRow = (index: number, field: keyof SlabRow, value: string) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    onRowsChange(next);
  };

  return (
    <details className="mt-3">
      <summary className="text-[13px] font-bold text-gray-600 hover:text-gray-900 cursor-pointer transition-colors select-none">
        + नयाँ दर थप्नुहोस्
      </summary>
      <form onSubmit={(e) => onSubmit(e, type)} className="mt-3 space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            लागू हुने मिति (AD)
          </label>
          <input
            type="date"
            value={effectiveFromAD}
            onChange={(e) => onEffectiveFromChange(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          {rows.map((s, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={s.minFat}
                onChange={(e) => updateRow(i, "minFat", e.target.value)}
                placeholder="Min %"
                required
                className={inputClass}
              />
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={s.maxFat}
                onChange={(e) => updateRow(i, "maxFat", e.target.value)}
                placeholder="Max %"
                required
                className={inputClass}
              />
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={s.rate}
                onChange={(e) => updateRow(i, "rate", e.target.value)}
                placeholder="Rs."
                required
                className={inputClass}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onRowsChange([...rows, emptyRow()])}
            className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-[13px] hover:bg-gray-200 transition-colors"
          >
            + पङ्क्ति
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold text-[13px] shadow-sm disabled:opacity-40 active:opacity-80 transition-opacity"
          >
            {saving ? "Saving…" : type === "cow" ? "गाई दर सेभ गर्नुहोस्" : "भैंसी दर सेभ गर्नुहोस्"}
          </button>
        </div>
      </form>
    </details>
  );
}

export default function RatesPage() {
  const [slabs, setSlabs] = useState<RateSlab[]>([]);
  const [effectiveFromAD, setEffectiveFromAD] = useState(getTodayAd());
  const [cowRows, setCowRows] = useState<SlabRow[]>([emptyRow()]);
  const [buffaloRows, setBuffaloRows] = useState<SlabRow[]>([emptyRow()]);
  const [saving, setSaving] = useState<MilkType | null>(null);

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSlabs(data);
      });
  }, []);

  const cowRateSlabs = slabs
    .filter((s) => s.milkType === "cow")
    .sort((a, b) => b.effectiveFromAD.localeCompare(a.effectiveFromAD));
  const buffaloRateSlabs = slabs
    .filter((s) => s.milkType === "buffalo")
    .sort((a, b) => b.effectiveFromAD.localeCompare(a.effectiveFromAD));

  const handleSubmit = async (e: React.FormEvent, type: MilkType) => {
    e.preventDefault();
    const slabRows = type === "cow" ? cowRows : buffaloRows;
    const parsed = slabRows
      .filter((s) => s.minFat && s.maxFat && s.rate)
      .map((s) => ({ minFat: parseFloat(s.minFat), maxFat: parseFloat(s.maxFat), rate: parseFloat(s.rate) }))
      .filter((s) => !isNaN(s.minFat) && !isNaN(s.maxFat) && !isNaN(s.rate));

    if (parsed.length === 0) return;

    setSaving(type);
    try {
      await fetch("/api/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milkType: type, effectiveFromAD, slabs: parsed }),
      });

      const refreshed = await fetch("/api/rates").then((r) => r.json());
      if (Array.isArray(refreshed)) setSlabs(refreshed);

      if (type === "cow") setCowRows([emptyRow()]);
      else setBuffaloRows([emptyRow()]);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Header */}
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">दरहरू</h1>

        {/* Cow Rate Slabs */}
        <div className="rounded-2xl bg-white shadow-sm px-4 py-4">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900 mb-3">
            <span className="text-base leading-none">🐄</span> गाई दर
          </h2>
          <SlabList type="cow" list={cowRateSlabs} />
          <SlabForm
            type="cow"
            rows={cowRows}
            onRowsChange={setCowRows}
            effectiveFromAD={effectiveFromAD}
            onEffectiveFromChange={setEffectiveFromAD}
            onSubmit={handleSubmit}
            saving={saving === "cow"}
          />
        </div>

        {/* Buffalo Rate Slabs */}
        <div className="rounded-2xl bg-white shadow-sm px-4 py-4">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900 mb-3">
            <span className="text-base leading-none">🐃</span> भैंसी दर
          </h2>
          <SlabList type="buffalo" list={buffaloRateSlabs} />
          <SlabForm
            type="buffalo"
            rows={buffaloRows}
            onRowsChange={setBuffaloRows}
            effectiveFromAD={effectiveFromAD}
            onEffectiveFromChange={setEffectiveFromAD}
            onSubmit={handleSubmit}
            saving={saving === "buffalo"}
          />
        </div>
      </div>
    </div>
  );
}
