"use client";
import { generateMnemonic } from "bip39";
import { useState } from "react";

export default function Home() {
  const [passPhrase, setPassPhrase] = useState<string[]>([]);
  const generatePassPhrase = () => {
    const mnemonic = generateMnemonic();
    setPassPhrase(mnemonic.split(" "));
    console.log(mnemonic.split(" "));
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      Wallet69
      <button onClick={generatePassPhrase}>Generate Passphrase</button>
      <div className="w-50">
        {passPhrase.map((word) => (
          <li className="mx-2">{word}</li>
        ))}
      </div>
    </div>
  );
}
