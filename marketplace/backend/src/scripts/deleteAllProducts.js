import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const deleteAllProducts = async () => {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB bağlantısı başarılı');

        // Tüm ürünleri sil
        const result = await Product.deleteMany({});
        console.log(`${result.deletedCount} ürün başarıyla silindi`);

        // Bağlantıyı kapat
        await mongoose.connection.close();
        console.log('MongoDB bağlantısı kapatıldı');

    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
};

// Scripti çalıştır
deleteAllProducts(); 