import { hskTokenContract } from "../chains/hsk.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export async function getDestPoolLiquidity(): Promise<bigint> {
  const destPoolAddress = requireEnv("DEST_POOL_ADDRESS") as `0x${string}`;
  return hskTokenContract.read.balanceOf([destPoolAddress]) as Promise<bigint>;
}

export async function hasSufficientLiquidity(payoutAmount: bigint): Promise<boolean> {
  const liquidity = await getDestPoolLiquidity();
  return liquidity >= payoutAmount;
}
