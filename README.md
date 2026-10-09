# Brazen


**Settlement infrastructure other agents can pay through — gasless, AI-routed, cross-chain stablecoin payment rails.**

**Live app:** [brazen.vercel.app](https://brazen.vercel.app)

Brazen moves USDC across chains in seconds, gaslessly, for two kinds of payers: a human bridging their own funds through the app, or an autonomous agent paying another agent's wallet on a different chain, programmatically, with no browser involved. Same contracts, same relayer, same speed, two front doors. A deterministic routing layer checks live gas price and destination-pool liquidity, computes the fee, executes the payment, and an LLM turns the decision into a plain-language status update for the UI.

Built for the EAG x Web3bridge x HSK Chain Builders Tour — Lagos, Nigeria (Aug 26–27, 2026).

- **EAG Track:** AI x Ethereum & Agent Economy / Application Middleware & Open-Source Tooling
- **HSK Chain Track:** Payments, Stablecoins, AI × Web3

---

## The problem

Two groups hit the same wall today: a user holding USDC on Ethereum (or Base) who wants to use it on HSK Chain, and an AI agent that needs to pay another agent on a different chain for a service it just consumed. Both are blocked by the same friction — acquiring a gas token on a chain they've never touched, waiting minutes for finality, and manually figuring out the cheapest route. Existing bridges serve the first group and ignore the second entirely; there is no programmatic, gasless way for one agent to just pay another agent across chains.

## What Brazen does

1. A payer — human or agent — signs a free EIP-3009 `transferWithAuthorization` permit. No gas, no manual transaction, just a signature.
2. Brazen's relayer submits the deposit on the source chain and pays the gas itself.
3. The router checks live gas price and destination-pool liquidity, and releases funds almost instantly from a pre-funded pool on HSK Chain Testnet — to **any recipient address the payer names**, not just themselves. This is what makes it fast, and what makes it a payment rail rather than a self-bridge.
4. A small fee (0.5%) is taken from the transferred amount to cover gas and margin. Neither side ever touches a gas token.

Two front doors onto the same rail:
- **The app** (`frontend/`) — connect a wallet, sign, bridge to yourself or someone else, across two source chains.
- **The API** (`relayer/`) — `POST /pay` directly, no browser, no human in the loop — an agent paying another agent.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full flow and the trust model, stated plainly: this is a **custodial fast-bridge** (v1 uses a single permissioned relayer for speed; v2 decentralizes release via a bonded watcher network — see [`docs/ROADMAP.md`](docs/ROADMAP.md)).

## Live on HSK Chain Mainnet

| Chain | Chain ID | Contract | Stablecoin |
|---|---|---|---|
| HSK Chain Mainnet | `177` | `DestPool`: [`0xc97C6656c19fB9Dc0F9Bc384632e05d4782150C5`](https://hsk.blockscout.com/address/0xc97C6656c19fB9Dc0F9Bc384632e05d4782150C5) | [`USDC.e`](https://hsk.blockscout.com/address/0x054ed45810DbBAb8B27668922D110669c9D88D0a) (Bridged USDC, `0x054ed45810DbBAb8B27668922D110669c9D88D0a`) — real Circle `FiatTokenProxy`, EIP-3009 verified on-chain |

The mainnet `DestPool` is deployed and configured against real USDC.e, but is **intentionally unfunded** — it holds zero liquidity and is not yet open to users. Funding it is gated on [`docs/MAINNET_CHECKLIST.md`](docs/MAINNET_CHECKLIST.md), specifically multisig ownership (it is currently owned by a single EOA) and an audit pass. The live product below runs on testnets.

## Live on two source chains (testnet)

| Source chain | Chain ID | Contract | Stablecoin |
|---|---|---|---|
| Ethereum Sepolia | `11155111` | `SourceVault`: [`0xd94a03Dd48f29075AF234DbB1F5978e0bdA0e484`](https://sepolia.etherscan.io/address/0xd94a03Dd48f29075AF234DbB1F5978e0bdA0e484) | Circle testnet USDC |
| Base Sepolia | `84532` | `SourceVault`: [`0xfd2f67cD354545712f9d8230170015d7e30d133A`](https://sepolia.basescan.org/address/0xfd2f67cD354545712f9d8230170015d7e30d133A) | Circle testnet USDC |

Both bridge into a single destination:

| Destination chain | Chain ID | Contract | Stablecoin |
|---|---|---|---|
| HSK Chain Testnet | `133` | `DestPool`: `0xA5dd225Beb2Ec0009Fe143eb0B9309Ba07d23737` | `MockUSDC` — Brazen's own mintable testnet stand-in, since no independently-verified canonical USDC exists yet on HSK testnet (stated plainly, per [`docs/SMART_CONTRACTS.md`](docs/SMART_CONTRACTS.md)) |

Every claim above has been exercised against real testnets — real signed permits, real deposit transactions, real releases, both self-bridge and agent-to-agent (`recipient != payer`), on both source chains.

## Mainnet deployment

`DestPool` is deployed to HSK Chain Mainnet (address above), pointing at real bridged USDC.e whose EIP-3009 support and EIP-712 domain were verified directly on-chain before deploying. It holds **zero liquidity** and is not open to users.

Remaining gates before it handles real funds, per [`docs/MAINNET_CHECKLIST.md`](docs/MAINNET_CHECKLIST.md): an audit or thorough review pass, moving ownership from the current single EOA to a multisig, and a documented liquidity + incident-response plan. Source-side `SourceVault` mainnet deploys are not done — deploy tooling for them exists at `contracts/script/*Mainnet.s.sol`.

One finding worth recording: HSK mainnet USDT (`0xF1B5…9029`) is an `OptimismMintableERC20` and does **not** implement EIP-3009 — its `DOMAIN_SEPARATOR()` reverts — so it cannot support Brazen's gasless permit flow. USDC.e is the only viable stablecoin on this chain for this design.

## Two ways to use the rail

```
Human, via the app                         Agent, via the API
--------------------                        --------------------
Connect wallet, pick source chain           Hold a funded key, no browser
Sign a permit                               Sign the same payload programmatically
Watch a status page                         POST /pay { fromChainId, toChainId, amount, recipient }
Funds land in their own                     Funds land in another agent's
(or a named) wallet                         wallet, on another chain
```

Same `SourceVault` / `DestPool` contracts, same relayer, same routing logic underneath both. The API is shaped to sit behind an x402-style ("HTTP 402 Payment Required") agent-payment convention, so builders working on agent commerce can plug Brazen in as a cross-chain settlement leg instead of hand-rolling bridging logic.

## Repo layout

```
brazen/
├── contracts/    Foundry project — SourceVault.sol, DestPool.sol, MockUSDC.sol, tests, deploy scripts
├── relayer/      Node/TypeScript service — router, EIP-3009 submission, POST /pay, GET /status/:id
├── frontend/     Next.js app — landing page, bridge UI, dashboard
└── docs/         Full design/architecture/deployment docs, written for both humans and AI coding agents
```

See [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) for the full breakdown and why it's split this way.

## Quick start

```bash
# contracts
cd contracts && forge install && forge test

# relayer/agent
cd relayer && npm install && cp .env.example .env && npm run dev

# frontend
cd frontend && npm install && cp .env.example .env.local && npm run dev
```

Run the agent-to-agent proof directly from the terminal, no browser:

```bash
cd relayer && npm run demo:agent-to-agent
```

## Docs

| Doc | What's in it |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, flow diagrams, trust model |
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | Every tool used and why |
| [docs/SMART_CONTRACTS.md](docs/SMART_CONTRACTS.md) | Contract specs, gas optimization checklist, addresses |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Step-by-step deploy guide |
| [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) | Build schedule, scope cut list |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Frontend visual language |
| [docs/ROADMAP.md](docs/ROADMAP.md) | What ships after the hackathon |

## Trust model — say this out loud

This is a **custodial fast-bridge**: the relayer controls `DestPool`'s funds and decides when to release. Users are trusting the relayer's key and liquidity, not a trustless cross-chain message protocol — the same pattern early Across Protocol and Hop used. Stated plainly, not hidden: *"v1 uses a permissioned relayer for speed. v2 decentralizes release via a bonded watcher/attestation network."*

## License

MIT.
