"use client";

import { useState } from "react";

interface DeleteFarmerButtonProps {
  farmerId: string;
  farmerName: string;
}

export default function DeleteFarmerButton({ farmerId, farmerName }: DeleteFarmerButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete farmer ${farmerName}? This cannot be undone.`)) return;
    setLoading(true);
    await fetch(`/api/farmers/${farmerId}/delete`, { method: "POST" });
    window.location.href = "/farmers";
  };

  return (
    <button onClick={handleDelete} disabled={loading} className="px-4 py-3 min-h-touch bg-red-600 text-white rounded-lg font-medium disabled:opacity-50">
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
