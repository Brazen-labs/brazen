# Mainnet deployment checklist

This is the gate for taking Brazen's contracts from testnet to a real chain with real funds. The deploy tooling (`contracts/script/*Mainnet.s.sol`, `contracts/.env.mainnet.example`, the `mainnet` / `mainnet_dest` entries in `foundry.toml`) exists so that when this checklist is satisfied, deploying is a matter of filling in `.env.mainnet` and running a script — not writing new code under pressure. Tooling existing does **not** mean any of these boxes are checked yet. As of this writing, nothing has been deployed to any mainnet.

Work through this in order. Do not skip ahead because a later item looks easier.

## a. Security review

- [ ] External security audit completed, **or** at minimum a thorough Slither + manual review pass completed
- [ ] All findings from that review resolved or explicitly accepted with written rationale

Per `docs/SMART_CONTRACTS.md`'s mainnet migration notes: *"Get an external audit or at minimum a thorough Slither + manual review pass before any mainnet deploy with real user funds — say this explicitly in your pitch, it's expected and respected, not a weakness."* This is not optional and not a formality — do not deploy past this item without it actually being done.

## b. Canonical USDC address

- [ ] Re-verified the real canonical Circle USDC address for the target source chain directly against [developers.circle.com](https://developers.circle.com) **immediately before deploying**
- [ ] Confirmed the address was not pulled from memory, from this repo's testnet config, or from any address cached from a prior session
- [ ] Repeated this per chain if deploying `SourceVault` to more than one mainnet

Mainnet USDC addresses differ per chain and Circle occasionally changes deployment details. A stale or wrong address here is unrecoverable once real funds move through it.

## c. Multisig ownership

- [ ] `MAINNET_OWNER_MULTISIG_ADDRESS` is an actual deployed multisig (e.g. a Safe), not an EOA
- [ ] The multisig's signer set and threshold have been reviewed and match the intended governance (who can call `pause`, `withdrawFees`, `setRelayer`)
- [ ] If the deployer's own EOA was ever added as a signer transiently for testing/setup, it has been removed before any real funds enter `DestPool`
- [ ] The deploy script itself does not enforce any of this — it accepts whatever address is passed. Verifying it's a real multisig is a manual step, done here, before running the script.

## d. Clean, tested commit

- [ ] `forge test` passes with zero failures on the exact commit being deployed
- [ ] `forge snapshot` run and reviewed for unexpected gas regressions
- [ ] `git status` shows no uncommitted changes — the deployed bytecode must trace back to a specific, tagged commit

## e. Final static analysis pass

- [ ] `slither .` run one more time on that exact commit, immediately before deploying
- [ ] Any new findings since the audit/review in (a) triaged and resolved

## f. `DestPool` liquidity plan

- [ ] Documented: who funds `DestPool`'s initial liquidity, and how much
- [ ] Documented: this funding is tracked as its own operational step, separate from the deploy transaction — the deploy script only creates the contract, it does not transfer liquidity into it
- [ ] A plan exists for topping up liquidity as volume grows, until Phase 3's LP model (`docs/ROADMAP.md`) ships

## g. Trust model disclosure

- [ ] Wherever this mainnet deployment is publicly announced, the trust model is stated plainly, the same requirement as the hackathon demo: a single relayer key is a custodial trust assumption, and this remains true on mainnet unless Phase 2's decentralized release (bonded watcher/attestation network, per `docs/ROADMAP.md`) has actually shipped by the time of this deploy
- [ ] If Phase 2 has not shipped, do not describe this deployment as "trustless" or imply otherwise anywhere in public-facing copy

## h. Rollback / incident plan

- [ ] Documented: who holds the relayer private key, how it is stored (hardware wallet / KMS / other — not a plaintext `.env` on a laptop), and who has access
- [ ] Documented: `pause()` on `DestPool` is owner-only (the multisig from item c) and halts `release()` — confirm the multisig's response time is fast enough to be useful in an incident, not a multi-day quorum process
- [ ] Documented: what actually happens if the relayer key is compromised — concretely:
  - Who is notified, and how (on-call contact, alert channel)
  - Who calls `pause()` and how fast that can realistically happen
  - How `setRelayer` is used to rotate to a new relayer key once the multisig is confident it's clean
  - What happens to in-flight source-chain deposits that haven't been released yet when the pause happens
  - Whether/how affected users are compensated if funds are lost before the pause lands
- [ ] This plan has been reviewed by more than one person on the team, not written and filed by one person alone

## Not covered by this checklist

This checklist is about deployment readiness, not about proving the system is safe for large real funds at scale — that is explicitly future work per `docs/ROADMAP.md` Phase 2 (decentralizing relayer trust) and Phase 3 (audit + LP-funded liquidity). Satisfying every box above is the minimum bar for a first real-funds mainnet deploy, not a claim that the custodial-relayer trust model has been eliminated.
