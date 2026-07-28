"use client";

import { useState } from "react";

interface PaymentData {
  _id: string;
  month: string;
  totalLiters: number;
  milkAmount: number;
  advancesDeducted: number;
  finalAmount: number;
  paid: boolean;
}

export default function PaymentsClient({ payments }: { payments: PaymentData[] }) {
  const [data, setData] = useState(payments);

  const handleMarkPaid = async (id: string) => {
    await fetch(`/api/payments/${id}/pay`, { method: "POST" });
    setData(data.map((p) => p._id === id ? { ...p, paid: true } : p));
  };

  return (
    <div className="space-y-2">
      {data.map((p) => (
        <div key={p._id} className="p-4 bg-white rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{p.month}</p>
              <p className="text-sm text-gray-600">Total: {p.totalLiters}L | Milk: Rs. {p.milkAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Advance: Rs. {p.advancesDeducted.toFixed(2)} | Final: Rs. {p.finalAmount.toFixed(2)}</p>
            </div>
            {!p.paid && (
              <button onClick={() => handleMarkPaid(p._id)} className="px-4 py-2 min-h-touch bg-green-600 text-white rounded-lg font-medium">
                Mark Paid
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
