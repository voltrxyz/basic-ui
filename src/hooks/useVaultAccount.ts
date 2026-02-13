"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import useAppStore from "@/stores/useAppStore";

export default function useVaultAccount(vaultPubkey: string) {
  const voltrClient = useAppStore((s) => s.voltrClient);

  return useQuery({
    queryKey: ["vaultAccount", vaultPubkey],
    queryFn: async () => {
      if (!voltrClient) throw new Error("VoltrClient not initialized");
      const pk = new PublicKey(vaultPubkey);
      const [vaultAccount, assetPerLp, lpBreakdown] = await Promise.all([
        voltrClient.fetchVaultAccount(pk),
        voltrClient.getCurrentAssetPerLpForVault(pk),
        voltrClient.getVaultLpSupplyBreakdown(pk),
      ]);
      return { vaultAccount, assetPerLp, lpBreakdown };
    },
    enabled: !!voltrClient && !!vaultPubkey,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
