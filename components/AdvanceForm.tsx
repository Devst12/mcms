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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer) return;
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
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-xl border space-y-3">
      <h2 className="font-semibold">Add New Advance</h2>
      <select
        value={selectedFarmer}
        onChange={(e) => setSelectedFarmer(e.target.value)}
        className="w-full px-4 py-3 min-h-touch border rounded-lg text-base"
      >
        <option value="">Select Farmer</option>
        {farmers.map((f) => (
          <option key={f._id} value={f._id}>{f.name} ({f.code})</option>
        ))}
      </select>
      <input
        type="number"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        required
        className="w-full px-4 py-3 min-h-touch border rounded-lg text-base"
      />
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note"
        className="w-full px-4 py-3 min-h-touch border rounded-lg text-base"
      />
      <button type="submit" className="w-full px-4 py-3 min-h-touch bg-blue-600 text-white rounded-lg font-medium">
        Add Advance
      </button>
    </form>
  );
}
