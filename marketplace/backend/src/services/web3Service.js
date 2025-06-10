import { ethers } from 'ethers';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

export const uploadToIPFS = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_API_KEY
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        return response.data.IpfsHash;
    } catch (error) {
        console.error('IPFS yükleme hatası:', error.response?.data || error);
        throw error;
    }
};

export const createMetadata = async (name, description, imageUrl) => {
    try {
        const metadata = {
            name,
            description,
            image: imageUrl
        };

        const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_API_KEY
            }
        });

        const ipfsUrl = `ipfs://${response.data.IpfsHash}`;
        const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;

        return {
            ipfsUrl,
            gatewayUrl,
            ipfsCID: response.data.IpfsHash
        };
    } catch (error) {
        console.error('Metadata oluşturma hatası:', error.response?.data || error);
        throw error;
    }
}; 