export default function PhoneMockupStack() {
  return (
    <div className="relative mx-auto mt-16 md:mt-20 h-[380px] sm:h-[440px] md:h-[520px] w-full max-w-md sm:max-w-lg md:max-w-2xl">
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 -rotate-6 sm:-rotate-12 -translate-x-[calc(50%+90px)] sm:-translate-x-[calc(50%+130px)]">
        <div className="w-40 sm:w-56 aspect-[9/19] rounded-[2rem] sm:rounded-[2.5rem] border-4 sm:border-8 border-ink bg-ink shadow-lg overflow-hidden">
          <div className="flex h-full flex-col bg-surface">
            <div className="flex items-center justify-between px-3 pt-4 pb-2">
              <span className="text-[10px] font-semibold text-ink">Brazen</span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </div>
            <div className="flex-1 px-3 pb-4">
              <p className="text-[9px] text-body">Bridge USDC to HSK Testnet</p>
              <p className="mt-0.5 text-[11px] font-semibold text-ink">
                Sign once, no gas required
              </p>
              <div className="mt-3 rounded-xl border border-border bg-white p-2.5">
                <p className="text-[8px] text-body">Amount (USDC)</p>
                <p className="text-sm font-bold text-ink">1.0 USDC</p>
              </div>
              <div className="mt-2 rounded-xl border border-border bg-white p-2.5">
                <p className="text-[8px] text-body">Recipient (on HSK testnet)</p>
                <p className="truncate text-[9px] font-mono text-ink">0xf611...F8B9</p>
              </div>
              <div className="mt-3 rounded-lg bg-accent py-1.5 text-center text-[9px] font-semibold text-white">
                Bridge Now
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rotate-6 sm:rotate-12 translate-x-[calc(-50%+90px)] sm:translate-x-[calc(-50%+130px)]">
        <div className="w-40 sm:w-56 aspect-[9/19] rounded-[2rem] sm:rounded-[2.5rem] border-4 sm:border-8 border-ink bg-ink shadow-lg overflow-hidden">
          <div className="flex h-full flex-col bg-ink text-white">
            <div className="flex items-center justify-between px-3 pt-4 pb-2">
              <span className="text-[10px] font-semibold">Brazen</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px]">
                &#10003;
              </span>
            </div>
            <div className="flex-1 px-3 pb-4">
              <p className="text-[9px] text-white/60">Received</p>
              <p className="mt-0.5 text-base font-bold text-accent">
                0.995 USDC
              </p>
              <div className="mt-3 flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-[8px] text-white/60">Fee (0.5%)</span>
                <span className="text-[9px] font-medium">0.005 USDC</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-[8px] text-white/60">Gas paid by</span>
                <span className="text-[9px] font-medium text-accent">
                  Brazen
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between rounded-lg border border-white/15 px-2 py-1.5">
                  <span className="text-[8px] text-white/70">
                    Sepolia Explorer
                  </span>
                  <span className="text-[9px] text-accent">View</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/15 px-2 py-1.5">
                  <span className="text-[8px] text-white/70">
                    HSK Testnet Explorer
                  </span>
                  <span className="text-[9px] text-accent">View</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="w-48 sm:w-64 aspect-[9/19] rounded-[2.5rem] sm:rounded-[3rem] border-4 sm:border-8 border-ink bg-ink shadow-2xl overflow-hidden">
          <div className="flex h-full flex-col bg-surface">
            <div className="flex items-center justify-between px-4 pt-5 pb-2">
              <span className="text-xs font-semibold text-ink">Brazen</span>
              <span className="rounded-full bg-badge-bg px-2 py-0.5 text-[9px] font-medium text-accent">
                Payment status
              </span>
            </div>
            <div className="flex-1 px-4 pb-5">
              <p className="text-[10px] text-body">Sepolia &rarr; HSK Testnet</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">
                Bridge complete
              </p>
              <div className="mt-3 space-y-2">
                <div className="rounded-xl border-2 border-accent bg-badge-bg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-ink">
                      Deposit confirmed
                    </span>
                    <span className="text-[10px] font-bold text-accent">
                      Sepolia
                    </span>
                  </div>
                  <p className="mt-0.5 text-[8px] text-body">
                    Gasless permit &middot; relayer paid gas
                  </p>
                </div>
                <div className="rounded-xl border-2 border-accent bg-badge-bg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-ink">
                      Released
                    </span>
                    <span className="text-[10px] font-bold text-accent">
                      HSK Testnet
                    </span>
                  </div>
                  <p className="mt-0.5 text-[8px] text-body">
                    &sim;10s total &middot; fee 0.005 USDC
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-white px-3 py-2.5">
                <p className="text-[8px] text-body">
                  Routed via HSK testnet, gas paid by relayer, done in ~10s.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-2 top-6 sm:left-6 sm:top-10 z-30 flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1.5 shadow-md">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] text-white">
          &#10003;
        </span>
        <span className="text-[9px] font-medium text-ink">Gasless</span>
      </div>

      <div className="absolute bottom-6 right-2 sm:bottom-10 sm:right-6 z-30 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white shadow-md">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="#F4623A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 8L21 12L17 16" />
          <path d="M3 12H21" />
          <path d="M7 16L3 12L7 8" />
        </svg>
      </div>
    </div>
  );
}
