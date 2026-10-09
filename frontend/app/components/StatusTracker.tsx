"use client";

import { useEffect, useState } from "react";

type PaymentStatus =
  | {
      id: string;
      state: "pending_deposit";
      payer: string;
      recipient: string;
      amount: string;
      fromChainId: number;
      toChainId: number;
      createdAt: number;
    }
  | {
      id: string;
      state: "deposit_confirmed";
      payer: string;
      recipient: string;
      amount: string;
      fromChainId: number;
      toChainId: number;
      createdAt: number;
      sepoliaTxHash: string;
    }
  | {
      id: string;
      state: "released";
      payer: string;
      recipient: string;
      amount: string;
      fromChainId: number;
      toChainId: number;
      createdAt: number;
      sepoliaTxHash: string;
      hskTxHash: string;
      explanation: string;
    }
  | {
      id: string;
      state: "failed";
      payer: string;
      recipient: string;
      amount: string;
      fromChainId: number;
      toChainId: number;
      createdAt: number;
      error: string;
    };

const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_API_URL;
const POLL_INTERVAL_MS = 2000;
const MAX_CONSECUTIVE_FAILURES = 3;

const SEPOLIA_EXPLORER = (hash: string) => `https://sepolia.etherscan.io/tx/${hash}`;
const HSK_EXPLORER = (hash: string) => `https://testnet-explorer.hsk.xyz/tx/${hash}`;

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
  );
}

function ElapsedTime({ createdAt }: { createdAt: number }) {
  const [elapsedMs, setElapsedMs] = useState(() => Date.now() - createdAt);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - createdAt);
    }, 250);
    return () => clearInterval(interval);
  }, [createdAt]);

  const seconds = Math.max(0, elapsedMs / 1000).toFixed(1);
  return <span>{seconds}s elapsed</span>;
}

function ExplorerLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-base font-medium text-ink transition-colors hover:border-accent hover:text-accent"
    >
      {label}
      <span aria-hidden>↗</span>
    </a>
  );
}

export default function StatusTracker({ paymentId }: { paymentId: string }) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        const res = await fetch(`${RELAYER_URL}/status/${paymentId}`);

        if (cancelled) return;

        if (res.status === 404) {
          setNotFound(true);
          if (intervalId) clearInterval(intervalId);
          return;
        }

        if (!res.ok) {
          setFailureCount((count) => count + 1);
          return;
        }

        const data = (await res.json()) as PaymentStatus;
        if (cancelled) return;

        setFailureCount(0);
        setStatus(data);

        if (data.state === "released" || data.state === "failed") {
          if (intervalId) clearInterval(intervalId);
        }
      } catch {
        if (!cancelled) {
          setFailureCount((count) => count + 1);
        }
      }
    };

    void poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentId]);

  const connectionLost = notFound || failureCount >= MAX_CONSECUTIVE_FAILURES;

  if (connectionLost && !status) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <p className="text-base font-semibold text-ink">
          {notFound ? "Unable to find this payment" : "Lost connection to relayer"}
        </p>
        <p className="mt-2 text-base text-body">
          {notFound
            ? "The relayer doesn't recognize this payment id. It may have restarted, or the id may be incorrect."
            : "We couldn't reach the relayer after several attempts. Check that it's running."}
        </p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <div className="flex items-center gap-3">
          <Spinner />
          <p className="text-base font-medium text-ink">Fetching payment status...</p>
        </div>
      </div>
    );
  }

  if (connectionLost && (status.state === "pending_deposit" || status.state === "deposit_confirmed")) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <p className="text-base font-semibold text-ink">Lost connection to relayer</p>
        <p className="mt-2 text-base text-body">
          We couldn&apos;t reach the relayer after several attempts. The last known state was &ldquo;
          {status.state}&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-badge-bg px-4 py-1.5 text-base font-medium text-accent">
          Payment Status
        </span>
        <span className="text-sm text-body">
          <ElapsedTime createdAt={status.createdAt} />
        </span>
      </div>

      {status.state === "pending_deposit" && (
        <div className="mt-6 flex items-center gap-3">
          <Spinner />
          <p className="text-base font-medium text-ink">Depositing on Sepolia...</p>
        </div>
      )}

      {status.state === "deposit_confirmed" && (
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <Spinner />
            <p className="text-base font-medium text-ink">
              Deposit confirmed. Releasing on HSK testnet...
            </p>
          </div>
          <div className="mt-4">
            <ExplorerLink href={SEPOLIA_EXPLORER(status.sepoliaTxHash)} label="View Sepolia deposit" />
          </div>
        </div>
      )}

      {status.state === "released" && (
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-badge-bg text-accent">
              ✓
            </span>
            <p className="text-base font-semibold text-ink">Bridge complete</p>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-badge-bg/40 p-4">
            <p className="text-lg leading-relaxed text-ink">{status.explanation}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <ExplorerLink href={SEPOLIA_EXPLORER(status.sepoliaTxHash)} label="View Sepolia deposit" />
            <ExplorerLink href={HSK_EXPLORER(status.hskTxHash)} label="View HSK release" />
          </div>
        </div>
      )}

      {status.state === "failed" && (
        <div className="mt-6">
          <p className="text-base font-semibold text-ink">Bridge failed</p>
          <div className="mt-3 rounded-xl border border-border bg-surface p-4">
            <p className="break-words text-base text-body">{status.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
