"use client";

import { useState } from "react";

interface FarmerData {
  _id: string;
  name: string;
  code: string;
}

interface PaymentData {
  _id: string;
  farmerId: string;
  month: string;
  totalLiters: number;
  milkAmount: number;
  advancesDeducted: number;
  finalAmount: number;
  paid: boolean;
}

export default function PaymentsClient({ payments, farmers }: { payments: PaymentData[]; farmers: FarmerData[] }) {
  const [data, setData] = useState(payments);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const farmerMap = new Map(farmers.map((f) => [f._id, `${f.name} (${f.code})`]));

  const handleMarkPaid = async (id: string) => {
    const res = await fetch(`/api/payments/${id}/pay`, { method: "POST" });
    if (res.ok) {
      setData(data.map((p) => (p._id === id ? { ...p, paid: true } : p)));
      showToast("Marked as paid ✓");
    } else {
      showToast("Failed to mark as paid");
    }
  };

  const unpaid = data.filter((p) => !p.paid);
  const paid = data.filter((p) => p.paid);

  return (
    <div className="space-y-4">
      {unpaid.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
            Unpaid ({unpaid.length})
          </h2>
          {unpaid.map((p) => (
            <div key={p._id} className="card border-red-300 bg-red-50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-base">{farmerMap.get(p.farmerId) || p.farmerId}</p>
                  <p className="text-xs text-gray-600">{p.month}</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 border-2 border-red-400 rounded-lg text-xs font-bold">
                  Unpaid
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                  <p className="text-xs text-gray-500">Milk Total</p>
                  <p className="font-bold tabular-nums">{p.totalLiters.toFixed(1)} L</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                  <p className="text-xs text-gray-500">Milk Amount</p>
                  <p className="font-bold tabular-nums">Rs. {p.milkAmount.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                  <p className="text-xs text-gray-500">Advance Deducted</p>
                  <p className="font-bold tabular-nums text-red-600">- Rs. {p.advancesDeducted.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 border border-green-300">
                  <p className="text-xs text-gray-500">Final Amount</p>
                  <p className="font-bold tabular-nums text-green-700">Rs. {p.finalAmount.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={() => handleMarkPaid(p._id)}
                className="w-full px-4 py-3 min-h-touch bg-green-600 text-white rounded-xl font-bold text-sm shadow-[2px_2px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                ✓ Mark as Paid
              </button>
            </div>
          ))}
        </div>
      )}

      {paid.length > 0 && (
        <details className="card border-green-400 bg-green-50/30">
          <summary className="font-bold text-sm text-green-700 cursor-pointer">
            Paid ({paid.length})
          </summary>
          <div className="mt-3 space-y-2">
            {paid.map((p) => (
              <div key={p._id} className="flex items-center justify-between bg-white border-2 border-green-200 rounded-xl px-4 py-3 opacity-70">
                <div>
                  <p className="font-bold text-sm">{farmerMap.get(p.farmerId) || p.farmerId}</p>
                  <p className="text-xs text-gray-600">{p.month}</p>
                </div>
                <p className="font-bold text-sm text-green-700 tabular-nums">
                  Rs. {p.finalAmount.toFixed(2)} ✓
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      {data.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">💵</p>
          <h2 className="text-xl font-bold mb-2">No payments found</h2>
          <p className="text-gray-600">Generate payments from the reports section.</p>
        </div>
      )}

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
