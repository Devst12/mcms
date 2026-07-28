import { getFarmerById } from "@/lib/db";

interface FarmerCardProps {
  farmer: {
    _id: string;
    name: string;
    code: string;
    phone: string;
    active: boolean;
    address: string;
  };
}

export default function Farmer({ farmer }: FarmerCardProps) {
  return (
    <div className="p-4 bg-white rounded-xl border">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-large">{farmer.name}</p>
          <p className="text-sm text-gray-600">{farmer.code} | {farmer.phone}</p>
          <p className="text-sm text-gray-600">{farmer.address}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${farmer.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
          {farmer.active ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}
