import Product from '../models/Product.js';
import { createNFTForProduct } from '../services/nftService.js';
import { createMetadata } from '../services/web3Service.js';
import fs from 'fs';
import { ipfs } from '../services/web3Service.js';
import { NFT_CONTRACT_ADDRESS } from '../config.js';

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        const images = req.files ? req.files.map(file => file.path) : [];
        
        if (!images || images.length === 0) {
            return res.status(400).json({ message: 'En az bir görsel yüklemelisiniz' });
        }

        // IPFS'e resim yükle
        const imageResults = await Promise.all(
            images.map(async (imagePath) => {
                const result = await ipfs.add(fs.readFileSync(imagePath));
                const ipfsUrl = `ipfs://${result.path}`;
                const gatewayUrl = `https://ipfs.io/ipfs/${result.path}`;
                return { ipfsUrl, gatewayUrl };
            })
        );

        // Metadata oluştur
        const metadata = await createMetadata(
            name,
            description,
            imageResults[0].ipfsUrl
        );

        // NFT oluştur
        const nftResult = await createNFTForProduct(
            null, // productId henüz yok
            metadata.ipfsUrl,
            name,
            description,
            price
        );

        // Ürünü oluştur
        const product = new Product({
            name,
            description,
            price,
            category,
            images: imageResults.map(img => img.ipfsUrl),
            gatewayUrls: imageResults.map(img => img.gatewayUrl),
            creator: req.user._id,
            ipfsCID: metadata.ipfsCID,
            nft: {
                tokenId: nftResult.tokenId,
                contractAddress: NFT_CONTRACT_ADDRESS,
                txHash: nftResult.txHash
            }
        });

        // Ürünü kaydet
        await product.save();

        // Ürünü populate et
        const populatedProduct = await Product.findById(product._id)
            .populate('creator', 'name email');

        res.status(201).json({
            success: true,
            product: populatedProduct
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

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ isListed: true })
            .populate('creator', 'name email')
            .sort({ createdAt: -1 });

        // Eski ürünler için gatewayUrls'i images ile doldur
        const updatedProducts = products.map(product => {
            const productObj = product.toObject();
            if (!productObj.gatewayUrls || productObj.gatewayUrls.length === 0) {
                productObj.gatewayUrls = productObj.images.map(img => 
                    img.startsWith('ipfs://') 
                        ? `https://ipfs.io/ipfs/${img.replace('ipfs://', '')}`
                        : `http://localhost:5000/${img}`
                );
            }
            return productObj;
        });

        res.status(200).json({
            success: true,
            products: updatedProducts
        });
    } catch (error) {
        console.error('Ürünleri getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Ürünler getirilirken bir hata oluştu',
            error: error.message
        });
    }
}; 