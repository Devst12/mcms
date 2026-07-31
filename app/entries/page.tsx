"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import PeriodPicker, { type Period } from "@/components/PeriodPicker";
import Modal from "@/components/Modal";

interface EntryData {
  _id: string;
  dateAD: string;
  dateBS: string;
  farmerId: string;
  farmerName?: string;
  milkType: "cow" | "buffalo";
  morningQty: number;
  eveningQty: number;
  fatPercent: number;
  rateUsed: number;
}

const MILK_ACCENT = {
  cow: { bg: "bg-amber-50", text: "text-amber-700" },
  buffalo: { bg: "bg-teal-50", text: "text-teal-700" },
} as const;

function EntriesInner() {
  const searchParams = useSearchParams();
  const preselectedFarmer = searchParams.get("farmerId") || "";
  const [farmers, setFarmers] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [period, setPeriod] = useState<Period>({ type: "thisMonth" });
  const [selectedFarmer, setSelectedFarmer] = useState(preselectedFarmer);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ morning: "", evening: "", fat: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const entriesWithNames = useMemo(() => {
    if (farmers.length === 0) return entries;
    const farmerMap = new Map(farmers.map((f) => [f._id, f.name]));
    return entries.map((e) => ({
      ...e,
      farmerName: farmerMap.get(e.farmerId) || e.farmerId,
    }));
  }, [entries, farmers]);

  const loadEntries = useCallback(async () => {
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

    const params = new URLSearchParams();
    if (selectedFarmer) params.set("farmerId", selectedFarmer);
    params.set("dateFrom", from);
    params.set("dateTo", to);
    const res = await fetch(`/api/entries?${params}`);
    const data = (await res.json()) as EntryData[];
    setEntries(data);
    setLoading(false);
  }, [selectedFarmer, period]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadEntries();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadEntries]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/farmers")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setFarmers(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startEdit = (entry: EntryData) => {
    setEditingId(entry._id);
    setEditForm({
      morning: String(entry.morningQty),
      evening: String(entry.eveningQty),
      fat: String(entry.fatPercent),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ morning: "", evening: "", fat: "" });
  };

  const saveEdit = async (entry: EntryData) => {
    const morningQty = parseFloat(editForm.morning) || 0;
    const eveningQty = parseFloat(editForm.evening) || 0;
    const fatPercent = parseFloat(editForm.fat) || 0;
    const res = await fetch(`/api/entries/${entry._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ morningQty, eveningQty, fatPercent }),
    });
    if (res.ok) {
      cancelEdit();
      showToast("Entry updated ✓");
      loadEntries();
    } else {
      showToast("Failed to update entry");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/entries/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (res.ok) {
      showToast("Entry deleted ✓");
      loadEntries();
    } else {
      showToast("Failed to delete entry");
    }
  };

  const cowEntries = entries.filter((e) => e.milkType === "cow");
  const buffaloEntries = entries.filter((e) => e.milkType === "buffalo");
  const cowTotal = cowEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
  const buffaloTotal = buffaloEntries.reduce((s, e) => s + e.morningQty + e.eveningQty, 0);
  const grandTotal = entries.reduce((s, e) => s + (e.morningQty + e.eveningQty) * e.rateUsed, 0);

  const grouped = entriesWithNames.reduce((acc, e) => {
    if (!acc[e.dateBS]) acc[e.dateBS] = [];
    acc[e.dateBS].push(e);
    return acc;
  }, {} as Record<string, EntryData[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Header */}
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">History</h1>

        {/* Filters */}
        <div className="rounded-2xl bg-white shadow-sm px-4 py-4 space-y-3">
          <select
            value={selectedFarmer}
            onChange={(e) => setSelectedFarmer(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 text-[14px] font-semibold text-gray-800 outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow"
          >
            <option value="">All Farmers</option>
            {farmers.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name} ({f.code})
              </option>
            ))}
          </select>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>

        {/* Totals bar */}
        {!loading && entries.length > 0 && (
          <div className="rounded-2xl bg-white shadow-sm px-4 py-4 grid grid-cols-3 divide-x divide-gray-100">
            <div className="text-center px-1">
              <p className="text-[11px] font-semibold text-amber-700">🐄 Cow</p>
              <p className="text-[17px] font-bold tabular-nums text-gray-900 mt-0.5">{cowTotal.toFixed(1)} L</p>
            </div>
            <div className="text-center px-1">
              <p className="text-[11px] font-semibold text-teal-700">🐃 Buffalo</p>
              <p className="text-[17px] font-bold tabular-nums text-gray-900 mt-0.5">{buffaloTotal.toFixed(1)} L</p>
            </div>
            <div className="text-center px-1">
              <p className="text-[11px] font-semibold text-gray-400">Amount</p>
              <p className="text-[17px] font-bold tabular-nums text-gray-900 mt-0.5">Rs {grandTotal.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <div className="text-center py-10 text-gray-400 text-[13px] font-medium">Loading…</div>}

        {/* Entries grouped by date */}
        {!loading &&
          sortedDates.map((date) => {
            const dayEntries = grouped[date];
            return (
              <div key={date} className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-1">
                  <h3 className="text-[13px] font-bold text-gray-900">{date}</h3>
                </div>

                {/* Mobile: flat list rows */}
                <div className="md:hidden px-2 pb-2">
                  {dayEntries.map((e) => {
                    const accent = MILK_ACCENT[e.milkType];
                    const isEditing = editingId === e._id;
                    return (
                      <div key={e._id} className="border-t border-gray-50 first:border-t-0 px-2 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-2">
                            <span
                              className={`shrink-0 w-6 h-6 rounded-full ${accent.bg} flex items-center justify-center text-[11px]`}
                            >
                              {e.milkType === "cow" ? "🐄" : "🐃"}
                            </span>
                            <p className="text-[13.5px] font-bold text-gray-900 truncate">
                              {e.farmerName || e.farmerId}
                            </p>
                          </div>
                          {!isEditing && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEdit(e)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                aria-label="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteId(e._id)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                aria-label="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {!isEditing ? (
                          <div className="flex items-center justify-between mt-2 pl-8">
                            <div className="flex items-center gap-3 text-[12px] text-gray-500">
                              <span className="tabular-nums">☀️ {e.morningQty.toFixed(1)}L</span>
                              <span className="tabular-nums">🌙 {e.eveningQty.toFixed(1)}L</span>
                              <span className="tabular-nums">{e.fatPercent.toFixed(1)}% fat</span>
                            </div>
                            <p className={`text-[13px] font-bold tabular-nums ${accent.text}`}>
                              Rs {((e.morningQty + e.eveningQty) * e.rateUsed).toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2.5 pl-1 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] font-medium text-gray-400">Morning</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  inputMode="decimal"
                                  value={editForm.morning}
                                  onChange={(ev) => setEditForm({ ...editForm, morning: ev.target.value })}
                                  className="w-full mt-0.5 px-2 py-2 rounded-lg bg-gray-50 text-[13px] font-semibold text-center tabular-nums outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-gray-400">Evening</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  inputMode="decimal"
                                  value={editForm.evening}
                                  onChange={(ev) => setEditForm({ ...editForm, evening: ev.target.value })}
                                  className="w-full mt-0.5 px-2 py-2 rounded-lg bg-gray-50 text-[13px] font-semibold text-center tabular-nums outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-gray-400">Fat %</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  inputMode="decimal"
                                  value={editForm.fat}
                                  onChange={(ev) => setEditForm({ ...editForm, fat: ev.target.value })}
                                  className="w-full mt-0.5 px-2 py-2 rounded-lg bg-gray-50 text-[13px] font-semibold text-center tabular-nums outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(e)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-900 text-white text-[12.5px] font-semibold"
                              >
                                <Check size={14} /> Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 text-gray-600 text-[12.5px] font-semibold"
                              >
                                <X size={14} /> Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto px-2 pb-2">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="text-gray-400 text-[10.5px] uppercase tracking-wide">
                        <th className="py-2 px-2 font-medium">Farmer</th>
                        <th className="py-2 px-2 font-medium">Type</th>
                        <th className="py-2 px-2 text-right font-medium">Morning</th>
                        <th className="py-2 px-2 text-right font-medium">Evening</th>
                        <th className="py-2 px-2 text-right font-medium">Total</th>
                        <th className="py-2 px-2 text-right font-medium">Fat %</th>
                        <th className="py-2 px-2 text-right font-medium">Rate</th>
                        <th className="py-2 px-2 text-right font-medium">Amount</th>
                        <th className="py-2 px-2 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dayEntries.map((e) => {
                        const accent = MILK_ACCENT[e.milkType];
                        const isEditing = editingId === e._id;
                        return (
                          <tr key={e._id} className="text-gray-700">
                            {isEditing ? (
                              <>
                                <td className="py-2 px-2 font-semibold text-gray-900">
                                  {e.farmerName || e.farmerId}
                                </td>
                                <td className="py-2 px-2">{e.milkType === "cow" ? "🐄" : "🐃"}</td>
                                <td className="py-2 px-2 text-right">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editForm.morning}
                                    onChange={(ev) => setEditForm({ ...editForm, morning: ev.target.value })}
                                    className="w-16 px-2 py-1 rounded-md bg-gray-50 text-right outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editForm.evening}
                                    onChange={(ev) => setEditForm({ ...editForm, evening: ev.target.value })}
                                    className="w-16 px-2 py-1 rounded-md bg-gray-50 text-right outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right font-semibold tabular-nums">
                                  {((parseFloat(editForm.morning) || 0) + (parseFloat(editForm.evening) || 0)).toFixed(1)}
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editForm.fat}
                                    onChange={(ev) => setEditForm({ ...editForm, fat: ev.target.value })}
                                    className="w-14 px-2 py-1 rounded-md bg-gray-50 text-right outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right tabular-nums text-gray-400">
                                  {e.rateUsed.toFixed(2)}
                                </td>
                                <td className="py-2 px-2 text-right font-bold tabular-nums">
                                  Rs{" "}
                                  {(
                                    ((parseFloat(editForm.morning) || 0) + (parseFloat(editForm.evening) || 0)) *
                                    e.rateUsed
                                  ).toFixed(2)}
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex gap-1 justify-end">
                                    <button
                                      onClick={() => saveEdit(e)}
                                      className="px-2.5 py-1 rounded-md bg-gray-900 text-white text-[11px] font-semibold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-semibold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2 px-2 font-semibold text-gray-900">
                                  {e.farmerName || e.farmerId}
                                </td>
                                <td className="py-2 px-2">
                                  <span
                                    className={`inline-flex items-center rounded-full ${accent.bg} ${accent.text} px-2 py-0.5 text-[11px] font-semibold`}
                                  >
                                    {e.milkType === "cow" ? "🐄 Cow" : "🐃 Buffalo"}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-right tabular-nums">{e.morningQty.toFixed(1)}</td>
                                <td className="py-2 px-2 text-right tabular-nums">{e.eveningQty.toFixed(1)}</td>
                                <td className="py-2 px-2 text-right font-semibold tabular-nums">
                                  {(e.morningQty + e.eveningQty).toFixed(1)}
                                </td>
                                <td className="py-2 px-2 text-right tabular-nums text-gray-500">
                                  {e.fatPercent.toFixed(1)}%
                                </td>
                                <td className="py-2 px-2 text-right tabular-nums text-gray-400">
                                  {e.rateUsed.toFixed(2)}
                                </td>
                                <td className={`py-2 px-2 text-right font-bold tabular-nums ${accent.text}`}>
                                  Rs {((e.morningQty + e.eveningQty) * e.rateUsed).toFixed(2)}
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex gap-1 justify-end">
                                    <button
                                      onClick={() => startEdit(e)}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                      aria-label="Edit"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteId(e._id)}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      aria-label="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div className="rounded-2xl bg-white shadow-sm text-center py-10 px-6">
            <p className="text-3xl mb-3">📋</p>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">No entries found</h2>
            <p className="text-[13px] text-gray-400 mb-5">Try adjusting the filters or period.</p>
            <a
              href="/entry"
              className="inline-block px-6 py-3 rounded-xl bg-gray-900 text-white font-bold text-[14px] active:opacity-80 transition-opacity"
            >
              Go to Entry →
            </a>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-24 left-4 right-4 z-50">
            <div className="bg-gray-900 text-white text-center py-3 px-4 rounded-full font-semibold text-[13px] shadow-lg max-w-sm mx-auto">
              {toast}
            </div>
          </div>
        )}

        <Modal
          open={!!deleteId}
          title="Delete Entry"
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          confirmText="Delete"
          cancelText="Cancel"
          danger
        >
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this entry? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </div>
  );
}

export default function EntriesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center py-8 text-gray-400 text-sm">Loading…</div>}>
      <EntriesInner />
    </Suspense>
  );
}