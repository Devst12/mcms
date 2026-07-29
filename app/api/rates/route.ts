import { NextRequest, NextResponse } from "next/server";
import { getRateSlabs, getActiveRateSlab, createRateSlab } from "@/lib/db";

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
    const { milkType, effectiveFromAD, slabs } = body;

    if (!milkType || !effectiveFromAD || !Array.isArray(slabs) || slabs.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedSlabs = slabs.map((s: Record<string, unknown>) => ({
      minFat: parseFloat(s.minFat as string),
      maxFat: parseFloat(s.maxFat as string),
      rate: parseFloat(s.rate as string),
    }));

    const slab = await createRateSlab({
      milkType,
      effectiveFromAD,
      slabs: parsedSlabs,
    });

    return NextResponse.json(slab, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create rate slab" }, { status: 500 });
  }
}
