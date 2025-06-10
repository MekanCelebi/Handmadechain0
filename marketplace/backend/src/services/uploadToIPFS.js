import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const PINATA_API_KEY = '5fcc72e003b87e760a4d';
const PINATA_API_SECRET = '154b8a471c9a6f9555a612b18ae15b5904123d810a3cbc3821aee76f961700a1';

/**
 * Bir ürünü IPFS'e yükler: önce görsel, sonra metadata.
 * @param {Buffer} imageBuffer - Görsel dosyasının buffer'ı
 * @param {string} name - Ürün adı
 * @param {string} description - Ürün açıklaması
 * @returns {Promise<string>} - Metadata dosyasının IPFS CID'i
 */
async function uploadProductToIPFS(imageBuffer, name, description) {
  try {
    // 1. Görseli IPFS'e yükle
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });

    const imageResponse = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET
      }
    });

    const imageCID = imageResponse.data.IpfsHash;
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageCID}`;

    // 2. Metadata JSON'u oluştur
    const metadata = {
      name,
      description,
      image: imageUrl,
    };

    // 3. Metadata'yı IPFS'e yükle
    const metadataResponse = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET
      }
    });

    const metadataCID = metadataResponse.data.IpfsHash;
    return metadataCID;
  } catch (error) {
    console.error('IPFS yükleme hatası:', error.response?.data || error.message);
    throw error;
  }
}

export { uploadProductToIPFS }; 