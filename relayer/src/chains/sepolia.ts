import { createPublicClient, createWalletClient, http, getContract, parseAbi } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import sourceVaultAbi from "../abi/SourceVault.json" with { type: "json" };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const sepoliaChain = sepolia;

export const sepoliaPublicClient = createPublicClient({
  chain: sepoliaChain,
  transport: http(requireEnv("SEPOLIA_RPC_URL")),
});

export const relayerAccount = privateKeyToAccount(requireEnv("PRIVATE_KEY") as `0x${string}`);

export const sepoliaWalletClient = createWalletClient({
  chain: sepoliaChain,
  transport: http(requireEnv("SEPOLIA_RPC_URL")),
  account: relayerAccount,
});

export const sourceVaultContract = getContract({
  address: requireEnv("SOURCE_VAULT_ADDRESS") as `0x${string}`,
  abi: sourceVaultAbi,
  client: { public: sepoliaPublicClient, wallet: sepoliaWalletClient },
});

const erc20ReadAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address, uint256) returns (bool)",
  "function approve(address, uint256) returns (bool)",
]);

export const sepoliaUsdcContract = getContract({
  address: requireEnv("SEPOLIA_USDC_ADDRESS") as `0x${string}`,
  abi: erc20ReadAbi,
  client: { public: sepoliaPublicClient, wallet: sepoliaWalletClient },
});

export async function getSepoliaGasPrice(): Promise<bigint> {
  return sepoliaPublicClient.getGasPrice();
}
