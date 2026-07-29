import { getPayments } from "@/lib/db";
import PaymentsClient from "@/components/PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await getPayments();
  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments 💵</h1>
        <form action="/api/payments" method="POST">
          <input type="hidden" name="month" value={currentMonth} />
          <button type="submit" className="px-4 py-3 min-h-touch bg-blue-600 text-white rounded-lg font-medium">
            Calculate Payments
          </button>
        </form>
      </div>
      <PaymentsClient payments={payments} />
    </div>
  );
}
