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
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monthly Report 📊</h1>
          <p className="text-sm text-gray-600 font-medium">All-time summary</p>
        </div>
      </div>

      {/* Grand Totals */}
      <div className="card bg-blue-50 border-blue-400">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-600 font-bold">🐄 Total Cow</p>
            <p className="text-xl font-bold tabular-nums text-blue-800">{grandCow.toFixed(1)} L</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-bold">🐃 Total Buffalo</p>
            <p className="text-xl font-bold tabular-nums text-blue-800">{grandBuffalo.toFixed(1)} L</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-bold">Total Amount</p>
            <p className="text-xl font-bold tabular-nums text-green-700">Rs. {grandAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Farmer Cards on mobile, table on lg+ */}
      <div className="lg:hidden space-y-2">
        {data.map((row) => (
          <Link key={row.farmerId} href={`/farmers/${row.farmerId}`} className="block">
            <div className="card hover:bg-gray-50 transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-base">{row.farmerName}</p>
                <p className="font-bold text-green-700 tabular-nums">Rs. {row.totalAmount.toFixed(2)}</p>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-xs">
                <div className="bg-cow rounded-lg p-2 border border-gray-300">
                  <p className="text-gray-600 font-bold">Cow</p>
                  <p className="font-bold tabular-nums">{row.cowTotal.toFixed(1)}L</p>
                </div>
                <div className="bg-buffalo rounded-lg p-2 border border-gray-500">
                  <p className="text-gray-700 font-bold">Buffalo</p>
                  <p className="font-bold tabular-nums">{row.buffaloTotal.toFixed(1)}L</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-300">
                  <p className="text-gray-600 font-bold">Fat</p>
                  <p className="font-bold tabular-nums">
                    {row.cowFatCount > 0 ? (row.cowFatSum / row.cowFatCount).toFixed(1) : "-"}/
                    {row.buffaloFatCount > 0 ? (row.buffaloFatSum / row.buffaloFatCount).toFixed(1) : "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-300">
                  <p className="text-gray-600 font-bold">Total</p>
                  <p className="font-bold tabular-nums">{(row.cowTotal + row.buffaloTotal).toFixed(1)}L</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-2 px-3 font-bold">Farmer</th>
              <th className="py-2 px-3 text-right font-bold">Cow Total</th>
              <th className="py-2 px-3 text-right font-bold">Cow Morn</th>
              <th className="py-2 px-3 text-right font-bold">Cow Eve</th>
              <th className="py-2 px-3 text-right font-bold">Buff Total</th>
              <th className="py-2 px-3 text-right font-bold">Buff Morn</th>
              <th className="py-2 px-3 text-right font-bold">Buff Eve</th>
              <th className="py-2 px-3 text-right font-bold">Avg Fat</th>
              <th className="py-2 px-3 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.farmerId} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">{row.farmerName}</td>
                <td className="py-2 px-3 text-right tabular-nums">{row.cowTotal.toFixed(1)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{row.cowMorning.toFixed(1)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{row.cowEvening.toFixed(1)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{row.buffaloTotal.toFixed(1)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{row.buffaloMorning.toFixed(1)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{row.buffaloEvening.toFixed(1)}</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {row.cowFatCount > 0 ? (row.cowFatSum / row.cowFatCount).toFixed(1) : "-"}/
                  {row.buffaloFatCount > 0 ? (row.buffaloFatSum / row.buffaloFatCount).toFixed(1) : "-"}
                </td>
                <td className="py-2 px-3 text-right font-bold tabular-nums">Rs. {row.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800 font-bold">
              <td className="py-2 px-3">Grand Total</td>
              <td className="py-2 px-3 text-right tabular-nums">{grandCow.toFixed(1)}</td>
              <td colSpan={3}></td>
              <td className="py-2 px-3 text-right tabular-nums">{grandBuffalo.toFixed(1)}</td>
              <td colSpan={2}></td>
              <td className="py-2 px-3 text-right tabular-nums">Rs. {grandAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {data.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">📊</p>
          <h2 className="text-xl font-bold mb-2">No data yet</h2>
          <p className="text-gray-600">Entries will appear here once you start collecting.</p>
        </div>
      )}
    </div>
  );
}
