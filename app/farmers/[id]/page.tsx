import { getFarmerById, getEntries, getAdvances } from "@/lib/db";
import Link from "next/link";
import { User, PiggyBank, Milk, Edit3, FileText, ExternalLink } from "lucide-react";
import DeleteFarmerButton from "@/components/DeleteFarmerButton";

export const dynamic = "force-dynamic";

export default async function FarmerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const farmer = await getFarmerById(id);
  if (!farmer) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <User size={56} strokeWidth={1} className="mx-auto text-gray-300 mb-3" />
        <h2 className="text-[17px] font-bold text-gray-900 mb-2">Farmer not found</h2>
        <Link href="/farmers" className="text-sm text-blue-600 font-semibold">← Back to Farmers</Link>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/farmers" className="text-xs text-gray-400 font-semibold mb-1 block">
              ← Back
            </Link>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <User size={22} strokeWidth={2} className="text-gray-400" />
              {farmer.name}
            </h1>
            <p className="text-[12.5px] text-gray-400">{farmer.code}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/slip/${id}`}
              className="px-3 py-2 rounded-xl bg-gray-900 text-white font-semibold text-[13px] shadow-sm active:opacity-80 transition-opacity flex items-center gap-1"
            >
              <FileText size={15} strokeWidth={2} />
              Slip
            </Link>
            <DeleteFarmerButton farmerId={id} farmerName={farmer.name} />
          </div>
        </div>

        {/* Info table */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="px-4 py-2.5 text-xs text-gray-600 font-semibold uppercase w-1/3">Phone</td>
                <td className="px-4 py-2.5 font-medium text-gray-900">{farmer.phone || "—"}</td>
              </tr>
              <tr className="bg-gray-50/40">
                <td className="px-4 py-2.5 text-xs text-gray-600 font-semibold uppercase">Status</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    farmer.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {farmer.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-gray-600 font-semibold uppercase align-top">Address</td>
                <td className="px-4 py-2.5 font-medium text-gray-900">{farmer.address || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Advance Balance */}
        <div className="rounded-2xl bg-white shadow-sm px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank size={18} strokeWidth={2} className="text-amber-500" />
            <span className="text-[12px] font-semibold text-gray-600 uppercase">Advance Balance</span>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold tabular-nums ${totalAdvance > 0 ? "text-red-600" : "text-green-700"}`}>
              Rs. {totalAdvance.toFixed(2)}
            </p>
            {unsettledAdvances.length > 0 && (
              <p className="text-[11px] text-gray-500">{unsettledAdvances.length} unsettled advance(s)</p>
            )}
          </div>
        </div>

        {/* Lifetime Totals */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3">
            <h2 className="text-[13px] font-bold text-gray-900">Lifetime Totals</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-[10.5px] uppercase tracking-wide">
                <th className="text-left font-medium px-4 pb-2">Milk Type</th>
                <th className="text-right font-medium px-4 pb-2">Total (L)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2.5 font-semibold text-gray-900 flex items-center gap-1.5">
                  <span className="text-amber-500">🐄</span> Cow
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">{cowTotal.toFixed(1)}</td>
              </tr>
              <tr className="bg-gray-50/40">
                <td className="px-4 py-2.5 font-semibold text-gray-900 flex items-center gap-1.5">
                  <span className="text-teal-600">🐃</span> Buffalo
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">{buffaloTotal.toFixed(1)}</td>
              </tr>
              <tr className="bg-green-50">
                <td className="px-4 py-2.5 text-[12.5px] font-semibold text-gray-600">Total Amount</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-green-700">Rs. {totalAmount.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recent Entries */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[13px] font-bold text-gray-900">Recent Entries</h2>
            <Link href={`/entries?farmerId=${id}`} className="text-sm text-blue-600 font-semibold flex items-center gap-1">
              View All <ExternalLink size={14} strokeWidth={2} />
            </Link>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-2xl bg-white shadow-sm text-center py-8 px-6">
              <Milk size={40} strokeWidth={1} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-3">No entries yet</p>
              <Link href={`/entry?farmerId=${id}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-[13px] active:opacity-80 transition-opacity">
                <Milk size={15} strokeWidth={2} />
                + Add Entry
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm text-left">
                  <thead>
                    <tr className="text-gray-400 text-[10.5px] uppercase tracking-wide">
                      <th className="px-4 pb-2.5 font-medium">Date</th>
                      <th className="px-4 pb-2.5 font-medium">Type</th>
                      <th className="px-4 pb-2.5 text-right font-medium">Morning (L)</th>
                      <th className="px-4 pb-2.5 text-right font-medium">Evening (L)</th>
                      <th className="px-4 pb-2.5 text-right font-medium">Fat %</th>
                      <th className="px-4 pb-2.5 text-right font-medium">Rate</th>
                      <th className="px-4 pb-2.5 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.slice(0, 10).map((e) => (
                      <tr key={e._id}>
                        <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{e.dateBS}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {e.milkType === "cow" ? (
                              <span className="text-amber-500">🐄 Cow</span>
                            ) : (
                              <span className="text-teal-600">🐃 Buffalo</span>
                            )}
                            {e.editHistory && e.editHistory.length > 0 && (
                              <span title={`Edited ${e.editHistory.length}x`}>
                                <Edit3 size={12} strokeWidth={1.5} className="text-gray-400" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">{e.morningQty.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">{e.eveningQty.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">{e.fatPercent.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">Rs. {e.rateUsed.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-900">
                          Rs. {((e.morningQty + e.eveningQty) * e.rateUsed).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
