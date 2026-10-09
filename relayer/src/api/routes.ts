import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { isAddress } from "viem";
import { decideRoute, type RouteDecision } from "../agent/router.js";
import { explainRouteDecision } from "../agent/explain.js";
import {
  submitDepositWithAuthorization,
  submitDeposit,
  submitRelease,
} from "../services/relay.js";

interface PaymentAuthorization {
  validAfter: string;
  validBefore: string;
  nonce: string;
  v: number;
  r: string;
  s: string;
}

interface PayRequestBody {
  fromChainId: number;
  toChainId: number;
  payer: string;
  recipient: string;
  amount: string;
  authorization?: PaymentAuthorization;
}

type PaymentStatus =
  | {
      id: string;
      state: "pending_deposit";
      payer: `0x${string}`;
      recipient: `0x${string}`;
      amount: string;
      fromChainId: number;
      toChainId: number;
      createdAt: number;
    }
  | {
      id: string;
      state: "deposit_confirmed";
      payer: `0x${string}`;
      recipient: `0x${string}`;
      amount: string;
      fromChainId: number;
      toChainId: number;
      createdAt: number;
      sepoliaTxHash: `0x${string}`;
    }
  | {
      id: string;
      state: "released";
      payer: `0x${string}`;
      recipient: `0x${string}`;
      amount: string;
      fromChainId: number;
      toChainId: number;
      createdAt: number;
      sepoliaTxHash: `0x${string}`;
      hskTxHash: `0x${string}`;
      explanation: string;
    }
  | {
      id: string;
      state: "failed";
      payer: `0x${string}`;
      recipient: `0x${string}`;
      amount: string;
      fromChainId: number;
      toChainId: number;
      createdAt: number;
      error: string;
    };

const paymentStatuses = new Map<string, PaymentStatus>();

function toJsonSafe(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v)));
}

function isPositiveBigint(value: string): boolean {
  try {
    return BigInt(value) > 0n;
  } catch {
    return false;
  }
}

const SUPPORTED_SOURCE_CHAIN_IDS = [11155111, 84532];

function validatePayRequest(body: Partial<PayRequestBody>): string | null {
  if (typeof body.fromChainId !== "number") return "fromChainId is required and must be a number";
  if (!SUPPORTED_SOURCE_CHAIN_IDS.includes(body.fromChainId)) {
    return "fromChainId must be one of: 11155111 (Sepolia), 84532 (Base Sepolia)";
  }
  if (typeof body.toChainId !== "number") return "toChainId is required and must be a number";
  if (typeof body.payer !== "string" || !isAddress(body.payer)) return "payer must be a valid address";
  if (typeof body.recipient !== "string" || !isAddress(body.recipient)) return "recipient must be a valid address";
  if (typeof body.amount !== "string" || !isPositiveBigint(body.amount)) {
    return "amount must be a stringified positive integer";
  }
  if (body.authorization) {
    const auth = body.authorization;
    if (
      typeof auth.validAfter !== "string" ||
      typeof auth.validBefore !== "string" ||
      typeof auth.nonce !== "string" ||
      typeof auth.v !== "number" ||
      typeof auth.r !== "string" ||
      typeof auth.s !== "string"
    ) {
      return "authorization is malformed";
    }
  }
  return null;
}

async function runDepositAndRelease(
  id: string,
  body: PayRequestBody,
  decision: RouteDecision,
): Promise<void> {
  const payer = body.payer as `0x${string}`;
  const recipient = body.recipient as `0x${string}`;
  const amount = BigInt(body.amount);
  const destChainId = BigInt(body.toChainId);

  try {
    const { txHash: sepoliaTxHash } = body.authorization
      ? await submitDepositWithAuthorization({
          payer,
          recipient,
          amount,
          destChainId,
          validAfter: BigInt(body.authorization.validAfter),
          validBefore: BigInt(body.authorization.validBefore),
          nonce: body.authorization.nonce as `0x${string}`,
          v: body.authorization.v,
          r: body.authorization.r as `0x${string}`,
          s: body.authorization.s as `0x${string}`,
          fromChainId: body.fromChainId,
        })
      : await submitDeposit({ payer, recipient, amount, destChainId, fromChainId: body.fromChainId });

    const current = paymentStatuses.get(id);
    if (current) {
      paymentStatuses.set(id, { ...current, state: "deposit_confirmed", sepoliaTxHash });
    }

    const { txHash: hskTxHash } = await submitRelease(recipient, amount, sepoliaTxHash);
    const explanation = await explainRouteDecision(decision);

    const afterDeposit = paymentStatuses.get(id);
    if (afterDeposit) {
      paymentStatuses.set(id, {
        ...afterDeposit,
        state: "released",
        sepoliaTxHash,
        hskTxHash,
        explanation,
      });
    }
  } catch (error) {
    const current = paymentStatuses.get(id);
    if (current) {
      paymentStatuses.set(id, { ...current, state: "failed", error: String(error) });
    }
  }
}

export function createApiRouter(): Router {
  const router = Router();

  router.post("/pay", (req: Request, res: Response) => {
    const body = req.body as Partial<PayRequestBody>;
    const validationError = validatePayRequest(body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const payload = body as PayRequestBody;

    void (async () => {
      try {
        const decision = await decideRoute({
          payer: payload.payer as `0x${string}`,
          recipient: payload.recipient as `0x${string}`,
          amount: BigInt(payload.amount),
          fromChainId: payload.fromChainId,
          toChainId: payload.toChainId,
        });

        if (!decision.viable) {
          res.status(422).json(toJsonSafe({ error: decision.reason, decision }));
          return;
        }

        const id = randomUUID();
        paymentStatuses.set(id, {
          id,
          state: "pending_deposit",
          payer: payload.payer as `0x${string}`,
          recipient: payload.recipient as `0x${string}`,
          amount: payload.amount,
          fromChainId: payload.fromChainId,
          toChainId: payload.toChainId,
          createdAt: Date.now(),
        });

        res.status(202).json(toJsonSafe({ id, decision }));

        void runDepositAndRelease(id, payload, decision);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    })();
  });

  router.get("/status/:id", (req: Request, res: Response) => {
    const status = paymentStatuses.get(req.params.id);
    if (!status) {
      res.status(404).json({ error: `No payment found with id ${req.params.id}` });
      return;
    }
    res.json(toJsonSafe(status));
  });

  return router;
}
