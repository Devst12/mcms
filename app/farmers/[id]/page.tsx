import { getFarmerById, getEntries, getAdvances } from "@/lib/db";
import Link from "next/link";
import { User, PiggyBank, Milk, Edit3, FileText, ExternalLink } from "lucide-react";
import DeleteFarmerButton from "@/components/DeleteFarmerButton";

export const dynamic = "force-dynamic";

export default async function FarmerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const farmer = await getFarmerById(id);
  if (!farmer) return (
    <div className="p-4 text-center py-10">
      <User size={48} strokeWidth={1} className="mx-auto text-gray-300 mb-3" />
      <h2 className="text-xl font-bold mb-2">Farmer not found</h2>
      <Link href="/farmers" className="text-blue-600 font-semibold">← Back to Farmers</Link>
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
    <div className="p-4 space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/farmers" className="text-sm text-gray-600 font-semibold mb-1 block">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User size={22} strokeWidth={2} className="text-gray-400" />
            {farmer.name}
          </h1>
          <p className="text-sm text-gray-600">{farmer.code}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/slip/${id}`}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm flex items-center gap-1"
          >
            <FileText size={16} strokeWidth={2} />
            Slip
          </Link>
          <DeleteFarmerButton farmerId={id} farmerName={farmer.name} />
        </div>
      </div>

      {/* Info table */}
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="border-l-2 border-l-gray-200 px-3 py-2 text-xs text-gray-600 font-semibold uppercase w-1/3">Phone</td>
            <td className="px-3 py-2 font-medium">{farmer.phone || "—"}</td>
          </tr>
          <tr>
            <td className="border-l-2 border-l-gray-200 px-3 py-2 text-xs text-gray-600 font-semibold uppercase">Status</td>
            <td className="px-3 py-2">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                farmer.active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {farmer.active ? "Active" : "Inactive"}
              </span>
            </td>
          </tr>
          <tr>
            <td className="border-l-2 border-l-gray-200 px-3 py-2 text-xs text-gray-600 font-semibold uppercase align-top">Address</td>
            <td className="px-3 py-2 font-medium">{farmer.address || "—"}</td>
          </tr>
        </tbody>
      </table>

      {/* Advance Balance */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <PiggyBank size={18} strokeWidth={2} className="text-amber-500" />
          <span className="text-xs text-gray-600 font-semibold uppercase">Advance Balance</span>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold tabular-nums ${totalAdvance > 0 ? "text-red-600" : "text-green-700"}`}>
            Rs. {totalAdvance.toFixed(2)}
          </p>
          {unsettledAdvances.length > 0 && (
            <p className="text-xs text-gray-600">{unsettledAdvances.length} unsettled advance(s)</p>
          )}
        </div>
      </div>

      {/* Lifetime Totals */}
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="border-l-2 border-l-gray-200 px-3 py-2 text-left text-xs text-gray-600 font-semibold">Milk Type</th>
            <th className="px-3 py-2 text-right text-xs text-gray-600 font-semibold">Total (L)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-l-2 border-l-gray-200 px-3 py-2 font-medium">Cow</td>
            <td className="px-3 py-2 text-right tabular-nums">{cowTotal.toFixed(1)}</td>
          </tr>
          <tr>
            <td className="border-l-2 border-l-gray-200 px-3 py-2 font-medium">Buffalo</td>
            <td className="px-3 py-2 text-right tabular-nums">{buffaloTotal.toFixed(1)}</td>
          </tr>
          <tr>
            <td className="border-l-2 border-l-gray-200 px-3 py-2 text-sm text-gray-600">Total Amount</td>
            <td className="px-3 py-2 text-right tabular-nums font-bold text-green-700">Rs. {totalAmount.toFixed(0)}</td>
          </tr>
        </tbody>
      </table>

      {/* Recent Entries */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Recent Entries</h2>
          <Link href={`/entries?farmerId=${id}`} className="text-sm text-blue-600 font-semibold flex items-center gap-1">
            View All <ExternalLink size={14} strokeWidth={2} />
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm mb-2">No entries yet</p>
            <Link href={`/entry?farmerId=${id}`} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm">
              <Milk size={16} strokeWidth={2} />
              + Add Entry
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4">
            <table className="w-full min-w-[640px] text-sm text-left">
              <thead>
                <tr>
                  <th className="border-l-2 border-l-gray-200 px-3 py-1.5 text-xs text-gray-600 font-semibold">Date</th>
                  <th className="px-3 py-1.5 text-xs text-gray-600 font-semibold">Type</th>
                  <th className="px-3 py-1.5 text-right text-xs text-gray-600 font-semibold">Morning (L)</th>
                  <th className="px-3 py-1.5 text-right text-xs text-gray-600 font-semibold">Evening (L)</th>
                  <th className="px-3 py-1.5 text-right text-xs text-gray-600 font-semibold">Fat %</th>
                  <th className="px-3 py-1.5 text-right text-xs text-gray-600 font-semibold">Rate</th>
                  <th className="px-3 py-1.5 text-right text-xs text-gray-600 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 10).map((e) => (
                  <tr key={e._id}>
                    <td className="border-l-2 border-l-gray-200 px-3 py-2 font-medium">{e.dateBS}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {e.milkType === "cow" ? "Cow" : "Buffalo"}
                        {e.editHistory && e.editHistory.length > 0 && (
                          <span title={`Edited ${e.editHistory.length}x`}>
                            <Edit3 size={12} strokeWidth={1.5} className="text-gray-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{e.morningQty.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{e.eveningQty.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{e.fatPercent.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">Rs. {e.rateUsed.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">
                      Rs. {((e.morningQty + e.eveningQty) * e.rateUsed).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
