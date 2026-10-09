"use client";

import { useMemo, useState } from "react";
import {
  formatUnits,
  isAddress,
  parseSignature,
  parseUnits,
  toHex,
  type Address,
} from "viem";
import {
  useAccount,
  useReadContract,
  useSignTypedData,
  useSwitchChain,
} from "wagmi";
import type { Chain } from "viem";
import { baseSepoliaChain, hskTestnet, sepoliaChain } from "@/lib/chains";
import ChainSelector from "./ChainSelector";

const RELAYER_API_URL = process.env.NEXT_PUBLIC_RELAYER_API_URL;

const HSK_CHAIN_ID = 133;
const USDC_DECIMALS = 6;
const BRIDGE_FEE_BPS = BigInt(50);
const HSK_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_HSK_TOKEN_ADDRESS as Address;

type SourceChain = "sepolia" | "baseSepolia";

const sourceChainConfig: Record<
  SourceChain,
  {
    chainId: number;
    displayName: string;
    chain: Chain;
    sourceVaultAddress: Address;
    usdcAddress: Address;
  }
> = {
  sepolia: {
    chainId: 11155111,
    displayName: "Ethereum Sepolia",
    chain: sepoliaChain,
    sourceVaultAddress: process.env
      .NEXT_PUBLIC_SOURCE_VAULT_ADDRESS as Address,
    usdcAddress: process.env.NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS as Address,
  },
  baseSepolia: {
    chainId: 84532,
    displayName: "Base Sepolia",
    chain: baseSepoliaChain,
    sourceVaultAddress: process.env
      .NEXT_PUBLIC_BASE_SEPOLIA_SOURCE_VAULT_ADDRESS as Address,
    usdcAddress: process.env
      .NEXT_PUBLIC_BASE_SEPOLIA_USDC_ADDRESS as Address,
  },
};

const erc20NameAbi = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

const transferWithAuthorizationTypes = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

type SubmitPhase = "idle" | "signing" | "submitting";

interface BridgeWidgetProps {
  onSubmitted?: (paymentId: string) => void;
}

