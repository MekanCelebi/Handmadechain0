import Product from '../models/Product.js';
import { createNFTForProduct } from '../services/nftService.js';
import { createMetadata, uploadToIPFS } from '../services/web3Service.js';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs';

// Ürün oluştur
export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        
        // Kullanıcı kontrolü
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Kullanıcı kimlik doğrulaması gerekli' 
            });
        }

        // Check if files were uploaded
        if (!req.files || (!req.files.images && !req.files.image)) {
            return res.status(400).json({ message: 'En az bir görsel yüklemelisiniz' });
        }

        // Combine images from both fields if they exist
        let allImages = [];
        if (req.files.images) {
            allImages = allImages.concat(req.files.images);
        }
        if (req.files.image) {
            allImages = allImages.concat(req.files.image);
        }

        // IPFS'e resim yükle
        const imageResults = await Promise.all(
            allImages.map(async (file) => {
                const fileBuffer = fs.readFileSync(file.path);
                const ipfsHash = await uploadToIPFS(fileBuffer);
                const ipfsUrl = `ipfs://${ipfsHash}`;
                const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
                
                // Geçici dosyayı sil
                fs.unlinkSync(file.path);
                
                return { ipfsUrl, gatewayUrl };
            })
        );

        // Metadata oluştur
        const metadata = await createMetadata(
            name,
            description,
            imageResults[0].ipfsUrl
        );

        const product = new Product({
            name,
            description,
            price,
            category,
            images: imageResults.map(img => img.ipfsUrl),
            gatewayUrls: imageResults.map(img => img.gatewayUrl),
            creator: req.user.userId,
            ipfsCID: metadata.ipfsCID
        });

        await product.save();

        // NFT oluştur
        const nftResult = await createNFTForProduct(
            product._id,
            metadata.ipfsUrl,
            product.name,
            product.description,
            product.price
        );

        // Ürünün NFT bilgilerini güncelle
        product.nft = {
            tokenId: nftResult.tokenId,
            contractAddress: process.env.NFT_CONTRACT_ADDRESS,
            txHash: nftResult.txHash
        };
        await product.save();

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Ürün oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Ürün oluşturulurken bir hata oluştu',
            error: error.message
        });
    }
};

// Tüm ürünleri listele
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('creator', 'username');
        res.json(products);
    } catch (error) {
        res.status(500).json({
            message: 'Ürünler listelenirken bir hata oluştu',
            error: error.message
        });
    }
};

// Tek bir ürünün detaylarını getir
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('creator', 'username');
        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({
            message: 'Ürün detayları alınırken bir hata oluştu',
            error: error.message
        });
    }
};

// Satıcının ürünlerini getir
export const getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ creator: req.user.userId });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Ürünler yüklenirken bir hata oluştu' });
    }
};

// Satıcı istatistiklerini getir
export const getStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({ creator: req.user.userId });
        const activeListings = await Product.countDocuments({ 
            creator: req.user.userId,
            isListed: true 
        });

        // Toplam satış tutarını hesapla
        const soldProducts = await Product.find({ 
            creator: req.user.userId,
            isListed: false 
        });
        const totalSales = soldProducts.reduce((sum, product) => sum + product.price, 0);

        res.json({
            totalProducts,
            activeListings,
            totalSales
        });
    } catch (error) {
        res.status(500).json({ message: 'İstatistikler yüklenirken bir hata oluştu' });
    }
};

// Ürün güncelle
export const updateProduct = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        const image = req.file ? req.file.path : undefined;

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, creator: req.user.userId },
            {
                name,
                description,
                price,
                category,
                ...(image && { image })
            },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Ürün güncellenirken bir hata oluştu' });
    }
};

// Ürün sil
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({
            _id: req.params.id,
            creator: req.user.userId
        });

        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }

        res.json({ message: 'Ürün başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Ürün silinirken bir hata oluştu' });
    }
}; 