# Project Structure

Brazen is a monorepo with three deployable pieces (contracts, relayer/agent, frontend) plus docs. Keep it this way — it lets the AI coding agent work on one piece at a time without stepping on the others' context.

```
brazen/
├── contracts/                     # Foundry project
│   ├── src/
│   │   ├── SourceVault.sol        # Sepolia: pulls USDC via EIP-3009 permit, emits BridgeRequested
│   │   ├── DestPool.sol           # HSK testnet: pre-funded pool, relayer-only release()
│   │   └── interfaces/
│   │       └── IERC20Permit3009.sol
│   ├── test/
│   │   ├── SourceVault.t.sol
│   │   └── DestPool.t.sol
│   ├── script/
│   │   ├── DeploySourceVault.s.sol
│   │   └── DeployDestPool.s.sol
│   ├── foundry.toml
│   └── .env.example               # PRIVATE_KEY, SEPOLIA_RPC_URL, HSK_RPC_URL
│
├── relayer/                       # Node/TypeScript agent — the "AI" in Brazen
│   ├── src/
│   │   ├── agent/
│   │   │   ├── router.ts          # deterministic route/fee decision (gas + liquidity check)
│   │   │   └── explain.ts         # LLM call: turns the route decision into a human-readable reply
│   │   ├── chains/
│   │   │   ├── sepolia.ts         # viem client, contract instance, gas oracle
│   │   │   └── hsk.ts             # viem client, contract instance, chain 133 config
│   │   ├── services/
│   │   │   ├── relay.ts           # submits deposit tx + release tx, holds the relayer key
│   │   │   ├── liquidity.ts       # checks DestPool balance before releasing
│   │   │   └── events.ts          # watches BridgeRequested / Released events
│   │   ├── api/                   # the actual product surface — called by the frontend AND by agents directly
│   │   │   └── routes.ts          # POST /pay { fromChain, toChain, amount, recipient, signature }, GET /status/:id
│   │   └── index.ts
│   ├── scripts/
│   │   └── agent-to-agent-demo.ts # two-terminal demo: Agent A pays Agent B cross-chain, no browser involved
│   ├── package.json
│   └── .env.example                # PRIVATE_KEY (relayer wallet), RPC URLs, ANTHROPIC_API_KEY
│
├── frontend/                      # Next.js app
│   ├── app/
│   │   ├── page.tsx                # landing page (see docs/DESIGN_SYSTEM.md)
│   │   ├── bridge/
│   │   │   └── page.tsx            # the actual product: connect, sign, watch status
│   │   ├── dashboard/
│   │   │   └── page.tsx            # bridge history / stats
│   │   └── components/
│   │       ├── Nav.tsx
│   │       ├── Hero.tsx
│   │       ├── PhoneMockupStack.tsx
│   │       ├── HowItWorks.tsx
│   │       ├── RoadmapTimeline.tsx
│   │       ├── BridgeWidget.tsx
│   │       └── StatusTracker.tsx
│   ├── lib/
│   │   ├── wagmiConfig.ts
│   │   ├── abi/                    # generated ABIs from contracts/out
│   │   └── chains.ts               # sepolia + hskTestnet chain defs
│   ├── public/
│   ├── package.json
│   └── .env.example                 # NEXT_PUBLIC contract addresses, RPC URLs, relayer API URL
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── SMART_CONTRACTS.md
│   ├── DEPLOYMENT.md
│   ├── ROADMAP.md
│   ├── BUILD_PLAN.md
│   └── DESIGN_SYSTEM.md
│
├── README.md
└── .gitignore
```

## Why split it this way

- **`contracts/`** is self-contained so Foundry tests run without needing Node installed, and gas snapshots (`forge snapshot`) stay clean.
- **`relayer/`** is a long-running Node process (holds a private key, watches events, submits transactions) — it can't live as a Vercel serverless function, so it's deployed separately (Render/Railway). See `TECH_STACK.md`.
- **`frontend/`** only ever talks to: (a) the user's wallet directly for the signature, and (b) the relayer's small API for status — it never touches the relayer's private key. It is one caller of `relayer/`'s API, not a privileged one — `scripts/agent-to-agent-demo.ts` calls the exact same `POST /pay` endpoint with no frontend involved at all, which is the point.
- **`docs/`** is written so an AI coding agent (Claude Code or similar) can be pointed at a single file for a task and stay in scope — e.g. "read `docs/SMART_CONTRACTS.md` and implement `SourceVault.sol`" without pulling in frontend context it doesn't need.

## Repo conventions

- One PR/commit per component where possible (contracts vs relayer vs frontend) — keeps the AI agent's diffs reviewable under time pressure.
- Contract addresses are never hardcoded in the frontend — always read from `.env.local` / `NEXT_PUBLIC_*` vars, updated once after each deploy (see `DEPLOYMENT.md`).
- Every contract change → re-run `forge test` and `forge snapshot` before touching the frontend ABI.
