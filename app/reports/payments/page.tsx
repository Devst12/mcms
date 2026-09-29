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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">भुक्तानी</h1>
            {unpaidCount > 0 && (
              <p className="text-[12.5px] text-gray-400 font-medium">
                {unpaidCount} बाँकी · Rs. {totalUnpaid.toFixed(2)}
              </p>
            )}
          </div>
          <form action="/api/payments" method="POST">
            <input type="hidden" name="month" value={currentMonth} />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-gray-900 text-white font-semibold text-[13px] shadow-sm active:opacity-80 transition-opacity"
            >
              Calculate
            </button>
          </form>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm text-center py-10 px-6">
            <p className="text-3xl mb-3">💵</p>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">अझै भुक्तानी छैन</h2>
            <p className="text-[13px] text-gray-400">
              &ldquo;Calculate&rdquo; थिचेर यो महिनाको भुक्तानी बनाउनुहोस्।
            </p>
          </div>
        ) : (
          <PaymentsClient payments={payments} farmers={farmers} />
        )}
      </div>
    </div>
  );
}
