// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract DeployMockUSDC is Script {
    function run() external returns (MockUSDC) {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(privateKey);
        MockUSDC token = new MockUSDC();
        vm.stopBroadcast();

        console2.log("MockUSDC deployed at:", address(token));
        return token;
    }
}
