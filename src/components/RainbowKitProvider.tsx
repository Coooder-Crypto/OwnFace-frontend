"use client";

import "@rainbow-me/rainbowkit/styles.css";

import type { ReactNode } from "react";
import {
  RainbowKitProvider as RKProvider,
  darkTheme,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { localhost, sepolia } from "wagmi/chains";
import { http } from "viem";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo-project-id";

const config = getDefaultConfig({
  appName: "OwnFace Demo",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org",
    ),
    [localhost.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});

const queryClient = new QueryClient();

interface RainbowKitProviderProps {
  children: ReactNode;
}

export function RainbowKitProvider({ children }: RainbowKitProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RKProvider
          modalSize="compact"
          showRecentTransactions={false}
          theme={darkTheme({
            accentColor: "#0ea5e9",
            accentColorForeground: "#ffffff",
            borderRadius: "small",
          })}
        >
          {children}
        </RKProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
