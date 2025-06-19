import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import { API_BASE_URL } from '../config';
import SellerOrderManagement from './SellerOrderManagement';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)'
}));

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
  color: 'white'
}));

const ProductCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-5px)'
  }
}));

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { contract } = useWeb3();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    activeListings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState('');

  // Kategoriler
  const categories = [
    'El Yapımı Takı',
    'El Yapımı Çanta',
    'El Yapımı Dekorasyon',
    'El Yapımı Giyim',
    'El Yapımı Aksesuar',
    'Diğer'
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    console.log('SellerDashboard - Current token:', token);
    fetchProducts();
    fetchStats();
  }, [token, contract]);

  const fetchProducts = async () => {
    try {
      console.log('SellerDashboard - Fetching products with token:', token);
      if (!token) {
        setError('Oturum açmanız gerekiyor');
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/products/my-products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('SellerDashboard - Products fetch error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.config?.headers
      });
      if (error.response?.status === 401) {
        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else {
        setError('Ürünler yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('SellerDashboard - Fetching stats with token:', token);
      if (!token) {
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/products/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Escrow'lardan toplam satış hesapla
      let totalSales = response.data.totalSales || 0;
      
      if (contract) {
        try {
          const escrowReleasedSignature = "EscrowReleased(uint256,address,uint256)";
          const escrowReleasedTopic = ethers.utils.id(escrowReleasedSignature);
          
          const releasedEvents = await contract.queryFilter({
            address: contract.address,
            topics: [escrowReleasedTopic],
            fromBlock: 0,
            toBlock: 'latest'
          });
          
          let totalReleasedAmount = 0;
          releasedEvents.forEach(event => {
            const amount = ethers.utils.formatEther(event.args.amount);
            totalReleasedAmount += parseFloat(amount);
          });
          
          console.log('Total released amount from escrows:', totalReleasedAmount);
          totalSales = totalReleasedAmount;
        } catch (escrowError) {
          console.error('Error calculating escrow sales:', escrowError);
        }
      }
      
      setStats({
        ...response.data,
        totalSales: totalSales
      });
    } catch (error) {
      console.error('SellerDashboard - Stats fetch error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.config?.headers
      });
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: null
      });
      setImagePreview(product.image);
    } else {
      setSelectedProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image: null
      });
      setImagePreview('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: null
    });
    setImagePreview('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Eğer zaten yükleme yapılıyorsa, yeni gönderimi engelle
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (selectedProduct) {
        await axios.put(`${API_BASE_URL}/products/${selectedProduct._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        await axios.post(`${API_BASE_URL}/products`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      }

      handleCloseDialog();
      fetchProducts();
      fetchStats();
    } catch (error) {
      setError(error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`${API_BASE_URL}/products/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchProducts();
        fetchStats();
      } catch (error) {
        setError('Ürün silinirken bir hata oluştu');
      }
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ 
          background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          Satıcı Paneli
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Ürünlerinizi yönetin ve siparişlerinizi takip edin
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {stats.totalSales.toFixed(4)} ETH
              </Typography>
              <Typography variant="body1">
                Toplam Satış
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {stats.totalProducts}
              </Typography>
              <Typography variant="body1">
                Toplam Ürün
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {stats.activeListings}
              </Typography>
              <Typography variant="body1">
                Aktif İlan
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 3,
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#6C63FF',
              height: 3
            }
          }}
        >
          <Tab 
            icon={<InventoryIcon />} 
            label="Ürün Yönetimi" 
            iconPosition="start"
          />
          <Tab 
            icon={<AssignmentIcon />} 
            label="Sipariş Yönetimi" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Add Product Button */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Ürünlerim
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                '&:hover': { opacity: 0.9 }
              }}
            >
              Yeni Ürün Ekle
            </Button>
          </Box>

          {/* Loading State */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            /* Product List */
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product._id}>
                  <ProductCard>
                    <Box sx={{ position: 'relative', height: 200 }}>
                      <img
                        src={product.gatewayUrls?.[0] || product.images[0]}
                        alt={product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderTopLeftRadius: '16px',
                          borderTopRightRadius: '16px'
                        }}
                      />
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <IconButton
                          onClick={() => handleOpenDialog(product)}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {product.description.substring(0, 100)}...
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {product.price} ETH
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.category}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(product._id)}
                      >
                        Sil
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<ShoppingCartIcon />}
                        onClick={() => navigate(`/product/${product._id}`)}
                        sx={{
                          background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                          '&:hover': { opacity: 0.9 },
                        }}
                      >
                        İncele
                      </Button>
                    </CardActions>
                  </ProductCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <SellerOrderManagement />
        </Box>
      )}

      {/* Product Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ürün Adı"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Fiyat"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Kategori"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <input
                  accept="image/*"
                  type="file"
                  id="image-upload"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCameraIcon />}
                    fullWidth
                  >
                    Ürün Fotoğrafı
                  </Button>
                </label>
              </Grid>
              {imagePreview && (
                <Grid item xs={12}>
                  <img
                    src={selectedProduct ? `${API_BASE_URL}/${imagePreview}` : imagePreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name || !formData.description || !formData.price || !formData.category}
            sx={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
              '&:hover': { opacity: 0.9 }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SellerDashboard; 