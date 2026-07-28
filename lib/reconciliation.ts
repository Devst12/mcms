import { getEntries, getCompanyCollections, getFarmerById } from "./db";
import { Entry, CompanyCollection, Farmer } from "./types";

export type PeriodType = "thisMonth" | "twoMonths" | "thisYear" | "allTime" | "custom";

export interface Period {
  type: PeriodType;
  from?: string;
  to?: string;
}

export function getPeriodDateRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  switch (period.type) {
    case "thisMonth":
      return {
        from: `${year}-${String(month + 1).padStart(2, "0")}-01`,
        to: `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`,
      };
    case "twoMonths": {
      const fromMonth = month === 0 ? 11 : month - 1;
      const fromYear = month === 0 ? year - 1 : year;
      return {
        from: `${fromYear}-${String(fromMonth + 1).padStart(2, "0")}-01`,
        to: `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`,
      };
    }
    case "thisYear":
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case "allTime":
      return { from: "2000-01-01", to: "2099-12-31" };
    case "custom":
      return { from: period.from || `${year}-01-01`, to: period.to || `${year}-12-31` };
    default:
      return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
}

export async function getFarmerTotals(
  farmerId: string,
  period: Period
): Promise<{
  cowMorning: number;
  cowEvening: number;
  buffaloMorning: number;
  buffaloEvening: number;
  cowAmount: number;
  buffaloAmount: number;
}> {
  const { from, to } = getPeriodDateRange(period);
  const entries = await getEntries(from, to, farmerId);
  const cow = entries.filter((e) => e.milkType === "cow");
  const buffalo = entries.filter((e) => e.milkType === "buffalo");
  return {
    cowMorning: cow.reduce((sum, e) => sum + e.morningQty, 0),
    cowEvening: cow.reduce((sum, e) => sum + e.eveningQty, 0),
    buffaloMorning: buffalo.reduce((sum, e) => sum + e.morningQty, 0),
    buffaloEvening: buffalo.reduce((sum, e) => sum + e.eveningQty, 0),
    cowAmount: cow.reduce((sum, e) => sum + (e.morningQty + e.eveningQty) * e.rateUsed, 0),
    buffaloAmount: buffalo.reduce((sum, e) => sum + (e.morningQty + e.eveningQty) * e.rateUsed, 0),
  };
}

export async function getReconciliation(period: Period): Promise<
  Array<{
    farmerId: string;
    farmerName: string;
    farmerCow: number;
    farmerBuffalo: number;
    companyCow: number;
    companyBuffalo: number;
    cowDiff: number;
    buffaloDiff: number;
    totalDiff: number;
    status: "match" | "shortage" | "excess";
  }>
> {
  const { from, to } = getPeriodDateRange(period);
  const [entries, companyEntries] = await Promise.all([
    getEntries(from, to),
    getCompanyCollections(from, to),
  ]);
  const farmerMap = new Map<string, { cow: number; buffalo: number }>();
  for (const entry of entries) {
    const current = farmerMap.get(entry.farmerId) || { cow: 0, buffalo: 0 };
    if (entry.milkType === "cow") current.cow += entry.morningQty + entry.eveningQty;
    else current.buffalo += entry.morningQty + entry.eveningQty;
    farmerMap.set(entry.farmerId, current);
  }
  const companyMap = new Map<string, { cow: number; buffalo: number }>();
  for (const comp of companyEntries) {
    const key = `${comp.dateAD}_${comp.milkType}`;
    companyMap.set(key, { cow: 0, buffalo: 0 });
  }
  const farmerIds = Array.from(farmerMap.keys());
  const results = [];
  for (const fid of farmerIds) {
    const farmer = await getFarmerById(fid);
    const totals = farmerMap.get(fid)!;
    const companyCow = companyEntries
      .filter((c) => c.milkType === "cow")
      .reduce((sum, c) => sum + c.reportedQty, 0);
    const companyBuffalo = companyEntries
      .filter((c) => c.milkType === "buffalo")
      .reduce((sum, c) => sum + c.reportedQty, 0);
    const cowDiff = totals.cow - companyCow;
    const buffaloDiff = totals.buffalo - companyBuffalo;
    const totalDiff = cowDiff + buffaloDiff;
    const status = totalDiff === 0 ? "match" : totalDiff < 0 ? "shortage" : "excess";
    results.push({
      farmerId: fid,
      farmerName: farmer?.name || "Unknown",
      farmerCow: totals.cow,
      farmerBuffalo: totals.buffalo,
      companyCow,
      companyBuffalo,
      cowDiff,
      buffaloDiff,
      totalDiff,
      status,
    });
  }
  return results;
}
