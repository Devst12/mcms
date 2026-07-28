"use client";

import { RefreshCw } from "lucide-react";

interface SyncStatusProps {
  count: number;
  onSync: () => void;
}

export default function SyncStatus({ count, onSync }: SyncStatusProps) {
  return (
    <div className="flex items-center gap-2">
      {count > 0 && (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full min-h-touch flex items-center">
          {count} pending
        </span>
      )}
      <button
        onClick={onSync}
        disabled={count === 0}
        className="flex items-center gap-1 px-3 py-2 min-h-touch bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw size={16} />
        Sync Now
      </button>
    </div>
  );
}
