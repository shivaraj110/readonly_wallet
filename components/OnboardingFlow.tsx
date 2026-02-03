"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateMnemonic, BlockchainType } from "@/lib/wallet";
import { Plus, Download, Key, Copy, Check, AlertCircle } from "lucide-react";
import { SolanaLogo, EthereumLogo } from "@/components/icons/BlockchainLogos";
import { toast } from "sonner";

type OnboardingTab = "create" | "import" | "privatekey";

export function OnboardingFlow() {
  const { createNewWallet, importWallet, importAccount, validatePrivateKey } = useWallet();
  const [activeTab, setActiveTab] = useState<OnboardingTab>("create");
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null);
  const [importedMnemonic, setImportedMnemonic] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Private key import state
  const [privateKey, setPrivateKey] = useState("");
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainType>("solana");
  const [accountName, setAccountName] = useState("");
  const [privateKeyError, setPrivateKeyError] = useState<string | null>(null);

  const handleGenerateMnemonic = () => {
    toast.promise(
      () =>
        new Promise<string>((resolve) => {
          setTimeout(() => {
            const mnemonic = createNewWallet();
            setGeneratedMnemonic(mnemonic);
            resolve(mnemonic);
          }, 500);
        }),
      {
        loading: "Generating secure recovery phrase...",
        success: "Wallet created successfully!",
        error: "Failed to generate wallet",
      }
    );
  };

  const handleCopyMnemonic = async () => {
    if (generatedMnemonic) {
      await navigator.clipboard.writeText(generatedMnemonic);
      setCopied(true);
      toast.success("Recovery phrase copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImportWallet = () => {
    setImportError(null);

    if (!validateMnemonic(importedMnemonic)) {
      setImportError("Invalid recovery phrase. Please check and try again.");
      toast.error("Invalid recovery phrase");
      return;
    }

    toast.promise(
      () =>
        new Promise<boolean>((resolve, reject) => {
          setTimeout(() => {
            const success = importWallet(importedMnemonic);
            if (success) {
              resolve(success);
            } else {
              reject(new Error("Import failed"));
            }
          }, 500);
        }),
      {
        loading: "Importing wallet...",
        success: "Wallet imported successfully!",
        error: "Failed to import wallet",
      }
    );
  };

  const handleImportPrivateKey = () => {
    setPrivateKeyError(null);

    if (!privateKey.trim()) {
      setPrivateKeyError("Please enter a private key.");
      return;
    }

    if (!validatePrivateKey(privateKey, selectedBlockchain)) {
      setPrivateKeyError(`Invalid ${selectedBlockchain === "solana" ? "Solana" : "Ethereum"} private key.`);
      toast.error("Invalid private key format");
      return;
    }

    toast.promise(
      () =>
        new Promise<{ name: string }>((resolve, reject) => {
          setTimeout(() => {
            const account = importAccount(privateKey, selectedBlockchain, accountName || undefined);
            if (account) {
              resolve({ name: account.name });
            } else {
              reject(new Error("Import failed"));
            }
          }, 500);
        }),
      {
        loading: "Importing account...",
        success: (data) => `${data.name} imported successfully!`,
        error: "Failed to import account",
      }
    );
  };

  const mnemonicWords = generatedMnemonic?.split(" ") || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-3"
          >
            <img src="/nami.png" alt="MeNami" className="w-20 h-20" />
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent font-exo2">
              MeNami
            </CardTitle>
          </motion.div>
          <CardDescription className="text-base mt-2">
            Create a new wallet or import an existing one
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OnboardingTab)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="create" className="gap-2">
                <Plus className="w-4 h-4" />
                Create
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2">
                <Download className="w-4 h-4" />
                Phrase
              </TabsTrigger>
              <TabsTrigger value="privatekey" className="gap-2">
                <Key className="w-4 h-4" />
                Key
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="create" key="create">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {!generatedMnemonic ? (
                    <div className="text-center space-y-4">
                      <p className="text-muted-foreground">
                        Generate a secure 12-word recovery phrase to create your new wallet.
                      </p>
                      <Button
                        onClick={handleGenerateMnemonic}
                        size="lg"
                        className="w-full"
                      >
                        Generate Recovery Phrase
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Recovery Phrase</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyMnemonic}
                          className="gap-2"
                        >
                          {copied ? (
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
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-3 gap-2 p-4 bg-muted rounded-lg"
                      >
                        {mnemonicWords.map((word, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-2 p-2 bg-background rounded text-sm"
                          >
                            <span className="text-muted-foreground text-xs w-5">
                              {index + 1}.
                            </span>
                            <span>
                              {word}
                            </span>
                          </motion.div>
                        ))}
                      </motion.div>

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          <strong>Important:</strong> Write down your recovery phrase and store it securely.
                          Anyone with access to this phrase can access your wallet.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="confirm"
                          checked={confirmed}
                          onChange={(e) => setConfirmed(e.target.checked)}
                          className="rounded cursor-pointer"
                        />
                        <label htmlFor="confirm" className="text-sm cursor-pointer">
                          I have saved my recovery phrase securely
                        </label>
                      </div>

                      <Button
                        disabled={!confirmed}
                        className="w-full"
                        size="lg"
                      >
                        Continue to Wallet
                      </Button>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="import" key="import">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <p className="text-muted-foreground text-sm">
                    Enter your 12 or 24-word recovery phrase to import your existing wallet.
                  </p>

                  <Textarea
                    placeholder="Enter your recovery phrase (words separated by spaces)..."
                    value={importedMnemonic}
                    onChange={(e) => {
                      setImportedMnemonic(e.target.value);
                      setImportError(null);
                    }}
                    rows={4}
                    className="resize-none"
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

                  <Button
                    onClick={handleImportWallet}
                    disabled={!importedMnemonic.trim()}
                    className="w-full"
                    size="lg"
                  >
                    Import Wallet
                  </Button>
                </motion.div>
              </TabsContent>

              <TabsContent value="privatekey" key="privatekey">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <p className="text-muted-foreground text-sm">
                    Import a single account using its private key.
                  </p>

                  {/* Blockchain Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Blockchain</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={selectedBlockchain === "solana" ? "default" : "outline"}
                        onClick={() => {
                          setSelectedBlockchain("solana");
                          setPrivateKeyError(null);
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
                          setPrivateKeyError(null);
                        }}
                        className="gap-2"
                      >
                        <EthereumLogo className="w-4 h-4" />
                        Ethereum
                      </Button>
                    </div>
                  </div>

                  {/* Private Key Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Private Key</label>
                    <Textarea
                      placeholder={
                        selectedBlockchain === "solana"
                          ? "Enter base58-encoded private key..."
                          : "Enter hex private key (with or without 0x)..."
                      }
                      value={privateKey}
                      onChange={(e) => {
                        setPrivateKey(e.target.value);
                        setPrivateKeyError(null);
                      }}
                      rows={3}
                      className="resize-none font-mono text-sm"
                    />
                  </div>

                  {/* Account Name (Optional) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Name (Optional)</label>
                    <Input
                      placeholder="My imported account"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>

                  {privateKeyError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-500 text-sm"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {privateKeyError}
                    </motion.div>
                  )}

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      <strong>Note:</strong> Importing via private key creates a standalone account
                      without a recovery phrase. Make sure to back up your private key separately.
                    </p>
                  </div>

                  <Button
                    onClick={handleImportPrivateKey}
                    disabled={!privateKey.trim()}
                    className="w-full"
                    size="lg"
                  >
                    Import Account
                  </Button>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
