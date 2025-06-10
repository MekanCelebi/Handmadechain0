import { ethers } from 'ethers';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Config
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract ABI'yi dosyadan oku
const contractABI = JSON.parse(readFileSync(join(__dirname, '../contracts/NFTMarketplace.json'), 'utf8')).abi;

const contract = new ethers.Contract(
    process.env.NFT_CONTRACT_ADDRESS,
    contractABI,
    wallet
);

// Metadata oluştur ve IPFS'e yükle
const createMetadata = async (productData) => {
    try {
        if (!productData || !productData.images || !productData.images.length) {
            throw new Error('Product data or images are missing');
        }

        // Metadata oluştur
        const metadata = {
            name: productData.name,
            description: productData.description,
            image: productData.images[0],
            attributes: [
                {
                    trait_type: "Category",
                    value: productData.category
                },
                {
                    trait_type: "Creator",
                    value: productData.creator ? productData.creator.toString() : 'Unknown'
                }
            ]
        };

        // Metadata'yı IPFS'e yükle
        const metadataBuffer = Buffer.from(JSON.stringify(metadata));
        const formData = new FormData();
        formData.append('file', metadataBuffer, {
            filename: 'metadata.json',
            contentType: 'application/json'
        });

        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Authorization': `Bearer ${process.env.PINATA_JWT}`,
                ...formData.getHeaders()
            }
        });

        const cid = response.data.IpfsHash;
        return {
            tokenURI: `ipfs://${cid}`,
            metadata
        };
    } catch (error) {
        console.error('Metadata creation error:', error);
        throw error;
    }
};

// NFT oluştur
export const createNFT = async (productData) => {
    try {
        console.log('Starting NFT creation process:', productData);

        // 1. Metadata oluştur ve IPFS'e yükle
        const { tokenURI, metadata } = await createMetadata(productData);
        console.log('Metadata created and uploaded to IPFS:', tokenURI);

        // 2. NFT'yi mint et
        const tx = await contract.mintNFT(productData.creator, tokenURI);
        console.log('Transaction sent:', tx.hash);

        // 3. Transaction'ın tamamlanmasını bekle
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt.hash);

        // 4. NFTMinted event'ini bul
        const event = receipt.events.find(e => e.event === 'NFTMinted');
        if (!event) {
            throw new Error('NFTMinted event not found in transaction receipt');
        }

        const tokenId = event.args.tokenId;
        console.log('NFT minted with token ID:', tokenId.toString());

        // 5. NFT'yi satışa çıkar
        const priceInWei = ethers.utils.parseEther(productData.price.toString());
        const listTx = await contract.listNFT(tokenId, priceInWei);
        await listTx.wait();
        console.log('NFT listed for sale');

        return {
            success: true,
            tokenId: tokenId.toString(),
            txHash: tx.hash,
            ipfsCID: tokenURI.replace('ipfs://', ''),
            metadata
        };
    } catch (error) {
        console.error('NFT creation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// NFT transfer et
export const transferNFT = async (to, tokenId) => {
    try {
        const tx = await contract.transferFrom(wallet.address, to, tokenId);
        const receipt = await tx.wait();
        return {
            success: true,
            txHash: receipt.transactionHash
        };
    } catch (error) {
        console.error('NFT transfer error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Satın alma işlemini doğrula
export const verifyPurchase = async (txHash, tokenId) => {
    try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) {
            throw new Error('Transaction not found');
        }

        const event = receipt.logs.find(log => {
            try {
                const parsedLog = contract.interface.parseLog(log);
                return parsedLog?.name === 'NFTPurchased' && 
                       parsedLog?.args?.tokenId.toString() === tokenId.toString();
            } catch (e) {
                return false;
            }
        });

        if (!event) {
            throw new Error('Purchase event not found');
        }

        return {
            success: true,
            txHash: receipt.transactionHash
        };
    } catch (error) {
        console.error('Purchase verification error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export default {
    createNFT,
    transferNFT,
    verifyPurchase
}; 