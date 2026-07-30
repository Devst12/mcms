import { getFarmers, getEntries, getCompanyCollections } from "@/lib/db";
import { formatBsDateNepali, formatAdDateDisplay, getTodayBs, getTodayAd } from "@/lib/nepali-dates";
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

  const hasData = todayEntries.length > 0 || companyCow > 0 || companyBuffalo > 0;

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-2xl-large font-bold">नमस्ते, तिलक नारायण श्रेष्ठ जी 🙏</h1>
        <p className="text-xl-large font-bold tabular-nums">{formatBsDateNepali(todayBs)}</p>
        <p className="text-sm text-gray-500">({formatAdDateDisplay(todayAd)})</p>
        {notEntered.length > 0 && (
          <p className="text-large font-bold text-amber-700">आज {notEntered.length} जनाको दूध बाँकी छ</p>
        )}
      </div>

      {/* One Big Action */}
      <Link
        href="/entry"
        className="flex items-center justify-center gap-2 w-full py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
      >
        <span className="text-xl">➕</span>
        दूध थप्नुहोस्
      </Link>

      {hasData ? (
        <>
          {/* Today's Collection */}
          <div className="card space-y-3">
            <h2 className="text-large font-bold">आजको संकलन</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cow border-2 border-gray-800 rounded-xl p-3 shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🐄</span>
                  <span className="text-large font-bold text-gray-700">गाई</span>
                </div>
                <p className="text-3xl-large font-bold tabular-nums">{cowTotal.toFixed(1)}</p>
                <p className="text-sm text-gray-600">लिटर</p>
                {companyCow > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    {cowDiff === 0 ? (
                      <span className="text-green-700 font-bold">✅ मिल्यो</span>
                    ) : cowDiff < 0 ? (
                      <span className="text-red-600 font-bold">⚠️ कमी</span>
                    ) : (
                      <span className="text-amber-600 font-bold">🔶 बढी</span>
                    )}
                    <span className="text-gray-600">{cowDiff >= 0 ? "+" : ""}{cowDiff.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="bg-buffalo border-2 border-gray-800 rounded-xl p-3 shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🐃</span>
                  <span className="text-large font-bold text-gray-700">भैंसी</span>
                </div>
                <p className="text-3xl-large font-bold tabular-nums">{buffaloTotal.toFixed(1)}</p>
                <p className="text-sm text-gray-600">लिटर</p>
                {companyBuffalo > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    {buffaloDiff === 0 ? (
                      <span className="text-green-700 font-bold">✅ मिल्यो</span>
                    ) : buffaloDiff < 0 ? (
                      <span className="text-red-600 font-bold">⚠️ कमी</span>
                    ) : (
                      <span className="text-amber-600 font-bold">🔶 बढी</span>
                    )}
                    <span className="text-gray-600">{buffaloDiff >= 0 ? "+" : ""}{buffaloDiff.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-2">
              <span className="text-large font-bold text-gray-700">किसान भएका</span>
              <span className="text-xl-large font-bold tabular-nums">{enteredCount}/{totalFarmers}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-2">
                <p className="text-2xl-large font-bold tabular-nums text-blue-700">{totalFarmers}</p>
                <p className="text-sm font-bold text-gray-600">किसान</p>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-2">
                <p className="text-2xl-large font-bold tabular-nums text-green-700">{(cowTotal + buffaloTotal).toFixed(1)}</p>
                <p className="text-sm font-bold text-gray-600">जम्मा लिटर</p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-2">
                <p className="text-2xl-large font-bold tabular-nums text-purple-700">{enteredCount}</p>
                <p className="text-sm font-bold text-gray-600">भयो</p>
              </div>
            </div>
          </div>

          {/* छुटेको छ — Not Entered Yet */}
          {notEntered.length > 0 && (
            <div className="card border-amber-400 bg-amber-50">
              <h2 className="text-large font-bold text-amber-800 mb-2">आज दूध थपिएको छैन</h2>
              <div className="space-y-2">
                {notEntered.slice(0, 10).map((f) => (
                  <div key={f._id} className="flex items-center justify-between bg-white border-2 border-amber-300 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-large font-bold">{f.name}</p>
                      <p className="text-xs text-gray-600">{f.code}</p>
                    </div>
                    <Link
                      href={`/entry?farmerId=${f._id}`}
                      className="px-4 py-2 min-h-touch bg-blue-600 text-white rounded-lg text-sm font-bold shadow-[2px_2px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                    >
                      थप्नुहोस्
                    </Link>
                  </div>
                ))}
                {notEntered.length > 10 && (
                  <Link href="/entries" className="block text-center text-sm font-bold text-blue-700 py-1">
                    थप हेर्नुहोस्
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Variance Check — lower priority */}
          {(companyCow > 0 || companyBuffalo > 0) && (
            <div className="card">
              <h2 className="text-sm font-bold mb-2">कम्पनी तुलना</h2>
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <span className="text-gray-600">प्रकार</span>
                  <span className="text-right text-gray-600">हाम्रो</span>
                  <span className="text-right text-gray-600">कम्पनी</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-t border-gray-300 pt-1">
                  <span className="font-bold">🐄 गाई</span>
                  <span className="text-right font-bold tabular-nums">{cowTotal.toFixed(1)}</span>
                  <span className="text-right font-bold tabular-nums">{companyCow.toFixed(1)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="font-bold">🐃 भैंसी</span>
                  <span className="text-right font-bold tabular-nums">{buffaloTotal.toFixed(1)}</span>
                  <span className="text-right font-bold tabular-nums">{companyBuffalo.toFixed(1)}</span>
                </div>
                <div className="border-t-2 border-gray-800 pt-1 mt-1">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="font-bold">फरक</span>
                    <span className={`text-right font-bold tabular-nums ${cowDiff === 0 ? "text-green-700" : cowDiff < 0 ? "text-red-600" : "text-amber-600"}`}>
                      {cowDiff >= 0 ? "+" : ""}{cowDiff.toFixed(1)}
                    </span>
                    <span className={`text-right font-bold tabular-nums ${buffaloDiff === 0 ? "text-green-700" : buffaloDiff < 0 ? "text-red-600" : "text-amber-600"}`}>
                      {buffaloDiff >= 0 ? "+" : ""}{buffaloDiff.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="card text-center py-6">
          <p className="text-4xl mb-2">🥛</p>
          <h2 className="text-xl-large font-bold mb-2">आजको दूध अझै थपिएको छैन</h2>
          <p className="text-sm text-gray-600 mb-3">पहिलो प्रविष्टि थप्नुहोस्।</p>
          <Link
            href="/entry"
            className="inline-flex items-center justify-center gap-2 w-full py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            <span className="text-xl">➕</span>
            दूध थप्नुहोस्
          </Link>
        </div>
      )}
    </div>
  );
}