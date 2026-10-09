import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-sans font-bold text-xl tracking-tight text-ink">
                Brazen
              </span>
            </Link>
            <p className="text-base text-body max-w-xs">
              Gasless cross-chain settlement, for people and agents.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
            <div className="flex flex-wrap items-center gap-6 text-base font-medium text-ink">
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
              <Link href="#how-it-works" className="hover:text-accent transition-colors">
                How it Works
              </Link>
              <Link href="#roadmap" className="hover:text-accent transition-colors">
                Roadmap
              </Link>
              <Link href="#faq" className="hover:text-accent transition-colors">
                FAQ
              </Link>
              <Link href="/docs" className="hover:text-accent transition-colors">
                Docs
              </Link>
            </div>

            <div className="flex items-center gap-4 text-base font-medium text-body">
              <Link href="#" className="hover:text-accent transition-colors">
                GitHub
              </Link>
              <Link href="#" className="hover:text-accent transition-colors">
                Twitter/X
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-body">
          <p>© 2026 Brazen — testnet demo.</p>
          <p>Ethereum Sepolia × HSK Chain Testnet</p>
        </div>
      </div>
    </footer>
  );
}
