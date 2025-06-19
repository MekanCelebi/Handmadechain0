import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Styled components
const ProductCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    '& .MuiCardMedia-root': {
      transform: 'scale(1.05)',
    },
  },
  '& .MuiCardMedia-root': {
    transition: 'transform 0.3s ease',
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

const CategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter state
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [priceRange, setPriceRange] = useState([
    parseFloat(searchParams.get('minPrice')) || 0,
    parseFloat(searchParams.get('maxPrice')) || 10
  ]);

  // Category mapping
  const categoryMapping = {
    'El Yapımı Takı': 'El Yapımı Takı',
    'El Yapımı Çanta': 'El Yapımı Çanta',
    'El Yapımı Dekorasyon': 'El Yapımı Dekorasyon',
    'El Yapımı Giyim': 'El Yapımı Giyim',
    'El Yapımı Aksesuar': 'El Yapımı Aksesuar',
    'Diğer': 'Diğer'
  };

  const categoryIcon = {
    'El Yapımı Takı': '💍',
    'El Yapımı Çanta': '👜',
    'El Yapımı Dekorasyon': '🏠',
    'El Yapımı Giyim': '👕',
    'El Yapımı Aksesuar': '👒',
    'Diğer': '✨'
  };

  useEffect(() => {
    fetchCategoryProducts();
  }, [category, searchParams]);

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (searchParams.get('sort')) params.append('sort', searchParams.get('sort'));
      if (searchParams.get('minPrice')) params.append('minPrice', searchParams.get('minPrice'));
      if (searchParams.get('maxPrice')) params.append('maxPrice', searchParams.get('maxPrice'));
      
      const response = await axios.get(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}?${params}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Category fetch error:', error);
      setError('Kategori ürünleri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (event) => {
    const newSort = event.target.value;
    setSortBy(newSort);
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    setSearchParams(params);
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
    const params = new URLSearchParams(searchParams);
    if (newValue[0] > 0) {
      params.set('minPrice', newValue[0].toString());
    } else {
      params.delete('minPrice');
    }
    if (newValue[1] < 10) {
      params.set('maxPrice', newValue[1].toString());
    } else {
      params.delete('maxPrice');
    }
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSortBy('newest');
    setPriceRange([0, 10]);
    setSearchParams({});
  };

  if (loading) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
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
        <Typography color="text.primary">{category}</Typography>
      </Breadcrumbs>

      {/* Category Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
          {categoryIcon[category] || '📦'}
        </Typography>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#2d3748', mb: 2 }}>
          {category}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
          {products.length} ürün bulundu
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Sıralama</InputLabel>
              <Select
                value={sortBy}
                label="Sıralama"
                onChange={handleSortChange}
              >
                <MenuItem value="newest">En Yeni</MenuItem>
                <MenuItem value="oldest">En Eski</MenuItem>
                <MenuItem value="price-asc">Fiyat (Düşük-Yüksek)</MenuItem>
                <MenuItem value="price-desc">Fiyat (Yüksek-Düşük)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Fiyat Aralığı: {priceRange[0]} - {priceRange[1]} ETH
            </Typography>
            <Slider
              value={priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              min={0}
              max={10}
              step={0.1}
              sx={{ color: '#667eea' }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              sx={{ borderRadius: 2 }}
            >
              Filtreleri Temizle
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom color="text.secondary">
            Bu kategoride ürün bulunamadı
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Filtrelerinizi değiştirerek tekrar deneyin veya başka bir kategori seçin.
          </Typography>
          <ModernButton onClick={() => navigate('/')}>
            Anasayfaya Dön
          </ModernButton>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <ProductCard>
                <CardMedia
                  component="img"
                  height="250"
                  image={product.gatewayUrls?.[0] || (product.images[0]?.startsWith('ipfs://') ? `${API_BASE_URL}/${product.images[0].replace('ipfs://', '')}` : `${API_BASE_URL}/${product.images[0]}`)}
                  alt={product.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  <Typography 
                    gutterBottom 
                    variant="h6" 
                    component="div"
                    sx={{ 
                      fontWeight: 600,
                      color: '#2d3748',
                      mb: 2
                    }}
                  >
                    {product.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 3,
                      lineHeight: 1.6
                    }}
                  >
                    {product.description.substring(0, 100)}...
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <Typography 
                      variant="h5" 
                      color="primary"
                      sx={{ 
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {product.price} ETH
                    </Typography>
                    <Chip
                      label={product.category}
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <ModernButton
                    fullWidth
                    startIcon={<CartIcon />}
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    İncele
                  </ModernButton>
                </CardActions>
              </ProductCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default CategoryPage; 