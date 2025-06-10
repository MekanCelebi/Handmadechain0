import axios from 'axios';
import FormData from 'form-data';

export const uploadToPinata = async (file, apiKey, secretKey) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'pinata_api_key': apiKey,
                'pinata_secret_api_key': secretKey
            }
        });

        return response.data.IpfsHash;
    } catch (error) {
        console.error('Pinata yükleme hatası:', error);
        throw new Error('Dosya IPFS\'e yüklenirken bir hata oluştu');
    }
}; 