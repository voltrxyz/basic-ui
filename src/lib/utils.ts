import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import BN from "bn.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatNumber(
  value: number,
  decimals = 2,
  compact = false
): string {
  if (compact && value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (compact && value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function bnToNumber(bn: BN, decimals: number): number {
  const divisor = new BN(10).pow(new BN(decimals));
  const integerPart = bn.div(divisor).toNumber();
  const remainderPart =
    bn.mod(divisor).toNumber() / Math.pow(10, decimals);
  return integerPart + remainderPart;
}

export function numberToBn(value: number, decimals: number): BN {
  const multiplier = Math.pow(10, decimals);
  return new BN(Math.floor(value * multiplier));
}
