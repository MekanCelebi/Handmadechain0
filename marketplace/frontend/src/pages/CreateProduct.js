import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useNFTMarketplace } from '../contexts/NFTMarketplaceContext';
import { uploadToIPFS } from '../utils/ipfs';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';

const CreateProduct = () => {
    const navigate = useNavigate();
    const { account, contract } = useWeb3();
    const { mintNFT } = useNFTMarketplace();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: null,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setFormData((prev) => ({
            ...prev,
            image: file,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!account) {
            toast.error('Lütfen cüzdanınızı bağlayın');
            return;
        }

        try {
            setLoading(true);
            
            // 1. Resmi IPFS'e yükle
            const imageUrl = await uploadToIPFS(formData.image);
            
            // 2. Metadata'yı oluştur ve IPFS'e yükle
            const metadata = {
                name: formData.name,
                description: formData.description,
                image: imageUrl,
            };
            const metadataUrl = await uploadToIPFS(JSON.stringify(metadata));
            
            // 3. NFT'yi mint et
            const price = ethers.utils.parseEther(formData.price);
            const tx = await mintNFT(metadataUrl);
            await tx.wait();
            
            toast.success('NFT başarıyla oluşturuldu!');
            navigate('/my-products');
        } catch (error) {
            console.error('NFT oluşturma hatası:', error);
            toast.error('NFT oluşturulurken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Yeni Ürün Oluştur
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label="Ürün Adı"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </Box>
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label="Açıklama"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            multiline
                            rows={4}
                            required
                        />
                    </Box>
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label="Fiyat (ETH)"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                            inputProps={{ step: "0.001", min: "0.001" }}
                        />
                    </Box>
                    <Box sx={{ mb: 3 }}>
                        <input
                            accept="image/*"
                            type="file"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                            id="image-upload"
                        />
                        <label htmlFor="image-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                fullWidth
                            >
                                Ürün Fotoğrafı Seç
                            </Button>
                        </label>
                        {formData.image && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Seçilen dosya: {formData.image.name}
                            </Typography>
                        )}
                    </Box>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'NFT Oluştur'
                        )}
                    </Button>
                </form>
            </Paper>
        </Container>
    );
};

export default CreateProduct; 