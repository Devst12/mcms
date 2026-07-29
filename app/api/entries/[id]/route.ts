import { NextRequest, NextResponse } from "next/server";
import { getEntries, updateEntry, deleteEntry } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const entry = await updateEntry(id, body);
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    return NextResponse.json(entry);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const success = await deleteEntry(id);
    if (!success) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
