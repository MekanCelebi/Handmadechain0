import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Context';
import HandmadeNFTABI from '../contracts/HandmadeNFT.json';
import { checkTransactionStatus } from '../utils/checkTransaction';

const NFTMarketplaceContext = createContext();

export const useNFTMarketplace = () => useContext(NFTMarketplaceContext);

export const NFTMarketplaceProvider = ({ children }) => {
    const { account, provider, contract, connectWallet } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mintNFT = async (tokenURI) => {
        if (!contract || !account) {
            throw new Error('Contract or account not initialized');
        }

        try {
            setLoading(true);
            setError(null);

            // Get signer
            const signer = provider.getSigner();
            const contractWithSigner = contract.connect(signer);

            console.log('Minting NFT with tokenURI:', tokenURI);
            const tx = await contractWithSigner.mintNFT(tokenURI);
            console.log('Mint transaction sent:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Mint transaction confirmed:', receipt);

            return tx;
        } catch (error) {
            console.error('Mint NFT error:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const createEscrow = async (tokenId, price) => {
        try {
            if (!contract || !account) {
                throw new Error('Contract or account not initialized');
            }

            console.log('Creating escrow with price:', price);
            const priceInWei = ethers.utils.parseEther(price.toString());
            console.log('Price in wei:', priceInWei.toString());

            // Get signer
            const signer = provider.getSigner();
            
            // Get the contract with signer
            const contractWithSigner = contract.connect(signer);

            // Get current gas price
            const gasPrice = await provider.getGasPrice();
            console.log('Current gas price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei');

            // Create transaction with higher gas limit
            const tx = await contractWithSigner.createEscrow({
                value: priceInWei,
                gasLimit: 2000000, // Increased gas limit
                gasPrice: gasPrice.mul(120).div(100) // 20% higher gas price
            });

            console.log('Escrow creation transaction:', tx.hash);

            // Wait for transaction to be mined with longer timeout
            const receipt = await tx.wait(2); // Wait for 2 confirmations
            console.log('Transaction receipt:', receipt);

            if (receipt.status === 0) {
                throw new Error('Transaction failed');
            }

            return receipt;
        } catch (error) {
            console.error('Create escrow error:', error);
            if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                throw new Error('Transaction failed: Gas limit error. Please try again.');
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                throw new Error('Transaction failed: Insufficient funds for gas * price + value');
            } else if (error.code === 'NONCE_EXPIRED') {
                throw new Error('Transaction failed: Nonce expired. Please try again.');
            } else if (error.message.includes('user rejected')) {
                throw new Error('Transaction was rejected by user');
            } else {
                throw error;
            }
        }
    };

    const releaseEscrow = async (tokenId) => {
        if (!contract || !account) {
            throw new Error('Contract or account not initialized');
        }

        try {
            setLoading(true);
            setError(null);

            // Get signer
            const signer = provider.getSigner();
            const contractWithSigner = contract.connect(signer);

            const tx = await contractWithSigner.releaseEscrow(tokenId);
            console.log('Release escrow transaction sent:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Release escrow transaction confirmed:', receipt);

            return tx;
        } catch (error) {
            console.error('Release escrow error:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const refundEscrow = async (tokenId) => {
        if (!contract || !account) {
            throw new Error('Contract or account not initialized');
        }

        try {
            setLoading(true);
            setError(null);

            // Get signer
            const signer = provider.getSigner();
            const contractWithSigner = contract.connect(signer);

            const tx = await contractWithSigner.refundEscrow(tokenId);
            console.log('Refund escrow transaction sent:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Refund escrow transaction confirmed:', receipt);

            return tx;
        } catch (error) {
            console.error('Refund escrow error:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getEscrowDetails = async (tokenId) => {
        if (!contract) {
            throw new Error('Contract not initialized');
        }

        try {
            console.log('Kontrat üzerinden escrow detayları alınıyor, tokenId:', tokenId);
            const details = await contract.getEscrowDetails(tokenId);
            console.log('Kontrat üzerinden alınan ham detaylar:', details);

            if (!details) {
                console.log('Kontrat üzerinden detay alınamadı');
                return null;
            }

            const formattedDetails = {
                buyer: details.buyer || '',
                seller: details.seller || '',
                amount: details.amount || ethers.BigNumber.from(0),
                timestamp: details.timestamp || 0,
                isReleased: details.isReleased || false,
                isRefunded: details.isRefunded || false
            };

            console.log('Formatlanmış escrow detayları:', formattedDetails);
            return formattedDetails;
        } catch (error) {
            console.error('Get escrow details error:', error);
            throw error;
        }
    };

    return (
        <NFTMarketplaceContext.Provider value={{
            marketplace: contract,
            listings: [],
            loading,
            error,
            mintNFT,
            createEscrow,
            releaseEscrow,
            refundEscrow,
            getEscrowDetails
        }}>
            {children}
        </NFTMarketplaceContext.Provider>
    );
}; 