const { ethers } = require('ethers');
const HandmadeNFTABI = require('./HandmadeNFT.json').abi;

const CONTRACT_ADDRESS = "0x0057c93137edce46542ca1fa6a00ef74a07ea84b";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/ChV8eRvmyqhV1MrQS8-cn');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, HandmadeNFTABI, wallet);

module.exports = {
    contract,
    wallet
}; 