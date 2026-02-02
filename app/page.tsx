"use client";

import { useWallet } from "@/contexts/WalletContext";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { WalletDashboard } from "@/components/WalletDashboard";
import { motion } from "motion/react";

export default function Home() {
  const { isInitialized, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="text-muted-foreground">Loading wallet...</p>
        </motion.div>
      </div>
    );
  }

  if (!isInitialized) {
    return <OnboardingFlow />;
  }

  return <WalletDashboard />;
}
