import { NextRequest, NextResponse } from "next/server";
import { markPaymentPaid } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await markPaymentPaid(id);
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to mark as paid" }, { status: 500 });
  }
}
