import { getEntries, getCompanyCollections } from "./db";

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
      return { from: period.from || `${year}-01-01`, to: period.to || `${year}-12-31"` };
    default:
      return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
}

export async function getReconciliation(period: Period): Promise<{
  cow: { farmerTotal: number; companyTotal: number; diff: number; diffPercent: number; status: "match" | "shortage" | "excess" };
  buffalo: { farmerTotal: number; companyTotal: number; diff: number; diffPercent: number; status: "match" | "shortage" | "excess" };
  combined: { farmerTotal: number; companyTotal: number; diff: number; diffPercent: number; status: "match" | "shortage" | "excess" };
}> {
  const { from, to } = getPeriodDateRange(period);
  const [entries, companyEntries] = await Promise.all([
    getEntries(from, to),
    getCompanyCollections(from, to),
  ]);

  const totals = { cow: 0, buffalo: 0 };
  for (const e of entries) {
    totals[e.milkType] += e.morningQty + e.eveningQty;
  }

  const companyTotals = { cow: 0, buffalo: 0 };
  for (const c of companyEntries) {
    companyTotals[c.milkType] += c.reportedQty;
  }

  const calc = (type: "cow" | "buffalo") => {
    const farmerTotal = totals[type];
    const companyTotal = companyTotals[type];
    const diff = farmerTotal - companyTotal;
    const diffPercent = companyTotal ? (diff / companyTotal) * 100 : 0;
    const status: "match" | "shortage" | "excess" = Math.abs(diffPercent) < 1 ? "match" : diff > 0 ? "excess" : "shortage";
    return { farmerTotal, companyTotal, diff, diffPercent, status };
  };

  const cow = calc("cow");
  const buffalo = calc("buffalo");
  const combined = calc("cow");
  combined.farmerTotal = cow.farmerTotal + buffalo.farmerTotal;
  combined.companyTotal = cow.companyTotal + buffalo.companyTotal;
  combined.diff = combined.farmerTotal - combined.companyTotal;
  combined.diffPercent = combined.companyTotal ? (combined.diff / combined.companyTotal) * 100 : 0;
  combined.status = Math.abs(combined.diffPercent) < 1 ? "match" : combined.diff > 0 ? "excess" : "shortage";

  return { cow, buffalo, combined };
}
