import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BioZero",
  description:
    "Hackathon prototype for BioZero: register users, request auth proofs, and inspect metrics.",
};

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/register", label: "Register" },
  { href: "/authenticate", label: "Authenticate" },
  { href: "/metrics", label: "Metrics" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-slate-50 min-h-screen`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                BioZero Console
              </Link>
              <nav className="flex gap-4 text-sm font-medium">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-800 bg-slate-950/80">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs text-slate-500">
              <span>BioZero Hackathon Demo</span>
              <span>Local backend required · zk verification</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
