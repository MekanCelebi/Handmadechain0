import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import Product from '../models/Product.js';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Contract ABI'yi dosyadan oku
const contractABI = [
    "function mintNFT(string memory tokenURI) public returns (uint256)",
    "function owner() public view returns (address)",
    "function createEscrow() external payable",
    "function releaseEscrow(uint256 escrowId) external",
    "function refundEscrow(uint256 escrowId) external",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event EscrowCreated(uint256 indexed escrowId, address indexed buyer, uint256 amount)",
    "event EscrowReleased(uint256 indexed escrowId, address indexed buyer, uint256 amount)",
    "event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount)"
];

// Provider ve wallet oluştur
const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract instance oluştur
const contract = new ethers.Contract(
    '0x6b39aDC3EA9397784B2B0cB4Fc6CA0c960B0F709', // New contract address
    contractABI,
    wallet
);

// IPFS'e dosya yükleme fonksiyonu
export const uploadToIPFS = async (filePath) => {
    try {
        const formData = new FormData();
        const file = readFileSync(filePath);
        formData.append('file', file, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Authorization': `Bearer ${process.env.PINATA_JWT}`,
                ...formData.getHeaders()
            }
        });

        return response.data.IpfsHash;
    } catch (error) {
        console.error('IPFS upload error:', error);
        throw new Error('IPFS upload failed: ' + error.message);
    }
};

export const createNFTForProduct = async (productId, tokenURI, name, description, price) => {
    try {
        console.log('NFT oluşturma başlatılıyor...');
        console.log('Parametreler:', { productId, tokenURI, name, description, price });
        console.log('Contract adresi:', process.env.NFT_CONTRACT_ADDRESS);
        console.log('Wallet adresi:', wallet.address);

        // Kontratın doğru deploy edildiğini kontrol et
        const code = await provider.getCode(process.env.NFT_CONTRACT_ADDRESS);
        if (code === '0x') {
            throw new Error('Kontrat adresi geçersiz veya kontrat deploy edilmemiş');
        }

        // NFT'yi mint et
        console.log('NFT mint işlemi başlatılıyor...');
        
        // Gas fiyatını al
        const feeData = await provider.getFeeData();
        console.log('Current fee data:', {
            maxFeePerGas: ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei'),
            maxPriorityFeePerGas: ethers.utils.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
        });

        // Transaction parametrelerini ayarla
        const tx = await contract.mintNFT(tokenURI, {
            gasLimit: 500000, // Sabit gas limiti
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            nonce: await wallet.getTransactionCount()
        });
        console.log('Transaction gönderildi:', tx.hash);

        // Transaction'ın tamamlanmasını bekle
        console.log('Transaction onayı bekleniyor...');
        const receipt = await tx.wait();
        console.log('Transaction onaylandı:', receipt.hash);
        console.log('Transaction receipt:', receipt);
        console.log('Transaction logs:', receipt.logs);

        // Parse logs to find the Transfer event
        let tokenId;
        for (const log of receipt.logs) {
            try {
                const parsedLog = contract.interface.parseLog(log);
                console.log('Parsed log:', parsedLog);
                if (parsedLog.name === 'Transfer' && parsedLog.args.from === '0x0000000000000000000000000000000000000000') {
                    tokenId = parsedLog.args.tokenId;
                    break;
                }
            } catch (error) {
                console.log('Log parse edilemedi:', error.message);
            }
        }

        if (!tokenId) {
            throw new Error('Token ID bulunamadı');
        }

        console.log('NFT oluşturuldu, token ID:', tokenId.toString());

        // Eğer productId varsa ürünü güncelle
        if (productId) {
            const product = await Product.findById(productId);
            if (product) {
                product.nft = {
                    tokenId: tokenId.toString(),
                    contractAddress: '0x6b39aDC3EA9397784B2B0cB4Fc6CA0c960B0F709',
                    txHash: tx.hash
                };
                await product.save();
            }
        }

        return {
            success: true,
            tokenId: tokenId.toString(),
            txHash: tx.hash
        };
    } catch (error) {
        console.error('NFT oluşturma hatası:', error);
        throw error;
    }
}; 