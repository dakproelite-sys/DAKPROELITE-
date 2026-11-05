// ==========================================
// MODULE DAKPRO : Intégration CJdropshipping (Backend avec Cloudinary & Firebase)
// ==========================================
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration CJdropshipping
const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const CJ_EMAIL = process.env.CJ_EMAIL; 
const CJ_API_KEY = process.env.CJ_API_KEY; 

let cjAccessToken = null;
let tokenExpiresAt = null;

async function getCJAccessToken() {
    if (cjAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
        return cjAccessToken;
    }
    try {
        const response = await axios.post(`${CJ_API_BASE}/authentication/getAccessToken`, {
            email: CJ_EMAIL,
            apiKey: CJ_API_KEY
        });
        if (response.data && response.data.result) {
            cjAccessToken = response.data.data.accessToken;
            tokenExpiresAt = Date.now() + (25 * 24 * 60 * 60 * 1000); 
            return cjAccessToken;
        }
        throw new Error('Échec d\'authentification CJdropshipping');
    } catch (error) {
        console.error('Erreur Auth CJ:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = function(app, db) {
    // 1. Route de recherche de produits CJ (Gère les deux formats de préfixes pour éviter le 404)
    const handleSearch = async (req, res) => {
        try {
            res.setHeader('Content-Type', 'application/json');
            const token = await getCJAccessToken();
            const { keyword, categoryId, pageNum = 1, pageSize = 20 } = req.query;

            const response = await axios.get(`${CJ_API_BASE}/product/list`, {
                headers: { 'CJ-Access-Token': token },
                params: { keyword, categoryId, pageNum, pageSize }
            });

            return res.json(response.data);
        } catch (error) {
            console.error('Erreur recherche CJ:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    };

    app.get('/api/dakpro/cj/search', handleSearch);
    app.get('/cj/search', handleSearch); // Route de secours

    // 2. Route pour récupérer les détails complets d'un produit
    const handleDetail = async (req, res) => {
        try {
            res.setHeader('Content-Type', 'application/json');
            const token = await getCJAccessToken();
            const { pid } = req.params;

            const response = await axios.get(`${CJ_API_BASE}/product/detail`, {
                headers: { 'CJ-Access-Token': token },
                params: { pid }
            });

            return res.json(response.data);
        } catch (error) {
            console.error('Erreur détail CJ:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    };

    app.get('/api/dakpro/cj/product/:pid', handleDetail);
    app.get('/cj/product/:pid', handleDetail); // Route de secours

    // 3. Route d'importation : Upload Cloudinary + Enregistrement Firebase
    const handleImport = async (req, res) => {
        try {
            res.setHeader('Content-Type', 'application/json');
            const productData = req.body;
            let secureImageUrl = productData.productImage;

            if (secureImageUrl && secureImageUrl.startsWith('http')) {
                try {
                    const uploadResponse = await cloudinary.uploader.upload(secureImageUrl, {
                        folder: 'dakpro_elite/products'
                    });
                    secureImageUrl = uploadResponse.secure_url; 
                } catch (cloudError) {
                    console.error('Erreur upload Cloudinary (utilisant l\'image de secours):', cloudError.message);
                }
            }
            
            const newProduct = {
                title: productData.productName,
                description: productData.description || '',
                image: secureImageUrl,
                images: [secureImageUrl],
                sku: productData.productSku,
                costPrice: productData.costPrice || productData.sellPrice, 
                price: productData.sellPrice, 
                markupPercentage: productData.markupPercentage || 30, 
                variants: productData.variants || [],
                source: 'CJdropshipping',
                status: productData.publishNow ? 'active' : 'draft',
                createdAt: new Date()
            };

            const docRef = await db.collection('products').add(newProduct);

            const actionMessage = productData.publishNow 
                ? 'Produit publié avec succès sur la marketplace DAKPRO !' 
                : 'Produit enregistré dans les brouillons avec succès.';

            return res.json({ 
                success: true, 
                message: actionMessage,
                productId: docRef.id,
                product: newProduct 
            });

        } catch (error) {
            console.error('Erreur lors de l\'importation du produit :', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    };

    app.post('/api/dakpro/products/import', handleImport);
    app.post('/dakpro/products/import', handleImport); // Route de secours
};
