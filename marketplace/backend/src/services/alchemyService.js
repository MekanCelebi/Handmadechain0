import { Network, Alchemy } from "alchemy-sdk";
import dotenv from 'dotenv';

dotenv.config();

// Alchemy ayarları
const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_SEPOLIA, // Sepolia testnet
};

const alchemy = new Alchemy(settings);

// NFT detaylarını getir
export const getNFTDetails = async (contractAddress, tokenId) => {
    try {
        const nft = await alchemy.nft.getNftMetadata(contractAddress, tokenId);
        return nft;
    } catch (error) {
        console.error('NFT detayları alınamadı:', error);
        throw error;
    }
};

// Kullanıcının NFT'lerini getir
export const getUserNFTs = async (address) => {
    try {
        const nfts = await alchemy.nft.getNftsForOwner(address);
        return nfts;
    } catch (error) {
        console.error('Kullanıcı NFT\'leri alınamadı:', error);
        throw error;
    }
};

// NFT transfer geçmişini getir
export const getNFTTransfers = async (contractAddress, tokenId) => {
    try {
        const transfers = await alchemy.nft.getNftTransfers({
            contractAddress,
            tokenId
        });
        return transfers;
    } catch (error) {
        console.error('NFT transfer geçmişi alınamadı:', error);
        throw error;
    }
};

// Kontrat detaylarını getir
export const getContractMetadata = async (contractAddress) => {
    try {
        const metadata = await alchemy.nft.getContractMetadata(contractAddress);
        return metadata;
    } catch (error) {
        console.error('Kontrat detayları alınamadı:', error);
        throw error;
    }
};

// NFT sahipliğini kontrol et
export const checkNFTOwnership = async (address, contractAddress, tokenId) => {
    try {
        const nfts = await alchemy.nft.getNftsForOwner(address);
        return nfts.ownedNfts.some(nft => 
            nft.contract.address.toLowerCase() === contractAddress.toLowerCase() && 
            nft.tokenId === tokenId
        );
    } catch (error) {
        console.error('NFT sahipliği kontrol edilemedi:', error);
        throw error;
    }
};

// NFT fiyat geçmişini getir
export const getNFTPriceHistory = async (contractAddress, tokenId) => {
    try {
        // Alchemy'nin fiyat geçmişi API'si henüz beta aşamasında
        // Bu fonksiyon ileride güncellenebilir
        const transfers = await getNFTTransfers(contractAddress, tokenId);
        return transfers;
    } catch (error) {
        console.error('NFT fiyat geçmişi alınamadı:', error);
        throw error;
    }
};

// NFT koleksiyonunu getir
export const getNFTCollection = async (contractAddress) => {
    try {
        const collection = await alchemy.nft.getNftsForContract(contractAddress);
        return collection;
    } catch (error) {
        console.error('NFT koleksiyonu alınamadı:', error);
        throw error;
    }
};

// NFT metadata'sını güncelle
export const updateNFTMetadata = async (contractAddress, tokenId, metadata) => {
    try {
        // Bu fonksiyon sadece kontrat sahibi tarafından kullanılabilir
        // Metadata güncelleme işlemi kontrat üzerinden yapılmalı
        console.log('Metadata güncelleme işlemi kontrat üzerinden yapılmalı');
        return null;
    } catch (error) {
        console.error('NFT metadata güncellenemedi:', error);
        throw error;
    }
};

// NFT'lerin floor price'ını getir
export const getNFTFloorPrice = async (contractAddress) => {
    try {
        const floorPrice = await alchemy.nft.getFloorPrice(contractAddress);
        return floorPrice;
    } catch (error) {
        console.error('NFT floor price alınamadı:', error);
        throw error;
    }
};

// NFT'lerin toplam supply'ini getir
export const getNFTTotalSupply = async (contractAddress) => {
    try {
        const supply = await alchemy.nft.getContractMetadata(contractAddress);
        return supply.totalSupply;
    } catch (error) {
        console.error('NFT toplam supply alınamadı:', error);
        throw error;
    }
};

export default alchemy; 