# Roadmap

This doubles as the copy source for the landing page's "What's next" / roadmap section — judges will ask about it, so it needs to be a real answer, not filler.

## Phase 1 — Hackathon MVP (now)
- Gasless deposit via signed permit (EIP-3009) on Ethereum Sepolia, with an explicit `recipient` separate from the payer — so the same rail serves self-bridging and third-party (including agent-to-agent) payments from day one, not as a later add-on
- A callable `POST /pay` API, not just a UI — a human uses it through the app, an agent or another service can call it directly with no browser
- AI-routed, fast release from a pre-funded pool on HSK Chain Testnet
- Single permissioned relayer — fast, but custodial (stated openly, see `ARCHITECTURE.md`)
- Real testnet stablecoins, real on-chain transactions, live explorer links, for both the human flow and the agent-to-agent flow

## Phase 2 — Decentralizing the relayer
- Replace the single relayer EOA with a small **bonded watcher network**: multiple parties attest to a valid source deposit before release is authorized, with stake at risk for misbehavior
- Integrate **Circle's CCTP** as an alternative, trust-minimized settlement rail for users who prefer canonical-bridge guarantees over speed
- Add more destination chains beyond HSK — any EVM chain the routing agent can compare against

## Phase 3 — Mainnet
- External security audit + public Slither/static-analysis report
- Real liquidity provisioning: open `DestPool`s to LPs who earn a share of the routing fee, proportional to capital at risk
- Support additional stablecoins (USDT, EURC) alongside USDC
- Mobile-first flow, since most first-time users in target markets are mobile-only

## Phase 4 — Ecosystem
- Publish the API as a proper SDK (`npm install brazen`) so any agent framework or dApp can settle cross-chain payments through Brazen with a few lines of code instead of hand-rolling the request/signature flow
- Formal x402 compatibility, so agents built against that convention can use Brazen as a drop-in settlement leg without custom integration work
- Merchant/point-of-sale integration for local commerce use cases (e.g. Lagos market vendors accepting stablecoin, converted/settled instantly regardless of which chain the customer holds funds on) — the same rail, a third kind of caller alongside humans and agents

## Why this order

Each phase removes exactly one trust assumption or adds exactly one reach extension, in order of what unlocks the most value per unit of engineering effort — decentralizing custody before scaling liquidity, scaling liquidity before adding chains, adding chains before opening it as platform infrastructure.
