// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    uint256 public constant MAX_MINT_PER_CALL = 10_000 * 10 ** 6;

    error MintAmountTooHigh();

    constructor() ERC20("Brazen Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        if (amount > MAX_MINT_PER_CALL) revert MintAmountTooHigh();
        _mint(to, amount);
    }
}
