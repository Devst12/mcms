"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PeriodPicker, { type Period } from "@/components/PeriodPicker";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getEntriesLocalRange, getFarmersLocal, saveEntryLocal, saveFarmersLocal } from "@/lib/indexed-db";
import { summarizeEntriesByDay } from "@/lib/daily-entry-summary";

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

function oklchToRgb(match: string): string {
  const values = match.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)/i);
  if (!values) return match;
  const parse = (value: string, percentScale: number) => value.endsWith("%")
    ? Number.parseFloat(value) / 100 * percentScale
    : Number.parseFloat(value);
  const L = parse(values[1], 1);
  const C = parse(values[2], 0.4);
  const h = Number.parseFloat(values[3]) * Math.PI / 180;
  const a = Math.cos(h) * C;
  const b = Math.sin(h) * C;
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linearToSrgb = (value: number) => {
    const channel = value <= 0.0031308 ? 12.92 * value : 1.055 * Math.max(0, value) ** (1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, channel)) * 255);
  };
  const red = linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  const alpha = values[4] ? parse(values[4], 1) : 1;
  return alpha < 1 ? `rgba(${red}, ${green}, ${blue}, ${alpha})` : `rgb(${red}, ${green}, ${blue})`;
}

function normalizeCaptureColors(document: Document, root: HTMLElement) {
  const elements = [root, ...root.querySelectorAll<HTMLElement>("*")];
  for (const element of elements) {
    const computed = document.defaultView?.getComputedStyle(element);
    if (!computed) continue;
    for (let index = 0; index < computed.length; index += 1) {
      const property = computed.item(index);
      const value = computed.getPropertyValue(property);
      if (value.includes("oklch(")) {
        element.style.setProperty(property, value.replace(/oklch\([^)]*\)/gi, oklchToRgb));
      }
    }
  }
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
    const now = new Date();
    let from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    let to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

    if (period.type === "twoMonths") {
      const fromMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const fromYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      from = `${fromYear}-${String(fromMonth + 1).padStart(2, "0")}-01`;
      to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
    } else if (period.type === "thisYear") {
      from = `${now.getFullYear()}-01-01`;
      to = `${now.getFullYear()}-12-31`;
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

  const captureSlip = async () => {
    const element = slipRef.current;
    if (!element) throw new Error("Slip is not ready");
    await document.fonts?.ready;
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(element, {
      scale: Math.min(3, Math.max(2, window.devicePixelRatio || 1)),
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      onclone: (clonedDocument) => {
        const clonedSlip = clonedDocument.querySelector<HTMLElement>("[data-slip-capture='true']");
        if (clonedSlip) normalizeCaptureColors(clonedDocument, clonedSlip);
      },
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob);
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
      const canvas = await captureSlip();
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const { jsPDF } = await import("jspdf");
      const heightMm = (canvas.height / canvas.width) * 80;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, heightMm],
      });
      pdf.addImage(imgData, "JPEG", 0, 0, 80, heightMm);
      downloadBlob(pdf.output("blob"), `slip_${selected?.code || "farmer"}_${new Date().toISOString().slice(0, 10)}.pdf`);
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
      const canvas = await captureSlip();
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not create JPG")), "image/jpeg", 0.95);
      });
      downloadBlob(blob, `slip_${selected?.code || "farmer"}_${new Date().toISOString().slice(0, 10)}.jpg`);
      showToast("JPG डाउनलोड भयो ✓");
    } catch {
      showToast("JPG डाउनलोड असफल — Print प्रयोग गर्नुहोस्");
    } finally {
      setExporting(false);
    }
  };

  const periodLabel =
    period.type === "custom" && period.from && period.to
      ? `${period.from} ~ ${period.to}`
      : period.type === "thisMonth"
        ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date())
        : period.type === "twoMonths"
          ? "Last 2 Months"
          : period.type === "thisYear"
            ? "This Year"
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
