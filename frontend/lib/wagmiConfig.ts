import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http } from "wagmi";
import { baseSepoliaChain, hskTestnet, sepoliaChain } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Brazen",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "brazen-dev",
  ssr: true,
  chains: [sepoliaChain, baseSepoliaChain, hskTestnet],
  transports: {
    [sepoliaChain.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [baseSepoliaChain.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
    [hskTestnet.id]: http(process.env.NEXT_PUBLIC_HSK_RPC_URL),
  },
  wallets: [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet],
    },
  ],
});
