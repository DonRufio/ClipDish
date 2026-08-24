import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "./offline-banner";
import { BottomNav } from "./bottom-nav";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--ff-display" });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--ff-body" });

export const metadata: Metadata = {
  title: "ClipDish — clip cooking videos into recipes",
  description: "Paste a cooking-video link, get a structured recipe, build your weekly shopping list.",
  appleWebApp: { capable: true, title: "ClipDish", statusBarStyle: "default" },
  icons: { icon: "/favicon.png", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#ff7a45",
  viewportFit: "cover",
};

const nav = [
  { href: "/", label: "Paste link" },
  { href: "/recipes", label: "My recipes" },
  { href: "/list", label: "Shopping list" },
  { href: "/week", label: "This week" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <OfflineBanner />
        <header className="print:hidden">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
            <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-ink">
              <span className="text-2xl">🥘</span> ClipDish
            </Link>
            <nav className="hidden gap-1 text-sm font-medium sm:flex">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-full px-3 py-1.5 text-ink-soft transition-colors hover:bg-white/60 hover:text-ink"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 sm:pb-10">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
