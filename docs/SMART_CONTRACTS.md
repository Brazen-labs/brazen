# Smart Contracts

## Network config

| | Ethereum Sepolia | HSK Chain Testnet |
|---|---|---|
| Chain ID | `11155111` | `133` |
| RPC | Alchemy/Infura Sepolia endpoint | `https://testnet.hsk.xyz` |
| Native gas token | ETH (testnet) | HSK (testnet) |
| Explorer | sepolia.etherscan.io | HSK testnet explorer (check hsk.xyz docs for current URL) |
| Stablecoin | Circle testnet USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` — **verify against developers.circle.com before relying on this, testnet addresses can change** | Check HSK testnet explorer/faucet for an existing test USDC/USDT; if none exists, deploy your own mock ERC20 as the destination-side stand-in and say so plainly in the demo |

## `SourceVault.sol` (Sepolia)

**Purpose:** accept a gasless deposit and record the payment request — critically, with an explicit `recipient` separate from the payer, since this is what makes the rail usable for agent-to-agent payments and not just self-bridging.

```solidity
// pseudocode / spec — implement with Solidity ^0.8.24
contract SourceVault {
    IERC20 public immutable token;          // Circle testnet USDC
    address public immutable relayer;       // only address allowed to submit permits

    event PaymentRequested(
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        uint256 destChainId,
        uint256 nonce
    );

    error NotRelayer();
    error ZeroAmount();
    error ZeroRecipient();

    function depositWithAuthorization(
        address payer,
        address recipient,
        uint256 amount,
        uint256 destChainId,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v, bytes32 r, bytes32 s
    ) external {
        if (msg.sender != relayer) revert NotRelayer();
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroRecipient();
        // call token.transferWithAuthorization(payer, address(this), amount, validAfter, validBefore, nonce, v, r, s)
        emit PaymentRequested(payer, recipient, amount, destChainId, uint256(nonce));
    }
}
```

`recipient` defaults to `payer` in the frontend for a self-bridge, but the field always exists — an agent calling this via the relayer's `/pay` API sets `recipient` to a completely different wallet, on a different chain, in one call. Same event name change matters too: `PaymentRequested`, not `BridgeRequested` — the contract is a payment rail, self-bridging is one use of it.

**Fallback path (if EIP-3009 is flaky on the testnet deployment):** payer calls `token.approve(vault, amount)` themselves (their one and only gas-costing action), then relayer calls a plain `deposit(payer, recipient, amount, destChainId)` using `transferFrom`. Decide which path you're using on Day 1 morning — don't let this decision happen live during the demo.

## `DestPool.sol` (HSK testnet)

**Purpose:** pre-funded pool the relayer releases from immediately on seeing a valid source deposit — to the `recipient` recorded in `PaymentRequested`, which may or may not be the original payer. No changes needed here versus a simple self-bridge design; `release(recipient, amount, sourceRef)` already takes an arbitrary recipient. The agent-to-agent capability lives entirely in `SourceVault` recording the right recipient — this contract just pays whoever it's told to.

```solidity
contract DestPool {
    IERC20 public immutable token;
    address public relayer;
    address public owner;
    uint256 public feeBps;                  // e.g. 50 = 0.5%
    bool public paused;

    event Released(address indexed recipient, uint256 amount, uint256 fee, bytes32 sourceRef);

    error NotRelayer();
    error Paused();
    error InsufficientLiquidity();

    function release(address recipient, uint256 amount, bytes32 sourceRef) external {
        if (msg.sender != relayer) revert NotRelayer();
        if (paused) revert Paused();
        uint256 fee = (amount * feeBps) / 10_000;
        uint256 payout = amount - fee;
        if (token.balanceOf(address(this)) < payout) revert InsufficientLiquidity();
        token.transfer(recipient, payout);
        emit Released(recipient, payout, fee, sourceRef);
    }

    function pause() external { /* owner only, safety valve */ }
    function withdrawFees() external { /* owner only */ }
}
```

Use OpenZeppelin's `Ownable`, `Pausable`, and `ReentrancyGuard` rather than hand-rolling these — audited, cheap to import, and judges/graders recognize them as good practice.

## Gas optimization checklist

Since the stated goal is "little gas, ready for mainnet":

- [ ] Use **custom errors** instead of `require(..., "string")` — saves deployment and runtime gas.
- [ ] Mark external-only functions `external`, not `public`.
- [ ] Mark fixed-at-deploy addresses (`token`, initial `relayer`) as `immutable`.
- [ ] Pack struct fields to fit fewer storage slots if you add any structs (e.g. group a `uint128 amount` + `uint128 fee` in one slot instead of two `uint256`s).
- [ ] Avoid unbounded loops over dynamic arrays in any function that can be called externally.
- [ ] Emit events instead of storing history in contract storage wherever the data is only needed off-chain (indexers/relayer can read events — far cheaper than storage writes).
- [ ] Run `forge snapshot` after writing tests and again after any optimization pass — track the diff, put the before/after gas numbers in your pitch deck. Judges like concrete numbers here.
- [ ] Run `slither .` once before your final deploy — free, fast, catches reentrancy/access-control mistakes that would otherwise sink a "ready for mainnet" claim.

## Mainnet migration notes (for the roadmap slide / judge Q&A)

- Swap testnet USDC addresses for canonical mainnet Circle USDC per chain (mainnet addresses differ per chain — always re-verify via developers.circle.com, never reuse a testnet address).
- Relayer owner functions (`pause`, `withdrawFees`, changing `relayer`) should move behind a multisig (e.g. Safe) before any real funds are at risk — a single EOA owner is fine for a hackathon, not for mainnet.
- `DestPool` needs real liquidity provisioning — v1 you fund it yourself; v2 (see `ROADMAP.md`) opens this to LPs who earn a share of `feeBps`.
- Get an external audit or at minimum a thorough Slither + manual review pass before any mainnet deploy with real user funds — say this explicitly in your pitch, it's expected and respected, not a weakness.
