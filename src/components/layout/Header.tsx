"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/register", label: "Register" },
  { href: "/authenticate", label: "Authenticate" },
  { href: "/metrics", label: "Metrics" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800/40 bg-[rgba(5,5,16,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-100">
          <span className="gradient-text">OwnFace Console</span>
        </Link>
        <nav className="hidden items-center gap-2 text-sm font-medium text-slate-300 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 transition ${
                isActive(link.href)
                  ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(124,58,237,0.35)]"
                  : "hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden text-xs text-slate-400 lg:block">
            <span className="tag">Own Your Face Before Own Your Data</span>
          </div>
          <ConnectButton />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-slate-200 hover:bg-white/20 md:hidden"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              {open ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[rgba(5,5,16,0.92)] md:hidden">
          <nav className="space-y-1 px-4 py-3 text-sm font-medium text-slate-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-2 ${
                  isActive(link.href)
                    ? "bg-white/10 text-white"
                    : "hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
