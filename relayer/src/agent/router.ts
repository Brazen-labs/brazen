import { getSepoliaGasPrice } from "../chains/sepolia.js";
import { getBaseSepoliaGasPrice } from "../chains/baseSepolia.js";
import { destPoolContract, hskTokenContract, getHskGasPrice } from "../chains/hsk.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ESTIMATED_RELEASE_SECONDS = 10;

const SEPOLIA_CHAIN_ID = 11155111;
const BASE_SEPOLIA_CHAIN_ID = 84532;
const HSK_CHAIN_ID = 133;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export interface PaymentRequest {
  payer: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  fromChainId: number;
  toChainId: number;
}

export interface RouteDecision {
  viable: boolean;
  reason?: string;
  feeBps: number;
  feeAmount: bigint;
  payoutAmount: bigint;
  sourceChainGasPriceWei: bigint;
  hskGasPriceWei: bigint;
  destPoolBalance: bigint;
  destPoolPaused: boolean;
  estimatedSeconds: number;
}

function emptyDecision(overrides: Partial<RouteDecision> & { reason: string }): RouteDecision {
  return {
    viable: false,
    feeBps: 0,
    feeAmount: 0n,
    payoutAmount: 0n,
    sourceChainGasPriceWei: 0n,
    hskGasPriceWei: 0n,
    destPoolBalance: 0n,
    destPoolPaused: false,
    estimatedSeconds: 0,
    ...overrides,
  };
}

export function computeFee(amount: bigint, feeBps: bigint): { feeAmount: bigint; payoutAmount: bigint } {
  const feeAmount = (amount * feeBps) / 10_000n;
  const payoutAmount = amount - feeAmount;
  return { feeAmount, payoutAmount };
}

function getSourceChainGasPrice(fromChainId: number): Promise<bigint> {
  if (fromChainId === SEPOLIA_CHAIN_ID) return getSepoliaGasPrice();
  return getBaseSepoliaGasPrice();
}

export async function decideRoute(request: PaymentRequest): Promise<RouteDecision> {
  if (request.fromChainId !== SEPOLIA_CHAIN_ID && request.fromChainId !== BASE_SEPOLIA_CHAIN_ID) {
    return emptyDecision({ reason: "UnsupportedSourceChain" });
  }

  if (request.toChainId !== HSK_CHAIN_ID) {
    return emptyDecision({ reason: "UnsupportedDestChain" });
  }

  if (request.amount <= 0n) {
    return emptyDecision({ reason: "ZeroAmount" });
  }

  if (request.recipient.toLowerCase() === ZERO_ADDRESS) {
    return emptyDecision({ reason: "ZeroRecipient" });
  }

  const destPoolPaused = (await destPoolContract.read.paused()) as boolean;
  if (destPoolPaused) {
    return emptyDecision({ reason: "PoolPaused", destPoolPaused: true });
  }

  const feeBpsRaw = (await destPoolContract.read.feeBps()) as bigint;
  const feeBps = Number(feeBpsRaw);
  const { feeAmount, payoutAmount } = computeFee(request.amount, feeBpsRaw);

  const destPoolAddress = requireEnv("DEST_POOL_ADDRESS") as `0x${string}`;
  const destPoolBalance = (await hskTokenContract.read.balanceOf([destPoolAddress])) as bigint;

  const [sourceChainGasPriceWei, hskGasPriceWei] = await Promise.all([
    getSourceChainGasPrice(request.fromChainId),
    getHskGasPrice(),
  ]);

  if (destPoolBalance < payoutAmount) {
    return {
      viable: false,
      reason: "InsufficientLiquidity",
      feeBps,
      feeAmount,
      payoutAmount,
      sourceChainGasPriceWei,
      hskGasPriceWei,
      destPoolBalance,
      destPoolPaused,
      estimatedSeconds: 0,
    };
  }

  return {
    viable: true,
    feeBps,
    feeAmount,
    payoutAmount,
    sourceChainGasPriceWei,
    hskGasPriceWei,
    destPoolBalance,
    destPoolPaused,
    estimatedSeconds: ESTIMATED_RELEASE_SECONDS,
  };
}
