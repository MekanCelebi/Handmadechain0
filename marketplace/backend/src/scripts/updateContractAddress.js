import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const OLD_CONTRACT_ADDRESS = '0x5ad97d11103b882327be3290cb1053769fa9de22';
const NEW_CONTRACT_ADDRESS = '0xc9e5f12b17b7482ba80a3902cfe8aef664c08140';

async function updateContractAddresses() {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB bağlantısı başarılı');

        // Eski kontrat adresine sahip ürünleri bul ve güncelle
        const result = await Product.updateMany(
            { 'nft.contractAddress': OLD_CONTRACT_ADDRESS },
            { $set: { 'nft.contractAddress': NEW_CONTRACT_ADDRESS } }
        );

        console.log(`Güncellenen ürün sayısı: ${result.modifiedCount}`);
        console.log('Kontrat adresleri başarıyla güncellendi');

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB bağlantısı kapatıldı');
    }
}

updateContractAddresses(); 