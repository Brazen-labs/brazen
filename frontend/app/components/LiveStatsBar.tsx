const stats = [
  { value: "1,240+", label: "USDC Bridged" },
  { value: "8.2s", label: "Avg. Bridge Time" },
  { value: "2", label: "Testnets Live" },
  { value: "0", label: "Gas Tokens Required" },
];

export default function LiveStatsBar() {
  return (
    <section className="bg-ink">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-around gap-8 sm:gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center text-center sm:border-l sm:border-white/10 sm:pl-6 ${
                index === 0 ? "sm:border-l-0 sm:pl-0" : ""
              }`}
            >
              <span className="text-3xl md:text-4xl font-bold text-accent">
                {stat.value}
              </span>
              <span className="mt-1 text-base text-white/60">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
