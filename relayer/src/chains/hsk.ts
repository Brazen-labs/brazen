import { createPublicClient, createWalletClient, http, getContract, parseAbi, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import destPoolAbi from "../abi/DestPool.json" with { type: "json" };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const hskChain: Chain = {
  id: 133,
  name: "HSK Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: {
    default: { http: [requireEnv("HSK_RPC_URL")] },
  },
};

export const hskPublicClient = createPublicClient({
  chain: hskChain,
  transport: http(requireEnv("HSK_RPC_URL")),
});

export const relayerAccount = privateKeyToAccount(requireEnv("PRIVATE_KEY") as `0x${string}`);

export const hskWalletClient = createWalletClient({
  chain: hskChain,
  transport: http(requireEnv("HSK_RPC_URL")),
  account: relayerAccount,
});

export const destPoolContract = getContract({
  address: requireEnv("DEST_POOL_ADDRESS") as `0x${string}`,
  abi: destPoolAbi,
  client: { public: hskPublicClient, wallet: hskWalletClient },
});

const mockUsdcAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function mint(address, uint256)",
  "function transfer(address, uint256) returns (bool)",
  "function approve(address, uint256) returns (bool)",
]);

export const hskTokenContract = getContract({
  address: requireEnv("HSK_TOKEN_ADDRESS") as `0x${string}`,
  abi: mockUsdcAbi,
  client: { public: hskPublicClient, wallet: hskWalletClient },
});

export async function getHskGasPrice(): Promise<bigint> {
  return hskPublicClient.getGasPrice();
}
