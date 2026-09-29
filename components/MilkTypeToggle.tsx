"use client";

interface MilkTypeToggleProps {
  value: "cow" | "buffalo";
  onChange: (value: "cow" | "buffalo") => void;
}

export default function MilkTypeToggle({ value, onChange }: MilkTypeToggleProps) {
  return (
    <div className="inline-flex p-0.5 rounded-lg bg-gray-100 gap-0.5">
      <button
        onClick={() => onChange("cow")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
          value === "cow" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
        }`}
      >
        🐄 Cow
      </button>
      <button
        onClick={() => onChange("buffalo")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
          value === "buffalo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
        }`}
      >
        🐃 Buffalo
      </button>
    </div>
  );
}
