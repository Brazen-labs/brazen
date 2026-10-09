# Tech Stack

Every choice here is picked to minimize moving parts for a 1-day build while still being a genuinely deployable, real-testnet product.

## API-first, not app-first

The relayer's `POST /pay` / `GET /status/:id` API is the actual product — the frontend is one client of it, built for humans. This matters for a few concrete tech choices below: the API needs to work cleanly when called by a script with no browser (auth via signature, not session/cookie), and it's worth keeping its request/response shape close to the emerging **x402** ("HTTP 402 Payment Required") convention some agent-payment tooling is converging on, so builders working on agent-to-agent commerce can treat Brazen as a settlement leg they call into, not a UI they have to route a human through.

## Do we need Supabase / a database?

**Short answer: optional, and probably skip it for the hackathon.**

What you actually need is: (a) a way for the frontend to know a bridge request's status in real time, and (b) history the user can look back at. Two ways to get that:

| Approach | When to use it |
|---|---|
| **No database — read chain events directly** (`viem`'s `watchContractEvent`, or poll `getLogs`) | Fastest to build, zero extra infra, and it's *more* credible in a demo ("we're reading straight off-chain, not from our own database") — use this unless you specifically need persistent history across sessions/devices. |
| **Supabase (Postgres + realtime)** | Add this only if you want: a bridge-history table the dashboard can query instantly without re-scanning chain logs, simple auth (wallet-based rows), and Supabase's realtime subscriptions to push status updates to the UI without polling. It's genuinely fast to set up (free tier, hosted, a few tables), so it's a reasonable Day 2 addition *if the core bridge flow is already working* — never build it first. |

**Recommendation:** build the no-database version first (event-driven status straight from chain). If you finish the core flow with time to spare, layer in Supabase purely to make the dashboard/history feel snappier for the demo — it's a nice-to-have polish item, not core infrastructure.

## Full stack

| Layer | Tool | Why |
|---|---|---|
| Contracts | **Foundry** (not Hardhat) | Faster tests, built-in gas snapshots (`forge snapshot`) which you need since gas-optimization is a stated goal, and `forge script` deploys to both Sepolia and HSK testnet with the same tooling since HSK is fully EVM-compatible. |
| Contract security check | **Slither** (static analysis, run `slither .`) | Free, takes seconds, catches obvious issues before you deploy real value — worth the 5 minutes even under time pressure. |
| Source chain RPC | **Alchemy or Infura** (Sepolia) | Reliable, generous free tier, avoids public-RPC rate limits mid-demo. |
| Destination chain RPC | `https://testnet.hsk.xyz` directly, or via **thirdweb** | HSK testnet documents this RPC directly; thirdweb also has first-class HSK testnet support (bridge, account abstraction, embedded wallets) if you want to lean on their SDK instead of hand-rolling. |
| Relayer/agent runtime | **Node.js + TypeScript**, `viem` for chain calls | `viem` is lighter and more type-safe than ethers for this kind of multi-chain relayer code. |
| Relayer hosting | **Render or Railway** (not Vercel) | The relayer is a long-running process holding a private key and watching events continuously — this doesn't fit serverless function time limits. Render/Railway give you a persistent Node process with one click from a repo. |
| LLM for the "explainer" layer | **Claude (Anthropic API)** | Used only to turn the router's deterministic decision into natural language for the UI — see `ARCHITECTURE.md` for why the money-moving logic itself stays deterministic. |
| Frontend framework | **Next.js (App Router)** | Standard, fast to scaffold, deploys to Vercel in one click. |
| Frontend hosting | **Vercel** | Zero-config Next.js deploys, instant preview URLs — useful for sharing a live demo link with judges before you're even on stage. |
| Wallet connection | **RainbowKit + wagmi + viem** | Fastest way to get multi-chain wallet connect + signing working, well-documented, handles the EIP-3009 signature flow cleanly. |
| Styling | **Tailwind CSS** | Matches the reference design system fastest (see `DESIGN_SYSTEM.md`). |
| Testnet stablecoin | Circle's official Sepolia USDC where possible (see `SMART_CONTRACTS.md` for the address — verify against developers.circle.com before the event) | Using the *real* Circle testnet token instead of a mock ERC20 makes the demo materially more credible to judges who know what to look for. |

## Deployment checklist tools

- `forge script ... --broadcast --verify` for contract deploys + auto-verification where the target explorer supports it.
- One `.env` per package (`contracts/.env`, `relayer/.env`, `frontend/.env.local`) — never share a single root `.env`, it makes it too easy to accidentally deploy a frontend build with a relayer private key baked in.
- A single source of truth for deployed addresses: update `frontend/lib/chains.ts` and `relayer/src/chains/*.ts` immediately after every deploy — see `DEPLOYMENT.md`.
