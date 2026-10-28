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
        let serverId: string | undefined;
        if (item.collection === "entries") {
          const { upsertEntryBySession } = await import("@/lib/db");
          const saved = await upsertEntryBySession(item.data);
          serverId = saved._id;
        } else if (item.collection === "company_collections") {
          const { upsertCompanyCollection } = await import("@/lib/db");
          await upsertCompanyCollection(item.data);
        } else if (item.collection === "advances") {
          const { createAdvance } = await import("@/lib/db");
          await createAdvance(item.data);
        }
        results.push({ id: item.id, success: true, serverId });
      } catch {
        results.push({ id: item.id, success: false });
      }
    }
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
