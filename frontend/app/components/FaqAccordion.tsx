"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    question: "Is Brazen custodial?",
    answer:
      "Yes, and we say this plainly: v1 is a custodial fast-bridge. A single permissioned relayer controls the DestPool funds and decides when to release them, so you're trusting the relayer's key and liquidity, not a trustless cross-chain message protocol. That's exactly how early versions of Across Protocol and Hop worked — a legitimate, well-understood MVP pattern, not a shortcut we're hiding. v2 decentralizes release via a bonded watcher/attestation network — see the Roadmap.",
  },
  {
    question: "How is this gasless?",
    answer:
      "The payer signs a free, off-chain permit (EIP-3009 style) naming a recipient — no transaction, no gas. The relayer submits the deposit on Sepolia and the release on the destination chain, paying gas on both sides, and recoups that cost via a small fee. Neither side ever needs to hold a gas token.",
  },
  {
    question: "Can an agent use Brazen without a human in the loop?",
    answer:
      "Yes. The same POST /pay API that the web app calls can be called directly by any script or agent, no browser needed. Recipient is a separate parameter from payer, so agent-to-agent payments are a first-class case, not a workaround bolted onto a human-first flow.",
  },
  {
    question: "What networks does this support today?",
    answer:
      "Ethereum Sepolia as the source chain and HSK Chain Testnet as the destination, today, testnet only. More EVM chains are planned as part of the roadmap.",
  },
];

export default function FaqAccordion() {
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  function toggleQuestion(question: string) {
    setOpenQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(question)) {
        next.delete(question);
      } else {
        next.add(question);
      }
      return next;
    });
  }

  return (
    <section id="faq" className="w-full bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <h2 className="text-center font-sans font-bold tracking-tight text-ink text-4xl md:text-5xl">
          Frequently asked questions
        </h2>

        <div className="mt-12 max-w-3xl mx-auto">
          {faqItems.map((item) => {
            const isOpen = openQuestions.has(item.question);
            return (
              <div key={item.question} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => toggleQuestion(item.question)}
                  aria-expanded={isOpen}
                  className="flex justify-between items-center w-full py-5 text-left text-lg font-medium text-ink"
                >
                  <span>{item.question}</span>
                  <span className="ml-6 text-accent text-2xl leading-none shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <p className="text-body text-lg leading-relaxed pb-5 pr-8">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
