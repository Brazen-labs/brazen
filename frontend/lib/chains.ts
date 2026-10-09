import { defineChain } from "viem";
import { baseSepolia, sepolia } from "wagmi/chains";

export const sepoliaChain = sepolia;

export const baseSepoliaChain = baseSepolia;

export const hskTestnet = defineChain({
  id: 133,
  name: "HSK Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_HSK_RPC_URL ?? "https://testnet.hsk.xyz"],
    },
  },
  blockExplorers: {
    default: { name: "HSK Explorer", url: "https://testnet-explorer.hsk.xyz" },
  },
});
