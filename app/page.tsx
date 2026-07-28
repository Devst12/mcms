import { getFarmers, getEntries, getCompanyCollections } from "@/lib/db";
import { getTodayBs, getTodayAd } from "@/lib/nepali-dates";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const todayAd = getTodayAd();
  const todayBs = getTodayBs();
  const [farmers, todayEntries, companyCollections] = await Promise.all([
    getFarmers(),
    getEntries(todayAd, todayAd),
    getCompanyCollections(todayAd, todayAd),
  ]);

  const cowEntries = todayEntries.filter((e) => e.milkType === "cow");
  const buffaloEntries = todayEntries.filter((e) => e.milkType === "buffalo");
  const cowTotal = cowEntries.reduce((sum, e) => sum + e.morningQty + e.eveningQty, 0);
  const buffaloTotal = buffaloEntries.reduce((sum, e) => sum + e.morningQty + e.eveningQty, 0);

  const enteredFarmerIds = new Set(todayEntries.map((e) => e.farmerId));
  const activeFarmers = farmers.filter((f) => f.active);
  const notEntered = activeFarmers.filter((f) => !enteredFarmerIds.has(f._id));

  const companyCow = companyCollections.filter((c) => c.milkType === "cow").reduce((sum, c) => sum + c.reportedQty, 0);
  const companyBuffalo = companyCollections.filter((c) => c.milkType === "buffalo").reduce((sum, c) => sum + c.reportedQty, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">{todayBs} (BS) / {todayAd} (AD)</p>
        </div>
        <Link href="/entry" className="px-4 py-3 min-h-touch bg-blue-600 text-white rounded-lg font-medium">
          Quick Entry
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-cow rounded-xl border-2 border-gray-300">
          <p className="text-sm font-medium text-gray-700">Cow Total 🐄</p>
          <p className="text-3xl-large font-bold">{cowTotal.toFixed(1)} L</p>
        </div>
        <div className="p-4 bg-buffalo rounded-xl border-2 border-gray-600">
          <p className="text-sm font-medium text-gray-700">Buffalo Total 🐃</p>
          <p className="text-3xl-large font-bold">{buffaloTotal.toFixed(1)} L</p>
        </div>
      </div>

      <div className="p-4 bg-white rounded-xl border">
        <h2 className="text-lg font-semibold mb-2">This Month Variance</h2>
        <div className="flex gap-4">
          <div>
            <p className="text-sm text-gray-600">Farmer Total</p>
            <p className="text-xl-large font-bold">{(cowTotal + buffaloTotal).toFixed(1)} L</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Company Reported</p>
            <p className="text-xl-large font-bold">{(companyCow + companyBuffalo).toFixed(1)} L</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Difference</p>
            <p className="text-xl-large font-bold">{(cowTotal + buffaloTotal - companyCow - companyBuffalo).toFixed(1)} L</p>
          </div>
        </div>
      </div>

      {notEntered.length > 0 && (
        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <h2 className="text-lg font-semibold mb-2">Not Entered Today</h2>
          <div className="space-y-2">
            {notEntered.map((f) => (
              <div key={f._id} className="flex items-center justify-between">
                <span>{f.name} ({f.code})</span>
                <Link href={`/entry?farmerId=${f._id}`} className="text-blue-600 text-sm font-medium">
                  Add Entry
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
