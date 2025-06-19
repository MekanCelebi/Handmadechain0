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
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import {
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Styled components
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: theme.spacing(12, 0),
  marginBottom: theme.spacing(8),
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

const CategoryCard = styled(Paper)(({ theme, color }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  borderRadius: theme.spacing(3),
  background: color,
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-12px) scale(1.05)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    '& .category-icon': {
      transform: 'scale(1.2) rotate(5deg)',
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.1)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::before': {
    opacity: 1,
  },
}));

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

const CollectionSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 0),
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
  borderRadius: theme.spacing(3),
  marginBottom: theme.spacing(6),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23667eea" fill-opacity="0.03"%3E%3Cpath d="M20 20c0 11.046-8.954 20-20 20s-20-8.954-20-20 8.954-20 20-20 20 8.954 20 20zm0-20c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20z"/%3E%3C/g%3E%3C/svg%3E")',
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

// Categories
const categories = [
  {
    name: 'El Yapımı Takı',
    icon: '💍',
    description: 'Benzersiz el yapımı takılar',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    name: 'El Yapımı Çanta',
    icon: '👜',
    description: 'Özel tasarım çantalar',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    name: 'El Yapımı Dekorasyon',
    icon: '🏠',
    description: 'Ev dekorasyon ürünleri',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    name: 'El Yapımı Giyim',
    icon: '👕',
    description: 'El dikimi giyim ürünleri',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  {
    name: 'El Yapımı Aksesuar',
    icon: '👒',
    description: 'Şık aksesuar koleksiyonu',
    color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    name: 'Diğer',
    icon: '✨',
    description: 'Diğer el yapımı ürünler',
    color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const [productsRes, featuredRes, latestRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products`),
        axios.get(`${API_BASE_URL}/products/featured`),
        axios.get(`${API_BASE_URL}/products/latest`)
      ]);
      
      setProducts(productsRes.data);
      setFeaturedProducts(featuredRes.data);
      setLatestProducts(latestRes.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Ürünler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/category/${encodeURIComponent(categoryName)}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero Section */}
      <HeroSection>
        <Container>
          <Typography variant="h1" gutterBottom sx={{ 
            fontSize: { xs: '2.5rem', md: '4rem' },
            fontWeight: 700,
            mb: 3
          }}>
            El Yapımı Ürünler
          </Typography>
          <Typography variant="h5" sx={{ 
            mb: 6,
            opacity: 0.9,
            fontWeight: 400,
            maxWidth: 600,
            mx: 'auto'
          }}>
            Benzersiz el yapımı ürünleri keşfedin ve NFT teknolojisi ile güvenle satın alın
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <ModernButton
              size="large"
              onClick={() => navigate('/search')}
              sx={{ 
                px: 4, 
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              Ürünleri Keşfet
            </ModernButton>
          </Box>
        </Container>
      </HeroSection>

      {/* Categories Section */}
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 700, color: '#2d3748', mb: 2 }}>
            Kategoriler
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
            İhtiyacınız olan el yapımı ürünleri keşfedin
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.name}>
              <CategoryCard 
                color={category.color}
                onClick={() => handleCategoryClick(category.name)}
                elevation={0}
              >
                <Typography variant="h1" className="category-icon" sx={{ 
                  fontSize: '4rem', 
                  mb: 2,
                  transition: 'transform 0.3s ease'
                }}>
                  {category.icon}
                </Typography>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  {category.name}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {category.description}
                </Typography>
              </CategoryCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Öne Çıkan Ürünler */}
      {featuredProducts.length > 0 && (
        <CollectionSection>
          <Container>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="h2" gutterBottom sx={{ fontWeight: 700, color: '#2d3748', mb: 2 }}>
                Öne Çıkan Ürünler
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
                En popüler ve özel el yapımı ürünlerimiz
              </Typography>
            </Box>
            <Grid container spacing={4}>
              {featuredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={3} key={product._id}>
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
          </Container>
        </CollectionSection>
      )}

      {/* En Yeni Ürünler */}
      {latestProducts.length > 0 && (
        <Container sx={{ py: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 700, color: '#2d3748', mb: 2 }}>
              En Yeni Ürünler
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
              Yeni eklenen el yapımı ürünlerimizi keşfedin
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {latestProducts.map((product) => (
              <Grid item xs={12} sm={6} md={3} key={product._id}>
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
        </Container>
      )}

      {/* NFT Avantajları */}
      <Paper sx={{ 
        p: 6, 
        mb: 6, 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
        borderRadius: 4,
        border: '1px solid rgba(102, 126, 234, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23667eea" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        },
      }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          align="center"
          sx={{ 
            fontWeight: 700,
            color: '#2d3748',
            mb: 2
          }}
        >
          NFT ile Benzersiz Ürünler
        </Typography>
        <Typography 
          variant="h6" 
          align="center"
          sx={{ 
            mb: 6,
            opacity: 0.8,
            fontWeight: 400,
            maxWidth: 800,
            mx: 'auto'
          }}
        >
          Blockchain teknolojisi ile el yapımı ürünlerinizi güvenle alın ve satın
        </Typography>
        <Grid container spacing={6} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              textAlign: 'center',
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
              }
            }}>
              <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
                🎨
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#2d3748', mb: 2 }}>
                Benzersizlik
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.8 }}>
                Her ürün benzersiz bir NFT olarak tokenize edilir ve sahipliği blockchain üzerinde kaydedilir.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              textAlign: 'center',
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
              }
            }}>
              <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
                🔒
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#2d3748', mb: 2 }}>
                Güvenlik
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.8 }}>
                Ürünlerin orijinalliği ve sahipliği blockchain teknolojisi ile garanti altına alınır.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              textAlign: 'center',
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
              }
            }}>
              <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
                💎
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#2d3748', mb: 2 }}>
                Değer
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.8 }}>
                El yapımı ürünlerin değeri NFT olarak korunur ve zamanla artabilir.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Footer */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
        color: 'white',
        py: 6,
        mt: 8
      }}>
        <Container>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                El Yapımı NFT Marketplace
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, lineHeight: 1.7 }}>
                Benzersiz el yapımı ürünleri NFT teknolojisi ile güvenle alın ve satın. 
                Blockchain tabanlı platformumuz ile ürünlerinizin orijinalliğini garanti altına alın.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Hızlı Linkler
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button 
                  color="inherit" 
                  onClick={() => navigate('/')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Anasayfa
                </Button>
                <Button 
                  color="inherit" 
                  onClick={() => navigate('/search')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Ürün Ara
                </Button>
                <Button 
                  color="inherit" 
                  onClick={() => navigate('/profile')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Profilim
                </Button>
                <Button 
                  color="inherit" 
                  onClick={() => navigate('/seller/dashboard')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Satıcı Paneli
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Kategoriler
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {categories.slice(0, 5).map((category) => (
                  <Button 
                    key={category.name}
                    color="inherit" 
                    onClick={() => handleCategoryClick(category.name)}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    {category.icon} {category.name}
                  </Button>
                ))}
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2024 El Yapımı NFT Marketplace. Tüm hakları saklıdır.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 