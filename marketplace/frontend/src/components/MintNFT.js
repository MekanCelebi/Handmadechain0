import { useWeb3 } from '../contexts/Web3Context';
import { useState } from 'react';

const MintNFT = () => {
  const { contract, provider, isConnected, account } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);

  const handleMint = async () => {
    if (!isConnected || !contract) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);

    try {
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.mintNFT(account, {
        gasLimit: 300000
      });

      await tx.wait();
      alert('NFT minted successfully!');
      
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Mint New NFT</h1>
        <div className="border p-4 rounded-lg">
          <p className="mb-4">Create a new handmade NFT</p>
          <button
            onClick={handleMint}
            disabled={isLoading || !isConnected}
            className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${
              (isLoading || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Minting...' : 'Mint NFT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MintNFT; 