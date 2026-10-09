# Brazen Contracts (Stellar Soroban)

Production-grade Soroban smart contracts for cross-chain settlement on Stellar.

## Contracts Architecture

```
contracts/
├── Cargo.toml               # Soroban workspace manifest
├── source_vault/            # Source chain deposit vault
│   ├── Cargo.toml
│   └── src/lib.rs           # SourceVault implementation & tests
└── dest_pool/               # Destination chain liquidity pool
    ├── Cargo.toml
    └── src/lib.rs           # DestPool implementation & tests
```

### 1. `SourceVault`
Deployed on the source chain (Stellar):
- Receives SEP-41 token deposits from payers.
- Enforces explicit `payer.require_auth()`.
- Emits structured `pay_req` (`PaymentRequested`) contract events.
- Tracks monotonic deposit nonces for idempotency and relayer tracking.

### 2. `DestPool`
Deployed on the destination chain (Stellar):
- Holds fast-bridge liquidity in a designated SEP-41 token.
- Relayer calls `release(recipient, amount, source_ref)` with `relayer.require_auth()`.
- Computes configured protocol fees (`fee_bps`).
- Transfers net payout directly to the recipient wallet.
- Emits structured `released` contract events.
- Owner controls emergency circuit breaker (`pause` / `unpause`) and liquidity management (`withdraw_fees`).

## Build & Test

```bash
# Run unit and integration tests
cargo test

# Build optimized wasm binaries
cargo build --target wasm32-unknown-unknown --release
```
