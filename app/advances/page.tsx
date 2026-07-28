import { getFarmers, getAdvances } from "@/lib/db";
import AdvanceForm from "@/components/AdvanceForm";

export default async function AdvancesPage() {
  const [farmers, advances] = await Promise.all([
    getFarmers(),
    getAdvances(),
  ]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Advances 💰</h1>
      <AdvanceForm farmers={farmers} onAdvanceAdded={() => {}} />
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
