// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20WithAuthorization is ERC20 {
    mapping(bytes32 => bool) public authorizationUsed;

    error AuthorizationUsed();
    error AuthorizationNotYetValid();
    error AuthorizationExpired();

    constructor() ERC20("Mock USDC", "mUSDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8, /* v */
        bytes32, /* r */
        bytes32 /* s */
    ) external {
        if (block.timestamp <= validAfter) revert AuthorizationNotYetValid();
        if (block.timestamp >= validBefore) revert AuthorizationExpired();
        if (authorizationUsed[nonce]) revert AuthorizationUsed();
        authorizationUsed[nonce] = true;
        _transfer(from, to, value);
    }
}
