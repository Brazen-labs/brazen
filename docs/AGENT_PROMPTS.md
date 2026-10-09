# AI Agent Build Prompts — Brazen

Six prompts, run in order, each meant for an agentic coding tool that supports spinning up parallel sub-agents/sub-tasks (e.g. Claude Code's Task tool). Each prompt assumes the `docs/` folder from earlier (`ARCHITECTURE.md`, `TECH_STACK.md`, `SMART_CONTRACTS.md`, `DEPLOYMENT.md`, `PROJECT_STRUCTURE.md`, `DESIGN_SYSTEM.md`, `BUILD_PLAN.md`) already exists in the repo — that's the spec the agent should read, not re-derive.

**How to use these:** paste one prompt per agent session, let it finish and report its "Definition of Done" checklist, review/spot-check the diff, then move to the next prompt. Don't run prompt 2 before prompt 1's contracts are actually deployed — the relayer needs real addresses. Prompt 6 (the agent-to-agent demo) can run any time after Prompt 5 — it's what turns "we built a bridge" into "we built a payment rail" in the actual demo, so don't treat it as optional polish.

## Code style — applies to every prompt below

This is a production codebase, not a tutorial. Every sub-agent in every prompt must follow this:

- **No comment blocks, no NatSpec, no docstring essays, no "why this exists" paragraphs above functions.**
- Only add a comment when the *code itself* can't make the intent obvious — and when you do, keep it to a single short `//` line, not a block.
- Never comment the obvious (`// increment counter`, `// return the result`) — if you're tempted to write that, delete the comment instead.
- Naming, small functions, and clear structure should carry the meaning — comments are the fallback, not the default.
- This applies to Solidity, TypeScript, and JSX equally. Each sub-agent should be told this explicitly if you're pasting its instructions into a separate session.

---

## Prompt 1 — Smart Contracts

```
Read docs/PROJECT_STRUCTURE.md, docs/ARCHITECTURE.md, and docs/SMART_CONTRACTS.md in this repo. 
Build the full contracts/ package described there.

Spin up parallel sub-agents for the independent pieces:
- Sub-agent A: implement SourceVault.sol exactly to the spec in docs/SMART_CONTRACTS.md — this is 
  a payment rail, not a self-bridge, so depositWithAuthorization must take an explicit `recipient` 
  parameter separate from `payer`, and PaymentRequested must emit both. Include the 
  approve/transferFrom fallback path behind a clearly separated function, since we may need to 
  switch to it if EIP-3009 doesn't work cleanly on the testnet USDC deployment. No NatSpec, no 
  comment blocks — see "Code style" above.
- Sub-agent B: implement DestPool.sol exactly to the spec (relayer-only release(), fee in bps, 
  Ownable + Pausable + ReentrancyGuard from OpenZeppelin, custom errors not require-strings).
- Sub-agent C: write Foundry tests for both contracts covering: happy path deposit and release 
  where recipient equals payer, happy path deposit and release where recipient is a **different** 
  address than payer (this is the agent-to-agent case — it must be explicitly tested, not just 
  implied by the self-bridge case), wrong-relayer-reverts, paused-reverts, 
  insufficient-liquidity-reverts, zero-recipient-reverts, fee math correctness at a few bps values 
  including 0 and edge amounts.
- Sub-agent D: write the two Foundry deploy scripts (script/DeploySourceVault.s.sol, 
  script/DeployDestPool.s.sol) reading network config from .env, plus foundry.toml configured 
  for both the Sepolia and HSK testnet (chain ID 133, RPC https://testnet.hsk.xyz) networks.

After all sub-agents finish: run `forge test`, fix any failures yourself, then run `forge snapshot` 
and `slither .` and summarize the gas numbers and any Slither findings.

Apply every item in the "Gas optimization checklist" section of docs/SMART_CONTRACTS.md and note 
in your final summary which ones you applied and why.

Definition of done: `forge test` passes 100%, `forge snapshot` produces a committed gas report, 
Slither has been run and any high/medium findings are either fixed or explicitly justified in a 
one-line comment, both deploy scripts run successfully against a local anvil fork before touching 
a real testnet, and the code has no comment blocks or NatSpec per the Code style note above.
```

---

## Prompt 2 — Relayer / Agent Service

```
Read docs/ARCHITECTURE.md, docs/TECH_STACK.md, and docs/PROJECT_STRUCTURE.md. The contracts from 
Prompt 1 are now deployed to Sepolia and HSK testnet — get the addresses from contracts/broadcast/ 
deploy logs (or ask me for them if you can't find them) and put them in relayer/.env.example.

Build the relayer/ package described in docs/PROJECT_STRUCTURE.md. This is a real, long-running 
Node/TypeScript service — not a mock.

Spin up parallel sub-agents for the independent pieces:
- Sub-agent A: chains/sepolia.ts and chains/hsk.ts — viem public + wallet clients, contract 
  instances from the deployed ABIs, and a gas-price read function for each chain.
- Sub-agent B: agent/router.ts — the deterministic decision layer described in docs/ARCHITECTURE.md: 
  given a payment request (payer, recipient, amount, fromChain, toChain), check DestPool liquidity 
  and current gas price on both chains, compute the fee, return a structured decision object. 
  This must be pure/testable logic, no LLM calls here, and must not assume recipient == payer 
  anywhere.
- Sub-agent C: agent/explain.ts — takes the router's decision object and calls the Claude API 
  (Anthropic SDK) to produce a short natural-language status string for the UI, per the split 
  described in docs/ARCHITECTURE.md ("Router (deterministic) vs Explainer (LLM)").
- Sub-agent D: services/relay.ts, services/liquidity.ts, services/events.ts — the actual on-chain 
  submission logic (calling depositWithAuthorization with an explicit recipient, and release), the 
  liquidity check against DestPool balance, and an event watcher for PaymentRequested.
- Sub-agent E: api/routes.ts and index.ts — a small Express or Fastify server exposing 
  POST /pay { fromChain, toChain, amount, recipient, signature } and GET /status/:id (polls 
  current state). This is the actual product surface, not an implementation detail — it must work 
  correctly whether called by the frontend after a human signs, or by an external script/agent 
  with no browser involved at all. Wire together everything the other sub-agents built.

After all sub-agents finish: wire it all together yourself, write one integration script 
(scripts/test-round-trip.ts or similar) that runs an actual deposit → route → release cycle 
against the live testnets **with recipient set to a second, different test wallet than the 
payer** — this is the case that actually proves the rail works for agent-to-agent payments, not 
just self-bridging. Report the real transaction hashes and explorer links it produced — do not 
report success without a real on-chain result.

Definition of done: the integration script completes one real round trip against live Sepolia + 
HSK testnet with recipient != payer, printed explorer links for both transactions, the API server 
responds correctly to POST /pay and GET /status/:id when tested with curl, and the codebase has 
no comment blocks or over-commenting per the Code style note above.
```

---

## Prompt 3 — Frontend: Landing Page

```
Read docs/DESIGN_SYSTEM.md and docs/PROJECT_STRUCTURE.md. Build the frontend/ Next.js app's 
landing page (app/page.tsx) and its component library, following the design system doc exactly — 
colors, typography, layout patterns, and the specific Brazen-adapted copy/section ideas listed 
in it (not the original reference product's copy).

Spin up parallel sub-agents for the independent components, all in frontend/app/components/:
- Sub-agent A: Nav.tsx and Hero.tsx (including the hero pill badge, headline, subheadline, 
  and the two CTA buttons)
- Sub-agent B: PhoneMockupStack.tsx — the three-angled-phone hero visual described in 
  docs/DESIGN_SYSTEM.md, showing the three Brazen screens described there (can be built with 
  static illustrative content for now, real data comes in Prompt 4)
- Sub-agent C: HowItWorks.tsx and a live-stats-bar component
- Sub-agent D: RoadmapTimeline.tsx, sourcing its four phases directly from docs/ROADMAP.md 
  so the copy matches what we'd tell judges, plus an FAQ accordion that explicitly answers the 
  custodial trust-model question from docs/ARCHITECTURE.md
- Sub-agent E: Footer.tsx

After all sub-agents finish: assemble them into app/page.tsx in the section order described in 
docs/DESIGN_SYSTEM.md, and do a pass to make sure spacing/colors are consistent across all of 
them (the doc warns specifically against introducing new accent colors per section — check for 
that).

Definition of done: `npm run dev` renders a complete, responsive landing page matching the design 
system doc, with no console errors, all copy is Brazen-specific (no leftover placeholder text 
from the reference design), and the code has no comment blocks or over-commenting per the Code 
style note above.
```

---

## Prompt 4 — Frontend: Bridge Product

```
Read docs/ARCHITECTURE.md and docs/TECH_STACK.md. The relayer API from Prompt 2 is live at the 
URL in relayer's deployment (or localhost during dev) — get it from me if you don't have it.

Build the actual product screens: app/bridge/page.tsx and app/dashboard/page.tsx, using 
RainbowKit + wagmi + viem per docs/TECH_STACK.md.

Spin up parallel sub-agents for the independent pieces:
- Sub-agent A: wagmi/RainbowKit setup (lib/wagmiConfig.ts, lib/chains.ts with Sepolia + HSK 
  testnet chain 133 defined), and the wallet-connect button integrated into Nav.tsx
- Sub-agent B: BridgeWidget.tsx — amount input, a recipient field that defaults to the connected 
  wallet's own address but can be changed to bridge to someone else, triggers the EIP-3009 
  signature flow (or the approve fallback, whichever Prompt 1 ended up using — check 
  contracts/src/SourceVault.sol to confirm which path is live), then POSTs to the relayer's 
  /pay endpoint
- Sub-agent C: StatusTracker.tsx — polls or subscribes to GET /status/:id on the relayer, shows 
  the LLM-generated explainer text from Prompt 2, and renders both explorer links (Sepolia + HSK 
  testnet) once complete
- Sub-agent D: dashboard/page.tsx — a simple history view reading past PaymentRequested/Released 
  events directly from chain (per the "skip Supabase" recommendation in docs/TECH_STACK.md) 
  unless I've told you otherwise; show recipient distinctly from payer in each row so a 
  third-party payment is visually obvious, not indistinguishable from a self-bridge

After all sub-agents finish: wire BridgeWidget and StatusTracker together into app/bridge/page.tsx 
as one flow, and update the PhoneMockupStack component from Prompt 3 to use real screenshots or 
accurate mock data from this actual flow instead of placeholder content.

Definition of done: from a real wallet with real Sepolia testnet USDC, I can complete one full 
bridge on the live local dev server and see both a real Sepolia and a real HSK testnet explorer 
link at the end, and the code has no comment blocks or over-commenting per the Code style note 
above.
```

---

## Prompt 5 — Integration, Deployment & Demo Rehearsal

```
Read docs/DEPLOYMENT.md and docs/BUILD_PLAN.md. Everything from Prompts 1-4 exists locally and 
has been tested individually. Now take it to a fully live, publicly reachable state and rehearse 
the demo.

Spin up parallel sub-agents for the independent deployment targets:
- Sub-agent A: deploy relayer/ to Render or Railway per docs/DEPLOYMENT.md section 3 — set up the 
  service, configure env vars, confirm the hosted API responds to a curl health check
- Sub-agent B: deploy frontend/ to Vercel per docs/DEPLOYMENT.md section 4 — set up the project, 
  configure env vars pointing at the now-hosted relayer and the deployed contract addresses, 
  confirm the live URL loads
- Sub-agent C: run through the "Pre-demo smoke test" checklist in docs/DEPLOYMENT.md against the 
  now-fully-live stack (not localhost) — report exact results, including transaction hashes, for 
  each checklist item

After all sub-agents finish, do this yourself (don't parallelize it, it needs to be sequential):
run the full round trip end-to-end against the live URLs twice in a row, exactly as a judge would 
experience it. Report timing for each step (sign → deposit confirmed → release confirmed) and flag 
anything that felt slow or fragile. Then check docs/BUILD_PLAN.md's "scope cut list" and confirm 
none of the "never cut" items were silently skipped anywhere in the build.

Definition of done: a judge could open the live Vercel URL cold, connect a wallet holding testnet 
USDC, and complete a real bridge to HSK testnet with both explorer links resolving — verified by 
you having actually done this twice, not assumed from unit tests.
```

---

## Prompt 6 — Agent-to-Agent Demo Script

```
Read docs/ARCHITECTURE.md's "Flow — agent, via the API" section and docs/PROJECT_STRUCTURE.md. 
Everything from Prompts 1, 2, and 5 is live: contracts deployed, relayer hosted, API reachable.

Build relayer/scripts/agent-to-agent-demo.ts — a standalone script, no frontend, no browser, that 
demonstrates the core claim: Brazen is settlement infrastructure other agents can pay through, 
not just a UI for humans bridging their own funds.

The script should:
- Use two separate funded test wallets — "Agent A" (payer) and "Agent B" (recipient) — loaded from 
  env vars, clearly logged as such
- Have Agent A sign a payment authorization for some USDC amount, with recipient set to Agent B's 
  address, exactly as an external agent framework would call this rail programmatically
- POST it to the live relayer's /pay endpoint
- Poll GET /status/:id and print each state transition to the terminal with timestamps
- On completion, print both the Sepolia and HSK testnet explorer links, and explicitly print a 
  line confirming "Agent B's balance increased by X" read directly from chain, not assumed

This should be runnable as `npm run demo:agent-to-agent` from the relayer/ directory and produce 
clean, readable terminal output suitable for showing on screen during a live pitch — this script 
IS a demo artifact, not just a test, so the console output matters as much as the logic working.

Definition of done: running the script twice in a row against the live hosted relayer both times 
completes with two different real transaction hashes and Agent B's on-chain balance visibly 
increasing, and the codebase has no comment blocks or over-commenting per the Code style note 
above.
```

---

## Notes on using sub-agents effectively

- Give each sub-agent a **narrow, file-scoped task** (as above) rather than "build the relayer" as one blob — this is what actually lets them run in parallel without conflicting edits to the same file.
- Always have the **parent agent do the final wiring/integration step itself**, sequentially, after sub-agents finish — merging five parallel diffs and making them actually talk to each other is not a good parallelizable task.
- If a sub-agent's task depends on another sub-agent's output in the *same* prompt (e.g. the API route needs the router logic), that's a signal to either merge them into one sub-agent or explicitly sequence that pair — don't force a dependency into a "parallel" bucket.
- Re-run the relevant "Definition of Done" check before moving to the next prompt — this is what keeps you inside `docs/BUILD_PLAN.md`'s schedule instead of discovering an integration failure on Day 2 afternoon.
