import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useNFTMarketplace } from '../contexts/NFTMarketplaceContext';
import { toast } from 'react-hot-toast';
import {
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    CircularProgress
} from '@mui/material';

const NFTListForm = ({ nft }) => {
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const { marketplace, listNFT } = useNFTMarketplace();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!price) return toast.error('Lütfen bir fiyat belirleyin');

        try {
            setLoading(true);
            const priceInWei = ethers.utils.parseEther(price);
            
            // NFT'yi listele
            const tx = await listNFT(nft.tokenId, priceInWei);
            await tx.wait();

            toast.success('NFT başarıyla listelendi!');
            navigate('/profile');
        } catch (error) {
            console.error('NFT listeleme hatası:', error);
            toast.error('NFT listelenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                NFT'yi Satışa Çıkar
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Fiyat (ETH)"
                    type="number"
                    step="0.001"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    margin="normal"
                    required
                    InputProps={{
                        inputProps: { min: 0, step: "0.001" }
                    }}
                />
                <Box sx={{ mt: 2 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        sx={{
                            background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                            '&:hover': { opacity: 0.9 }
                        }}
                    >
                        {loading ? (
                            <>
                                <CircularProgress size={24} sx={{ mr: 1 }} />
                                İşlem Yapılıyor...
                            </>
                        ) : (
                            'Satışa Çıkar'
                        )}
                    </Button>
                </Box>
            </form>
        </Paper>
    );
};

export default NFTListForm; 