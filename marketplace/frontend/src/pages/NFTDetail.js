import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { useNFTMarketplace } from '../contexts/NFTMarketplaceContext';
import { useWeb3 } from '../contexts/Web3Context';
import NFTListForm from '../components/NFTListForm';
import NFTBuyButton from '../components/NFTBuyButton';
import { toast } from 'react-toastify';

const NFTDetail = () => {
    const { id } = useParams();
    const { account } = useWeb3();
    const { marketplace, listings, loading } = useNFTMarketplace();
    const [nft, setNft] = useState(null);
    const [listing, setListing] = useState(null);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const loadNFT = async () => {
            try {
                // NFT detaylarını yükle
                const nftData = await marketplace.getNFT(id);
                setNft(nftData);

                // NFT'nin sahibi mi kontrol et
                const owner = await marketplace.ownerOf(id);
                setIsOwner(owner.toLowerCase() === account?.toLowerCase());

                // Aktif listing var mı kontrol et
                const activeListing = listings.find(l => l.tokenId.toString() === id);
                setListing(activeListing);
            } catch (error) {
                console.error('NFT yükleme hatası:', error);
                // Hata mesajını gösterme, sessizce devam et
            }
        };

        if (marketplace && id) {
            loadNFT();
        }
    }, [marketplace, id, account, listings]);

    if (loading) {
        return <div className="text-center">Yükleniyor...</div>;
    }

    if (!nft) {
        return <div className="text-center">NFT bulunamadı</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* NFT Görseli */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-auto rounded-lg"
                    />
                </div>

                {/* NFT Detayları */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h1 className="text-3xl font-bold mb-4">{nft.name}</h1>
                        <p className="text-gray-600 mb-4">{nft.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-500">Token ID</p>
                                <p className="font-semibold">#{nft.tokenId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Sahip</p>
                                <p className="font-semibold truncate">{nft.owner}</p>
                            </div>
                        </div>

                        {/* Satış/Alım Butonları */}
                        {isOwner ? (
                            !listing ? (
                                <NFTListForm nft={nft} />
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-xl font-bold">
                                        Fiyat: {ethers.utils.formatEther(listing.price)} ETH
                                    </p>
                                    <button
                                        onClick={() => marketplace.cancelListing(listing.id)}
                                        className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Satışı İptal Et
                                    </button>
                                </div>
                            )
                        ) : listing ? (
                            <NFTBuyButton listing={listing} />
                        ) : (
                            <p className="text-center text-gray-500">
                                Bu NFT şu anda satışta değil
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NFTDetail; 