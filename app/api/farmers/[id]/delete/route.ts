import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.collection("farmers").deleteOne({ _id: id } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete farmer" }, { status: 500 });
  }
}
