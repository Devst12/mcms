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

  const farmerMap = new Map(farmers.map((f) => [f._id, `${f.name} (${f.code})`]));

  const pendingAdvances = advances.filter((a) => !a.settled);
  const settledAdvances = advances.filter((a) => a.settled);
  const totalPending = pendingAdvances.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advances 💰</h1>
          <p className="text-sm text-gray-600 font-medium">
            {pendingAdvances.length} pending · Rs. {totalPending.toFixed(2)}
          </p>
        </div>
      </div>

      <AdvanceForm farmers={farmers} onAdvanceAdded={loadAdvances} />

      {/* Pending Advances */}
      {pendingAdvances.length > 0 && (
        <div className="card border-amber-400 bg-amber-50">
          <h2 className="text-lg font-bold mb-3 text-amber-800">Pending Advances</h2>
          <div className="space-y-2">
            {pendingAdvances.map((a) => (
              <div key={a._id} className="flex items-center justify-between bg-white border-2 border-amber-300 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-sm">{farmerMap.get(a.farmerId) || a.farmerId}</p>
                  <p className="text-xs text-gray-600">{a.dateBS} · {a.note || "Advance"}</p>
                </div>
                <p className="font-bold text-lg text-red-600 tabular-nums">Rs. {a.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settled Advances */}
      {settledAdvances.length > 0 && (
        <details className="card border-green-300 bg-green-50/30">
          <summary className="font-bold text-sm text-green-700 cursor-pointer">
            Settled ({settledAdvances.length})
          </summary>
          <div className="mt-3 space-y-2">
            {settledAdvances.map((a) => (
              <div key={a._id} className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl px-4 py-3 opacity-60">
                <div>
                  <p className="font-bold text-sm">{farmerMap.get(a.farmerId) || a.farmerId}</p>
                  <p className="text-xs text-gray-600">{a.dateBS} · {a.note || "Advance"}</p>
                </div>
                <p className="font-bold text-sm text-gray-400 line-through tabular-nums">Rs. {a.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {advances.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">💰</p>
          <h2 className="text-xl font-bold mb-2">No advances yet</h2>
          <p className="text-gray-600">Use the form above to give an advance to a farmer.</p>
        </div>
      )}
    </div>
  );
}
