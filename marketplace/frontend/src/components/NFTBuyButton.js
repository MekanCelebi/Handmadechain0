import React, { useState, useCallback, memo } from 'react';
import { ethers } from 'ethers';
import { useNFTMarketplace } from '../contexts/NFTMarketplaceContext';
import { toast } from 'react-hot-toast';
import { Button, CircularProgress } from '@mui/material';

const NFTBuyButton = memo(({ nft }) => {
    const [loading, setLoading] = useState(false);
    const { contract, createEscrow } = useNFTMarketplace();

    const handleBuy = useCallback(async () => {
        if (!nft || !nft.price) {
            toast.error('NFT fiyatı bulunamadı');
            return;
        }

        try {
            setLoading(true);
            // Frontend'den gelen fiyatı kullan
            const price = ethers.utils.parseEther(nft.price.toString());
            const tx = await createEscrow(nft.tokenId, { value: price });
            await tx.wait();
            
            toast.success('NFT satın alma işlemi başlatıldı!');
        } catch (error) {
            console.error('NFT satın alma hatası:', error);
            toast.error('İşlem sırasında bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [contract, createEscrow, nft]);

    return (
        <Button
            onClick={handleBuy}
            disabled={loading}
            variant="contained"
            fullWidth
            sx={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                '&:hover': { opacity: 0.9 }
            }}
        >
            {loading ? (
                <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    İşlem Yapılıyor...
                </>
            ) : (
                'Satın Al'
            )}
        </Button>
    );
});

NFTBuyButton.displayName = 'NFTBuyButton';

export default NFTBuyButton; 