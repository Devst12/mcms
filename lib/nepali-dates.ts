import NepaliDateConverter from "nepali-date-converter";

export function bsToAd(bsDate: string): string {
  const parts = bsDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const nd = new NepaliDateConverter(year, month, day);
  const ad = nd.toAdDate();
  return `${ad.year}-${String(ad.month).padStart(2, "0")}-${String(ad.day).padStart(2, "0")}`;
}

export function adToBs(adDate: Date | string): string {
  const d = adDate instanceof Date ? adDate : new Date(adDate);
  const nd = new NepaliDateConverter(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const bs = nd.toBsDate();
  return `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
}

export function formatBsDate(bsDate: string): string {
  const parts = bsDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return `${year}/${month}/${day}`;
}

export function getTodayBs(): string {
  return adToBs(new Date());
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
