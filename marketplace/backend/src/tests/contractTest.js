import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { getNFTDetails, getContractMetadata } from '../services/alchemyService.js';

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const contractAddress = process.env.NFT_CONTRACT_ADDRESS;

// Kontrat ABI'si
const contractABI = [
    "function getEscrowDuration() view returns (uint256)",
    "function getPlatformFee() view returns (uint256)",
    "function getListingFee() view returns (uint256)",
    "function getMinPrice() view returns (uint256)",
    "function getMaxPrice() view returns (uint256)",
    "function getMaxListings() view returns (uint256)",
    "function getMaxActiveListings() view returns (uint256)",
    "function getMaxActiveListingsPerUser() view returns (uint256)",
    "function getMaxActiveListingsPerCollection() view returns (uint256)",
    "function getMaxActiveListingsPerCategory() view returns (uint256)",
    "function getMaxActiveListingsPerPriceRange() view returns (uint256)",
    "function getMaxActiveListingsPerTimeRange() view returns (uint256)",
    "function getMaxActiveListingsPerUserPerTimeRange() view returns (uint256)",
    "function getMaxActiveListingsPerCollectionPerTimeRange() view returns (uint256)",
    "function getMaxActiveListingsPerCategoryPerTimeRange() view returns (uint256)",
    "function getMaxActiveListingsPerPriceRangePerTimeRange() view returns (uint256)",
    "function getMaxActiveListingsPerUserPerPriceRange() view returns (uint256)",
    "function getMaxActiveListingsPerCollectionPerPriceRange() view returns (uint256)",
    "function getMaxActiveListingsPerCategoryPerPriceRange() view returns (uint256)",
    "function getMaxActiveListingsPerUserPerCategory() view returns (uint256)",
    "function getMaxActiveListingsPerCollectionPerCategory() view returns (uint256)",
    "function getMaxActiveListingsPerUserPerCollection() view returns (uint256)"
];

async function testContractParameters() {
    try {
        console.log('Kontrat Parametreleri Test Ediliyor...\n');

        // 1. Kontrat Metadata Kontrolü
        console.log('1. Kontrat Metadata Kontrolü:');
        const contractMetadata = await getContractMetadata(contractAddress);
        console.log('Kontrat Adı:', contractMetadata.name);
        console.log('Kontrat Sembolü:', contractMetadata.symbol);
        console.log('Toplam Supply:', contractMetadata.totalSupply);
        console.log('Kontrat Sahibi:', contractMetadata.owner);
        console.log('-------------------\n');

        // 2. Platform Ücreti Kontrolü
        console.log('2. Platform Ücreti Kontrolü:');
        const platformFee = 250; // %2.5
        console.log('Platform Ücreti:', platformFee / 100, '%');
        console.log('Basis Points:', 10000);
        console.log('-------------------\n');

        // 3. Escrow Süresi Kontrolü
        console.log('3. Escrow Süresi Kontrolü:');
        const escrowDuration = 7 * 24 * 60 * 60; // 7 gün (saniye cinsinden)
        console.log('Escrow Süresi:', escrowDuration / (24 * 60 * 60), 'gün');
        console.log('-------------------\n');

        // 4. RPC Bağlantı Kontrolü
        console.log('4. RPC Bağlantı Kontrolü:');
        const network = await provider.getNetwork();
        console.log('Ağ ID:', network.chainId);
        console.log('Ağ Adı:', network.name);
        console.log('-------------------\n');

        // 5. Alchemy API Kontrolü
        console.log('5. Alchemy API Kontrolü:');
        const testNFT = await getNFTDetails(contractAddress, 1);
        console.log('Test NFT Detayları:', testNFT ? 'Başarılı' : 'Başarısız');
        console.log('-------------------\n');

        // 6. Kontrat Fonksiyonları Kontrolü
        console.log('6. Kontrat Fonksiyonları Kontrolü:');
        const contract = new ethers.Contract(contractAddress, contractABI, provider);

        try {
            const escrowDurationFromContract = await contract.getEscrowDuration();
            console.log('Kontrat Escrow Süresi:', escrowDurationFromContract.toString() / (24 * 60 * 60), 'gün');
        } catch (error) {
            console.log('Escrow Süresi Alınamadı:', error.message);
        }

        try {
            const platformFeeFromContract = await contract.getPlatformFee();
            console.log('Kontrat Platform Ücreti:', platformFeeFromContract.toString() / 100, '%');
        } catch (error) {
            console.log('Platform Ücreti Alınamadı:', error.message);
        }

        try {
            const listingFeeFromContract = await contract.getListingFee();
            console.log('Kontrat Listing Ücreti:', ethers.utils.formatEther(listingFeeFromContract), 'ETH');
        } catch (error) {
            console.log('Listing Ücreti Alınamadı:', error.message);
        }

        console.log('-------------------\n');
        console.log('Tüm testler tamamlandı!');
    } catch (error) {
        console.error('Test sırasında hata oluştu:', error);
    }
}

// Testi çalıştır
testContractParameters(); 