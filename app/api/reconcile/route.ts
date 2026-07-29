import { NextRequest, NextResponse } from "next/server";
import { getReconciliation, getPeriodDateRange } from "@/lib/reconciliation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodType = (searchParams.get("period") as "thisMonth" | "twoMonths" | "thisYear" | "allTime" | "custom") || "thisMonth";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const period = { type: periodType, from, to };
    const results = await getReconciliation(period);
    return NextResponse.json(results);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to calculate reconciliation" }, { status: 500 });
  }
}
