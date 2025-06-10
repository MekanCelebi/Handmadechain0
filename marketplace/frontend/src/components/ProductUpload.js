import React, { useState } from 'react';
import { useNFTMarketplace } from '../contexts/NFTMarketplaceContext';
import { uploadToPinata } from '../utils/pinata';
import { PINATA_API_KEY, PINATA_SECRET_KEY } from '../config';

const ProductUpload = () => {
    const { mintNFT } = useNFTMarketplace();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({
            ...prev,
            image: file
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Pinata'ya yükleme
            const imageHash = await uploadToPinata(formData.image, PINATA_API_KEY, PINATA_SECRET_KEY);
            
            // Metadata oluştur
            const metadata = {
                name: formData.name,
                description: formData.description,
                image: `ipfs://${imageHash}`
            };

            // Metadata'yı Pinata'ya yükle
            const metadataHash = await uploadToPinata(
                new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
                PINATA_API_KEY,
                PINATA_SECRET_KEY
            );

            // NFT mint et
            const price = ethers.utils.parseEther(formData.price);
            const tokenURI = `ipfs://${metadataHash}`;
            const tx = await mintNFT(tokenURI, price);
            await tx.wait();

            // Formu temizle
            setFormData({
                name: '',
                description: '',
                price: '',
                image: null
            });

            alert('Ürün başarıyla yüklendi!');
        } catch (err) {
            console.error('Ürün yükleme hatası:', err);
            setError('Ürün yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Yeni Ürün Yükle</h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ürün Adı</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fiyat (ETH)</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        step="0.001"
                        min="0"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ürün Görseli</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        required
                        className="mt-1 block w-full"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {loading ? 'Yükleniyor...' : 'Ürünü Yükle'}
                </button>
            </form>
        </div>
    );
};

export default ProductUpload; 