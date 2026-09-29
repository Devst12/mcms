import { getEntries, getFarmers } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MonthlyReports() {
  const allEntries = await getEntries("2000-01-01", "2099-12-31");
  const farmers = await getFarmers();
  const farmerNameMap = new Map(farmers.map((f) => [f._id, f.name]));

  const farmerMap = new Map<string, {
    farmerId: string;
    farmerName: string;
    cowTotal: number;
    buffaloTotal: number;
    cowMorning: number;
    cowEvening: number;
    buffaloMorning: number;
    buffaloEvening: number;
    cowFatSum: number;
    cowFatCount: number;
    buffaloFatSum: number;
    buffaloFatCount: number;
    totalAmount: number;
  }>();

  for (const entry of allEntries) {
    if (!farmerMap.has(entry.farmerId)) {
      farmerMap.set(entry.farmerId, {
        farmerId: entry.farmerId,
        farmerName: farmerNameMap.get(entry.farmerId) || entry.farmerId,
        cowTotal: 0,
        buffaloTotal: 0,
        cowMorning: 0,
        cowEvening: 0,
        buffaloMorning: 0,
        buffaloEvening: 0,
        cowFatSum: 0,
        cowFatCount: 0,
        buffaloFatSum: 0,
        buffaloFatCount: 0,
        totalAmount: 0,
      });
    }
    const f = farmerMap.get(entry.farmerId)!;
    const qty = entry.morningQty + entry.eveningQty;
    if (entry.milkType === "cow") {
      f.cowTotal += qty;
      f.cowMorning += entry.morningQty;
      f.cowEvening += entry.eveningQty;
      if (entry.fatPercent) {
        f.cowFatSum += entry.fatPercent;
        f.cowFatCount++;
      }
    } else {
      f.buffaloTotal += qty;
      f.buffaloMorning += entry.morningQty;
      f.buffaloEvening += entry.eveningQty;
      if (entry.fatPercent) {
        f.buffaloFatSum += entry.fatPercent;
        f.buffaloFatCount++;
      }
    }
    f.totalAmount += qty * entry.rateUsed;
  }

  const data = Array.from(farmerMap.values()).sort((a, b) => (b.cowTotal + b.buffaloTotal) - (a.cowTotal + a.buffaloTotal));
  const grandCow = data.reduce((s, r) => s + r.cowTotal, 0);
  const grandBuffalo = data.reduce((s, r) => s + r.buffaloTotal, 0);
  const grandAmount = data.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md lg:max-w-3xl mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">मासिक प्रतिवेदन</h1>
          <p className="text-[12.5px] text-gray-400 font-medium">सम्पूर्ण अवधि सारांश</p>
        </div>

        {/* Grand Totals */}
        <div className="rounded-2xl bg-white shadow-sm px-4 py-4 grid grid-cols-3 divide-x divide-gray-100">
          <div className="text-center px-1">
            <p className="text-[11px] font-semibold text-amber-700">🐄 गाई</p>
            <p className="text-[17px] font-bold tabular-nums text-gray-900 mt-0.5">{grandCow.toFixed(1)} L</p>
          </div>
          <div className="text-center px-1">
            <p className="text-[11px] font-semibold text-teal-700">🐃 भैंसी</p>
            <p className="text-[17px] font-bold tabular-nums text-gray-900 mt-0.5">{grandBuffalo.toFixed(1)} L</p>
          </div>
          <div className="text-center px-1">
            <p className="text-[11px] font-semibold text-gray-400">रकम</p>
            <p className="text-[17px] font-bold tabular-nums text-gray-900 mt-0.5">Rs {grandAmount.toFixed(0)}</p>
          </div>
        </div>

        {/* Farmer Cards on mobile, table on lg+ */}
        <div className="lg:hidden space-y-2">
          {data.map((row) => (
            <Link key={row.farmerId} href={`/farmers/${row.farmerId}`} className="block">
              <div className="rounded-2xl bg-white shadow-sm px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[14px] font-bold text-gray-900 truncate">{row.farmerName}</p>
                  <p className="text-[13px] font-bold text-gray-900 tabular-nums shrink-0 ml-2">
                    Rs {row.totalAmount.toFixed(0)}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="rounded-lg bg-amber-50 px-1 py-1.5">
                    <p className="text-[10px] font-semibold text-amber-700">गाई</p>
                    <p className="text-[12.5px] font-bold tabular-nums text-gray-900">{row.cowTotal.toFixed(1)}L</p>
                  </div>
                  <div className="rounded-lg bg-teal-50 px-1 py-1.5">
                    <p className="text-[10px] font-semibold text-teal-700">भैंसी</p>
                    <p className="text-[12.5px] font-bold tabular-nums text-gray-900">{row.buffaloTotal.toFixed(1)}L</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-1 py-1.5">
                    <p className="text-[10px] font-semibold text-gray-400">Fat</p>
                    <p className="text-[12.5px] font-bold tabular-nums text-gray-900">
                      {row.cowFatCount > 0 ? (row.cowFatSum / row.cowFatCount).toFixed(1) : "-"}/
                      {row.buffaloFatCount > 0 ? (row.buffaloFatSum / row.buffaloFatCount).toFixed(1) : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-1 py-1.5">
                    <p className="text-[10px] font-semibold text-gray-400">जम्मा</p>
                    <p className="text-[12.5px] font-bold tabular-nums text-gray-900">
                      {(row.cowTotal + row.buffaloTotal).toFixed(1)}L
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block rounded-2xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-gray-400 text-[10.5px] uppercase tracking-wide">
                <th className="py-2.5 px-4 font-medium">Farmer</th>
                <th className="py-2.5 px-3 text-right font-medium">Cow Total</th>
                <th className="py-2.5 px-3 text-right font-medium">Cow Morn</th>
                <th className="py-2.5 px-3 text-right font-medium">Cow Eve</th>
                <th className="py-2.5 px-3 text-right font-medium">Buff Total</th>
                <th className="py-2.5 px-3 text-right font-medium">Buff Morn</th>
                <th className="py-2.5 px-3 text-right font-medium">Buff Eve</th>
                <th className="py-2.5 px-3 text-right font-medium">Avg Fat</th>
                <th className="py-2.5 px-4 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row) => (
                <tr key={row.farmerId} className="text-gray-700 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-gray-900">{row.farmerName}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{row.cowTotal.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{row.cowMorning.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{row.cowEvening.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{row.buffaloTotal.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{row.buffaloMorning.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{row.buffaloEvening.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {row.cowFatCount > 0 ? (row.cowFatSum / row.cowFatCount).toFixed(1) : "-"}/
                    {row.buffaloFatCount > 0 ? (row.buffaloFatSum / row.buffaloFatCount).toFixed(1) : "-"}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold tabular-nums text-gray-900">
                    Rs {row.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-100 font-bold text-gray-900">
                <td className="py-2.5 px-4">Grand Total</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{grandCow.toFixed(1)}</td>
                <td colSpan={3}></td>
                <td className="py-2.5 px-3 text-right tabular-nums">{grandBuffalo.toFixed(1)}</td>
                <td colSpan={2}></td>
                <td className="py-2.5 px-4 text-right tabular-nums">Rs {grandAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Empty state */}
        {data.length === 0 && (
          <div className="rounded-2xl bg-white shadow-sm text-center py-10 px-6">
            <p className="text-3xl mb-3">📊</p>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">अझै डाटा छैन</h2>
            <p className="text-[13px] text-gray-400">संकलन सुरु गरेपछि यहाँ देखिन्छ।</p>
          </div>
        )}
      </div>
    </div>
  );
}
