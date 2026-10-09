# Brazen

**Settlement infrastructure other agents can pay through — gasless, AI-routed, cross-chain stablecoin payment rails.**

Brazen is a payment rail for moving USDC/USDT across chains in seconds, gaslessly, that any payer can use — a human bridging their own funds through our app, or an autonomous agent paying another agent programmatically through our API. Same contracts, same relayer, same speed, two front doors. An AI routing layer checks live gas price and destination-pool liquidity, picks the fastest/cheapest corridor, executes the payment, and reports the decision in plain language.

Built for the EAG x Web3bridge x HSK Chain Builders Tour — Lagos, Nigeria (Aug 26–27, 2026).

- **EAG Track:** AI x Ethereum & Agent Economy / Application Middleware & Open-Source Tooling
- **HSK Chain Track:** Payments, Stablecoins, AI × Web3

---

## The problem

Two groups have the same underlying problem today: a normal user holding USDC on Ethereum who wants to use it on HSK Chain, and an AI agent that needs to pay another agent on a different chain for a service it just consumed. Both are blocked by the same friction — buying a gas token on a chain you've never touched, waiting minutes for finality, and manually working out which route is cheapest. Existing bridges are built for the first group and ignore the second entirely; there's no programmatic, gasless way for one agent to just pay another agent across chains.

## What Brazen does

1. A payer — human or agent — authorizes a transfer of USDC/USDT with a signed message. No gas, no manual transaction, just a signature (or, for agents, a signed payload passed programmatically).
2. Brazen's relayer submits the deposit on the source chain (Sepolia) and pays the gas itself.
3. The routing agent checks live gas price + liquidity and releases funds almost immediately from a pre-funded pool on the destination chain (HSK testnet), to **any recipient address the payer names** — this is what makes it *fast*, and what makes it a payment rail rather than just a self-bridge.
4. A small fee is skimmed from the transferred amount to cover gas + margin. Neither side ever touches a gas token.

Two front doors onto the same rail:
- **The app** (`frontend/`) — a human connects a wallet, signs, and bridges their own funds to themselves or someone else, cross-chain.
- **The API** (`relayer/`) — an agent, or anything building an "AgentPay"-style product, calls `POST /pay` directly with no browser and no human in the loop, to pay another agent's wallet on another chain.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full flow, the recipient-routing design, and the trust assumptions we're explicit about.

## Quick links

| Doc | What's in it |
|---|---|
| [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | Full repo layout |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, flow diagrams, trust model |
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | Every tool we use and why (incl. the Supabase question) |
| [docs/SMART_CONTRACTS.md](docs/SMART_CONTRACTS.md) | Contract specs, gas optimization checklist, addresses |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Step-by-step deploy to Sepolia + HSK testnet |
| [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) | Hour-by-hour hackathon plan, scope cut list |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Visual language for the frontend (adapted from our reference design) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | What ships after the hackathon (used on the landing page too) |

## Two ways to use the rail

```
Human, via the app                         Agent, via the API
--------------------                        --------------------
Connect wallet                              Hold a funded key, no browser
Sign a permit                               Sign the same payload programmatically
Watch a status page                         POST /pay { fromChain, toChain, amount, recipient }
Funds land in their own                     Funds land in another agent's
(or a named) wallet                         wallet, on another chain
```

Same `SourceVault` / `DestPool` contracts, same relayer, same routing logic underneath both. The API is designed to be easy to sit behind an x402-style ("HTTP 402 Payment Required") agent-payment convention, so builders working on agent commerce — AgentPay-style products, agent-to-agent service marketplaces, autonomous agent wallets — can plug Brazen in as their cross-chain settlement leg instead of building bridging logic themselves.

## Quick start

```bash
# contracts
cd contracts && forge install && forge test

# relayer/agent
cd relayer && npm install && cp .env.example .env && npm run dev

# frontend
cd frontend && npm install && cp .env.example .env.local && npm run dev
```

## Live demo

This is a **real testnet demo** — real signed permits, real on-chain transactions, real explorer links, no mocked screenshots. Deployed contract addresses and explorer links are pinned in `docs/DEPLOYMENT.md` once live.

- Source chain: Ethereum Sepolia (chain ID `11155111`)
- Destination chain: HSK Chain Testnet (chain ID `133`, RPC `https://testnet.hsk.xyz`)

## Team

_Add names / roles here._

## License

MIT (or update as needed).
