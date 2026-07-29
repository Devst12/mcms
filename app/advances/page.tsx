"use client";

import { useState, useEffect } from "react";
import AdvanceForm from "@/components/AdvanceForm";

export default function AdvancesPage() {
  const [farmers, setFarmers] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [advances, setAdvances] = useState<Array<{
    _id: string;
    farmerId: string;
    dateAD: string;
    dateBS: string;
    amount: number;
    note: string;
    settled: boolean;
    createdAt: string;
  }>>([]);

  const loadFarmers = () => {
    fetch("/api/farmers")
      .then((r) => r.json())
      .then(setFarmers);
  };

  const loadAdvances = () => {
    fetch("/api/advances")
      .then((r) => r.json())
      .then(setAdvances);
  };

  useEffect(() => {
    loadFarmers();
    loadAdvances();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Advances 💰</h1>
      <AdvanceForm farmers={farmers} onAdvanceAdded={loadAdvances} />
      <div className="p-4 bg-white rounded-xl border">
        <h2 className="font-semibold mb-2">Recent Advances</h2>
        <div className="space-y-2">
          {advances.map((a) => (
            <div key={a._id} className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">{a.note || "Advance"}</p>
                <p className="text-sm text-gray-600">{a.dateBS} | {a.farmerId}</p>
              </div>
              <p className={`font-bold ${a.settled ? "text-gray-400 line-through" : "text-red-600"}`}>
                Rs. {a.amount.toFixed(2)}
              </p>
            </div>
          ))}
          {advances.length === 0 && <p className="text-gray-500">No advances yet</p>}
        </div>
      </div>
    </div>
  );
}