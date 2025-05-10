"use client";

import { getPublicClient } from "@/lib/lens/client";
import { chains } from "@lens-chain/sdk/viem";
import { LensProvider } from "@lens-protocol/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { JSX } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { ThemeProvider } from "next-themes";

const wagmiConfig = createConfig(
  getDefaultConfig({
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    chains: [chains.mainnet],
    transports: {
      [chains.mainnet.id]: http(),
      [chains.testnet.id]: http(),
    },
    appName: "Lens App",
    appDescription: "Future of decentralized social",
    appUrl: "https://totally.real.com",
    appIcon: "https://totally.real.com/logo.png",
  }),
);

export const Providers = ({ children }: { children: JSX.Element }) => {
  const queryClient = new QueryClient();
  const publicClient = getPublicClient();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider>
            <LensProvider client={publicClient}>{children}</LensProvider>
          </ConnectKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
};
