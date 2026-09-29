"use client";

import { useState } from "react";
import { getTodayBs } from "@/lib/nepali-dates";
import { saveCompanyCollectionLocal, queueForSync } from "@/lib/indexed-db";

export default function CompanyEntry() {
  const [dateBS, setDateBS] = useState(getTodayBs());
  const [cowQty, setCowQty] = useState("");
  const [buffaloQty, setBuffaloQty] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState<"cow" | "buffalo" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSave = async (milkType: "cow" | "buffalo") => {
    const qty = parseFloat(milkType === "cow" ? cowQty : buffaloQty);
    if (isNaN(qty) || qty <= 0) {
      showToast("कृपया सही परिमाण लेख्नुहोस्");
      return;
    }
    setSaving(milkType);
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
      showToast(`${qty}L सेभ भयो ✓`);
      if (milkType === "cow") setCowQty("");
      else setBuffaloQty("");
    } catch {
      showToast("सेभ गर्न सकिएन");
    } finally {
      setSaving(null);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-lg bg-white text-center text-[18px] font-bold tabular-nums text-gray-900 placeholder:text-gray-300 placeholder:font-normal outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Header */}
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">कम्पनी संकलन</h1>

        {/* Date */}
        <div className="rounded-2xl bg-white shadow-sm px-4 py-4">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            मिति (BS)
          </label>
          <input
            type="text"
            value={dateBS}
            onChange={(e) => setDateBS(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 text-center text-[15px] font-semibold tabular-nums text-gray-900 outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow"
            placeholder="YYYY-MM-DD"
          />
        </div>

        {/* Cow */}
        <div className="rounded-2xl bg-amber-50 px-4 py-4 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">🐄</span>
            <h2 className="text-[13px] font-bold text-amber-800">गाई दूध</h2>
          </div>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={cowQty}
            onChange={(e) => setCowQty(e.target.value)}
            placeholder="0.0"
            className={inputClass}
          />
          <button
            onClick={() => handleSave("cow")}
            disabled={saving !== null}
            className="w-full py-2.5 rounded-lg bg-gray-900 text-white font-bold text-[13.5px] shadow-sm disabled:opacity-40 active:opacity-80 transition-opacity"
          >
            {saving === "cow" ? "Saving…" : "सेभ गर्नुहोस्"}
          </button>
        </div>

        {/* Buffalo */}
        <div className="rounded-2xl bg-teal-50 px-4 py-4 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">🐃</span>
            <h2 className="text-[13px] font-bold text-teal-800">भैंसी दूध</h2>
          </div>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={buffaloQty}
            onChange={(e) => setBuffaloQty(e.target.value)}
            placeholder="0.0"
            className={inputClass}
          />
          <button
            onClick={() => handleSave("buffalo")}
            disabled={saving !== null}
            className="w-full py-2.5 rounded-lg bg-gray-900 text-white font-bold text-[13.5px] shadow-sm disabled:opacity-40 active:opacity-80 transition-opacity"
          >
            {saving === "buffalo" ? "Saving…" : "सेभ गर्नुहोस्"}
          </button>
        </div>

        {/* Notes */}
        <div className="rounded-2xl bg-white shadow-sm px-4 py-4">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            कैफियत (वैकल्पिक)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="आजको संकलनबारे कैफियत…"
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 text-[14px] font-medium text-gray-900 placeholder:text-gray-300 outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow resize-none"
          />
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-24 left-4 right-4 z-50">
            <div className="bg-gray-900 text-white text-center py-3 px-4 rounded-full font-semibold text-[13px] shadow-lg max-w-sm mx-auto">
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
