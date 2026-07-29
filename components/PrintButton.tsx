"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="px-4 py-3 min-h-touch bg-gray-600 text-white rounded-lg font-medium">
      Print
    </button>
  );
}
