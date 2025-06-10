// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/HandmadeNFT.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        HandmadeNFT handmadeNFT = new HandmadeNFT();

        vm.stopBroadcast();

        console.log("HandmadeNFT deployed to:", address(handmadeNFT));
    }
} 