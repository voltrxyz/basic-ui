"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatNumber, formatBps, bnToNumber } from "@/lib/utils";
import { VaultDisplayData } from "@/types/vaults";
import useVaultAccount from "@/hooks/useVaultAccount";
import useAppStore from "@/stores/useAppStore";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";

interface VaultStatsProps {
  vault: VaultDisplayData;
}

function StatItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function VaultStats({ vault }: VaultStatsProps) {
  const { data, isLoading } = useVaultAccount(vault.vaultPubkey);
  const voltrClient = useAppStore((s) => s.voltrClient);

  const { data: strategies } = useQuery({
    queryKey: ["strategies", vault.vaultPubkey],
    queryFn: async () => {
      if (!voltrClient) return [];
      const pk = new PublicKey(vault.vaultPubkey);
      return voltrClient.fetchAllStrategyInitReceiptAccountsOfVault(pk);
    },
    enabled: !!voltrClient,
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vault Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-secondary rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { vaultAccount, assetPerLp, lpBreakdown } = data;
  const decimals = vault.assetDecimals;
  const tvl = bnToNumber(vaultAccount.asset.totalValue, decimals);
  const maxCap = bnToNumber(
    vaultAccount.vaultConfiguration.maxCap,
    decimals
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vault Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <StatItem
          label="Total Value Locked"
          value={`${formatNumber(tvl, 2, true)} ${vault.assetSymbol}`}
        />
        <StatItem label="Asset per LP" value={assetPerLp.toFixed(6)} />
        <StatItem
          label="Max Capacity"
          value={
            maxCap > 0
              ? `${formatNumber(maxCap, 2, true)} ${vault.assetSymbol}`
              : "Unlimited"
          }
        />
        <StatItem
          label="LP Circulating"
          value={formatNumber(
            bnToNumber(lpBreakdown.circulating, decimals),
            2,
            true
          )}
        />
        <StatItem
          label="LP Unharvested Fees"
          value={formatNumber(
            bnToNumber(lpBreakdown.unharvestedFees, decimals),
            2
          )}
        />

        <Separator className="my-3" />

        <p className="text-sm font-medium mb-2">Fees</p>
        <StatItem
          label="Manager Management Fee"
          value={formatBps(vaultAccount.feeConfiguration.managerManagementFee)}
        />
        <StatItem
          label="Admin Management Fee"
          value={formatBps(vaultAccount.feeConfiguration.adminManagementFee)}
        />
        <StatItem
          label="Manager Performance Fee"
          value={formatBps(
            vaultAccount.feeConfiguration.managerPerformanceFee
          )}
        />
        <StatItem
          label="Admin Performance Fee"
          value={formatBps(vaultAccount.feeConfiguration.adminPerformanceFee)}
        />
        <StatItem
          label="Issuance Fee"
          value={formatBps(vaultAccount.feeConfiguration.issuanceFee)}
        />
        <StatItem
          label="Redemption Fee"
          value={formatBps(vaultAccount.feeConfiguration.redemptionFee)}
        />

        <Separator className="my-3" />

        <StatItem
          label="Withdrawal Waiting Period"
          value={`${vaultAccount.vaultConfiguration.withdrawalWaitingPeriod.toNumber()}s`}
        />
        <StatItem label="Strategies" value={strategies?.length ?? 0} />
      </CardContent>
    </Card>
  );
}
