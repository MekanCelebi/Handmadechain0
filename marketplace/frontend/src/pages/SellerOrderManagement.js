import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  MonetizationOn as MonetizationOnIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const SellerOrderManagement = () => {
  const { contract, account, provider } = useWeb3();
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingEscrow, setProcessingEscrow] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsDialog, setOrderDetailsDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'released', 'refunded'
  const [escrowDuration, setEscrowDuration] = useState(7 * 24 * 60 * 60); // 7 gün varsayılan (saniye cinsinden)
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [confirmReleaseDialog, setConfirmReleaseDialog] = useState(false);
  const [escrowToRelease, setEscrowToRelease] = useState(null);

  useEffect(() => {
    if (contract && account) {
      fetchOrders();
    }
  }, [contract, account]);

  // Gerçek zamanlı süre güncellemesi
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 60000); // Her dakika güncelle

    return () => clearInterval(timer);
  }, []);

  // Filter orders based on status
  useEffect(() => {
    if (filterStatus === 'all') {
      setOrders(allOrders);
    } else {
      const filtered = allOrders.filter(order => {
        switch (filterStatus) {
          case 'active':
            return order.isActive && !order.isReleased && !order.isRefunded;
          case 'released':
            return order.isReleased;
          case 'refunded':
            return order.isRefunded;
          default:
            return true;
        }
      });
      setOrders(filtered);
    }
  }, [allOrders, filterStatus]);

  // Escrow süre kontrolü
  const canReleaseEscrow = (order) => {
    if (!order.isActive) return false;
    
    const timeElapsed = currentTime - order.timestamp;
    
    // Minimum 24 saat geçmeli (86400 saniye)
    return timeElapsed >= 86400;
  };

  const getTimeRemaining = (order) => {
    if (!order.isActive) return null;
    
    const timeElapsed = currentTime - order.timestamp;
    const minTimeRequired = 86400; // 24 saat
    
    if (timeElapsed >= minTimeRequired) {
      return { canRelease: true, remaining: 0 };
    }
    
    const remaining = minTimeRequired - timeElapsed;
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    return { 
      canRelease: false, 
      remaining,
      display: `${hours}s ${minutes}dk`
    };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching orders for seller:', account);

      // Contract owner kontrolü - geçici olarak kaldırıldı
      const owner = await contract.owner();
      console.log('Contract owner:', owner);
      console.log('Current account:', account);

      // Geçici olarak owner kontrolünü kaldırıyoruz
      // if (owner.toLowerCase() !== account.toLowerCase()) {
      //   setError('Bu sayfaya erişim yetkiniz yok. Sadece kontrat sahibi siparişleri yönetebilir.');
      //   setLoading(false);
      //   return;
      // }

      // Escrow event'lerini al
      const escrowCreatedSignature = "EscrowCreated(uint256,address,uint256)";
      const escrowReleasedSignature = "EscrowReleased(uint256,address,uint256)";
      const escrowRefundedSignature = "EscrowRefunded(uint256,address,uint256)";
      
      const escrowCreatedTopic = ethers.utils.id(escrowCreatedSignature);
      const escrowReleasedTopic = ethers.utils.id(escrowReleasedSignature);
      const escrowRefundedTopic = ethers.utils.id(escrowRefundedSignature);

      // Tüm escrow event'lerini al
      const createdEvents = await contract.queryFilter({
        address: contract.address,
        topics: [escrowCreatedTopic],
        fromBlock: 0,
        toBlock: 'latest'
      });

      const releasedEvents = await contract.queryFilter({
        address: contract.address,
        topics: [escrowReleasedTopic],
        fromBlock: 0,
        toBlock: 'latest'
      });

      const refundedEvents = await contract.queryFilter({
        address: contract.address,
        topics: [escrowRefundedTopic],
        fromBlock: 0,
        toBlock: 'latest'
      });

      console.log('Created events:', createdEvents.length);
      console.log('Released events:', releasedEvents.length);
      console.log('Refunded events:', refundedEvents.length);

      // Released ve refunded escrow ID'lerini topla
      const releasedEscrowIds = new Set();
      const refundedEscrowIds = new Set();

      releasedEvents.forEach(event => {
        const escrowId = event.args.escrowId.toString();
        releasedEscrowIds.add(escrowId);
      });

      refundedEvents.forEach(event => {
        const escrowId = event.args.escrowId.toString();
        refundedEscrowIds.add(escrowId);
      });

      // Tüm escrow'ları işle
      const allEscrows = [];

      for (const event of createdEvents) {
        try {
          const [escrowId, buyer, amount] = event.args;
          const escrowIdStr = escrowId.toString();
          
          console.log('Processing escrow:', { escrowId: escrowIdStr, buyer, amount: ethers.utils.formatEther(amount) });

          // Escrow durumunu belirle
          const isReleased = releasedEscrowIds.has(escrowIdStr);
          const isRefunded = refundedEscrowIds.has(escrowIdStr);
          const isActive = !isReleased && !isRefunded;

          allEscrows.push({
            escrowId: escrowIdStr,
            buyer,
            amount: ethers.utils.formatEther(amount),
            tokenId: escrowIdStr, // Geçici olarak escrow ID'yi token ID olarak kullan
            product: null, // Product data yok çünkü escrow'lar NFT'lerle ilişkili değil
            timestamp: event.blockNumber,
            isActive,
            isReleased,
            isRefunded
          });
        } catch (error) {
          console.error('Error processing escrow event:', error);
        }
      }
      
      console.log('All escrows:', allEscrows);
      setAllOrders(allEscrows);

    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Siparişler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseEscrow = async (escrowId) => {
    try {
      setProcessingEscrow(true);
      setError('');

      console.log('Releasing escrow:', escrowId);

      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.releaseEscrow(escrowId);
      console.log('Release transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Release transaction confirmed:', receipt);

      setSuccessMessage('Escrow başarıyla serbest bırakıldı!');
      
      // Siparişleri yenile
      setTimeout(() => {
        fetchOrders();
        setSuccessMessage('');
      }, 2000);

    } catch (error) {
      console.error('Error releasing escrow:', error);
      setError('Escrow serbest bırakılırken bir hata oluştu: ' + error.message);
    } finally {
      setProcessingEscrow(false);
    }
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setOrderDetailsDialog(true);
  };

  const getStatusChip = (order) => {
    if (order.isRefunded) {
      return <Chip label="İade Edildi" color="error" />;
    } else if (order.isReleased) {
      return <Chip label="Serbest Bırakıldı" color="success" />;
    } else if (order.isActive) {
      return <Chip label="Aktif" color="primary" />;
    } else {
      return <Chip label="Bilinmiyor" color="default" />;
    }
  };

  const getEscrowIcon = (order) => {
    if (order.isRefunded) {
      return <CancelIcon sx={{ fontSize: 40, color: '#f44336' }} />;
    } else if (order.isReleased) {
      return <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />;
    } else if (order.isActive) {
      return <MonetizationOnIcon sx={{ fontSize: 40, color: '#2196f3' }} />;
    } else {
      return <AccountBalanceIcon sx={{ fontSize: 40, color: '#9e9e9e' }} />;
    }
  };

  const getEscrowBackground = (order) => {
    if (order.isRefunded) {
      return 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)';
    } else if (order.isReleased) {
      return 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)';
    } else if (order.isActive) {
      return 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
    } else {
      return 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Sipariş Yönetimi
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={filterStatus === 'all' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setFilterStatus('all')}
          >
            Tümü
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setFilterStatus('active')}
          >
            Aktif
          </Button>
          <Button
            variant={filterStatus === 'released' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setFilterStatus('released')}
          >
            Serbest Bırakılan
          </Button>
          <Button
            variant={filterStatus === 'refunded' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setFilterStatus('refunded')}
          >
            İade Edilen
          </Button>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={fetchOrders}
            disabled={loading}
          >
            Yenile
          </Button>
        </Box>
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {filterStatus === 'all' ? 'Henüz escrow bulunmuyor' : 
             filterStatus === 'active' ? 'Henüz aktif escrow bulunmuyor' :
             filterStatus === 'released' ? 'Henüz serbest bırakılan escrow bulunmuyor' :
             'Henüz iade edilen escrow bulunmuyor'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filterStatus === 'all' ? 'Müşterilerden gelen escrow işlemleri burada görünecek' :
             filterStatus === 'active' ? 'Aktif escrow işlemleri burada görünecek' :
             filterStatus === 'released' ? 'Serbest bırakılan escrow işlemleri burada görünecek' :
             'İade edilen escrow işlemleri burada görünecek'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} md={6} lg={4} key={order.escrowId}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                background: getEscrowBackground(order),
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                }
              }}>
                {/* Visual Header */}
                <Box sx={{ 
                  position: 'relative', 
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  {getEscrowIcon(order)}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8,
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ReceiptIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Box>
                </Box>
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {order.product?.name || `Escrow #${order.escrowId}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {order.product?.description || 'ETH Escrow İşlemi'}...
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      {order.amount} ETH
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alıcı: {order.buyer.substring(0, 6)}...{order.buyer.substring(-4)}
                    </Typography>
                    {order.isActive && (
                      <Box sx={{ mt: 1 }}>
                        {(() => {
                          const timeInfo = getTimeRemaining(order);
                          if (!timeInfo) return null;
                          
                          if (timeInfo.canRelease) {
                            return (
                              <Chip 
                                label="Serbest Bırakılabilir" 
                                color="success" 
                                size="small"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            );
                          } else {
                            return (
                              <Chip 
                                label={`${timeInfo.display} sonra`} 
                                color="warning" 
                                size="small"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            );
                          }
                        })()}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    {getStatusChip(order)}
                  </Box>
                </CardContent>
                <CardActions sx={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewOrderDetails(order)}
                    sx={{ color: 'text.primary' }}
                  >
                    Detaylar
                  </Button>
                  {order.isActive && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<PaymentIcon />}
                      onClick={() => {
                        setEscrowToRelease(order);
                        setConfirmReleaseDialog(true);
                      }}
                      disabled={processingEscrow || !canReleaseEscrow(order)}
                      sx={{
                        background: canReleaseEscrow(order) 
                          ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                          : 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                        '&:hover': { 
                          opacity: canReleaseEscrow(order) ? 0.9 : 1 
                        }
                      }}
                      title={!canReleaseEscrow(order) ? '24 saat geçmeden serbest bırakılamaz' : 'DİKKAT: Serbest bırakıldıktan sonra alıcı iade alamaz!'}
                    >
                      {processingEscrow ? <CircularProgress size={16} /> : 'Serbest Bırak'}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Order Details Dialog */}
      <Dialog 
        open={orderDetailsDialog} 
        onClose={() => setOrderDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Sipariş Detayları
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Escrow Bilgileri
                </Typography>
                <Typography variant="body1">
                  <strong>Escrow ID:</strong> {selectedOrder.escrowId}
                </Typography>
                <Typography variant="body1">
                  <strong>Açıklama:</strong> ETH Escrow İşlemi
                </Typography>
                <Typography variant="body1">
                  <strong>Kategori:</strong> Kripto Para Transferi
                </Typography>
                <Typography variant="body1">
                  <strong>Token ID:</strong> {selectedOrder.tokenId}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Sipariş Bilgileri
                </Typography>
                <Typography variant="body1">
                  <strong>Escrow ID:</strong> {selectedOrder.escrowId}
                </Typography>
                <Typography variant="body1">
                  <strong>Alıcı Adresi:</strong> {selectedOrder.buyer}
                </Typography>
                <Typography variant="body1">
                  <strong>Tutar:</strong> {selectedOrder.amount} ETH
                </Typography>
                <Box sx={{ mt: 1, mb: 1 }}>
                  <strong>Durum:</strong> {getStatusChip(selectedOrder)}
                </Box>
                <Typography variant="body1">
                  <strong>Blok Numarası:</strong> {selectedOrder.timestamp}
                </Typography>
                {selectedOrder.isActive && (
                  <Box sx={{ mt: 2 }}>
                    {(() => {
                      const timeInfo = getTimeRemaining(selectedOrder);
                      if (!timeInfo) return null;
                      
                      if (timeInfo.canRelease) {
                        return (
                          <>
                            <Alert severity="success" sx={{ fontSize: '0.9rem', mb: 2 }}>
                              Bu escrow artık serbest bırakılabilir. 24 saat geçti.
                            </Alert>
                            <Alert severity="warning" sx={{ fontSize: '0.9rem' }}>
                              ⚠️ <strong>Önemli:</strong> Escrow serbest bırakıldıktan sonra alıcı iade alamaz. 
                              Bu işlem geri alınamaz!
                            </Alert>
                          </>
                        );
                      } else {
                        return (
                          <Alert severity="warning" sx={{ fontSize: '0.9rem' }}>
                            Bu escrow henüz serbest bırakılamaz. {timeInfo.display} daha beklemek gerekiyor.
                          </Alert>
                        );
                      }
                    })()}
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDetailsDialog(false)}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Release Dialog */}
      <Dialog
        open={confirmReleaseDialog}
        onClose={() => setConfirmReleaseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ⚠️ Escrow Serbest Bırakma Onayı
        </DialogTitle>
        <DialogContent>
          {escrowToRelease && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  DİKKAT: Bu işlem geri alınamaz!
                </Typography>
                <Typography variant="body2">
                  • Escrow serbest bırakıldıktan sonra alıcı iade alamaz
                  • Para doğrudan sizin cüzdanınıza transfer edilir
                  • Bu işlem blockchain'de kalıcı olarak kaydedilir
                </Typography>
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Escrow Detayları:
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Escrow ID:</strong> {escrowToRelease.escrowId}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Alıcı:</strong> {escrowToRelease.buyer}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Tutar:</strong> {escrowToRelease.amount} ETH
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Bu işlemi onaylıyor musunuz?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmReleaseDialog(false)}
            color="primary"
          >
            İptal
          </Button>
          <Button 
            onClick={() => {
              handleReleaseEscrow(escrowToRelease.escrowId);
              setConfirmReleaseDialog(false);
            }}
            variant="contained"
            color="error"
            disabled={processingEscrow}
          >
            {processingEscrow ? <CircularProgress size={20} /> : 'Serbest Bırak'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerOrderManagement; 