export default function BridgeWidget({ onSubmitted }: BridgeWidgetProps) {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { signTypedDataAsync, error: signError, reset: resetSignError } =
    useSignTypedData();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();

  const [amount, setAmount] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipientTouched, setRecipientTouched] = useState(false);
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [sourceChain, setSourceChain] = useState<SourceChain>("baseSepolia");

  const {
    chainId: ACTIVE_CHAIN_ID,
    displayName: sourceChainDisplayName,
    chain: activeChain,
    sourceVaultAddress: SOURCE_VAULT_ADDRESS,
    usdcAddress: USDC_ADDRESS,
  } = sourceChainConfig[sourceChain];

  async function handleChainChange(next: SourceChain) {
    setFormError(null);
    setSourceChain(next);

    if (!isConnected) return;

    const targetChainId = sourceChainConfig[next].chainId;
    if (walletChainId === targetChainId) return;

    try {
      await switchChainAsync({ chainId: targetChainId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to switch network.";
      setFormError(
        message.toLowerCase().includes("user rejected")
          ? "Network switch was declined in your wallet."
          : `Couldn't switch to ${sourceChainConfig[next].displayName}: ${message}`,
      );
    }
  }

  const recipient = recipientTouched ? recipientInput : address ?? "";

  const { data: tokenName } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20NameAbi,
    functionName: "name",
    chainId: activeChain.id,
    query: { enabled: Boolean(USDC_ADDRESS) },
  });

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: [
      {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "uint256" }],
      },
    ] as const,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: activeChain.id,
    query: { enabled: Boolean(address && USDC_ADDRESS) },
  });

  const { data: hskBalance } = useReadContract({
    address: HSK_TOKEN_ADDRESS,
    abi: [
      {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "uint256" }],
      },
    ] as const,
    functionName: "balanceOf",
    args: recipient && isAddress(recipient) ? [recipient] : undefined,
    chainId: hskTestnet.id,
    query: { enabled: Boolean(recipient && isAddress(recipient) && HSK_TOKEN_ADDRESS) },
  });

  const amountBaseUnits = useMemo(() => {
    if (!amount) return null;
    try {
      const parsed = parseUnits(amount, USDC_DECIMALS);
      return parsed > BigInt(0) ? parsed : null;
    } catch {
      return null;
    }
  }, [amount]);

  const feeBaseUnits =
    amountBaseUnits !== null ? (amountBaseUnits * BRIDGE_FEE_BPS) / BigInt(10_000) : null;
  const payoutBaseUnits =
    amountBaseUnits !== null && feeBaseUnits !== null
      ? amountBaseUnits - feeBaseUnits
      : null;

  const recipientIsValid = recipient.length > 0 && isAddress(recipient);
  const insufficientBalance =
    balance !== undefined && amountBaseUnits !== null
      ? amountBaseUnits > balance
      : false;

  const isBusy = phase !== "idle";
  const walletOnWrongChain = isConnected && walletChainId !== ACTIVE_CHAIN_ID;

  const canSubmit =
    isConnected &&
    Boolean(address) &&
    amountBaseUnits !== null &&
    recipientIsValid &&
    !insufficientBalance &&
    !isBusy &&
    !isSwitchingChain &&
    !walletOnWrongChain;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    resetSignError();

    if (!address) {
      setFormError("Connect your wallet to bridge.");
      return;
    }
    if (walletChainId !== ACTIVE_CHAIN_ID) {
      try {
        await switchChainAsync({ chainId: ACTIVE_CHAIN_ID });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to switch network.";
        setFormError(
          message.toLowerCase().includes("user rejected")
            ? "Network switch was declined in your wallet."
            : `Your wallet is on the wrong network. Switch to ${sourceChainDisplayName} to continue.`,
        );
        return;
      }
    }
    if (amountBaseUnits === null) {
      setFormError("Enter a valid amount greater than 0.");
      return;
    }
    if (!recipientIsValid) {
      setFormError("Enter a valid recipient address.");
      return;
    }
    if (insufficientBalance) {
      setFormError("Amount exceeds your USDC balance.");
      return;
    }
    if (!SOURCE_VAULT_ADDRESS || !USDC_ADDRESS) {
      setFormError("Bridge is misconfigured: missing contract addresses.");
      return;
    }

    const validAfter = BigInt(0);
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)));

    try {
      setPhase("signing");

      const signature = await signTypedDataAsync({
        domain: {
          name: (tokenName as string | undefined) ?? "USDC",
          version: "2",
          chainId: ACTIVE_CHAIN_ID,
          verifyingContract: USDC_ADDRESS,
        },
        types: transferWithAuthorizationTypes,
        primaryType: "TransferWithAuthorization",
        message: {
          from: address,
          to: SOURCE_VAULT_ADDRESS,
          value: amountBaseUnits,
          validAfter,
          validBefore,
          nonce,
        },
      });

      const { v, r, s } = parseSignature(signature);

      setPhase("submitting");

      const response = await fetch(`${RELAYER_API_URL}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromChainId: ACTIVE_CHAIN_ID,
          toChainId: HSK_CHAIN_ID,
          payer: address,
          recipient,
          amount: amountBaseUnits.toString(),
          authorization: {
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce,
            v: Number(v),
            r,
            s,
          },
        }),
      });

      if (response.status !== 202) {
        let message = `Relayer rejected the request (${response.status}).`;
        try {
          const body = await response.json();
          if (body?.error || body?.message) {
            message = body.error ?? body.message;
          }
        } catch {}
        setFormError(message);
        setPhase("idle");
        return;
      }

      const body = await response.json();
      setPhase("idle");
      setAmount("");
      onSubmitted?.(body.id);
    } catch (err) {
      setPhase("idle");
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      if (message.toLowerCase().includes("user rejected")) {
        setFormError("Signature request was declined in your wallet.");
      } else {
        setFormError(message);
      }
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm">
      <h2 className="text-2xl font-bold tracking-tight text-ink">
        Bridge USDC to HSK Testnet
      </h2>
      <p className="mt-1 text-base text-body">
        Sign a free permit, no gas required. The relayer handles the rest.
      </p>

      <div className="mt-6">
        <ChainSelector
          selected={sourceChain}
          onChange={handleChainChange}
          disabled={isSwitchingChain || isBusy}
        />
        {isSwitchingChain && (
          <p className="mt-2 text-sm text-body">
            Switching wallet network to {sourceChainDisplayName}...
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="amount"
              className="block text-base font-medium text-ink"
            >
              Amount (USDC)
            </label>
            {balance !== undefined && (
              <button
                type="button"
                onClick={() =>
                  setAmount(formatUnits(balance as bigint, USDC_DECIMALS))
                }
                disabled={!isConnected || isBusy}
                className="text-sm font-medium text-body hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Balance:{" "}
                {(Number(balance) / 10 ** USDC_DECIMALS).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 6 },
                )}{" "}
                USDC
              </button>
            )}
          </div>
          <div className="relative mt-1.5">
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="10.0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={!isConnected || isBusy}
              className="w-full rounded-xl border border-border px-4 py-3 pr-16 text-base text-ink outline-none focus:border-accent disabled:bg-gray-50 disabled:text-body"
            />
            {balance !== undefined && (
              <button
                type="button"
                onClick={() =>
                  setAmount(formatUnits(balance as bigint, USDC_DECIMALS))
                }
                disabled={!isConnected || isBusy}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-badge-bg px-2.5 py-1 text-sm font-medium text-accent hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Max
              </button>
            )}
          </div>
          {insufficientBalance && (
            <p className="mt-1.5 text-sm font-medium text-accent">
              Amount exceeds your USDC balance.
            </p>
          )}
        </div>

        {amountBaseUnits !== null && payoutBaseUnits !== null && feeBaseUnits !== null && (
          <div className="rounded-xl bg-badge-bg px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-medium text-ink">
                You&apos;ll receive
              </span>
              <span className="text-base font-semibold text-ink">
                {formatUnits(payoutBaseUnits, USDC_DECIMALS)} USDC
              </span>
            </div>
            <p className="mt-1 text-sm text-body">
              on HSK Chain Testnet · Bridge fee:{" "}
              {formatUnits(feeBaseUnits, USDC_DECIMALS)} USDC
            </p>
            {hskBalance !== undefined && (
              <p className="mt-1 text-sm text-body">
                Current balance on HSK:{" "}
                {(Number(hskBalance) / 10 ** USDC_DECIMALS).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 6 },
                )}{" "}
                USDC
              </p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="recipient"
            className="block text-base font-medium text-ink"
          >
            Recipient (on HSK testnet)
          </label>
          <input
            id="recipient"
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(event) => {
              setRecipientTouched(true);
              setRecipientInput(event.target.value);
            }}
            disabled={!isConnected || isBusy}
            className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 font-mono text-base text-ink outline-none focus:border-accent disabled:bg-gray-50 disabled:text-body"
          />
          <p className="mt-1.5 text-sm text-body">
            Defaults to your wallet — change this to send to someone else&apos;s
            wallet on HSK testnet.
          </p>
          {recipient.length > 0 && !recipientIsValid && (
            <p className="mt-1.5 text-sm font-medium text-accent">
              Enter a valid address.
            </p>
          )}
        </div>

        {!isConnected && (
          <p className="rounded-xl bg-badge-bg px-4 py-3 text-base font-medium text-accent">
            Connect your wallet to bridge.
          </p>
        )}

        {isConnected && walletOnWrongChain && !isSwitchingChain && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-badge-bg px-4 py-3">
            <p className="text-base font-medium text-accent">
              Your wallet is on the wrong network.
            </p>
            <button
              type="button"
              onClick={() => handleChainChange(sourceChain)}
              className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Switch to {sourceChainDisplayName}
            </button>
          </div>
        )}

        {(formError || signError) && (
          <p className="rounded-xl bg-badge-bg px-4 py-3 text-base font-medium text-accent">
            {formError ?? signError?.message}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-1 w-full rounded-full bg-accent px-6 py-3.5 text-lg font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {phase === "signing"
            ? "Waiting for signature..."
            : phase === "submitting"
              ? "Submitting to relayer..."
              : "Bridge Now"}
        </button>
      </form>
    </div>
  );
}
