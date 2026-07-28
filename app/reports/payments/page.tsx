import { getPayments } from "@/lib/db";
import PaymentsClient from "@/components/PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await getPayments();
  
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Payments 💵</h1>
      <PaymentsClient payments={payments} />
    </div>
  );
}
