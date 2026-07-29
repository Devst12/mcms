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

  const farmerMap = new Map(farmers.map(f => [f._id, `${f.name} (${f.code})`]));

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
              <p className="font-semibold">{farmerMap.get(p.farmerId) || p.farmerId} — {p.month}</p>
              <p className="text-sm text-gray-600">Total: {p.totalLiters.toFixed(1)}L | Milk: Rs. {p.milkAmount.toFixed(2)}</p>
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
