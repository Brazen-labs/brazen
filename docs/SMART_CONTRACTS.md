# Smart Contracts (Stellar Soroban)

Brazen contracts are written in Rust using the `soroban-sdk` (v27+) and compiled to WebAssembly for execution on the Stellar network.

---

## 1. Network Configuration

| Property | Stellar Testnet | Stellar Mainnet |
|---|---|---|
| Network Passphrase | `Test SDF Network ; September 2015` | `Public Global Stellar Network ; September 2015` |
| RPC Endpoint | `https://soroban-testnet.stellar.org` | `https://mainnet.stellar.org:443` |
| Native Asset | Native XLM | Native XLM |
| Stablecoin | Circle USDC (Testnet SAC) | Circle USDC (Mainnet SAC) |
| Explorer | Stellar Expert (Testnet) | Stellar Expert (Public) |

---

## 2. Contracts Architecture

### `brazen-source-vault`

Accepts token deposits on the source chain, secures funds in contract storage, and emits standardized events for off-chain relayers to index and fulfill.

```rust
#[contract]
pub struct SourceVault;

#[contractimpl]
impl SourceVault {
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
}
```

- **Authentication**: `payer.require_auth()` guarantees only authorized account owners can transfer tokens into the vault.
- **Cross-Chain Routing**: Emits `pay_req` event with `(recipient, amount, dest_chain_id, nonce)`.

---

### `brazen-dest-pool`

A liquidity pool on the destination chain that quickly releases funds to the intended recipient upon verified relayer instruction.

```rust
#[contract]
pub struct DestPool;

#[contractimpl]
impl DestPool {
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
}
```

- **Authentication**:
  - `release()` requires `relayer.require_auth()`.
  - Administrative operations (`pause`, `unpause`, `withdraw_fees`, `set_fee_bps`) require `owner.require_auth()`.
- **Fee Calculation**: `fee = (amount * fee_bps) / 10_000`. Net amount (`amount - fee`) transferred to recipient.
- **Safety**: `paused` boolean guards release execution in emergencies.

---

## 3. Storage Model & State Footprint

Soroban employs instance and persistent storage ledgers with TTL (Time-To-Live) management:
- Contract configuration (`Token`, `Relayer`, `Owner`, `FeeBps`, `Paused`) resides in instance storage.
- Nonces are monotonically incremented and stored to prevent duplicate replay attempts.

---

## 4. Building and Testing

```bash
cd contracts

# Run unit tests
cargo test

# Build release WASM bytecode
cargo build --target wasm32-unknown-unknown --release
```
