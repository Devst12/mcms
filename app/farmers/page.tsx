"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FarmerData {
  _id: string;
  code: string;
  name: string;
  phone: string;
  active: boolean;
}

export default function FarmersList() {
  const [farmers, setFarmers] = useState<FarmerData[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/farmers")
      .then((r) => r.json())
      .then(setFarmers);
  }, []);

  const filtered = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.phone.includes(search)
  );

  const activeFarmers = filtered.filter((f) => f.active);
  const inactiveFarmers = filtered.filter((f) => !f.active);

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Farmers</h1>
          <p className="text-sm text-gray-600 font-medium">
            {farmers.filter((f) => f.active).length} active
          </p>
        </div>
        <Link
          href="/farmers/new"
          className="px-5 py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
        >
          + Add Farmer
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input
          type="text"
          placeholder="Search by name, code or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 min-h-touch border-2 border-gray-800 rounded-xl text-base font-bold bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
      </div>

      {/* Active Farmers */}
      {activeFarmers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Active</h2>
          {activeFarmers.map((f) => (
            <Link key={f._id} href={`/farmers/${f._id}`} className="block">
              <div className="card hover:bg-gray-50 transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base truncate">{f.name}</p>
                    <p className="text-xs text-gray-600">
                      {f.code}
                      {f.phone ? ` | ${f.phone}` : ""}
                    </p>
                  </div>
                  <span className="ml-2 shrink-0 text-xl text-gray-400">›</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Inactive Farmers */}
      {inactiveFarmers.length > 0 && (
        <details className="card border-gray-300 bg-gray-50">
          <summary className="font-bold text-sm text-gray-600 cursor-pointer">
            Inactive ({inactiveFarmers.length})
          </summary>
          <div className="mt-3 space-y-2">
            {inactiveFarmers.map((f) => (
              <Link key={f._id} href={`/farmers/${f._id}`} className="block">
                <div className="p-4 rounded-xl border-2 border-gray-300 bg-white opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate">{f.name}</p>
                      <p className="text-xs text-gray-600">
                        {f.code}
                        {f.phone ? ` | ${f.phone}` : ""}
                      </p>
                    </div>
                    <span className="ml-2 shrink-0 text-xl text-gray-400">›</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </details>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">👨‍🌾</p>
          <h2 className="text-xl font-bold mb-2">
            {search ? "No farmers match your search" : "No farmers yet"}
          </h2>
          <p className="text-gray-600 mb-4">
            {search
              ? "Try a different name, code or phone number."
              : "Add your first farmer to start collecting milk."}
          </p>
          {!search && (
            <Link
              href="/farmers/new"
              className="inline-block px-6 py-3 min-h-touch bg-blue-600 text-white rounded-xl font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
            >
              Add Farmer →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
