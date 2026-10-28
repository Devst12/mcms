import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "dudh-hisab";
const DB_VERSION = 2;

let dbInstance: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("entries")) {
        const store = db.createObjectStore("entries", { keyPath: "id" });
        store.createIndex("dateAD", "dateAD");
        store.createIndex("farmerId", "farmerId");
        store.createIndex("synced", "synced");
      }
      if (!db.objectStoreNames.contains("farmers")) {
        db.createObjectStore("farmers", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("rate_slabs")) {
        db.createObjectStore("rate_slabs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("company_collections")) {
        const store = db.createObjectStore("company_collections", { keyPath: "id" });
        store.createIndex("dateAD", "dateAD");
      }
      if (!db.objectStoreNames.contains("advances")) {
        const store = db.createObjectStore("advances", { keyPath: "id" });
        store.createIndex("farmerId", "farmerId");
      }
      if (!db.objectStoreNames.contains("sync_queue")) {
        const store = db.createObjectStore("sync_queue", { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }
    },
  });
  return dbInstance;
}

export async function saveEntryLocal(entry: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  await db.put("entries", entry);
}

export async function getEntriesLocal(dateAD: string): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  return dedupeCachedEntries(await db.getAllFromIndex("entries", "dateAD", dateAD));
}

export async function getEntriesLocalRange(dateFrom: string, dateTo: string): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  const entries = await db.getAll("entries") as Record<string, unknown>[];
  return dedupeCachedEntries(entries.filter((entry) =>
    typeof entry.dateAD === "string" && entry.dateAD >= dateFrom && entry.dateAD <= dateTo
  ));
}

function dedupeCachedEntries(entries: Record<string, unknown>[]): Record<string, unknown>[] {
  const latestBySession = new Map<string, Record<string, unknown>>();
  for (const entry of entries) {
    const session = entry.session;
    const key = typeof session === "string" && session
      ? `${entry.dateAD}_${entry.farmerId}_${entry.milkType}_${session}`
      : String(entry.id || entry._id);
    const previous = latestBySession.get(key);
    if (!previous || String(entry.createdAt || "") > String(previous.createdAt || "")) {
      latestBySession.set(key, entry);
    }
  }
  return [...latestBySession.values()];
}

export async function saveFarmersLocal(farmers: Record<string, unknown>[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("farmers", "readwrite");
  await Promise.all([
    ...farmers.map((farmer) => tx.store.put({ ...farmer, id: farmer._id })),
    tx.done,
  ]);
}

export async function getFarmersLocal(): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  return db.getAll("farmers");
}

export async function saveRateSlabLocal(
  milkType: string,
  dateAD: string,
  slabs: Record<string, unknown>[],
  effectiveFromAD = dateAD
): Promise<void> {
  const db = await getDb();
  await db.put("rate_slabs", {
    id: `${effectiveFromAD}_${milkType}`,
    milkType,
    dateAD: effectiveFromAD,
    effectiveFromAD,
    slabs,
  });
}

export async function getRateSlabLocal(
  milkType: string,
  dateAD: string
): Promise<Record<string, unknown> | undefined> {
  const db = await getDb();
  const cached = await db.get("rate_slabs", `${dateAD}_${milkType}`);
  if (cached) return cached;
  const candidates = (await db.getAll("rate_slabs"))
    .filter((item) => item.milkType === milkType && String(item.effectiveFromAD || item.dateAD || "") <= dateAD)
    .sort((a, b) => String(b.effectiveFromAD || b.dateAD).localeCompare(String(a.effectiveFromAD || a.dateAD)));
  return candidates[0];
}

export async function saveCompanyCollectionLocal(cc: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  await db.put("company_collections", cc);
}

export async function saveAdvanceLocal(advance: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  await db.put("advances", advance);
}

export async function queueForSync(item: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  const payload = { ...item, timestamp: item.timestamp ?? Date.now() };
  await db.put("sync_queue", payload);
}

export async function getUnsyncedItems(storeName: string): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  const all = await db.getAll(storeName);
  return all.filter((item: Record<string, unknown>) => !(item as { synced?: boolean }).synced);
}

export async function markSynced(
  storeName: string,
  id: string,
  serverFields: Record<string, unknown> = {}
): Promise<void> {
  const db = await getDb();
  const item = await db.get(storeName, id);
  if (item) {
    Object.assign(item as Record<string, unknown>, serverFields, { synced: true });
    await db.put(storeName, item);
  }
}

export async function deleteEntryLocal(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("entries", id);
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDb();
  await db.clear("sync_queue");
}
