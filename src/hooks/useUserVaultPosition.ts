"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import useAppStore from "@/stores/useAppStore";

export interface UserVaultPosition {
  lpBalance: BN;
  assetValue: BN;
  pendingWithdrawal: {
    amountAssetToWithdrawEffective: number;
    amountAssetToWithdrawAtPresent: number;
    amountLpEscrowed: number;
    withdrawableFromTs: number;
  } | null;
}

export default function useUserVaultPosition(vaultPubkey: string) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const voltrClient = useAppStore((s) => s.voltrClient);

  return useQuery({
    queryKey: ["userVaultPosition", vaultPubkey, publicKey?.toBase58()],
    queryFn: async (): Promise<UserVaultPosition> => {
      if (!voltrClient || !publicKey)
        throw new Error("Client or wallet not ready");

      const vaultPk = new PublicKey(vaultPubkey);
      const lpMint = voltrClient.findVaultLpMint(vaultPk);
      const lpAta = getAssociatedTokenAddressSync(lpMint, publicKey);

      let lpBalance = new BN(0);
      try {
        const lpAccount = await getAccount(connection, lpAta);
        lpBalance = new BN(lpAccount.amount.toString());
      } catch {
        // ATA doesn't exist yet, balance is 0
      }

      let assetValue = new BN(0);
      if (lpBalance.gt(new BN(0))) {
        assetValue = await voltrClient.calculateAssetsForWithdraw(
          vaultPk,
          lpBalance
        );
      }

      let pendingWithdrawal = null;
      try {
        const withdrawal = await voltrClient.getPendingWithdrawalForUser(
          vaultPk,
          publicKey
        );
        if (withdrawal) {
          pendingWithdrawal = {
            amountAssetToWithdrawEffective:
              withdrawal.amountAssetToWithdrawEffective,
            amountAssetToWithdrawAtPresent:
              withdrawal.amountAssetToWithdrawAtPresent,
            amountLpEscrowed: withdrawal.amountLpEscrowed,
            withdrawableFromTs: withdrawal.withdrawableFromTs,
          };
        }
      } catch {
        // No pending withdrawal
      }

      return { lpBalance, assetValue, pendingWithdrawal };
    },
    enabled: !!voltrClient && !!publicKey && !!vaultPubkey,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
