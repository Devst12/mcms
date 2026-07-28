import { getDb } from "./mongodb";
import { Farmer, RateSlab, Entry, CompanyCollection, Advance, Payment } from "./types";

export async function getFarmers(): Promise<Farmer[]> {
  const db = await getDb();
  return db.collection<Farmer>("farmers").find({}).sort({ code: 1 }).toArray();
}

export async function getFarmerById(id: string): Promise<Farmer | null> {
  const db = await getDb();
  return db.collection<Farmer>("farmers").findOne({ _id: new (await import("mongodb")).ObjectId(id) });
}

export async function getFarmerByCode(code: string): Promise<Farmer | null> {
  const db = await getDb();
  return db.collection<Farmer>("farmers").findOne({ code });
}

export async function createFarmer(data: Omit<Farmer, "_id" | "code" | "createdAt"> & { code?: string }): Promise<Farmer> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const farmers = await db.collection<Farmer>("farmers").find({}).sort({ code: 1 }).toArray();
  const nextNum = farmers.length + 1;
  const code = data.code || `F${String(nextNum).padStart(3, "0")}`;
  const farmer: Farmer = {
    ...data,
    _id: new ObjectId().toHexString(),
    code,
    createdAt: new Date().toISOString(),
  };
  await db.collection<Farmer>("farmers").insertOne(farmer);
  return farmer;
}

export async function updateFarmer(id: string, data: Partial<Farmer>): Promise<Farmer | null> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const result = await db.collection<Farmer>("farmers").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" }
  );
  return result ?? null;
}

export async function deleteFarmer(id: string): Promise<boolean> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const result = await db.collection<Farmer>("farmers").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function getEntries(dateFrom?: string, dateTo?: string, farmerId?: string, milkType?: string): Promise<Entry[]> {
  const db = await getDb();
  const query: Record<string, unknown> = {};
  if (dateFrom || dateTo) {
    query.dateAD = {};
    if (dateFrom) (query.dateAD as Record<string, string>).$gte = dateFrom;
    if (dateTo) (query.dateAD as Record<string, string>).$lte = dateTo;
  }
  if (farmerId) query.farmerId = farmerId;
  if (milkType) query.milkType = milkType;
  return db.collection<Entry>("entries").find(query).sort({ dateAD: -1 }).toArray();
}

export async function createEntry(data: Omit<Entry, "_id" | "createdAt">): Promise<Entry> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const entry: Entry = {
    ...data,
    _id: new ObjectId().toHexString(),
    createdAt: new Date().toISOString(),
  };
  await db.collection<Entry>("entries").insertOne(entry);
  return entry;
}

export async function updateEntry(id: string, data: Partial<Entry>): Promise<Entry | null> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const result = await db.collection<Entry>("entries").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" }
  );
  return result ?? null;
}

export async function getCompanyCollections(dateFrom?: string, dateTo?: string, milkType?: string): Promise<CompanyCollection[]> {
  const db = await getDb();
  const query: Record<string, unknown> = {};
  if (dateFrom || dateTo) {
    query.dateAD = {};
    if (dateFrom) (query.dateAD as Record<string, string>).$gte = dateFrom;
    if (dateTo) (query.dateAD as Record<string, string>).$lte = dateTo;
  }
  if (milkType) query.milkType = milkType;
  return db.collection<CompanyCollection>("company_collections").find(query).sort({ dateAD: -1 }).toArray();
}

export async function upsertCompanyCollection(data: Omit<CompanyCollection, "_id" | "createdAt">): Promise<CompanyCollection> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const existing = await db.collection<CompanyCollection>("company_collections").findOne({
    dateAD: data.dateAD,
    milkType: data.milkType,
  });
  if (existing) {
    await db.collection<CompanyCollection>("company_collections").updateOne(
      { _id: existing._id },
      { $set: { reportedQty: data.reportedQty, notes: data.notes, synced: data.synced } }
    );
    return { ...existing, ...data };
  }
  const doc: CompanyCollection = {
    ...data,
    _id: new ObjectId().toHexString(),
    createdAt: new Date().toISOString(),
  };
  await db.collection<CompanyCollection>("company_collections").insertOne(doc);
  return doc;
}

