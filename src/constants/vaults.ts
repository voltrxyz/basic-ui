function getVaultPubkeys(): string[] {
  const raw = process.env.NEXT_PUBLIC_VAULT_PUBKEYS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const VAULT_PUBKEYS: string[] = getVaultPubkeys();
