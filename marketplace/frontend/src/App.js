import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';
import { NFTMarketplaceProvider } from './contexts/NFTMarketplaceContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProductDetail from './pages/ProductDetail';
import CreateProduct from './pages/CreateProduct';
import SellerDashboard from './pages/SellerDashboard';
import MyProducts from './pages/MyProducts';
import SearchResults from './pages/SearchResults';
import CategoryPage from './pages/CategoryPage';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Web3Provider>
          <NFTMarketplaceProvider>
            <Router>
              <Toaster position="top-right" />
              <div className="App">
                <Navbar />
                <main className="container mx-auto px-4 py-8" style={{ maxWidth: '100%', margin: '0 auto' }}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Home />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/create" element={<CreateProduct />} />
                    <Route path="/seller/dashboard" element={<SellerDashboard />} />
                    <Route path="/my-products" element={<MyProducts />} />
                    <Route path="/category/:category" element={<CategoryPage />} />
                  </Routes>
                </main>
              </div>
            </Router>
          </NFTMarketplaceProvider>
        </Web3Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 