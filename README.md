# Web3 Wallet - A Read-Only Multi-Chain Wallet

> A beautifully crafted, read-only cryptocurrency wallet supporting **Solana** and **Ethereum** blockchains. Built with modern web technologies and a focus on simplicity and security.

---

## What is This?

This is a **read-only HD (Hierarchical Deterministic) wallet** that allows you to:

- Generate new wallets with a 12-word recovery phrase
- Import existing wallets using a mnemonic or private key
- View balances across Solana and Ethereum networks
- Manage multiple accounts from a single seed phrase
- Switch between Mainnet and Testnet environments

**"Read-only"** means this wallet is designed for **viewing and managing keys** - it doesn't sign or broadcast transactions. Think of it as a secure vault for your keys and a dashboard for your balances.

---

## The Tech Behind It

This project leverages a modern, type-safe stack:

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Animations | Motion (Framer Motion) |
| Solana | @solana/web3.js |
| Ethereum | ethers.js v6 |
| Cryptography | bip39, ed25519-hd-key, tweetnacl |

---

## Features at a Glance

- **Multi-Chain Support** - Solana and Ethereum from a single mnemonic
- **HD Wallet** - Derive unlimited accounts using BIP44 standard paths
- **Private Key Import** - Import standalone accounts without a mnemonic
- **Network Toggle** - Switch between Mainnet and Testnet instantly
- **Real-Time Balances** - Fetch SOL and ETH balances on demand
- **Secure Storage** - Wallet state persisted in localStorage
- **Beautiful UI** - Smooth animations, dark mode ready, fully responsive

---

## Project Structure

```
walletApp/
├── app/
│   ├── globals.css          # Tailwind + shadcn theme
│   ├── layout.tsx           # Root layout with WalletProvider
│   └── page.tsx             # Conditional: Onboarding or Dashboard
├── components/
│   ├── icons/
│   │   └── BlockchainLogos.tsx   # Solana & Ethereum SVG logos
│   ├── ui/                       # shadcn/ui components
│   ├── OnboardingFlow.tsx        # Create/Import wallet screens
│   └── WalletDashboard.tsx       # Main wallet interface
├── contexts/
│   └── WalletContext.tsx         # Global state management
├── lib/
│   ├── balance.ts                # RPC calls for balance fetching
│   ├── wallet.ts                 # Core wallet logic (keys, derivation)
│   └── utils.ts                  # shadcn utilities
└── package.json
```

---

## Deep Dive: Core Functionalities

Let's explore how each core feature works under the hood.

---

### 1. Mnemonic Generation & Validation

The foundation of any HD wallet is the mnemonic phrase. We use the BIP39 standard to generate a cryptographically secure 12-word phrase.

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
- `bip39Generate()` creates a random 128-bit entropy and converts it to 12 words
- `bip39Validate()` checks if the words are valid BIP39 words with correct checksum
- The mnemonic is the master key - everything else derives from it

---

### 2. HD Key Derivation (Solana & Ethereum)

From a single mnemonic, we can derive unlimited keypairs using standardized derivation paths.

```typescript
// lib/wallet.ts

// Derivation paths follow BIP44 standard
const DERIVATION_PATHS = {
  solana: (index: number) => `m/44'/501'/${index}'/0'`,
  ethereum: (index: number) => `m/44'/60'/0'/0/${index}`,
};

// Solana uses Ed25519 curve
export const deriveSolanaKeypair = (
  mnemonic: string,
  index: number
): { publicKey: string; secretKey: Uint8Array; derivationPath: string } => {
  const seed = mnemonicToSeed(mnemonic);
  const path = DERIVATION_PATHS.solana(index);
  const derivedSeed = derivePath(path, seed.toString("hex")).key;
  const keypair = nacl.sign.keyPair.fromSeed(derivedSeed);
  const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey);

  return {
    publicKey: solanaKeypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
    derivationPath: path,
  };
};

// Ethereum uses secp256k1 curve (handled by ethers)
export const deriveEthereumWallet = (
  mnemonic: string,
  index: number
): { publicKey: string; privateKey: string; derivationPath: string } => {
  const path = DERIVATION_PATHS.ethereum(index);
  const hdNode = HDNodeWallet.fromPhrase(mnemonic.trim(), undefined, path);

  return {
    publicKey: hdNode.address,
    privateKey: hdNode.privateKey,
    derivationPath: path,
  };
};
```

**The magic of HD wallets:**
- Same mnemonic + same path = same keys (deterministic)
- Increment the index to get a new account
- Solana path: `m/44'/501'/0'/0'` (coin type 501)
- Ethereum path: `m/44'/60'/0'/0/0` (coin type 60)

---

### 3. Private Key Import

Sometimes you have a private key but no mnemonic. We support importing standalone accounts.

