const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

describe('NFT Marketplace Sale Tests', function () {
    let nftMarketplace;
    let owner;
    let seller;
    let buyer;
    let tokenId;
    const price = ethers.utils.parseEther('1.0'); // 1 ETH

    beforeEach(async function () {
        // Kontratı deploy et
        const NFTMarketplace = await ethers.getContractFactory('NFTMarketplace');
        [owner, seller, buyer] = await ethers.getSigners();
        nftMarketplace = await NFTMarketplace.deploy();
        await nftMarketplace.deployed();

        // Test NFT'si oluştur
        const tx = await nftMarketplace.connect(seller).mintNFT(
            'ipfs://test-uri',
            price
        );
        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === 'NFTMinted');
        tokenId = event.args.tokenId;
    });

    describe('NFT Listing', function () {
        it('should list NFT with correct price', async function () {
            const listing = await nftMarketplace.getNFTPrice(tokenId);
            expect(listing).to.equal(price);
        });

        it('should allow owner to update price', async function () {
            const newPrice = ethers.utils.parseEther('2.0');
            await nftMarketplace.connect(seller).updateTokenPrice(tokenId, newPrice);
            const updatedPrice = await nftMarketplace.getNFTPrice(tokenId);
            expect(updatedPrice).to.equal(newPrice);
        });

        it('should not allow non-owner to update price', async function () {
            const newPrice = ethers.utils.parseEther('2.0');
            await expect(
                nftMarketplace.connect(buyer).updateTokenPrice(tokenId, newPrice)
            ).to.be.revertedWith('Not token owner');
        });
    });

    describe('NFT Purchase', function () {
        it('should create escrow when buyer purchases NFT', async function () {
            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
            
            // NFT'yi satın al
            const tx = await nftMarketplace.connect(buyer).createEscrow(tokenId, {
                value: price
            });
            const receipt = await tx.wait();

            // Escrow detaylarını kontrol et
            const escrow = await nftMarketplace.getEscrowDetails(tokenId);
            expect(escrow.buyer).to.equal(buyer.address);
            expect(escrow.amount).to.equal(price);
            expect(escrow.isActive).to.be.true;

            // Bakiyeyi kontrol et
            const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            expect(buyerBalanceAfter).to.equal(
                buyerBalanceBefore.sub(price).sub(gasUsed)
            );
        });

        it('should not allow purchase with insufficient funds', async function () {
            const lowPrice = ethers.utils.parseEther('0.5');
            await expect(
                nftMarketplace.connect(buyer).createEscrow(tokenId, {
                    value: lowPrice
                })
            ).to.be.revertedWith('Insufficient payment');
        });

        it('should not allow owner to buy their own NFT', async function () {
            await expect(
                nftMarketplace.connect(seller).createEscrow(tokenId, {
                    value: price
                })
            ).to.be.revertedWith('Cannot buy your own NFT');
        });
    });

    describe('Escrow Release', function () {
        beforeEach(async function () {
            // Önce NFT'yi satın al
            await nftMarketplace.connect(buyer).createEscrow(tokenId, {
                value: price
            });
        });

        it('should allow seller to release escrow', async function () {
            const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
            
            // Escrow'u serbest bırak
            const tx = await nftMarketplace.connect(seller).releaseEscrow(tokenId);
            const receipt = await tx.wait();

            // NFT'nin sahibini kontrol et
            const newOwner = await nftMarketplace.ownerOf(tokenId);
            expect(newOwner).to.equal(buyer.address);

            // Satıcının bakiyesini kontrol et
            const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
            const platformFee = price.mul(250).div(10000); // %2.5 platform ücreti
            const expectedAmount = price.sub(platformFee);
            expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
        });

        it('should not allow non-seller to release escrow', async function () {
            await expect(
                nftMarketplace.connect(buyer).releaseEscrow(tokenId)
            ).to.be.revertedWith('Not the seller');
        });
    });

    describe('Escrow Refund', function () {
        beforeEach(async function () {
            // Önce NFT'yi satın al
            await nftMarketplace.connect(buyer).createEscrow(tokenId, {
                value: price
            });
        });

        it('should allow buyer to refund after timeout', async function () {
            // 7 gün bekle
            await time.increase(7 * 24 * 60 * 60 + 1);

            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
            
            // İade işlemini gerçekleştir
            const tx = await nftMarketplace.connect(buyer).refundEscrow(tokenId);
            const receipt = await tx.wait();

            // NFT'nin sahibini kontrol et
            const owner = await nftMarketplace.ownerOf(tokenId);
            expect(owner).to.equal(seller.address);

            // Alıcının bakiyesini kontrol et
            const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore.sub(gasUsed));
        });

        it('should not allow refund before timeout', async function () {
            await expect(
                nftMarketplace.connect(buyer).refundEscrow(tokenId)
            ).to.be.revertedWith('Escrow not expired');
        });

        it('should not allow non-buyer to refund', async function () {
            await time.increase(7 * 24 * 60 * 60 + 1);
            await expect(
                nftMarketplace.connect(seller).refundEscrow(tokenId)
            ).to.be.revertedWith('Not the buyer');
        });
    });
}); 