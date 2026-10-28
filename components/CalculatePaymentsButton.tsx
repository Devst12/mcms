"use client";

import { useState } from "react";

export default function CalculatePaymentsButton({ month }: { month: string }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const calculate = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      if (!response.ok) throw new Error("Could not calculate payments. Check your connection and try again.");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not calculate payments. Try again.");
      setSaving(false);
    }
  };

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={() => void calculate()}
        disabled={saving}
        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gray-900 text-white font-semibold text-[13px] shadow-sm disabled:opacity-60 active:opacity-80 transition-opacity"
      >
        {saving ? "Calculating…" : "Calculate"}
      </button>
      {error && <p role="alert" className="mt-2 max-w-48 text-xs text-red-700">{error}</p>}
    </div>
  );
}
