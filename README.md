# MeNami - The eye of NAMI

<div align="center">
  <img src="public/nami.png" alt="MeNami Logo" width="150" />

### _"Money isn't everything, but everything needs money!"_

— Nami, One Piece

</div>

---

## The Story Behind MeNami

**MeNami** (目ナミ) combines two powerful concepts:

- **Me (目)** — "Eye" in Japanese
- **Nami (ナミ)** — The legendary navigator and treasurer of the Straw Hat Pirates

Just like Nami has an unmatched eye for treasure and an obsession with keeping her berries safe, **MeNami** gives you the **navigator's eye** over your crypto assets.

Nami grew up saving every berry to buy back her village's freedom. She knows the value of every coin. MeNami inherits that spirit — a wallet that watches over your digital treasure with the same dedication.

> _"I'll draw a map of the entire world, but first... let me check my wallet balance."_

---

## What is MeNami?

MeNami is a **read-only HD (Hierarchical Deterministic) wallet** supporting **Solana** and **Ethereum** blockchains.

Think of it as your **treasure map and vault viewer** — you can:

- Generate new wallets with a 12-word recovery phrase
- Import existing wallets using a mnemonic or private key
- View balances across Solana and Ethereum networks
- Manage multiple accounts from a single seed phrase
- Switch between Mainnet and Testnet environments

**"Read-only"** means MeNami is designed for **viewing and managing keys** — it doesn't sign or broadcast transactions. Like Nami carefully counting her treasure without spending unnecessarily.

---

## Why "MeNami"?

| Element     | Meaning              | Connection                        |
| ----------- | -------------------- | --------------------------------- |
| 目 (Me)     | Eye                  | Watch over your assets            |
| ナミ (Nami) | Wave / The character | Navigate the crypto seas          |
| Navigator   | Nami's role          | Guide through blockchain networks |
| Treasurer   | Nami's passion       | Secure storage of wealth          |
| Tangerines  | Nami's symbol        | Growth and prosperity             |

Nami is the **only crew member** who can navigate the Grand Line's impossible waters. MeNami helps you **navigate** the equally complex world of multi-chain crypto.

---

## The Tech Crew (Stack)

Just like the Straw Hats, every technology has a role:

| Role                   | Technology                       | Bounty                      |
| ---------------------- | -------------------------------- | --------------------------- |
| Captain (Framework)    | Next.js 16 (App Router)          | Leads the ship              |
| First Mate (Language)  | TypeScript                       | Type-safe reliability       |
| Navigator (UI)         | React 19                         | Smooth user journeys        |
| Shipwright (Styling)   | Tailwind CSS v4                  | Beautiful craftsmanship     |
| Carpenter (Components) | shadcn/ui                        | Solid building blocks       |
| Musician (Animations)  | Motion (Framer Motion)           | Soul of the experience      |
| Doctor (Solana)        | @solana/web3.js                  | Heals Solana connections    |
| Cook (Ethereum)        | ethers.js v6                     | Serves Ethereum data        |
| Archaeologist (Crypto) | bip39, ed25519-hd-key, tweetnacl | Decodes the ancient secrets |

---

## Features - Nami Would Approve

- **Multi-Chain Treasure** — Solana and Ethereum from a single mnemonic
- **Unlimited Accounts** — Derive as many accounts as Nami has berries (infinite)
- **Private Key Import** — Bring your existing treasure keys aboard
- **Network Toggle** — Mainnet for real treasure, Testnet for practice
- **Real-Time Balances** — Know your wealth at a glance
- **Secure Storage** — localStorage persistence (guard it like Nami guards her tangerines)
- **Beautiful UI** — Smooth animations, dark mode, fully responsive
- **Toast Notifications** — Never miss an important update

---

## Project Map (Structure)

```
MeNami/
├── app/
│   ├── globals.css          # The ship's paint (Tailwind + theme)
│   ├── layout.tsx           # The hull (root layout)
│   └── page.tsx             # The deck (main entry)
├── components/
│   ├── icons/
│   │   └── BlockchainLogos.tsx   # Blockchain flags
│   ├── ui/                       # shadcn/ui crew
│   ├── OnboardingFlow.tsx        # Recruitment (create/import)
│   └── WalletDashboard.tsx       # Captain's quarters
├── contexts/
│   └── WalletContext.tsx         # The ship's log (state)
├── lib/
│   ├── balance.ts                # Treasure counter
│   ├── wallet.ts                 # Key forge
│   └── utils.ts                  # Ship utilities
├── public/
│   └── nami.png                  # Our beloved navigator
└── package.json                  # Crew manifest
```

---

## Deep Dive: The Grand Line of Code

Let's navigate through the core functionalities — each one as essential as a crew member.

---

### 1. Mnemonic Generation — Creating Your Treasure Map

The foundation of any HD wallet is the mnemonic phrase — your 12-word treasure map.

```typescript
// lib/wallet.ts

export const generateMnemonic = (): string => {
  try {
    return bip39Generate();
  } catch (error) {
    throw new Error(`Failed to generate mnemonic`);
  }
};

export const validateMnemonic = (mnemonic: string): boolean => {
  if (!mnemonic || typeof mnemonic !== "string") {
    return false;
  }
  return bip39Validate(mnemonic.trim());
};
```

**How it works:**

- `bip39Generate()` creates random 128-bit entropy → 12 words
- These 12 words ARE your wallet — lose them, lose everything
- Nami would write this down in three different hiding spots

---

