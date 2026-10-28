"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PeriodPicker, { type Period } from "@/components/PeriodPicker";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getEntriesLocalRange, getFarmersLocal, saveEntryLocal, saveFarmersLocal } from "@/lib/indexed-db";
import { summarizeEntriesByDay, type DailyEntrySummary } from "@/lib/daily-entry-summary";
import { bsToAd, formatBsMonth, getBsMonthAdRange, getTodayBs } from "@/lib/nepali-dates";

interface EntryData {
  _id: string;
  id?: string;
  dateAD: string;
  dateBS: string;
  farmerId: string;
  milkType: "cow" | "buffalo";
  morningQty: number;
  eveningQty: number;
  fatPercent: number;
  rateUsed: number;
  session?: "morning" | "evening" | "both";
  synced?: boolean;
}

interface FarmerData {
  _id: string;
  name: string;
  code: string;
  phone?: string;
}

interface SlipExportData {
  farmerName: string;
  farmerCode: string;
  phone?: string;
  periodLabel: string;
  cowTotal: number;
  buffaloTotal: number;
  totalAmount: number;
  slipRefNum: string;
  dailyRows: DailyEntrySummary[];
}

function createSlipCanvas(data: SlipExportData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = 720;
  const rowHeight = 58;
  const top = 390;
  canvas.width = width;
  canvas.height = top + data.dailyRows.length * rowHeight + 100;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot create an image");
  const fontFamily = '"Noto Sans Devanagari", "Nirmala UI", Arial, sans-serif';

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#111827";
  context.textAlign = "center";
  context.font = `bold 32px ${fontFamily}`;
  context.fillText("Dudh Hisab", width / 2, 52);
  context.font = `20px ${fontFamily}`;
  context.fillStyle = "#4b5563";
  context.fillText("Milk Collection Receipt", width / 2, 83);
  context.fillText(data.periodLabel, width / 2, 111);
  context.strokeStyle = "#374151";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(32, 132);
  context.lineTo(width - 32, 132);
  context.stroke();

  context.textAlign = "left";
  context.fillStyle = "#111827";
  context.font = `bold 24px ${fontFamily}`;
  context.fillText(data.farmerName, 32, 171, width - 64);
  context.font = `18px ${fontFamily}`;
  context.fillStyle = "#4b5563";
  context.fillText(`${data.farmerCode}${data.phone ? ` | ${data.phone}` : ""}`, 32, 199);

  context.fillStyle = "#fffbeb";
  context.fillRect(32, 220, 316, 70);
  context.fillStyle = "#f0fdfa";
  context.fillRect(372, 220, 316, 70);
  context.fillStyle = "#92400e";
  context.font = `18px ${fontFamily}`;
  context.fillText("Cow total", 48, 247);
  context.fillStyle = "#115e59";
  context.fillText("Buffalo total", 388, 247);
  context.fillStyle = "#111827";
  context.font = `bold 24px ${fontFamily}`;
  context.fillText(`${data.cowTotal.toFixed(1)} L`, 48, 278);
  context.fillText(`${data.buffaloTotal.toFixed(1)} L`, 388, 278);

  context.strokeStyle = "#d1d5db";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(32, 311);
  context.lineTo(width - 32, 311);
  context.stroke();
  context.textAlign = "center";
  context.fillStyle = "#6b7280";
  context.font = `18px ${fontFamily}`;
  context.fillText("Grand total", width / 2, 340);
  context.fillStyle = "#111827";
  context.font = `bold 30px ${fontFamily}`;
  context.fillText(`Rs. ${data.totalAmount.toFixed(2)}`, width / 2, 375);

  const x = { date: 32, cow: 142, buffalo: 336, liters: 553, amount: 688 };
  context.fillStyle = "#374151";
  context.font = `bold 15px ${fontFamily}`;
  context.textAlign = "left";
  context.fillText("DATE", x.date, top);
  context.textAlign = "center";
  context.fillText("COW AM / PM", x.cow + 80, top);
  context.fillText("BUFFALO AM / PM", x.buffalo + 90, top);
  context.textAlign = "right";
  context.fillText("L", x.liters + 20, top);
  context.fillText("RS", x.amount, top);

  data.dailyRows.forEach((day, index) => {
    const y = top + 28 + index * rowHeight;
    context.strokeStyle = "#e5e7eb";
    context.beginPath();
    context.moveTo(32, y - 18);
    context.lineTo(width - 32, y - 18);
    context.stroke();
    context.fillStyle = "#111827";
    context.font = `16px ${fontFamily}`;
    context.textAlign = "left";
    context.fillText(day.dateBS, x.date, y + 2, 105);
    context.textAlign = "center";
    context.fillText(`AM ${day.cowMorning.toFixed(1)}`, x.cow + 80, y - 3);
    context.fillText(`PM ${day.cowEvening.toFixed(1)}`, x.cow + 80, y + 17);
    context.fillText(`AM ${day.buffaloMorning.toFixed(1)}`, x.buffalo + 90, y - 3);
    context.fillText(`PM ${day.buffaloEvening.toFixed(1)}`, x.buffalo + 90, y + 17);
    context.textAlign = "right";
    context.fillText(day.totalLiters.toFixed(1), x.liters + 20, y + 7);
    context.font = `bold 16px ${fontFamily}`;
    context.fillText(day.totalAmount.toFixed(0), x.amount, y + 7);
  });

  const footerY = top + data.dailyRows.length * rowHeight + 28;
  context.strokeStyle = "#374151";
  context.beginPath();
  context.moveTo(32, footerY - 14);
  context.lineTo(width - 32, footerY - 14);
  context.stroke();
  context.textAlign = "center";
  context.fillStyle = "#4b5563";
  context.font = `16px ${fontFamily}`;
  context.fillText(`Slip #: ${data.slipRefNum}`, width / 2, footerY + 12);
  context.fillText("Thank you", width / 2, footerY + 38);
  return canvas;
}

