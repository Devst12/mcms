import NepaliDate from "nepali-date-converter";

const adMonthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function bsToAd(bsDate: string): string {
  const parts = bsDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const nd = new NepaliDate(year, month - 1, day);
  const ad = nd.getAD();
  return `${ad.year}-${String(ad.month + 1).padStart(2, "0")}-${String(ad.date).padStart(2, "0")}`;
}

export function adToBs(adDate: Date | string): string {
  const d = adDate instanceof Date ? adDate : new Date(adDate);
  const nd = NepaliDate.fromAD(d);
  const bs = nd.getBS();
  return `${bs.year}-${String(bs.month + 1).padStart(2, "0")}-${String(bs.date).padStart(2, "0")}`;
}

export function formatBsDate(bsDate: string): string {
  const parts = bsDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return `${year}/${month}/${day}`;
}

export function getTodayBs(): string {
  const nd = NepaliDate.now();
  const bs = nd.getBS();
  return `${bs.year}-${String(bs.month + 1).padStart(2, "0")}-${String(bs.date).padStart(2, "0")}`;
}

export function getTodayAd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function formatAdDate(adDate: string): string {
  const parts = adDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return `${year}/${month}/${day}`;
}

export function formatBsDateNepali(bsDate: string): string {
  const parts = bsDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const nd = new NepaliDate(year, month - 1, day);
  return nd.format("YYYY MMMM DD, ddd", "np");
}

export function formatAdDateDisplay(adDate: string): string {
  const parts = adDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return `${day} ${adMonthNames[month - 1]} ${year}`;
}
