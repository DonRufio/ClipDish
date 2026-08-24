"use client";

// Thumb-reachable tab bar for phones. Hidden on sm+ where the top nav shows.
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Paste", icon: "🔗" },
  { href: "/recipes", label: "Recipes", icon: "📖" },
  { href: "/list", label: "List", icon: "🛒" },
  { href: "/week", label: "Week", icon: "📅" },
];

export function BottomNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden print:hidden">
      <ul className="clay mx-auto flex max-w-sm gap-1 rounded-[1.5rem] p-1.5">
        {tabs.map((t) => (
          <li key={t.href} className="flex-1">
            <Link
              href={t.href}
              className={`flex flex-col items-center gap-0.5 rounded-[1.1rem] py-2 text-[0.7rem] font-medium transition-colors ${
                active(t.href)
                  ? "bg-tangerine text-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.4)]"
                  : "text-ink-soft"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
