// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DestPool is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public relayer;
    uint256 public immutable feeBps;

    event Released(address indexed recipient, uint256 amount, uint256 fee, bytes32 sourceRef);

    error NotRelayer();
    error ContractPaused();
    error InsufficientLiquidity();
    error ZeroAddress();
    error ZeroRecipient();
    error ZeroAmount();
    error FeeTooHigh();

    constructor(address token_, address relayer_, address owner_, uint256 feeBps_) Ownable(owner_) {
        if (token_ == address(0) || relayer_ == address(0) || owner_ == address(0)) revert ZeroAddress();
        if (feeBps_ > 10_000) revert FeeTooHigh();
        token = IERC20(token_);
        relayer = relayer_;
        feeBps = feeBps_;
    }

    function release(address recipient, uint256 amount, bytes32 sourceRef) external nonReentrant {
        if (msg.sender != relayer) revert NotRelayer();
        if (paused()) revert ContractPaused();
        if (recipient == address(0)) revert ZeroRecipient();
        if (amount == 0) revert ZeroAmount();
        uint256 fee = (amount * feeBps) / 10_000;
        uint256 payout = amount - fee;
        if (token.balanceOf(address(this)) < payout) revert InsufficientLiquidity();
        token.safeTransfer(recipient, payout);
        emit Released(recipient, payout, fee, sourceRef);
    }

    function setRelayer(address relayer_) external onlyOwner {
        if (relayer_ == address(0)) revert ZeroAddress();
        relayer = relayer_;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawFees() external onlyOwner nonReentrant {
        token.safeTransfer(owner(), token.balanceOf(address(this)));
    }
}
