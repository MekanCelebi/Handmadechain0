import express from 'express';
import { createNFT } from '../services/web3.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint for NFT creation
router.post('/test-create', async (req, res) => {
    try {
        const { name, description, price, image } = req.body;
        
        // Test verileri
        const testData = {
            name: name || 'Test NFT',
            description: description || 'Test Description',
            price: price || '0.1',
            images: [image || 'https://example.com/test-image.jpg'],
            creator: '0x0000000000000000000000000000000000000000' // Test için boş adres
        };

        console.log('Test NFT creation started with data:', testData);
        
        const result = await createNFT(testData);

        res.json({
            success: true,
            message: 'Test NFT creation process started',
            data: result
        });
    } catch (error) {
        console.error('Test NFT creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Test NFT creation failed',
            error: error.message
        });
    }
});

// NFT oluştur
router.post('/create', auth, async (req, res) => {
    try {
        const { productId, name, description, price, image, creator } = req.body;

        if (!productId || !name || !description || !price || !image || !creator) {
            return res.status(400).json({
                success: false,
                error: 'Tüm alanlar zorunludur'
            });
        }

        console.log('NFT creation request received:', {
            productId,
            name,
            description,
            price,
            image,
            creator
        });

        const result = await createNFT({
            productId,
            name,
            description,
            price,
            images: [image],
            creator
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'NFT başarıyla oluşturuldu',
            data: result
        });
    } catch (error) {
        console.error('NFT creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router; 