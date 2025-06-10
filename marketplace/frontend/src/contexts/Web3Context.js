import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import HandmadeNFTABI from '../contracts/HandmadeNFT.json';
import { NFT_CONTRACT_ADDRESS } from '../config';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask yüklü değil');
            }

            // Hesap erişimi iste
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                console.log('Bağlanan adres:', accounts[0]);
            }

            // Provider'ı başlat
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(provider);

            // Kontratı başlat
            const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, HandmadeNFTABI.abi, provider);
            setContract(contract);
            console.log('Kontrat başlatıldı:', NFT_CONTRACT_ADDRESS);

            return accounts[0];
        } catch (err) {
            console.error('Cüzdan bağlantı hatası:', err);
            setError(err.message);
            throw err;
        }
    };

    useEffect(() => {
        const initWeb3 = async () => {
            try {
                // Check if MetaMask is installed
                if (!window.ethereum) {
                    throw new Error('MetaMask is not installed');
                }

                // Initialize provider
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(provider);
                
                // Get network
                const network = await provider.getNetwork();
                console.log('Connected to network:', network);

                // Check if we're on Sepolia
                if (network.chainId !== 11155111) {
                    throw new Error('Please connect to Sepolia network');
                }

                // Get connected account
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    console.log('Connected with address:', accounts[0]);
                }

                // Initialize contract
                const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, HandmadeNFTABI.abi, provider);
                setContract(contract);
                console.log('Contract initialized at:', NFT_CONTRACT_ADDRESS);

                // Verify contract code exists
                const code = await provider.getCode(NFT_CONTRACT_ADDRESS);
                if (code === '0x') {
                    throw new Error('No contract code found at address');
                }
                console.log('Contract code exists at address');

                // Get contract owner
                const owner = await contract.owner();
                console.log('Contract owner:', owner);

                setLoading(false);
            } catch (err) {
                console.error('Web3 initialization error:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        initWeb3();

        // Handle account changes
        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            } else {
                setAccount(null);
            }
        };

        // Handle network changes
        const handleChainChanged = () => {
            window.location.reload();
        };

        // Add event listeners
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        // Cleanup
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    const value = {
        account,
        provider,
        contract,
        loading,
        error
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
}; 