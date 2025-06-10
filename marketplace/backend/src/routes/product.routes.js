// NFT transfer et
router.post('/:id/transfer', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Ürün bulunamadı' });
        }

        // Sadece NFT sahibi transfer edebilir
        if (product.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Bu işlem için yetkiniz yok' });
        }

        const { to } = req.body;
        if (!to) {
            return res.status(400).json({ success: false, error: 'Alıcı adresi gerekli' });
        }

        // Web3 servisini kullanarak transfer işlemini gerçekleştir
        const result = await web3Service.transferNFT(to, product.nftId);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }

        // Ürünün sahibini güncelle
        product.creator = req.user._id;
        await product.save();

        res.json({
            success: true,
            message: 'NFT başarıyla transfer edildi',
            transactionHash: result.txHash
        });
    } catch (error) {
        console.error('Transfer hatası:', error);
        res.status(500).json({ success: false, error: 'Transfer işlemi sırasında bir hata oluştu' });
    }
});

// NFT satın al
router.post('/:id/purchase', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Ürün bulunamadı' });
        }

        // Ürünün satışta olup olmadığını kontrol et
        if (!product.isListed) {
            return res.status(400).json({ success: false, error: 'Bu ürün artık satışta değil' });
        }

        // Kullanıcının kendi ürününü satın almaya çalışmadığından emin ol
        if (product.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, error: 'Kendi ürününüzü satın alamazsınız' });
        }

        const { transactionHash } = req.body;
        if (!transactionHash) {
            return res.status(400).json({ success: false, error: 'Transaction hash gerekli' });
        }

        // Web3 servisini kullanarak satın alma işlemini doğrula
        const result = await web3Service.verifyPurchase(transactionHash, product.nftId);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }

        // Ürünün durumunu güncelle
        product.isListed = false;
        product.creator = req.user._id;
        await product.save();

        res.json({
            success: true,
            message: 'NFT başarıyla satın alındı',
            transactionHash: transactionHash
        });
    } catch (error) {
        console.error('Satın alma hatası:', error);
        res.status(500).json({ success: false, error: 'Satın alma işlemi sırasında bir hata oluştu' });
    }
}); 