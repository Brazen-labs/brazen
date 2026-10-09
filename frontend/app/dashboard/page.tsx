"use client";

import { useEffect, useState } from "react";
import { createPublicClient, defineChain, formatUnits, http, type Abi } from "viem";
import { sepolia } from "viem/chains";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import sourceVaultAbiJson from "@/lib/abi/SourceVault.json";
import destPoolAbiJson from "@/lib/abi/DestPool.json";

const sourceVaultAbi = sourceVaultAbiJson as Abi;
const destPoolAbi = destPoolAbiJson as Abi;

const hskTestnet = defineChain({
  id: 133,
  name: "HSK Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_HSK_RPC_URL ?? "https://testnet.hsk.xyz"] },
  },
});

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
});

const hskClient = createPublicClient({
  chain: hskTestnet,
  transport: http(process.env.NEXT_PUBLIC_HSK_RPC_URL),
});

const sourceVaultAddress = process.env.NEXT_PUBLIC_SOURCE_VAULT_ADDRESS as `0x${string}`;
const destPoolAddress = process.env.NEXT_PUBLIC_DEST_POOL_ADDRESS as `0x${string}`;

const sepoliaExplorer = (hash: string) => `https://sepolia.etherscan.io/tx/${hash}`;
const hskExplorer = (hash: string) => `https://testnet-explorer.hsk.xyz/tx/${hash}`;

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

type ReleasedEvent = {
  transactionHash: string;
  amount: bigint;
  fee: bigint;
  sourceRef: string;
};

type BridgeRow = {
  transactionHash: string;
  payer: string;
  recipient: string;
  amount: bigint;
  release: ReleasedEvent | null;
};

export default function DashboardPage() {
  const [rows, setRows] = useState<BridgeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const [paymentRequestedLogs, releasedLogs] = await Promise.all([
          sepoliaClient.getContractEvents({
            address: sourceVaultAddress,
            abi: sourceVaultAbi,
            eventName: "PaymentRequested",
            fromBlock: "earliest",
            toBlock: "latest",
          }),
          hskClient.getContractEvents({
            address: destPoolAddress,
            abi: destPoolAbi,
            eventName: "Released",
            fromBlock: "earliest",
            toBlock: "latest",
          }),
        ]);

        const releasesBySourceRef = new Map<string, ReleasedEvent>();
        for (const log of releasedLogs) {
          const args = log.args as { amount: bigint; fee: bigint; sourceRef: string };
          releasesBySourceRef.set(args.sourceRef.toLowerCase(), {
            transactionHash: log.transactionHash,
            amount: args.amount,
            fee: args.fee,
            sourceRef: args.sourceRef,
          });
        }

        const history: BridgeRow[] = paymentRequestedLogs.map((log) => {
          const args = log.args as { payer: string; recipient: string; amount: bigint };
          return {
            transactionHash: log.transactionHash,
            payer: args.payer,
            recipient: args.recipient,
            amount: args.amount,
            release: releasesBySourceRef.get(log.transactionHash.toLowerCase()) ?? null,
          };
        });

        history.reverse();

        if (!cancelled) {
          setRows(history);
        }
      } catch {
        if (!cancelled) {
          setError("Couldn't load bridge history from chain. The RPC may be unavailable — try again shortly.");
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-surface">
      <Nav />
      <main className="flex flex-col flex-1">
        <section className="max-w-7xl w-full mx-auto px-6 md:px-8 py-12">
          <h1 className="font-sans font-bold text-4xl tracking-tight text-ink">
            Bridge History
          </h1>
          <p className="mt-2 text-lg text-body">
            Every deposit and release, read straight from Sepolia and HSK testnet — no database.
          </p>

          <div className="mt-8">
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {!error && rows === null && (
              <p className="text-body text-sm">Loading history...</p>
            )}

            {!error && rows !== null && rows.length === 0 && (
              <p className="text-body text-sm">No bridge activity yet.</p>
            )}

            {!error && rows !== null && rows.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-border text-left text-body">
                      <th className="px-4 py-3 font-medium">Payer</th>
                      <th className="px-4 py-3 font-medium">Recipient</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Sepolia</th>
                      <th className="px-4 py-3 font-medium">HSK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isSelfBridge =
                        row.payer.toLowerCase() === row.recipient.toLowerCase();

                      return (
                        <tr
                          key={row.transactionHash}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="px-4 py-3 font-mono text-ink">
                            {truncateAddress(row.payer)}
                          </td>
                          <td className="px-4 py-3 font-mono text-ink">
                            {truncateAddress(row.recipient)}
                          </td>
                          <td className="px-4 py-3">
                            {isSelfBridge ? (
                              <span className="inline-flex items-center rounded-full bg-badge-bg text-body px-3 py-1 text-xs font-medium">
                                Self-bridge
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-accent text-white px-3 py-1 text-xs font-semibold">
                                Third-party payment
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-ink">
                            {formatUnits(row.amount, 6)} USDC
                          </td>
                          <td className="px-4 py-3">
                            {row.release ? (
                              <span className="text-ink">
                                Released
                                <span className="text-body">
                                  {" "}
                                  (fee {formatUnits(row.release.fee, 6)} USDC)
                                </span>
                              </span>
                            ) : (
                              <span className="text-body">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={sepoliaExplorer(row.transactionHash)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:underline"
                            >
                              View
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            {row.release ? (
                              <a
                                href={hskExplorer(row.release.transactionHash)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-accent hover:underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-body">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
