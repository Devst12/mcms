"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewFarmer() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [active, setActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/farmers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, address, active }),
    });
    router.push("/farmers");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">New Farmer</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 min-h-touch border rounded-lg text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full px-4 py-3 min-h-touch border rounded-lg text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border rounded-lg text-base"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="active" className="text-base font-medium">Active</label>
        </div>
        <button type="submit" className="w-full px-4 py-3 min-h-touch bg-blue-600 text-white rounded-lg font-medium">
          Save Farmer
        </button>
      </form>
    </div>
  );
}
