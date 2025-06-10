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
  Button
} from '@mui/material';
import {
  Person,
  ShoppingBag,
  Favorite,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import { useWeb3 } from '../contexts/Web3Context';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';

const InfoBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
}));

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const { contract, account } = useWeb3();
  const [processingEscrow, setProcessingEscrow] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [contractOwner, setContractOwner] = useState(null);

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
      const escrowEvents = await contract.provider.getLogs(escrowFilter);
      console.log('Escrow olayları:', escrowEvents);

      // NFT olaylarını al
      const nftMintTopic = ethers.utils.id("DebugMintNFT(uint256,string,uint256)");
      const nftFilter = {
        fromBlock: 0,
        toBlock: 'latest',
        topics: [nftMintTopic]
      };
      const nftEvents = await contract.provider.getLogs(nftFilter);
      console.log('NFT olayları:', nftEvents);

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
      const escrows = await Promise.all(escrowEvents.map(async (event) => {
        try {
          const escrow = contract.interface.parseLog(event);
          console.log('Escrow verisi:', escrow);
          
          // Block timestamp'i al
          const block = await contract.provider.getBlock(event.blockNumber);
          const timestamp = block.timestamp;

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
                // IPFS URL'sini düzenle
                const metadataUrl = tokenURI.startsWith('ipfs://') 
                  ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
                  : tokenURI;
                
                console.log('Fetching metadata from:', metadataUrl);
                const response = await fetch(metadataUrl);
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
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
            amount: ethers.utils.formatEther(escrow.args.amount || '0'),
            status,
            createdAt: new Date(timestamp * 1000).toISOString(),
            seller: escrow.args.seller || escrow.args.creator || account,
            buyer: escrow.args.buyer || account,
            name: orderName,
            description,
            imageUrl,
            price: nftData[tokenId]?.price ? ethers.utils.formatEther(nftData[tokenId].price) : '0'
          };
        } catch (err) {
          console.error('Escrow işlenirken hata:', err);
          return null;
        }
      }));

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
          setError('Kullanıcı bilgileri alınırken bir hata oluştu');
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
      await tx.wait();

      // İşlem başarılı olduktan sonra kullanıcı verilerini güncelle
      await fetchUserData();
      setSuccessMessage('Escrow başarıyla serbest bırakıldı');
    } catch (err) {
      console.error('Escrow serbest bırakma hatası:', err);
      if (err.message.includes('Ownable: caller is not the owner')) {
        setError(`Bu işlemi sadece contract sahibi yapabilir. Contract sahibi: ${contractOwner}`);
      } else {
        setError('Escrow serbest bırakılırken bir hata oluştu');
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

      // Önce escrow'un durumunu kontrol et
      const escrow = await contract.getEscrow(escrowId);
      console.log('Escrow durumu:', escrow);

      if (!escrow.isActive) {
        setError('Bu escrow artık aktif değil');
        setLoading(false);
        return;
      }

      if (escrow.seller.toLowerCase() !== account.toLowerCase()) {
        setError('Sadece satıcı iade işlemi yapabilir');
        setLoading(false);
        return;
      }

      const tx = await contract.refundEscrow(escrowId);
      await tx.wait();
      
      // İşlem başarılı olduğunda kullanıcı verilerini güncelle
      await fetchUserData();
      
      setSuccessMessage('İade işlemi başarıyla tamamlandı');
    } catch (err) {
      console.error('Escrow iade hatası:', err);
      if (err.message.includes('No active escrow')) {
        setError('Bu escrow artık aktif değil veya zaten iade edilmiş');
      } else if (err.message.includes('Only seller can refund')) {
        setError('Sadece satıcı iade işlemi yapabilir');
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
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar>
            {userData?.address?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" sx={{ mt: 3, fontWeight: 600, color: '#1a237e' }}>
            {userData?.address}
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mt: 1, 
              color: userData?.isSeller ? '#2e7d32' : userData?.isBuyer ? '#1976d2' : '#1a237e',
                  fontWeight: 500
                }}
              >
            {userData?.isSeller ? 'Üretici' : userData?.isBuyer ? 'Müşteri' : ''}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 1, 
              color: 'text.secondary'
            }}
          >
            Üyelik: {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('tr-TR') : 'Yeni Üye'}
              </Typography>
            </Box>

              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
          centered
          sx={{ mb: 3 }}
        >
          <Tab label="Profil Bilgileri" />
          <Tab label="Siparişlerim" />
              </Tabs>

              {activeTab === 0 && (
          <Box>
                <InfoBox>
              <Typography variant="h6" sx={{ mb: 2, color: '#1a237e' }}>
                Hesap Bilgileri
                  </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cüzdan Adresi
                        </Typography>
                        <Typography variant="body1">
                    {userData?.address}
                        </Typography>
                      </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                          Hesap Türü
                        </Typography>
                        <Typography variant="body1">
                    {userData?.isSeller ? 'Üretici' : userData?.isBuyer ? 'Müşteri' : ''}
                        </Typography>
                      </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                          Üyelik Tarihi
                        </Typography>
                        <Typography variant="body1">
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('tr-TR') : 'Yeni Üye'}
                  </Typography>
                </Box>
              </Box>
            </InfoBox>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <InfoBox>
              <Typography variant="h6" sx={{ mb: 2, color: '#1a237e' }}>
                Siparişlerim
              </Typography>
              {userData?.escrows && userData.escrows.length > 0 ? (
                <List>
                  {userData.escrows.map((escrow, index) => (
                    <ListItem key={`escrow-${escrow.id}-${index}`} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ListItemAvatar>
                          {getStatusIcon(escrow.status)}
                        </ListItemAvatar>
                        <ListItemText
                          primary={escrow.name || `Sipariş #${escrow.id}`}
                          secondary={`Durum: ${escrow.status}`}
                        />
                        <Typography variant="body2" color="primary">
                          Tutar: {escrow.amount} ETH
                        </Typography>
                      </Box>
                      
                      {/* Sipariş Detayları */}
                      {escrow.status === 'pending' && (
                        <Box sx={{ width: '100%', mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Sipariş Detayları
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ 
                                width: '100%', 
                                height: 150, 
                                bgcolor: 'grey.100', 
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 1,
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
                                      console.error('Image load error:', e);
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary" align="center">
                                {escrow.description}
                              </Typography>
                              {escrow.price && escrow.price !== '0' && (
                                <Typography variant="body2" color="primary" align="center" sx={{ mt: 1 }}>
                                  Fiyat: {escrow.price} ETH
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={12} sm={8}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Sipariş ID:</strong> {escrow.id}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Tutar:</strong> {escrow.amount} ETH
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Durum:</strong> Beklemede
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Satıcı:</strong> {contractOwner}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Alıcı:</strong> {account}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Sipariş Tarihi:</strong> {formatDate(escrow.createdAt)}
                                  </Typography>
                                </Grid>
                              </Grid>
                    </Grid>
                  </Grid>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {contractOwner?.toLowerCase() === account?.toLowerCase() ? (
                              <Button
                                variant="contained"
                                color="primary" 
                                size="small"
                                onClick={() => handleReleaseEscrow(escrow.id)}
                                disabled={processingEscrow}
                                startIcon={<CheckCircleIcon />}
                              >
                                Siparişi Onayla
                              </Button>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Sipariş onayı için satıcı bekleniyor
                              </Typography>
                            )}
                            <Button
                              variant="outlined"
                              color="error" 
                              size="small"
                              onClick={() => handleRefund(escrow.id)}
                              disabled={processingEscrow}
                              startIcon={<CancelIcon />}
                            >
                              Sipariş İptali
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Henüz siparişiniz bulunmuyor.
                </Alert>
              )}
                </InfoBox>
          </Box>
              )}
      </Paper>
    </Container>
  );
};

export default Profile; 