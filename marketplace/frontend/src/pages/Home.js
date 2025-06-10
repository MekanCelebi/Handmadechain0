import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingCart as CartIcon,
  LocalOffer as TagIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Styled components
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
  color: 'white',
  padding: theme.spacing(8, 0),
  marginBottom: theme.spacing(6),
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius,
}));

const CategoryCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const ProductCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const CollectionSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 0),
  background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(255, 101, 132, 0.1) 100%)',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(4),
}));

// Categories
const categories = [
  { name: 'El Yapımı Takı', icon: '💍' },
  { name: 'El Yapımı Çanta', icon: '👜' },
  { name: 'El Yapımı Dekorasyon', icon: '🏠' },
  { name: 'El Yapımı Giyim', icon: '👕' },
  { name: 'El Yapımı Aksesuar', icon: '👒' },
  { name: 'Diğer', icon: '✨' }
];

// Collections
const collections = [
  {
    title: 'Yeni Gelenler',
    description: 'En son eklenen benzersiz ürünler',
    filter: { sort: 'createdAt', order: 'desc' }
  },
  {
    title: 'En Çok Satanlar',
    description: 'En popüler el yapımı ürünler',
    filter: { sort: 'sales', order: 'desc' }
  },
  {
    title: 'Öne Çıkanlar',
    description: 'Özenle seçilmiş özel koleksiyonlar',
    filter: { featured: true }
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      setError('Ürünler yüklenirken bir hata oluştu');
      console.error('Ürün yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Arama işlemi
    navigate(`/search?q=${searchQuery}`);
  };

  const toggleFavorite = (productId) => {
    setFavorites(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box>
      {/* Hero Section */}
      <HeroSection>
        <Container>
          <Typography variant="h2" gutterBottom>
            El Yapımı Benzersiz Ürünler
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            Her biri özel ve tek olan el yapımı ürünleri keşfedin
          </Typography>
          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ne aramıştınız?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                maxWidth: 600,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { border: 'none' },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </form>
        </Container>
      </HeroSection>

      <Container>
        {/* Categories */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ mr: 1 }} />
            Kategoriler
          </Typography>
          <Grid container spacing={3}>
            {categories.map((category) => (
              <Grid item xs={6} sm={4} md={2} key={category.name}>
                <CategoryCard>
                  <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <Typography variant="h1" sx={{ fontSize: '3rem', mb: 1 }}>
                      {category.icon}
                    </Typography>
                    <Typography variant="h6">
                      {category.name}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      onClick={() => navigate(`/category/${category.name}`)}
                      sx={{
                        background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                        color: 'white',
                        '&:hover': { opacity: 0.9 },
                      }}
                    >
                      Keşfet
                    </Button>
                  </CardActions>
                </CategoryCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Collections */}
        {collections.map((collection) => (
          <CollectionSection key={collection.title}>
            <Container>
              <Typography variant="h4" gutterBottom>
                {collection.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                {collection.description}
              </Typography>
              <Grid container spacing={3}>
                {products
                  .filter(product => {
                    if (collection.filter.featured) return product.featured;
                    return true;
                  })
                  .sort((a, b) => {
                    if (collection.filter.sort === 'createdAt') {
                      return collection.filter.order === 'desc'
                        ? new Date(b.createdAt) - new Date(a.createdAt)
                        : new Date(a.createdAt) - new Date(b.createdAt);
                    }
                    if (collection.filter.sort === 'sales') {
                      return collection.filter.order === 'desc'
                        ? b.sales - a.sales
                        : a.sales - b.sales;
                    }
                    return 0;
                  })
                  .slice(0, 4)
                  .map((product) => (
                    <Grid item xs={12} sm={6} md={3} key={product._id}>
                      <ProductCard>
                        <CardMedia
                          component="img"
                          height="200"
                          image={product.gatewayUrls?.[0] || (product.images[0]?.startsWith('ipfs://') ? `${API_BASE_URL}/${product.images[0].replace('ipfs://', '')}` : `${API_BASE_URL}/${product.images[0]}`)}
                          alt={product.name}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Typography gutterBottom variant="h6" component="div">
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {product.description.substring(0, 100)}...
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" color="primary">
                              {product.price} ETH
                            </Typography>
                            <Chip
                              label={product.category}
                              size="small"
                              color="secondary"
                            />
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button
                            size="small"
                            startIcon={favorites.includes(product._id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                            onClick={() => toggleFavorite(product._id)}
                          >
                            Favorilere Ekle
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CartIcon />}
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
            </Container>
          </CollectionSection>
        ))}

        {/* NFT Avantajları */}
        <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(255, 101, 132, 0.1) 100%)' }}>
          <Typography variant="h4" gutterBottom align="center">
            NFT ile Benzersiz Ürünler
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  🎨 Benzersizlik
                </Typography>
                <Typography variant="body1">
                  Her ürün benzersiz bir NFT olarak tokenize edilir ve sahipliği blockchain üzerinde kaydedilir.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  🔒 Güvenlik
                </Typography>
                <Typography variant="body1">
                  Ürünlerin orijinalliği ve sahipliği blockchain teknolojisi ile garanti altına alınır.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  💎 Değer
                </Typography>
                <Typography variant="body1">
                  El yapımı ürünlerin değeri NFT olarak korunur ve zamanla artabilir.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Home; 