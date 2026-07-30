"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
type MilkTypeKey = "cow" | "buffalo";

interface SessionState {
  _id?: string;
  farmerId: string;
  milkType: MilkTypeKey;
  session: SessionKey;
  qty: string;
  fat: string;
  rateUsed: number | null;
  saved: boolean;
  saving: boolean;
}

interface MilkTypeBlockProps {
  farmerId: string;
  milkType: MilkTypeKey;
  sessions: Record<string, SessionState>;
  slabs: { minFat: number; maxFat: number; rate: number }[];
  savingKeys: Record<string, boolean>;
  onFieldChange: (farmerId: string, milkType: MilkTypeKey, session: SessionKey, field: string, value: string) => void;
  onSave: (farmerId: string, milkType: MilkTypeKey, session: SessionKey) => void;
  onDelete: (farmerId: string, milkType: MilkTypeKey, session: SessionKey) => void;
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

function SessionCard({ session, state, ratePreview, saving, onChange, onSave, onDelete }: {
  session: SessionKey;
  state?: SessionState;
  ratePreview: number | null;
  saving: boolean;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const isSaved = !!state?.saved;
  const qty = state?.qty || "";
  const fat = state?.fat || "";

  return (
    <div className={`rounded-xl border-2 p-3 space-y-2 ${isSaved ? "bg-green-50 border-green-300 opacity-80" : "bg-white border-gray-800"}`}>
      <p className="text-xs font-bold text-gray-600">{session === "morning" ? "☀️ Morning" : "🌙 Evening"}</p>
      {!isSaved ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 font-bold">Liters</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={qty}
                onChange={(e) => onChange("qty", e.target.value)}
                className="w-full px-3 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white text-center tabular-nums"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold">Fat %</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={fat}
                onChange={(e) => onChange("fat", e.target.value)}
                className="w-full px-3 py-3 border-2 border-gray-800 rounded-xl text-base font-bold bg-white text-center tabular-nums"
                placeholder="0.0"
              />
            </div>
          </div>
          {ratePreview !== null && qty && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl px-3 py-2 text-center">
              <p className="text-xs text-gray-600">Amount</p>
              <p className="text-base font-bold text-green-700 tabular-nums">
                Rs. {((parseFloat(qty) || 0) * ratePreview).toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500">@ Rs. {ratePreview}/L</p>
            </div>
          )}
          <button
            onClick={onSave}
            disabled={saving || !qty}
            className="w-full px-3 py-3 min-h-touch bg-green-600 text-white rounded-xl font-bold text-sm disabled:opacity-40"
          >
            {saving ? "Saving..." : `Save ${session === "morning" ? "☀️" : "🌙"}`}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Liters</span>
            <span className="font-bold tabular-nums">{qty} L</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Fat %</span>
            <span className="font-bold tabular-nums">{fat}%</span>
          </div>
          {ratePreview !== null && (
            <div className="flex items-center justify-between border-t border-green-200 pt-1">
              <span className="text-xs text-gray-600">Amount</span>
              <span className="font-bold text-green-700 tabular-nums">
                Rs. {((parseFloat(qty) || 0) * ratePreview).toFixed(2)}
              </span>
            </div>
          )}
          <button
            onClick={onDelete}
            className="w-full px-2 py-2 min-h-touch bg-red-100 text-red-700 border-2 border-red-300 rounded-lg text-xs font-bold"
          >
            ✕ Remove
          </button>
        </>
      )}
    </div>
  );
}

function MilkTypeBlock({ farmerId, milkType, sessions, slabs, savingKeys, onFieldChange, onSave, onDelete }: MilkTypeBlockProps) {
  const mornKey = `${farmerId}_${milkType}_morning`;
  const eveKey = `${farmerId}_${milkType}_evening`;
  const mornState = sessions[mornKey];
  const eveState = sessions[eveKey];

  const getRate = (session: SessionKey) => {
    const e = sessions[`${farmerId}_${milkType}_${session}`];
    if (!e || !e.fat) return null;
    return resolveRate(parseFloat(e.fat) || 0, slabs);
  };

  const hasAny = mornState?.saved || eveState?.saved || !mornState?.saved || !eveState?.saved;

  if (!hasAny && Object.keys(sessions).filter((k) => k.startsWith(`${farmerId}_${milkType}_`)).length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <SessionCard
          session="morning"
          state={mornState}
          ratePreview={getRate("morning")}
          saving={!!savingKeys[mornKey]}
          onChange={(field, value) => onFieldChange(farmerId, milkType, "morning", field, value)}
          onSave={() => onSave(farmerId, milkType, "morning")}
          onDelete={() => onDelete(farmerId, milkType, "morning")}
        />
        <SessionCard
          session="evening"
          state={eveState}
          ratePreview={getRate("evening")}
          saving={!!savingKeys[eveKey]}
          onChange={(field, value) => onFieldChange(farmerId, milkType, "evening", field, value)}
          onSave={() => onSave(farmerId, milkType, "evening")}
          onDelete={() => onDelete(farmerId, milkType, "evening")}
        />
      </div>
    </div>
  );
}

function DailyEntryInner() {
  const searchParams = useSearchParams();
  const preselectedFarmer = searchParams.get("farmerId") || "";
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [dateBS, setDateBS] = useState(getTodayBs());
  const [cowSlabs, setCowSlabs] = useState<{ minFat: number; maxFat: number; rate: number }[]>([]);
  const [buffaloSlabs, setBuffaloSlabs] = useState<{ minFat: number; maxFat: number; rate: number }[]>([]);
  const [sessions, setSessions] = useState<Record<string, SessionState>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalLiters, setTotalLiters] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetch("/api/farmers")
      .then((r) => r.json())
      .then(setFarmers);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSlabs = async () => {
      const dateAd = await (await import("@/lib/nepali-dates")).bsToAd(dateBS);
      const [cowRes, bufRes] = await Promise.all([
        fetch(`/api/rates?milkType=cow&dateAD=${dateAd}`),
        fetch(`/api/rates?milkType=buffalo&dateAD=${dateAd}`),
      ]);
      if (!cancelled) {
        if (cowRes.ok) {
          const data = await cowRes.json();
          setCowSlabs(data?.slabs || []);
        }
        if (bufRes.ok) {
          const data = await bufRes.json();
          setBuffaloSlabs(data?.slabs || []);
        }
      }
    };
    loadSlabs();
    return () => { cancelled = true; };
  }, [dateBS]);

  useEffect(() => {
    let cancelled = false;
    const loadDayEntries = async () => {
      if (!dateBS) {
        setSessions({});
        return;
      }
      const dateAd = await (await import("@/lib/nepali-dates")).bsToAd(dateBS);
      const params = new URLSearchParams({
        dateFrom: dateAd,
        dateTo: dateAd,
      });
      try {
        const res = await fetch(`/api/entries?${params}`);
        if (!res.ok) throw new Error("Failed to fetch entries");
        const data = (await res.json()) as Array<{
          _id: string;
          farmerId: string;
          milkType: string;
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
          if (sess === "morning" || sess === "evening") {
            const key = `${e.farmerId}_${e.milkType}_${sess}`;
            next[key] = {
              _id: e._id,
              farmerId: e.farmerId,
              milkType: e.milkType as MilkTypeKey,
              session: sess,
              qty: sess === "morning" ? String(e.morningQty) : String(e.eveningQty),
              fat: String(e.fatPercent),
              rateUsed: e.rateUsed,
              saved: true,
              saving: false,
            };
            const qtyVal = sess === "morning" ? e.morningQty : e.eveningQty;
            totalL += qtyVal;
            totalAmt += qtyVal * e.rateUsed;
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
    return () => { cancelled = true; };
  }, [dateBS]);

  const handleFieldChange = (farmerId: string, milkType: MilkTypeKey, session: SessionKey, field: string, value: string) => {
    const key = `${farmerId}_${milkType}_${session}`;
    setSessions((prev) => {
      const next = { ...prev };
      const current = next[key];
      if (!current) {
        next[key] = {
          _id: undefined,
          farmerId,
          milkType,
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

  const saveSession = async (farmerId: string, milkType: MilkTypeKey, session: SessionKey) => {
    const key = `${farmerId}_${milkType}_${session}`;
    const e = sessions[key];
    if (!e) return;

    const qty = parseFloat(e.qty) || 0;
    if (qty <= 0) {
      alert("Please enter quantity");
      return;
    }

    const fatPercent = parseFloat(e.fat) || 0;
    const slabs = milkType === "cow" ? cowSlabs : buffaloSlabs;
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
          milkType,
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
    } catch {
      setSessions((prev) => ({
        ...prev,
        [key]: {
          _id: localId,
          farmerId,
          milkType,
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

  const deleteSession = async (farmerId: string, milkType: MilkTypeKey, session: SessionKey) => {
    const key = `${farmerId}_${milkType}_${session}`;
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
    const cowMorn = sessions[`${f._id}_cow_morning`]?.saved;
    const cowEve = sessions[`${f._id}_cow_evening`]?.saved;
    const bufMorn = sessions[`${f._id}_buffalo_morning`]?.saved;
    const bufEve = sessions[`${f._id}_buffalo_evening`]?.saved;
    const cowDone = cowMorn && cowEve;
    const bufDone = bufMorn && bufEve;
    return !cowDone || !bufDone;
  });

  const completedFarmers = farmers.filter((f) => {
    const cowMorn = sessions[`${f._id}_cow_morning`]?.saved;
    const cowEve = sessions[`${f._id}_cow_evening`]?.saved;
    const bufMorn = sessions[`${f._id}_buffalo_morning`]?.saved;
    const bufEve = sessions[`${f._id}_buffalo_evening`]?.saved;
    return (cowMorn && cowEve) || (bufMorn && bufEve);
  });

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collect Milk</h1>
      </div>

      {/* Date */}
      <div className="card">
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
            <p className="text-sm font-bold text-gray-700">Today&apos;s Total</p>
            <p className="text-xs text-gray-600">{dateBS}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold tabular-nums text-blue-800">{totalLiters.toFixed(1)} L</p>
            {totalAmount > 0 && (
              <p className="text-sm font-bold tabular-nums text-green-700">Rs. {totalAmount.toFixed(2)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Farmers needing entry */}
      {activeFarmers.length > 0 && (
        <div className="space-y-3">
          {activeFarmers.map((f) => (
            <div
              key={f._id}
              className={`card ${preselectedFarmer === f._id ? "border-blue-500 bg-blue-50" : ""}`}
            >
              <div className="mb-3">
                <p className="font-bold text-base">{f.name}</p>
                <p className="text-xs text-gray-600">
                  {f.code}
                  {f.phone ? ` | ${f.phone}` : ""}
                </p>
              </div>
              <div className="space-y-3">
                <MilkTypeBlock
                  farmerId={f._id}
                  milkType="cow"
                  sessions={sessions}
                  slabs={cowSlabs}
                  savingKeys={savingKeys}
                  onFieldChange={handleFieldChange}
                  onSave={saveSession}
                  onDelete={deleteSession}
                />
                <MilkTypeBlock
                  farmerId={f._id}
                  milkType="buffalo"
                  sessions={sessions}
                  slabs={buffaloSlabs}
                  savingKeys={savingKeys}
                  onFieldChange={handleFieldChange}
                  onSave={saveSession}
                  onDelete={deleteSession}
                />
              </div>
            </div>
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
                <div className="text-right text-xs space-y-0.5">
                  {sessions[`${f._id}_cow_morning`]?.saved && (
                    <p>🐄 ☀️ {sessions[`${f._id}_cow_morning`].qty}L</p>
                  )}
                  {sessions[`${f._id}_cow_evening`]?.saved && (
                    <p>🐄 🌙 {sessions[`${f._id}_cow_evening`].qty}L</p>
                  )}
                  {sessions[`${f._id}_buffalo_morning`]?.saved && (
                    <p>🐃 ☀️ {sessions[`${f._id}_buffalo_morning`].qty}L</p>
                  )}
                  {sessions[`${f._id}_buffalo_evening`]?.saved && (
                    <p>🐃 🌙 {sessions[`${f._id}_buffalo_evening`].qty}L</p>
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
          <p className="text-gray-600 mb-4">Add farmers first before you can record milk collection.</p>
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
          <h2 className="text-lg font-bold text-green-800">All farmers done for the day!</h2>
          <p className="text-sm text-gray-600">{totalLiters.toFixed(1)}L collected (Rs. {totalAmount.toFixed(2)})</p>
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
