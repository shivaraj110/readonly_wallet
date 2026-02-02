import {
  generateMnemonic as bip39Generate,
  mnemonicToSeedSync as bip39ToSeed,
} from "bip39";
import { derivePath } from "ed25519-hd-key";
import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
export const generateMnemonic = () => {
  try {
    return bip39Generate();
  } catch (error) {
    throw new Error(`Failed to generate mnemonic`);
  }
};

export const mnemonicToSeedSync = (mnemonic: string) => {
  if (!mnemonic || typeof mnemonic !== "string") {
    throw new Error("Invalid mnemonic provided");
  }
  try {
    return bip39ToSeed(mnemonic);
  } catch (error) {
    throw new Error(`Failed to convert mnemonic to seed:`);
  }
};

const mnemonic = generateMnemonic();
const seed = mnemonicToSeedSync(mnemonic);
for (let i = 0; i < 4; i++) {
  const path = `m/44'/501'/${i}'/0'`; // This is the derivation path
  const derivedSeed = derivePath(path, seed.toString("hex")).key;
  const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
  console.log(Keypair.fromSecretKey(secret).publicKey.toBase58());
  console.log("Private Key (base58):", bs58.encode(secret));
}
