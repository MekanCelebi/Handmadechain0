// Metadata yükleme endpoint'i
router.post('/upload-metadata', async (req, res) => {
    try {
        const metadata = req.body;
        
        // Metadata'yı IPFS'e yükle
        const metadataBuffer = Buffer.from(JSON.stringify(metadata));
        const formData = new FormData();
        formData.append('file', metadataBuffer, {
            filename: 'metadata.json',
            contentType: 'application/json'
        });

        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Authorization': `Bearer ${process.env.PINATA_JWT}`,
                ...formData.getHeaders()
            }
        });

        const cid = response.data.IpfsHash;
        const tokenURI = `ipfs://${cid}`;

        res.json({ tokenURI });
    } catch (error) {
        console.error('Metadata upload error:', error);
        res.status(500).json({ error: 'Metadata yüklenemedi' });
    }
}); 