import { getRateSlabs } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
        <form action="/api/rates" method="POST" className="mt-4 p-3 bg-cow rounded-lg border">
          <h3 className="font-semibold mb-2">Add Cow Rate Slab</h3>
          <input type="hidden" name="milkType" value="cow" />
          <div className="flex flex-wrap gap-2 mb-2">
            <input type="date" name="effectiveFromAD" required className="px-3 py-2 border rounded-lg min-h-touch" />
          </div>
          <div className="space-y-2" id="cow-slabs">
            <div className="flex gap-2">
              <input type="number" step="0.1" name="cowMinFat[]" placeholder="Min Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
              <input type="number" step="0.1" name="cowMaxFat[]" placeholder="Max Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
              <input type="number" step="0.1" name="cowRate[]" placeholder="Rate" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
            </div>
            <div className="flex gap-2">
              <input type="number" step="0.1" name="cowMinFat[]" placeholder="Min Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
              <input type="number" step="0.1" name="cowMaxFat[]" placeholder="Max Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
              <input type="number" step="0.1" name="cowRate[]" placeholder="Rate" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 min-h-touch bg-green-600 text-white rounded-lg font-medium">Save Cow Slab</button>
        </form>
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
        <form action="/api/rates" method="POST" className="mt-4 p-3 bg-buffalo rounded-lg border">
          <h3 className="font-semibold mb-2">Add Buffalo Rate Slab</h3>
          <input type="hidden" name="milkType" value="buffalo" />
          <div className="flex flex-wrap gap-2 mb-2">
            <input type="date" name="effectiveFromAD" required className="px-3 py-2 border rounded-lg min-h-touch" />
          </div>
          <div className="space-y-2" id="buffalo-slabs">
            <div className="flex gap-2">
              <input type="number" step="0.1" name="buffaloMinFat[]" placeholder="Min Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
              <input type="number" step="0.1" name="buffaloMaxFat[]" placeholder="Max Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
              <input type="number" step="0.1" name="buffaloRate[]" placeholder="Rate" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
            </div>
            <div className="flex gap-2">
              <input type="number" step="0.1" name="buffaloMinFat[]" placeholder="Min Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
              <input type="number" step="0.1" name="buffaloMaxFat[]" placeholder="Max Fat%" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
              <input type="number" step="0.1" name="buffaloRate[]" placeholder="Rate" required className="w-24 px-2 py-2 border rounded-lg min-h-touch" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 min-h-touch bg-green-600 text-white rounded-lg font-medium">Save Buffalo Slab</button>
        </form>
      </div>
    </div>
  );
}
