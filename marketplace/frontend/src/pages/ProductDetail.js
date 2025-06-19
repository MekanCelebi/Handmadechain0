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
  DialogActions,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  ShoppingCart as CartIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  Visibility as VisibilityIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
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
import { formatIPFSUrl } from '../utils/ipfs';

// Import contract ABI
const NFTMarketplaceABI = require('../contracts/NFTMarketplace.json').abi;

// Styled components
const ProductImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: 'auto',
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const PriceTag = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  border: '1px solid rgba(102, 126, 234, 0.2)',
  marginBottom: theme.spacing(3),
  textAlign: 'center',
}));

const ModernButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1.5, 3),
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
  },
}));

const NFTInfoCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
  border: '1px solid rgba(102, 126, 234, 0.1)',
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const SellerCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  },
}));

const FeatureCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  marginBottom: theme.spacing(1),
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.8)',
    transform: 'translateX(5px)',
  },
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
        if (contract && account && typeof contract.ownerOf === 'function') {
          try {
        const owner = await contract.ownerOf(tokenId);
            setIsOwner(owner.toLowerCase() === account.toLowerCase());
          } catch (error) {
            console.error('Sahiplik kontrolü hatası:', error);
            setIsOwner(false);
          }
        } else {
          console.log('ownerOf fonksiyonu mevcut değil veya contract yüklenmedi');
          setIsOwner(false);
        }

        // NFT'nin satışta olup olmadığını kontrol et
        if (contract && typeof contract.listings === 'function') {
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
        } else {
          console.log('listings fonksiyonu mevcut değil veya contract yüklenmedi');
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
        
        toast.success('Ödeme başarıyla oluşturuldu! Siparişlerinizi görüntülemek için yönlendiriliyorsunuz...');
        
        // Kullanıcıyı profil sayfasındaki siparişlerim sekmesine yönlendir
        setTimeout(() => {
          navigate('/profile?tab=orders');
        }, 2000);
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
    // Önce nft.tokenURI'yi dene, yoksa product.ipfsCID'yi kullan
    const tokenURI = nft?.tokenURI || (product?.ipfsCID ? `ipfs://${product.ipfsCID}` : null);
    
    if (!tokenURI) {
      toast.error('Token URI veya IPFS CID bulunamadı');
      return;
    }
    
    try {
    setLoadingMetadata(true);
      
      // IPFS URL'sini gateway URL'sine çevir
      const gatewayUrl = formatIPFSUrl(tokenURI);
      console.log('Original tokenURI:', tokenURI);
      console.log('Gateway URL:', gatewayUrl);
      
      // Farklı gateway'leri dene
      const gateways = [
        'https://ipfs.io/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://dweb.link/ipfs/'
      ];
      
      let response = null;
      let lastError = null;
      
      for (const gateway of gateways) {
        try {
          const hash = tokenURI.replace('ipfs://', '').replace('/ipfs/', '');
          const testUrl = `${gateway}${hash}`;
          console.log('Trying gateway:', testUrl);
          
          response = await axios.get(testUrl, {
            timeout: 10000, // 10 saniye timeout
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Success with gateway:', gateway);
          break;
        } catch (error) {
          console.log('Failed with gateway:', gateway, error.message);
          lastError = error;
        }
      }
      
      if (!response) {
        throw lastError || new Error('Tüm gateway\'ler başarısız oldu');
      }
      
      // Response data'yı kontrol et
      if (!response.data) {
        throw new Error('Boş response data');
      }
      
      // Content-Type kontrolü yap
      const contentType = response.headers['content-type'] || '';
      console.log('Response Content-Type:', contentType);
      
      let metadata = response.data;
      
      // Eğer content-type image ise veya response.data binary ise, bu bir resim dosyası
      if (contentType.startsWith('image/') || 
          (typeof response.data === 'string' && response.data.includes('')) ||
          (Buffer.isBuffer && Buffer.isBuffer(response.data))) {
        console.log('Response bir resim dosyası, metadata objesi oluşturuluyor');
        metadata = {
          name: product?.name || 'Unknown',
          description: product?.description || 'No description available',
          image: gatewayUrl // Orijinal gateway URL'ini kullan
        };
      } else if (typeof response.data === 'string') {
        // Eğer string bir URL ise (image URL), metadata objesi oluştur
        if (response.data.startsWith('http') || response.data.startsWith('ipfs://')) {
          console.log('Response bir URL, metadata objesi oluşturuluyor');
          metadata = {
            name: product?.name || 'Unknown',
            description: product?.description || 'No description available',
            image: response.data
          };
        } else {
          // JSON string olarak parse etmeye çalış
          try {
            metadata = JSON.parse(response.data);
            console.log('JSON metadata başarıyla parse edildi:', metadata);
          } catch (parseError) {
            console.error('JSON parse hatası:', parseError);
            console.log('Response data (first 100 chars):', response.data.substring(0, 100));
            
            // Eğer parse edilemezse, varsayılan metadata oluştur
            metadata = {
              name: product?.name || 'Unknown',
              description: product?.description || 'No description available',
              image: gatewayUrl
            };
          }
        }
      } else if (typeof response.data === 'object') {
        // Zaten object ise, doğrudan kullan
        metadata = response.data;
        console.log('Object metadata alındı:', metadata);
      } else {
        throw new Error('Bilinmeyen response data tipi');
      }
      
      // Metadata'nın gerekli alanları var mı kontrol et
      if (!metadata.name && !metadata.description && !metadata.image) {
        console.log('Metadata eksik alanlar içeriyor, varsayılan değerler ekleniyor');
        metadata = {
          name: metadata.name || product?.name || 'Unknown',
          description: metadata.description || product?.description || 'No description available',
          image: metadata.image || product?.image || gatewayUrl
        };
      }
      
      // Eğer metadata'da IPFS image URL'i varsa, gateway URL'ine çevir
      if (metadata.image && metadata.image.startsWith('ipfs://')) {
        console.log('IPFS image URL gateway URL\'ine çevriliyor:', metadata.image);
        metadata.image = formatIPFSUrl(metadata.image);
      }
      
      console.log('Final metadata:', metadata);
      setIpfsMetadata(metadata);
      setIpfsDialog(true);
    } catch (error) {
      console.error('Metadata yükleme hatası:', error);
      let errorMessage = 'Metadata yüklenirken bir hata oluştu';
      
      if (error.response) {
        errorMessage += `: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage += ': Ağ bağlantısı hatası';
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
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
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        sx={{ mb: 4 }}
      >
        <Link
          color="inherit"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Anasayfa
        </Link>
        <Link
          color="inherit"
          href={`/category/${encodeURIComponent(product.category)}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/category/${encodeURIComponent(product.category)}`);
          }}
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          <StoreIcon sx={{ mr: 0.5 }} fontSize="small" />
          {product.category}
        </Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Sol taraf - Ürün Görselleri */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
            <ProductImage
              src={product.gatewayUrls?.[activeStep] || (product.images[activeStep]?.startsWith('ipfs://') ? `${API_BASE_URL}/${product.images[activeStep].replace('ipfs://', '')}` : `${API_BASE_URL}/${product.images[activeStep]}`)}
              alt={product.name}
            />
            
            {/* Küçük Görseller */}
            {product.images && product.images.length > 1 && (
              <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={product.gatewayUrls?.[index] || (image?.startsWith('ipfs://') ? `${API_BASE_URL}/${image.replace('ipfs://', '')}` : `${API_BASE_URL}/${image}`)}
                    alt={`${product.name} ${index + 1}`}
              style={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: activeStep === index ? '2px solid #667eea' : '2px solid transparent',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => setActiveStep(index)}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sağ taraf - Ürün Bilgileri */}
        <Grid item xs={12} md={6}>
          {/* Ürün Başlığı ve Kategoriler */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#2d3748', mb: 2 }}>
            {product.name}
          </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <Chip
              label={product.category}
              color="primary"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
              {product.nft && (
                <Chip
                  icon={<VerifiedIcon />}
                  label="NFT Doğrulandı"
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
              )}
              <Chip
                label={product.sold ? 'Satıldı' : 'Satışta'}
                color={product.sold ? 'error' : 'success'}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Satıcı Bilgileri */}
          <SellerCard>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={product.creator?.avatar}
                sx={{ 
                  width: 50, 
                  height: 50, 
                  mr: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                {product.creator?.username?.charAt(0).toUpperCase() || 'S'}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  {product.creator?.username || 'Anonim Satıcı'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Güvenilir Satıcı
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Paylaş">
                <IconButton size="small" onClick={shareProduct}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Satıcı Profili">
                <IconButton size="small">
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </SellerCard>

          {/* Fiyat */}
          <PriceTag>
            <Typography variant="h2" sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}>
              {formatBigNumber(product.price)} ETH
            </Typography>
            <Typography variant="h6" color="text.secondary">
              ≈ ${(product.price * 2000).toFixed(2)} USD
            </Typography>
          </PriceTag>

          {/* Özellikler */}
          <Box sx={{ mb: 3 }}>
            <FeatureCard>
              <SecurityIcon sx={{ mr: 2, color: '#667eea' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Güvenli Ödeme
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Escrow sistemi ile korumalı
                </Typography>
              </Box>
            </FeatureCard>
            
            <FeatureCard>
              <ShippingIcon sx={{ mr: 2, color: '#667eea' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Hızlı Teslimat
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Güvenli kargo ile gönderim
                </Typography>
              </Box>
            </FeatureCard>
            
            <FeatureCard>
              <VerifiedIcon sx={{ mr: 2, color: '#667eea' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  NFT Doğrulaması
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Blockchain üzerinde kayıtlı
                </Typography>
              </Box>
            </FeatureCard>
          </Box>

          {/* Satın Alma Butonu */}
          {!account ? (
            <ModernButton
              fullWidth
              size="large"
              onClick={connectWallet}
              sx={{ mb: 3 }}
            >
              Cüzdanı Bağla ve Satın Al
            </ModernButton>
          ) : (
            <ModernButton
              fullWidth
              size="large"
              onClick={handlePayment}
              disabled={isProcessing}
              sx={{ mb: 3 }}
            >
              {isProcessing ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  İşlem Yapılıyor...
                </>
              ) : (
                <>
                  <CartIcon sx={{ mr: 1 }} />
                  NFT Olarak Satın Al
                </>
              )}
            </ModernButton>
          )}

          {/* Escrow İşlemleri */}
          {renderEscrowStatus()}
        </Grid>
      </Grid>

      {/* Ürün Açıklaması */}
      <Paper sx={{ p: 4, mt: 4, borderRadius: 3, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#2d3748', mb: 3 }}>
          Ürün Açıklaması
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#4a5568' }}>
          {product.description}
        </Typography>
      </Paper>

      {/* NFT Bilgileri */}
      {product.nft && (
        <NFTInfoCard sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ mr: 2, fontWeight: 600, color: '#2d3748' }}>
                  NFT Bilgileri
                </Typography>
                <Chip
                  label="On-Chain"
                  size="small"
                  color="success"
              icon={<VerifiedIcon />}
                />
              </Box>
              
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                NFT ID
                  </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
                    #{product.nft.tokenId}
                  </Typography>
                </Grid>

            <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Kontrat Adresi
                  </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', color: '#4a5568' }}>
                    {product.nft.contractAddress}
                  </Typography>
                </Grid>

            <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Transaction Hash
                  </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', color: '#4a5568' }}>
                    {product.nft.txHash}
                  </Typography>
            </Grid>
                </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => window.open(`https://sepolia.etherscan.io/tx/${product.nft.txHash}`, '_blank')}
              sx={{ borderRadius: 2 }}
                  >
                    Etherscan'de Görüntüle
                  </Button>
            {(product.ipfsCID || nft?.tokenURI) && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleIpfsClick}
                sx={{ borderRadius: 2 }}
                    >
                      IPFS Metadata'yı Görüntüle
                    </Button>
                  )}
          </Box>
        </NFTInfoCard>
      )}

      {/* Ürün Detayları */}
      <Paper sx={{ p: 4, mt: 4, borderRadius: 3, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#2d3748', mb: 3 }}>
              Ürün Detayları
            </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Oluşturulma Tarihi
                </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {new Date(product.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
                </Typography>
              </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Durum
                </Typography>
            <Chip
              label={product.sold ? 'Satıldı' : 'Satışta'}
              color={product.sold ? 'error' : 'success'}
              variant="outlined"
            />
              </Grid>
            </Grid>
          </Paper>

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