"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getFarmers, getEntries } from "@/lib/db";

interface EntryData {
  _id: string;
  dateAD: string;
  dateBS: string;
  farmerId: string;
  milkType: "cow" | "buffalo";
  morningQty: number;
  eveningQty: number;
  fatPercent: number;
  rateUsed: number;
}

export default function SlipClient({ initialFarmerId }: { initialFarmerId?: string }) {
  const searchParams = useSearchParams();
  const farmerId = initialFarmerId || searchParams.get("farmerId") || "";
  const [farmers, setFarmers] = useState<any[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState(farmerId);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [period, setPeriod] = useState("thisMonth");

  useEffect(() => {
    fetch("/api/farmers")
      .then((r) => r.json())
      .then(setFarmers);
  }, []);

  const loadEntries = async () => {
    if (!selectedFarmer) return;
    const now = new Date();
    let from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    if (period === "twoMonths") {
      const fromMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const fromYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      from = `${fromYear}-${String(fromMonth + 1).padStart(2, "0")}-01`;
    }
    const res = await fetch(`/api/entries?farmerId=${selectedFarmer}&dateFrom=${from}`);
    const data = await res.json();
    setEntries(data);
  };

  useEffect(() => {
    loadEntries();
  }, [selectedFarmer, period]);

  const print = () => {
    window.print();
  };

  const selected = farmers.find((f) => f._id === selectedFarmer);
  const cowEntries = entries.filter((e) => e.milkType === "cow");
  const buffaloEntries = entries.filter((e) => e.milkType === "buffalo");

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Slip 🧾 पर्ची</h1>
        <button onClick={print} className="px-4 py-3 min-h-touch bg-gray-600 text-white rounded-lg font-medium">
          Print
        </button>
      </div>
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
      <div className="flex gap-2">
        <button onClick={() => setPeriod("thisMonth")} className={`px-4 py-2 min-h-touch rounded-lg ${period === "thisMonth" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>This Month</button>
        <button onClick={() => setPeriod("twoMonths")} className={`px-4 py-2 min-h-touch rounded-lg ${period === "twoMonths" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>2 Months</button>
      </div>
      {selected && (
        <div className="p-4 bg-white rounded-xl border print:border-0">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">Milk Collection Slip</h2>
            <p>{selected.name} | {selected.code}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-semibold">Cow 🐄</h3>
              <p>Morning: {cowEntries.reduce((s, e) => s + e.morningQty, 0).toFixed(1)} L</p>
              <p>Evening: {cowEntries.reduce((s, e) => s + e.eveningQty, 0).toFixed(1)} L</p>
              <p>Total: {(cowEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0)).toFixed(1)} L</p>
            </div>
            <div>
              <h3 className="font-semibold">Buffalo 🐃</h3>
              <p>Morning: {buffaloEntries.reduce((s, e) => s + e.morningQty, 0).toFixed(1)} L</p>
              <p>Evening: {buffaloEntries.reduce((s, e) => s + e.eveningQty, 0).toFixed(1)} L</p>
              <p>Total: {(buffaloEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0)).toFixed(1)} L</p>
            </div>
          </div>
          <div className="border-t pt-2">
            <h3 className="font-semibold mb-2">Daily Breakdown</h3>
            <div className="space-y-1">
              {entries.map((e) => (
                <div key={e._id} className="flex justify-between text-sm">
                  <span>{e.dateBS}</span>
                  <span>{e.milkType}: {e.morningQty} + {e.eveningQty} = {e.morningQty + e.eveningQty}L</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
