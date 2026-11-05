// ==========================================
// MODULE DAKPRO : Intégration CJdropshipping (Backend Vercel / Express)
// ==========================================
const express = require('express');
const router = express.Router();
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
let cjAccessToken = null;
let tokenExpiresAt = null;

// Obtention et rafraîchissement du Token CJ
async function getCJAccessToken() {
    const CJ_EMAIL = process.env.CJ_EMAIL;
    const CJ_API_KEY = process.env.CJ_API_KEY;

    if (!CJ_EMAIL || !CJ_API_KEY) {
        throw new Error("Les variables CJ_EMAIL ou CJ_API_KEY ne sont pas définies sur Vercel.");
    }

    if (cjAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
        return cjAccessToken;
    }

    try {
        const response = await axios.post(`${CJ_API_BASE}/authentication/getAccessToken`, {
            email: CJ_EMAIL,
            apiKey: CJ_API_KEY
        });

        const resData = response.data;
        if ((resData.code === 200 || resData.result) && resData.data && resData.data.accessToken) {
            cjAccessToken = resData.data.accessToken;
            tokenExpiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000); // 14 jours de sécurité
            return cjAccessToken;
        }

        throw new Error(resData.message || 'Échec d\'authentification auprès de CJdropshipping.');
    } catch (error) {
        console.error('Erreur Auth CJ:', error.response?.data || error.message);
        throw error;
    }
}

// 1. Route de recherche de produits CJ
const handleSearch = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
        const token = await getCJAccessToken();
        const { keyword, categoryId, pageNum = 1, pageSize = 20 } = req.query;

        const response = await axios.get(`${CJ_API_BASE}/product/list`, {
            headers: { 'CJ-Access-Token': token },
            params: { keyword, categoryId, pageNum, pageSize }
        });

        return res.json({
            success: true,
            data: response.data.data || response.data
        });
    } catch (error) {
        console.error('Erreur recherche CJ:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Route pour récupérer les détails complets d'un produit
const handleDetail = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
        const token = await getCJAccessToken();
        const { pid } = req.params;

        const response = await axios.get(`${CJ_API_BASE}/product/detail`, {
            headers: { 'CJ-Access-Token': token },
            params: { pid }
        });

        return res.json({
            success: true,
            data: response.data.data || response.data
        });
    } catch (error) {
        console.error('Erreur détail CJ:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Déclaration des routes (Prise en charge de tous les préfixes possibles)
router.get('/dakpro/cj/search', handleSearch);
router.get('/cj/search', handleSearch);
router.get('/search', handleSearch);

router.get('/dakpro/cj/product/:pid', handleDetail);
router.get('/cj/product/:pid', handleDetail);
router.get('/product/:pid', handleDetail);

// Exportation sous forme de fonction d'initialisation ET de Router Express
module.exports = function(app, db) {
    if (app) {
        app.get('/api/dakpro/cj/search', handleSearch);
        app.get('/api/dakpro/cj/product/:pid', handleDetail);
    }
    return router;
};

module.exports.router = router;
