import axios from 'axios';
import { API_BASE_URL } from '../config';

// IPFS Gateway URL'leri
const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
];

// IPFS URL'sini düzenle
export const formatIPFSUrl = (ipfsUrl) => {
    if (!ipfsUrl) return '';
    
    // Eğer zaten gateway URL'si ise, olduğu gibi döndür
    if (ipfsUrl.startsWith('http')) {
        return ipfsUrl;
    }

    // ipfs:// veya /ipfs/ ile başlıyorsa, düzelt
    const hash = ipfsUrl.replace('ipfs://', '').replace('/ipfs/', '');
    
    // İlk çalışan gateway'i kullan
    return `${IPFS_GATEWAYS[0]}${hash}`;
};

// IPFS'e metadata yükle
export const uploadToIPFS = async (metadata) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/ipfs/upload`, metadata);
        return response.data;
    } catch (error) {
        console.error('IPFS yükleme hatası:', error);
        throw new Error('Metadata IPFS\'e yüklenemedi');
    }
};

// IPFS'ten metadata al
export const getFromIPFS = async (ipfsUrl) => {
    try {
        const formattedUrl = formatIPFSUrl(ipfsUrl);
        const response = await axios.get(formattedUrl);
        return response.data;
    } catch (error) {
        console.error('IPFS okuma hatası:', error);
        throw new Error('Metadata IPFS\'ten alınamadı');
    }
};

// IPFS URL'sini doğrula
export const validateIPFSURL = (url) => {
    if (!url) return false;
    return url.startsWith('ipfs://') || url.startsWith('/ipfs/') || IPFS_GATEWAYS.some(gateway => url.startsWith(gateway));
};

// IPFS hash'ini çıkar
export const extractIPFSHash = (url) => {
    if (!url) return '';
    return url.replace('ipfs://', '').replace('/ipfs/', '').split('/')[0];
}; 