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
  Avatar
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Store as StoreIcon,
  Favorite as FavoriteIcon,
  Wallet as WalletIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
}));

const Logo = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    opacity: 0.9,
  },
}));

const ConnectButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
  color: 'white',
  '&:hover': {
    opacity: 0.9,
  },
}));

const Navbar = () => {
  const navigate = useNavigate();
  const { account, connectWallet } = useWeb3();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logout();
    navigate('/login');
  };

  // Cüzdan adresini kısalt
  const shortAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

  return (
    <StyledAppBar position="sticky">
      <Toolbar>
        {/* Logo */}
        <Logo
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
        >
          <StoreIcon sx={{ mr: 1 }} />
          HandmadeNFT
        </Logo>

        {/* Sağ taraf - Kullanıcı menüsü ve Wallet */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Favoriler */}
          <Tooltip title="Favoriler">
            <IconButton
              color="primary"
              onClick={() => navigate('/favorites')}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <Badge badgeContent={favoritesCount} color="error">
                <FavoriteIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Sepet */}
          <Tooltip title="Sepet">
            <IconButton
              color="primary"
              onClick={() => navigate('/cart')}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <Badge badgeContent={cartCount} color="error">
                <CartIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Wallet Connect */}
          {account ? (
            <Chip
              icon={<WalletIcon />}
              label={shortAddress}
              color="primary"
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
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.email.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          ) : (
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{ ml: 1 }}
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
        >
          <MenuItem onClick={() => {
            navigate('/profile');
            setAnchorEl(null);
          }}>
            Profil
          </MenuItem>
          {user?.isCreator && (
            <MenuItem onClick={() => {
              navigate('/seller/dashboard');
              setAnchorEl(null);
            }}>
              Satıcı Paneli
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout}>
            Çıkış Yap
          </MenuItem>
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar; 