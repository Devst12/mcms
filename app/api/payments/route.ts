import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { calculatePayment, getAdvances, getEntries } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farmerId, month } = body;
    const db = await getDb();

    if (farmerId && month) {
      const result = await calculatePayment(farmerId, month);
      if (!result) {
        return NextResponse.json({ error: "No data found" }, { status: 404 });
      }

      const existing = await db.collection("payments").findOne({ farmerId, month });
      if (existing) {
        await db.collection("payments").updateOne(
          { _id: existing._id },
          {
            $set: {
              cowTotal: result.cowTotal,
              buffaloTotal: result.buffaloTotal,
              milkAmount: result.milkAmount,
              advancesDeducted: result.advancesDeducted,
              finalAmount: result.finalAmount,
            },
          }
        );
        return NextResponse.json({ ...existing, ...result });
      }

      const payment = {
        _id: new ObjectId().toHexString(),
        farmerId,
        month,
        milkType: "cow",
        totalLiters: result.cowTotal + result.buffaloTotal,
        milkAmount: result.milkAmount,
        advancesDeducted: result.advancesDeducted,
        finalAmount: result.finalAmount,
        paid: false,
      };
      await db.collection("payments").insertOne(payment);
      return NextResponse.json(payment, { status: 201 });
    }

    const batchMonth = body.month || new Date().toISOString().slice(0, 7);
    const farmers = await db.collection("farmers").find({ active: true }).toArray();

    const results = [];
    for (const farmer of farmers) {
      const fid = typeof farmer._id === 'string' ? farmer._id : farmer._id.toHexString();
      const result = await calculatePayment(fid, batchMonth);
      if (!result || (result.cowTotal + result.buffaloTotal === 0)) continue;

      const existing = await db.collection("payments").findOne({ farmerId: fid, month: batchMonth });
      const paymentData = {
        farmerId: fid,
        month: batchMonth,
        milkType: "cow",
        totalLiters: result.cowTotal + result.buffaloTotal,
        milkAmount: result.milkAmount,
        advancesDeducted: result.advancesDeducted,
        finalAmount: result.finalAmount,
        paid: false,
      };

      if (existing) {
        await db.collection("payments").updateOne(
          { _id: existing._id },
          { $set: paymentData }
        );
        results.push({ ...existing, ...paymentData });
      } else {
        const payment = {
          _id: new ObjectId().toHexString(),
          ...paymentData,
        };
        await db.collection("payments").insertOne(payment);
        results.push(payment);
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to generate payments" }, { status: 500 });
  }
}
