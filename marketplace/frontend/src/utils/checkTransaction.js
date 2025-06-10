import { Network, Alchemy } from "alchemy-sdk";

const settings = {
    apiKey: "ChV8eRvmyqhV1MrQS8-cn",
    network: Network.ETH_SEPOLIA,
};

const alchemy = new Alchemy(settings);

export const checkTransactionStatus = async (txHash) => {
    try {
        const tx = await alchemy.core.getTransaction(txHash);
        console.log('Transaction details:', tx);
        
        if (!tx) {
            return { status: 'not_found' };
        }

        const receipt = await alchemy.core.getTransactionReceipt(txHash);
        console.log('Transaction receipt:', receipt);

        if (!receipt) {
            return { 
                status: 'pending',
                hash: txHash,
                from: tx.from,
                to: tx.to,
                value: tx.value.toString(),
                gasPrice: tx.gasPrice?.toString(),
                gasLimit: tx.gasLimit.toString()
            };
        }

        return {
            status: receipt.status === 1 ? 'success' : 'failed',
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            effectiveGasPrice: receipt.effectiveGasPrice.toString(),
            hash: txHash,
            from: tx.from,
            to: tx.to,
            value: tx.value.toString()
        };
    } catch (error) {
        console.error('Error checking transaction:', error);
        return { 
            status: 'error',
            error: error.message,
            hash: txHash
        };
    }
}; 