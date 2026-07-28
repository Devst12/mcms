import { NextRequest, NextResponse } from "next/server";
import { getFarmers, createFarmer } from "@/lib/db";

export async function GET() {
  try {
    const farmers = await getFarmers();
    return NextResponse.json(farmers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch farmers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const farmer = await createFarmer(body);
    return NextResponse.json(farmer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create farmer" }, { status: 500 });
  }
}
