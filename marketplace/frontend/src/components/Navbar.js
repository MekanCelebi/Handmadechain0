import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Link,
  useMediaQuery,
  useTheme,
  Box,
  Tooltip,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Store as StoreIcon,
  Wallet as WalletIcon,
  Person
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  position: 'sticky',
  top: 0,
  zIndex: 1100,
}));

const Logo = styled(Typography)(({ theme }) => ({
  color: '#667eea',
  fontWeight: 800,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  fontSize: '1.5rem',
  letterSpacing: '-0.5px',
  '&:hover': {
    opacity: 0.8,
    transform: 'scale(1.02)',
  },
  transition: 'all 0.3s ease',
}));

const ConnectButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
  },
}));

const SearchBox = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.spacing(2),
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(102, 126, 234, 0.1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    '& fieldset': { 
      border: 'none',
    },
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid rgba(102, 126, 234, 0.2)',
      boxShadow: '0 6px 25px rgba(0, 0, 0, 0.08)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      border: '1px solid rgba(102, 126, 234, 0.3)',
      boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)',
    },
  },
  '& .MuiInputBase-input': {
    fontSize: '0.9rem',
    padding: theme.spacing(1.5, 2),
  },
}));

const WalletChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  border: '1px solid rgba(102, 126, 234, 0.2)',
  color: '#667eea',
  fontWeight: 600,
  fontSize: '0.85rem',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 36,
  height: 36,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  fontWeight: 600,
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: theme.spacing(1.5),
  color: '#667eea',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.95)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
  },
}));

const Navbar = () => {
  const navigate = useNavigate();
  const { account, connectWallet } = useWeb3();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Cüzdan adresini kısalt
  const shortAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

  return (
    <StyledAppBar position="sticky">
      <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1 }}>
        {/* Logo */}
        <Logo
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ 
            flexGrow: { xs: 1, md: 0 },
            mr: { xs: 0, md: 4 }
          }}
        >
          <StoreIcon sx={{ mr: 1.5, fontSize: '2rem' }} />
          HandmadeNFT
        </Logo>

        {/* Arama Kutusu - Desktop */}
        <Box sx={{ 
          display: { xs: 'none', md: 'flex' }, 
          flexGrow: 1, 
          maxWidth: 600, 
          mx: 'auto',
          justifyContent: 'center'
        }}>
          <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: 500 }}>
            <SearchBox
              fullWidth
              variant="outlined"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      type="submit" 
                      size="small"
                      sx={{ 
                        color: '#667eea',
                        mr: 0.5
                      }}
                    >
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </form>
        </Box>

        {/* Sağ taraf - Kullanıcı menüsü ve Wallet */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          ml: 'auto'
        }}>
          {/* Sepet - Desktop */}
          <ActionButton
            onClick={() => navigate('/profile?tab=orders')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            <Badge badgeContent={cartCount} color="error">
              <CartIcon />
            </Badge>
          </ActionButton>

          {/* Wallet Connect */}
          {account ? (
            <WalletChip
              icon={<WalletIcon />}
              label={shortAddress}
              variant="outlined"
              sx={{ mr: 1 }}
            />
          ) : (
            <ConnectButton
              startIcon={<WalletIcon />}
              onClick={connectWallet}
              sx={{ mr: 1 }}
            >
              Connect Wallet
            </ConnectButton>
          )}

          {/* Kullanıcı Menüsü */}
          {user ? (
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ ml: 0.5 }}
            >
              <StyledAvatar>
                {user.email.charAt(0).toUpperCase()}
              </StyledAvatar>
            </IconButton>
          ) : (
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{ 
                ml: 1,
                borderRadius: 2,
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#5a6fd8',
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                }
              }}
            >
              Giriş Yap
            </Button>
          )}
        </Box>

        {/* Kullanıcı Menü Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              background: 'rgba(255, 255, 255, 0.95)',
            }
          }}
        >
          <MenuItem 
            onClick={() => {
              navigate('/profile');
              setAnchorEl(null);
            }}
            sx={{ 
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Person sx={{ color: '#667eea' }} />
              <Typography sx={{ fontWeight: 500 }}>Profil</Typography>
            </Box>
          </MenuItem>
          <MenuItem 
            onClick={() => {
              navigate('/profile?tab=orders');
              setAnchorEl(null);
            }}
            sx={{ 
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CartIcon sx={{ color: '#667eea' }} />
              <Typography sx={{ fontWeight: 500 }}>Siparişlerim</Typography>
            </Box>
          </MenuItem>
          {user?.isCreator && (
            <MenuItem 
              onClick={() => {
                navigate('/seller/dashboard');
                setAnchorEl(null);
              }}
              sx={{ 
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StoreIcon sx={{ color: '#667eea' }} />
                <Typography sx={{ fontWeight: 500 }}>Satıcı Paneli</Typography>
              </Box>
            </MenuItem>
          )}
          <Divider sx={{ my: 1 }} />
          <MenuItem 
            onClick={handleLogout}
            sx={{ 
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                background: '#f44336',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography sx={{ color: 'white', fontSize: '0.75rem' }}>Ç</Typography>
              </Box>
              <Typography sx={{ fontWeight: 500, color: '#f44336' }}>Çıkış Yap</Typography>
            </Box>
          </MenuItem>
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar; 