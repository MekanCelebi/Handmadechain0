// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HandmadeNFT is ERC721URIStorage, ReentrancyGuard, Ownable {
    uint256 private _nextTokenId;

    // NFT fiyatlarını tutacak mapping
    mapping(uint256 => uint256) private _tokenPrices;
    
    // NFT oluşturucularını tutacak mapping
    mapping(uint256 => address) private _tokenCreators;

    // Escrow işlemleri için yapı
    struct Escrow {
        address buyer;
        uint256 amount;
        bool isActive;
        uint256 timestamp;
    }

    // Escrow işlemlerini tutacak mapping
    mapping(uint256 => Escrow) private _escrows;

    // İşlem durumları için sabitler
    uint256 public constant ESCROW_TIMEOUT = 7 days;
    uint256 public PLATFORM_FEE = 250; // %2.5
    uint256 public constant BASIS_POINTS = 10000;

    event NFTMinted(address indexed creator, uint256 indexed tokenId, string tokenURI, uint256 price);
    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event EscrowCreated(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event EscrowReleased(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 amount);
    event EscrowRefunded(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event DebugMintNFT(address indexed sender, uint256 tokenId, string tokenURI, uint256 price);

    constructor() ERC721("Handmade NFT", "HNFT") Ownable() {}

    function mintNFT(string memory tokenURI, uint256 price) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        emit DebugMintNFT(msg.sender, tokenId, tokenURI, price);
        return tokenId;
    }

    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    function getTokenPrice(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenPrices[tokenId];
    }

    function getTokenCreator(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenCreators[tokenId];
    }

    function updateTokenPrice(uint256 tokenId, uint256 newPrice) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(newPrice > 0, "Price must be greater than 0");
        _tokenPrices[tokenId] = newPrice;
        
        emit ItemListed(tokenId, msg.sender, newPrice);
    }

    function createEscrow(uint256 tokenId) external payable nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(msg.value >= _tokenPrices[tokenId], "Insufficient payment");
        require(ownerOf(tokenId) != msg.sender, "Cannot buy your own NFT");
        require(_escrows[tokenId].isActive == false, "Escrow already exists");

        _escrows[tokenId] = Escrow({
            buyer: msg.sender,
            amount: msg.value,
            isActive: true,
            timestamp: block.timestamp
        });

        emit EscrowCreated(tokenId, msg.sender, msg.value);
    }

    function releaseEscrow(uint256 tokenId) external nonReentrant {
        Escrow storage escrow = _escrows[tokenId];
        require(escrow.isActive, "No active escrow");
        require(ownerOf(tokenId) == msg.sender, "Not the seller");
        require(block.timestamp <= escrow.timestamp + ESCROW_TIMEOUT, "Escrow expired");

        address buyer = escrow.buyer;
        uint256 amount = escrow.amount;
        uint256 platformFee = (amount * PLATFORM_FEE) / BASIS_POINTS;
        uint256 sellerAmount = amount - platformFee;

        // Transfer NFT to buyer
        _transfer(msg.sender, buyer, tokenId);

        // Transfer payment to seller
        (bool success, ) = payable(msg.sender).call{value: sellerAmount}("");
        require(success, "Transfer failed");

        // Transfer platform fee to owner
        (bool feeSuccess, ) = payable(owner()).call{value: platformFee}("");
        require(feeSuccess, "Fee transfer failed");

        // Clear escrow
        delete _escrows[tokenId];

        emit EscrowReleased(tokenId, buyer, msg.sender, amount);
        emit ItemSold(tokenId, msg.sender, buyer, amount);
    }

    function refundEscrow(uint256 tokenId) external nonReentrant {
        Escrow storage escrow = _escrows[tokenId];
        require(escrow.isActive, "No active escrow");
        require(escrow.buyer == msg.sender, "Not the buyer");
        require(block.timestamp > escrow.timestamp + ESCROW_TIMEOUT, "Escrow not expired");

        uint256 amount = escrow.amount;

        // Clear escrow
        delete _escrows[tokenId];

        // Refund buyer
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund failed");

        emit EscrowRefunded(tokenId, msg.sender, amount);
    }

    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // Emergency functions for owner
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        PLATFORM_FEE = newFee;
    }
} 