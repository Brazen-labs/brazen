type Phase = {
  label: string;
  title: string;
  points: string[];
};

const phases: Phase[] = [
  {
    label: "Phase 1 — Now",
    title: "Hackathon MVP",
    points: [
      "Gasless deposit via signed permit (EIP-3009) on Sepolia, with recipient separate from payer from day one",
      "A callable POST /pay API — a human uses it through the app, an agent calls it directly",
      "Single permissioned relayer for fast release from a pre-funded pool on HSK Chain Testnet — custodial, stated openly",
    ],
  },
  {
    label: "Phase 2",
    title: "Decentralizing the relayer",
    points: [
      "Replace the single relayer with a bonded watcher network — multiple attestations before release, stake at risk for misbehavior",
      "Integrate Circle's CCTP as a trust-minimized alternative for users who prefer canonical-bridge guarantees",
      "Add more destination chains beyond HSK",
    ],
  },
  {
    label: "Phase 3",
    title: "Mainnet",
    points: [
      "External security audit and a public static-analysis report",
      "Open DestPools to LPs who earn a share of the routing fee",
      "Support additional stablecoins (USDT, EURC) alongside USDC, with a mobile-first flow",
    ],
  },
  {
    label: "Phase 4",
    title: "Ecosystem",
    points: [
      "Publish the API as an SDK (npm install brazen) for any agent framework or dApp",
      "Formal x402 compatibility so agents can use Brazen as a drop-in settlement leg",
      "Merchant and point-of-sale integration for local commerce use cases",
    ],
  },
];

export default function RoadmapTimeline() {
  return (
    <section id="roadmap" className="w-full bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 bg-badge-bg text-accent rounded-full px-4 py-1.5 text-base font-medium">
            Roadmap
          </span>
          <h2 className="mt-6 font-sans font-bold tracking-tight text-ink text-4xl md:text-5xl">
            Where Brazen is headed
          </h2>
        </div>

        <div className="mt-14 relative pl-8 md:pl-10 border-l border-border">
          {phases.map((phase) => (
            <div key={phase.label} className="relative pb-14 last:pb-0">
              <span className="absolute -left-[calc(2rem+5px)] md:-left-[calc(2.5rem+5px)] top-1.5 w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="inline-flex items-center gap-2 bg-badge-bg text-accent rounded-full px-3 py-1 text-sm font-medium">
                {phase.label}
              </span>
              <h3 className="mt-3 font-sans font-bold text-ink text-2xl md:text-3xl">
                {phase.title}
              </h3>
              <ul className="mt-3 space-y-2 max-w-2xl">
                {phase.points.map((point) => (
                  <li key={point} className="text-body text-lg leading-relaxed">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
