import type { PublicClient } from "viem";
import sourceVaultAbi from "../abi/SourceVault.json" with { type: "json" };
import destPoolAbi from "../abi/DestPool.json" with { type: "json" };
import { sepoliaPublicClient } from "../chains/sepolia.js";
import { baseSepoliaPublicClient } from "../chains/baseSepolia.js";
import { hskPublicClient } from "../chains/hsk.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export interface PaymentRequestedEvent {
  payer: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  destChainId: bigint;
  nonce: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

function watchPaymentRequestedOn(
  publicClient: PublicClient<any, any>,
  sourceVaultAddress: `0x${string}`,
  onEvent: (event: PaymentRequestedEvent) => void,
): () => void {
  return publicClient.watchContractEvent({
    address: sourceVaultAddress,
    abi: sourceVaultAbi,
    eventName: "PaymentRequested",
    onLogs: (logs) => {
      for (const log of logs) {
        const { args, blockNumber, transactionHash } = log as unknown as {
          args: { payer: `0x${string}`; recipient: `0x${string}`; amount: bigint; destChainId: bigint; nonce: bigint };
          blockNumber: bigint;
          transactionHash: `0x${string}`;
        };
        onEvent({
          payer: args.payer,
          recipient: args.recipient,
          amount: args.amount,
          destChainId: args.destChainId,
          nonce: args.nonce,
          blockNumber,
          transactionHash,
        });
      }
    },
  });
}

export function watchPaymentRequested(onEvent: (event: PaymentRequestedEvent) => void): () => void {
  const sourceVaultAddress = requireEnv("SOURCE_VAULT_ADDRESS") as `0x${string}`;
  return watchPaymentRequestedOn(sepoliaPublicClient, sourceVaultAddress, onEvent);
}

export function watchBaseSepoliaPaymentRequested(onEvent: (event: PaymentRequestedEvent) => void): () => void {
  const sourceVaultAddress = requireEnv("BASE_SEPOLIA_SOURCE_VAULT_ADDRESS") as `0x${string}`;
  return watchPaymentRequestedOn(baseSepoliaPublicClient, sourceVaultAddress, onEvent);
}

export interface ReleasedEvent {
  recipient: `0x${string}`;
  amount: bigint;
  fee: bigint;
  sourceRef: `0x${string}`;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export function watchReleased(onEvent: (event: ReleasedEvent) => void): () => void {
  const destPoolAddress = requireEnv("DEST_POOL_ADDRESS") as `0x${string}`;
  return hskPublicClient.watchContractEvent({
    address: destPoolAddress,
    abi: destPoolAbi,
    eventName: "Released",
    onLogs: (logs) => {
      for (const log of logs) {
        const { args, blockNumber, transactionHash } = log as unknown as {
          args: { recipient: `0x${string}`; amount: bigint; fee: bigint; sourceRef: `0x${string}` };
          blockNumber: bigint;
          transactionHash: `0x${string}`;
        };
        onEvent({
          recipient: args.recipient,
          amount: args.amount,
          fee: args.fee,
          sourceRef: args.sourceRef,
          blockNumber,
          transactionHash,
        });
      }
    },
  });
}
