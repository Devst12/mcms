import { getDb } from "./mongodb";
import { ObjectId } from "mongodb";

async function seed() {
  const db = await getDb();

  const cowSlabs = [
    { minFat: 3.0, maxFat: 3.5, rate: 55 },
    { minFat: 3.5, maxFat: 4.0, rate: 60 },
    { minFat: 4.0, maxFat: 4.5, rate: 65 },
    { minFat: 4.5, maxFat: 99, rate: 70 },
  ];

  const buffaloSlabs = [
    { minFat: 4.0, maxFat: 5.0, rate: 80 },
    { minFat: 5.0, maxFat: 6.0, rate: 90 },
    { minFat: 6.0, maxFat: 7.0, rate: 100 },
    { minFat: 7.0, maxFat: 99, rate: 110 },
  ];

  await db.collection("rate_slabs").insertMany([
    {
      _id: new ObjectId().toHexString(),
      milkType: "cow",
      effectiveFromAD: "2026-01-01",
      slabs: cowSlabs,
      createdAt: new Date().toISOString(),
    },
    {
      _id: new ObjectId().toHexString(),
      milkType: "buffalo",
      effectiveFromAD: "2026-01-01",
      slabs: buffaloSlabs,
      createdAt: new Date().toISOString(),
    },
  ]);

  console.log("Seeded rate slabs");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
