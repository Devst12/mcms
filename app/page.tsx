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
  const totalFarmers = activeFarmers.length;
  const notEntered = activeFarmers.filter((f) => !enteredFarmerIds.has(f._id));
  const enteredCount = enteredFarmerIds.size;

  const companyCow = companyCollections.filter((c) => c.milkType === "cow").reduce((sum, c) => sum + c.reportedQty, 0);
  const companyBuffalo = companyCollections.filter((c) => c.milkType === "buffalo").reduce((sum, c) => sum + c.reportedQty, 0);

  const cowDiff = cowTotal - companyCow;
  const buffaloDiff = buffaloTotal - companyBuffalo;

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tabular-nums">दूध हिसाब</h1>
          <p className="text-sm text-gray-600 font-medium">{todayBs} | {todayAd}</p>
        </div>
        <Link
          href="/entry"
          className="px-5 py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
        >
          + New Entry
        </Link>
      </div>

      {/* Today's Collection Summary */}
      <div className="card space-y-3">
        <h2 className="text-lg font-bold">Today's Collection</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cow border-2 border-gray-800 rounded-xl p-4 shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🐄</span>
              <span className="text-sm font-bold text-gray-700">Cow</span>
            </div>
            <p className="text-3xl-large font-bold tabular-nums">{cowTotal.toFixed(1)}</p>
            <p className="text-xs text-gray-600">litres</p>
            {companyCow > 0 && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                <span className={cowDiff === 0 ? "text-green-700" : cowDiff < 0 ? "text-red-600" : "text-amber-600"}>
                  {cowDiff >= 0 ? "+" : ""}{cowDiff.toFixed(1)} vs company
                </span>
              </div>
            )}
          </div>
          <div className="bg-buffalo border-2 border-gray-800 rounded-xl p-4 shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🐃</span>
              <span className="text-sm font-bold text-gray-700">Buffalo</span>
            </div>
            <p className="text-3xl-large font-bold tabular-nums">{buffaloTotal.toFixed(1)}</p>
            <p className="text-xs text-gray-600">litres</p>
            {companyBuffalo > 0 && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                <span className={buffaloDiff === 0 ? "text-green-700" : buffaloDiff < 0 ? "text-red-600" : "text-amber-600"}>
                  {buffaloDiff >= 0 ? "+" : ""}{buffaloDiff.toFixed(1)} vs company
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-3">
          <span className="text-sm font-bold text-gray-700">Farmers entered</span>
          <span className="text-lg font-bold tabular-nums">{enteredCount}/{totalFarmers}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3">Quick Stats</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
            <p className="text-xl font-bold tabular-nums text-blue-700">{activeFarmers.length}</p>
            <p className="text-xs font-bold text-gray-600">Farmers</p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3">
            <p className="text-xl font-bold tabular-nums text-green-700">{(cowTotal + buffaloTotal).toFixed(1)}</p>
            <p className="text-xs font-bold text-gray-600">Total L</p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3">
            <p className="text-xl font-bold tabular-nums text-purple-700">{totalFarmers - notEntered.length}</p>
            <p className="text-xs font-bold text-gray-600">Done</p>
          </div>
        </div>
      </div>

      {/* Farmers Not Entered Yet */}
      {notEntered.length > 0 && (
        <div className="card border-amber-400 bg-amber-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-amber-800">⚠️ Not Entered Yet</h2>
            <span className="text-sm font-bold text-amber-700">{notEntered.length} farmers</span>
          </div>
          <div className="space-y-2">
            {notEntered.slice(0, 10).map((f) => (
              <div key={f._id} className="flex items-center justify-between bg-white border-2 border-amber-300 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-base">{f.name}</p>
                  <p className="text-xs text-gray-600">{f.code}</p>
                </div>
                <Link
                  href={`/entry?farmerId=${f._id}`}
                  className="px-4 py-2 min-h-touch bg-blue-600 text-white rounded-lg text-sm font-bold shadow-[2px_2px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                  Add
                </Link>
              </div>
            ))}
            {notEntered.length > 10 && (
              <Link href="/entries" className="block text-center text-sm font-bold text-blue-700 py-2">
                +{notEntered.length - 10} more...
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Today's Variance (only if company data exists) */}
      {(companyCow > 0 || companyBuffalo > 0) && (
        <div className="card">
          <h2 className="text-lg font-bold mb-3">Variance Check</h2>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-sm font-bold">
              <span className="text-gray-600">Type</span>
              <span className="text-right text-gray-600">Farmer</span>
              <span className="text-right text-gray-600">Company</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-base border-t border-gray-300 pt-2">
              <span className="font-bold">🐄 Cow</span>
              <span className="text-right font-bold tabular-nums">{cowTotal.toFixed(1)}</span>
              <span className="text-right font-bold tabular-nums">{companyCow.toFixed(1)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-base">
              <span className="font-bold">🐃 Buffalo</span>
              <span className="text-right font-bold tabular-nums">{buffaloTotal.toFixed(1)}</span>
              <span className="text-right font-bold tabular-nums">{companyBuffalo.toFixed(1)}</span>
            </div>
            <div className="border-t-2 border-gray-800 pt-2 mt-1">
              <div className="grid grid-cols-3 gap-2 text-base">
                <span className="font-bold">Diff</span>
                <span className={`text-right font-bold tabular-nums ${cowDiff === 0 ? "text-green-700" : cowDiff < 0 ? "text-red-600" : "text-amber-600"}`}>
                  {(cowTotal - companyCow).toFixed(1)}
                </span>
                <span className={`text-right font-bold tabular-nums ${buffaloDiff === 0 ? "text-green-700" : buffaloDiff < 0 ? "text-red-600" : "text-amber-600"}`}>
                  {(buffaloTotal - companyBuffalo).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no data */}
      {todayEntries.length === 0 && companyCow === 0 && companyBuffalo === 0 && (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">🥛</p>
          <h2 className="text-xl font-bold mb-2">No collections yet today</h2>
          <p className="text-gray-600 mb-4">Start by adding the first milk entry for today.</p>
          <Link
            href="/entry"
            className="inline-block px-6 py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            Start Collection →
          </Link>
        </div>
      )}
    </div>
  );
}
