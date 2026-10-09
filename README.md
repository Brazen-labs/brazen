# Brazen

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Soroban SDK](https://img.shields.io/badge/Soroban%20SDK-v27.0.5-orange.svg)](https://soroban.stellar.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

**Settlement infrastructure other agents can pay through — Stellar Soroban smart contracts, AI-routed, cross-chain stablecoin payment rails.**

**Live app:** [brazen.vercel.app](https://brazen.vercel.app)

Brazen moves stablecoins across chains in seconds for two kinds of payers: a human bridging their own funds through the web dApp, or an autonomous agent paying another agent's wallet on a different chain, programmatically, with no browser involved. Same contracts, same relayer, same speed, two front doors. A deterministic routing layer checks live fees and destination-pool liquidity, computes the fee, executes the payment, and emits audit-ready events.

---

## The Problem

Two groups hit the same wall today: a user holding USDC on one chain who wants to use it on another, and an AI agent that needs to pay another agent on a different chain for a service it just consumed. Both are blocked by the same friction — acquiring gas tokens on chains they've never touched, waiting minutes for finality, and manually configuring bridge paths. Existing bridges serve the first group and ignore the second entirely; there is no programmatic, unified way for one agent to just pay another agent across chains.

---

## What Brazen Does

1. **Source Escrow (`source_vault`)**: A payer authorizes a deposit into the Stellar Soroban `source_vault` contract using standard SEP-41 token interfaces. The transaction emits a `pay_req` contract event specifying the destination recipient, amount, destination chain ID, and unique nonce.
2. **Relayer Settlement**: Brazen's relayer indexes the `pay_req` event, checks liquidity on the destination pool, and verifies the parameters.
3. **Instant Liquidity Release (`dest_pool`)**: The relayer invokes `release()` on the destination pool, sending funds immediately to **any recipient address the payer specified**, minus a protocol fee (e.g., 0.5%).
4. **Agent Commerce Ready**: Because `recipient` is an explicit parameter rather than defaulting to `payer`, autonomous agents can pay subagents, API providers, and vendors across chains in single transactions.

Two front doors onto the same rail:
- **The dApp** (`frontend/`) — connect a wallet, deposit, bridge to yourself or someone else.
- **The API** (`relayer/`) — `POST /pay` directly, no browser, no human in the loop — an agent paying another agent.

---

## Repo Layout

```
brazen/
├── contracts/          # Stellar Soroban Rust workspace
│   ├── source_vault/   # Collateral escrow contract & event emission
│   └── dest_pool/      # Pre-funded LP release contract & emergency controls
├── relayer/            # Node/TypeScript daemon — event indexer, router, execution
├── frontend/           # Next.js app — landing page, bridge UI, dashboard
├── docs/               # Protocol architecture, specifications & design system
├── CONTRIBUTING.md      # Contributor guidelines and workflow
├── CODE_OF_CONDUCT.md  # Contributor Covenant Code of Conduct
└── SECURITY.md         # Vulnerability reporting and security policy
```

---

## Quick Start

### Smart Contracts (Stellar Soroban)
```bash
cd contracts
cargo test
cargo build --target wasm32-unknown-unknown --release
```

### Relayer Daemon
```bash
cd relayer
npm install
cp .env.example .env
npm run dev
```

### Frontend dApp
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## Documentation & Contribution Platform

| Document | Description |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributor guidelines, coding standards, and PR workflows |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community code of conduct |
| [SECURITY.md](SECURITY.md) | Security vulnerability disclosure process |
| [docs/CONTRIBUTING_GUIDE.md](docs/CONTRIBUTING_GUIDE.md) | In-depth development guide for contracts, relayer, and frontend |
| [docs/SOROBAN_ARCHITECTURE.md](docs/SOROBAN_ARCHITECTURE.md) | Technical architecture of Stellar Soroban contracts and events |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Protocol design, routing, and trust model |
| [docs/SMART_CONTRACTS.md](docs/SMART_CONTRACTS.md) | Smart contracts specifications and network configurations |
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | Tools and frameworks used across the stack |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Protocol roadmap and milestones |

---

## License

MIT
