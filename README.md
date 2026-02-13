# Voltr Vaults UI Template

A self-contained Next.js template for building vault UIs on **Voltr Protocol** using `@voltr/vault-sdk`. Transactions are built client-side — no separate backend API required.

## Features

- **Vault Discovery** — Browse and filter yield vaults
- **Deposit & Withdraw** — Client-side transaction building with two-step withdrawal flow (request → wait → execute)
- **Vault Manager** — Create new vaults and update existing vault configurations
- **Real-time Updates** — Account change listeners for live position tracking

## Tech Stack

- **Framework**: Next.js 15, React 19, TypeScript
- **Blockchain**: `@voltr/vault-sdk`, `@solana/web3.js`, `@solana/wallet-adapter-react`
- **State**: Zustand + Immer, React Query
- **UI**: Tailwind CSS, shadcn/ui

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_RPC_URL` | Solana RPC endpoint |

### 3. Configure vaults

Edit `src/constants/vaults.ts` with your vault public keys:

```typescript
const MY_VAULT: UiVaultConfig = {
  name: "My Vault",
  vaultPubkeyString: "YOUR_VAULT_PUBKEY",
  description: "...",
  assetMintString: "TOKEN_MINT_PUBKEY",
  assetSymbol: "USDC",
  assetDecimals: 6,
  assetIcon: "/usdc.svg",
};

export const VAULTS = [MY_VAULT];
```

### 4. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── vaults/             # Vault listing & detail pages
│   └── vault-manager/      # Vault creation & config management
├── components/             # React components
├── hooks/                  # React Query hooks for on-chain data
├── stores/                 # Zustand store (VoltrClient, vault data)
├── constants/              # Vault registry, environment config
├── lib/                    # Utilities (formatting, connection)
└── types/                  # TypeScript type definitions
```

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import in Vercel
3. Add `NEXT_PUBLIC_RPC_URL` environment variable
