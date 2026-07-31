import { getFarmers, getEntries, getCompanyCollections } from "@/lib/db";
import { formatBsDateNepali, formatAdDateDisplay, getTodayBs, getTodayAd } from "@/lib/nepali-dates";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Same tokens as the entry screen — amber for cow, teal for buffalo,
// flat white surfaces on a soft gray page, elevation via shadow not border.
// ---------------------------------------------------------------------------
function DiffBadge({ diff }: { diff: number }) {
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
        ✅ मिल्यो
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
        ⚠️ कमी <span className="tabular-nums">{diff.toFixed(1)}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
      🔶 बढी <span className="tabular-nums">+{diff.toFixed(1)}</span>
    </span>
  );
}

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Welcome Header */}
        <div className="space-y-1 px-0.5">
          <h1 className="text-[19px] font-bold text-gray-900 leading-snug">
            नमस्ते, तिलक नारायण श्रेष्ठ जी 🙏
          </h1>
          <div className="flex items-baseline gap-2">
            <p className="text-[15px] font-bold tabular-nums text-gray-800">{formatBsDateNepali(todayBs)}</p>
            <p className="text-[12px] text-gray-400">({formatAdDateDisplay(todayAd)})</p>
          </div>
          {notEntered.length > 0 && (
            <p className="inline-flex items-center gap-1.5 mt-1 text-[12.5px] font-semibold text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">
              आज {notEntered.length} जनाको दूध बाँकी छ
            </p>
          )}
        </div>

        {/* One Big Action */}
        <Link
          href="/entry"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-[15px] shadow-sm active:opacity-80 transition-opacity"
        >
          <span className="text-lg leading-none">➕</span>
          दूध थप्नुहोस्
        </Link>

        {hasData ? (
          <>
            {/* Today's Collection */}
            <div className="rounded-2xl bg-white shadow-sm px-4 py-4 space-y-3">
              <h2 className="text-[13px] font-bold text-gray-900">आजको संकलन</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-amber-50 p-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-base leading-none">🐄</span>
                    <span className="text-[12px] font-semibold text-amber-800">गाई</span>
                  </div>
                  <p className="text-[26px] font-bold tabular-nums text-gray-900 leading-none">
                    {cowTotal.toFixed(1)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">लिटर</p>
                  {companyCow > 0 && (
                    <div className="mt-1.5">
                      <DiffBadge diff={cowDiff} />
                    </div>
                  )}
                </div>
                <div className="rounded-xl bg-teal-50 p-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-base leading-none">🐃</span>
                    <span className="text-[12px] font-semibold text-teal-800">भैंसी</span>
                  </div>
                  <p className="text-[26px] font-bold tabular-nums text-gray-900 leading-none">
                    {buffaloTotal.toFixed(1)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">लिटर</p>
                  {companyBuffalo > 0 && (
                    <div className="mt-1.5">
                      <DiffBadge diff={buffaloDiff} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5">
                <span className="text-[12.5px] font-semibold text-gray-600">किसान भएका</span>
                <span className="text-[15px] font-bold tabular-nums text-gray-900">
                  {enteredCount}<span className="text-gray-400 font-medium">/{totalFarmers}</span>
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-white shadow-sm p-3 text-center">
                <p className="text-[19px] font-bold tabular-nums text-gray-900">{totalFarmers}</p>
                <p className="text-[10.5px] font-medium text-gray-400 mt-0.5">किसान</p>
              </div>
              <div className="rounded-xl bg-white shadow-sm p-3 text-center">
                <p className="text-[19px] font-bold tabular-nums text-gray-900">
                  {(cowTotal + buffaloTotal).toFixed(1)}
                </p>
                <p className="text-[10.5px] font-medium text-gray-400 mt-0.5">जम्मा लिटर</p>
              </div>
              <div className="rounded-xl bg-white shadow-sm p-3 text-center">
                <p className="text-[19px] font-bold tabular-nums text-gray-900">{enteredCount}</p>
                <p className="text-[10.5px] font-medium text-gray-400 mt-0.5">भयो</p>
              </div>
            </div>

            {/* छुटेको छ — Not Entered Yet */}
            {notEntered.length > 0 && (
              <div className="rounded-2xl bg-amber-50 px-4 py-4">
                <h2 className="text-[13px] font-bold text-amber-800 mb-2.5">आज दूध थपिएको छैन</h2>
                <div className="space-y-2">
                  {notEntered.slice(0, 10).map((f) => (
                    <div
                      key={f._id}
                      className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-gray-900 truncate">{f.name}</p>
                        <p className="text-[11px] text-gray-400">{f.code}</p>
                      </div>
                      <Link
                        href={`/entry?farmerId=${f._id}`}
                        className="shrink-0 px-3.5 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-semibold active:opacity-80 transition-opacity"
                      >
                        थप्नुहोस्
                      </Link>
                    </div>
                  ))}
                  {notEntered.length > 10 && (
                    <Link
                      href="/entries"
                      className="block text-center text-[12.5px] font-semibold text-amber-700 py-1.5"
                    >
                      थप हेर्नुहोस् →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Variance Check — tabular, lower priority */}
            {(companyCow > 0 || companyBuffalo > 0) && (
              <div className="rounded-2xl bg-white shadow-sm px-4 py-4">
                <h2 className="text-[12px] font-bold text-gray-900 mb-2.5">कम्पनी तुलना</h2>
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="text-gray-400 text-[10.5px] uppercase tracking-wide">
                      <th className="text-left font-medium pb-1.5">प्रकार</th>
                      <th className="text-right font-medium pb-1.5">हाम्रो</th>
                      <th className="text-right font-medium pb-1.5">कम्पनी</th>
                      <th className="text-right font-medium pb-1.5">फरक</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr>
                      <td className="py-2 font-semibold text-gray-800">🐄 गाई</td>
                      <td className="py-2 text-right font-bold tabular-nums text-gray-900">
                        {cowTotal.toFixed(1)}
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums text-gray-500">
                        {companyCow.toFixed(1)}
                      </td>
                      <td
                        className={`py-2 text-right font-bold tabular-nums ${
                          cowDiff === 0 ? "text-green-700" : cowDiff < 0 ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {cowDiff >= 0 ? "+" : ""}
                        {cowDiff.toFixed(1)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 font-semibold text-gray-800">🐃 भैंसी</td>
                      <td className="py-2 text-right font-bold tabular-nums text-gray-900">
                        {buffaloTotal.toFixed(1)}
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums text-gray-500">
                        {companyBuffalo.toFixed(1)}
                      </td>
                      <td
                        className={`py-2 text-right font-bold tabular-nums ${
                          buffaloDiff === 0 ? "text-green-700" : buffaloDiff < 0 ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {buffaloDiff >= 0 ? "+" : ""}
                        {buffaloDiff.toFixed(1)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="rounded-2xl bg-white shadow-sm text-center py-8 px-6">
            <p className="text-3xl mb-2">🥛</p>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">आजको दूध अझै थपिएको छैन</h2>
            <p className="text-[13px] text-gray-400 mb-4">पहिलो प्रविष्टि थप्नुहोस्।</p>
            <Link
              href="/entry"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-[15px] shadow-sm active:opacity-80 transition-opacity"
            >
              <span className="text-lg leading-none">➕</span>
              दूध थप्नुहोस्
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}