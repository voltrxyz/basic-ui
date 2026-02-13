"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatNumber, formatBps } from "@/lib/utils";
import { VaultDisplayData } from "@/types/vaults";

interface VaultCardProps {
  data: VaultDisplayData;
}

export default function VaultCard({ data }: VaultCardProps) {
  return (
    <Link href={`/vaults/${data.vaultPubkey}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{data.name}</CardTitle>
            <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
              {data.assetSymbol}
            </span>
          </div>
          <CardDescription className="line-clamp-2">
            {data.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">TVL</p>
              <p className="text-lg font-semibold">
                {formatNumber(
                  data.tvl / Math.pow(10, data.assetDecimals),
                  2,
                  true
                )}{" "}
                {data.assetSymbol}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Asset/LP</p>
              <p className="text-lg font-semibold">
                {data.assetPerLp.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Mgmt Fee</p>
              <p>
                {formatBps(
                  data.managerManagementFeeBps + data.adminManagementFeeBps
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Perf Fee</p>
              <p>
                {formatBps(
                  data.managerPerformanceFeeBps + data.adminPerformanceFeeBps
                )}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Capacity</span>
              <span>{data.capacityUsedPct.toFixed(1)}%</span>
            </div>
            <Progress value={data.capacityUsedPct} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
