import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

async function uploadToIPFS(filePath) {
  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('file', fileStream);

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

async function migrateImages() {
  try {
    // Tüm ürünleri getir
    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate`);

    for (const product of products) {
      if (!product.images || product.images.length === 0) continue;

      const newImages = [];
      const newGatewayUrls = [];

      for (const image of product.images) {
        // Eğer zaten IPFS URL'si ise atla
        if (image.startsWith('ipfs://')) {
          newImages.push(image);
          newGatewayUrls.push(`https://ipfs.io/ipfs/${image.replace('ipfs://', '')}`);
          continue;
        }

        // Local dosya yolunu oluştur
        const filePath = path.join(__dirname, '../../uploads', image);
        
        // Dosya var mı kontrol et
        if (!fs.existsSync(filePath)) {
          console.log(`File not found: ${filePath}`);
          continue;
        }

        try {
          // IPFS'e yükle
          const ipfsUrl = await uploadToIPFS(filePath);
          newImages.push(ipfsUrl);
          newGatewayUrls.push(`https://ipfs.io/ipfs/${ipfsUrl.replace('ipfs://', '')}`);
          console.log(`Migrated image: ${image} -> ${ipfsUrl}`);
        } catch (error) {
          console.error(`Failed to migrate image ${image}:`, error);
        }
      }

      // Ürünü güncelle
      if (newImages.length > 0) {
        product.images = newImages;
        product.gatewayUrls = newGatewayUrls;
        await product.save();
        console.log(`Updated product: ${product._id}`);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Scripti çalıştır
migrateImages(); 