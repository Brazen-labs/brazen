# Architecture

## One-sentence summary

A payer — human or agent — signs a free permit naming a recipient anywhere on the destination chain → the relayer pulls funds on Sepolia (paying gas) → checks gas + liquidity and releases funds almost instantly from a pre-funded pool on HSK testnet, straight to that recipient (paying gas there too) → a small fee covers both gas costs → neither side ever held a gas token.

## The core design decision: recipient is a parameter, not an assumption

Most bridges implicitly assume "send my funds to myself on the other chain." Brazen doesn't — `depositWithAuthorization` and `release()` both take an explicit `recipient` address, separate from the payer. That one field is what turns this from a personal bridge into a **payment rail**: self-bridging is just the special case where `recipient == payer`. The interesting case is `recipient != payer` — an agent paying a *different* agent's wallet on a different chain, in one call, gaslessly, in seconds. That's the primitive agent-to-agent commerce (AgentPay-style products, agent service marketplaces, autonomous agent wallets) actually needs and doesn't currently have a good cross-chain answer for.

## Flow — human, via the app

```
User Wallet                Relayer / Agent                 Sepolia (SourceVault)      HSK Testnet (DestPool)
    |                            |                                  |                          |
    |--sign permit (free,------->|                                  |                          |
    |  off-chain, EIP-3009,      |                                  |                          |
    |  recipient = self)         |                                  |                          |
    |                            |--depositWithAuthorization()------>|                          |
    |                            |  (relayer pays gas)               |--emits BridgeRequested   |
    |                            |<--event-------------------------- |                          |
    |                            |--check gas price + pool liquidity on HSK-------------------->|
    |                            |--release(recipient, amount - fee)-------------------------->|
    |                            |  (relayer pays gas)                                          |--transfers stablecoin
    |<--status: "Bridged in Xs, fee: Y"---------------------------------------------------------|
```

## Flow — agent, via the API (the same rail, no browser)

```
Agent A                     POST /pay                    Relayer / Agent                Agent B's wallet
(has funded key)            { fromChain, toChain,              |                          (on HSK testnet)
    |                          amount, recipient: B }           |                              |
    |--signs payload------------------------------------------->|                              |
    |  (programmatic, no wallet popup)                          |--depositWithAuthorization()-->|
    |                                                            |  recipient = Agent B         |
    |                                                            |--check gas + liquidity------->|
    |                                                            |--release(AgentB, amount-fee)->|
    |<--{ status, txSepolia, txHSK, feeCharged }-----------------|                              |--Agent B receives funds
```

This is the same `SourceVault` / `DestPool` contracts and the same relayer process as the human flow — the only difference is the caller is a script or another service hitting `POST /pay` directly instead of a human clicking through the UI. This is deliberately shaped to be easy to sit behind an **x402-style** ("HTTP 402 Payment Required") convention some agent-payment tooling is converging on, so agent builders can treat Brazen as a settlement leg rather than a UI they have to route users through.

## Components

### 1. `SourceVault.sol` (Ethereum Sepolia)
Holds deposited USDC. Accepts a gasless deposit via **EIP-3009 `transferWithAuthorization`** — the user signs a message off-chain (no transaction, no gas), and the relayer submits it on their behalf. Emits `BridgeRequested(user, amount, destChainId, nonce)`.

> Fallback if the testnet USDC deployment doesn't support EIP-3009 cleanly, or if time is short: standard `approve` + relayer-called `transferFrom`. The user still pays no gas on their own — they just need one `approve` transaction, which is slightly less "magic" than a pure signature but still fully functional as a demo. Decide this early (Day 1), don't discover it Day 2 morning.

### 2. `DestPool.sol` (HSK Chain Testnet)
Pre-funded with test stablecoin. Only the relayer address can call `release(recipient, amount)`. This is what makes the bridge *fast* — funds move the instant the relayer decides, without waiting for source-chain finality or a cross-chain message to arrive. Takes a fee (basis points) before releasing.

### 3. The API layer (`POST /pay`, `GET /status/:id`)
The thin surface both front doors go through. The app calls it after a human signs; an external agent or service calls it directly. It takes `{ fromChain, toChain, amount, recipient, signature }` and returns a status object with both transaction hashes once complete — same contract, same guarantees, no special-casing for who's calling.

### 4. The Agent (relayer service)
Not a black box "AI decides everything" — split into two layers on purpose:
- **Router (deterministic):** compares live gas price on Sepolia vs HSK, checks `DestPool` liquidity, computes the fee. This logic must be deterministic and testable — an LLM should never be the thing directly deciding how much of a user's money moves.
- **Explainer (LLM):** takes the router's decision and turns it into a natural-language response for the UI — "Routed via HSK testnet, gas cost ~$0.02, fee 0.5 USDC, done in 8s." This is where the "AI agent" story lives for the demo, without putting an LLM in the custody path.

### 5. Frontend (one client of the rail, not the whole product)
Wallet connect → sign permit (recipient defaults to self, but can be set to any address) → poll/subscribe to relayer status via the same API layer above → show receipt with both explorer links (Sepolia + HSK testnet).

## Trust model — say this out loud in the pitch

This is a **custodial fast-bridge**: the relayer controls the `DestPool` funds and decides when to release. Users are trusting the relayer's key and liquidity, not a trustless cross-chain message protocol. This is exactly how early versions of Across Protocol and Hop worked — it's a legitimate, well-understood MVP pattern, not a shortcut you need to hide.

State it plainly to judges: *"v1 uses a permissioned relayer for speed. v2 decentralizes release via a bonded watcher/attestation network — see Roadmap."* Judges consistently reward teams that name their trust assumptions over teams that quietly gloss over them.

## Why "fast" specifically

Canonical bridges wait for source-chain finality + a message to be relayed and verified on the destination chain — this is minutes to tens of minutes. Brazen instead **fronts liquidity**: the destination pool is already funded, so release happens the moment the agent sees the source deposit land, no waiting on finality or a message-passing protocol. The tradeoff is the custodial risk above — that tradeoff *is* the product decision, and it's worth stating clearly rather than hiding.

## Real-time requirement for the demo

Everything above must run against live testnets, not a mocked backend:
- Every step should produce a real Sepolia Etherscan link and a real HSK testnet explorer link.
- Rehearse the full round trip at least twice before the actual demo slot — testnet RPC flakiness and faucet rate limits are the #1 cause of failed live demos, not code bugs.
