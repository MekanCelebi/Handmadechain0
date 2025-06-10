import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const MyProducts = () => {
  const { contract, account } = useWeb3();
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyNFTs = async () => {
      if (!contract || !account) return;

      try {
        // Burada NFT'leri yükleme işlemi yapılacak
        // Şimdilik boş bir array döndürüyoruz
        setMyNFTs([]);
      } catch (error) {
        console.error('Error loading NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMyNFTs();
  }, [contract, account]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Products</h1>
      {myNFTs.length === 0 ? (
        <p>You don't have any products yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myNFTs.map((nft) => (
            <div key={nft.id} className="border p-4 rounded-lg">
              <h2 className="text-xl font-semibold">{nft.name}</h2>
              <p>Price: {nft.price} ETH</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProducts; 