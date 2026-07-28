import { getRateSlabs } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RatesPage() {
  const slabs = await getRateSlabs();
  const cowSlabs = slabs.filter((s) => s.milkType === "cow").sort((a, b) => b.effectiveFromAD.localeCompare(a.effectiveFromAD));
  const buffaloSlabs = slabs.filter((s) => s.milkType === "buffalo").sort((a, b) => b.effectiveFromAD.localeCompare(a.effectiveFromAD));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Rates ⚙️</h1>
      <div className="p-4 bg-white rounded-xl border">
        <h2 className="font-semibold mb-2">Current Rate Slabs (Cow 🐄)</h2>
        {cowSlabs.length === 0 && <p className="text-gray-500">No rate slabs defined</p>}
        {cowSlabs.map((slab) => (
          <div key={slab._id} className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Effective from: {slab.effectiveFromAD}</p>
            <div className="mt-2 space-y-1">
              {slab.slabs.map((s, i) => (
                <p key={i} className="text-base">{s.minFat}% - {s.maxFat}%: Rs. {s.rate}/L</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-white rounded-xl border">
        <h2 className="font-semibold mb-2">Current Rate Slabs (Buffalo 🐃)</h2>
        {buffaloSlabs.length === 0 && <p className="text-gray-500">No rate slabs defined</p>}
        {buffaloSlabs.map((slab) => (
          <div key={slab._id} className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Effective from: {slab.effectiveFromAD}</p>
            <div className="mt-2 space-y-1">
              {slab.slabs.map((s, i) => (
                <p key={i} className="text-base">{s.minFat}% - {s.maxFat}%: Rs. {s.rate}/L</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
