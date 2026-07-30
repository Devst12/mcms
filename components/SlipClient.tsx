"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PeriodPicker, { type Period } from "@/components/PeriodPicker";

interface EntryData {
  _id: string;
  dateAD: string;
  dateBS: string;
  farmerId: string;
  milkType: "cow" | "buffalo";
  morningQty: number;
  eveningQty: number;
  fatPercent: number;
  rateUsed: number;
}

interface FarmerData {
  _id: string;
  name: string;
  code: string;
  phone?: string;
}

function SlipInner({ initialFarmerId }: { initialFarmerId?: string }) {
  const searchParams = useSearchParams();
  const farmerId = searchParams.get("farmerId") || initialFarmerId || "";
  const [farmers, setFarmers] = useState<FarmerData[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState(farmerId);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [period, setPeriod] = useState<Period>({ type: "thisMonth" });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const fetchFarmers = useCallback(async () => {
    const res = await fetch("/api/farmers");
    const json = await res.json();
    setFarmers(json);
  }, []);

  const loadEntries = useCallback(async () => {
    if (!selectedFarmer) return;
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

    const res = await fetch(`/api/entries?farmerId=${selectedFarmer}&dateFrom=${from}&dateTo=${to}`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, [selectedFarmer, period]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const selected = farmers.find((f) => f._id === selectedFarmer);
  const cowEntries = entries.filter((e) => e.milkType === "cow");
  const buffaloEntries = entries.filter((e) => e.milkType === "buffalo");
  const cowTotal = cowEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
  const buffaloTotal = buffaloEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
  const totalAmount = entries.reduce((s, e) => s + (e.morningQty + e.eveningQty) * e.rateUsed, 0);
  const slipRefNum = `SLP-${selected?.code || "FARM"}-${Date.now().toString(36).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!slipRef.current) return;
    // Dynamic import of html2canvas
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(slipRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: 360,
      });
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, (canvas.height / canvas.width) * 80],
      });
      pdf.addImage(imgData, "PNG", 0, 0, 80, (canvas.height / canvas.width) * 80);
      pdf.save(`slip_${selected?.code || "farmer"}_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast("PDF downloaded ✓");
    } catch {
      showToast("PDF download failed - try Print instead");
    }
  };

  const handleDownloadJPG = async () => {
    if (!slipRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(slipRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: 360,
      });
      const link = document.createElement("a");
      link.download = `slip_${selected?.code || "farmer"}_${new Date().toISOString().slice(0, 10)}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
      showToast("JPG downloaded ✓");
    } catch {
      showToast("JPG download failed - try Print instead");
    }
  };

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Slip 🧾</h1>
      </div>

      {/* Farmer selector */}
      <div className="card space-y-3">
        <select
          value={selectedFarmer}
          onChange={(e) => setSelectedFarmer(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Select Farmer</option>
          {farmers.map((f) => (
            <option key={f._id} value={f._id}>
              {f.name} ({f.code})
            </option>
          ))}
        </select>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {!selectedFarmer ? (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-gray-600 font-bold">Select a farmer to generate slip.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-8 text-gray-500 font-bold">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">📭</p>
          <h2 className="text-xl font-bold mb-2">No entries for this period</h2>
          <p className="text-gray-600">Try a different date range.</p>
        </div>
      ) : (
        <>
          {/* Slip Preview - receipt style */}
          <div className="flex justify-center">
            <div
              ref={slipRef}
              className="slip-container bg-white border-2 border-gray-800 rounded-xl p-4 shadow-[4px_4px_0_rgba(0,0,0,0.15)]"
            >
              {/* Header */}
              <div className="text-center border-b-2 border-gray-800 pb-3 mb-3">
                <h2 className="text-lg font-bold uppercase">Dudh Hisab</h2>
                <p className="text-xs text-gray-600">Milk Collection Receipt</p>
                <p className="text-xs text-gray-600">
                  {period.type === "custom" && period.from && period.to
                    ? `${period.from} ~ ${period.to}`
                    : period.type === "thisMonth"
                      ? "This Month"
                      : period.type === "twoMonths"
                        ? "Last 2 Months"
                        : period.type === "thisYear"
                          ? "This Year"
                          : "All Time"}
                </p>
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
                <div className="bg-gray-50 rounded-lg p-2 border">
                  <p className="text-xs text-gray-500">🐄 Cow Total</p>
                  <p className="font-bold tabular-nums">{cowTotal.toFixed(1)} L</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 border">
                  <p className="text-xs text-gray-500">🐃 Buffalo Total</p>
                  <p className="font-bold tabular-nums">{buffaloTotal.toFixed(1)} L</p>
                </div>
              </div>

              <div className="text-center mb-3 border-t border-gray-300 pt-2">
                <p className="text-xs text-gray-500">Grand Total</p>
                <p className="text-xl font-bold tabular-nums">Rs. {totalAmount.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{(cowTotal + buffaloTotal).toFixed(1)} Litres</p>
              </div>

              {/* Daily breakdown */}
              {entries.length <= 14 ? (
                <table className="w-full text-xs mb-3">
                  <thead>
                    <tr className="border-b border-gray-400">
                      <th className="text-left py-1 font-bold">Date</th>
                      <th className="text-right py-1 font-bold">Type</th>
                      <th className="text-right py-1 font-bold">Qty</th>
                      <th className="text-right py-1 font-bold">Fat</th>
                      <th className="text-right py-1 font-bold">Rate</th>
                      <th className="text-right py-1 font-bold">Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e._id} className="border-b border-gray-200">
                        <td className="py-1 text-left">{e.dateBS.slice(-5)}</td>
                        <td className="py-1 text-right">{e.milkType === "cow" ? "🐄" : "🐃"}</td>
                        <td className="py-1 text-right tabular-nums">{(e.morningQty + e.eveningQty).toFixed(1)}</td>
                        <td className="py-1 text-right tabular-nums">{e.fatPercent.toFixed(1)}</td>
                        <td className="py-1 text-right tabular-nums">{e.rateUsed.toFixed(2)}</td>
                        <td className="py-1 text-right font-bold tabular-nums">
                          {((e.morningQty + e.eveningQty) * e.rateUsed).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-800 font-bold">
                      <td colSpan={2} className="py-1 text-left">Total</td>
                      <td className="py-1 text-right tabular-nums">{(cowTotal + buffaloTotal).toFixed(1)}</td>
                      <td colSpan={2}></td>
                      <td className="py-1 text-right tabular-nums">{totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="text-center mb-3 border-t border-gray-300 pt-2">
                  <p className="text-xs text-gray-500">{entries.length} entries total</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t-2 border-gray-800 pt-2 text-center text-xs text-gray-600">
                <p>Slip #: {slipRefNum}</p>
                <p className="mt-1">Thank you 🙏</p>
              </div>
            </div>
          </div>

          {/* Action Buttons - full width, thumb-friendly */}
          <div className="space-y-2 no-print">
            <button
              onClick={handlePrint}
              className="w-full px-5 py-4 min-h-touch bg-gray-800 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
            >
              🖨️ Print Slip
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadPDF}
                className="w-full px-4 py-4 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-sm shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
              >
                📄 Download PDF
              </button>
              <button
                onClick={handleDownloadJPG}
                className="w-full px-4 py-4 min-h-touch bg-green-600 text-white rounded-xl font-bold text-sm shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
              >
                🖼️ Download JPG
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50 no-print">
          <div className="bg-gray-900 text-white text-center py-3 px-4 rounded-xl font-bold text-sm shadow-lg max-w-sm mx-auto">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SlipClient({ initialFarmerId }: { initialFarmerId?: string }) {
  return (
    <Suspense fallback={<div className="p-4 text-center py-8 text-gray-500">Loading...</div>}>
      <SlipInner initialFarmerId={initialFarmerId} />
    </Suspense>
  );
}
