import type { Metadata } from "next";
import { Geist, Geist_Mono, Exo_2 } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MeNami",
  description: "A readonly Web3 wallet supporting Solana and Ethereum - Eye of Nami",
  openGraph: {
    title: "MeNami",
    description: "A readonly Web3 wallet supporting Solana and Ethereum - Eye of Nami",
    images: [
      {
        url: "https://1d6kykqofq.ufs.sh/f/fVvo0hHNtQOLp4oL75c3WQFiakIJZyPnlNVCv1ORzeXs5MEq",
        width: 1200,
        height: 630,
        alt: "MeNami - Web3 Wallet",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MeNami",
    description: "A readonly Web3 wallet supporting Solana and Ethereum - Eye of Nami",
    images: ["https://1d6kykqofq.ufs.sh/f/fVvo0hHNtQOLp4oL75c3WQFiakIJZyPnlNVCv1ORzeXs5MEq"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${exo2.variable} antialiased`}
      >
        <WalletProvider>{children}</WalletProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
