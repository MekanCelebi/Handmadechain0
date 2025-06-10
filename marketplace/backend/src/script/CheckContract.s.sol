// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/HandmadeNFT.sol";

contract CheckContract is Script {
    function run() external view {
        address contractAddress = 0x6c6c4DdcE5cd7D06006f8544bc7e0715590c92eC;
        
        // Create contract instance
        HandmadeNFT nft = HandmadeNFT(contractAddress);
        
        // Try to call getTokenPrice
        try nft.getTokenPrice(1) returns (uint256 price) {
            console.log("getTokenPrice(1) returned:", price);
        } catch Error(string memory reason) {
            console.log("Error calling getTokenPrice:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("Low level error calling getTokenPrice");
        }
    }
} 