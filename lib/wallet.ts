import {
  generateMnemonic as bip39Generate,
  mnemonicToSeedSync as bip39ToSeed,
  validateMnemonic as bip39Validate,
} from "bip39";
import { derivePath } from "ed25519-hd-key";
import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { HDNodeWallet, Wallet } from "ethers";

export type BlockchainType = "solana" | "ethereum";

export interface WalletAccount {
  id: string;
  name: string;
  blockchain: BlockchainType;
  publicKey: string;
  derivationPath: string;
  index: number;
  /** If true, this account was imported via private key (not derived from mnemonic) */
  isImported?: boolean;
  /** Encrypted/stored private key for imported accounts only */
  importedPrivateKey?: string;
}

export interface WalletState {
  mnemonic: string;
  accounts: WalletAccount[];
  solanaIndex: number;
  ethereumIndex: number;
}

// Derivation paths for different blockchains
// Solana: m/44'/501'/index'/0'
// Ethereum: m/44'/60'/0'/0/index
const DERIVATION_PATHS = {
  solana: (index: number) => `m/44'/501'/${index}'/0'`,
  ethereum: (index: number) => `m/44'/60'/0'/0/${index}`,
};

/**
 * Generate a new 12-word mnemonic phrase
 */
export const generateMnemonic = (): string => {
  try {
    return bip39Generate();
  } catch (error) {
    throw new Error(`Failed to generate mnemonic`);
  }
};

/**
 * Validate a mnemonic phrase
 */
export const validateMnemonic = (mnemonic: string): boolean => {
  if (!mnemonic || typeof mnemonic !== "string") {
    return false;
  }
  return bip39Validate(mnemonic.trim());
};

/**
 * Convert mnemonic to seed
 */
export const mnemonicToSeed = (mnemonic: string): Buffer => {
  if (!mnemonic || typeof mnemonic !== "string") {
    throw new Error("Invalid mnemonic provided");
  }
  try {
    return bip39ToSeed(mnemonic.trim());
  } catch (error) {
    throw new Error(`Failed to convert mnemonic to seed`);
  }
};

/**
 * Derive a Solana keypair from mnemonic and index
 */
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

/**
 * Derive an Ethereum wallet from mnemonic and index
 */
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

/**
 * Create a new wallet account
 */
export const createAccount = (
  mnemonic: string,
  blockchain: BlockchainType,
  index: number,
  name?: string
): WalletAccount => {
  const id = `${blockchain}-${index}-${Date.now()}`;
  const accountName = name || `${blockchain === "solana" ? "Solana" : "Ethereum"} Account ${index + 1}`;

  if (blockchain === "solana") {
    const { publicKey, derivationPath } = deriveSolanaKeypair(mnemonic, index);
    return {
      id,
      name: accountName,
      blockchain,
      publicKey,
      derivationPath,
      index,
    };
  } else {
    const { publicKey, derivationPath } = deriveEthereumWallet(mnemonic, index);
    return {
      id,
      name: accountName,
      blockchain,
      publicKey,
      derivationPath,
      index,
    };
  }
};

/**
 * Get the secret/private key for an account (for display purposes only in readonly wallet)
 */
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

/**
 * Format public key for display (truncate middle)
 */
export const formatAddress = (address: string, chars: number = 4): string => {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Get blockchain display info
 */
export const getBlockchainInfo = (blockchain: BlockchainType) => {
  const info = {
    solana: {
      name: "Solana",
      symbol: "SOL",
      color: "#9945FF",
      icon: "S",
    },
    ethereum: {
      name: "Ethereum",
      symbol: "ETH",
      color: "#627EEA",
      icon: "E",
    },
  };
  return info[blockchain];
};

/**
 * Validate a Solana private key (base58 encoded)
 */
export const validateSolanaPrivateKey = (privateKey: string): boolean => {
  try {
    const decoded = bs58.decode(privateKey.trim());
    // Solana private keys are 64 bytes (keypair) or 32 bytes (seed)
    if (decoded.length !== 64 && decoded.length !== 32) {
      return false;
    }
    // Try to create a keypair from it
    if (decoded.length === 64) {
      Keypair.fromSecretKey(decoded);
    } else {
      // 32 byte seed
      nacl.sign.keyPair.fromSeed(decoded);
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate an Ethereum private key (hex string with or without 0x prefix)
 */
export const validateEthereumPrivateKey = (privateKey: string): boolean => {
  try {
    let key = privateKey.trim();
    // Add 0x prefix if not present
    if (!key.startsWith("0x")) {
      key = "0x" + key;
    }
    // Check if it's a valid hex string of correct length (32 bytes = 64 hex chars + 2 for 0x)
    if (!/^0x[a-fA-F0-9]{64}$/.test(key)) {
      return false;
    }
    // Try to create a wallet from it
    new Wallet(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Import a Solana account from a private key
 */
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
      // 32 byte seed
      const keyPair = nacl.sign.keyPair.fromSeed(decoded);
      keypair = Keypair.fromSecretKey(keyPair.secretKey);
    } else {
      return null;
    }

    const id = `solana-imported-${Date.now()}`;
    const accountName = name || "Imported Solana Account";

    return {
      id,
      name: accountName,
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

/**
 * Import an Ethereum account from a private key
 */
export const importEthereumAccount = (
  privateKey: string,
  name?: string
): WalletAccount | null => {
  try {
    let key = privateKey.trim();
    // Add 0x prefix if not present
    if (!key.startsWith("0x")) {
      key = "0x" + key;
    }

    const wallet = new Wallet(key);
    const id = `ethereum-imported-${Date.now()}`;
    const accountName = name || "Imported Ethereum Account";

    return {
      id,
      name: accountName,
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

/**
 * Import an account from private key (auto-detects blockchain)
 */
export const importAccountFromPrivateKey = (
  privateKey: string,
  blockchain: BlockchainType,
  name?: string
): WalletAccount | null => {
  if (blockchain === "solana") {
    return importSolanaAccount(privateKey, name);
  } else {
    return importEthereumAccount(privateKey, name);
  }
};
