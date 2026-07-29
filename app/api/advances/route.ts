import { NextRequest, NextResponse } from "next/server";
import { getAdvances, createAdvance } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get("farmerId") || undefined;
    const advances = await getAdvances(farmerId);
    return NextResponse.json(advances);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch advances" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const advance = await createAdvance(body);
    return NextResponse.json(advance, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create advance" }, { status: 500 });
  }
}