### 2. HD Key Derivation — One Map, Infinite Treasures

From a single mnemonic, derive unlimited keypairs using standardized paths.

```typescript
// Derivation paths follow BIP44 standard
const DERIVATION_PATHS = {
  solana: (index: number) => `m/44'/501'/${index}'/0'`, // Solana seas
  ethereum: (index: number) => `m/44'/60'/0'/0/${index}`, // Ethereum waters
};

// Solana uses Ed25519 curve
export const deriveSolanaKeypair = (mnemonic: string, index: number) => {
  const seed = mnemonicToSeed(mnemonic);
  const path = DERIVATION_PATHS.solana(index);
  const derivedSeed = derivePath(path, seed.toString("hex")).key;
  const keypair = nacl.sign.keyPair.fromSeed(derivedSeed);
  // ... returns publicKey, secretKey, derivationPath
};

// Ethereum uses secp256k1 curve
export const deriveEthereumWallet = (mnemonic: string, index: number) => {
  const path = DERIVATION_PATHS.ethereum(index);
  const hdNode = HDNodeWallet.fromPhrase(mnemonic.trim(), undefined, path);
  // ... returns publicKey, privateKey, derivationPath
};
```

**The Navigator's Secret:**

- Same mnemonic + same path = same keys (deterministic)
- Increment the index = new treasure chest
- One map, unlimited X marks

---

### 3. Balance Fetching — Counting Your Berries

Real-time treasure counting using public RPC endpoints.

```typescript
// lib/balance.ts

const RPC_ENDPOINTS = {
  mainnet: {
    solana: "https://api.mainnet-beta.solana.com",
    ethereum: "https://eth.llamarpc.com",
  },
  testnet: {
    solana: "https://api.devnet.solana.com",
    ethereum: "https://sepolia.gateway.tenderly.co",
  },
};

export async function getSolanaBalance(
  publicKey: string,
  network: NetworkType,
) {
  const connection = getSolanaConnection(network);
  const lamports = await connection.getBalance(new PublicKey(publicKey));
  return { balance: lamports / LAMPORTS_PER_SOL };
}

export async function getEthereumBalance(
  address: string,
  network: NetworkType,
) {
  const provider = getEthereumProvider(network);
  const wei = await provider.getBalance(address);
  return { balance: parseFloat(formatEther(wei)) };
}
```

**Nami's Ledger:**

| Network | Solana Port                   | Ethereum Port                 |
| ------- | ----------------------------- | ----------------------------- |
| Mainnet | `api.mainnet-beta.solana.com` | `eth.llamarpc.com`            |
| Testnet | `api.devnet.solana.com`       | `sepolia.gateway.tenderly.co` |

---

### 4. State Management — The Ship's Log

React Context provides global state with localStorage persistence.

```typescript
// contexts/WalletContext.tsx

export const WalletProvider = ({ children }) => {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [network, setNetworkState] = useState<NetworkType>("testnet");

  // Load from localStorage on mount (recovering the ship's log)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored);
      setMnemonic(state.mnemonic);
      setAccounts(state.accounts);
    }
  }, []);

  // Save to localStorage on changes (writing to the log)
  useEffect(() => {
    if (mnemonic) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mnemonic, accounts }));
    }
  }, [mnemonic, accounts]);
};
```

---

## Getting Started — Join the Crew

### Prerequisites

- Node.js 18+ or Bun runtime
- A brave heart ready to navigate the crypto seas

### Installation

```bash
# Clone the ship
git clone <your-repo-url>
cd walletApp

# Gather the crew (install dependencies)
bun install
# or
npm install
```

### Set Sail

```bash
# Development voyage
bun dev

# Production journey
bun run build && bun start
```

Open [http://localhost:3000](http://localhost:3000) and begin your adventure!

---

## Security — Guard Your Treasure

Like Nami protecting her tangerine grove, protect your keys:

| Treasure         | Storage      | Risk Level                |
| ---------------- | ------------ | ------------------------- |
| Mnemonic         | localStorage | HIGH - Full wallet access |
| Private Keys     | localStorage | HIGH - Account access     |
| Public Addresses | localStorage | LOW - View only           |

**Nami's Security Rules:**

1. **Never use real funds** on untrusted devices (would Nami trust strangers?)
2. **Clear browser data** when done on shared computers
3. **Back up your mnemonic** offline — paper in a safe place
4. **Don't share your screen** when viewing private keys
5. This is a **learning project** — for serious treasure, use hardware wallets

---

## The Crew's Bounties (Feature Summary)

| Feature             | Implementation     | Bounty Location              |
| ------------------- | ------------------ | ---------------------------- |
| Mnemonic Generation | BIP39 standard     | `lib/wallet.ts`              |
| HD Key Derivation   | BIP44 paths        | `lib/wallet.ts`              |
| Private Key Import  | Base58/Hex parsing | `lib/wallet.ts`              |
| Balance Fetching    | RPC calls          | `lib/balance.ts`             |
| State Management    | React Context      | `contexts/WalletContext.tsx` |
| Toast Notifications | Sonner             | `components/*.tsx`           |
| UI Components       | shadcn/ui + Motion | `components/*.tsx`           |

---

<div align="center">

## _"I'm not afraid of anything... except being broke!"_

Built with the spirit of a navigator who dreams of mapping the entire world.

**MeNami** — Your eye on the treasure. 目ナミ

---

_Now go forth and navigate the blockchain seas!_ 🏴‍☠️

</div>
