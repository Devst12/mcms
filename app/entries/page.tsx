"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

  useEffect(() => {
    let cancelled = false;
    async function doLoad() {
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
      if (!cancelled) {
        setEntries(data);
        setLoading(false);
      }
    }
    doLoad();
    return () => { cancelled = true; };
  }, [selectedFarmer, period]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/farmers")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setFarmers(data);
      });
    return () => { cancelled = true; };
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

  const grouped = entries.reduce((acc, e) => {
    if (!acc[e.dateBS]) acc[e.dateBS] = [];
    acc[e.dateBS].push(e);
    return acc;
  }, {} as Record<string, EntryData[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
      </div>

      {/* Filters */}
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedFarmer}
            onChange={(e) => setSelectedFarmer(e.target.value)}
            className="flex-1 min-w-0 px-4 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Farmers</option>
            {farmers.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name} ({f.code})
              </option>
            ))}
          </select>
        </div>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {/* Totals bar */}
      {!loading && entries.length > 0 && (
        <div className="card bg-blue-50 border-blue-400">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-600 font-bold">🐄 Cow</p>
              <p className="text-xl font-bold tabular-nums text-blue-800">{cowTotal.toFixed(1)} L</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-bold">🐃 Buffalo</p>
              <p className="text-xl font-bold tabular-nums text-blue-800">{buffaloTotal.toFixed(1)} L</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-bold">Total Amount</p>
              <p className="text-xl font-bold tabular-nums text-green-700">Rs. {grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-500 font-bold">Loading...</div>
      )}

      {/* Entries - Stacked cards on mobile */}
      {!loading &&
        sortedDates.map((date) => {
          const dayEntries = grouped[date];
          return (
            <div key={date} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base">{date}</h3>
              </div>
              {/* Stacked cards on mobile, table on lg+ */}
              <div className="space-y-2 lg:hidden">
                {dayEntries.map((e) => (
                  <div
                    key={e._id}
                    className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{e.farmerName || e.farmerId}</p>
                        <p className="text-xs text-gray-600">{e.milkType === "cow" ? "🐄 Cow" : "🐃 Buffalo"}</p>
                      </div>
                      <p className="font-bold text-sm tabular-nums">
                        Rs. {((e.morningQty + e.eveningQty) * e.rateUsed).toFixed(2)}
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center text-xs">
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-gray-500">Morn</p>
                        <p className="font-bold tabular-nums">{e.morningQty.toFixed(1)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-gray-500">Eve</p>
                        <p className="font-bold tabular-nums">{e.eveningQty.toFixed(1)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-gray-500">Morn Fat</p>
                        <p className="font-bold tabular-nums">{e.session === "morning" ? e.fatPercent.toFixed(1) + "%" : "-"}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-gray-500">Eve Fat</p>
                        <p className="font-bold tabular-nums">{e.session === "evening" ? e.fatPercent.toFixed(1) + "%" : "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => startEdit(e)}
                        className="px-3 py-2 min-h-touch bg-blue-100 text-blue-700 border-2 border-blue-300 rounded-lg text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(e._id)}
                        className="px-3 py-2 min-h-touch bg-red-100 text-red-700 border-2 border-red-300 rounded-lg text-xs font-bold"
                      >
                        Delete
                      </button>
                    </div>
                    {editingId === e._id && (
                      <div className="bg-white border-2 border-blue-400 rounded-xl p-3 space-y-2 mt-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-600 font-bold">Morning</label>
                            <input
                              type="number"
                              step="0.1"
                              inputMode="decimal"
                              value={editForm.morning}
                              onChange={(ev) => setEditForm({ ...editForm, morning: ev.target.value })}
                              className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-sm font-bold text-center"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-600 font-bold">Evening</label>
                            <input
                              type="number"
                              step="0.1"
                              inputMode="decimal"
                              value={editForm.evening}
                              onChange={(ev) => setEditForm({ ...editForm, evening: ev.target.value })}
                              className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-sm font-bold text-center"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-600 font-bold">Fat%</label>
                            <input
                              type="number"
                              step="0.1"
                              inputMode="decimal"
                              value={editForm.fat}
                              onChange={(ev) => setEditForm({ ...editForm, fat: ev.target.value })}
                              className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-sm font-bold text-center"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(e)}
                            className="flex-1 px-3 py-2 min-h-touch bg-green-600 text-white rounded-lg text-sm font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 px-3 py-2 min-h-touch bg-gray-600 text-white rounded-lg text-sm font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-800">
                      <th className="py-2 px-3 font-bold">Farmer</th>
                      <th className="py-2 px-3 font-bold">Type</th>
                      <th className="py-2 px-3 text-right font-bold">Morning</th>
                      <th className="py-2 px-3 text-right font-bold">Evening</th>
                      <th className="py-2 px-3 text-right font-bold">Total</th>
                      <th className="py-2 px-3 text-right font-bold">Morn Fat</th>
                      <th className="py-2 px-3 text-right font-bold">Eve Fat</th>
                      <th className="py-2 px-3 text-right font-bold">Rate</th>
                      <th className="py-2 px-3 text-right font-bold">Amount</th>
                      <th className="py-2 px-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayEntries.map((e) => (
                      <tr key={e._id} className="border-b border-gray-200 hover:bg-gray-50">
                        {editingId === e._id ? (
                          <>
                            <td className="py-2 px-3">{e.farmerName || e.farmerId}</td>
                            <td className="py-2 px-3 capitalize">{e.milkType}</td>
                            <td className="py-2 px-3 text-right">
                              <input type="number" step="0.1" value={editForm.morning} onChange={(ev) => setEditForm({ ...editForm, morning: ev.target.value })} className="w-16 px-2 py-1 border rounded text-right" />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input type="number" step="0.1" value={editForm.evening} onChange={(ev) => setEditForm({ ...editForm, evening: ev.target.value })} className="w-16 px-2 py-1 border rounded text-right" />
                            </td>
                            <td className="py-2 px-3 text-right font-medium tabular-nums">
                              {((parseFloat(editForm.morning) || 0) + (parseFloat(editForm.evening) || 0)).toFixed(1)}
                            </td>
                             <td className="py-2 px-3 text-right tabular-nums">{e.session === "morning" ? e.fatPercent.toFixed(1) + "%" : "-"}</td>
                             <td className="py-2 px-3 text-right tabular-nums">{e.session === "evening" ? e.fatPercent.toFixed(1) + "%" : "-"}</td>
                             <td className="py-2 px-3 text-right tabular-nums">{e.rateUsed.toFixed(2)}</td>
                             <td className="py-2 px-3 text-right font-medium tabular-nums">
                               Rs. {(((parseFloat(editForm.morning) || 0) + (parseFloat(editForm.evening) || 0)) * e.rateUsed).toFixed(2)}
                             </td>
                             <td className="py-2 px-3 text-right">
                               <div className="flex gap-1 justify-end">
                                 <button onClick={() => saveEdit(e)} className="px-2 py-1 bg-green-600 text-white rounded text-xs font-bold">Save</button>
                                 <button onClick={cancelEdit} className="px-2 py-1 bg-gray-600 text-white rounded text-xs font-bold">Cancel</button>
                               </div>
                             </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3 font-medium">{e.farmerName || e.farmerId}</td>
                            <td className="py-2 px-3 capitalize">{e.milkType === "cow" ? "🐄" : "🐃"}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{e.morningQty.toFixed(1)}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{e.eveningQty.toFixed(1)}</td>
                            <td className="py-2 px-3 text-right font-bold tabular-nums">{(e.morningQty + e.eveningQty).toFixed(1)}</td>
                             <td className="py-2 px-3 text-right tabular-nums">{e.session === "morning" ? e.fatPercent.toFixed(1) + "%" : "-"}</td>
                             <td className="py-2 px-3 text-right tabular-nums">{e.session === "evening" ? e.fatPercent.toFixed(1) + "%" : "-"}</td>
                             <td className="py-2 px-3 text-right tabular-nums">{e.rateUsed.toFixed(2)}</td>
                             <td className="py-2 px-3 text-right font-bold tabular-nums">
                               Rs. {((e.morningQty + e.eveningQty) * e.rateUsed).toFixed(2)}
                             </td>
                             <td className="py-2 px-3 text-right">
                               <div className="flex gap-1 justify-end">
                                 <button onClick={() => startEdit(e)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold">Edit</button>
                                 <button onClick={() => setDeleteId(e._id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Del</button>
                               </div>
                             </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">📋</p>
          <h2 className="text-xl font-bold mb-2">No entries found</h2>
          <p className="text-gray-600 mb-4">
            Try adjusting the filters or period.
          </p>
          <a
            href="/entry"
            className="inline-block px-6 py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            Go to Entry →
          </a>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div className="bg-gray-900 text-white text-center py-3 px-4 rounded-xl font-bold text-sm shadow-lg max-w-sm mx-auto">
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
  );
}

export default function EntriesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center py-8 text-gray-500">Loading...</div>}>
      <EntriesInner />
    </Suspense>
  );
}
