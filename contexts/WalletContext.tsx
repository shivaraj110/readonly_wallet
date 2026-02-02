"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  WalletAccount,
  WalletState,
  BlockchainType,
  generateMnemonic,
  validateMnemonic,
  createAccount,
  getPrivateKey,
  importAccountFromPrivateKey,
  validateSolanaPrivateKey,
  validateEthereumPrivateKey,
} from "@/lib/wallet";
import { NetworkType } from "@/lib/balance";

const STORAGE_KEY = "web3-wallet-state";
const NETWORK_STORAGE_KEY = "web3-wallet-network";

interface WalletContextType {
  // State
  mnemonic: string | null;
  accounts: WalletAccount[];
  network: NetworkType;
  isInitialized: boolean;
  isLoading: boolean;

  // Actions
  createNewWallet: () => string;
  importWallet: (mnemonic: string) => boolean;
  addAccount: (blockchain: BlockchainType, name?: string) => WalletAccount;
  importAccount: (privateKey: string, blockchain: BlockchainType, name?: string) => WalletAccount | null;
  validatePrivateKey: (privateKey: string, blockchain: BlockchainType) => boolean;
  removeAccount: (accountId: string) => void;
  renameAccount: (accountId: string, newName: string) => void;
  getAccountPrivateKey: (account: WalletAccount) => string | null;
  setNetwork: (network: NetworkType) => void;
  clearWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [solanaIndex, setSolanaIndex] = useState(0);
  const [ethereumIndex, setEthereumIndex] = useState(0);
  const [network, setNetworkState] = useState<NetworkType>("testnet");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: WalletState = JSON.parse(stored);
        setMnemonic(state.mnemonic);
        setAccounts(state.accounts);
        setSolanaIndex(state.solanaIndex);
        setEthereumIndex(state.ethereumIndex);
        setIsInitialized(true);
      }
      // Load network preference
      const storedNetwork = localStorage.getItem(NETWORK_STORAGE_KEY);
      if (storedNetwork === "mainnet" || storedNetwork === "testnet") {
        setNetworkState(storedNetwork);
      }
    } catch (error) {
      console.error("Failed to load wallet state:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isLoading) return;

    if (mnemonic) {
      const state: WalletState = {
        mnemonic,
        accounts,
        solanaIndex,
        ethereumIndex,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [mnemonic, accounts, solanaIndex, ethereumIndex, isLoading]);

  const createNewWallet = useCallback((): string => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
    setAccounts([]);
    setSolanaIndex(0);
    setEthereumIndex(0);
    setIsInitialized(true);
    return newMnemonic;
  }, []);

  const importWallet = useCallback((importedMnemonic: string): boolean => {
    if (!validateMnemonic(importedMnemonic)) {
      return false;
    }
    setMnemonic(importedMnemonic.trim());
    setAccounts([]);
    setSolanaIndex(0);
    setEthereumIndex(0);
    setIsInitialized(true);
    return true;
  }, []);

  const addAccount = useCallback(
    (blockchain: BlockchainType, name?: string): WalletAccount => {
      if (!mnemonic) {
        throw new Error("Wallet not initialized");
      }

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

  const importAccount = useCallback(
    (privateKey: string, blockchain: BlockchainType, name?: string): WalletAccount | null => {
      const account = importAccountFromPrivateKey(privateKey, blockchain, name);
      if (account) {
        setAccounts((prev) => [...prev, account]);
        // Initialize wallet if not already (for standalone private key imports)
        if (!isInitialized) {
          setIsInitialized(true);
        }
      }
      return account;
    },
    [isInitialized]
  );

  const validatePrivateKey = useCallback(
    (privateKey: string, blockchain: BlockchainType): boolean => {
      if (blockchain === "solana") {
        return validateSolanaPrivateKey(privateKey);
      } else {
        return validateEthereumPrivateKey(privateKey);
      }
    },
    []
  );

  const getAccountPrivateKey = useCallback(
    (account: WalletAccount): string | null => {
      // For imported accounts, the private key is stored in the account
      if (account.isImported && account.importedPrivateKey) {
        return account.importedPrivateKey;
      }
      // For HD-derived accounts, derive from mnemonic
      if (!mnemonic) return null;
      return getPrivateKey(mnemonic, account);
    },
    [mnemonic]
  );

  const clearWallet = useCallback(() => {
    setMnemonic(null);
    setAccounts([]);
    setSolanaIndex(0);
    setEthereumIndex(0);
    setIsInitialized(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setNetwork = useCallback((newNetwork: NetworkType) => {
    setNetworkState(newNetwork);
    localStorage.setItem(NETWORK_STORAGE_KEY, newNetwork);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        mnemonic,
        accounts,
        network,
        isInitialized,
        isLoading,
        createNewWallet,
        importWallet,
        addAccount,
        importAccount,
        validatePrivateKey,
        removeAccount,
        renameAccount,
        getAccountPrivateKey,
        setNetwork,
        clearWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
