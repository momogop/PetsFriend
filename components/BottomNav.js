"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/discover", label: "Keşfet", icon: "🐾" },
  { href: "/meetups", label: "Buluşmalar", icon: "📍" },
  { href: "/profile", label: "Profilim", icon: "🐶" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[460px] bg-surface border-t border-line flex px-2 pt-2.5 safe-bottom z-20">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium ${
              active ? "text-primary font-bold" : "text-muted"
            }`}
          >
            <span className="text-[19px]">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
