import Link from "next/link";

export default function Hero() {
  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 bg-badge-bg text-accent rounded-full px-4 py-1.5 text-base font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          Live on Testnet
          <span aria-hidden="true">&rarr;</span>
        </span>

        <h1 className="mt-6 font-sans font-bold tracking-tight text-ink text-5xl md:text-6xl lg:text-7xl max-w-4xl">
          Move stablecoins across chains, gaslessly, in seconds.
        </h1>

        <p className="mt-6 text-body text-xl leading-relaxed max-w-[600px]">
          Settlement infrastructure other agents can pay through — or bridge
          your own funds, no gas needed on either side.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/bridge"
            className="bg-accent text-white rounded-full px-6 py-3.5 text-lg font-medium hover:opacity-90 transition-opacity"
          >
            Bridge Now &rarr;
          </Link>
          <Link
            href="#how-it-works"
            className="bg-white border border-border text-ink rounded-full px-6 py-3.5 text-lg font-medium hover:bg-gray-50 transition-colors"
          >
            How it Works +
          </Link>
        </div>
      </div>
    </section>
  );
}
