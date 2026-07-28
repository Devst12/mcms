"use client";

import { useState, useEffect } from "react";
import { getTodayBs } from "@/lib/nepali-dates";
import { saveCompanyCollectionLocal, queueForSync } from "@/lib/indexed-db";

export default function CompanyEntry() {
  const [dateBS, setDateBS] = useState(getTodayBs());
  const [cowQty, setCowQty] = useState("");
  const [buffaloQty, setBuffaloQty] = useState("");
  const [note, setNote] = useState("");

  const handleSave = async (milkType: "cow" | "buffalo") => {
    const qty = parseFloat(milkType === "cow" ? cowQty : buffaloQty);
    if (isNaN(qty)) return;
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
    alert("Saved locally");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Company Entry 🏢</h1>
      <input
        type="text"
        value={dateBS}
        onChange={(e) => setDateBS(e.target.value)}
        className="px-4 py-3 min-h-touch border rounded-lg text-base w-40"
      />
      <div className="space-y-4">
        <div className="p-4 bg-cow rounded-xl border-2 border-gray-300">
          <h2 className="font-semibold text-lg mb-2">Cow 🐄</h2>
          <input
            type="number"
            step="0.1"
            value={cowQty}
            onChange={(e) => setCowQty(e.target.value)}
            placeholder="Quantity in Liters"
            className="w-full px-4 py-3 min-h-touch border rounded-lg text-base mb-2"
          />
          <button
            onClick={() => handleSave("cow")}
            className="w-full px-4 py-3 min-h-touch bg-gray-800 text-white rounded-lg font-medium"
          >
            Save Cow
          </button>
        </div>
        <div className="p-4 bg-buffalo rounded-xl border-2 border-gray-600">
          <h2 className="font-semibold text-lg mb-2">Buffalo 🐃</h2>
          <input
            type="number"
            step="0.1"
            value={buffaloQty}
            onChange={(e) => setBuffaloQty(e.target.value)}
            placeholder="Quantity in Liters"
            className="w-full px-4 py-3 min-h-touch border rounded-lg text-base mb-2"
          />
          <button
            onClick={() => handleSave("buffalo")}
            className="w-full px-4 py-3 min-h-touch bg-gray-800 text-white rounded-lg font-medium"
          >
            Save Buffalo
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notes"
          rows={3}
          className="w-full px-4 py-3 border rounded-lg text-base"
        />
      </div>
    </div>
  );
}
