"use client";

import { Fragment, useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import PeriodPicker, { type Period } from "@/components/PeriodPicker";
import Modal from "@/components/Modal";
import { getEntriesLocalRange, getFarmersLocal, saveEntryLocal, saveFarmersLocal } from "@/lib/indexed-db";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface EntryData {
  _id: string;
  id?: string;
  dateAD: string;
  dateBS: string;
  farmerId: string;
  farmerName?: string;
  milkType: "cow" | "buffalo";
  morningQty: number;
  eveningQty: number;
  fatPercent: number;
  rateUsed: number;
  session?: "morning" | "evening" | "both";
  synced?: boolean;
  createdAt?: string;
}

interface FarmerDayGroup {
  farmerId: string;
  farmerName: string;
  dateBS: string;
  cow: EntryData[];
  buffalo: EntryData[];
}

const MILK_ACCENT = {
  cow: { bg: "bg-amber-50", text: "text-amber-700" },
  buffalo: { bg: "bg-teal-50", text: "text-teal-700" },
} as const;

function ManageEntries({
  group,
  editingId,
  editForm,
  onEdit,
  onDelete,
  onEditFormChange,
  onSave,
  onCancel,
}: {
  group: FarmerDayGroup;
  editingId: string | null;
  editForm: { morning: string; evening: string; fat: string };
  onEdit: (entry: EntryData) => void;
  onDelete: (id: string) => void;
  onEditFormChange: (field: "morning" | "evening" | "fat", value: string) => void;
  onSave: (entry: EntryData) => void;
  onCancel: () => void;
}) {
  const renderMilkType = (type: "cow" | "buffalo") => {
    const entries = group[type];
    return (
      <section key={type} className={`rounded-lg ${MILK_ACCENT[type].bg} p-2.5`}>
        <h4 className={`mb-2 text-xs font-bold ${MILK_ACCENT[type].text}`}>{type === "cow" ? "Cow" : "Buffalo"}</h4>
        <div className="grid grid-cols-2 gap-2">
          {(["morning", "evening"] as const).map((session) => {
            const field = session === "morning" ? "morningQty" : "eveningQty";
            const matching = entries.filter((entry) => {
              if (entry.session === "both") return entry[field] > 0;
              if (entry.session) return entry.session === session;
              return entry[field] > 0;
            });
            const quantity = matching.reduce((total, entry) => total + entry[field], 0);
            return (
              <div key={session} className="rounded-md bg-white/80 p-2">
                <p className="text-[10px] font-medium uppercase text-gray-400">{session === "morning" ? "AM" : "PM"}</p>
                <p className="text-sm font-bold tabular-nums text-gray-900">{quantity.toFixed(1)} L</p>
                {matching.map((entry) => (
                  <div key={entry._id} className="mt-1 flex items-center justify-between border-t border-gray-100 pt-1">
                    <span className="text-[10px] text-gray-500">Fat {entry.fatPercent.toFixed(1)}%</span>
                    <div className="flex gap-1">
                      <button onClick={() => onEdit(entry)} aria-label={`Edit ${type} ${session}`} className="rounded p-1 text-gray-500"><Pencil size={12} /></button>
                      <button onClick={() => onDelete(entry._id)} aria-label={`Delete ${type} ${session}`} className="rounded p-1 text-gray-500 hover:text-red-600"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {entries.filter((entry) => entry._id === editingId).map((entry) => (
          <div key={entry._id} className="mt-2 space-y-2 rounded-md bg-white p-2">
            <div className="grid grid-cols-3 gap-1.5">
              {(["morning", "evening", "fat"] as const).map((field) => (
                <label key={field} className="text-[10px] text-gray-500">
                  {field === "morning" ? "AM L" : field === "evening" ? "PM L" : "Fat %"}
                  <input type="number" step="0.1" value={editForm[field]} onChange={(event) => onEditFormChange(field, event.target.value)} className="mt-1 w-full rounded bg-gray-50 p-1.5 text-center text-xs" />
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => onSave(entry)} className="flex-1 rounded bg-gray-900 py-2 text-xs font-semibold text-white">Save</button>
              <button onClick={onCancel} className="flex-1 rounded bg-gray-100 py-2 text-xs font-semibold text-gray-600">Cancel</button>
            </div>
          </div>
        ))}
      </section>
    );
  };

  const count = group.cow.length + group.buffalo.length;
  return (
    <details className="mt-2 border-t border-gray-100 pt-2" open={[...group.cow, ...group.buffalo].some((entry) => entry._id === editingId)}>
      <summary className="cursor-pointer py-1 text-[11px] font-semibold text-gray-500">Manage entries ({count})</summary>
      <div className="space-y-2 pt-2">
        {renderMilkType("cow")}
        {renderMilkType("buffalo")}
      </div>
    </details>
  );
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
    const cachedAtStart = await getEntriesLocalRange(from, to).catch(() => []) as unknown as EntryData[];
    if (cachedAtStart.length) {
      setEntries(cachedAtStart
        .filter((entry) => !selectedFarmer || entry.farmerId === selectedFarmer)
        .map((entry) => ({ ...entry, _id: entry._id || entry.id || "" })));
      setLoading(false);
    }
    try {
      const res = await fetchWithTimeout(`/api/entries?${params}`, {}, 6000);
      if (!res.ok) throw new Error("Could not load entries from server");
      const json = await res.json();
      const remote = Array.isArray(json) ? json as EntryData[] : [];
      await Promise.all(remote.map((entry) => saveEntryLocal({ ...entry, id: entry._id, synced: true })));
      const cached = await getEntriesLocalRange(from, to) as unknown as EntryData[];
      const remoteSessions = new Set(remote.filter((entry) => entry.session).map((entry) =>
        `${entry.dateAD}_${entry.farmerId}_${entry.milkType}_${entry.session}`
      ));
      const pending = cached.filter((entry) => !entry.synced && !remoteSessions.has(
        `${entry.dateAD}_${entry.farmerId}_${entry.milkType}_${entry.session}`
      ));
      const result = [...remote, ...pending].filter((entry) => !selectedFarmer || entry.farmerId === selectedFarmer);
      setEntries(result.map((entry) => ({ ...entry, _id: entry._id || entry.id || "" })));
    } catch {
      const cached = await getEntriesLocalRange(from, to) as unknown as EntryData[];
      setEntries(cached
        .filter((entry) => !selectedFarmer || entry.farmerId === selectedFarmer)
        .map((entry) => ({ ...entry, _id: entry._id || entry.id || "" })));
    } finally {
      setLoading(false);
    }
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
    const loadFarmers = async () => {
      const local = await getFarmersLocal().catch(() => []);
      if (!cancelled && local.length) {
        setFarmers(local.map((farmer) => ({ _id: String(farmer._id || farmer.id), name: String(farmer.name || ""), code: String(farmer.code || "") })));
      }
      try {
        const response = await fetchWithTimeout("/api/farmers", {}, 6000);
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data)) {
          await saveFarmersLocal(data);
          if (!cancelled) setFarmers(data);
        }
      } catch {
        // Use locally cached farmers when offline.
      }
    };
    void loadFarmers();
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
    let res: Response;
    try {
      res = await fetchWithTimeout(`/api/entries/${entry._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ morningQty, eveningQty, fatPercent }),
      }, 6000);
    } catch {
      showToast("Network is slow or offline. Entry was not changed.");
      return;
    }
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
    let res: Response;
    try {
      res = await fetchWithTimeout(`/api/entries/${deleteId}`, { method: "DELETE" }, 6000);
    } catch {
      showToast("Network is slow or offline. Entry was not deleted.");
      return;
    }
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
    const dayKey = e.dateAD || e.dateBS;
    const day = acc[dayKey] || (acc[dayKey] = []);
    let farmer = day.find((group) => group.farmerId === e.farmerId);
    if (!farmer) {
      farmer = { farmerId: e.farmerId, farmerName: e.farmerName || e.farmerId, dateBS: e.dateBS, cow: [], buffalo: [] };
      day.push(farmer);
    }
    farmer[e.milkType].push(e);
    return acc;
  }, {} as Record<string, FarmerDayGroup[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 pb-10">
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
            const dayGroups = grouped[date];
            return (
              <div key={date} className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-1">
                  <h3 className="text-[13px] font-bold text-gray-900">{dayGroups[0]?.dateBS || date}</h3>
                </div>

                {/* One farmer card with Cow and Buffalo side by side on phones */}
                <div className="md:hidden px-3 pb-3 space-y-2">
                  {dayGroups.map((group) => {
                    const sum = (list: EntryData[], field: "morningQty" | "eveningQty") =>
                      list.reduce((total, entry) => total + entry[field], 0);
                    return (
                      <div key={group.farmerId} className="rounded-xl border border-gray-100 bg-white px-3 py-3">
                        <p className="mb-2 text-[13px] font-bold text-gray-900">{group.farmerName}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(["cow", "buffalo"] as const).map((type) => {
                            const list = group[type];
                            const total = sum(list, "morningQty") + sum(list, "eveningQty");
                            return (
                              <div key={type} className={`rounded-lg ${MILK_ACCENT[type].bg} px-2.5 py-2`}>
                                <p className={`text-[11px] font-bold ${MILK_ACCENT[type].text}`}>{type === "cow" ? "Cow" : "Buffalo"}</p>
                                <p className="mt-1 text-[11px] text-gray-600">AM {sum(list, "morningQty").toFixed(1)} · PM {sum(list, "eveningQty").toFixed(1)}</p>
                                <p className="text-[12px] font-bold text-gray-900">{total.toFixed(1)} L</p>
                              </div>
                            );
                          })}
                        </div>
                        <ManageEntries
                          group={group}
                          editingId={editingId}
                          editForm={editForm}
                          onEdit={startEdit}
                          onDelete={setDeleteId}
                          onEditFormChange={(field, value) => setEditForm((form) => ({ ...form, [field]: value }))}
                          onSave={saveEdit}
                          onCancel={cancelEdit}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Grouped table: one row per farmer, with Cow and Buffalo separate */}
                <div className="hidden md:block overflow-x-auto px-2 pb-3">
                  <table className="w-full min-w-[900px] text-left text-[13px]">
                    <thead>
                      <tr className="text-[10.5px] uppercase tracking-wide text-gray-400">
                        <th rowSpan={2} className="px-2 py-2 font-medium">Farmer</th>
                        <th colSpan={3} className="px-2 py-2 text-center font-semibold text-amber-700">Cow · Liters</th>
                        <th colSpan={3} className="px-2 py-2 text-center font-semibold text-teal-700">Buffalo · Liters</th>
                        <th rowSpan={2} className="px-2 py-2 text-right font-medium">Amount</th>
                        <th rowSpan={2} className="px-2 py-2 font-medium">Manage</th>
                      </tr>
                      <tr className="text-[10px] uppercase tracking-wide text-gray-400">
                        {Array.from({ length: 2 }).flatMap((_, index) => <Fragment key={index}><th className="px-2 pb-2 text-right font-medium">AM</th><th className="px-2 pb-2 text-right font-medium">PM</th><th className="px-2 pb-2 text-right font-medium">Total</th></Fragment>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dayGroups.map((group) => {
                        const sum = (list: EntryData[], field: "morningQty" | "eveningQty") => list.reduce((total, entry) => total + entry[field], 0);
                        const amount = [...group.cow, ...group.buffalo].reduce((total, entry) => total + (entry.morningQty + entry.eveningQty) * entry.rateUsed, 0);
                        return (
                          <tr key={group.farmerId} className="text-gray-700">
                            <td className="px-2 py-3 font-semibold text-gray-900">{group.farmerName}</td>
                            {([group.cow, group.buffalo] as EntryData[][]).map((list, index) => {
                              const type = index === 0 ? "cow" : "buffalo";
                              const total = sum(list, "morningQty") + sum(list, "eveningQty");
                              return <Fragment key={type}><td className={`px-2 py-3 text-right tabular-nums ${MILK_ACCENT[type].text}`}>{sum(list, "morningQty").toFixed(1)}</td><td className={`px-2 py-3 text-right tabular-nums ${MILK_ACCENT[type].text}`}>{sum(list, "eveningQty").toFixed(1)}</td><td className="px-2 py-3 text-right font-semibold tabular-nums">{total.toFixed(1)}</td></Fragment>;
                            })}
                            <td className="px-2 py-3 text-right font-bold tabular-nums">Rs {amount.toFixed(2)}</td>
                            <td className="px-2 py-3">
                              <ManageEntries
                                group={group}
                                editingId={editingId}
                                editForm={editForm}
                                onEdit={startEdit}
                                onDelete={setDeleteId}
                                onEditFormChange={(field, value) => setEditForm((form) => ({ ...form, [field]: value }))}
                                onSave={saveEdit}
                                onCancel={cancelEdit}
                              />
                            </td>
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
