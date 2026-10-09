import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseSignature,
  toHex,
  parseUnits,
  formatUnits,
} from "viem";
import { sepolia } from "viem/chains";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const RELAYER_URL = process.env.RELAYER_API_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
const AMOUNT = parseUnits("1", 6);

interface PayResponse {
  id: string;
  decision: { viable: boolean; feeBps: number; feeAmount: string; payoutAmount: string };
}

type StatusResponse =
  | { state: "pending_deposit" }
  | { state: "deposit_confirmed"; sepoliaTxHash: string }
  | { state: "released"; sepoliaTxHash: string; hskTxHash: string; explanation: string }
  | { state: "failed"; error: string };

function timestamp(): string {
  return new Date().toISOString().split("T")[1].replace("Z", "");
}

function log(message: string): void {
  console.log(`[${timestamp()}] ${message}`);
}

async function pollStatus(id: string, timeoutMs: number): Promise<StatusResponse> {
  const deadline = Date.now() + timeoutMs;
  let lastState = "";
  while (Date.now() < deadline) {
    const res = await fetch(`${RELAYER_URL}/status/${id}`);
    const status = (await res.json()) as StatusResponse;
    if (status.state !== lastState) {
      lastState = status.state;
      log(`Status: ${status.state}`);
    }
    if (status.state === "released" || status.state === "failed") return status;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Timed out waiting for payment status to resolve");
}

async function main() {
  console.log("=".repeat(64));
  console.log("Brazen — Agent-to-Agent Settlement Demo");
  console.log("No frontend, no browser — one agent paying another directly via POST /pay");
  console.log("=".repeat(64));
  console.log("");

  const agentAPrivateKey = requireEnv("AGENT_A_PRIVATE_KEY") as `0x${string}`;
  const agentBAddress = requireEnv("AGENT_B_ADDRESS") as `0x${string}`;
  const sourceVaultAddress = requireEnv("SOURCE_VAULT_ADDRESS") as `0x${string}`;
  const usdcAddress = requireEnv("SEPOLIA_USDC_ADDRESS") as `0x${string}`;
  const rpcUrl = requireEnv("SEPOLIA_RPC_URL");

  const agentA = privateKeyToAccount(agentAPrivateKey);

  console.log(`Agent A (payer):     ${agentA.address}`);
  console.log(`Agent B (recipient): ${agentBAddress}`);
  console.log(`Amount:              ${formatUnits(AMOUNT, 6)} USDC`);
  console.log(`Relayer:             ${RELAYER_URL}`);
  console.log("");

  const client = createWalletClient({
    account: agentA,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const validAfter = 0n;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)));

  log("Agent A signing EIP-3009 transfer authorization (off-chain, no gas)...");

  const signature = await client.signTypedData({
    domain: {
      name: "USDC",
      version: "2",
      chainId: 11155111,
      verifyingContract: usdcAddress,
    },
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    message: {
      from: agentA.address,
      to: sourceVaultAddress,
      value: AMOUNT,
      validAfter,
      validBefore,
      nonce,
    },
  });

  const { v, r, s } = parseSignature(signature);

  log("Signed. POSTing to relayer's /pay endpoint...");

  const payRes = await fetch(`${RELAYER_URL}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromChainId: 11155111,
      toChainId: 133,
      payer: agentA.address,
      recipient: agentBAddress,
      amount: AMOUNT.toString(),
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

  if (payRes.status !== 202) {
    const body = await payRes.text();
    throw new Error(`POST /pay failed with ${payRes.status}: ${body}`);
  }

  const { id, decision } = (await payRes.json()) as PayResponse;
  log(`Accepted. Payment id: ${id}`);
  log(`Fee: ${formatUnits(BigInt(decision.feeAmount), 6)} USDC, payout: ${formatUnits(BigInt(decision.payoutAmount), 6)} USDC`);
  console.log("");

  const finalStatus = await pollStatus(id, 120_000);

  if (finalStatus.state === "failed") {
    throw new Error(`Round trip failed: ${finalStatus.error}`);
  }
  if (finalStatus.state !== "released") {
    throw new Error(`Unexpected terminal state: ${finalStatus.state}`);
  }

  const hskPublicClient = createPublicClient({
    transport: http(requireEnv("HSK_RPC_URL")),
  });

  const agentBBalance = (await hskPublicClient.readContract({
    address: requireEnv("HSK_TOKEN_ADDRESS") as `0x${string}`,
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
    args: [agentBAddress],
  })) as bigint;

  console.log("");
  console.log("=".repeat(64));
  console.log("Round trip complete.");
  console.log(`Sepolia deposit tx: https://sepolia.etherscan.io/tx/${finalStatus.sepoliaTxHash}`);
  console.log(`HSK release tx:     https://testnet-explorer.hsk.xyz/tx/${finalStatus.hskTxHash}`);
  console.log(`Explanation:        ${finalStatus.explanation}`);
  console.log("");
  console.log(`Agent B's balance is now ${formatUnits(agentBBalance, 6)} USDC on HSK testnet (read directly from chain).`);
  console.log("This was a real signed permit, a real on-chain deposit, and a real release —");
  console.log("recipient != payer, called with no browser involved at all.");
  console.log("=".repeat(64));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
