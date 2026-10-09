"use client";

import { useEffect, useRef, useState } from "react";

type SourceChain = "sepolia" | "baseSepolia";

const chainLabels: Record<SourceChain, string> = {
  sepolia: "Ethereum Sepolia",
  baseSepolia: "Base Sepolia",
};

interface ChainSelectorProps {
  selected: SourceChain;
  onChange: (chain: SourceChain) => void | Promise<void>;
  disabled?: boolean;
}

export default function ChainSelector({ selected, onChange, disabled }: ChainSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative" ref={containerRef}>
        <span className="block text-base font-medium text-ink mb-1.5">From</span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-base font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {chainLabels[selected]}
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-10 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            {(Object.keys(chainLabels) as SourceChain[]).map((chain) => (
              <button
                key={chain}
                type="button"
                onClick={() => {
                  onChange(chain);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-base font-medium transition-colors hover:bg-badge-bg hover:text-accent ${
                  chain === selected ? "text-accent" : "text-ink"
                }`}
              >
                {chainLabels[chain]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <span className="block text-base font-medium text-ink mb-1.5 opacity-60">To</span>
        <span className="inline-flex items-center rounded-full border border-border bg-badge-bg px-4 py-2.5 text-base font-medium text-ink opacity-60">
          HSK Chain Testnet
        </span>
      </div>
    </div>
  );
}
