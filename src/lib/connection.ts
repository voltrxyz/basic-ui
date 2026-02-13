import { Connection } from "@solana/web3.js";
import { RPC_URL } from "@/constants/environment";

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_URL, "confirmed");
  }
  return _connection;
}
