import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { ShoppingCart as CartIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import { useNFTMarketplace } from '../contexts/NFTMarketplaceContext';
import { toast } from 'react-toastify';
import NFTListForm from '../components/NFTListForm';
import NFTBuyButton from '../components/NFTBuyButton';
import { API_BASE_URL } from '../config';

// Import contract ABI
const NFTMarketplaceABI = require('../contracts/NFTMarketplace.json').abi;

// Styled components
const ProductImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: 'auto',
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const PriceTag = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(255, 101, 132, 0.1) 100%)',
  marginBottom: theme.spacing(3)
}));

// ProductDetail component
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, contract, connectWallet } = useWeb3();
  const {
    marketplace,
    listings,
    loading,
    createEscrow,
    releaseEscrow,
    refundEscrow,
    getEscrowDetails
  } = useNFTMarketplace();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [nft, setNft] = useState(null);
  const [listing, setListing] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [provider, setProvider] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [ipfsDialog, setIpfsDialog] = useState(false);
  const [ipfsMetadata, setIpfsMetadata] = useState(null);
  const [error, setError] = useState('');
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [transferDialog, setTransferDialog] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');
  const [escrowDetails, setEscrowDetails] = useState(null);
  const [escrowTimeLeft, setEscrowTimeLeft] = useState(0);
  const [showEscrowDialog, setShowEscrowDialog] = useState(false);
  const [escrowStatus, setEscrowStatus] = useState(null);
  const [escrowId, setEscrowId] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState(null);

  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
      }
    };
    initProvider();
  }, []);

  useEffect(() => {
    const loadNFT = async () => {
      try {
        if (!account || !id) return;

        // Önce ürün bilgilerini al
        const response = await axios.get(`${API_BASE_URL}/products/${id}`);
        const productData = response.data;
        
        if (!productData) {
          console.error('Ürün verisi bulunamadı');
          return;
        }

        console.log('Backend\'den gelen ürün verisi:', productData);
        setProduct(productData);

        if (!productData.nft || !productData.nft.tokenId) {
          console.error('Ürün için NFT bilgisi yok');
          return;
        }

        // Token ID'yi integer olarak al ve geçerliliğini kontrol et
        const tokenId = parseInt(productData.nft.tokenId);
        if (isNaN(tokenId) || tokenId <= 0) {
          console.error('Geçersiz NFT ID:', productData.nft.tokenId);
          return;
        }

        // NFT'nin sahibi mi kontrol et
        if (contract && account) {
          try {
        const owner = await contract.ownerOf(tokenId);
            setIsOwner(owner.toLowerCase() === account.toLowerCase());
          } catch (error) {
            console.error('Sahiplik kontrolü hatası:', error);
            setIsOwner(false);
          }
        }

        // NFT'nin satışta olup olmadığını kontrol et
        if (contract) {
          try {
        const listing = await contract.listings(tokenId);
        const isListedContract = listing.isActive;
        
        if (isListedContract) {
          const price = listing.price;
          setListing({
            id: tokenId,
            price: price
          });
            }
          } catch (error) {
            console.error('Listing kontrolü hatası:', error);
          }
        }
      } catch (error) {
        console.error('NFT yükleme hatası:', error);
      }
    };

    loadNFT();
  }, [account, id, contract]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/products/${id}`);
        const productData = response.data;
        
        if (!productData) {
          setError('Ürün bilgileri bulunamadı');
          return;
        }

        setProduct(productData);
      } catch (error) {
        console.error('Ürün yükleme hatası:', error);
        setError('Ürün detayları yüklenirken bir hata oluştu');
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchEscrowDetails = async () => {
      if (!nft?.tokenId || !marketplace) return;
      
        try {
        console.log('Escrow detayları alınıyor, tokenId:', nft.tokenId);
        const details = await getEscrowDetails(nft.tokenId);
        console.log('Alınan escrow detayları:', details);
        
        if (!details) {
          console.log('Escrow detayları bulunamadı');
          return;
        }

          setEscrowDetails({
          buyer: details.buyer || '',
          seller: details.seller || '',
          amount: details.amount ? ethers.utils.formatEther(details.amount) : '0',
          timestamp: details.timestamp ? new Date(details.timestamp * 1000) : new Date(),
          isReleased: details.isReleased || false,
          isRefunded: details.isRefunded || false
          });

        if (details.timestamp) {
          const timeLeft = await marketplace.getEscrowTimeLeft(nft.tokenId);
          setEscrowTimeLeft(timeLeft ? timeLeft.toNumber() : 0);
        }
        } catch (error) {
          console.error('Escrow detayları alınamadı:', error);
        setEscrowDetails(null);
      }
    };

    fetchEscrowDetails();
  }, [nft, marketplace, getEscrowDetails]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePayment = async () => {
    if (!account || !contract) {
      toast.error('Lütfen MetaMask\'ı bağlayın');
      return;
    }

    if (!product || !product.price) {
      toast.error('Ürün fiyatı bulunamadı');
      return;
    }

    try {
      setIsProcessing(true);
      
      // ETH miktarını wei'ye çevir
      const amountInWei = ethers.utils.parseEther(product.price.toString());
      
      // Get signer from provider
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      
      // Escrow oluştur
      const tx = await contractWithSigner.createEscrow({
        value: amountInWei,
        gasLimit: 500000
      });
      
      toast.info('İşlem gönderildi, onay bekleniyor...');
      
      // Transaction'ın tamamlanmasını bekle
      const receipt = await tx.wait();
      
      // EscrowCreated event'ini bul
      const event = receipt.events.find(e => e.event === 'EscrowCreated');
      if (event) {
        const newEscrowId = event.args.escrowId.toString(); // Convert BigNumber to string
        setEscrowId(newEscrowId);
        
        // Get auth token from localStorage
        const token = localStorage.getItem('token');
        
        // Backend'e escrow bilgisini gönder
        await axios.post(`${API_BASE_URL}/products/${id}/escrow`, {
          escrowId: newEscrowId,
          amount: product.price,
          buyer: account
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        toast.success('Ödeme başarıyla oluşturuldu!');
      }
    } catch (err) {
      console.error('Ödeme hatası:', err);
      if (err.response) {
        // Backend'den gelen hata
        toast.error('Backend hatası: ' + err.response.data.message);
      } else {
        // Diğer hatalar
        toast.error('Ödeme işlemi başarısız oldu: ' + err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!escrowId) {
      toast.error('Escrow ID bulunamadı');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Escrow'u serbest bırak
      const tx = await contract.releaseEscrow(escrowId, {
        gasLimit: 500000
      });
      
      toast.info('İşlem gönderildi, onay bekleniyor...');
      
      // Transaction'ın tamamlanmasını bekle
      await tx.wait();
      
      // Backend'e escrow'un serbest bırakıldığını bildir
      await axios.post(`${API_BASE_URL}/products/${id}/release-escrow`, {
        escrowId: escrowId.toString()
      });
      
      toast.success('Ödeme başarıyla serbest bırakıldı!');
      setEscrowId(null);
    } catch (err) {
      console.error('Escrow serbest bırakma hatası:', err);
      toast.error('İşlem başarısız oldu: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefundEscrow = async () => {
    if (!escrowId) {
      toast.error('Escrow ID bulunamadı');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Escrow'u iptal et
      const tx = await contract.refundEscrow(escrowId, {
        gasLimit: 500000
      });
      
      toast.info('İşlem gönderildi, onay bekleniyor...');
      
      // Transaction'ın tamamlanmasını bekle
      await tx.wait();
      
      // Backend'e escrow'un iptal edildiğini bildir
      await axios.post(`${API_BASE_URL}/products/${id}/refund-escrow`, {
        escrowId: escrowId.toString()
      });
      
      toast.success('Ödeme başarıyla iade edildi!');
      setEscrowId(null);
    } catch (err) {
      console.error('Escrow iade hatası:', err);
      toast.error('İşlem başarısız oldu: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFavorite = () => {
    setFavorite(!favorite);
    // Favori işlemlerini backend'e kaydet
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link kopyalandı!');
    }
  };

  const handleIpfsClick = async () => {
    if (!nft?.tokenURI) return;
    
    try {
    setLoadingMetadata(true);
      const response = await axios.get(nft.tokenURI);
      setIpfsMetadata(response.data);
      setIpfsDialog(true);
    } catch (error) {
      console.error('Metadata yükleme hatası:', error);
      toast.error('Metadata yüklenirken bir hata oluştu');
    } finally {
      setLoadingMetadata(false);
    }
  };

  const EscrowStatus = () => {
    if (!escrowDetails) return null;

    const isBuyer = account?.toLowerCase() === escrowDetails.buyer.toLowerCase();
    const isSeller = account?.toLowerCase() === escrowDetails.seller.toLowerCase();
    const timeLeftDays = Math.ceil(escrowTimeLeft / (24 * 60 * 60));

    return (
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.05) 0%, rgba(255, 101, 132, 0.05) 100%)',
          border: '1px solid rgba(108, 99, 255, 0.1)'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Escrow Durumu
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Escrow Tutarı:
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {escrowDetails.amount} ETH
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Kalan Süre:
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {timeLeftDays} gün
            </Typography>
          </Grid>

          {isBuyer && !escrowDetails.isReleased && !escrowDetails.isRefunded && (
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleReleaseEscrow}
                sx={{ mb: 1 }}
              >
                Ürünü Onayla ve Ödemeyi Serbest Bırak
              </Button>
              {timeLeftDays === 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleRefundEscrow}
                >
                  İade Talep Et
                </Button>
              )}
            </Grid>
          )}

          {isSeller && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                {escrowDetails.isReleased 
                  ? 'Ödeme serbest bırakıldı'
                  : escrowDetails.isRefunded
                  ? 'İade edildi'
                  : 'Alıcının onayını bekliyor'}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  };

  const productData = useMemo(() => ({
    name: product?.name,
    description: product?.description,
    price: product?.price,
    image: product?.image
  }), [product]);

  // BigNumber değerlerini string'e çeviren yardımcı fonksiyon
  const formatBigNumber = (value) => {
    if (!value) return '0';
    if (typeof value === 'object' && value._isBigNumber) {
      return value.toString();
    }
    return value.toString();
  };

  // Escrow durumunu kontrol et
  const checkEscrowStatus = async () => {
    if (!escrowId) return;
    
    try {
      const status = await contract.getEscrowStatus(escrowId);
      setEscrowStatus(status);
      
      // Kargo bilgilerini al
      if (status === 2) { // Ürün gönderildi durumunda
        const info = await contract.getShippingInfo(escrowId);
        setShippingInfo(info);
      }
    } catch (err) {
      console.error('Escrow durumu kontrol hatası:', err);
    }
  };

  // Satıcı için kargo bilgisi girişi
  const submitShippingInfo = async (trackingNumber, carrier) => {
    if (!escrowId || !contract) return;
    
    try {
      setIsLoading(true);
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      
      const tx = await contractWithSigner.updateShippingInfo(escrowId, trackingNumber, carrier);
      await tx.wait();
      
      toast.success('Kargo bilgileri güncellendi!');
      await checkEscrowStatus();
    } catch (err) {
      console.error('Kargo bilgisi güncelleme hatası:', err);
      toast.error('Kargo bilgileri güncellenemedi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Ürünü onayla (Alıcı için)
  const confirmDelivery = async () => {
    if (!escrowId || !contract) return;
    
    try {
      setIsLoading(true);
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      
      const tx = await contractWithSigner.confirmDelivery(escrowId);
      await tx.wait();
      
      toast.success('Ürün teslimi onaylandı!');
      await checkEscrowStatus();
    } catch (err) {
      console.error('Onay hatası:', err);
      toast.error('Onay işlemi başarısız: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Escrow durumuna göre mesaj ve aksiyonları göster
  const renderEscrowStatus = () => {
    if (!escrowId) return null;

    const isSeller = account === product?.seller;
    const isBuyer = account === product?.buyer;

    return (
      <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Escrow Durumu
        </Typography>
        
        {/* Durum Mesajı */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            {getEscrowStatusMessage()}
          </Typography>
        </Box>

        {/* Satıcı için Aksiyonlar */}
        {isSeller && escrowStatus === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Satıcı Aksiyonları
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => submitShippingInfo("TR123456789", "Yurtiçi Kargo")}
              disabled={isLoading}
            >
              {isLoading ? 'İşlem Yapılıyor...' : 'Kargo Bilgilerini Gir'}
            </Button>
          </Box>
        )}

        {/* Alıcı için Aksiyonlar */}
        {isBuyer && escrowStatus === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Alıcı Aksiyonları
            </Typography>
            {shippingInfo && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Kargo Firması: {shippingInfo.carrier}
                </Typography>
                <Typography variant="body2">
                  Takip Numarası: {shippingInfo.trackingNumber}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={confirmDelivery}
              disabled={isLoading}
            >
              {isLoading ? 'İşlem Yapılıyor...' : 'Ürünü Onayla'}
            </Button>
          </Box>
        )}

        {/* İşlem Tamamlandığında */}
        {escrowStatus === 3 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" color="success.main">
              İşlem Başarıyla Tamamlandı!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSeller ? 'Ödeme hesabınıza transfer edildi.' : 'Ürün teslimi onaylandı.'}
            </Typography>
          </Box>
        )}

        {/* İşlem İptal Edildiğinde */}
        {escrowStatus === 4 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" color="error">
              İşlem İptal Edildi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isBuyer ? 'Ödemeniz iade edilecek.' : 'İşlem iptal edildi.'}
            </Typography>
          </Box>
        )}

        {/* İşlem Detayları */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            İşlem Detayları
          </Typography>
          <Typography variant="body2">
            Escrow ID: {escrowId}
          </Typography>
          <Typography variant="body2">
            Tutar: {formatBigNumber(product?.price)} ETH
          </Typography>
        </Box>
      </Box>
    );
  };

  // Escrow durumunu periyodik olarak kontrol et
  useEffect(() => {
    if (escrowId) {
      checkEscrowStatus();
      const interval = setInterval(checkEscrowStatus, 30000); // Her 30 saniyede bir kontrol et
      return () => clearInterval(interval);
    }
  }, [escrowId]);

  // Escrow durumuna göre mesaj göster
  const getEscrowStatusMessage = () => {
    switch (escrowStatus) {
      case 0: return 'Ödeme bekleniyor';
      case 1: return 'Ödeme yapıldı, satıcı ürünü göndermeli';
      case 2: return 'Ürün gönderildi, alıcı onaylamalı';
      case 3: return 'İşlem tamamlandı';
      case 4: return 'İşlem iptal edildi';
      default: return 'Durum bilinmiyor';
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">Ürün bulunamadı</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <img
              src={product.gatewayUrls?.[activeStep] || (product.images[activeStep]?.startsWith('ipfs://') ? `${API_BASE_URL}/${product.images[activeStep].replace('ipfs://', '')}` : `${API_BASE_URL}/${product.images[activeStep]}`)}
              alt={product.name}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px'
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            {product.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={product.creator?.avatar}
              sx={{ width: 40, height: 40, mr: 1 }}
            />
            <Typography variant="subtitle1">
              {product.creator?.username || 'Anonim Satıcı'}
            </Typography>
          </Box>

          <Typography variant="body1" sx={{ mb: 3 }}>
            {product.description}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Chip
              label={product.category}
              color="primary"
              sx={{ mr: 1 }}
            />
            {product.nft && (
              <Chip
                label="NFT"
                color="secondary"
                sx={{
                  background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5B52E5 0%, #E55473 100%)'
                  }
                }}
              />
            )}
          </Box>

          <PriceTag>
            <Typography variant="h4">
              {formatBigNumber(product.price)} ETH
            </Typography>
            <Typography variant="subtitle1">
              ≈ ${(product.price * 2000).toFixed(2)}
            </Typography>
          </PriceTag>

          {product.nft && (
            <Paper 
              sx={{ 
                p: 3, 
                mb: 3,
                background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.05) 0%, rgba(255, 101, 132, 0.05) 100%)',
                border: '1px solid rgba(108, 99, 255, 0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ mr: 1 }}>
                  NFT Bilgileri
                </Typography>
                <Chip
                  label="On-Chain"
                  size="small"
                  color="success"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    NFT ID:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 2 }}>
                    #{product.nft.tokenId}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Kontrat Adresi:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 2 }}>
                    {product.nft.contractAddress}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Transaction Hash:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 2 }}>
                    {product.nft.txHash}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={() => window.open(`https://sepolia.etherscan.io/tx/${product.nft.txHash}`, '_blank')}
                    sx={{ mb: 1 }}
                  >
                    Etherscan'de Görüntüle
                  </Button>
                  {product.ipfsCID && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      onClick={handleIpfsClick}
                    >
                      IPFS Metadata'yı Görüntüle
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Paper>
          )}

          {!account ? (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={connectWallet}
              sx={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                '&:hover': { opacity: 0.9 },
                mb: 3,
              }}
            >
              Cüzdanı Bağla
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handlePayment}
              disabled={isProcessing}
              sx={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                '&:hover': { opacity: 0.9 },
                mb: 3,
              }}
            >
              {isProcessing ? 'İşlem Yapılıyor...' : 'NFT Olarak Satın Al'}
            </Button>
          )}

          {/* Escrow İşlemleri */}
          {renderEscrowStatus()}

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ürün Detayları
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Oluşturulma Tarihi
                </Typography>
                <Typography variant="body2">
                  {new Date(product.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Durum
                </Typography>
                <Typography variant="body2">
                  {product.sold ? 'Satıldı' : 'Satışta'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {product.nft && escrowDetails && <EscrowStatus />}

      {/* Satın Alma Dialog */}
      <Dialog open={purchaseDialog} onClose={() => setPurchaseDialog(false)}>
        <DialogTitle>NFT Satın Al</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Bu ürünü NFT olarak satın almak üzeresiniz. Satın alma işlemi geri alınamaz.
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            Fiyat: {formatBigNumber(product.price)} ETH
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialog(false)}>
            İptal
          </Button>
          <Button
            onClick={handlePayment}
            variant="contained"
            disabled={isProcessing}
            sx={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
              '&:hover': { opacity: 0.9 },
            }}
          >
            {isProcessing ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                İşlem Yapılıyor...
              </>
            ) : (
              'Satın Al'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* IPFS Metadata Dialog */}
      <Dialog 
        open={ipfsDialog} 
        onClose={() => setIpfsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>IPFS Metadata</DialogTitle>
        <DialogContent>
          {loadingMetadata ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : ipfsMetadata ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                İsim:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {ipfsMetadata.name}
              </Typography>

              <Typography variant="subtitle1" gutterBottom>
                Açıklama:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {ipfsMetadata.description}
              </Typography>

              <Typography variant="subtitle1" gutterBottom>
                Görsel URL:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  wordBreak: 'break-all', 
                  mb: 2,
                  color: 'primary.main',
                  cursor: 'pointer'
                }}
                onClick={() => window.open(ipfsMetadata.image, '_blank')}
              >
                {ipfsMetadata.image}
              </Typography>
            </Box>
          ) : (
            <Typography color="error">
              Metadata yüklenemedi
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIpfsDialog(false)}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Escrow Dialog */}
      <Dialog open={showEscrowDialog} onClose={() => !escrowStatus && setShowEscrowDialog(false)}>
        <DialogTitle>
          {escrowStatus === 'pending' && 'Escrow Created'}
          {escrowStatus === 'released' && 'Escrow Released'}
          {escrowStatus === 'refunded' && 'Escrow Refunded'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {escrowStatus === 'pending' && 'The escrow has been created. Would you like to release or refund it?'}
            {escrowStatus === 'released' && 'The escrow has been successfully released!'}
            {escrowStatus === 'refunded' && 'The escrow has been successfully refunded!'}
          </Typography>
        </DialogContent>
        <DialogActions>
          {escrowStatus === 'pending' && (
            <>
              <Button onClick={handleReleaseEscrow} color="primary">
                Release
              </Button>
              <Button onClick={handleRefundEscrow} color="error">
                Refund
              </Button>
            </>
          )}
          {escrowStatus !== 'pending' && (
            <Button onClick={() => setShowEscrowDialog(false)} color="primary">
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductDetail; 