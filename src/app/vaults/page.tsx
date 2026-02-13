"use client";

import VaultCard from "@/components/VaultCard";
import { VAULT_PUBKEYS } from "@/constants/vaults";
import useVaultDisplayData from "@/hooks/useVaultDisplayData";

function VaultCardLoader({ vaultPubkey }: { vaultPubkey: string }) {
  const { data, isLoading } = useVaultDisplayData(vaultPubkey);

  if (isLoading || !data) {
    return (
      <div className="rounded-lg border bg-card p-6 animate-pulse space-y-4">
        <div className="h-5 bg-secondary rounded w-2/3" />
        <div className="h-4 bg-secondary rounded w-full" />
        <div className="h-8 bg-secondary rounded w-1/2" />
      </div>
    );
  }

  return <VaultCard data={data} />;
}

export default function VaultsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Vaults</h1>
        <p className="text-muted-foreground mt-2">
          Discover and deposit into yield-generating vaults powered by Voltr
          Protocol.
        </p>
      </div>

      {VAULT_PUBKEYS.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          No vaults configured. Set <code>NEXT_PUBLIC_VAULT_PUBKEYS</code> in
          your <code>.env</code> file.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VAULT_PUBKEYS.map((pubkey) => (
            <VaultCardLoader key={pubkey} vaultPubkey={pubkey} />
          ))}
        </div>
      )}
    </div>
  );
}
