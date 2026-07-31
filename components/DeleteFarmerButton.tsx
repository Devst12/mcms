"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

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
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center"
      title="Delete farmer"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Trash2 size={16} strokeWidth={2} />
      )}
    </button>
  );
}
