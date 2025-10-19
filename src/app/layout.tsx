import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RainbowKitProvider } from "@/components/RainbowKitProvider";
import { Header } from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BioZero Demo Console",
  description:
    "Hackathon prototype for BioZero: register users, request auth proofs, and inspect metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}>
        <RainbowKitProvider>
          <Header />
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 pt-24 pb-8">{children}</div>
          </main>
          {/** Footer disabled per spec */}
          {/* <Toaster /> */}
        </RainbowKitProvider>
      </body>
    </html>
  );
}