export async function getRateSlabs(milkType?: string): Promise<RateSlab[]> {
  const db = await getDb();
  const query = milkType ? { milkType } : {};
  return db.collection<RateSlab>("rate_slabs").find(query).sort({ effectiveFromAD: -1 }).toArray();
}

export async function getActiveRateSlab(milkType: string, dateAD: string): Promise<RateSlab | null> {
  const db = await getDb();
  return db
    .collection<RateSlab>("rate_slabs")
    .find({ milkType, effectiveFromAD: { $lte: dateAD } })
    .sort({ effectiveFromAD: -1 })
    .limit(1)
    .next();
}

export async function createRateSlab(data: Omit<RateSlab, "_id" | "createdAt">): Promise<RateSlab> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const slab: RateSlab = {
    ...data,
    _id: new ObjectId().toHexString(),
    createdAt: new Date().toISOString(),
  };
  await db.collection<RateSlab>("rate_slabs").insertOne(slab);
  return slab;
}

export async function getAdvances(farmerId?: string): Promise<Advance[]> {
  const db = await getDb();
  const query = farmerId ? { farmerId } : {};
  return db.collection<Advance>("advances").find(query).sort({ dateAD: -1 }).toArray();
}

export async function createAdvance(data: Omit<Advance, "_id" | "createdAt">): Promise<Advance> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const advance: Advance = {
    ...data,
    _id: new ObjectId().toHexString(),
    createdAt: new Date().toISOString(),
  };
  await db.collection<Advance>("advances").insertOne(advance);
  return advance;
}

export async function settleAdvance(id: string, paymentId: string): Promise<boolean> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const result = await db.collection<Advance>("advances").updateOne(
    { _id: new ObjectId(id) },
    { $set: { settled: true, settledInPaymentId: paymentId } }
  );
  return result.modifiedCount > 0;
}

export async function getPayments(farmerId?: string, month?: string): Promise<Payment[]> {
  const db = await getDb();
  const query: Record<string, unknown> = {};
  if (farmerId) query.farmerId = farmerId;
  if (month) query.month = month;
  return db.collection<Payment>("payments").find(query).sort({ month: -1 }).toArray();
}

export async function calculatePayment(farmerId: string, month: string): Promise<{
  cowTotal: number;
  buffaloTotal: number;
  milkAmount: number;
  advancesDeducted: number;
  finalAmount: number;
} | null> {
  const db = await getDb();
  const [entries] = await Promise.all([
    db.collection<Entry>("entries").find({ farmerId, dateAD: { $regex: `^${month}` } }).toArray(),
    db.collection<Advance>("advances").find({ farmerId, settled: false }).toArray(),
  ]);
  const cowEntries = entries.filter((e) => e.milkType === "cow");
  const buffaloEntries = entries.filter((e) => e.milkType === "buffalo");
  const cowTotal = cowEntries.reduce((sum, e) => sum + e.morningQty + e.eveningQty, 0);
  const buffaloTotal = buffaloEntries.reduce((sum, e) => sum + e.morningQty + e.eveningQty, 0);
  const milkAmount = cowEntries.reduce((sum, e) => sum + (e.morningQty + e.eveningQty) * e.rateUsed, 0) +
    buffaloEntries.reduce((sum, e) => sum + (e.morningQty + e.eveningQty) * e.rateUsed, 0);
  const advancesDeducted = advances.reduce((sum, a) => sum + a.amount, 0);
  const finalAmount = Math.max(0, milkAmount - advancesDeducted);
  return { cowTotal, buffaloTotal, milkAmount, advancesDeducted, finalAmount };
}

export async function createPayment(data: Omit<Payment, "_id">): Promise<Payment> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const payment: Payment = {
    ...data,
    _id: new ObjectId().toHexString(),
  };
  await db.collection<Payment>("payments").insertOne(payment);
  return payment;
}

export async function markPaymentPaid(id: string): Promise<boolean> {
  const db = await getDb();
  const ObjectId = (await import("mongodb")).ObjectId;
  const result = await db.collection<Payment>("payments").updateOne(
    { _id: new ObjectId(id) },
    { $set: { paid: true, paidAt: new Date().toISOString() } }
  );
  return result.modifiedCount > 0;
}