```typescript
// lib/wallet.ts

export const importSolanaAccount = (
  privateKey: string,
  name?: string
): WalletAccount | null => {
  try {
    const decoded = bs58.decode(privateKey.trim());
    let keypair: Keypair;
    
    if (decoded.length === 64) {
      keypair = Keypair.fromSecretKey(decoded);
    } else if (decoded.length === 32) {
      const keyPair = nacl.sign.keyPair.fromSeed(decoded);
      keypair = Keypair.fromSecretKey(keyPair.secretKey);
    } else {
      return null;
    }

    return {
      id: `solana-imported-${Date.now()}`,
      name: name || "Imported Solana Account",
      blockchain: "solana",
      publicKey: keypair.publicKey.toBase58(),
      derivationPath: "imported",
      index: -1,
      isImported: true,
      importedPrivateKey: privateKey.trim(),
    };
  } catch {
    return null;
  }
};

export const importEthereumAccount = (
  privateKey: string,
  name?: string
): WalletAccount | null => {
  try {
    let key = privateKey.trim();
    if (!key.startsWith("0x")) {
      key = "0x" + key;
    }

    const wallet = new Wallet(key);
    return {
      id: `ethereum-imported-${Date.now()}`,
      name: name || "Imported Ethereum Account",
      blockchain: "ethereum",
      publicKey: wallet.address,
      derivationPath: "imported",
      index: -1,
      isImported: true,
      importedPrivateKey: key,
    };
  } catch {
    return null;
  }
};
```

**Key formats supported:**
- **Solana**: Base58-encoded (64 bytes for full keypair, 32 bytes for seed)
- **Ethereum**: Hex string with or without `0x` prefix (64 hex characters)

---

### 4. Balance Fetching (Mainnet & Testnet)

Real-time balance queries using public RPC endpoints.

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
  network: NetworkType = "testnet"
): Promise<{ balance: number; error?: string }> {
  try {
    const connection = getSolanaConnection(network);
    const pubKey = new PublicKey(publicKey);
    const lamports = await connection.getBalance(pubKey);
    const balance = lamports / LAMPORTS_PER_SOL;
    return { balance };
  } catch (error) {
    console.error("Failed to fetch Solana balance:", error);
    return { balance: 0, error: "Failed to fetch balance" };
  }
}

