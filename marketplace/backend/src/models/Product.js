import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Ürün adı zorunludur'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Ürün açıklaması zorunludur']
    },
    price: {
        type: Number,
        required: [true, 'Ürün fiyatı zorunludur'],
        min: [0, 'Fiyat 0\'dan küçük olamaz']
    },
    image: {
        type: String,
        required: [true, 'Ürün görseli zorunludur']
    },
    images: [{
        type: String,
        required: true
    }],
    gatewayUrls: [{
        type: String,
        default: []
    }],
    category: {
        type: String,
        required: [true, 'Kategori zorunludur']
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ipfsCID: {
        type: String,
        default: null
    },
    nft: {
        tokenId: {
            type: String,
            default: null
        },
        contractAddress: {
            type: String,
            default: null
        },
        txHash: {
            type: String,
            default: null
        }
    },
    isListed: {
        type: Boolean,
        default: true
    },
    escrow: {
        escrowId: String,
        amount: Number,
        buyer: String,
        status: {
            type: String,
            enum: ['pending', 'released', 'refunded'],
            default: 'pending'
        },
        createdAt: Date,
        releasedAt: Date,
        refundedAt: Date
    }
}, {
    timestamps: true
});

// Eski NFT alanlarını kaldır
productSchema.pre('save', function(next) {
    if (this.isModified()) {
        delete this.nftId;
        delete this.nftTxHash;
    }
    next();
});

const Product = mongoose.model('Product', productSchema);

export default Product; 