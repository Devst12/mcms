import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }
    const results = [];
    for (const item of items) {
      try {
        if (item.collection === "entries") {
          const { createEntry } = await import("@/lib/db");
          await createEntry(item.data);
        } else if (item.collection === "company_collections") {
          const { upsertCompanyCollection } = await import("@/lib/db");
          await upsertCompanyCollection(item.data);
        } else if (item.collection === "advances") {
          const { createAdvance } = await import("@/lib/db");
          await createAdvance(item.data);
        }
        results.push({ id: item.id, success: true });
      } catch {
        results.push({ id: item.id, success: false });
      }
    }
    return NextResponse.json({ results });
  } catch (_error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