function SlipInner({ initialFarmerId }: { initialFarmerId?: string }) {
  const searchParams = useSearchParams();
  const farmerId = searchParams.get("farmerId") || initialFarmerId || "";
  const [farmers, setFarmers] = useState<FarmerData[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState(farmerId);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [period, setPeriod] = useState<Period>({ type: "thisMonth" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const fetchFarmers = useCallback(async () => {
    const cached = await getFarmersLocal().catch(() => []);
    if (cached.length) {
      setFarmers(cached.map((farmer) => ({
        _id: String(farmer._id || farmer.id || ""),
        name: String(farmer.name || ""),
        code: String(farmer.code || ""),
        phone: typeof farmer.phone === "string" ? farmer.phone : undefined,
      })));
    }
    try {
      const res = await fetchWithTimeout("/api/farmers", {}, 6000);
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json)) {
        await saveFarmersLocal(json);
        setFarmers(json);
      }
    } catch {
      // keep empty list on failure
    }
  }, []);

  const loadEntries = useCallback(async () => {
    if (!selectedFarmer) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const todayBs = getTodayBs();
    const [bsYear, bsMonth] = todayBs.split("-").map(Number);
    const currentMonthRange = getBsMonthAdRange(todayBs);
    let from = currentMonthRange.from;
    let to = currentMonthRange.to;

    if (period.type === "twoMonths") {
      const previousBsMonth = bsMonth === 1
        ? `${bsYear - 1}-12-01`
        : `${bsYear}-${String(bsMonth - 1).padStart(2, "0")}-01`;
      from = getBsMonthAdRange(previousBsMonth).from;
    } else if (period.type === "thisYear") {
      from = bsToAd(`${bsYear}-01-01`);
      const nextBsYearStart = bsToAd(`${bsYear + 1}-01-01`);
      const finalDay = new Date(`${nextBsYearStart}T00:00:00Z`);
      finalDay.setUTCDate(finalDay.getUTCDate() - 1);
      to = finalDay.toISOString().slice(0, 10);
    } else if (period.type === "allTime") {
      from = "2000-01-01";
      to = "2099-12-31";
    } else if (period.type === "custom" && period.from && period.to) {
      from = period.from;
      to = period.to;
    }

    const cached = await getEntriesLocalRange(from, to).catch(() => []) as unknown as EntryData[];
    const farmerCache = cached.filter((entry) => entry.farmerId === selectedFarmer);
    if (farmerCache.length) {
      setEntries(farmerCache.map((entry) => ({ ...entry, _id: entry._id || entry.id || "" })));
      setLoading(false);
    }

    try {
      const params = new URLSearchParams({ farmerId: selectedFarmer, dateFrom: from, dateTo: to });
      const res = await fetchWithTimeout(`/api/entries?${params}`, {}, 6000);
      if (!res.ok) throw new Error("Failed to load entries");
      const json = await res.json();
      const remote = Array.isArray(json) ? json as EntryData[] : [];
      await Promise.all(remote.map((entry) => saveEntryLocal({ ...entry, id: entry._id, synced: true })));
      const remoteSessions = new Set(remote.filter((entry) => entry.session).map((entry) =>
        `${entry.dateAD}_${entry.farmerId}_${entry.milkType}_${entry.session}`
      ));
      const pending = farmerCache.filter((entry) => !entry.synced && !remoteSessions.has(
        `${entry.dateAD}_${entry.farmerId}_${entry.milkType}_${entry.session}`
      ));
      setEntries([...remote, ...pending].map((entry) => ({ ...entry, _id: entry._id || entry.id || "" })));
    } catch {
      setEntries(farmerCache.map((entry) => ({ ...entry, _id: entry._id || entry.id || "" })));
    } finally {
      setLoading(false);
    }
  }, [selectedFarmer, period]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchFarmers(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchFarmers]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadEntries(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadEntries]);

  const selected = farmers.find((f) => f._id === selectedFarmer);
  const cowEntries = entries.filter((e) => e.milkType === "cow");
  const buffaloEntries = entries.filter((e) => e.milkType === "buffalo");
  const cowTotal = cowEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
  const buffaloTotal = buffaloEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
  const totalAmount = entries.reduce((s, e) => s + (e.morningQty + e.eveningQty) * e.rateUsed, 0);
  const dailyRows = useMemo(() => summarizeEntriesByDay(entries), [entries]);
  const slipRefNum = `SLP-${selected?.code || "FARM"}-${dailyRows.length}-${Math.round(totalAmount * 100)}`;

  const handlePrint = () => {
    const cleanup = () => document.body.classList.remove("printing-slip");
    document.body.classList.add("printing-slip");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 60000);
  };

  const downloadBlob = async (blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob);
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && typeof File !== "undefined") {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: filename });
        } catch (error) {
          if (error instanceof Error && error.name !== "AbortError") window.location.assign(objectUrl);
        }
      } else {
        window.location.assign(objectUrl);
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      return;
    }
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  };

  const handleDownloadPDF = async () => {
    if (!slipRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = createSlipCanvas({
        farmerName: selected?.name || "",
        farmerCode: selected?.code || "",
        phone: selected?.phone,
        periodLabel,
        cowTotal,
        buffaloTotal,
        totalAmount,
        slipRefNum,
        dailyRows,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const { jsPDF } = await import("jspdf");
      const heightMm = Math.ceil((canvas.height / canvas.width) * 80);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, heightMm],
      });
      pdf.addImage(imgData, "JPEG", 0, 0, 80, heightMm);
      await downloadBlob(pdf.output("blob"), `slip_${selected?.code || "farmer"}_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast("PDF डाउनलोड भयो ✓");
    } catch {
      showToast("PDF डाउनलोड असफल — Print प्रयोग गर्नुहोस्");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadJPG = async () => {
    if (!slipRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = createSlipCanvas({
        farmerName: selected?.name || "",
        farmerCode: selected?.code || "",
        phone: selected?.phone,
        periodLabel,
        cowTotal,
        buffaloTotal,
        totalAmount,
        slipRefNum,
        dailyRows,
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not create JPG")), "image/jpeg", 0.95);
      });
      await downloadBlob(blob, `slip_${selected?.code || "farmer"}_${new Date().toISOString().slice(0, 10)}.jpg`);
      showToast("JPG डाउनलोड भयो ✓");
    } catch {
      showToast("JPG डाउनलोड असफल — Print प्रयोग गर्नुहोस्");
    } finally {
      setExporting(false);
    }
  };

  const todayBs = getTodayBs();
  const [currentBsYear, currentBsMonth] = todayBs.split("-").map(Number);
  const previousBsMonth = currentBsMonth === 1
    ? `${currentBsYear - 1}-12-01`
    : `${currentBsYear}-${String(currentBsMonth - 1).padStart(2, "0")}-01`;
  const periodLabel =
    period.type === "custom" && period.from && period.to
      ? `${period.from} ~ ${period.to}`
      : period.type === "thisMonth"
        ? formatBsMonth(todayBs)
        : period.type === "twoMonths"
          ? `${formatBsMonth(previousBsMonth)} - ${formatBsMonth(todayBs)}`
          : period.type === "thisYear"
            ? `BS ${currentBsYear}`
            : "All Time";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Header */}
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Milk slip</h1>

        {/* Farmer selector */}
        <div className="rounded-2xl bg-white shadow-sm px-4 py-4 space-y-3">
          <label htmlFor="slip-farmer" className="block text-sm font-semibold text-gray-700">Choose farmer</label>
          <select
            id="slip-farmer"
            value={selectedFarmer}
            onChange={(e) => setSelectedFarmer(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 text-[14px] font-semibold text-gray-800 outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow"
          >
            <option value="">Choose a farmer</option>
            {farmers.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name} ({f.code})
              </option>
            ))}
          </select>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>

        {!selectedFarmer ? (
          <div className="rounded-2xl bg-white shadow-sm text-center py-10 px-6">
            <p className="text-3xl mb-3">🧾</p>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">Choose a farmer</h2>
            <p className="text-[13px] text-gray-400">Select a farmer to make their milk slip.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-10 text-gray-400 text-[13px] font-medium">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm text-center py-10 px-6">
            <p className="text-3xl mb-3">📭</p>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">No milk records for this period</h2>
            <p className="text-[13px] text-gray-400">Choose another date range.</p>
          </div>
        ) : (
          <>
            {/* Slip Preview — receipt style kept intentionally for print */}
            <div className="flex justify-center">
              <div
                ref={slipRef}
                data-slip-capture="true"
                className="slip-container bg-white border-2 border-gray-800 rounded-xl p-4 shadow-sm"
              >
                {/* Header */}
                <div className="text-center border-b-2 border-gray-800 pb-3 mb-3">
                  <h2 className="text-lg font-bold uppercase">Dudh Hisab</h2>
                  <p className="text-xs text-gray-600">Milk Collection Receipt</p>
                  <p className="text-xs text-gray-600">{periodLabel}</p>
                </div>

                {/* Farmer Info */}
                <div className="mb-3">
                  <p className="text-base font-bold">{selected?.name}</p>
                  <p className="text-xs text-gray-600">
                    {selected?.code}
                    {selected?.phone ? ` | ${selected.phone}` : ""}
                  </p>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div className="bg-amber-50 rounded-lg p-2">
                    <p className="text-xs text-amber-700 font-semibold">🐄 Cow Total</p>
                    <p className="font-bold tabular-nums">{cowTotal.toFixed(1)} L</p>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-2">
                    <p className="text-xs text-teal-700 font-semibold">🐃 Buffalo Total</p>
                    <p className="font-bold tabular-nums">{buffaloTotal.toFixed(1)} L</p>
                  </div>
                </div>

                <div className="text-center mb-3 border-t border-gray-200 pt-2">
                  <p className="text-xs text-gray-500">Grand Total</p>
                  <p className="text-xl font-bold tabular-nums">Rs. {totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{(cowTotal + buffaloTotal).toFixed(1)} Litres</p>
                </div>

                {/* One row per day, with both milk types kept together. */}
                <table className="w-full table-fixed border-collapse text-[9px] leading-tight mb-3">
                  <colgroup>
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "25%" }} />
                    <col style={{ width: "27%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "17%" }} />
                  </colgroup>
                  <thead>
                    <tr className="border-y border-gray-400 text-[8px] uppercase">
                      <th className="py-1 text-left">Date</th>
                      <th className="py-1 text-center text-amber-800">Cow</th>
                      <th className="py-1 text-center text-teal-800">Buffalo</th>
                      <th className="py-1 text-right">L</th>
                      <th className="py-1 text-right">Rs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows.map((day) => (
                      <tr key={day.dateAD || day.dateBS} className="border-b border-gray-200 align-top">
                        <td className="py-1 text-left whitespace-nowrap">{day.dateBS}</td>
                        <td className="py-1 text-center tabular-nums">
                          <span className="block">AM {day.cowMorning.toFixed(1)}</span>
                          <span className="block">PM {day.cowEvening.toFixed(1)}</span>
                        </td>
                        <td className="py-1 text-center tabular-nums">
                          <span className="block">AM {day.buffaloMorning.toFixed(1)}</span>
                          <span className="block">PM {day.buffaloEvening.toFixed(1)}</span>
                        </td>
                        <td className="py-1 text-right tabular-nums">{day.totalLiters.toFixed(1)}</td>
                        <td className="py-1 text-right font-bold tabular-nums">{day.totalAmount.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-800 font-bold">
                      <td colSpan={3} className="py-1 text-left">Total</td>
                      <td className="py-1 text-right tabular-nums">{(cowTotal + buffaloTotal).toFixed(1)}</td>
                      <td className="py-1 text-right tabular-nums">{totalAmount.toFixed(0)}</td>
                    </tr>
                  </tfoot>
                </table>
                {/* Footer */}
                <div className="border-t-2 border-gray-800 pt-2 text-center text-xs text-gray-600">
                  <p>Slip #: {slipRefNum}</p>
                  <p className="mt-1">Thank you 🙏</p>
                </div>
              </div>
            </div>

            {/* Action Buttons — full width, thumb-friendly */}
            <div className="space-y-2 no-print">
              <button
                onClick={handlePrint}
                disabled={exporting}
                className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-[15px] shadow-sm active:opacity-80 transition-opacity"
              >
                Print slip
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={exporting}
                  className="w-full py-3 rounded-xl bg-white shadow-sm text-gray-900 font-semibold text-[13.5px] ring-1 ring-inset ring-gray-200 active:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {exporting ? "Preparing…" : "Download PDF"}
                </button>
                <button
                  onClick={handleDownloadJPG}
                  disabled={exporting}
                  className="w-full py-3 rounded-xl bg-white shadow-sm text-gray-900 font-semibold text-[13.5px] ring-1 ring-inset ring-gray-200 active:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {exporting ? "Preparing…" : "Download JPG"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-24 left-4 right-4 z-50 no-print">
            <div className="bg-gray-900 text-white text-center py-3 px-4 rounded-full font-semibold text-[13px] shadow-lg max-w-sm mx-auto">
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SlipClient({ initialFarmerId }: { initialFarmerId?: string }) {
  return (
    <Suspense fallback={<div className="p-4 text-center py-8 text-gray-400 text-sm">Loading…</div>}>
      <SlipInner initialFarmerId={initialFarmerId} />
    </Suspense>
  );
}
