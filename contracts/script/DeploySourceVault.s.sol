// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SourceVault} from "../src/SourceVault.sol";

contract DeploySourceVault is Script {
    function run() external returns (SourceVault) {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envAddress("SEPOLIA_USDC_ADDRESS");
        address relayer = vm.envAddress("SEPOLIA_RELAYER_ADDRESS");

        vm.startBroadcast(privateKey);
        SourceVault vault = new SourceVault(usdc, relayer);
        vm.stopBroadcast();

        console2.log("SourceVault deployed at:", address(vault));
        return vault;
    }
}
