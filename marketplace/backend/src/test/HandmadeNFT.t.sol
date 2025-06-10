// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../src/HandmadeNFT.sol";

contract HandmadeNFTTest is Test {
    HandmadeNFT public nft;
    address public seller;
    address public buyer;
    uint256 public price;

    function setUp() public {
        // Deploy NFT contract
        nft = new HandmadeNFT();
        
        // Setup test accounts
        seller = makeAddr("seller");
        buyer = makeAddr("buyer");
        
        // Setup test NFT
        price = 1 ether;
        
        // Give some ETH to buyer
        vm.deal(buyer, 10 ether);
    }

    function testCompleteSale() public {
        // 1. Seller mints NFT
        vm.startPrank(seller);
        uint256 tokenId = nft.mintNFT("ipfs://test", price);
        vm.stopPrank();

        // 2. Buyer creates escrow
        vm.startPrank(buyer);
        nft.createEscrow{value: price}(tokenId);
        vm.stopPrank();

        // 3. Seller releases escrow (completes sale)
        vm.startPrank(seller);
        nft.releaseEscrow(tokenId);
        vm.stopPrank();

        // Verify final state
        assertEq(nft.ownerOf(tokenId), buyer, "NFT should be transferred to buyer");
        assertEq(address(nft).balance, 0, "Contract should have no balance");
        assertEq(seller.balance, price * 97 / 100, "Seller should receive 97% of price"); // 2.5% platform fee
    }

    function testRefundAfterTimeout() public {
        // 1. Seller mints NFT
        vm.startPrank(seller);
        uint256 tokenId = nft.mintNFT("ipfs://test", price);
        vm.stopPrank();

        // 2. Buyer creates escrow
        vm.startPrank(buyer);
        nft.createEscrow{value: price}(tokenId);
        vm.stopPrank();

        // 3. Time passes (more than ESCROW_TIMEOUT)
        vm.warp(block.timestamp + 8 days);

        // 4. Buyer requests refund
        vm.startPrank(buyer);
        nft.refundEscrow(tokenId);
        vm.stopPrank();

        // Verify final state
        assertEq(nft.ownerOf(tokenId), seller, "NFT should still be with seller");
        assertEq(address(nft).balance, 0, "Contract should have no balance");
        assertEq(buyer.balance, 10 ether, "Buyer should get full refund");
    }

    function testFailCreateEscrowWithInsufficientFunds() public {
        // 1. Seller mints NFT
        vm.startPrank(seller);
        uint256 tokenId = nft.mintNFT("ipfs://test", price);
        vm.stopPrank();

        // 2. Try to create escrow with insufficient funds
        vm.startPrank(buyer);
        nft.createEscrow{value: price - 1}(tokenId);
        vm.stopPrank();
    }

    function testFailCreateEscrowForOwnNFT() public {
        // 1. Seller mints NFT
        vm.startPrank(seller);
        uint256 tokenId = nft.mintNFT("ipfs://test", price);
        // 2. Try to create escrow for own NFT
        nft.createEscrow{value: price}(tokenId);
        vm.stopPrank();
    }

    function testFailReleaseEscrowByNonOwner() public {
        // 1. Seller mints NFT
        vm.startPrank(seller);
        uint256 tokenId = nft.mintNFT("ipfs://test", price);
        vm.stopPrank();

        // 2. Buyer creates escrow
        vm.startPrank(buyer);
        nft.createEscrow{value: price}(tokenId);
        // 3. Try to release escrow as buyer
        nft.releaseEscrow(tokenId);
        vm.stopPrank();
    }

    function testFailRefundBeforeTimeout() public {
        // 1. Seller mints NFT
        vm.startPrank(seller);
        uint256 tokenId = nft.mintNFT("ipfs://test", price);
        vm.stopPrank();

        // 2. Buyer creates escrow
        vm.startPrank(buyer);
        nft.createEscrow{value: price}(tokenId);
        // 3. Try to refund immediately
        nft.refundEscrow(tokenId);
        vm.stopPrank();
    }
} 