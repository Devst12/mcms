"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewFarmer() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, active }),
      });
      router.push("/farmers");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-5 pb-10">
        {/* Header */}
        <div>
          <Link href="/farmers" className="text-xs text-gray-400 font-semibold mb-1 block">
            ← Back
          </Link>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">नयाँ किसान</h1>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white shadow-sm px-4 py-4 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="किसानको नाम"
              className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 placeholder:font-normal outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Phone</label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98xxxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 placeholder:font-normal outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="ठेगाना (वैकल्पिक)"
              className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 placeholder:font-normal outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow resize-none"
            />
          </div>
          <label className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-3 cursor-pointer">
            <span className="text-[13.5px] font-semibold text-gray-700">Active</span>
            <span className="relative inline-flex">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="peer sr-only"
              />
              <span className="w-10 h-6 rounded-full bg-gray-300 peer-checked:bg-green-500 transition-colors" />
              <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow peer-checked:translate-x-4 transition-transform" />
            </span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-[15px] shadow-sm disabled:opacity-40 active:opacity-80 transition-opacity"
          >
            {saving ? "Saving…" : "Save Farmer"}
          </button>
        </form>
      </div>
    </div>
  );
}
