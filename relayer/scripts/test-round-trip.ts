import "dotenv/config";
import { formatUnits } from "viem";

const API_BASE = `http://localhost:${process.env.PORT ?? 3001}`;
const AMOUNT = 1_000_000n;

interface PayResponse {
  id: string;
  decision: {
    viable: boolean;
    feeBps: number;
    feeAmount: string;
    payoutAmount: string;
  };
}

type StatusResponse =
  | { state: "pending_deposit" }
  | { state: "deposit_confirmed"; sepoliaTxHash: string }
  | { state: "released"; sepoliaTxHash: string; hskTxHash: string; explanation: string }
  | { state: "failed"; error: string };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

async function pollStatus(id: string, timeoutMs: number): Promise<StatusResponse> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${API_BASE}/status/${id}`);
    const status = (await res.json()) as StatusResponse;
    if (status.state === "released" || status.state === "failed") return status;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Timed out waiting for payment status to resolve");
}

async function main() {
  const payer = requireEnv("SEPOLIA_RELAYER_TEST_PAYER");
  const recipient = requireEnv("AGENT_B_ADDRESS");

  console.log(`Payer:     ${payer}`);
  console.log(`Recipient: ${recipient} (different wallet — agent-to-agent case)`);
  console.log(`Amount:    ${formatUnits(AMOUNT, 6)} USDC`);

  const payRes = await fetch(`${API_BASE}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromChainId: 11155111,
      toChainId: 133,
      payer,
      recipient,
      amount: AMOUNT.toString(),
    }),
  });

  if (payRes.status !== 202) {
    const body = await payRes.text();
    throw new Error(`POST /pay failed with ${payRes.status}: ${body}`);
  }

  const { id, decision } = (await payRes.json()) as PayResponse;
  console.log(`Payment id: ${id}`);
  console.log(`Fee: ${formatUnits(BigInt(decision.feeAmount), 6)} USDC, payout: ${formatUnits(BigInt(decision.payoutAmount), 6)} USDC`);

  const finalStatus = await pollStatus(id, 120_000);

  if (finalStatus.state === "failed") {
    throw new Error(`Round trip failed: ${finalStatus.error}`);
  }
  if (finalStatus.state !== "released") {
    throw new Error(`Unexpected terminal state: ${finalStatus.state}`);
  }

  console.log("");
  console.log("Round trip complete.");
  console.log(`Sepolia deposit tx: https://sepolia.etherscan.io/tx/${finalStatus.sepoliaTxHash}`);
  console.log(`HSK release tx:     https://testnet-explorer.hsk.xyz/tx/${finalStatus.hskTxHash}`);
  console.log(`Explanation: ${finalStatus.explanation}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
