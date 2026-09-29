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

  const farmerMap = new Map(
    (Array.isArray(farmers) ? farmers : []).map((f) => [f._id, `${f.name} (${f.code})`])
  );

  const handleMarkPaid = async (id: string) => {
    const res = await fetch(`/api/payments/${id}/pay`, { method: "POST" });
    if (res.ok) {
      setData(data.map((p) => (p._id === id ? { ...p, paid: true } : p)));
      showToast("भुक्तानी भयो ✓");
    } else {
      showToast("असफल भयो");
    }
  };

  const unpaid = data.filter((p) => !p.paid);
  const paid = data.filter((p) => p.paid);

  return (
    <div className="space-y-4">
      {unpaid.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-0.5">
            Unpaid ({unpaid.length})
          </h2>
          {unpaid.map((p) => (
            <div key={p._id} className="rounded-2xl bg-white shadow-sm px-4 py-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 truncate">
                    {farmerMap.get(p.farmerId) || p.farmerId}
                  </p>
                  <p className="text-[11px] text-gray-400">{p.month}</p>
                </div>
                <span className="shrink-0 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-[11px] font-bold">
                  Unpaid
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-[10.5px] font-medium text-gray-400">Milk Total</p>
                  <p className="text-[14px] font-bold tabular-nums text-gray-900">{p.totalLiters.toFixed(1)} L</p>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-[10.5px] font-medium text-gray-400">Milk Amount</p>
                  <p className="text-[14px] font-bold tabular-nums text-gray-900">Rs. {p.milkAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-red-50 px-3 py-2">
                  <p className="text-[10.5px] font-medium text-red-400">Advance</p>
                  <p className="text-[14px] font-bold tabular-nums text-red-600">- Rs. {p.advancesDeducted.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-green-50 px-3 py-2">
                  <p className="text-[10.5px] font-medium text-green-600">Final</p>
                  <p className="text-[14px] font-bold tabular-nums text-green-700">Rs. {p.finalAmount.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={() => handleMarkPaid(p._id)}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-[13.5px] shadow-sm active:opacity-80 transition-opacity"
              >
                ✓ Mark as Paid
              </button>
            </div>
          ))}
        </div>
      )}

      {paid.length > 0 && (
        <details className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <summary className="px-4 py-3 flex items-center justify-between cursor-pointer select-none">
            <span className="text-[13px] font-bold text-gray-900">
              Paid <span className="text-gray-400 font-medium">({paid.length})</span>
            </span>
            <span className="text-gray-300 text-[11px]">▾</span>
          </summary>
          <div className="px-2 pb-2 space-y-1">
            {paid.map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between rounded-xl px-2.5 py-2.5 opacity-60 hover:opacity-100 hover:bg-gray-50 transition-all"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 truncate">
                    {farmerMap.get(p.farmerId) || p.farmerId}
                  </p>
                  <p className="text-[11px] text-gray-400">{p.month}</p>
                </div>
                <p className="shrink-0 ml-2 text-[13px] font-semibold text-green-700 tabular-nums">
                  Rs. {p.finalAmount.toFixed(2)} ✓
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      {data.length === 0 && (
        <div className="rounded-2xl bg-white shadow-sm text-center py-10 px-6">
          <p className="text-3xl mb-3">💵</p>
          <h2 className="text-[16px] font-bold text-gray-900 mb-1">कुनै भुक्तानी फेला परेन</h2>
          <p className="text-[13px] text-gray-400">Calculate थिचेर भुक्तानी बनाउनुहोस्।</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div className="bg-gray-900 text-white text-center py-3 px-4 rounded-full font-semibold text-[13px] shadow-lg max-w-sm mx-auto">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
