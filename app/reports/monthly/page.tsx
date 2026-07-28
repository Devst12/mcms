import { getEntries } from "@/lib/db";

export default async function MonthlyReports() {
  const allEntries = await getEntries("2000-01-01", "2099-12-31");
  const farmerMap = new Map();
  for (const entry of allEntries) {
    if (!farmerMap.has(entry.farmerId)) {
      farmerMap.set(entry.farmerId, {
        farmerId: entry.farmerId,
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
      });
    }
    const f = farmerMap.get(entry.farmerId)!;
    if (entry.milkType === "cow") {
      f.cowTotal += entry.morningQty + entry.eveningQty;
      f.cowMorning += entry.morningQty;
      f.cowEvening += entry.eveningQty;
      if (entry.fatPercent) { f.cowFatSum += entry.fatPercent; f.cowFatCount++; }
    } else {
      f.buffaloTotal += entry.morningQty + entry.eveningQty;
      f.buffaloMorning += entry.morningQty;
      f.buffaloEvening += entry.eveningQty;
      if (entry.fatPercent) { f.buffaloFatSum += entry.fatPercent; f.buffaloFatCount++; }
    }
  }
  const data = Array.from(farmerMap.values());

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Monthly Reports 📊</h1>
        <button onClick={() => window.print()} className="px-4 py-3 min-h-touch bg-gray-600 text-white rounded-lg font-medium">
          Print
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-2">Farmer</th>
              <th className="py-2 px-2">Cow</th>
              <th className="py-2 px-2">Buffalo</th>
              <th className="py-2 px-2">Avg Fat</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.farmerId} className="border-b">
                <td className="py-2 px-2 font-medium">{row.farmerId}</td>
                <td className="py-2 px-2">{row.cowTotal.toFixed(1)}L</td>
                <td className="py-2 px-2">{row.buffaloTotal.toFixed(1)}L</td>
                <td className="py-2 px-2">
                  {row.cowFatCount > 0 ? (row.cowFatSum / row.cowFatCount).toFixed(1) : "-"} /
                  {row.buffaloFatCount > 0 ? (row.buffaloFatSum / row.buffaloFatCount).toFixed(1) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
