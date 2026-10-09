# Architecture

## One-Sentence Summary

A payer — human or autonomous agent — authorizes a payment request on the source chain (Stellar Soroban `source_vault`) → the relayer indexes the contract event, validates liquidity on the destination pool (`dest_pool`), and releases funds near-instantaneously to the designated recipient minus a small network fee.

---

## The Core Design Decision: Recipient is a First-Class Parameter

Traditional cross-chain bridges assume the destination recipient is always the source sender (`recipient == payer`). 

Brazen treats `recipient` as an explicit, first-class parameter across its Soroban contracts:
- `SourceVault::deposit(payer, recipient, amount, dest_chain_id)` records the destination address explicitly in the `pay_req` contract event.
- `DestPool::release(recipient, amount, source_ref)` executes the transfer directly to that destination recipient.

This design transforms Brazen from a personal bridge into an **agentic payment and settlement rail**, allowing autonomous agents to pay suppliers, subagents, or merchants on different chains in single transactions.

---

## Interaction Flows

### 1. Human / dApp Flow

```
User Wallet                Relayer Daemon               Source (source_vault)         Destination (dest_pool)
    |                            |                                |                              |
    |--invokes deposit()-------->|                                |                              |
    |  (payer auth, SEP-41)      |                                |--emits `pay_req` event       |
    |                            |<--indexes event----------------|                              |
    |                            |                                                               |
    |                            |--checks pool liquidity & fee--------------------------------->|
    |                            |--invokes release(recipient, amount, source_ref)-------------->|
    |                            |                                                               |--transfers to recipient
    |<--status: "Settled in <5s"-|                                                               |
```

### 2. Autonomous Agent / Programmatic API Flow

```
Agent A                     POST /api/pay                Relayer Daemon               Agent B's Account
(Caller)                     { amount, recipient,               |                         (Destination)
    |                          dest_chain_id }                  |                               |
    |--submits signed deposit--->|                              |                               |
    |                            |--monitors source_vault tx--->|                               |
    |                            |--relays release call to dest_pool--------------------------->|
    |<--{ status: 'settled', tx_hashes }------------------------|                               |--Agent B receives funds
```

---

## Core Components

### 1. `source_vault` (Stellar Soroban Contract)
- Manages collateral escrow on Stellar using SEP-41 token interfaces.
- Requires explicit payer authorization (`payer.require_auth()`).
- Emits structured `pay_req` contract events capturing `payer`, `recipient`, `amount`, `dest_chain_id`, and incremental sequence `nonce`.

### 2. `dest_pool` (Stellar Soroban Contract)
- Manages pre-funded liquidity for instant destination payouts.
- Restricts payout execution to authorized relayer keys (`relayer.require_auth()`).
- Calculates dynamic or basis-point fees (`fee_bps`) and deducts them from payout.
- Includes emergency pause controls (`pause`, `unpause`) callable by the pool administrator.

### 3. Off-Chain Relayer Engine (`relayer/`)
- Event stream consumer monitoring Soroban RPC event topics.
- Deterministic routing engine calculating fees and verifying destination liquidity.
- Multi-chain transaction builder submitting signed release transactions.

### 4. Web Interface & SDK (`frontend/`)
- Next.js application providing bridge and payment UI.
- Wallet connector supporting Freighter and Stellar Web Authenticator.
