export interface DailyEntryLike {
  dateAD: string;
  dateBS: string;
  milkType: "cow" | "buffalo";
  morningQty: number;
  eveningQty: number;
  rateUsed: number;
}

export interface DailyEntrySummary {
  dateAD: string;
  dateBS: string;
  cowMorning: number;
  cowEvening: number;
  cowAmount: number;
  buffaloMorning: number;
  buffaloEvening: number;
  buffaloAmount: number;
  totalLiters: number;
  totalAmount: number;
}

export function summarizeEntriesByDay<T extends DailyEntryLike>(entries: readonly T[]): DailyEntrySummary[] {
  const byDate = new Map<string, DailyEntrySummary>();

  for (const entry of entries) {
    const dateKey = entry.dateAD || entry.dateBS;
    let day = byDate.get(dateKey);
    if (!day) {
      day = {
        dateAD: entry.dateAD,
        dateBS: entry.dateBS,
        cowMorning: 0,
        cowEvening: 0,
        cowAmount: 0,
        buffaloMorning: 0,
        buffaloEvening: 0,
        buffaloAmount: 0,
        totalLiters: 0,
        totalAmount: 0,
      };
      byDate.set(dateKey, day);
    }

    const liters = entry.morningQty + entry.eveningQty;
    const amount = liters * entry.rateUsed;
    if (entry.milkType === "cow") {
      day.cowMorning += entry.morningQty;
      day.cowEvening += entry.eveningQty;
      day.cowAmount += amount;
    } else {
      day.buffaloMorning += entry.morningQty;
      day.buffaloEvening += entry.eveningQty;
      day.buffaloAmount += amount;
    }
    day.totalLiters += liters;
    day.totalAmount += amount;
  }

  return [...byDate.values()].sort((a, b) =>
    (b.dateAD || b.dateBS).localeCompare(a.dateAD || a.dateBS)
  );
}
