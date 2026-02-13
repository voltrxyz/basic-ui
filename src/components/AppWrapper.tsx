"use client";

import React from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import useSyncVoltrClient from "@/hooks/useSyncVoltrClient";
import { RPC_URL } from "@/constants/environment";

import "@solana/wallet-adapter-react-ui/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
    },
  },
});

const AppSetup = ({ children }: { children: React.ReactNode }) => {
  useSyncVoltrClient();
  return <>{children}</>;
};

const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={RPC_URL}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <AppSetup>{children}</AppSetup>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "hsl(217.2 32.6% 17.5%)",
                  color: "hsl(210 40% 98%)",
                  border: "1px solid hsl(217.2 32.6% 17.5%)",
                },
              }}
            />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
};

export default AppWrapper;
