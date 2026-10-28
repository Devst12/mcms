import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const farmerId = searchParams.get("farmerId") || undefined;
    const milkType = searchParams.get("milkType") || undefined;
    const entries = await import("@/lib/db").then(m => m.getEntries(dateFrom, dateTo, farmerId, milkType));
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDb();
    const { createEntry, getActiveRateSlab } = await import("@/lib/db");

    const session = body.session || "both";
    const existing = await db.collection("entries").findOne({
      dateAD: body.dateAD,
      farmerId: body.farmerId,
      milkType: body.milkType,
      session,
    });

    if (existing) {
      let rateUsed = body.rateUsed;
      if (!rateUsed && body.fatPercent) {
        const slab = await getActiveRateSlab(body.milkType, body.dateAD);
        if (slab) {
          const s = slab.slabs.find(s => body.fatPercent >= s.minFat && body.fatPercent < s.maxFat);
          rateUsed = s ? s.rate : slab.slabs[slab.slabs.length - 1]?.rate || 0;
        }
      }
      await db.collection("entries").updateOne(
        { _id: existing._id },
        { $set: { morningQty: body.morningQty, eveningQty: body.eveningQty, fatPercent: body.fatPercent, rateUsed, session } }
      );
      const fresh = await db.collection("entries").findOne({ _id: existing._id });
      return NextResponse.json(fresh);
    }

    const entry = await createEntry(body);
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
