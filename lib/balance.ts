import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { JsonRpcProvider, formatEther } from "ethers";

export type NetworkType = "mainnet" | "testnet";

// RPC Endpoints
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

// Cache connections per network to avoid creating new ones on each request
const solanaConnections: Record<NetworkType, Connection | null> = {
  mainnet: null,
  testnet: null,
};

const ethereumProviders: Record<NetworkType, JsonRpcProvider | null> = {
  mainnet: null,
  testnet: null,
};

/**
 * Get or create a Solana connection for the specified network
 */
function getSolanaConnection(network: NetworkType): Connection {
  if (!solanaConnections[network]) {
    solanaConnections[network] = new Connection(
      RPC_ENDPOINTS[network].solana,
      "confirmed"
    );
  }
  return solanaConnections[network]!;
}

/**
 * Get or create an Ethereum provider for the specified network
 */
function getEthereumProvider(network: NetworkType): JsonRpcProvider {
  if (!ethereumProviders[network]) {
    ethereumProviders[network] = new JsonRpcProvider(
      RPC_ENDPOINTS[network].ethereum
    );
  }
  return ethereumProviders[network]!;
}

/**
 * Fetch Solana balance for a given public key
 * @returns Balance in SOL (not lamports)
 */
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

/**
 * Fetch Ethereum balance for a given address
 * @returns Balance in ETH (not wei)
 */
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

/**
 * Format balance for display
 * @param balance - The balance amount
 * @param symbol - The currency symbol (SOL, ETH)
 * @param decimals - Number of decimal places to show
 */
export function formatBalance(
  balance: number,
  symbol: string,
  decimals: number = 4
): string {
  if (balance === 0) return `0 ${symbol}`;

  // For very small amounts, show more decimals
  if (balance < 0.0001) {
    return `<0.0001 ${symbol}`;
  }

  // For regular amounts, show up to specified decimals
  const formatted = balance.toFixed(decimals);
  // Remove trailing zeros
  const trimmed = parseFloat(formatted).toString();
  return `${trimmed} ${symbol}`;
}

/**
 * Get network display names
 */
export function getNetworkDisplayName(network: NetworkType): {
  solana: string;
  ethereum: string;
} {
  if (network === "mainnet") {
    return {
      solana: "Mainnet",
      ethereum: "Mainnet",
    };
  }
  return {
    solana: "Devnet",
    ethereum: "Sepolia",
  };
}
