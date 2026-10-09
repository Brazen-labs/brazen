# Build Plan

Tied to the actual event agenda so the team (and the AI coding agent) always knows what "in scope right now" means.

## Day 1 — Aug 26, 14:30–17:30 (3 hrs hacking window)

Goal by 17:30: **contracts written, tested, and deployed to both testnets; relayer working end-to-end from the CLI (no UI needed yet).**

- [ ] 14:30–14:45 — Confirm addresses/RPCs (Sepolia USDC, HSK testnet stablecoin or mock, faucets funded)
- [ ] 14:45–15:30 — `SourceVault.sol` (with explicit `recipient` param, separate from payer) + `DestPool.sol` written, `forge test` passing
- [ ] 15:30–15:45 — `forge snapshot` baseline, `slither .` pass
- [ ] 15:45–16:15 — Deploy both contracts to Sepolia + HSK testnet, fund `DestPool`
- [ ] 16:15–17:15 — Relayer skeleton: watch `PaymentRequested`, call router logic, call `release()` — test via a CLI script or curl, not UI
- [ ] 17:15–17:30 — Confirm one full round trip works end-to-end from the terminal, with `recipient != payer`, so the agent-to-agent case is proven before you ever touch the frontend; commit; stop for the day

## Day 2 — Aug 27, 9:30–13:30 (4 hrs hacking window)

Goal by 13:30: **frontend live, wired to the working backend, full demo rehearsed at least twice.**

- [ ] 9:30–10:15 — Frontend scaffold: nav, hero, landing sections per `DESIGN_SYSTEM.md`
- [ ] 10:15–11:15 — `BridgeWidget` — wallet connect, permit signing, submit to relayer API
- [ ] 11:15–12:00 — `StatusTracker` — live status from relayer, both explorer links on completion
- [ ] 12:00–12:30 — Explainer layer (LLM-generated route explanation text) wired in
- [ ] 12:30–12:45 — `relayer/scripts/agent-to-agent-demo.ts`: two funded test wallets, Agent A pays Agent B via `POST /pay` directly, no browser — this is what proves the "settlement infrastructure other agents can pay through" claim live, not just in the pitch
- [ ] 12:45–13:00 — Deploy frontend to Vercel, relayer to Render/Railway if not already live
- [ ] 13:00–13:30 — Full round-trip rehearsal x2 for **both** flows (human app + agent-to-agent script), fix whatever breaks, top up `DestPool` liquidity if drained by rehearsals

## 13:30–14:00 — Submission
- [ ] Submit on Devfolio (per the event's submission guideline doc) with live URLs + contract addresses + a short demo video as backup

## 14:00–17:00 — Demos (3 min showcase + 2 min Q&A)
- Have the backup screen recording ready in case live testnet RPC/faucet issues hit during your slot
- Know your trust-model answer cold (see `ARCHITECTURE.md`) — this is the question judges are most likely to ask

## Scope cut list — if you're behind schedule, cut in this order

1. LLM explainer text → fall back to a simple templated status string ("Bridged via HSK testnet · fee 0.5 USDC · 8s")
2. Dashboard/history page → skip entirely, the bridge flow itself is the demo
3. Multi-corridor comparison UI → hardcode the single Sepolia↔HSK corridor, mention multi-chain routing as roadmap
4. Supabase / persistent history → skip, read events directly (see `TECH_STACK.md`)

## Never cut, even under time pressure

- A real signed permit and a real on-chain deposit transaction (don't fake this with a mocked "pending" state)
- A real `release()` transaction on HSK testnet with a real explorer link
- The `recipient` field existing and actually being exercised with `recipient != payer` at least once — this is the whole difference between "a bridge" and "a payment rail," don't let it quietly become dead code that only ever gets called with `recipient = self`
- The stated trust-model line in your pitch — an incomplete demo is forgivable, a hidden trust assumption discovered by a judge's question is not
