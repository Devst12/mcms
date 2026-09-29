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
    { key: "thisMonth", label: "यो महिना" },
    { key: "twoMonths", label: "२ महिना" },
    { key: "thisYear", label: "यो वर्ष" },
    { key: "allTime", label: "सबै" },
    { key: "custom", label: "अन्य" },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange({ type: p.key, from: value.from, to: value.to })}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${
              value.type === p.key
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value.type === "custom" && (
        <div className="flex gap-2">
          <input
            type="date"
            value={value.from || ""}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-[13px] font-semibold text-gray-800 outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow"
          />
          <input
            type="date"
            value={value.to || ""}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-[13px] font-semibold text-gray-800 outline-none ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-gray-400 transition-shadow"
          />
        </div>
      )}
    </div>
  );
}
