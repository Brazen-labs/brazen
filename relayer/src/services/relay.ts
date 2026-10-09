import { sepoliaPublicClient, sourceVaultContract as sepoliaSourceVaultContract } from "../chains/sepolia.js";
import { baseSepoliaPublicClient, sourceVaultContract as baseSepoliaSourceVaultContract } from "../chains/baseSepolia.js";
import { hskPublicClient, destPoolContract } from "../chains/hsk.js";

const SEPOLIA_CHAIN_ID = 11155111;
const BASE_SEPOLIA_CHAIN_ID = 84532;

export interface DepositParams {
  payer: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  destChainId: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: `0x${string}`;
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
  fromChainId: number;
}

export async function submitDepositWithAuthorization(params: DepositParams): Promise<{ txHash: `0x${string}` }> {
  const args = [
    params.payer,
    params.recipient,
    params.amount,
    params.destChainId,
    params.validAfter,
    params.validBefore,
    params.nonce,
    params.v,
    params.r,
    params.s,
  ] as const;

  if (params.fromChainId === SEPOLIA_CHAIN_ID) {
    const hash = await sepoliaSourceVaultContract.write.depositWithAuthorization(args);
    const receipt = await sepoliaPublicClient.waitForTransactionReceipt({ hash });
    return { txHash: receipt.transactionHash };
  }
  if (params.fromChainId === BASE_SEPOLIA_CHAIN_ID) {
    const hash = await baseSepoliaSourceVaultContract.write.depositWithAuthorization(args);
    const receipt = await baseSepoliaPublicClient.waitForTransactionReceipt({ hash });
    return { txHash: receipt.transactionHash };
  }
  throw new Error(`Unsupported fromChainId: ${params.fromChainId}`);
}

export interface FallbackDepositParams {
  payer: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  destChainId: bigint;
  fromChainId: number;
}

export async function submitDeposit(params: FallbackDepositParams): Promise<{ txHash: `0x${string}` }> {
  const args = [params.payer, params.recipient, params.amount, params.destChainId] as const;

  if (params.fromChainId === SEPOLIA_CHAIN_ID) {
    const hash = await sepoliaSourceVaultContract.write.deposit(args);
    const receipt = await sepoliaPublicClient.waitForTransactionReceipt({ hash });
    return { txHash: receipt.transactionHash };
  }
  if (params.fromChainId === BASE_SEPOLIA_CHAIN_ID) {
    const hash = await baseSepoliaSourceVaultContract.write.deposit(args);
    const receipt = await baseSepoliaPublicClient.waitForTransactionReceipt({ hash });
    return { txHash: receipt.transactionHash };
  }
  throw new Error(`Unsupported fromChainId: ${params.fromChainId}`);
}

export async function submitRelease(
  recipient: `0x${string}`,
  amount: bigint,
  sourceRef: `0x${string}`,
): Promise<{ txHash: `0x${string}` }> {
  const hash = await destPoolContract.write.release([recipient, amount, sourceRef]);
  const receipt = await hskPublicClient.waitForTransactionReceipt({ hash });
  return { txHash: receipt.transactionHash };
}
