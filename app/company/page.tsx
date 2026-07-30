"use client";

import { useState } from "react";
import { getTodayBs } from "@/lib/nepali-dates";
import { saveCompanyCollectionLocal, queueForSync } from "@/lib/indexed-db";

export default function CompanyEntry() {
  const [dateBS, setDateBS] = useState(getTodayBs());
  const [cowQty, setCowQty] = useState("");
  const [buffaloQty, setBuffaloQty] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSave = async (milkType: "cow" | "buffalo") => {
    const qty = parseFloat(milkType === "cow" ? cowQty : buffaloQty);
    if (isNaN(qty) || qty <= 0) {
      showToast("Please enter a valid quantity");
      return;
    }
    setSaving(true);
    try {
      const dateAd = await (await import("@/lib/nepali-dates")).bsToAd(dateBS);
      const cc = {
        id: `${dateBS}_${milkType}`,
        dateAD: dateAd,
        dateBS,
        milkType,
        reportedQty: qty,
        notes: note,
        synced: false,
        createdAt: new Date().toISOString(),
      };
      await saveCompanyCollectionLocal(cc);
      await queueForSync({ id: cc.id, collection: "company_collections", data: cc, timestamp: Date.now() });
      showToast(`Saved: ${qty}L ${milkType} ✓`);
      if (milkType === "cow") setCowQty("");
      else setBuffaloQty("");
    } catch {
      showToast("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-8">
      <h1 className="text-2xl font-bold">Company Entry 🏢</h1>

      <div className="card">
        <p className="text-sm font-bold text-gray-600 mb-2">Date (BS)</p>
        <input
          type="text"
          value={dateBS}
          onChange={(e) => setDateBS(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white text-center"
          placeholder="YYYY-MM-DD"
        />
      </div>

      <div className="card bg-cow border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🐄</span>
          <h2 className="text-lg font-bold">Cow Milk</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600">Quantity (Liters)</label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={cowQty}
              onChange={(e) => setCowQty(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl text-lg font-bold bg-white text-center tabular-nums"
            />
          </div>
          <button
            onClick={() => handleSave("cow")}
            disabled={saving}
            className="w-full px-5 py-3 min-h-touch bg-gray-800 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Cow"}
          </button>
        </div>
      </div>

      <div className="card bg-buffalo border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🐃</span>
          <h2 className="text-lg font-bold">Buffalo Milk</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600">Quantity (Liters)</label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={buffaloQty}
              onChange={(e) => setBuffaloQty(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl text-lg font-bold bg-white text-center tabular-nums"
            />
          </div>
          <button
            onClick={() => handleSave("buffalo")}
            disabled={saving}
            className="w-full px-5 py-3 min-h-touch bg-gray-800 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Buffalo"}
          </button>
        </div>
      </div>

      <div className="card">
        <label className="text-xs font-bold text-gray-600 mb-1 block">Notes (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any notes about today's collection..."
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl text-base bg-white"
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div className="bg-gray-900 text-white text-center py-3 px-4 rounded-xl font-bold text-sm shadow-lg max-w-sm mx-auto">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
