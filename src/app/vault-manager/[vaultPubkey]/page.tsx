"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import UpdateVaultForm from "@/components/UpdateVaultForm";
import { shortenAddress } from "@/lib/utils";

export default function ManageVaultPage() {
  const params = useParams();
  const vaultPubkey = params.vaultPubkey as string;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/vault-manager"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Vault Manager
        </Link>
        <h1 className="text-3xl font-bold mt-2">Manage Vault</h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm">
          {vaultPubkey}
        </p>
      </div>
      <UpdateVaultForm vaultPubkey={vaultPubkey} />
    </div>
  );
}
