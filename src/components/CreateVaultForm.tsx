"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PublicKey,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { VoltrClient } from "@voltr/vault-sdk";
import BN from "bn.js";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function CreateVaultForm() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();

  const [vaultName, setVaultName] = useState("");
  const [vaultDescription, setVaultDescription] = useState("");
  const [assetMint, setAssetMint] = useState("");
  const [manager, setManager] = useState("");
  const [admin, setAdmin] = useState("");

  // Fees in basis points
  const [managerManagementFee, setManagerManagementFee] = useState("0");
  const [adminManagementFee, setAdminManagementFee] = useState("0");
  const [managerPerformanceFee, setManagerPerformanceFee] = useState("0");
  const [adminPerformanceFee, setAdminPerformanceFee] = useState("0");
  const [issuanceFee, setIssuanceFee] = useState("0");
  const [redemptionFee, setRedemptionFee] = useState("0");

  // Config
  const [maxCap, setMaxCap] = useState("");
  const [withdrawalWaitingPeriod, setWithdrawalWaitingPeriod] = useState("0");
  const [lockedProfitDegradation, setLockedProfitDegradation] = useState("0");

  // LP metadata
  const [lpName, setLpName] = useState("");
  const [lpSymbol, setLpSymbol] = useState("");
  const [lpUri, setLpUri] = useState("");

  const [loading, setLoading] = useState(false);

  const isValid = useMemo(() => {
    return (
      vaultName.trim() !== "" &&
      assetMint.trim() !== "" &&
      manager.trim() !== "" &&
      admin.trim() !== ""
    );
  }, [vaultName, assetMint, manager, admin]);

  const handleCreate = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error("Please connect your wallet");
      return;
    }

    setLoading(true);
    try {
      const vc = new VoltrClient(connection);
      const vaultKp = Keypair.generate();

      const config = {
        maxCap: maxCap ? new BN(maxCap) : new BN(0),
        startAtTs: new BN(Math.floor(Date.now() / 1000)),
        lockedProfitDegradationDuration: new BN(
          Number(lockedProfitDegradation)
        ),
        managerManagementFee: Number(managerManagementFee),
        managerPerformanceFee: Number(managerPerformanceFee),
        adminManagementFee: Number(adminManagementFee),
        adminPerformanceFee: Number(adminPerformanceFee),
        redemptionFee: Number(redemptionFee),
        issuanceFee: Number(issuanceFee),
        withdrawalWaitingPeriod: new BN(Number(withdrawalWaitingPeriod)),
      };

      const vaultParams = {
        config,
        name: vaultName,
        description: vaultDescription,
      };

      const adminPk = new PublicKey(admin);
      const managerPk = new PublicKey(manager);
      const mintPk = new PublicKey(assetMint);

      const instructions = [];

      const initIx = await vc.createInitializeVaultIx(vaultParams, {
        vault: vaultKp.publicKey,
        vaultAssetMint: mintPk,
        admin: adminPk,
        manager: managerPk,
        payer: wallet.publicKey,
      });
      instructions.push(initIx);

      if (lpName && lpSymbol) {
        const metadataIx = await vc.createCreateLpMetadataIx(
          {
            name: lpName,
            symbol: lpSymbol,
            uri: lpUri || "",
          },
          {
            payer: wallet.publicKey,
            admin: adminPk,
            vault: vaultKp.publicKey,
          }
        );
        instructions.push(metadataIx);
      }

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);
      transaction.sign([vaultKp]);

      const signed = await wallet.signTransaction(transaction);
      const txSig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(
        { signature: txSig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      toast.success(
        `Vault created! ${vaultKp.publicKey.toBase58()}`
      );
      router.push(`/vault-manager/${vaultKp.publicKey.toBase58()}`);
    } catch (err: any) {
      console.error("Create vault error:", err);
      toast.error(err?.message ?? "Failed to create vault");
    } finally {
      setLoading(false);
    }
  }, [
    wallet,
    connection,
    router,
    vaultName,
    vaultDescription,
    assetMint,
    manager,
    admin,
    maxCap,
    withdrawalWaitingPeriod,
    lockedProfitDegradation,
    managerManagementFee,
    adminManagementFee,
    managerPerformanceFee,
    adminPerformanceFee,
    issuanceFee,
    redemptionFee,
    lpName,
    lpSymbol,
    lpUri,
  ]);

  return (
    <div className="space-y-6">
      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Vault Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              placeholder="My Yield Vault"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={vaultDescription}
              onChange={(e) => setVaultDescription(e.target.value)}
              placeholder="A description of your vault strategy..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Asset & Authorities */}
      <Card>
        <CardHeader>
          <CardTitle>Asset & Authorities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Asset Mint *</Label>
            <Input
              value={assetMint}
              onChange={(e) => setAssetMint(e.target.value)}
              placeholder="Token mint public key"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Admin *</Label>
              <Input
                value={admin}
                onChange={(e) => setAdmin(e.target.value)}
                placeholder="Admin public key"
              />
            </div>
            <div className="space-y-2">
              <Label>Manager *</Label>
              <Input
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                placeholder="Manager public key"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Max Capacity (raw units)</Label>
              <Input
                type="text"
                value={maxCap}
                onChange={(e) => setMaxCap(e.target.value)}
                placeholder="0 = unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label>Withdrawal Wait (seconds)</Label>
              <Input
                type="number"
                value={withdrawalWaitingPeriod}
                onChange={(e) => setWithdrawalWaitingPeriod(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Locked Profit Degradation (seconds)</Label>
              <Input
                type="number"
                value={lockedProfitDegradation}
                onChange={(e) => setLockedProfitDegradation(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Fees (basis points)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Manager Mgmt Fee</Label>
              <Input
                type="number"
                value={managerManagementFee}
                onChange={(e) => setManagerManagementFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Admin Mgmt Fee</Label>
              <Input
                type="number"
                value={adminManagementFee}
                onChange={(e) => setAdminManagementFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Manager Perf Fee</Label>
              <Input
                type="number"
                value={managerPerformanceFee}
                onChange={(e) => setManagerPerformanceFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Admin Perf Fee</Label>
              <Input
                type="number"
                value={adminPerformanceFee}
                onChange={(e) => setAdminPerformanceFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Issuance Fee</Label>
              <Input
                type="number"
                value={issuanceFee}
                onChange={(e) => setIssuanceFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Redemption Fee</Label>
              <Input
                type="number"
                value={redemptionFee}
                onChange={(e) => setRedemptionFee(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LP Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>LP Token Metadata (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Token Name</Label>
              <Input
                value={lpName}
                onChange={(e) => setLpName(e.target.value)}
                placeholder="Vault LP Token"
              />
            </div>
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input
                value={lpSymbol}
                onChange={(e) => setLpSymbol(e.target.value)}
                placeholder="vLP"
              />
            </div>
            <div className="space-y-2">
              <Label>Metadata URI</Label>
              <Input
                value={lpUri}
                onChange={(e) => setLpUri(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        {wallet.publicKey ? (
          <Button
            size="lg"
            onClick={handleCreate}
            disabled={loading || !isValid}
          >
            {loading ? "Creating Vault..." : "Create Vault"}
          </Button>
        ) : (
          <WalletMultiButton />
        )}
      </div>
    </div>
  );
}
