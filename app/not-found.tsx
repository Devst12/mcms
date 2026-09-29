import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <p className="text-4xl mb-3">🥛</p>
      <h1 className="text-[22px] font-bold text-gray-900 mb-1">४०४</h1>
      <p className="text-[13.5px] text-gray-400 mb-5">पृष्ठ फेला परेन</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gray-900 text-white font-bold text-[14px] shadow-sm active:opacity-80 transition-opacity"
      >
        घर जानुहोस्
      </Link>
    </div>
  );
}
