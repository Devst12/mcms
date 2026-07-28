import { NextRequest, NextResponse } from "next/server";
import { getEntries, createEntry } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const farmerId = searchParams.get("farmerId") || undefined;
    const milkType = searchParams.get("milkType") || undefined;
    const entries = await getEntries(dateFrom, dateTo, farmerId, milkType);
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = await createEntry(body);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
