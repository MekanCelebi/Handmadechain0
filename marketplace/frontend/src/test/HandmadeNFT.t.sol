// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/HandmadeNFT.sol";

contract HandmadeNFTTest is Test {
    HandmadeNFT public nft;
    address public owner;
    address public seller;
    address public buyer;
    uint256 public constant PRICE = 1 ether;

    function setUp() public {
        owner = makeAddr("owner");
        seller = makeAddr("seller");
        buyer = makeAddr("buyer");

        vm.startPrank(owner);
        nft = new HandmadeNFT();
        vm.stopPrank();

        // Fund accounts
        vm.deal(seller, 10 ether);
        vm.deal(buyer, 10 ether);
    }

    function test_MintNFT() public {
        vm.startPrank(seller);
        nft.mintNFT("ipfs://test", PRICE);
        vm.stopPrank();

        assertEq(nft.ownerOf(0), seller);
        assertEq(nft.tokenURI(0), "ipfs://test");
    }

    function test_TransferNFT() public {
        vm.startPrank(seller);
        nft.mintNFT("ipfs://test", PRICE);
        nft.transferFrom(seller, buyer, 0);
        vm.stopPrank();

        assertEq(nft.ownerOf(0), buyer);
    }

    function testFail_TransferNFTWithoutApproval() public {
        vm.startPrank(seller);
        nft.mintNFT("ipfs://test", PRICE);
        vm.stopPrank();

        vm.startPrank(buyer);
        nft.transferFrom(seller, buyer, 0);
        vm.stopPrank();
    }

    function test_ApproveAndTransferNFT() public {
        vm.startPrank(seller);
        nft.mintNFT("ipfs://test", PRICE);
        nft.approve(buyer, 0);
        vm.stopPrank();

        vm.startPrank(buyer);
        nft.transferFrom(seller, buyer, 0);
        vm.stopPrank();

        assertEq(nft.ownerOf(0), buyer);
    }

    function test_SetApprovalForAll() public {
        vm.startPrank(seller);
        nft.mintNFT("ipfs://test1", PRICE);
        nft.mintNFT("ipfs://test2", PRICE);
        nft.setApprovalForAll(buyer, true);
        vm.stopPrank();

        vm.startPrank(buyer);
        nft.transferFrom(seller, buyer, 0);
        nft.transferFrom(seller, buyer, 1);
        vm.stopPrank();

        assertEq(nft.ownerOf(0), buyer);
        assertEq(nft.ownerOf(1), buyer);
    }

    function test_TransferOwnership() public {
        vm.startPrank(owner);
        nft.transferOwnership(seller);
        vm.stopPrank();

        assertEq(nft.owner(), seller);
    }

    function testFail_TransferOwnershipByNonOwner() public {
        vm.startPrank(seller);
        nft.transferOwnership(buyer);
        vm.stopPrank();
    }

    function test_CompletePurchase() public {
        // Seller bir NFT oluşturur
        vm.startPrank(seller);
        nft.mintNFT("ipfs://test", PRICE);
        vm.stopPrank();

        // Buyer NFT'yi satın almak için escrow oluşturur
        vm.startPrank(buyer);
        nft.createEscrow{value: PRICE}(0);
        vm.stopPrank();

        // Seller escrow'u serbest bırakır
        vm.startPrank(seller);
        nft.releaseEscrow(0);
        vm.stopPrank();

        // NFT'nin artık buyer'a ait olduğunu kontrol et
        assertEq(nft.ownerOf(0), buyer);
    }
} 