# Stellar Soroban Smart Contract Architecture

Brazen utilizes **Stellar Soroban** smart contracts (written in Rust using `soroban-sdk` v27+) for cross-chain liquidity escrow, settlement authorization, and fast payout releases.

---

## 1. System Overview

```
                      +---------------------------------------+
                      |           Source Chain (Stellar)      |
                      |                                       |
                      |  [Payer]                              |
                      |     |                                 |
                      |     v  deposit()                      |
                      |  +-----------------------------+      |
                      |  |      source_vault           |      |
                      |  | (Escrows SEP-41 tokens)     |      |
                      |  +-----------------------------+      |
                      |     |                                 |
                      |     +--> Emits `pay_req` Event         |
                      +-------------------|-------------------+
                                          |
                                          | Event Observed
                                          v
                              +-----------------------+
                              |   Relayer Network     |
                              |   (Off-chain daemon)  |
                              +-----------------------+
                                          |
                                          | Calls release()
                                          v
                      +---------------------------------------+
                      |         Destination Chain             |
                      |                                       |
                      |  +-----------------------------+      |
                      |  |       dest_pool             |      |
                      |  | (Pre-funded LP Pool)        |      |
                      |  +-----------------------------+      |
                      |     |                                 |
                      |     +--> Transfers payout             |
                      |          minus fee_bps                |
                      |     v                                 |
                      |  [Recipient]                          |
                      +---------------------------------------+
```

---

## 2. Contracts Specification

### `source_vault`

The source vault accepts token deposits on the source chain, safely holds collateral in escrow, and emits standardized events containing all routing instructions required by destination relayers.

#### Storage Keys (`DataKey`)
- `DataKey::Token`: `Address` of the accepted SEP-41 token contract.
- `DataKey::Relayer`: `Address` of the authorized relayer account.
- `DataKey::Nonce`: `u64` monotonic sequence counter ensuring payment request uniqueness.

#### Public Interface
```rust
pub fn initialize(env: Env, token: Address, relayer: Address) -> Result<(), Error>;

pub fn deposit(
    env: Env,
    payer: Address,
    recipient: String,
    amount: i128,
    dest_chain_id: u64,
) -> Result<u64, Error>;

pub fn get_token(env: Env) -> Result<Address, Error>;
pub fn get_relayer(env: Env) -> Result<Address, Error>;
pub fn get_nonce(env: Env) -> Result<u64, Error>;
```

#### Event Schema: `pay_req`
- **Topics**: `(Symbol("pay_req"), payer: Address)`
- **Data**: `(recipient: String, amount: i128, dest_chain_id: u64, nonce: u64)`

---

### `dest_pool`

The destination pool is a pre-funded liquidity contract that immediately disburses funds to cross-chain recipients upon verified relayer instruction.

#### Storage Keys (`DataKey`)
- `DataKey::Token`: `Address` of the payout SEP-41 token.
- `DataKey::Relayer`: `Address` authorized to trigger immediate releases.
- `DataKey::Owner`: `Address` with administrative privileges (fee setting, fee withdrawal, circuit breaker).
- `DataKey::FeeBps`: `u32` protocol fee in basis points (1 bp = 0.01%).
- `DataKey::Paused`: `bool` emergency circuit breaker flag.

#### Public Interface
```rust
pub fn initialize(
    env: Env,
    token: Address,
    relayer: Address,
    owner: Address,
    fee_bps: u32,
) -> Result<(), Error>;

pub fn release(
    env: Env,
    recipient: Address,
    amount: i128,
    source_ref: BytesN<32>,
) -> Result<i128, Error>;

pub fn set_fee_bps(env: Env, new_fee_bps: u32) -> Result<(), Error>;
pub fn pause(env: Env) -> Result<(), Error>;
pub fn unpause(env: Env) -> Result<(), Error>;
pub fn withdraw_fees(env: Env, to: Address, amount: i128) -> Result<(), Error>;
```

#### Event Schema: `released`
- **Topics**: `(Symbol("released"), recipient: Address)`
- **Data**: `(source_ref: BytesN<32>, amount: i128, fee: i128, net_payout: i128)`

---

## 3. Authorization & Security Model

1. **Explicit Authentication (`require_auth`)**:
   - `deposit()` requires `payer.require_auth()`, ensuring only the owner of the tokens can authorize the escrow transfer.
   - `release()` requires `relayer.require_auth()`, preventing unauthorized drains on the pool.
   - Administrative functions (`pause`, `unpause`, `withdraw_fees`, `set_fee_bps`) require `owner.require_auth()`.

2. **SEP-41 Standard Asset Compliance**:
   - All token transfers leverage standard `token::Client::new(&env, &token).transfer(...)`.
   - Compatible with Stellar native SAC (Stellar Asset Contract) as well as custom token contracts.

3. **Circuit Breakers**:
   - The contract incorporates a zero-latency `pause()` toggle callable by the pool administrator in case of off-chain anomalies or relayer reorgs.
