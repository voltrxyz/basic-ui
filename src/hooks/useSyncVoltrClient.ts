"use client";

import { useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { VoltrClient } from "@voltr/vault-sdk";
import useAppStore from "@/stores/useAppStore";

export default function useSyncVoltrClient() {
  const { connection } = useConnection();
  const set = useAppStore((s) => s.set);

  useEffect(() => {
    if (!connection) return;

    const client = new VoltrClient(connection);
    set((s) => {
      s.voltrClient = client;
    });
  }, [connection, set]);
}
