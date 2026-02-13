export interface VaultDisplayData {
  vaultPubkey: string;
  name: string;
  description: string;
  assetMintString: string;
  assetSymbol: string;
  assetDecimals: number;
  tvl: number;
  assetPerLp: number;
  maxCap: number;
  capacityUsedPct: number;
  managerManagementFeeBps: number;
  adminManagementFeeBps: number;
  managerPerformanceFeeBps: number;
  adminPerformanceFeeBps: number;
  issuanceFeeBps: number;
  redemptionFeeBps: number;
  withdrawalWaitingPeriod: number;
}
