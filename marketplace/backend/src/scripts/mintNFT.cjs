require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { ethers } = require('ethers');
const { Contract, providers, Wallet } = ethers;
const { parseEther } = ethers.utils;

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const NFT_CONTRACT_ADDRESS = '0x6c6c4DdcE5cd7D06006f8544bc7e0715590c92eC';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

async function uploadToIPFS() {
    try {
        const metadata = JSON.parse(fs.readFileSync('./src/scripts/test-metadata.json', 'utf8'));
        
        const formData = new FormData();
        formData.append('file', Buffer.from(JSON.stringify(metadata)), {
            filename: 'metadata.json',
            contentType: 'application/json'
        });

        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_API_KEY
            }
        });

        return `ipfs://${response.data.IpfsHash}`;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
}

async function mintNFT() {
    try {
        // Connect to the network
        const provider = new providers.JsonRpcProvider(RPC_URL);
        const wallet = new Wallet(PRIVATE_KEY, provider);

        // Get contract ABI
        const contractABI = require('../contracts/HandmadeNFT.json').abi;
        const contract = new Contract(NFT_CONTRACT_ADDRESS, contractABI, wallet);

        // Upload metadata to IPFS
        const tokenURI = await uploadToIPFS();
        console.log('Metadata uploaded to IPFS:', tokenURI);

        // Set price in wei (0.005 ETH)
        const price = parseEther('0.005');

        // Get current gas price
        const gasPrice = await provider.getGasPrice();
        console.log('Current gas price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei');

        // Estimate gas with higher limit
        const gasLimit = 1000000; // 1 million gas limit
        console.log('Using gas limit:', gasLimit);

        // Mint NFT with manual gas settings
        console.log('Minting NFT...');
        const tx = await contract.mintNFT(tokenURI, price, {
            gasLimit: gasLimit,
            gasPrice: gasPrice.mul(120).div(100) // %20 daha yüksek gas price
        });
        
        console.log('Transaction sent:', tx.hash);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log('NFT minted successfully!');
        console.log('Transaction hash:', receipt.transactionHash);
        console.log('Gas used:', receipt.gasUsed.toString());
        console.log('Block number:', receipt.blockNumber);
        
    } catch (error) {
        console.error('Error minting NFT:', error);
        if (error.reason) {
            console.error('Error reason:', error.reason);
        }
        if (error.data) {
            console.error('Error data:', error.data);
        }
        if (error.transaction) {
            console.error('Transaction details:', error.transaction);
        }
    }
}

mintNFT(); 