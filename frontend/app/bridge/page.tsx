"use client";

import { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import BridgeWidget from "../components/BridgeWidget";
import StatusTracker from "../components/StatusTracker";

export default function BridgePage() {
  const [paymentId, setPaymentId] = useState<string | null>(null);

  return (
    <div className="flex flex-col flex-1 bg-surface">
      <Nav />
      <main className="flex flex-1 flex-col items-center px-6 py-16 md:py-24">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
            Bridge USDC to HSK Testnet
          </h1>
          <p className="mt-3 text-lg text-body">
            Sign once, pay no gas. Send to your own wallet or someone else&apos;s.
          </p>
        </div>

        <div className="mt-10 flex w-full max-w-md flex-col gap-6">
          <BridgeWidget onSubmitted={setPaymentId} />
          {paymentId && <StatusTracker key={paymentId} paymentId={paymentId} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
