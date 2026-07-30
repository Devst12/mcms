import { getFarmerById, getEntries, getAdvances } from "@/lib/db";
import Link from "next/link";
import DeleteFarmerButton from "@/components/DeleteFarmerButton";

export const dynamic = "force-dynamic";

export default async function FarmerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const farmer = await getFarmerById(id);
  if (!farmer) return (
    <div className="p-4">
      <div className="card text-center py-8">
        <p className="text-4xl mb-3">👨‍🌾</p>
        <h2 className="text-xl font-bold mb-2">Farmer not found</h2>
        <Link href="/farmers" className="text-blue-600 font-bold">← Back to Farmers</Link>
      </div>
    </div>
  );

  const entries = await getEntries(undefined, undefined, id);
  const advances = await getAdvances(id);
  const unsettledAdvances = advances.filter((a) => !a.settled);
  const totalAdvance = unsettledAdvances.reduce((sum, a) => sum + a.amount, 0);

  const cowEntries = entries.filter((e) => e.milkType === "cow");
  const buffaloEntries = entries.filter((e) => e.milkType === "buffalo");
  const cowTotal = cowEntries.reduce((sum, e) => sum + e.morningQty + e.eveningQty, 0);
  const buffaloTotal = buffaloEntries.reduce((sum, e) => sum + e.morningQty + e.eveningQty, 0);
  const totalAmount = entries.reduce((sum, e) => sum + (e.morningQty + e.eveningQty) * e.rateUsed, 0);

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/farmers" className="text-sm text-gray-600 font-bold mb-1 block">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">{farmer.name}</h1>
          <p className="text-sm text-gray-600">{farmer.code}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/slip/${id}`}
            className="px-4 py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-sm shadow-[2px_2px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            Slip
          </Link>
          <DeleteFarmerButton farmerId={id} farmerName={farmer.name} />
        </div>
      </div>

      {/* Info card */}
      <div className="card grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-600 font-bold uppercase">Phone</p>
          <p className="font-bold text-base">{farmer.phone || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-bold uppercase">Status</p>
          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border-2 ${
            farmer.active
              ? "bg-green-100 text-green-700 border-green-400"
              : "bg-gray-100 text-gray-600 border-gray-300"
          }`}>
            {farmer.active ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-600 font-bold uppercase">Address</p>
          <p className="font-bold text-base">{farmer.address || "—"}</p>
        </div>
      </div>

      {/* Advance Balance */}
      <div className="card border-amber-400 bg-amber-50">
        <p className="text-xs text-gray-600 font-bold uppercase">Advance Balance</p>
        <p className={`text-2xl font-bold tabular-nums ${totalAdvance > 0 ? "text-red-600" : "text-green-700"}`}>
          Rs. {totalAdvance.toFixed(2)}
        </p>
        {unsettledAdvances.length > 0 && (
          <p className="text-xs text-gray-600">{unsettledAdvances.length} unsettled advance(s)</p>
        )}
      </div>

      {/* Lifetime Totals */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3">Lifetime Totals</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-cow border-2 border-gray-300 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-600">🐄 Cow</p>
            <p className="text-xl font-bold tabular-nums">{cowTotal.toFixed(1)}</p>
            <p className="text-xs text-gray-600">L</p>
          </div>
          <div className="bg-buffalo border-2 border-gray-300 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-600">🐃 Buffalo</p>
            <p className="text-xl font-bold tabular-nums">{buffaloTotal.toFixed(1)}</p>
            <p className="text-xs text-gray-600">L</p>
          </div>
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-xl font-bold tabular-nums text-green-700">Rs.</p>
            <p className="text-xs font-bold text-green-700">{totalAmount.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Recent Entries</h2>
          <Link href={`/entries?farmerId=${id}`} className="text-sm text-blue-600 font-bold">
            View All
          </Link>
        </div>
        {entries.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No entries yet</p>
            <Link href={`/entry?farmerId=${id}`} className="inline-block mt-2 px-4 py-2 min-h-touch bg-blue-600 text-white rounded-lg font-bold text-sm">
              + Add Entry
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 10).map((e) => (
              <div key={e._id} className="flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-sm">{e.dateBS}</p>
                  <p className="text-xs text-gray-600">
                    {e.milkType === "cow" ? "🐄" : "🐃"} {e.morningQty}M / {e.eveningQty}E · {e.fatPercent}% fat
                  </p>
                  {e.editHistory && e.editHistory.length > 0 && (
                    <p className="text-[10px] text-gray-400">Edited {e.editHistory.length}x</p>
                  )}
                </div>
                <p className="font-bold tabular-nums text-right">
                  Rs. {((e.morningQty + e.eveningQty) * e.rateUsed).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
