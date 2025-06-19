import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Badge,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Person,
  ShoppingBag,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  AccountCircle as AccountIcon,
  Wallet as WalletIcon,
  CalendarToday as CalendarIcon,
  ContentCopy as CopyIcon,
  Verified as VerifiedIcon,
  Store as StoreIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import { useWeb3 } from '../contexts/Web3Context';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';

// Styled components
const ProfileHeader = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: theme.spacing(6, 0),
  borderRadius: theme.spacing(3),
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.3,
  },
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  margin: '0 auto',
  marginBottom: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  border: '4px solid rgba(255, 255, 255, 0.3)',
  fontSize: '3rem',
  fontWeight: 600,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
}));

const InfoCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  },
}));

const OrderCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
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

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTab-root': {
    minHeight: 56,
    fontSize: '1.1rem',
    fontWeight: 600,
    textTransform: 'none',
    color: '#4a5568',
    '&.Mui-selected': {
      color: '#667eea',
    },
  },
  '& .MuiTabs-indicator': {
    backgroundColor: '#667eea',
    height: 4,
    borderRadius: 2,
  },
}));

const StatCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  border: '1px solid rgba(102, 126, 234, 0.2)',
  borderRadius: theme.spacing(2),
  textAlign: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
  },
}));

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { contract, account } = useWeb3();
  const [processingEscrow, setProcessingEscrow] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [contractOwner, setContractOwner] = useState(null);

  // URL parametresinden tab değerini oku
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam === 'orders') {
      setActiveTab(1); // Siparişlerim sekmesi
    } else {
      setActiveTab(0); // Varsayılan olarak profil sekmesi
    }
  }, [location.search]);

    const fetchUserData = async () => {
    if (!contract || !account) {
      setError('Lütfen cüzdanınızı bağlayın');
      setLoading(false);
          return;
        }

    try {
      setLoading(true);
      setError(null);

      console.log('Cüzdan adresi:', account);
      console.log('Contract adresi:', contract.address);

      // Event imzalarını kontrol et
      const escrowCreatedSignature = "EscrowCreated(uint256,address,uint256)";
      const escrowReleasedSignature = "EscrowReleased(uint256,address,uint256)";
      const escrowRefundedSignature = "EscrowRefunded(uint256,address,uint256)";
      
      const escrowCreatedTopic = ethers.utils.id(escrowCreatedSignature);
      const escrowReleasedTopic = ethers.utils.id(escrowReleasedSignature);
      const escrowRefundedTopic = ethers.utils.id(escrowRefundedSignature);
      
      console.log('EscrowCreated imzası:', escrowCreatedTopic);
      console.log('EscrowReleased imzası:', escrowReleasedTopic);
      console.log('EscrowRefunded imzası:', escrowRefundedTopic);

      // Kullanıcının escrow'larını al
      const escrowFilter = {
        address: contract.address,
        topics: [
          [escrowCreatedTopic, escrowReleasedTopic, escrowRefundedTopic],
          null,
          ethers.utils.hexZeroPad(account, 32)
        ],
        fromBlock: 0,
        toBlock: 'latest'
      };
      
      console.log('Escrow filtresi:', escrowFilter);
      
      let escrowEvents = [];
      try {
        escrowEvents = await contract.provider.getLogs(escrowFilter);
      console.log('Escrow olayları:', escrowEvents);
      } catch (escrowError) {
        console.warn('Escrow events fetch failed:', escrowError.message);
        escrowEvents = [];
      }

      // NFT olaylarını al
      let nftEvents = [];
      try {
      const nftMintTopic = ethers.utils.id("DebugMintNFT(uint256,string,uint256)");
      const nftFilter = {
        fromBlock: 0,
        toBlock: 'latest',
        topics: [nftMintTopic]
      };
        nftEvents = await contract.provider.getLogs(nftFilter);
      console.log('NFT olayları:', nftEvents);
      } catch (nftError) {
        console.warn('NFT events fetch failed:', nftError.message);
        nftEvents = [];
      }

      // NFT verilerini işle
      const nftData = {};
      for (const event of nftEvents) {
        try {
          const parsedEvent = contract.interface.parseLog(event);
          console.log('Parsed NFT event:', parsedEvent);
          const tokenId = parsedEvent.args.tokenId.toString();
          const tokenURI = parsedEvent.args.tokenURI;
          console.log(`Token ${tokenId} URI:`, tokenURI);
          
          nftData[tokenId] = {
            tokenURI: tokenURI,
            price: parsedEvent.args.price
          };
        } catch (err) {
          console.error('NFT event parse hatası:', err);
        }
      }

      // Escrow'ları işle
      const escrowPromises = escrowEvents.map(async (event) => {
        try {
          const escrow = contract.interface.parseLog(event);
          console.log('Escrow verisi:', escrow);
          
          // Block timestamp'i al
          let timestamp = Date.now();
          try {
          const block = await contract.provider.getBlock(event.blockNumber);
            timestamp = block.timestamp;
          } catch (blockError) {
            console.warn('Block timestamp fetch failed:', blockError.message);
          }

          // Token ID'yi al ve kontrol et
          const tokenId = escrow.args.tokenId?.toString() || escrow.args.escrowId?.toString() || '0';
          console.log('Processing token ID:', tokenId);
          
          // Token URI'yi al
          let imageUrl = null;
          let description = 'Ürün detayları';
          try {
            // NFT contract'ını başlat
            const nftContract = new ethers.Contract(
              contract.address,
              [
                "function tokenURI(uint256 tokenId) view returns (string memory)"
              ],
              contract.provider
            );
            
            try {
              const tokenURI = await nftContract.tokenURI(tokenId);
              console.log(`Token ${tokenId} URI:`, tokenURI);
              
              if (tokenURI) {
                // Timeout için AbortController kullan
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye timeout
                
                const gateways = [
                  'https://ipfs.io/ipfs/',
                  'https://gateway.pinata.cloud/ipfs/',
                  'https://cloudflare-ipfs.com/ipfs/',
                  'https://dweb.link/ipfs/'
                ];
                
                let response = null;
                let metadataUrl = null;
                
                try {
                  // Farklı gateway'leri dene
                  for (const gateway of gateways) {
                    try {
                      metadataUrl = tokenURI.startsWith('ipfs://') 
                        ? tokenURI.replace('ipfs://', gateway)
                  : tokenURI;
                
                      console.log('Trying gateway:', metadataUrl);
                      
                      response = await fetch(metadataUrl, {
                        method: 'GET',
                        headers: {
                          'Accept': 'application/json,image/*,*/*',
                        },
                        signal: controller.signal,
                        mode: 'cors'
                      });
                      
                      if (response.ok) {
                        console.log('Success with gateway:', gateway);
                        break;
                      }
                    } catch (gatewayError) {
                      console.warn(`Gateway ${gateway} failed:`, gatewayError.message);
                      continue;
                    }
                  }
                  
                  clearTimeout(timeoutId); // Timeout'u temizle
                  
                  if (!response || !response.ok) {
                    throw new Error(`All gateways failed for token ${tokenId}`);
                }

                // Content-Type'ı kontrol et
                const contentType = response.headers.get('content-type');
                console.log('Content-Type:', contentType);

                if (contentType && contentType.includes('application/json')) {
                  // JSON metadata
                  const metadata = await response.json();
                  console.log('Parsed metadata:', metadata);
                  
                  if (metadata.image) {
                    imageUrl = metadata.image.startsWith('ipfs://')
                      ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                      : metadata.image;
                    console.log('Image URL from metadata:', imageUrl);
                  }
                  if (metadata.description) {
                    description = metadata.description;
                  }
                } else if (contentType && (contentType.includes('image/') || contentType.includes('application/octet-stream'))) {
                  // Doğrudan resim URL'si
                  imageUrl = metadataUrl;
                  console.log('Direct image URL:', imageUrl);
                } else {
                  console.log('Unknown content type:', contentType);
                  }
                } catch (fetchError) {
                  console.warn(`Metadata fetch failed for token ${tokenId}:`, fetchError.message);
                  // Fetch hatası durumunda varsayılan değerleri kullan
                  imageUrl = null;
                  description = 'Ürün detayları (metadata yüklenemedi)';
                  clearTimeout(timeoutId); // Timeout'u temizle
                }
              }
            } catch (tokenError) {
              console.log(`Token ${tokenId} URI alınamadı:`, tokenError.message);
            }
          } catch (err) {
            console.error('Contract error:', err);
          }

          // Escrow durumunu belirle
          const status = event.topics[0] === escrowCreatedTopic ? 'pending' :
                        event.topics[0] === escrowReleasedTopic ? 'released' :
                        event.topics[0] === escrowRefundedTopic ? 'refunded' : 'unknown';

          // Sipariş adını duruma göre belirle
          let orderName = `Sipariş #${tokenId}`;
          if (status === 'pending') {
            orderName = 'Bekleyen Sipariş';
          } else if (status === 'released') {
            orderName = 'Tamamlanan Sipariş';
          } else if (status === 'refunded') {
            orderName = 'İade Edilen Sipariş';
          }

          return {
            id: tokenId,
            name: orderName,
            amount: escrow.args.amount ? ethers.utils.formatEther(escrow.args.amount) : '0',
            status: status,
            createdAt: new Date(timestamp * 1000).toISOString(),
            imageUrl: imageUrl,
            description: description,
            price: nftData[tokenId]?.price ? ethers.utils.formatEther(nftData[tokenId].price) : '0'
          };
        } catch (error) {
          console.error('Escrow processing error:', error);
          return null;
        }
      });

      const escrowResults = await Promise.allSettled(escrowPromises);
      const escrows = escrowResults
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);

      // Geçersiz escrow'ları filtrele
      const validEscrows = escrows.filter(escrow => escrow !== null);

      // En erken tarihi bul
      const earliestDate = validEscrows.length > 0
        ? new Date(Math.min(...validEscrows.map(e => new Date(e.createdAt).getTime())))
        : new Date();

      // Kullanıcı verilerini oluştur
      const userData = {
        address: account,
        isSeller: validEscrows.some(e => e.status === 'released'),
        isBuyer: validEscrows.some(e => e.status === 'refunded'),
        escrows: validEscrows,
        createdAt: earliestDate.toISOString()
      };

      console.log('Oluşturulan kullanıcı verisi:', userData);
      setUserData(userData);

    } catch (err) {
      console.error('Kullanıcı bilgileri alınırken hata:', err);
      setError('Kullanıcı bilgileri alınırken bir hata oluştu: ' + err.message);
    } finally {
          setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && account) {
      fetchUserData();
    }
  }, [contract, account]);

  useEffect(() => {
    const getContractOwner = async () => {
      if (contract) {
        try {
          const owner = await contract.owner();
          setContractOwner(owner);
          console.log('Contract sahibi:', owner);
        } catch (err) {
          console.error('Contract sahibi alınamadı:', err);
        }
      }
    };

    getContractOwner();
  }, [contract]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Sipariş durumu ikonlarını kullan
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  // Escrow serbest bırakma fonksiyonu
  const handleReleaseEscrow = async (escrowId) => {
    if (!contract || !account) {
      setError('Lütfen cüzdanınızı bağlayın');
      return;
    }

    try {
      setProcessingEscrow(true);
      setError(null);

      // Contract owner'ını kontrol et
      const owner = await contract.owner();
      if (owner.toLowerCase() !== account.toLowerCase()) {
        setError(`Bu işlemi sadece contract sahibi yapabilir. Contract sahibi: ${owner}`);
        return;
      }

      // Contract'ı signer ile başlat
      const signer = contract.provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.releaseEscrow(escrowId);
      console.log('Release transaction sent:', tx.hash);
      
      await tx.wait();
      console.log('Release transaction confirmed');

      // İşlem başarılı olduktan sonra kullanıcı verilerini güncelle
      await fetchUserData();
      setSuccessMessage('Escrow başarıyla serbest bırakıldı');
    } catch (err) {
      console.error('Escrow serbest bırakma hatası:', err);
      if (err.message.includes('Ownable: caller is not the owner')) {
        setError(`Bu işlemi sadece contract sahibi yapabilir. Contract sahibi: ${contractOwner}`);
      } else {
        setError('Escrow serbest bırakılırken bir hata oluştu: ' + err.message);
      }
    } finally {
      setProcessingEscrow(false);
    }
  };

  // Escrow iade fonksiyonu
  const handleRefund = async (escrowId) => {
    if (!contract || !account) {
      setError('Lütfen cüzdanınızı bağlayın');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Frontend'deki escrow verilerinden alıcı kontrolü yap
      const escrowData = userData?.escrows?.find(e => e.id === escrowId);
      if (!escrowData) {
        setError('Escrow bulunamadı');
        setLoading(false);
        return;
      }

      // Sadece alıcı (buyer) refund yapabilir - kontratta buyer kontrolü yapılacak
      if (escrowData.buyer?.toLowerCase() !== account?.toLowerCase()) {
        setError('Sadece alıcı iade işlemi yapabilir');
        setLoading(false);
        return;
      }

      // Kontratta refundEscrow fonksiyonunu çağır
      const signer = contract.provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      
      const tx = await contractWithSigner.refundEscrow(escrowId);
      console.log('Refund transaction sent:', tx.hash);
      
      await tx.wait();
      console.log('Refund transaction confirmed');
      
      // İşlem başarılı olduğunda kullanıcı verilerini güncelle
      await fetchUserData();
      
      setSuccessMessage('İade işlemi başarıyla tamamlandı');
    } catch (err) {
      console.error('Escrow iade hatası:', err);
      if (err.message.includes('No active escrow')) {
        setError('Bu escrow artık aktif değil veya zaten iade edilmiş');
      } else if (err.message.includes('Not the buyer')) {
        setError('Sadece alıcı iade işlemi yapabilir');
      } else if (err.message.includes('user rejected')) {
        setError('İşlem kullanıcı tarafından reddedildi');
      } else {
        setError('İade işlemi sırasında bir hata oluştu: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cüzdan adresini kısalt
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Adresi kopyala
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Adres kopyalandı!');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!userData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Lütfen cüzdanınızı bağlayın
        </Alert>
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
        <Typography color="text.primary">Profilim</Typography>
      </Breadcrumbs>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Profile Header */}
      <ProfileHeader>
        <Container>
          <ProfileAvatar>
            {userData?.address?.charAt(0).toUpperCase()}
          </ProfileAvatar>
          
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            {shortenAddress(userData?.address)}
              </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {userData?.isSeller ? 'Üretici' : userData?.isBuyer ? 'Müşteri' : 'Kullanıcı'}
            </Typography>
            {userData?.isSeller && (
              <Chip
                icon={<VerifiedIcon />}
                label="Doğrulanmış"
                color="success"
                sx={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Tooltip title="Adresi kopyala">
              <IconButton
                onClick={() => copyToClipboard(userData?.address)}
                sx={{ color: 'white', '&:hover': { background: 'rgba(255, 255, 255, 0.1)' } }}
              >
                <CopyIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="body1" sx={{ opacity: 0.8 }}>
            Üyelik: {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('tr-TR') : 'Yeni Üye'}
              </Typography>
            </Box>
        </Container>
      </ProfileHeader>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard>
            <CartIcon sx={{ fontSize: 40, color: '#667eea', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
              {userData?.escrows?.length || 0}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Toplam Sipariş
            </Typography>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard>
            <CheckCircleIcon sx={{ fontSize: 40, color: '#667eea', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
              {userData?.escrows?.filter(e => e.status === 'completed')?.length || 0}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tamamlanan
            </Typography>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard>
            <PendingIcon sx={{ fontSize: 40, color: '#667eea', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
              {userData?.escrows?.filter(e => e.status === 'pending')?.length || 0}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bekleyen
            </Typography>
          </StatCard>
        </Grid>
      </Grid>

      {/* Tabs */}
      <StyledTabs 
                value={activeTab} 
                onChange={handleTabChange}
          centered
        sx={{ mb: 4 }}
      >
        <Tab 
          label="Profil Bilgileri" 
          icon={<AccountIcon />}
          iconPosition="start"
        />
        <Tab 
          label="Siparişlerim" 
          icon={<ShoppingBag />}
          iconPosition="start"
        />
      </StyledTabs>

      {/* Tab Content */}
              {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <InfoCard>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#2d3748' }}>
                Hesap Bilgileri
                  </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <WalletIcon sx={{ mr: 2, color: '#667eea' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cüzdan Adresi
                        </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {shortenAddress(userData?.address)}
                        </Typography>
                      </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <StoreIcon sx={{ mr: 2, color: '#667eea' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                          Hesap Türü
                        </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {userData?.isSeller ? 'Üretici' : userData?.isBuyer ? 'Müşteri' : 'Kullanıcı'}
                        </Typography>
                      </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 2, color: '#667eea' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                          Üyelik Tarihi
                        </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('tr-TR') : 'Yeni Üye'}
                  </Typography>
                </Box>
              </Box>
              </CardContent>
            </InfoCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <InfoCard>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#2d3748' }}>
                  Hesap Durumu
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <VerifiedIcon sx={{ mr: 2, color: '#667eea' }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Doğrulama Durumu
                    </Typography>
                    <Chip
                      label={userData?.isSeller ? 'Doğrulanmış Üretici' : 'Standart Kullanıcı'}
                      color={userData?.isSeller ? 'success' : 'default'}
                      size="small"
                    />
          </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CartIcon sx={{ mr: 2, color: '#667eea' }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Aktif Siparişler
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
                      {userData?.escrows?.filter(e => e.status === 'pending')?.length || 0}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ mr: 2, color: '#667eea' }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tamamlanan Siparişler
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
                      {userData?.escrows?.filter(e => e.status === 'completed')?.length || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </InfoCard>
          </Grid>
        </Grid>
        )}

        {activeTab === 1 && (
          <Box>
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: '#2d3748' }}>
                Siparişlerim
              </Typography>
          
              {userData?.escrows && userData.escrows.length > 0 ? (
            userData.escrows.map((escrow, index) => (
              <OrderCard key={`escrow-${escrow.id}-${index}`}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ mr: 2, bgcolor: '#667eea' }}>
                          {getStatusIcon(escrow.status)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                        {escrow.name || `Sipariş #${escrow.id}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(escrow.createdAt)}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                        {escrow.amount} ETH
                      </Typography>
                      <Chip
                        label={escrow.status === 'pending' ? 'Beklemede' : escrow.status}
                        color={escrow.status === 'pending' ? 'warning' : 'success'}
                        size="small"
                      />
                    </Box>
                      </Box>
                      
                      {escrow.status === 'pending' && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ 
                                width: '100%', 
                            height: 200, 
                                bgcolor: 'grey.100', 
                            borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                              }}>
                                {escrow.imageUrl ? (
                                  <img 
                                    src={escrow.imageUrl} 
                                    alt="Ürün Görseli" 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover' 
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                                )}
                              </Box>
                            </Grid>
                        
                            <Grid item xs={12} sm={8}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2d3748' }}>
                            Sipariş Detayları
                          </Typography>
                          
                              <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Sipariş ID
                                  </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                #{escrow.id}
                                  </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Tutar
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {escrow.amount} ETH
                                  </Typography>
                                </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Satıcı
                                  </Typography>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  color: '#667eea',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={() => copyToClipboard(contractOwner)}
                              >
                                {shortenAddress(contractOwner)}
                                  </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Alıcı
                              </Typography>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  color: '#667eea',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={() => copyToClipboard(account)}
                              >
                                {shortenAddress(account)}
                                  </Typography>
                                </Grid>
                              </Grid>
                          
                          {escrow.description && (
                            <Typography variant="body2" sx={{ mt: 2, color: '#4a5568' }}>
                              {escrow.description}
                            </Typography>
                          )}
                    </Grid>
                  </Grid>
                          
                      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {contractOwner?.toLowerCase() === account?.toLowerCase() ? (
                          <ModernButton
                                onClick={() => handleReleaseEscrow(escrow.id)}
                                disabled={processingEscrow}
                                startIcon={<CheckCircleIcon />}
                              >
                                Siparişi Onayla
                          </ModernButton>
                            ) : (
                          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Sipariş onayı için satıcı bekleniyor...
                              </Typography>
                            )}
                        
                        {contractOwner?.toLowerCase() !== account?.toLowerCase() && (
                            <Button
                              variant="outlined"
                              color="error" 
                              onClick={() => handleRefund(escrow.id)}
                              disabled={processingEscrow}
                              startIcon={<CancelIcon />}
                            sx={{ 
                              borderColor: '#f44336', 
                              color: '#f44336',
                              borderRadius: 2,
                              '&:hover': {
                                borderColor: '#d32f2f',
                                backgroundColor: 'rgba(244, 67, 54, 0.05)',
                              }
                            }}
                            >
                              Sipariş İptali
                            </Button>
                        )}
                          </Box>
                    </>
                  )}
                </CardContent>
              </OrderCard>
            ))
          ) : (
            <InfoCard>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <ShoppingBag sx={{ fontSize: 80, color: 'grey.400', mb: 3 }} />
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#2d3748' }}>
                  Henüz Siparişiniz Yok
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Ürün satın alarak siparişlerinizi buradan takip edebilirsiniz.
                </Typography>
                <ModernButton onClick={() => navigate('/')}>
                  Ürünleri Keşfet
                </ModernButton>
              </CardContent>
            </InfoCard>
          )}
          </Box>
              )}
    </Container>
  );
};

export default Profile; 