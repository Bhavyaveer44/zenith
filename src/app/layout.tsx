import type { Metadata } from "next";
import { Geist_Mono, Lora, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { NavAuth } from "@/components/nav-auth";
import { clerkEnabled } from "@/lib/auth";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenith — see your patterns. With receipts.",
  description:
    "A structured self-reflection and growth tool that learns your behavioral patterns from the stories you tell — and never tells you anything about yourself without evidence.",
};

const navLinks = [
  { href: "/sessions", label: "Sessions" },
  { href: "/mirror", label: "Mirror" },
  { href: "/growth", label: "Growth" },
  { href: "/checkin", label: "Check-in" },
];

async function Shell({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
            <Link
              href="/"
              className="font-heading text-lg font-semibold tracking-tight"
            >
              Zenith
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
              {clerkEnabled ? <NavAuth /> : null}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t">
          <div className="mx-auto w-full max-w-5xl space-y-1 px-4 py-4 text-xs text-muted-foreground">
            <p>
              Zenith is a structured self-reflection and growth tool. It is not
              therapy, not medical care, and not a substitute for either.
            </p>
            <p>
              If you are in crisis or thinking about harming yourself, please
              use the{" "}
              <Link href="/crisis-resources" className="underline">
                crisis resources
              </Link>{" "}
              — real people, right now.
            </p>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (clerkEnabled) {
    const { ClerkProvider } = await import("@clerk/nextjs");
    return (
      <ClerkProvider>
        <Shell>{children}</Shell>
      </ClerkProvider>
    );
  }
  return <Shell>{children}</Shell>;
}
