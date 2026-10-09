import Anthropic from "@anthropic-ai/sdk";
import { formatUnits } from "viem";
import type { RouteDecision } from "./router.js";

const EXPLAIN_MODEL = "claude-haiku-4-5";
const EXPLAIN_TIMEOUT_MS = 5000;
const DEFAULT_TOKEN_DECIMALS = 6;
const DEFAULT_TOKEN_SYMBOL = "USDC";

interface ExplainContext {
  tokenSymbol?: string;
  tokenDecimals?: number;
}

const REJECTION_MESSAGES: Record<string, string> = {
  InsufficientLiquidity:
    "Bridge unavailable right now — the destination pool doesn't have enough liquidity for this amount.",
  PoolPaused: "Bridging is temporarily paused.",
  ZeroAmount: "This payment amount is too small to bridge.",
  ZeroRecipient: "A valid recipient address is required to bridge.",
};

function explainRejection(reason: string | undefined): string {
  if (reason && REJECTION_MESSAGES[reason]) {
    return REJECTION_MESSAGES[reason];
  }
  return "Bridge unavailable right now — this payment can't be routed.";
}

function templatedStatus(decision: RouteDecision, tokenSymbol: string, tokenDecimals: number): string {
  const feeDisplay = formatUnits(decision.feeAmount, tokenDecimals);
  return `Bridged via HSK testnet · fee ${feeDisplay} ${tokenSymbol} · ${decision.estimatedSeconds}s`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("explain timeout")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function generateLlmSummary(
  decision: RouteDecision,
  tokenSymbol: string,
  tokenDecimals: number,
): Promise<string> {
  const client = new Anthropic();
  const feeDisplay = formatUnits(decision.feeAmount, tokenDecimals);
  const payoutDisplay = formatUnits(decision.payoutAmount, tokenDecimals);

  const response = await withTimeout(
    client.messages.create({
      model: EXPLAIN_MODEL,
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content:
            "Write one short, natural sentence for a UI status message summarizing a completed cross-chain bridge payment. " +
            "Use only these facts, do not invent anything: " +
            `bridged via HSK testnet, fee ${feeDisplay} ${tokenSymbol}, payout ${payoutDisplay} ${tokenSymbol}, ` +
            `estimated time ${decision.estimatedSeconds} seconds. ` +
            "Style example: 'Routed via HSK testnet, gas cost ~$0.02, fee 0.5 USDC, done in 8s.' " +
            "Respond with only the sentence, no preamble or quotes.",
        },
      ],
    }),
    EXPLAIN_TIMEOUT_MS,
  );

  const textBlock = response.content.find((block) => block.type === "text");
  const text = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
  if (!text) {
    throw new Error("empty LLM response");
  }
  return text;
}

export async function explainRouteDecision(
  decision: RouteDecision,
  context?: ExplainContext,
): Promise<string> {
  if (!decision.viable) {
    return explainRejection(decision.reason);
  }

  const tokenSymbol = context?.tokenSymbol ?? DEFAULT_TOKEN_SYMBOL;
  const tokenDecimals = context?.tokenDecimals ?? DEFAULT_TOKEN_DECIMALS;

  if (!process.env.ANTHROPIC_API_KEY) {
    return templatedStatus(decision, tokenSymbol, tokenDecimals);
  }

  try {
    return await generateLlmSummary(decision, tokenSymbol, tokenDecimals);
  } catch {
    return templatedStatus(decision, tokenSymbol, tokenDecimals);
  }
}
