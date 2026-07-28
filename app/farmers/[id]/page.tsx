import { getFarmerById, getEntries, getAdvances } from "@/lib/db";
import { getTodayBs } from "@/lib/nepali-dates";
import Link from "next/link";

export default async function FarmerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const farmer = await getFarmerById(id);
  if (!farmer) return <div className="p-4">Farmer not found</div>;
  const entries = await getEntries(undefined, undefined, id);
  const advances = await getAdvances(id);
  const unsettledAdvances = advances.filter((a) => !a.settled);
  const totalAdvance = unsettledAdvances.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{farmer.name}</h1>
          <p className="text-gray-600">{farmer.code} | {farmer.phone}</p>
        </div>
        <Link href={`/slip/${id}`} className="px-4 py-3 min-h-touch bg-blue-600 text-white rounded-lg font-medium">
          View Slip
        </Link>
      </div>
      <div className="p-4 bg-white rounded-xl border">
        <h2 className="font-semibold mb-2">Info</h2>
        <p className="text-sm text-gray-600">Address: {farmer.address}</p>
        <p className="text-sm text-gray-600">Status: {farmer.active ? "Active" : "Inactive"}</p>
      </div>
      <div className="p-4 bg-white rounded-xl border">
        <h2 className="font-semibold mb-2">Advance Balance</h2>
        <p className="text-xl-large font-bold">Rs. {totalAdvance.toFixed(2)}</p>
      </div>
      <div className="p-4 bg-white rounded-xl border">
        <h2 className="font-semibold mb-2">Recent Entries</h2>
        <div className="space-y-2">
          {entries.slice(0, 10).map((e) => (
            <div key={e._id} className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">{e.dateBS} ({e.milkType})</p>
                <p className="text-sm text-gray-600">
                  M: {e.morningQty}L | E: {e.eveningQty}L | Fat: {e.fatPercent}%
                </p>
              </div>
              <p className="font-bold">Rs. {((e.morningQty + e.eveningQty) * e.rateUsed).toFixed(2)}</p>
            </div>
          ))}
          {entries.length === 0 && <p className="text-gray-500">No entries yet</p>}
        </div>
      </div>
    </div>
  );
}
