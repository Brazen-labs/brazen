# Brazen Contributor Development Guide

This guide provides deep technical instructions for building, running, and contributing to the Brazen monorepo.

---

## 1. Environment Setup

### Rust & Soroban Toolchain
Ensure you have the latest Rust stable release and the WebAssembly target:
```bash
rustup default stable
rustup update stable
rustup target add wasm32-unknown-unknown
```

Install or update the Stellar CLI:
```bash
cargo install --locked stellar-cli --features opt
```

Verify your installation:
```bash
stellar --version
```

### Node.js & Package Manager
Brazen requires Node.js v20.x or later:
```bash
node -v   # v20+ recommended
npm -v
```

---

## 2. Working with Smart Contracts

The smart contracts are located in [`contracts/`](../contracts/).

### Running the Test Suite
The contracts include native Rust unit tests utilizing the Soroban mock environment:
```bash
cd contracts
cargo test
```

### Compiling to WASM
To build optimized WebAssembly binaries:
```bash
cargo build --target wasm32-unknown-unknown --release
```

Compiled WASM artifacts will be generated in `target/wasm32-unknown-unknown/release/`:
- `brazen_source_vault.wasm`
- `brazen_dest_pool.wasm`

### Contract Optimization
Use the Stellar CLI to optimize WASM binaries for minimum footprint:
```bash
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/brazen_source_vault.wasm
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/brazen_dest_pool.wasm
```

### Local Sandbox Testing
To deploy and test contracts against a local Soroban standalone node:
1. Start local standalone container:
   ```bash
   docker run --rm -it -p 8000:8000 --name stellar stellar/quickstart:testing --standalone --enable-soroban-rpc
   ```
2. Configure network in Stellar CLI:
   ```bash
   stellar network add --rpc-url http://localhost:8000/soroban/rpc --network-passphrase "Standalone Network ; February 2017" local
   ```

---

## 3. Working with the Relayer

The relayer lives in [`relayer/`](../relayer/).

### Setup
```bash
cd relayer
npm install
```

### Configuration
Copy `.env.example` to `.env` and fill in:
- `SOROBAN_RPC_URL`
- `SOURCE_VAULT_ADDRESS`
- `DEST_POOL_ADDRESS`
- `RELAYER_SECRET_KEY`

### Running the Relayer
```bash
npm run dev
```

---

## 4. Working with the Frontend

The frontend lives in [`frontend/`](../frontend/) and is built on Next.js, React, and Tailwind CSS.

### Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the dApp.

---

## 5. Submitting Your Contribution

1. Ensure all formatting and linter checks pass:
   ```bash
   # Rust contracts
   cd contracts && cargo fmt --check && cargo clippy -- -D warnings && cd ..

   # Frontend & Relayer
   cd frontend && npm run lint && cd ..
   ```
2. Commit changes using Conventional Commits:
   `git commit -m "feat(contracts): add timelock feature to source_vault"`
3. Push your branch to GitHub and create a Pull Request against `main`.
