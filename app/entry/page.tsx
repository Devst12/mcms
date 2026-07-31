"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

interface Slab {
  minFat: number;
  maxFat: number;
  rate: number;
}

// ---------------------------------------------------------------------------
// Design tokens for this screen
// Cow  -> amber (warm, cream-toned — matches whole milk)
// Buffalo -> teal (cooler, richer — visually distinct at a glance)
// Neutral surface: stone/gray, no heavy borders — elevation via soft shadow
// ---------------------------------------------------------------------------
const ACCENT = {
  cow: {
    solid: "bg-amber-500",
    solidHover: "hover:bg-amber-600",
    text: "text-amber-700",
    bgSoft: "bg-amber-50",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
  },
  buffalo: {
    solid: "bg-teal-600",
    solidHover: "hover:bg-teal-700",
    text: "text-teal-700",
    bgSoft: "bg-teal-50",
    ring: "ring-teal-200",
    dot: "bg-teal-600",
  },
} as const;

function resolveRate(fatPercent: number, slabs: Slab[]): number {
  if (!slabs.length || fatPercent <= 0) return 0;
  const slab = slabs.find((s) => fatPercent >= s.minFat && fatPercent < s.maxFat);
  if (!slab) {
    const last = slabs[slabs.length - 1];
    if (fatPercent >= last.minFat) return last.rate;
    return slabs[0]?.rate || 0;
  }
  return slab.rate;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

// ---------------------------------------------------------------------------
// Session input row — flat, no border cards. One row per session.
// ---------------------------------------------------------------------------
function SessionRow({
  session,
  state,
  ratePreview,
  saving,
  accent,
  onChange,
  onSave,
  onDelete,
}: {
  session: SessionKey;
  state?: SessionState;
  ratePreview: number | null;
  saving: boolean;
  accent: typeof ACCENT.cow;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const isSaved = !!state?.saved;
  const qty = state?.qty || "";
  const fat = state?.fat || "";
  const amount = ratePreview !== null ? (parseFloat(qty) || 0) * ratePreview : 0;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[13px]">{session === "morning" ? "☀️" : "🌙"}</span>
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          {session === "morning" ? "Morning" : "Evening"}
        </span>
      </div>

      {!isSaved ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={qty}
                onChange={(e) => onChange("qty", e.target.value)}
                placeholder="0.0"
                className="w-full px-2.5 py-2.5 rounded-lg bg-gray-50 text-center text-[15px] font-semibold tabular-nums text-gray-900 placeholder:text-gray-300 placeholder:font-normal outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow"
              />
              <span className="pointer-events-none absolute -bottom-4 left-0 right-0 text-center text-[10px] text-gray-400">
                Liters
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={fat}
                onChange={(e) => onChange("fat", e.target.value)}
                placeholder="0.0"
                className="w-full px-2.5 py-2.5 rounded-lg bg-gray-50 text-center text-[15px] font-semibold tabular-nums text-gray-900 placeholder:text-gray-300 placeholder:font-normal outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow"
              />
              <span className="pointer-events-none absolute -bottom-4 left-0 right-0 text-center text-[10px] text-gray-400">
                Fat %
              </span>
            </div>
          </div>

          <div className="h-3" />

          {ratePreview !== null && qty ? (
            <div className={`flex items-center justify-between rounded-lg ${accent.bgSoft} px-2.5 py-1.5`}>
              <span className={`text-[11px] font-medium ${accent.text}`}>@ Rs {ratePreview}/L</span>
              <span className={`text-[13px] font-bold tabular-nums ${accent.text}`}>
                Rs {amount.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="h-[30px]" />
          )}

          <button
            onClick={onSave}
            disabled={saving || !qty}
            className={`w-full py-2.5 rounded-lg text-white text-[13px] font-semibold ${accent.solid} ${accent.solidHover} disabled:opacity-30 disabled:pointer-events-none transition-colors`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : (
        <div className={`rounded-lg ${accent.bgSoft} px-3 py-2.5 space-y-1.5`}>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-gray-500">Qty</span>
            <span className="text-[14px] font-bold tabular-nums text-gray-900">{qty} L</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-gray-500">Fat</span>
            <span className="text-[13px] font-semibold tabular-nums text-gray-700">{fat}%</span>
          </div>
          <div className={`flex items-baseline justify-between pt-1.5 border-t ${accent.ring}`}>
            <span className={`text-[11px] font-medium ${accent.text}`}>Amount</span>
            <span className={`text-[14px] font-bold tabular-nums ${accent.text}`}>
              Rs {amount.toFixed(2)}
            </span>
          </div>
          <button
            onClick={onDelete}
            className="w-full mt-1 py-1.5 rounded-md text-[11px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            Remove entry
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Milk type panel — the content shown for whichever type is toggled on
// ---------------------------------------------------------------------------
function MilkTypePanel({
  farmerId,
  milkType,
  sessions,
  slabs,
  savingKeys,
  onFieldChange,
  onSave,
  onDelete,
}: {
  farmerId: string;
  milkType: MilkTypeKey;
  sessions: Record<string, SessionState>;
  slabs: Slab[];
  savingKeys: Record<string, boolean>;
  onFieldChange: (farmerId: string, milkType: MilkTypeKey, session: SessionKey, field: string, value: string) => void;
  onSave: (farmerId: string, milkType: MilkTypeKey, session: SessionKey) => void;
  onDelete: (farmerId: string, milkType: MilkTypeKey, session: SessionKey) => void;
}) {
  const mornKey = `${farmerId}_${milkType}_morning`;
  const eveKey = `${farmerId}_${milkType}_evening`;
  const accent = ACCENT[milkType];

  const getRate = (session: SessionKey) => {
    const e = sessions[`${farmerId}_${milkType}_${session}`];
    if (!e || !e.fat) return null;
    return resolveRate(parseFloat(e.fat) || 0, slabs);
  };

  return (
    <div className="flex gap-3 pt-1">
      <SessionRow
        session="morning"
        state={sessions[mornKey]}
        ratePreview={getRate("morning")}
        saving={!!savingKeys[mornKey]}
        accent={accent}
        onChange={(field, value) => onFieldChange(farmerId, milkType, "morning", field, value)}
        onSave={() => onSave(farmerId, milkType, "morning")}
        onDelete={() => onDelete(farmerId, milkType, "morning")}
      />
      <div className="w-px bg-gray-100" />
      <SessionRow
        session="evening"
        state={sessions[eveKey]}
        ratePreview={getRate("evening")}
        saving={!!savingKeys[eveKey]}
        accent={accent}
        onChange={(field, value) => onFieldChange(farmerId, milkType, "evening", field, value)}
        onSave={() => onSave(farmerId, milkType, "evening")}
        onDelete={() => onDelete(farmerId, milkType, "evening")}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Segmented control for Cow / Buffalo with a completion dot per side
// ---------------------------------------------------------------------------
function MilkTypeToggle({
  value,
  cowDone,
  buffaloDone,
  onChange,
}: {
  value: MilkTypeKey;
  cowDone: boolean;
  buffaloDone: boolean;
  onChange: (v: MilkTypeKey) => void;
}) {
  const options: { key: MilkTypeKey; label: string; icon: string; done: boolean }[] = [
    { key: "cow", label: "Cow", icon: "🐄", done: cowDone },
    { key: "buffalo", label: "Buffalo", icon: "🐃", done: buffaloDone },
  ];

  return (
    <div className="inline-flex p-0.5 rounded-lg bg-gray-100 gap-0.5">
      {options.map((opt) => {
        const active = value === opt.key;
        const accent = ACCENT[opt.key];
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
              active ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
            }`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
            {opt.done && (
              <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} aria-label="complete" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function DailyEntryInner() {
  const searchParams = useSearchParams();
  const preselectedFarmer = searchParams.get("farmerId") || "";
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [dateBS, setDateBS] = useState(getTodayBs());
  const [cowSlabs, setCowSlabs] = useState<Slab[]>([]);
  const [buffaloSlabs, setBuffaloSlabs] = useState<Slab[]>([]);
  const [sessions, setSessions] = useState<Record<string, SessionState>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalLiters, setTotalLiters] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [activeType, setActiveType] = useState<Record<string, MilkTypeKey>>({});

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
    return () => {
      cancelled = true;
    };
  }, [dateBS]);

  useEffect(() => {
    let cancelled = false;
    const loadDayEntries = async () => {
      if (!dateBS) {
        setSessions({});
        return;
      }
      const dateAd = await (await import("@/lib/nepali-dates")).bsToAd(dateBS);
      const params = new URLSearchParams({ dateFrom: dateAd, dateTo: dateAd });
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
    return () => {
      cancelled = true;
    };
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

  const isTypeDone = (farmerId: string, milkType: MilkTypeKey) =>
    !!sessions[`${farmerId}_${milkType}_morning`]?.saved && !!sessions[`${farmerId}_${milkType}_evening`]?.saved;

  const activeFarmers = farmers.filter((f) => !isTypeDone(f._id, "cow") || !isTypeDone(f._id, "buffalo"));
  const completedFarmers = farmers.filter((f) => isTypeDone(f._id, "cow") || isTypeDone(f._id, "buffalo"));

  // flat list of every saved session, for the tabular completed view
  const completedRows = completedFarmers.flatMap((f) =>
    (["cow", "buffalo"] as MilkTypeKey[]).flatMap((mt) =>
      (["morning", "evening"] as SessionKey[])
        .map((s) => sessions[`${f._id}_${mt}_${s}`])
        .filter((e): e is SessionState => !!e?.saved)
        .map((e) => ({ farmer: f, entry: e }))
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Collect Milk</h1>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-sm text-[13px] font-semibold text-gray-700"
          >
            <span className="text-gray-400">📅</span>
            {dateBS}
          </button>
        </div>

        {showDatePicker && (
          <input
            type="text"
            value={dateBS}
            onChange={(e) => {
              setDateBS(e.target.value);
              setShowDatePicker(false);
            }}
            className="w-full px-4 py-3 rounded-xl bg-white shadow-sm outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 text-[15px] font-semibold text-center"
            autoFocus
            placeholder="YYYY-MM-DD (BS)"
          />
        )}

        {/* Running total */}
        <div className="rounded-2xl bg-white shadow-sm px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-gray-900">Today&apos;s Total</p>
            <p className="text-[11px] text-gray-400">{dateBS}</p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-bold tabular-nums text-gray-900 leading-tight">
              {totalLiters.toFixed(1)} <span className="text-[13px] font-medium text-gray-400">L</span>
            </p>
            {totalAmount > 0 && (
              <p className="text-[13px] font-semibold tabular-nums text-teal-600">
                Rs {totalAmount.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Farmers needing entry */}
        {activeFarmers.length > 0 && (
          <div className="space-y-3">
            {activeFarmers.map((f) => {
              const type = activeType[f._id] || "cow";
              const cowDone = isTypeDone(f._id, "cow");
              const bufDone = isTypeDone(f._id, "buffalo");
              return (
                <div
                  key={f._id}
                  className={`rounded-2xl bg-white shadow-sm px-4 py-4 ${
                    preselectedFarmer === f._id ? "ring-2 ring-gray-900/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold text-gray-500">
                        {getInitials(f.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-gray-900 truncate">{f.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {f.code}
                          {f.phone ? ` · ${f.phone}` : ""}
                        </p>
                      </div>
                    </div>
                    <MilkTypeToggle
                      value={type}
                      cowDone={cowDone}
                      buffaloDone={bufDone}
                      onChange={(v) => setActiveType((prev) => ({ ...prev, [f._id]: v }))}
                    />
                  </div>

                  <MilkTypePanel
                    farmerId={f._id}
                    milkType={type}
                    sessions={sessions}
                    slabs={type === "cow" ? cowSlabs : buffaloSlabs}
                    savingKeys={savingKeys}
                    onFieldChange={handleFieldChange}
                    onSave={saveSession}
                    onDelete={deleteSession}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Completed — tabular view */}
        {completedRows.length > 0 && (
          <details className="rounded-2xl bg-white shadow-sm overflow-hidden" open>
            <summary className="px-4 py-3 flex items-center justify-between cursor-pointer select-none">
              <span className="text-[13px] font-bold text-gray-900">
                Completed <span className="text-gray-400 font-medium">({completedFarmers.length})</span>
              </span>
              <span className="text-gray-300 text-[11px]">▾</span>
            </summary>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-gray-400 text-[10.5px] uppercase tracking-wide">
                  <th className="text-left font-medium px-4 pb-2">Farmer</th>
                  <th className="text-center font-medium pb-2">Type</th>
                  <th className="text-right font-medium pb-2">Qty</th>
                  <th className="text-right font-medium px-4 pb-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {completedRows.map(({ farmer, entry }) => {
                  const accent = ACCENT[entry.milkType];
                  const amount = (parseFloat(entry.qty) || 0) * (entry.rateUsed || 0);
                  return (
                    <tr key={`${farmer._id}_${entry.milkType}_${entry.session}`} className="text-gray-700">
                      <td className="px-4 py-2">
                        <p className="font-semibold text-gray-900 truncate max-w-[110px]">{farmer.name}</p>
                        <p className="text-[10.5px] text-gray-400">
                          {entry.session === "morning" ? "☀️ AM" : "🌙 PM"}
                        </p>
                      </td>
                      <td className="text-center py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full ${accent.bgSoft} ${accent.text} px-2 py-0.5 text-[10.5px] font-semibold`}
                        >
                          {entry.milkType === "cow" ? "🐄" : "🐃"}
                        </span>
                      </td>
                      <td className="text-right py-2 tabular-nums font-medium">{entry.qty} L</td>
                      <td className="text-right px-4 py-2 tabular-nums font-bold text-gray-900">
                        Rs {amount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </details>
        )}

        {/* Empty state */}
        {farmers.length === 0 && (
          <div className="rounded-2xl bg-white shadow-sm text-center py-10 px-6">
            <p className="text-3xl mb-3">👨‍🌾</p>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">No farmers added yet</h2>
            <p className="text-[13px] text-gray-400 mb-5">
              Add farmers first before you can record milk collection.
            </p>
            <a
              href="/farmers/new"
              className="inline-block px-5 py-2.5 rounded-full bg-gray-900 text-white text-[13px] font-semibold"
            >
              Add Farmer →
            </a>
          </div>
        )}

        {farmers.length > 0 && activeFarmers.length === 0 && completedFarmers.length > 0 && (
          <div className="rounded-2xl bg-teal-50 text-center py-6 px-6">
            <p className="text-2xl mb-1.5">🎉</p>
            <h2 className="text-[15px] font-bold text-teal-800">All farmers done for the day</h2>
            <p className="text-[12.5px] text-teal-600/80 tabular-nums">
              {totalLiters.toFixed(1)} L collected · Rs {totalAmount.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DailyEntry() {
  return (
    <Suspense fallback={<div className="p-4 text-center py-8 text-gray-400 text-sm">Loading…</div>}>
      <DailyEntryInner />
    </Suspense>
  );
}