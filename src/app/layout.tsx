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
  title: "OwnFace Demo",
  description:
    "Own Your Face Before Own Your Data. Explore the OwnFace flow: register embeddings, request auth proofs, and inspect metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-foreground`}
      >
        <RainbowKitProvider>
          <Header />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-16 md:px-6">
              {children}
            </div>
          </main>
          {/** Footer disabled per spec */}
          {/* <Toaster /> */}
        </RainbowKitProvider>
      </body>
    </html>
  );
}
