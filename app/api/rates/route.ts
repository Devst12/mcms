import { NextRequest, NextResponse } from "next/server";
import { getRateSlabs, getActiveRateSlab } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const milkType = searchParams.get("milkType") as "cow" | "buffalo" | null;
    const dateAD = searchParams.get("dateAD") || undefined;

    if (milkType && dateAD) {
      const slab = await getActiveRateSlab(milkType, dateAD);
      return NextResponse.json(slab);
    }

    const slabs = await getRateSlabs(milkType || undefined);
    return NextResponse.json(slabs);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch rate slabs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { createRateSlab } = await import("@/lib/db");
    const slab = await createRateSlab(body);
    return NextResponse.json(slab, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create rate slab" }, { status: 500 });
  }
}
