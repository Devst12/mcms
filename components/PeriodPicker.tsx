"use client";

type PeriodType = "thisMonth" | "twoMonths" | "thisYear" | "allTime" | "custom";

export interface Period {
  type: PeriodType;
  from?: string;
  to?: string;
}

interface PeriodPickerProps {
  value: Period;
  onChange: (period: Period) => void;
}

export default function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const periods: { key: PeriodType; label: string }[] = [
    { key: "thisMonth", label: "This Month" },
    { key: "twoMonths", label: "2 Months" },
    { key: "thisYear", label: "This Year" },
    { key: "allTime", label: "All Time" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {periods.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange({ type: p.key, from: value.from, to: value.to })}
          className={`px-4 py-2 min-h-touch rounded-lg text-sm font-medium transition-colors ${
            value.type === p.key
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {p.label}
        </button>
      ))}
      {value.type === "custom" && (
        <div className="flex gap-2">
          <input
            type="date"
            value={value.from || ""}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="px-3 py-2 border rounded-lg min-h-touch"
          />
          <input
            type="date"
            value={value.to || ""}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="px-3 py-2 border rounded-lg min-h-touch"
          />
        </div>
      )}
    </div>
  );
}
