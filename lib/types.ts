export interface Farmer {
  _id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  active: boolean;
  createdAt: string;
}

export interface RateSlab {
  _id: string;
  milkType: "cow" | "buffalo";
  effectiveFromAD: string;
  slabs: { minFat: number; maxFat: number; rate: number }[];
  createdAt: string;
}

export interface Entry {
  _id: string;
  dateAD: string;
  dateBS: string;
  farmerId: string;
  milkType: "cow" | "buffalo";
  morningQty: number;
  eveningQty: number;
  fatPercent: number;
  rateUsed: number;
  synced: boolean;
  editHistory: string[];
  createdAt: string;
}

export interface CompanyCollection {
  _id: string;
  dateAD: string;
  dateBS: string;
  milkType: "cow" | "buffalo";
  reportedQty: number;
  notes: string;
  synced: boolean;
  createdAt: string;
}

export interface Advance {
  _id: string;
  farmerId: string;
  dateAD: string;
  dateBS: string;
  amount: number;
  note: string;
  settled: boolean;
  settledInPaymentId?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  farmerId: string;
  month: string;
  milkType: "cow" | "buffalo";
  totalLiters: number;
  milkAmount: number;
  advancesDeducted: number;
  finalAmount: number;
  paid: boolean;
  paidAt?: string;
}
