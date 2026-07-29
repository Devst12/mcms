import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-lg mb-4">Page not found</p>
      <Link href="/" className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium min-h-touch">
        Go Home
      </Link>
    </div>
  );
}
