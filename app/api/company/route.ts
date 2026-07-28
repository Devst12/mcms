import { NextRequest, NextResponse } from "next/server";
import { getCompanyCollections, upsertCompanyCollection } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const milkType = searchParams.get("milkType") || undefined;
    const collections = await getCompanyCollections(dateFrom, dateTo, milkType);
    return NextResponse.json(collections);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch company collections" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const collection = await upsertCompanyCollection(body);
    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save company collection" }, { status: 500 });
  }
}
