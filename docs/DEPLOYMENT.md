# Deployment Guide

## 0. Prerequisites

- [ ] Foundry installed (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- [ ] A relayer wallet (fresh, hackathon-only key — never reuse a personal wallet) funded with:
  - Sepolia testnet ETH (from a faucet — get this early, faucets rate-limit and sometimes queue)
  - HSK testnet HSK (check hsk.xyz docs for the current faucet)
- [ ] RPC URLs: Alchemy/Infura Sepolia URL, and `https://testnet.hsk.xyz` for HSK
- [ ] Confirm the Sepolia USDC address against developers.circle.com (see `SMART_CONTRACTS.md`)
- [ ] Confirm what stablecoin exists on HSK testnet, or plan to deploy your own mock ERC20 there

## 1. Contracts

```bash
cd contracts
cp .env.example .env
# fill in: PRIVATE_KEY, SEPOLIA_RPC_URL, HSK_RPC_URL, USDC_SEPOLIA_ADDRESS

forge install
forge test
forge snapshot        # record gas baseline

# Deploy SourceVault to Sepolia
forge script script/DeploySourceVault.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast --verify

# Deploy DestPool to HSK testnet
forge script script/DeployDestPool.s.sol \
  --rpc-url $HSK_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

Note the two deployed addresses — you'll need them in both `relayer/.env` and `frontend/.env.local`.

## 2. Fund `DestPool`

Send test stablecoin directly to the deployed `DestPool` address on HSK testnet — this is the liquidity the relayer releases from. Fund with enough to cover several demo runs plus buffer (rehearsals count).

## 3. Relayer

```bash
cd relayer
cp .env.example .env
# fill in: PRIVATE_KEY (same relayer wallet), SEPOLIA_RPC_URL, HSK_RPC_URL,
#          SOURCE_VAULT_ADDRESS, DEST_POOL_ADDRESS, ANTHROPIC_API_KEY

npm install
npm run dev     # runs locally against live testnets — do this before deploying to Render/Railway
```

Once it works locally end-to-end (a test deposit → release round trip via a script or curl), deploy to Render/Railway:
- New Web Service → point at the `relayer/` directory → set the same env vars in the dashboard (never commit `.env`) → deploy.
- Confirm the hosted relayer's public API URL — this goes into `frontend/.env.local`.

## 4. Frontend

```bash
cd frontend
cp .env.example .env.local
# fill in: NEXT_PUBLIC_SOURCE_VAULT_ADDRESS, NEXT_PUBLIC_DEST_POOL_ADDRESS,
#          NEXT_PUBLIC_RELAYER_API_URL, NEXT_PUBLIC_SEPOLIA_RPC_URL, NEXT_PUBLIC_HSK_RPC_URL

npm install
npm run dev      # test locally against the live relayer + live testnets
```

Deploy to Vercel: connect the repo, set the `frontend/` directory as root, add the same env vars in the Vercel dashboard, deploy. You get a shareable demo URL — send this to the judges/organizers ahead of your slot if allowed.

## 5. Pre-demo smoke test (do this hours before, not minutes before)

- [ ] Full round trip from the live frontend URL: connect wallet → sign → see status update → see both explorer links resolve to real, confirmed transactions.
- [ ] Full round trip via `relayer/scripts/agent-to-agent-demo.ts` against the live, hosted relayer (not localhost) — two funded test wallets, Agent A pays Agent B, recipient ends up different from payer, both explorer links resolve. This is the proof that the API is a real payment rail and not just plumbing behind the UI.
- [ ] Do both of the above **at least twice** — testnet RPCs and faucets are the most common cause of a live demo failing, not your code.
- [ ] Have a backup: a short screen recording of a successful run of each, in case testnet RPC/faucet issues hit during your actual slot.
- [ ] Sanity-check `DestPool` still has enough liquidity after rehearsals — top it up again right before your slot if needed.

## 6. Mainnet migration (post-hackathon, for the roadmap)

- Re-deploy both contracts with mainnet Circle USDC addresses (per chain — re-verify each one).
- Move owner/admin functions behind a multisig.
- Provision real `DestPool` liquidity (or open it to LPs — see `ROADMAP.md`).
- Get a security review before any real user funds touch it.
