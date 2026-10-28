import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { Advance } from "@/lib/types";
import type { Farmer } from "@/lib/types";

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
        } else if (item.collection === "farmers") {
          const db = await getDb();
          const data = { ...item.data };
          const dataId = data.id;
          const existingId = data._id;
          delete data.id;
          delete data._id;
          delete data.synced;
          const farmerId = String(item.id || dataId || existingId || "");
          if (!farmerId) throw new Error("Missing farmer ID");
          const farmers = db.collection<Farmer>("farmers");
          let farmer = await farmers.findOne({ _id: farmerId });
          if (!farmer) {
            const nextNum = (await farmers.countDocuments()) + 1;
            await farmers.updateOne(
              { _id: farmerId },
              {
                $setOnInsert: {
                  ...data,
                  _id: farmerId,
                  code: `F${String(nextNum).padStart(3, "0")}`,
                  active: data.active ?? true,
                  createdAt: data.createdAt || new Date().toISOString(),
                },
              },
              { upsert: true }
            );
            farmer = await farmers.findOne({ _id: farmerId });
          }
          if (!farmer) throw new Error("Farmer sync did not return a record");
          serverId = farmerId;
          results.push({ id: item.id, success: true, serverId, serverFields: { code: farmer.code, synced: true } });
          continue;
        } else if (item.collection === "company_collections") {
          const { upsertCompanyCollection } = await import("@/lib/db");
          await upsertCompanyCollection(item.data);
        } else if (item.collection === "advances") {
          const db = await getDb();
          const { id: dataId, _id: existingId, ...data } = item.data || {};
          const advanceId = String(item.id || dataId || existingId || "");
          if (!advanceId) throw new Error("Missing advance ID");
          await db.collection<Advance>("advances").updateOne(
            { _id: advanceId },
            { $setOnInsert: { ...data, _id: advanceId, createdAt: data.createdAt || new Date().toISOString() } },
            { upsert: true }
          );
          serverId = advanceId;
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
