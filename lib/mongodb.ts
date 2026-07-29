import { MongoClient, Db } from "mongodb";

const rawUri = process.env.MONGODB_URI || "mongodb://localhost:27017/dudh-hisab";

const isAtlas = rawUri.includes("mongodb+srv://") || rawUri.includes(".mongodb.net");

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!client) {
    client = new MongoClient(rawUri, isAtlas
      ? { tls: true, retryWrites: true, w: "majority" }
      : undefined
    );
    await client.connect();
  }
  db = client.db();
  return db;
}
