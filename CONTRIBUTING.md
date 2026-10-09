# Contributing to Brazen

Thank you for your interest in contributing to **Brazen**! Brazen is an open, high-performance cross-chain liquidity and settlement protocol built on Stellar Soroban smart contracts and fast relayer networks.

Whether you're fixing bugs, adding Soroban contract features, improving frontend UI/UX, refining the relayer infrastructure, or enhancing documentation, your contributions are welcome.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Monorepo Overview](#monorepo-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
- [Development Workflow](#development-workflow)
  - [1. Branching Strategy](#1-branching-strategy)
  - [2. Commit Conventions](#2-commit-conventions)
  - [3. Testing Standards](#3-testing-standards)
  - [4. Code Style & Linting](#4-code-style--linting)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Security Issues](#reporting-security-issues)
- [Community & Communication](#community--communication)

---

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat others with respect and constructive professionalism.

---

## Monorepo Overview

Brazen is organized as a monorepo consisting of:

```
brazen/
├── contracts/          # Stellar Soroban smart contracts (Rust workspace)
│   ├── source_vault/   # Source chain escrow contract (SEP-41 tokens, pay_req events)
│   └── dest_pool/      # Destination liquidity pool contract (payouts, fee controls)
├── relayer/            # Off-chain settlement daemon (Node.js / TypeScript)
├── frontend/           # Modern web dApp (Next.js, React, Tailwind CSS)
└── docs/               # Protocol specifications, architecture & design guides
```

---

## Getting Started

### Prerequisites

Ensure you have installed:
- **Rust toolchain** (stable 1.80+): `rustup update stable`
- **Wasm target**: `rustup target add wasm32-unknown-unknown`
- **Soroban SDK / CLI**: compatible with Soroban protocol v22+
- **Node.js**: v20+ (LTS)
- **pnpm** or **npm**

### Installation & Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/brazen.git
   cd brazen
   ```

2. Test the Soroban smart contracts:
   ```bash
   cd contracts
   cargo test
   cargo build --target wasm32-unknown-unknown --release
   cd ..
   ```

3. Set up the frontend and relayer dependencies:
   ```bash
   cd frontend && npm install && cd ..
   cd relayer && npm install && cd ..
   ```

---

## Development Workflow

### 1. Branching Strategy

- `main` is our production/release-ready branch.
- Create feature or fix branches from `main`:
  - `feat/soroban-vault-enhancement`
  - `fix/relayer-event-polling`
  - `docs/clarify-sep41-interactions`

### 2. Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(...)`: New feature (e.g., `feat(contracts): add timelock refund mechanism`)
- `fix(...)`: Bug fix (e.g., `fix(relayer): handle reorgs during event indexing`)
- `docs(...)`: Documentation changes
- `test(...)`: Adding or updating test cases
- `refactor(...)`: Code refactoring without behavior change
- `chore(...)`: Maintenance, dependency updates

### 3. Testing Standards

- **Smart Contracts**: All Soroban contract modifications must include corresponding unit tests under `contracts/<crate>/src/lib.rs` (or `tests/`). Ensure zero regression with:
  ```bash
  cd contracts && cargo test
  ```
- **Relayer**: Validate error handling, event deserialization, and re-submission queues.
- **Frontend**: Ensure components render cleanly without hydration mismatches or console errors.

### 4. Code Style & Linting

- **Rust**:
  ```bash
  cd contracts
  cargo fmt --check
  cargo clippy --all-targets -- -D warnings
  ```
- **TypeScript / Web**:
  ```bash
  npm run lint
  ```

---

## Submitting a Pull Request

1. Push your branch to your fork on GitHub.
2. Open a Pull Request targeting `main`.
3. Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md):
   - Clear description of the motivation and changes made.
   - Reference any related issues (e.g., `Closes #12`).
   - Confirm test results and provide proof or terminal outputs.
4. Keep PRs focused; avoid mixing unrelated changes.

---

## Reporting Security Issues

Please **do not** open public GitHub issues for sensitive security vulnerabilities. Follow the procedures outlined in [SECURITY.md](SECURITY.md) to report vulnerabilities privately.

---

## Community & Communication

Have questions or want to discuss architectural improvements?
- Open an [Issue](https://github.com/Brazen-labs/brazen/issues)
- Check our [Architecture Documentation](docs/ARCHITECTURE.md) and [Soroban Specifications](docs/SOROBAN_ARCHITECTURE.md)
