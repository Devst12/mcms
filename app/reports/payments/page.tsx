import { getPayments, getFarmers } from "@/lib/db";
import PaymentsClient from "@/components/PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await getPayments();
  const farmers = await getFarmers();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const unpaidCount = payments.filter((p) => !p.paid).length;
  const totalUnpaid = payments.filter((p) => !p.paid).reduce((s, p) => s + p.finalAmount, 0);

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments 💵</h1>
          {unpaidCount > 0 && (
            <p className="text-sm text-gray-600 font-medium">
              {unpaidCount} unpaid · Rs. {totalUnpaid.toFixed(2)}
            </p>
          )}
        </div>
        <form action="/api/payments" method="POST">
          <input type="hidden" name="month" value={currentMonth} />
          <button
            type="submit"
            className="px-5 py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            Calculate
          </button>
        </form>
      </div>

      {payments.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">💵</p>
          <h2 className="text-xl font-bold mb-2">No payments yet</h2>
          <p className="text-gray-600">Click &ldquo;Calculate&rdquo; to generate payments for the current month.</p>
        </div>
      ) : (
        <PaymentsClient payments={payments} farmers={farmers} />
      )}
    </div>
  );
}
