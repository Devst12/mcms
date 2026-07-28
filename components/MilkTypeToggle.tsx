"use client";

import { Cow, MilkIcon as Buffalo } from "lucide-react";

interface MilkTypeToggleProps {
  value: "cow" | "buffalo";
  onChange: (value: "cow" | "buffalo") => void;
}

export default function MilkTypeToggle({ value, onChange }: MilkTypeToggleProps) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => onChange("cow")}
        className={`flex items-center gap-2 px-6 py-3 min-h-touch rounded-xl text-base font-bold transition-colors ${
          value === "cow"
            ? "bg-cow text-gray-900 border-2 border-gray-800"
            : "bg-gray-100 text-gray-500 border-2 border-transparent"
        }`}
      >
        <Cow size={24} />
        Cow 🐄
      </button>
      <button
        onClick={() => onChange("buffalo")}
        className={`flex items-center gap-2 px-6 py-3 min-h-touch rounded-xl text-base font-bold transition-colors ${
          value === "buffalo"
            ? "bg-buffalo text-gray-900 border-2 border-gray-800"
            : "bg-gray-100 text-gray-500 border-2 border-transparent"
        }`}
      >
        <Buffalo size={24} />
        Buffalo 🐃
      </button>
    </div>
  );
}
