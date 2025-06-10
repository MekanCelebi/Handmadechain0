// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HandmadeNFT is ERC721URIStorage, ReentrancyGuard, Ownable {
    uint256 private _nextTokenId;
    uint256 private _nextEscrowId;

    // Escrow işlemleri için yapı
    struct Escrow {
        address buyer;
        uint256 amount;
        bool isActive;
    }

    // Escrow işlemlerini tutacak mapping
    mapping(uint256 => Escrow) private _escrows;

    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);

    constructor() ERC721("Handmade NFT", "HNFT") Ownable() {
        _nextEscrowId = 1;
    }

    // ETH alabilmek için receive fonksiyonu
    receive() external payable {
        // ETH transferini kabul et
        require(msg.value > 0, "Amount must be greater than 0");
    }

    function mintNFT(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    // Escrow oluşturma fonksiyonu
    function createEscrow() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        
        uint256 escrowId = _nextEscrowId++;
        
        _escrows[escrowId] = Escrow({
            buyer: msg.sender,
            amount: msg.value,
            isActive: true
        });

        emit EscrowCreated(escrowId, msg.sender, msg.value);
    }

    // Escrow serbest bırakma fonksiyonu (sadece owner)
    function releaseEscrow(uint256 escrowId) external nonReentrant onlyOwner {
        Escrow storage escrow = _escrows[escrowId];
        require(escrow.isActive, "No active escrow");

        address buyer = escrow.buyer;
        uint256 amount = escrow.amount;

        // Clear escrow
        delete _escrows[escrowId];

        // Transfer funds to owner
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");

        emit EscrowReleased(escrowId, buyer, amount);
    }

    // Escrow iptal etme fonksiyonu (sadece buyer)
    function refundEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = _escrows[escrowId];
        require(escrow.isActive, "No active escrow");
        require(escrow.buyer == msg.sender, "Not the buyer");

        uint256 amount = escrow.amount;

        // Clear escrow
        delete _escrows[escrowId];

        // Refund buyer
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund failed");

        emit EscrowRefunded(escrowId, msg.sender, amount);
    }

    // Emergency functions for owner
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
} 