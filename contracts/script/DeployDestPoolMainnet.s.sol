// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {DestPool} from "../src/DestPool.sol";

contract DeployDestPoolMainnet is Script {
    function run() external returns (DestPool) {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address token = vm.envAddress("MAINNET_DEST_TOKEN_ADDRESS");
        address relayer = vm.envAddress("MAINNET_RELAYER_ADDRESS");
        address owner = vm.envAddress("MAINNET_OWNER_MULTISIG_ADDRESS");
        uint256 feeBps = vm.envUint("MAINNET_FEE_BPS");

        vm.startBroadcast(privateKey);
        DestPool pool = new DestPool(token, relayer, owner, feeBps);
        vm.stopBroadcast();

        console2.log("DestPool deployed at:", address(pool));
        return pool;
    }
}
