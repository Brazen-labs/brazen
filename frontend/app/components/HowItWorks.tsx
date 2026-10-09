const steps = [
  {
    number: "01",
    label: "Sign",
    description:
      "Sign a free permit off-chain — no transaction, no gas, no wallet popup surprises.",
  },
  {
    number: "02",
    label: "Deposit",
    description:
      "The relayer pulls your funds on Sepolia and pays the gas for you.",
  },
  {
    number: "03",
    label: "Route",
    description:
      "An AI-assisted router checks live gas prices and pool liquidity to pick the fastest path.",
  },
  {
    number: "04",
    label: "Receive",
    description:
      "Funds land on HSK testnet in seconds, straight to your recipient's wallet.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center rounded-full bg-badge-bg px-4 py-1.5 text-base font-medium text-accent">
            How it Works
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-ink">
            How Brazen moves your money
          </h2>
          <p className="mt-4 max-w-md text-lg text-body">
            One signature, zero gas tokens. Here is the full path from your
            wallet to theirs.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center md:items-start md:text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-badge-bg text-lg font-bold text-accent">
                {step.number}
              </div>
              <h3 className="mt-5 text-xl font-bold text-ink">
                {step.label}
              </h3>
              <p className="mt-2 text-base text-body">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
