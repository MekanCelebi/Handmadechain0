import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// IPFS Gateway URL'leri
const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
];

// IPFS URL'ini gateway URL'ine çevir
const getGatewayUrl = (ipfsUrl) => {
    if (!ipfsUrl) return null;
    const hash = ipfsUrl.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[0]}${hash}`;
};

export const uploadToIPFS = async (file) => {
    try {
        console.log('IPFS Upload başlatılıyor...');
        console.log('Dosya bilgileri:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path
        });

        if (!file.path) {
            throw new Error('Dosya yolu bulunamadı');
        }

        const formData = new FormData();
        
        // Dosyayı oku
        const fileStream = fs.createReadStream(file.path);
        
        // FormData'ya ekle
        formData.append('file', fileStream, {
            filename: file.originalname,
            contentType: file.mimetype
        });

        console.log('Pinata API\'ye istek gönderiliyor...');
        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Authorization': `Bearer ${process.env.PINATA_JWT}`,
                ...formData.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('Pinata yanıtı:', response.data);

        // Geçici dosyayı sil
        try {
            fs.unlinkSync(file.path);
            console.log('Geçici dosya silindi:', file.path);
        } catch (error) {
            console.warn('Geçici dosya silinemedi:', error);
        }

        const ipfsHash = response.data.IpfsHash;
        const ipfsUrl = `ipfs://${ipfsHash}`;
        const gatewayUrl = getGatewayUrl(ipfsUrl);
        
        console.log('IPFS URL oluşturuldu:', {
            ipfsUrl,
            gatewayUrl
        });

        return {
            ipfsUrl,
            gatewayUrl
        };
    } catch (error) {
        console.error('IPFS yükleme hatası:', error);
        if (error.response) {
            console.error('Pinata API yanıtı:', error.response.data);
        }
        throw error;
    }
}; 