export async function getEthereumBalance(
  address: string,
  network: NetworkType = "testnet"
): Promise<{ balance: number; error?: string }> {
  try {
    const provider = getEthereumProvider(network);
    const wei = await provider.getBalance(address);
    const balance = parseFloat(formatEther(wei));
    return { balance };
  } catch (error) {
    console.error("Failed to fetch Ethereum balance:", error);
    return { balance: 0, error: "Failed to fetch balance" };
  }
}
```

**RPC endpoints used:**

| Network | Solana | Ethereum |
|---------|--------|----------|
| Mainnet | `api.mainnet-beta.solana.com` | `eth.llamarpc.com` |
| Testnet | `api.devnet.solana.com` | `sepolia.gateway.tenderly.co` |

---

### 5. Wallet State Management

React Context provides global state with localStorage persistence.

```typescript
// contexts/WalletContext.tsx

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [network, setNetworkState] = useState<NetworkType>("testnet");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: WalletState = JSON.parse(stored);
        setMnemonic(state.mnemonic);
        setAccounts(state.accounts);
        setIsInitialized(true);
      }
      const storedNetwork = localStorage.getItem(NETWORK_STORAGE_KEY);
      if (storedNetwork === "mainnet" || storedNetwork === "testnet") {
        setNetworkState(storedNetwork);
      }
    } catch (error) {
      console.error("Failed to load wallet state:", error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (mnemonic) {
      const state: WalletState = { mnemonic, accounts, solanaIndex, ethereumIndex };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [mnemonic, accounts, solanaIndex, ethereumIndex]);
  
  // ... rest of the provider
};
```

**State architecture:**
- `mnemonic` - The master seed phrase (null for private-key-only wallets)
- `accounts` - Array of all wallet accounts (HD-derived + imported)
- `network` - Current network selection (mainnet/testnet)
- State persists across browser sessions via localStorage

---

### 6. Account Management (CRUD Operations)

Full lifecycle management for wallet accounts.

```typescript
// contexts/WalletContext.tsx

const addAccount = useCallback(
  (blockchain: BlockchainType, name?: string): WalletAccount => {
    if (!mnemonic) throw new Error("Wallet not initialized");
    
    const index = blockchain === "solana" ? solanaIndex : ethereumIndex;
    const account = createAccount(mnemonic, blockchain, index, name);
    setAccounts((prev) => [...prev, account]);
    
    if (blockchain === "solana") {
      setSolanaIndex((prev) => prev + 1);
    } else {
      setEthereumIndex((prev) => prev + 1);
    }
    return account;
  },
  [mnemonic, solanaIndex, ethereumIndex]
);

const importAccount = useCallback(
  (privateKey: string, blockchain: BlockchainType, name?: string): WalletAccount | null => {
    const account = importAccountFromPrivateKey(privateKey, blockchain, name);
    if (account) {
      setAccounts((prev) => [...prev, account]);
      if (!isInitialized) setIsInitialized(true);
    }
    return account;
  },
  [isInitialized]
);

const removeAccount = useCallback((accountId: string) => {
  setAccounts((prev) => prev.filter((account) => account.id !== accountId));
}, []);

const renameAccount = useCallback((accountId: string, newName: string) => {
  setAccounts((prev) =>
    prev.map((account) =>
      account.id === accountId ? { ...account, name: newName } : account
    )
  );
}, []);
```

**Operations available:**
- **Create** - Derive a new account from mnemonic (increments index)
- **Import** - Add an account via private key
- **Remove** - Delete an account from the wallet
- **Rename** - Update an account's display name

---

### 7. Network Switching

Seamlessly toggle between mainnet and testnet.

```typescript
// contexts/WalletContext.tsx

const setNetwork = useCallback((newNetwork: NetworkType) => {
  setNetworkState(newNetwork);
  localStorage.setItem(NETWORK_STORAGE_KEY, newNetwork);
}, []);
```

```tsx
// components/WalletDashboard.tsx (UI Toggle)

<div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
  <span className={`text-sm ${network === "testnet" ? "text-muted-foreground" : "font-medium"}`}>
    Mainnet
  </span>
  <Switch
    checked={network === "testnet"}
    onCheckedChange={(checked) => setNetwork(checked ? "testnet" : "mainnet")}
  />
  <span className={`text-sm ${network === "mainnet" ? "text-muted-foreground" : "font-medium"}`}>
    Testnet
  </span>
</div>
```

**Behavior:**
- Switching networks clears cached balances
- Network preference persists across sessions
- RPC connections are cached per-network for performance

---

### 8. Private Key Reveal

Securely display private keys for any account type.

```typescript
// lib/wallet.ts

export const getPrivateKey = (
  mnemonic: string | null,
  account: WalletAccount
): string => {
  // For imported accounts, return the stored private key
  if (account.isImported && account.importedPrivateKey) {
    return account.importedPrivateKey;
  }

  // For HD-derived accounts, derive from mnemonic
  if (!mnemonic) {
    throw new Error("Mnemonic required for non-imported accounts");
  }

  if (account.blockchain === "solana") {
    const { secretKey } = deriveSolanaKeypair(mnemonic, account.index);
    return bs58.encode(secretKey);
  } else {
    const { privateKey } = deriveEthereumWallet(mnemonic, account.index);
    return privateKey;
  }
};
```

**Two retrieval paths:**
1. **Imported accounts** - Return the stored `importedPrivateKey`
2. **HD accounts** - Re-derive from mnemonic + index (keys are never stored)

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun runtime
- A modern web browser

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd walletApp

# Install dependencies
bun install
# or
npm install
```

### Running the App

```bash
# Development mode
bun dev
# or
npm run dev

# Production build
bun run build
bun start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Security Considerations

This is a **read-only wallet** - it does not sign or broadcast transactions. However, it handles sensitive cryptographic material:

| Data | Storage | Risk Level |
|------|---------|------------|
| Mnemonic | localStorage | High - Full wallet access |
| Imported Private Keys | localStorage | High - Account access |
| Public Addresses | localStorage | Low - View only |
| Network Preference | localStorage | None |

**Best Practices:**

1. **Never use this wallet with real funds** on untrusted devices
2. **Clear browser data** when done on shared computers
3. **Back up your mnemonic** securely offline
4. **Don't share your screen** when viewing private keys
5. This is a **learning/demo project** - for production use, consider hardware wallets

---

## Summary

| Feature | Implementation | Key Files |
|---------|----------------|-----------|
| Mnemonic Generation | BIP39 standard | `lib/wallet.ts` |
| HD Key Derivation | BIP44 paths (Ed25519 + secp256k1) | `lib/wallet.ts` |
| Private Key Import | Base58/Hex parsing | `lib/wallet.ts` |
| Balance Fetching | RPC calls via web3.js/ethers | `lib/balance.ts` |
| State Management | React Context + localStorage | `contexts/WalletContext.tsx` |
| Account CRUD | Functional state updates | `contexts/WalletContext.tsx` |
| Network Switching | Cached providers per network | `lib/balance.ts` |
| UI Components | shadcn/ui + Motion | `components/*.tsx` |

---

Built with mass mass care, mass mass love, and mass mass coffee. Happy building!
