"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import BN from "bn.js";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VaultDisplayData } from "@/types/vaults";
import useAppStore from "@/stores/useAppStore";
import useUserVaultPosition from "@/hooks/useUserVaultPosition";
import { bnToNumber, numberToBn, formatNumber } from "@/lib/utils";

interface VaultDepositWithdrawFormProps {
  vault: VaultDisplayData;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export default function VaultDepositWithdrawForm({
  vault,
}: VaultDepositWithdrawFormProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const voltrClient = useAppStore((s) => s.voltrClient);
  const { data: userPosition, refetch: refetchPosition } =
    useUserVaultPosition(vault.vaultPubkey);

  const [tab, setTab] = useState<string>("deposit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const decimals = vault.assetDecimals;
  const pending = userPosition?.pendingWithdrawal ?? null;
  const assetValue = userPosition?.assetValue ?? new BN(0);

  // Fetch wallet balance for the asset
  useEffect(() => {
    if (!wallet.publicKey || !connection) return;
    const mint = new PublicKey(vault.assetMintString);
    const ata = getAssociatedTokenAddressSync(mint, wallet.publicKey);

    const fetchBalance = async () => {
      try {
        const { value } = await connection.getTokenAccountBalance(ata);
        setWalletBalance(Number(value.amount));
      } catch {
        setWalletBalance(0);
      }
    };

    fetchBalance();
    const id = connection.onAccountChange(ata, fetchBalance);
    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [wallet.publicKey, connection, vault.assetMintString]);

  // Countdown timer for pending withdrawal
  useEffect(() => {
    if (!pending) return;

    const updateTimer = () => {
      const withdrawTime = pending.withdrawableFromTs * 1000;
      const now = Date.now();
      const timeLeft = Math.max(0, withdrawTime - now);
      setTimeRemaining(formatTime(Math.ceil(timeLeft / 1000)));
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [pending]);

  const handleDeposit = useCallback(async () => {
    if (!voltrClient || !wallet.publicKey || !wallet.signTransaction) return;

    setLoading(true);
    try {
      const vaultPk = new PublicKey(vault.vaultPubkey);
      const depositAmount = numberToBn(parseFloat(amount), decimals);

      const ix = await voltrClient.createDepositVaultIx(depositAmount, {
        userTransferAuthority: wallet.publicKey,
        vault: vaultPk,
        vaultAssetMint: new PublicKey(vault.assetMintString),
        assetTokenProgram: TOKEN_PROGRAM_ID,
      });

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

      toast.success("Deposit successful!");
      setAmount("");
      refetchPosition();
    } catch (err: any) {
      console.error("Deposit error:", err);
      toast.error(err?.message ?? "Deposit failed");
    } finally {
      setLoading(false);
    }
  }, [voltrClient, wallet, connection, vault, amount, decimals, refetchPosition]);

  const handleRequestWithdraw = useCallback(async () => {
    if (!voltrClient || !wallet.publicKey || !wallet.signTransaction) return;

    setLoading(true);
    try {
      const vaultPk = new PublicKey(vault.vaultPubkey);
      const withdrawAmount = numberToBn(parseFloat(amount), decimals);

      const ix = await voltrClient.createRequestWithdrawVaultIx(
        {
          amount: withdrawAmount,
          isAmountInLp: false,
          isWithdrawAll: false,
        },
        {
          payer: wallet.publicKey,
          userTransferAuthority: wallet.publicKey,
          vault: vaultPk,
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

      toast.success("Withdrawal requested!");
      setAmount("");
      refetchPosition();
    } catch (err: any) {
      console.error("Request withdraw error:", err);
      toast.error(err?.message ?? "Withdrawal request failed");
    } finally {
      setLoading(false);
    }
  }, [voltrClient, wallet, connection, vault, amount, decimals, refetchPosition]);

  const handleExecuteWithdraw = useCallback(async () => {
    if (!voltrClient || !wallet.publicKey || !wallet.signTransaction) return;

    setLoading(true);
    try {
      const vaultPk = new PublicKey(vault.vaultPubkey);

      const ix = await voltrClient.createWithdrawVaultIx({
        userTransferAuthority: wallet.publicKey,
        vault: vaultPk,
        vaultAssetMint: new PublicKey(vault.assetMintString),
        assetTokenProgram: TOKEN_PROGRAM_ID,
      });

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

      toast.success("Withdrawal executed!");
      refetchPosition();
    } catch (err: any) {
      console.error("Execute withdraw error:", err);
      toast.error(err?.message ?? "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  }, [voltrClient, wallet, connection, vault, refetchPosition]);

  const handleCancelWithdraw = useCallback(async () => {
    if (!voltrClient || !wallet.publicKey || !wallet.signTransaction) return;

    setLoading(true);
    try {
      const vaultPk = new PublicKey(vault.vaultPubkey);

      const ix = await voltrClient.createCancelRequestWithdrawVaultIx({
        userTransferAuthority: wallet.publicKey,
        vault: vaultPk,
      });

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

      toast.success("Withdrawal cancelled!");
      refetchPosition();
    } catch (err: any) {
      console.error("Cancel withdraw error:", err);
      toast.error(err?.message ?? "Cancellation failed");
    } finally {
      setLoading(false);
    }
  }, [voltrClient, wallet, connection, vault, refetchPosition]);

  const isWithdrawReady =
    pending && pending.withdrawableFromTs * 1000 <= Date.now();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Deposit & Withdraw</CardTitle>
        {wallet.publicKey && (
          <div className="text-sm text-muted-foreground">
            Your position:{" "}
            <span className="font-medium text-foreground">
              {formatNumber(bnToNumber(assetValue, decimals), 4)}{" "}
              {vault.assetSymbol}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!wallet.publicKey ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-muted-foreground text-sm">
              Connect your wallet to deposit or withdraw
            </p>
            <WalletMultiButton />
          </div>
        ) : pending ? (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                {isWithdrawReady ? (
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                )}
                <span className="font-medium text-sm">
                  {isWithdrawReady
                    ? "Withdrawal Ready"
                    : "Withdrawal Pending"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span>
                  {formatNumber(
                    pending.amountAssetToWithdrawAtPresent /
                      Math.pow(10, decimals),
                    4
                  )}{" "}
                  {vault.assetSymbol}
                </span>
              </div>
              {!isWithdrawReady && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available in</span>
                  <span>{timeRemaining}</span>
                </div>
              )}
            </div>
            {isWithdrawReady ? (
              <Button
                className="w-full"
                onClick={handleExecuteWithdraw}
                disabled={loading}
              >
                {loading ? "Processing..." : "Withdraw"}
              </Button>
            ) : (
              <Button
                className="w-full"
                variant="destructive"
                onClick={handleCancelWithdraw}
                disabled={loading}
              >
                {loading ? "Processing..." : "Cancel Withdrawal Request"}
              </Button>
            )}
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="deposit" className="flex-1">
                Deposit
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="flex-1">
                Withdraw
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Amount</Label>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setAmount(
                        (walletBalance / Math.pow(10, decimals)).toString()
                      )
                    }
                  >
                    Balance:{" "}
                    {formatNumber(
                      walletBalance / Math.pow(10, decimals),
                      4
                    )}
                  </button>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleDeposit}
                disabled={loading || !amount || parseFloat(amount) <= 0}
              >
                {loading ? "Processing..." : "Deposit"}
              </Button>
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Amount ({vault.assetSymbol})</Label>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setAmount(bnToNumber(assetValue, decimals).toString())
                    }
                  >
                    Deposited:{" "}
                    {formatNumber(bnToNumber(assetValue, decimals), 4)}
                  </button>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleRequestWithdraw}
                disabled={loading || !amount || parseFloat(amount) <= 0}
              >
                {loading ? "Processing..." : "Request Withdraw"}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
