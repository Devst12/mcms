"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MilkTypeToggle from "@/components/MilkTypeToggle";
import { getTodayBs } from "@/lib/nepali-dates";
import { saveEntryLocal, queueForSync } from "@/lib/indexed-db";

export const dynamic = "force-dynamic";

interface Farmer {
  _id: string;
  name: string;
  code: string;
  phone?: string;
}

type SessionKey = "morning" | "evening";

interface SessionState {
  _id?: string;
  farmerId: string;
  session: SessionKey;
  qty: string;
  fat: string;
  rateUsed: number | null;
  saved: boolean;
  saving: boolean;
}

function resolveRate(fatPercent: number, slabs: { minFat: number; maxFat: number; rate: number }[]): number {
  if (!slabs.length || fatPercent <= 0) return 0;
  const slab = slabs.find((s) => fatPercent >= s.minFat && fatPercent < s.maxFat);
  if (!slab) {
    const last = slabs[slabs.length - 1];
    if (fatPercent >= last.minFat) return last.rate;
    return slabs[0]?.rate || 0;
  }
  return slab.rate;
}

function FarmerEntryRow({
  farmer,
  milkType,
  dateBS,
  slabs,
  sessions,
  savingKeys,
  onFieldChange,
  onSave,
  onDelete,
  preselected,
}: {
  farmer: Farmer;
  milkType: "cow" | "buffalo";
  dateBS: string;
  slabs: { minFat: number; maxFat: number; rate: number }[];
  sessions: Record<string, SessionState>;
  savingKeys: Record<string, boolean>;
  onFieldChange: (farmerId: string, session: SessionKey, field: string, value: string) => void;
  onSave: (farmerId: string, session: SessionKey) => void;
  onDelete: (farmerId: string, session: SessionKey) => void;
  preselected: boolean;
}) {
  const getRate = (farmerId: string, session: SessionKey) => {
    const e = sessions[`${farmerId}_${session}`];
    if (!e || !e.fat) return null;
    const fat = parseFloat(e.fat) || 0;
    return resolveRate(fat, slabs);
  };

  const morningState = sessions[`${farmer._id}_morning`];
  const eveningState = sessions[`${farmer._id}_evening`];
  const mornRate = getRate(farmer._id, "morning");
  const eveRate = getRate(farmer._id, "evening");

  return (
    <div
      className={`card ${preselected ? "border-blue-500 bg-blue-50" : ""}`}
    >
      {/* Farmer header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-base">{farmer.name}</p>
          <p className="text-xs text-gray-600">
            {farmer.code}
            {farmer.phone ? ` | ${farmer.phone}` : ""}
          </p>
        </div>
        {morningState?.saved && eveningState?.saved && (
          <span className="px-3 py-1 bg-green-100 text-green-700 border-2 border-green-400 rounded-full text-xs font-bold">
            ✓ Done
          </span>
        )}
      </div>

      {/* Two-column session inputs */}
      <div className="grid grid-cols-5 gap-2">
        {/* Morning */}
        <div className="col-span-2 space-y-2">
          <p className="text-xs font-bold text-gray-600">☀️ Morning</p>
          {!morningState?.saved ? (
            <>
              <div>
                <label className="text-[10px] text-gray-500">Liters</label>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={morningState?.qty || ""}
                  onChange={(e) => onFieldChange(farmer._id, "morning", "qty", e.target.value)}
                  className="w-full px-3 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white text-center tabular-nums focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">Fat %</label>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={morningState?.fat || ""}
                  onChange={(e) => onFieldChange(farmer._id, "morning", "fat", e.target.value)}
                  className="w-full px-3 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white text-center tabular-nums focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="0.0"
                />
              </div>
              {mornRate !== null && morningState?.qty && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl px-3 py-2 text-center">
                  <p className="text-xs text-gray-600">Amount</p>
                  <p className="text-base font-bold text-green-700 tabular-nums">
                    Rs. {((parseFloat(morningState.qty) || 0) * mornRate).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500">@ Rs. {mornRate}/L</p>
                </div>
              )}
              <button
                onClick={() => onSave(farmer._id, "morning")}
                disabled={savingKeys[`${farmer._id}_morning`] || !morningState?.qty}
                className="w-full px-3 py-3 min-h-touch bg-green-600 text-white rounded-xl font-bold text-sm shadow-[2px_2px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-40 disabled:shadow-none"
              >
                {savingKeys[`${farmer._id}_morning`] ? "Saving..." : "Save ☀️"}
              </button>
            </>
          ) : (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Liters</span>
                <span className="font-bold tabular-nums">{morningState.qty} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Fat %</span>
                <span className="font-bold tabular-nums">{morningState.fat}%</span>
              </div>
              {mornRate && (
                <div className="flex items-center justify-between border-t border-green-200 pt-1">
                  <span className="text-xs text-gray-600">Amount</span>
                  <span className="font-bold text-green-700 tabular-nums">
                    Rs. {((parseFloat(morningState.qty) || 0) * mornRate).toFixed(2)}
                  </span>
                </div>
              )}
              <button
                onClick={() => onDelete(farmer._id, "morning")}
                className="w-full px-2 py-2 min-h-touch bg-red-100 text-red-700 border-2 border-red-300 rounded-lg text-xs font-bold"
              >
                ✕ Remove
              </button>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="col-span-1 flex items-center justify-center">
          <div className="h-full w-0.5 bg-gray-200" />
        </div>

        {/* Evening */}
        <div className="col-span-2 space-y-2">
          <p className="text-xs font-bold text-gray-600">🌙 Evening</p>
          {!eveningState?.saved ? (
            <>
              <div>
                <label className="text-[10px] text-gray-500">Liters</label>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={eveningState?.qty || ""}
                  onChange={(e) => onFieldChange(farmer._id, "evening", "qty", e.target.value)}
                  className="w-full px-3 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white text-center tabular-nums focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">Fat %</label>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={eveningState?.fat || ""}
                  onChange={(e) => onFieldChange(farmer._id, "evening", "fat", e.target.value)}
                  className="w-full px-3 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white text-center tabular-nums focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="0.0"
                />
              </div>
              {eveRate !== null && eveningState?.qty && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl px-3 py-2 text-center">
                  <p className="text-xs text-gray-600">Amount</p>
                  <p className="text-base font-bold text-green-700 tabular-nums">
                    Rs. {((parseFloat(eveningState.qty) || 0) * eveRate).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500">@ Rs. {eveRate}/L</p>
                </div>
              )}
              <button
                onClick={() => onSave(farmer._id, "evening")}
                disabled={savingKeys[`${farmer._id}_evening`] || !eveningState?.qty}
                className="w-full px-3 py-3 min-h-touch bg-blue-800 text-white rounded-xl font-bold text-sm shadow-[2px_2px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-40 disabled:shadow-none"
              >
                {savingKeys[`${farmer._id}_evening`] ? "Saving..." : "Save 🌙"}
              </button>
            </>
          ) : (
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Liters</span>
                <span className="font-bold tabular-nums">{eveningState.qty} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Fat %</span>
                <span className="font-bold tabular-nums">{eveningState.fat}%</span>
              </div>
              {eveRate && (
                <div className="flex items-center justify-between border-t border-indigo-200 pt-1">
                  <span className="text-xs text-gray-600">Amount</span>
                  <span className="font-bold text-indigo-700 tabular-nums">
                    Rs. {((parseFloat(eveningState.qty) || 0) * eveRate).toFixed(2)}
                  </span>
                </div>
              )}
              <button
                onClick={() => onDelete(farmer._id, "evening")}
                className="w-full px-2 py-2 min-h-touch bg-red-100 text-red-700 border-2 border-red-300 rounded-lg text-xs font-bold"
              >
                ✕ Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DailyEntryInner() {
  const searchParams = useSearchParams();
  const preselectedFarmer = searchParams.get("farmerId") || "";
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [milkType, setMilkType] = useState<"cow" | "buffalo">("cow");
  const [dateBS, setDateBS] = useState(getTodayBs());
  const [slabs, setSlabs] = useState<{ minFat: number; maxFat: number; rate: number }[]>([]);
  const [sessions, setSessions] = useState<Record<string, SessionState>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [groupByFarmer, setGroupByFarmer] = useState(true);
  const [totalLiters, setTotalLiters] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Load farmers
  useEffect(() => {
    fetch("/api/farmers")
      .then((r) => r.json())
      .then(setFarmers);
  }, []);

  // Load rate slabs
  useEffect(() => {
    let cancelled = false;
    const loadSlabs = async () => {
      const dateAd = await (await import("@/lib/nepali-dates")).bsToAd(dateBS);
      const res = await fetch(`/api/rates?milkType=${milkType}&dateAD=${dateAd}`);
      if (res.ok && !cancelled) {
        const data = await res.json();
        setSlabs(data?.slabs || []);
      }
    };
    loadSlabs();
    return () => {
      cancelled = true;
    };
  }, [milkType, dateBS]);

  // Load existing entries for the day
  useEffect(() => {
    let cancelled = false;
    const loadDayEntries = async () => {
      if (!dateBS || !milkType) {
        setSessions({});
        return;
      }
      const dateAd = await (await import("@/lib/nepali-dates")).bsToAd(dateBS);
      const params = new URLSearchParams({
        dateFrom: dateAd,
        dateTo: dateAd,
        milkType: milkType,
      });
      try {
        const res = await fetch(`/api/entries?${params}`);
        if (!res.ok) throw new Error("Failed to fetch entries");
        const data = (await res.json()) as Array<{
          _id: string;
          farmerId: string;
          session?: string;
          morningQty: number;
          eveningQty: number;
          fatPercent: number;
          rateUsed: number;
        }>;
        if (cancelled) return;

        const next: Record<string, SessionState> = {};
        let totalL = 0;
        let totalAmt = 0;
        for (const e of data) {
          const sess = e.session as SessionState["session"];
          if (sess === "morning") {
            const key = `${e.farmerId}_morning`;
            next[key] = {
              _id: e._id,
              farmerId: e.farmerId,
              session: "morning",
              qty: String(e.morningQty),
              fat: String(e.fatPercent),
              rateUsed: e.rateUsed,
              saved: true,
              saving: false,
            };
            totalL += e.morningQty;
            totalAmt += e.morningQty * e.rateUsed;
          } else if (sess === "evening") {
            const key = `${e.farmerId}_evening`;
            next[key] = {
              _id: e._id,
              farmerId: e.farmerId,
              session: "evening",
              qty: String(e.eveningQty),
              fat: String(e.fatPercent),
              rateUsed: e.rateUsed,
              saved: true,
              saving: false,
            };
            totalL += e.eveningQty;
            totalAmt += e.eveningQty * e.rateUsed;
          }
        }
        setSessions(next);
        setTotalLiters(totalL);
        setTotalAmount(totalAmt);
      } catch {
        // ignore
      }
    };
    loadDayEntries();
    return () => {
      cancelled = true;
    };
  }, [dateBS, milkType]);

  const handleFieldChange = (farmerId: string, session: SessionKey, field: string, value: string) => {
    const key = `${farmerId}_${session}`;
    setSessions((prev) => {
      const next = { ...prev };
      const current = next[key];
      if (!current) {
        next[key] = {
          _id: undefined,
          farmerId,
          session,
          qty: field === "qty" ? value : "",
          fat: field === "fat" ? value : "",
          rateUsed: null,
          saved: false,
          saving: false,
        };
      } else {
        next[key] = { ...current, [field]: value, saved: false };
      }
      return next;
    });
  };

  const saveSession = async (farmerId: string, session: SessionKey) => {
    const key = `${farmerId}_${session}`;
    const e = sessions[key];
    if (!e) return;

    const qty = parseFloat(e.qty) || 0;
    if (qty <= 0) {
      alert("Please enter quantity");
      return;
    }

    const fatPercent = parseFloat(e.fat) || 0;
    const rateUsed = resolveRate(fatPercent, slabs);
    const dateAd = await (await import("@/lib/nepali-dates")).bsToAd(dateBS);
    const morningQty = session === "morning" ? qty : 0;
    const eveningQty = session === "evening" ? qty : 0;

    const localId = e._id || `${dateBS}_${farmerId}_${milkType}_${session}`;
    const payload: Record<string, unknown> = {
      id: localId,
      dateAD: dateAd,
      dateBS,
      farmerId,
      milkType,
      session,
      morningQty,
      eveningQty,
      fatPercent,
      rateUsed,
      synced: false,
      editHistory: [],
      createdAt: new Date().toISOString(),
    };

    setSavingKeys((prev) => ({ ...prev, [key]: true }));
    try {
      await saveEntryLocal(payload);
      await queueForSync({ id: localId, collection: "entries", data: payload });
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to sync entry");
      const saved = await res.json();
      setSessions((prev) => ({
        ...prev,
        [key]: {
          _id: saved._id,
          farmerId,
          session,
          qty: String(qty),
          fat: String(fatPercent),
          rateUsed,
          saved: true,
          saving: false,
        },
      }));
      setTotalLiters((prev) => prev + qty);
      setTotalAmount((prev) => prev + qty * rateUsed);
    } catch (err) {
      console.error("Save entry failed", err);
      // Keep it as optimistic - user can see it saved locally even if server failed
      setSessions((prev) => ({
        ...prev,
        [key]: {
          _id: localId,
          farmerId,
          session,
          qty: String(qty),
          fat: String(fatPercent),
          rateUsed,
          saved: true,
          saving: false,
        },
      }));
      setTotalLiters((prev) => prev + qty);
      setTotalAmount((prev) => prev + qty * rateUsed);
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  const deleteSession = async (farmerId: string, session: SessionKey) => {
    const key = `${farmerId}_${session}`;
    const e = sessions[key];
    if (!e?._id) return;

    const qty = parseFloat(e.qty) || 0;
    const rate = e.rateUsed || 0;

    try {
      await fetch(`/api/entries/${e._id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
    setSessions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setTotalLiters((prev) => Math.max(0, prev - qty));
    setTotalAmount((prev) => Math.max(0, prev - qty * rate));
  };

  const activeFarmers = farmers.filter((f) => {
    const hasMorning = sessions[`${f._id}_morning`]?.saved;
    const hasEvening = sessions[`${f._id}_evening`]?.saved;
    return !hasMorning || !hasEvening;
  });

  const completedFarmers = farmers.filter((f) => {
    const hasMorning = sessions[`${f._id}_morning`]?.saved;
    const hasEvening = sessions[`${f._id}_evening`]?.saved;
    return hasMorning && hasEvening;
  });

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collect Milk</h1>
      </div>

      {/* Controls: Milk type + Date */}
      <div className="card">
        <MilkTypeToggle value={milkType} onChange={setMilkType} />
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-touch bg-gray-100 border-2 border-gray-800 rounded-xl text-base font-bold"
        >
          <span>📅</span>
          <span>{dateBS}</span>
          <span className="text-gray-500">▼</span>
        </button>
        {showDatePicker && (
          <input
            type="text"
            value={dateBS}
            onChange={(e) => {
              setDateBS(e.target.value);
              setShowDatePicker(false);
            }}
            className="mt-2 w-full px-4 py-3 min-h-touch border-2 border-blue-500 rounded-xl text-base font-bold text-center"
            autoFocus
            placeholder="YYYY-MM-DD (BS)"
          />
        )}
      </div>

      {/* Running total */}
      <div className="card bg-blue-50 border-blue-400">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-700">
              {milkType === "cow" ? "🐄 Cow" : "🐃 Buffalo"} — Today
            </p>
            <p className="text-xs text-gray-600">{dateBS}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-xl font-bold tabular-nums text-blue-800">
              {totalLiters.toFixed(1)} L
            </p>
            {totalAmount > 0 && (
              <p className="text-sm font-bold tabular-nums text-green-700">
                Rs. {totalAmount.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Farmers needing entry */}
      {activeFarmers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-700">
              ⏳ Pending ({activeFarmers.length})
            </h2>
          </div>
          {activeFarmers.map((f) => (
            <FarmerEntryRow
              key={f._id}
              farmer={f}
              milkType={milkType}
              dateBS={dateBS}
              slabs={slabs}
              sessions={sessions}
              savingKeys={savingKeys}
              onFieldChange={handleFieldChange}
              onSave={saveSession}
              onDelete={deleteSession}
              preselected={preselectedFarmer === f._id}
            />
          ))}
        </div>
      )}

      {/* Completed farmers */}
      {completedFarmers.length > 0 && (
        <details className="card border-green-400 bg-green-50/30">
          <summary className="font-bold text-sm text-green-700 cursor-pointer">
            ✅ Completed ({completedFarmers.length})
          </summary>
          <div className="mt-3 space-y-2">
            {completedFarmers.map((f) => (
              <div
                key={f._id}
                className="flex items-center justify-between bg-white border-2 border-green-200 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-bold text-sm">{f.name}</p>
                  <p className="text-xs text-gray-600">{f.code}</p>
                </div>
                <div className="text-right text-xs">
                  {sessions[`${f._id}_morning`] && (
                    <p>
                      ☀️ {sessions[`${f._id}_morning`].qty}L
                    </p>
                  )}
                  {sessions[`${f._id}_evening`] && (
                    <p>
                      🌙 {sessions[`${f._id}_evening`].qty}L
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Empty state */}
      {farmers.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">👨‍🌾</p>
          <h2 className="text-xl font-bold mb-2">No farmers added yet</h2>
          <p className="text-gray-600 mb-4">
            Add farmers first before you can record milk collection.
          </p>
          <a
            href="/farmers/new"
            className="inline-block px-6 py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            Add Farmer →
          </a>
        </div>
      )}

      {farmers.length > 0 && activeFarmers.length === 0 && completedFarmers.length > 0 && (
        <div className="card text-center py-6 border-green-500 bg-green-50">
          <p className="text-3xl mb-2">🎉</p>
          <h2 className="text-lg font-bold text-green-800">
            All farmers done for the day!
          </h2>
          <p className="text-sm text-gray-600">
            {totalLiters.toFixed(1)}L collected (Rs. {totalAmount.toFixed(2)})
          </p>
        </div>
      )}
    </div>
  );
}

export default function DailyEntry() {
  return (
    <Suspense fallback={<div className="p-4 text-center py-8 text-gray-500">Loading...</div>}>
      <DailyEntryInner />
    </Suspense>
  );
}
