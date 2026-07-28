"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, Building2, BarChart3, Scale, Wallet, Receipt, Settings, RefreshCw } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/farmers", label: "किसान", icon: Users },
  { href: "/entry", label: "Entry", icon: FileText },
  { href: "/company", label: "Company", icon: Building2 },
  { href: "/reports/monthly", label: "Reports", icon: BarChart3 },
  { href: "/reconcile", label: "Reconcile", icon: Scale },
  { href: "/advances", label: "Advances", icon: Wallet },
  { href: "/slip", label: "Slip", icon: Receipt },
  { href: "/rates", label: "Rates", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [pendingSync, setPendingSync] = useState(0);

  const handleSync = async () => {
    setPendingSync(0);
    await fetch("/api/sync", { method: "POST" });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-between px-2 py-1 max-w-screen-xl mx-auto">
        <div className="flex overflow-x-auto gap-1 flex-1 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center min-h-touch min-w-[60px] px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  active ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon size={20} />
                <span className="mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex flex-col items-center ml-2 pl-2 border-l border-gray-200">
          <button
            onClick={handleSync}
            className="flex items-center justify-center min-h-touch min-w-[48px] px-2 py-1 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900"
            title="Sync Now"
          >
            <RefreshCw size={20} />
          </button>
          {pendingSync > 0 && (
            <span className="text-[10px] text-red-600 font-bold">{pendingSync}</span>
          )}
        </div>
      </div>
    </nav>
  );
}
