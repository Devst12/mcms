"use client";

import { useState, useEffect } from "react";
import Farmer from "@/components/Farmer";
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Farmers 🧑‍🌾 किसान</h1>
        <Link href="/farmers/new" className="px-4 py-3 min-h-touch bg-blue-600 text-white rounded-lg font-medium">
          Add Farmer
        </Link>
      </div>
      <input
        type="text"
        placeholder="Search farmers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 min-h-touch border rounded-lg text-base"
      />
      <div className="space-y-2">
        {filtered.map((f) => (
          <Link key={f._id} href={`/farmers/${f._id}`} className="block">
            <div className={`p-4 rounded-xl border ${f.active ? "bg-white" : "bg-gray-100 opacity-60"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-large">{f.name}</p>
                  <p className="text-sm text-gray-600">{f.code} | {f.phone}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                  {f.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
