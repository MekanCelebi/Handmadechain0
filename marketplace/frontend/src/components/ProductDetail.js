import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNFTMarketplace } from '../contexts/NFTMarketplaceContext';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import {
    Box,
    Container,
    Grid,
    Typography,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Card,
    CardMedia,
    CardContent,
    Divider,
    Chip,
    Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { formatEther } from 'ethers/lib/utils';

const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
        transform: 'translateY(-5px)'
    }
}));

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { contract, account, createEscrow, releaseEscrow, refundEscrow } = useNFTMarketplace();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [escrowStatus, setEscrowStatus] = useState(null);
    const [escrowLoading, setEscrowLoading] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const tokenURI = await contract.tokenURI(id);
                const response = await fetch(tokenURI);
                const metadata = await response.json();
                
                const price = await contract.getTokenPrice(id);
                const owner = await contract.ownerOf(id);
                const creator = await contract.getTokenCreator(id);
                
                setProduct({
                    id,
                    ...metadata,
                    price: formatEther(price),
                    owner,
                    creator
                });

                // Check escrow status
                const escrow = await contract.escrows(id);
                setEscrowStatus(escrow);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Ürün bilgileri yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        if (contract && id) {
            fetchProduct();
        }
    }, [contract, id]);

    const handlePurchase = async () => {
        try {
            setEscrowLoading(true);
            const price = await contract.getTokenPrice(id);
            await createEscrow(id, price);
            toast.success('NFT başarıyla satın alındı! 7 gün içinde ödemeyi onaylayabilirsiniz.');
            setPurchaseDialogOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error(error.message || 'Satın alma işlemi sırasında bir hata oluştu.');
        } finally {
            setEscrowLoading(false);
        }
    };

    const handleReleaseEscrow = async () => {
        try {
            setEscrowLoading(true);
            await releaseEscrow(id);
            toast.success('Ödeme başarıyla onaylandı!');
            window.location.reload();
        } catch (error) {
            console.error('Release escrow error:', error);
            toast.error(error.message || 'Ödeme onaylama işlemi sırasında bir hata oluştu.');
        } finally {
            setEscrowLoading(false);
        }
    };

    const handleRefundEscrow = async () => {
        try {
            setEscrowLoading(true);
            await refundEscrow(id);
            toast.success('İade işlemi başarıyla gerçekleştirildi!');
            window.location.reload();
        } catch (error) {
            console.error('Refund escrow error:', error);
            toast.error(error.message || 'İade işlemi sırasında bir hata oluştu.');
        } finally {
            setEscrowLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!product) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="info">Ürün bulunamadı.</Alert>
            </Container>
        );
    }

    const isOwner = product.owner.toLowerCase() === account?.toLowerCase();
    const isCreator = product.creator.toLowerCase() === account?.toLowerCase();
    const hasActiveEscrow = escrowStatus?.active;
    const isEscrowBuyer = hasActiveEscrow && escrowStatus?.buyer.toLowerCase() === account?.toLowerCase();
    const isEscrowExpired = hasActiveEscrow && 
        (Date.now() / 1000) - escrowStatus?.timestamp.toNumber() > 7 * 24 * 60 * 60;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <StyledCard>
                        <CardMedia
                            component="img"
                            height="400"
                            image={product.image}
                            alt={product.name}
                            sx={{ objectFit: 'cover' }}
                        />
                    </StyledCard>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" gutterBottom>
                            {product.name}
                        </Typography>
                        <Typography variant="h5" color="primary" gutterBottom>
                            {product.price} ETH
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {product.description}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Chip 
                                label={`Üretici: ${product.creator.slice(0, 6)}...${product.creator.slice(-4)}`}
                                sx={{ mr: 1 }}
                            />
                            <Chip 
                                label={`Sahip: ${product.owner.slice(0, 6)}...${product.owner.slice(-4)}`}
                            />
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        {!isOwner && !hasActiveEscrow && (
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => setPurchaseDialogOpen(true)}
                                disabled={escrowLoading}
                            >
                                {escrowLoading ? <CircularProgress size={24} /> : 'Satın Al'}
                            </Button>
                        )}
                        {isOwner && hasActiveEscrow && !isEscrowExpired && (
                            <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                onClick={handleReleaseEscrow}
                                disabled={escrowLoading}
                            >
                                {escrowLoading ? <CircularProgress size={24} /> : 'Ödemeyi Onayla'}
                            </Button>
                        )}
                        {isEscrowBuyer && isEscrowExpired && (
                            <Button
                                variant="contained"
                                color="error"
                                fullWidth
                                onClick={handleRefundEscrow}
                                disabled={escrowLoading}
                            >
                                {escrowLoading ? <CircularProgress size={24} /> : 'İade Al'}
                            </Button>
                        )}
                    </Box>
                </Grid>
            </Grid>

            <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)}>
                <DialogTitle>NFT Satın Al</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        Bu NFT'yi {product.price} ETH karşılığında satın almak üzeresiniz.
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Satın alma işlemi 7 günlük bir bekleme süresi içerir. Bu süre içinde satıcı ödemeyi onaylayabilir.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPurchaseDialogOpen(false)}>İptal</Button>
                    <Button 
                        onClick={handlePurchase} 
                        variant="contained" 
                        color="primary"
                        disabled={escrowLoading}
                    >
                        {escrowLoading ? <CircularProgress size={24} /> : 'Satın Al'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ProductDetail; 