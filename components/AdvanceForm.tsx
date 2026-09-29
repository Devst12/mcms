"use client";

import { useState } from "react";
import { getTodayBs } from "@/lib/nepali-dates";
import { saveAdvanceLocal, queueForSync } from "@/lib/indexed-db";

interface Farmer {
  _id: string;
  name: string;
  code: string;
}

interface AdvanceFormProps {
  farmers: Farmer[];
  onAdvanceAdded: () => void;
}

export default function AdvanceForm({ farmers, onAdvanceAdded }: AdvanceFormProps) {
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer || saving) return;
    setSaving(true);
    try {
      const dateAd = new Date().toISOString().split("T")[0];
      const dateBs = getTodayBs();
      const advance = {
        id: `adv_${Date.now()}`,
        farmerId: selectedFarmer,
        dateAD: dateAd,
        dateBS: dateBs,
        amount: parseFloat(amount),
        note,
        settled: false,
        createdAt: new Date().toISOString(),
      };
      await saveAdvanceLocal(advance);
      await queueForSync({ id: advance.id, collection: "advances", data: advance, timestamp: Date.now() });
      setAmount("");
      setNote("");
      onAdvanceAdded();
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-lg bg-gray-50 text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 placeholder:font-normal outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white shadow-sm px-4 py-4 space-y-3">
      <h2 className="text-[13px] font-bold text-gray-900">नयाँ अग्रिम थप्नुहोस्</h2>
      <select
        value={selectedFarmer}
        onChange={(e) => setSelectedFarmer(e.target.value)}
        required
        className={inputClass}
      >
        <option value="">किसान छान्नुहोस्</option>
        {farmers.map((f) => (
          <option key={f._id} value={f._id}>
            {f.name} ({f.code})
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.01"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="रकम (Rs.)"
        required
        className={inputClass}
      />
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="कैफियत (वैकल्पिक)"
        className={inputClass}
      />
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-[14px] shadow-sm disabled:opacity-40 active:opacity-80 transition-opacity"
      >
        {saving ? "Saving…" : "Add Advance"}
      </button>
    </form>
  );
}
