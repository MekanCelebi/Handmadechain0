import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getStats
} from '../controllers/products.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createNFTForProduct, uploadToIPFS } from '../services/nftService.js';
import Product from '../models/Product.js';

const router = express.Router();

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Sadece resim dosyalarını kabul et
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // En fazla 5 dosya
  }
});

// Hata yakalama middleware'i
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Dosya boyutu 5MB\'dan büyük olamaz' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'En fazla 5 dosya yükleyebilirsiniz' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Beklenmeyen dosya alanı: ' + err.field });
    }
    return res.status(400).json({ message: 'Dosya yükleme hatası: ' + err.message });
  }
  next(err);
};

// Public routes
router.get('/', getProducts);

// Protected routes
router.get('/my-products', auth, getMyProducts);
router.get('/stats', auth, getStats);

// Ürün oluşturma ve güncelleme için özel middleware
const handleProductUpload = (req, res, next) => {
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'image', maxCount: 5 }
  ])(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    // Eğer 'image' alanı varsa, 'images' alanına taşı
    if (req.files && req.files.image) {
      if (!req.files.images) {
        req.files.images = [];
      }
      req.files.images = [...req.files.images, ...req.files.image];
      delete req.files.image;
    }
    next();
  });
};

router.post('/', auth, handleProductUpload, async (req, res) => {
  try {
    if (!req.files || (!req.files.images && !req.files.image)) {
      return res.status(400).json({ message: 'Lütfen bir resim yükleyin' });
    }

    const { name, description, price, category } = req.body;
    
    // Get the first image file
    const imageFile = req.files.images ? req.files.images[0] : req.files.image[0];
    
    // Create product in database
    const product = new Product({
      name,
      description,
      price,
      category,
      image: `/uploads/${imageFile.filename}`,
      images: [`/uploads/${imageFile.filename}`],
      creator: req.user.userId
    });

    await product.save();

    // Upload image to IPFS
    const ipfsHash = await uploadToIPFS(imageFile.path);
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    
    // Update product with IPFS information
    product.images = [`ipfs://${ipfsHash}`];
    product.gatewayUrls = [gatewayUrl];
    product.ipfsCID = ipfsHash;
    
    // Create NFT for the product
    const nftResult = await createNFTForProduct(
      product._id,
      `ipfs://${ipfsHash}`,
      name,
      description,
      price
    );

    // Update product with NFT information
    product.nft = {
      tokenId: nftResult.tokenId,
      contractAddress: nftResult.contractAddress,
      txHash: nftResult.txHash
    };
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, handleProductUpload, updateProduct);
router.delete('/:id', auth, deleteProduct);
router.get('/:id', getProductById);

// Create escrow for a product
router.post('/:id/escrow', auth, async (req, res) => {
  try {
    const { escrowId, amount, buyer } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Escrow bilgilerini ekle
    product.escrow = {
      escrowId,
      amount,
      buyer,
      status: 'pending',
      createdAt: new Date()
    };

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Escrow creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Release escrow
router.post('/:id/release-escrow', auth, async (req, res) => {
  try {
    const { escrowId } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Sadece ürün sahibi escrow'u serbest bırakabilir
    if (product.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    // Escrow durumunu güncelle
    if (product.escrow && product.escrow.escrowId === escrowId) {
      product.escrow.status = 'released';
      product.escrow.releasedAt = new Date();
      await product.save();
      res.json(product);
    } else {
      res.status(404).json({ message: 'Escrow bulunamadı' });
    }
  } catch (error) {
    console.error('Escrow release error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Refund escrow
router.post('/:id/refund-escrow', auth, async (req, res) => {
  try {
    const { escrowId } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Sadece escrow'u oluşturan kişi iade alabilir
    if (product.escrow && product.escrow.buyer !== req.user.userId) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    // Escrow durumunu güncelle
    if (product.escrow && product.escrow.escrowId === escrowId) {
      product.escrow.status = 'refunded';
      product.escrow.refundedAt = new Date();
      await product.save();
      res.json(product);
    } else {
      res.status(404).json({ message: 'Escrow bulunamadı' });
    }
  } catch (error) {
    console.error('Escrow refund error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 