import Link from "next/link";
import WalletConnectButton from "./WalletConnectButton";

export default function Nav() {
  return (
    <nav className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-sans font-bold text-xl tracking-tight text-ink">
            Brazen
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-base font-medium text-ink">
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
        </div>

        <div className="flex items-center gap-4">
          <WalletConnectButton />
          <Link
            href="/docs"
            className="hidden sm:inline text-base font-medium text-ink hover:text-accent transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/bridge"
            className="bg-ink text-white rounded-full px-5 py-2.5 text-base font-medium hover:opacity-90 transition-opacity"
          >
            Bridge Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
