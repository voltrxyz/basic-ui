"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import useAppStore from "@/stores/useAppStore";
import { VaultDisplayData } from "@/types/vaults";
import { fetchTokenInfo } from "@/lib/tokenMetadata";
import { bnToNumber } from "@/lib/utils";

function bytesToString(bytes: number[]): string {
  return String.fromCharCode(...bytes).replace(/\0/g, "").trim();
}

export default function useVaultDisplayData(vaultPubkey: string) {
  const voltrClient = useAppStore((s) => s.voltrClient);
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["vaultDisplayData", vaultPubkey],
    queryFn: async (): Promise<VaultDisplayData> => {
      if (!voltrClient) throw new Error("VoltrClient not initialized");

      const pk = new PublicKey(vaultPubkey);
      const [vaultAccount, assetPerLp] = await Promise.all([
        voltrClient.fetchVaultAccount(pk),
        voltrClient.getCurrentAssetPerLpForVault(pk),
      ]);

      const tokenInfo = await fetchTokenInfo(
        connection,
        vaultAccount.asset.mint
      );

      const tvl = bnToNumber(
        vaultAccount.asset.totalValue,
        tokenInfo.decimals
      );
      const maxCap = bnToNumber(
        vaultAccount.vaultConfiguration.maxCap,
        tokenInfo.decimals
      );
      const capacityUsedPct = maxCap > 0 ? (tvl / maxCap) * 100 : 0;

      const name = bytesToString(vaultAccount.name);
      const description = bytesToString(vaultAccount.description);

      return {
        vaultPubkey,
        name: name || vaultPubkey.slice(0, 8) + "...",
        description,
        assetMintString: vaultAccount.asset.mint.toBase58(),
        assetSymbol: tokenInfo.symbol,
        assetDecimals: tokenInfo.decimals,
        tvl: vaultAccount.asset.totalValue.toNumber(),
        assetPerLp,
        maxCap: vaultAccount.vaultConfiguration.maxCap.toNumber(),
        capacityUsedPct,
        managerManagementFeeBps:
          vaultAccount.feeConfiguration.managerManagementFee,
        adminManagementFeeBps:
          vaultAccount.feeConfiguration.adminManagementFee,
        managerPerformanceFeeBps:
          vaultAccount.feeConfiguration.managerPerformanceFee,
        adminPerformanceFeeBps:
          vaultAccount.feeConfiguration.adminPerformanceFee,
        issuanceFeeBps: vaultAccount.feeConfiguration.issuanceFee,
        redemptionFeeBps: vaultAccount.feeConfiguration.redemptionFee,
        withdrawalWaitingPeriod:
          vaultAccount.vaultConfiguration.withdrawalWaitingPeriod.toNumber(),
      };
    },
    enabled: !!voltrClient && !!vaultPubkey,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
