"use client";

import { useState, useCallback } from "react";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { VoltrClient, VaultConfigField } from "@voltr/vault-sdk";
import BN from "bn.js";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import useVaultAccount from "@/hooks/useVaultAccount";
import { formatBps, bnToNumber } from "@/lib/utils";

interface UpdateVaultFormProps {
  vaultPubkey: string;
}

interface ConfigUpdateItem {
  label: string;
  field: VaultConfigField;
  currentValue: string;
  inputType: "bps" | "bn" | "pubkey";
}

export default function UpdateVaultForm({ vaultPubkey }: UpdateVaultFormProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { data, isLoading, refetch } = useVaultAccount(vaultPubkey);

  const [selectedField, setSelectedField] = useState<VaultConfigField | null>(
    null
  );
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = useCallback(async () => {
    if (
      !wallet.publicKey ||
      !wallet.signTransaction ||
      selectedField === null
    ) {
      return;
    }

    setLoading(true);
    try {
      const vc = new VoltrClient(connection);
      const vaultPk = new PublicKey(vaultPubkey);

      let dataBuffer: Buffer;

      // Encode the value based on field type
      if (selectedField === VaultConfigField.Manager) {
        const pk = new PublicKey(newValue);
        dataBuffer = pk.toBuffer();
      } else if (
        selectedField === VaultConfigField.MaxCap ||
        selectedField === VaultConfigField.StartAtTs ||
        selectedField === VaultConfigField.LockedProfitDegradationDuration ||
        selectedField === VaultConfigField.WithdrawalWaitingPeriod
      ) {
        const bn = new BN(newValue);
        dataBuffer = bn.toArrayLike(Buffer, "le", 8);
      } else {
        // Fee fields are u16 (2 bytes)
        const num = parseInt(newValue);
        dataBuffer = Buffer.alloc(2);
        dataBuffer.writeUInt16LE(num);
      }

      const ix = await vc.createUpdateVaultConfigIx(
        selectedField,
        dataBuffer,
        {
          vault: vaultPk,
          admin: wallet.publicKey,
        }
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [ix],
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);
      const signed = await wallet.signTransaction(transaction);
      const txSig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(
        { signature: txSig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      toast.success("Vault config updated!");
      setNewValue("");
      setSelectedField(null);
      refetch();
    } catch (err: any) {
      console.error("Update vault error:", err);
      toast.error(err?.message ?? "Failed to update vault");
    } finally {
      setLoading(false);
    }
  }, [wallet, connection, vaultPubkey, selectedField, newValue, refetch]);

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-6 bg-secondary rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { vaultAccount } = data;
  const configItems: ConfigUpdateItem[] = [
    {
      label: "Max Cap",
      field: VaultConfigField.MaxCap,
      currentValue: vaultAccount.vaultConfiguration.maxCap.toString(),
      inputType: "bn",
    },
    {
      label: "Withdrawal Waiting Period",
      field: VaultConfigField.WithdrawalWaitingPeriod,
      currentValue:
        vaultAccount.vaultConfiguration.withdrawalWaitingPeriod.toString() +
        "s",
      inputType: "bn",
    },
    {
      label: "Locked Profit Degradation Duration",
      field: VaultConfigField.LockedProfitDegradationDuration,
      currentValue:
        vaultAccount.vaultConfiguration.lockedProfitDegradationDuration.toString() +
        "s",
      inputType: "bn",
    },
    {
      label: "Manager Management Fee",
      field: VaultConfigField.ManagerManagementFee,
      currentValue: formatBps(
        vaultAccount.feeConfiguration.managerManagementFee
      ),
      inputType: "bps",
    },
    {
      label: "Admin Management Fee",
      field: VaultConfigField.AdminManagementFee,
      currentValue: formatBps(
        vaultAccount.feeConfiguration.adminManagementFee
      ),
      inputType: "bps",
    },
    {
      label: "Manager Performance Fee",
      field: VaultConfigField.ManagerPerformanceFee,
      currentValue: formatBps(
        vaultAccount.feeConfiguration.managerPerformanceFee
      ),
      inputType: "bps",
    },
    {
      label: "Admin Performance Fee",
      field: VaultConfigField.AdminPerformanceFee,
      currentValue: formatBps(
        vaultAccount.feeConfiguration.adminPerformanceFee
      ),
      inputType: "bps",
    },
    {
      label: "Issuance Fee",
      field: VaultConfigField.IssuanceFee,
      currentValue: formatBps(vaultAccount.feeConfiguration.issuanceFee),
      inputType: "bps",
    },
    {
      label: "Redemption Fee",
      field: VaultConfigField.RedemptionFee,
      currentValue: formatBps(vaultAccount.feeConfiguration.redemptionFee),
      inputType: "bps",
    },
    {
      label: "Manager",
      field: VaultConfigField.Manager,
      currentValue: vaultAccount.manager?.toBase58() ?? "—",
      inputType: "pubkey",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {configItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                selectedField === item.field
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-secondary"
              }`}
              onClick={() => {
                setSelectedField(item.field);
                setNewValue("");
              }}
            >
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  Current: {item.currentValue}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {item.inputType === "bps"
                  ? "bps"
                  : item.inputType === "bn"
                    ? "raw"
                    : "pubkey"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedField !== null && (
        <Card>
          <CardHeader>
            <CardTitle>
              Update:{" "}
              {configItems.find((c) => c.field === selectedField)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>New Value</Label>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={
                  configItems.find((c) => c.field === selectedField)
                    ?.inputType === "pubkey"
                    ? "Public key..."
                    : "Enter new value..."
                }
              />
            </div>
            {wallet.publicKey ? (
              <Button
                onClick={handleUpdate}
                disabled={loading || !newValue.trim()}
              >
                {loading ? "Updating..." : "Update Config"}
              </Button>
            ) : (
              <WalletMultiButton />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
