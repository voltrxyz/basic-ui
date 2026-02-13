"use client";

import { useParams } from "next/navigation";
import { useEffect, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import VaultStats from "@/components/VaultStats";
import VaultDepositWithdrawForm from "@/components/VaultDepositWithdrawForm";
import useVaultDisplayData from "@/hooks/useVaultDisplayData";
import useAppStore from "@/stores/useAppStore";

export default function VaultDetailPage() {
  const params = useParams();
  const vaultPubkey = params.vaultPubkey as string;
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const voltrClient = useAppStore((s) => s.voltrClient);
  const queryClient = useQueryClient();

  const { data: vault, isLoading, error } = useVaultDisplayData(vaultPubkey);

  const invalidateQueries = useCallback(() => {
    setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: ["vaultAccount", vaultPubkey],
      });
      queryClient.invalidateQueries({
        queryKey: ["vaultDisplayData", vaultPubkey],
      });
      queryClient.invalidateQueries({
        queryKey: ["userVaultPosition", vaultPubkey],
      });
    }, 3000);
  }, [queryClient, vaultPubkey]);

  // Account change listeners for real-time updates
  useEffect(() => {
    if (!connection || !voltrClient) return;

    const listenerIds: number[] = [];

    try {
      const vaultPk = new PublicKey(vaultPubkey);

      // Listen to vault account changes
      const vaultListener = connection.onAccountChange(
        vaultPk,
        invalidateQueries,
        "confirmed"
      );
      listenerIds.push(vaultListener);

      // Listen to user's LP token changes
      if (publicKey) {
        const lpMint = voltrClient.findVaultLpMint(vaultPk);
        const lpAta = getAssociatedTokenAddressSync(lpMint, publicKey);
        const lpListener = connection.onAccountChange(
          lpAta,
          invalidateQueries,
          "confirmed"
        );
        listenerIds.push(lpListener);

        // Listen to withdrawal receipt changes
        const receiptPda = voltrClient.findRequestWithdrawVaultReceipt(
          vaultPk,
          publicKey
        );
        const receiptListener = connection.onAccountChange(
          receiptPda,
          invalidateQueries,
          "confirmed"
        );
        listenerIds.push(receiptListener);
      }
    } catch (err) {
      console.error("Failed to set up account listeners:", err);
    }

    return () => {
      listenerIds.forEach((id) => {
        connection.removeAccountChangeListener(id);
      });
    };
  }, [connection, voltrClient, publicKey, vaultPubkey, invalidateQueries]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link
            href="/vaults"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Vaults
          </Link>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-secondary rounded w-1/3" />
          <div className="h-4 bg-secondary rounded w-2/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-secondary rounded" />
            <div className="lg:col-span-1 h-64 bg-secondary rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !vault) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Vault Not Found</h1>
          <p className="text-muted-foreground mb-6">
            Could not load vault{" "}
            <code className="bg-secondary px-2 py-1 rounded text-sm">
              {vaultPubkey}
            </code>
          </p>
          <Link href="/vaults" className="text-primary hover:underline">
            Back to Vaults
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/vaults"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Vaults
        </Link>
        <h1 className="text-3xl font-bold mt-2">{vault.name}</h1>
        <p className="text-muted-foreground mt-1">{vault.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VaultStats vault={vault} />
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <VaultDepositWithdrawForm vault={vault} />
          </div>
        </div>
      </div>
    </div>
  );
}
