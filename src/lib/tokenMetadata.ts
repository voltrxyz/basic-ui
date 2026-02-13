import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";

const METAPLEX_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

function findMetadataPda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METAPLEX_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METAPLEX_METADATA_PROGRAM_ID
  );
  return pda;
}

function parseMetaplexString(data: Buffer, offset: number): string {
  const len = data.readUInt32LE(offset);
  const str = data.subarray(offset + 4, offset + 4 + len);
  return str.toString("utf-8").replace(/\0/g, "").trim();
}

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
}

export async function fetchTokenInfo(
  connection: Connection,
  mintPubkey: PublicKey
): Promise<TokenInfo> {
  const mintInfo = await getMint(connection, mintPubkey);
  const decimals = mintInfo.decimals;

  let symbol = mintPubkey.toBase58().slice(0, 4) + "...";
  let name = "";

  try {
    const metadataPda = findMetadataPda(mintPubkey);
    const accountInfo = await connection.getAccountInfo(metadataPda);
    if (accountInfo?.data) {
      const data = accountInfo.data;
      // Metaplex metadata layout:
      // 1 (key) + 32 (update_authority) + 32 (mint) = offset 65
      // name: 4 bytes len + 32 bytes data
      // symbol: 4 bytes len + 10 bytes data
      name = parseMetaplexString(data, 65);
      symbol = parseMetaplexString(data, 65 + 4 + 32);
    }
  } catch {
    // No Metaplex metadata — use shortened mint as symbol
  }

  return { symbol, name, decimals };
}
