"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useWallet } from "@/contexts/WalletContext";
import { WalletAccount, getBlockchainInfo, BlockchainType } from "@/lib/wallet";
import {
  getSolanaBalance,
  getEthereumBalance,
  formatBalance,
  getNetworkDisplayName,
} from "@/lib/balance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Key,
  Wallet,
  LogOut,
  Edit2,
  RefreshCw,
  Loader2,
  Download,
  AlertCircle,
} from "lucide-react";
import { SolanaLogo, EthereumLogo } from "@/components/icons/BlockchainLogos";
import { toast } from "sonner";

interface BalanceState {
  [accountId: string]: {
    balance: number;
    loading: boolean;
    error?: string;
  };
}

export function WalletDashboard() {
  const {
    mnemonic,
    accounts,
    network,
    setNetwork,
    addAccount,
    importAccount,
    validatePrivateKey,
    removeAccount,
    renameAccount,
    getAccountPrivateKey,
    clearWallet,
  } = useWallet();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogTab, setAddDialogTab] = useState<"create" | "import">("create");
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainType>("solana");
  const [newAccountName, setNewAccountName] = useState("");
  const [importPrivateKey, setImportPrivateKey] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);
  const [showSecretPhrase, setShowSecretPhrase] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [balances, setBalances] = useState<BalanceState>({});
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleCopyMnemonic = async () => {
    if (mnemonic) {
      await navigator.clipboard.writeText(mnemonic);
      setCopiedMnemonic(true);
      toast.success("Recovery phrase copied to clipboard");
      setTimeout(() => setCopiedMnemonic(false), 2000);
    }
  };

  const handleAddAccount = () => {
    toast.promise(
      () =>
        new Promise<{ name: string }>((resolve) => {
          setTimeout(() => {
            const account = addAccount(selectedBlockchain, newAccountName || undefined);
            resolve({ name: account.name });
          }, 500);
        }),
      {
        loading: "Creating account...",
        success: (data) => `${data.name} created successfully!`,
        error: "Failed to create account",
      }
    );
    resetAddDialog();
  };

  const handleImportAccount = () => {
    setImportError(null);

    if (!importPrivateKey.trim()) {
      setImportError("Please enter a private key.");
      toast.error("Please enter a private key");
      return;
    }

    if (!validatePrivateKey(importPrivateKey, selectedBlockchain)) {
      setImportError(`Invalid ${selectedBlockchain === "solana" ? "Solana" : "Ethereum"} private key.`);
      toast.error(`Invalid ${selectedBlockchain === "solana" ? "Solana" : "Ethereum"} private key`);
      return;
    }

    toast.promise(
      () =>
        new Promise<{ name: string }>((resolve, reject) => {
          setTimeout(() => {
            const account = importAccount(importPrivateKey, selectedBlockchain, newAccountName || undefined);
            if (!account) {
              reject(new Error("Failed to import account"));
              return;
            }
            resolve({ name: account.name });
          }, 500);
        }),
      {
        loading: "Importing account...",
        success: (data) => `${data.name} imported successfully!`,
        error: "Failed to import account. Please check the private key.",
      }
    );

    resetAddDialog();
  };

  const resetAddDialog = () => {
    setNewAccountName("");
    setImportPrivateKey("");
    setImportError(null);
    // Default to "import" tab if no mnemonic, otherwise "create"
    setAddDialogTab(mnemonic ? "create" : "import");
    setShowAddDialog(false);
  };

  const handleStartEdit = (account: WalletAccount) => {
    setEditingAccount(account.id);
    setEditName(account.name);
  };

  const handleSaveEdit = (accountId: string) => {
    if (editName.trim()) {
      renameAccount(accountId, editName.trim());
      toast.success(`Account renamed to "${editName.trim()}"`);
    }
    setEditingAccount(null);
    setEditName("");
  };

  // Fetch balance for a single account
  const fetchBalance = useCallback(
    async (account: WalletAccount) => {
      setBalances((prev) => ({
        ...prev,
        [account.id]: { ...prev[account.id], loading: true, error: undefined },
      }));

      let result;
      if (account.blockchain === "solana") {
        result = await getSolanaBalance(account.publicKey, network);
      } else {
        result = await getEthereumBalance(account.publicKey, network);
      }

      setBalances((prev) => ({
        ...prev,
        [account.id]: {
          balance: result.balance,
          loading: false,
          error: result.error,
        },
      }));
    },
    [network]
  );

  // Fetch all balances
  const fetchAllBalances = useCallback(async () => {
    if (accounts.length === 0) return;

    setIsRefreshingAll(true);
    toast.promise(
      async () => {
        await Promise.all(accounts.map((account) => fetchBalance(account)));
      },
      {
        loading: `Refreshing ${accounts.length} balance${accounts.length !== 1 ? "s" : ""}...`,
        success: "All balances refreshed!",
        error: "Failed to refresh some balances",
      }
    );
    setIsRefreshingAll(false);
  }, [accounts, fetchBalance]);

  // Handle network switch
  const handleNetworkSwitch = (checked: boolean) => {
    const newNetwork = checked ? "testnet" : "mainnet";
    setNetwork(newNetwork);
    toast.info(`Switched to ${newNetwork === "mainnet" ? "Mainnet" : "Testnet"}`);
  };

  // Handle remove account with toast
  const handleRemoveAccount = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    removeAccount(accountId);
    toast.success(`${account?.name || "Account"} removed`);
  };

  // Handle logout with toast
  const handleLogout = () => {
    clearWallet();
    toast.success("Wallet logged out successfully");
  };

  const solanaAccounts = accounts.filter((a) => a.blockchain === "solana");
  const ethereumAccounts = accounts.filter((a) => a.blockchain === "ethereum");
  const networkNames = getNetworkDisplayName(network);

  const mnemonicWords = mnemonic?.split(" ") || [];

  // Reset balances when network changes
  useEffect(() => {
    setBalances({});
  }, [network]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src="/nami.png" alt="MeNami" className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold font-exo2">MeNami</h1>
              <p className="text-sm text-muted-foreground">
                {accounts.length} account{accounts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </motion.div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Network Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
              <span
                className={`text-sm ${network === "testnet" ? "text-muted-foreground" : "font-medium"
                  }`}
              >
                Mainnet
              </span>
              <Switch
                checked={network === "testnet"}
                onCheckedChange={handleNetworkSwitch}
              />
              <span
                className={`text-sm ${network === "mainnet" ? "text-muted-foreground" : "font-medium"
                  }`}
              >
                Testnet
              </span>
            </div>

            {/* Refresh All Button */}
            {accounts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAllBalances}
                disabled={isRefreshingAll}
              >
                {isRefreshingAll ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Balances
              </Button>
            )}

            {mnemonic && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Key className="w-4 h-4 mr-2" />
                    Recovery Phrase
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Recovery Phrase</DialogTitle>
                    <DialogDescription>
                      Keep this phrase safe. Anyone with access can control your wallet.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyMnemonic}
                        className="gap-2"
                      >
                        {copiedMnemonic ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSecretPhrase(!showSecretPhrase)}
                      >
                        {showSecretPhrase ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Reveal
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-4 bg-muted rounded-lg">
                      {mnemonicWords.map((word, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-background rounded text-sm"
                        >
                          <span className="text-muted-foreground text-xs w-5">
                            {index + 1}.
                          </span>
                          <span className={showSecretPhrase ? "" : "blur-md select-none"}>
                            {word}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Network Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm"
        >
          <div className="flex items-center gap-2">
            <SolanaLogo className="w-4 h-4" />
            <span className="text-muted-foreground">Solana:</span>
            <span className="font-medium">{networkNames.solana}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <EthereumLogo className="w-4 h-4" />
            <span className="text-muted-foreground">Ethereum:</span>
            <span className="font-medium">{networkNames.ethereum}</span>
          </div>
        </motion.div>

        {/* Add Account Button */}
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          if (open) {
            // Set default tab based on whether mnemonic exists
            setAddDialogTab(mnemonic ? "create" : "import");
          }
          setShowAddDialog(open);
          if (!open) resetAddDialog();
        }}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button className="w-full" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add New Account
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
              <DialogDescription>
                Create a new account or import one using a private key.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={addDialogTab} onValueChange={(v) => setAddDialogTab(v as "create" | "import")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="create" className="gap-2" disabled={!mnemonic}>
                  <Plus className="w-4 h-4" />
                  Create
                </TabsTrigger>
                <TabsTrigger value="import" className="gap-2">
                  <Download className="w-4 h-4" />
                  Import
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4">
                {!mnemonic ? (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <Key className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Creating new accounts requires a recovery phrase.
                      You can only import accounts via private key.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Blockchain Selection */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={selectedBlockchain === "solana" ? "default" : "outline"}
                        onClick={() => setSelectedBlockchain("solana")}
                        className="gap-2"
                      >
                        <SolanaLogo className="w-4 h-4" />
                        Solana
                      </Button>
                      <Button
                        type="button"
                        variant={selectedBlockchain === "ethereum" ? "default" : "outline"}
                        onClick={() => setSelectedBlockchain("ethereum")}
                        className="gap-2"
                      >
                        <EthereumLogo className="w-4 h-4" />
                        Ethereum
                      </Button>
                    </div>

                    <Input
                      placeholder="Account name (optional)"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                    />

                    <Button onClick={handleAddAccount} className="w-full">
                      Create Account
                    </Button>
                  </>
                )}
              </TabsContent>

              <TabsContent value="import" className="space-y-4">
                {/* Blockchain Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={selectedBlockchain === "solana" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedBlockchain("solana");
                      setImportError(null);
                    }}
                    className="gap-2"
                  >
                    <SolanaLogo className="w-4 h-4" />
                    Solana
                  </Button>
                  <Button
                    type="button"
                    variant={selectedBlockchain === "ethereum" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedBlockchain("ethereum");
                      setImportError(null);
                    }}
                    className="gap-2"
                  >
                    <EthereumLogo className="w-4 h-4" />
                    Ethereum
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Private Key</label>
                  <Textarea
                    placeholder={
                      selectedBlockchain === "solana"
                        ? "Enter base58-encoded private key..."
                        : "Enter hex private key (with or without 0x)..."
                    }
                    value={importPrivateKey}
                    onChange={(e) => {
                      setImportPrivateKey(e.target.value);
                      setImportError(null);
                    }}
                    rows={3}
                    className="resize-none font-mono text-sm"
                  />
                </div>

                <Input
                  placeholder="Account name (optional)"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />

                {importError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-500 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {importError}
                  </motion.div>
                )}

                <Button onClick={handleImportAccount} className="w-full">
                  Import Account
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Account Lists */}
        {accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No accounts yet</h3>
            <p className="text-muted-foreground">
              Create your first account to get started
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Solana Accounts */}
            {solanaAccounts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <SolanaLogo className="w-5 h-5" />
                  <h2 className="font-semibold">Solana Accounts</h2>
                  <Badge variant="secondary">{solanaAccounts.length}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {networkNames.solana}
                  </Badge>
                </div>
                <AnimatePresence>
                  {solanaAccounts.map((account, index) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      index={index}
                      balance={balances[account.id]}
                      copiedAddress={copiedAddress}
                      showPrivateKey={showPrivateKey}
                      editingAccount={editingAccount}
                      editName={editName}
                      onCopyAddress={handleCopyAddress}
                      onShowPrivateKey={setShowPrivateKey}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onEditNameChange={setEditName}
                      onRemove={handleRemoveAccount}
                      onRefreshBalance={() => fetchBalance(account)}
                      getPrivateKey={getAccountPrivateKey}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Ethereum Accounts */}
            {ethereumAccounts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <EthereumLogo className="w-5 h-5" />
                  <h2 className="font-semibold">Ethereum Accounts</h2>
                  <Badge variant="secondary">{ethereumAccounts.length}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {networkNames.ethereum}
                  </Badge>
                </div>
                <AnimatePresence>
                  {ethereumAccounts.map((account, index) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      index={index}
                      balance={balances[account.id]}
                      copiedAddress={copiedAddress}
                      showPrivateKey={showPrivateKey}
                      editingAccount={editingAccount}
                      editName={editName}
                      onCopyAddress={handleCopyAddress}
                      onShowPrivateKey={setShowPrivateKey}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onEditNameChange={setEditName}
                      onRemove={handleRemoveAccount}
                      onRefreshBalance={() => fetchBalance(account)}
                      getPrivateKey={getAccountPrivateKey}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface AccountCardProps {
  account: WalletAccount;
  index: number;
  balance?: { balance: number; loading: boolean; error?: string };
  copiedAddress: string | null;
  showPrivateKey: string | null;
  editingAccount: string | null;
  editName: string;
  onCopyAddress: (address: string) => void;
  onShowPrivateKey: (id: string | null) => void;
  onStartEdit: (account: WalletAccount) => void;
  onSaveEdit: (id: string) => void;
  onEditNameChange: (name: string) => void;
  onRemove: (id: string) => void;
  onRefreshBalance: () => void;
  getPrivateKey: (account: WalletAccount) => string | null;
}

function AccountCard({
  account,
  index,
  balance,
  copiedAddress,
  showPrivateKey,
  editingAccount,
  editName,
  onCopyAddress,
  onShowPrivateKey,
  onStartEdit,
  onSaveEdit,
  onEditNameChange,
  onRemove,
  onRefreshBalance,
  getPrivateKey,
}: AccountCardProps) {
  const blockchainInfo = getBlockchainInfo(account.blockchain);
  const privateKey = showPrivateKey === account.id ? getPrivateKey(account) : null;

  const BlockchainIcon = account.blockchain === "solana" ? SolanaLogo : EthereumLogo;
  const symbol = account.blockchain === "solana" ? "SOL" : "ETH";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card className="overflow-hidden">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center p-2"
                style={{ backgroundColor: blockchainInfo.color + "20" }}
              >
                <BlockchainIcon className="w-6 h-6" />
              </div>
              <div>
                {editingAccount === account.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => onEditNameChange(e.target.value)}
                      className="h-8 w-40"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onSaveEdit(account.id);
                        if (e.key === "Escape") onShowPrivateKey(null);
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => onSaveEdit(account.id)}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <CardTitle className="text-base flex items-center gap-2">
                    {account.name}
                    {account.isImported && (
                      <Badge variant="outline" className="text-xs font-normal">
                        Imported
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onStartEdit(account)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </CardTitle>
                )}
                <p className="text-xs text-muted-foreground">
                  {account.isImported ? "Imported account" : account.derivationPath}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => onRemove(account.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="py-4 pt-0 space-y-3">
          {/* Balance Section */}
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              {balance?.loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : balance?.error ? (
                <span className="text-sm text-destructive">{balance.error}</span>
              ) : balance ? (
                <p className="font-semibold text-lg">
                  {formatBalance(balance.balance, symbol)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Click refresh to load</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefreshBalance}
              disabled={balance?.loading}
            >
              {balance?.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Public Address */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Public Address</p>
              <p className="font-mono text-sm truncate">{account.publicKey}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopyAddress(account.publicKey)}
            >
              {copiedAddress === account.publicKey ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Private Key Section */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                onShowPrivateKey(showPrivateKey === account.id ? null : account.id)
              }
            >
              {showPrivateKey === account.id ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Private Key
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Private Key
                </>
              )}
            </Button>

            <AnimatePresence>
              {showPrivateKey === account.id && privateKey && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-xs text-destructive mb-2 font-medium">
                      Never share your private key!
                    </p>
                    <p className="font-mono text-xs break-all">{privateKey}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
