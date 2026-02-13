"use client";

import Link from "next/link";
import CreateVaultForm from "@/components/CreateVaultForm";

export default function CreateVaultPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/vault-manager"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Vault Manager
        </Link>
        <h1 className="text-3xl font-bold mt-2">Create New Vault</h1>
        <p className="text-muted-foreground mt-1">
          Deploy a new Voltr protocol vault with custom strategy configuration.
        </p>
      </div>
      <CreateVaultForm />
    </div>
  );
}
