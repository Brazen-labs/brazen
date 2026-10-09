// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20Permit3009} from "./interfaces/IERC20Permit3009.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SourceVault {
    using SafeERC20 for IERC20Permit3009;

    IERC20Permit3009 public immutable token;
    address public immutable relayer;

    uint256 private _fallbackNonce;

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
    error ZeroAddress();

    constructor(address token_, address relayer_) {
        if (token_ == address(0)) revert ZeroAddress();
        if (relayer_ == address(0)) revert ZeroAddress();
        token = IERC20Permit3009(token_);
        relayer = relayer_;
    }

    function depositWithAuthorization(
        address payer,
        address recipient,
        uint256 amount,
        uint256 destChainId,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        if (msg.sender != relayer) revert NotRelayer();
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroRecipient();

        token.transferWithAuthorization(payer, address(this), amount, validAfter, validBefore, nonce, v, r, s);

        // slither-disable-next-line reentrancy-events -- event must follow the transfer to report a completed payment; no state written after the call
        emit PaymentRequested(payer, recipient, amount, destChainId, uint256(nonce));
    }

    function deposit(address payer, address recipient, uint256 amount, uint256 destChainId) external {
        if (msg.sender != relayer) revert NotRelayer();
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroRecipient();

        uint256 nonce = _fallbackNonce++;

        // slither-disable-next-line arbitrary-send-erc20 -- relayer-gated by NotRelayer; payer must have pre-approved this vault
        token.safeTransferFrom(payer, address(this), amount);

        emit PaymentRequested(payer, recipient, amount, destChainId, nonce);
    }
}
