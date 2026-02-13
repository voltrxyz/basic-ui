"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VaultManagerPage() {
  const router = useRouter();
  const [vaultPubkey, setVaultPubkey] = useState("");

  const handleManageVault = () => {
    if (vaultPubkey.trim()) {
      router.push(`/vault-manager/${vaultPubkey.trim()}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Vault Manager</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Vault</CardTitle>
            <CardDescription>
              Deploy a new Voltr vault with custom configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/vault-manager/create-vault">
              <Button className="w-full">Create Vault</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Existing Vault</CardTitle>
            <CardDescription>
              Update configuration for an existing vault you manage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Vault Public Key</Label>
              <Input
                placeholder="Enter vault public key..."
                value={vaultPubkey}
                onChange={(e) => setVaultPubkey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManageVault()}
              />
            </div>
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleManageVault}
              disabled={!vaultPubkey.trim()}
            >
              Manage Vault
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
