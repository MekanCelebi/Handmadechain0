import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import { createNFTForProduct } from '../services/nftService.js';
import { createMetadata } from '../services/web3Service.js';

dotenv.config();

async function recreateNFT() {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB bağlantısı başarılı');

        // Ürünü bul
        const product = await Product.findOne({ _id: '684073324ad79272911656fd' });
        if (!product) {
            console.log('Ürün bulunamadı');
            return;
        }

        console.log('Ürün bulundu:', product.name);

        // Metadata oluştur
        const metadata = await createMetadata(
            product.name,
            product.description,
            product.images[0]
        );

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

        console.log('NFT başarıyla yeniden oluşturuldu');
        console.log('Yeni NFT bilgileri:', product.nft);

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB bağlantısı kapatıldı');
    }
}

recreateNFT(); 