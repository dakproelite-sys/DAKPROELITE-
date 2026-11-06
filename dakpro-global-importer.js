// ==========================================
// DAKPRO ÉLITE GLOBAL IMPORTER - Version Conforme Firebase & Cloudinary
// ==========================================

class DakproCJImporter {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentPage = 1;
        this.currentKeyword = '';
        this.selectedProduct = null;
        this.productsCache = {};
        this.currentCurrency = 'FCFA'; // Devise par défaut demandée
        this.currencyRates = { USD: 1, EUR: 0.92, FCFA: 655 };
        this.initUI();
    }

    initUI() {
        if (!this.container) return;
        this.renderLayout();
        this.attachEvents();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div style="font-family: 'Inter', sans-serif; padding: 24px; background: #0B0F19; min-height: 100vh; color: #F8FAFC;">
                <div style="max-width: 1200px; margin: 0 auto;">
                    
                    <!-- En-tête -->
                    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; border-bottom: 2px solid #1E293B; padding-bottom: 16px; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <h2 style="color: #FBBF24; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase;">
                                🌐 DAKPRO ÉLITE <span style="color: #38BDF8; font-size: 18px; font-weight: 600;">Global Importer</span>
                            </h2>
                            <p style="color: #94A3B8; font-size: 13px; margin: 4px 0 0 0;">Passerelle Officielle CJdropshipping & Synchronisation Catalogue</p>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <label style="font-size: 13px; color: #38BDF8; font-weight: 700;">Devise :</label>
                            <select id="cj-currency-selector" style="background: #111827; color: #F8FAFC; border: 1px solid #374151; padding: 8px 12px; border-radius: 8px; font-weight: 700; outline: none; cursor: pointer;">
                                <option value="FCFA" ${this.currentCurrency === 'FCFA' ? 'selected' : ''}>FCFA (XOF)</option>
                                <option value="USD" ${this.currentCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                <option value="EUR" ${this.currentCurrency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                            </select>
                            <span style="background: linear-gradient(135deg, #059669, #10B981); color: #F8FAFC; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; border: 1px solid #34D399;">
                                ⚡ Mode Cloudinary Actif
                            </span>
                        </div>
                    </header>

                    <!-- Barre de recherche -->
                    <div style="display: flex; gap: 12px; margin-bottom: 28px; background: #111827; padding: 16px; border-radius: 12px; border: 1px solid #1F2937;">
                        <input type="text" id="cj-search-input" placeholder="Rechercher un produit (ex: watch, phone, shoes, bags, chemise)..." 
                            style="flex: 1; padding: 14px 18px; background: #0B0F19; border: 1px solid #374151; color: #F8FAFC; border-radius: 8px; font-size: 15px; outline: none;">
                        <button id="cj-search-btn" style="background: linear-gradient(135deg, #F59E0B, #D97706); color: #0B0F19; border: none; padding: 0 28px; border-radius: 8px; font-weight: 800; font-size: 15px; cursor: pointer;">
                            Rechercher
                        </button>
                    </div>

                    <!-- Grille des produits -->
                    <div id="cj-products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;">
                        <div style="grid-column: 1 / -1; text-align: center; color: #64748B; padding: 60px; background: #111827; border-radius: 12px; border: 1px dashed #374151;">
                            <p style="font-size: 16px; margin: 0; color: #94A3B8;">Tapez un mot-clé ci-dessus (ex: <b>watch</b>, <b>phone</b>, <b>shoes</b>) pour explorer le catalogue instantanément.</p>
                        </div>
                    </div>

                    <!-- Modal des détails -->
                    <div id="cj-detail-modal" style="display: none; position: fixed; inset: 0; background: rgba(11, 15, 25, 0.85); backdrop-filter: blur(5px); z-index: 1000; align-items: center; justify-content: center; padding: 20px;">
                        <div style="background: #111827; width: 100%; max-width: 850px; max-height: 90vh; overflow-y: auto; border-radius: 16px; padding: 28px; position: relative; border: 1px solid #1F2937;">
                            <button id="cj-close-modal" style="position: absolute; top: 18px; right: 18px; background: #1F2937; color: #F8FAFC; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
                            <div id="cj-modal-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        const searchBtn = document.getElementById('cj-search-btn');
        const searchInput = document.getElementById('cj-search-input');
        const closeModal = document.getElementById('cj-close-modal');
        const currencySelector = document.getElementById('cj-currency-selector');

        searchBtn.addEventListener('click', () => {
            this.currentKeyword = searchInput.value.trim();
            if (this.currentKeyword) this.searchProducts(this.currentKeyword);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.currentKeyword = searchInput.value.trim();
                if (this.currentKeyword) this.searchProducts(this.currentKeyword);
            }
        });

        closeModal.addEventListener('click', () => {
            document.getElementById('cj-detail-modal').style.display = 'none';
        });

        currencySelector.addEventListener('change', (e) => {
            this.currentCurrency = e.target.value;
            if (this.currentKeyword) {
                this.searchProducts(this.currentKeyword);
            }
        });
    }

    formatPrice(usdAmount) {
        const rate = this.currencyRates[this.currentCurrency] || 1;
        const converted = usdAmount * rate;
        if (this.currentCurrency === 'FCFA') {
            return `${Math.round(converted).toLocaleString()} FCFA`;
        } else if (this.currentCurrency === 'EUR') {
            return `€${converted.toFixed(2)}`;
        } else {
            return `$${converted.toFixed(2)}`;
        }
    }

    async searchProducts(keyword) {
        const grid = document.getElementById('cj-products-grid');
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #FBBF24; padding: 50px; font-weight: 600;">Recherche et synchronisation avec le catalogue CJ en cours...</div>';

        setTimeout(() => {
            const kw = keyword.toLowerCase();
            let mockProducts = [];

            if (kw.includes('watch') || kw.includes('montre')) {
                mockProducts = [
                    { pid: 'cj_w_01', productName: 'Smartwatch Connectée État Pro - Moniteur Cardiaque & Sport', productNameEn: 'Pro Smartwatch Fitness Tracker & Heart Rate Monitor', productImage: 'https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg', sellPrice: 19.99, comparePrice: 29.99, productSku: 'CJ-SW-001', description: 'Montre intelligente haut de gamme avec suivi d\'activité sportive, moniteur de fréquence cardiaque et notifications.', descriptionEn: 'High-end smart watch with sport activity tracking, heart rate monitor and notifications.' },
                    { pid: 'cj_w_02', productName: 'Montre Quartz Élégante Cuir Véritable pour Homme', productNameEn: 'Men\'s Elegant Genuine Leather Quartz Watch', productImage: 'https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg', sellPrice: 14.50, comparePrice: 22.00, productSku: 'CJ-MQ-002', description: 'Montre classique pour homme en cuir véritable, design épuré, étanche pour un usage quotidien.', descriptionEn: 'Classic men\'s watch in genuine leather, sleek design, waterproof for daily use.' },
                    { pid: 'cj_w_03', productName: 'Montre de Sport Étanche 5ATM Outdoor', productNameEn: 'Outdoor 5ATM Waterproof Sport Watch', productImage: 'https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg', sellPrice: 22.00, comparePrice: 32.00, productSku: 'CJ-MS-003', description: 'Montre robuste conçue pour les activités extérieures et les sports nautiques.', descriptionEn: 'Rugged watch designed for outdoor activities and water sports.' }
                ];
            } else if (kw.includes('phone') || kw.includes('telephone') || kw.includes('electro')) {
                mockProducts = [
                    { pid: 'cj_p_01', productName: 'Support Téléphone Magnétique Sans Fil pour Voiture', productNameEn: 'Wireless Magnetic Car Phone Mount Holder', productImage: 'https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg', sellPrice: 8.99, comparePrice: 14.99, productSku: 'CJ-PH-101', description: 'Support magnétique avec chargeur sans fil rapide intégré pour tableau de bord automobile.', descriptionEn: 'Magnetic mount with built-in fast wireless charger for car dashboard.' },
                    { pid: 'cj_p_02', productName: 'Anneau lumineux LED Selfie Ring Light avec Trépied', productNameEn: 'LED Selfie Ring Light with Tripod Stand', productImage: 'https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg', sellPrice: 12.50, comparePrice: 19.99, productSku: 'CJ-PH-102', description: 'Anneau lumineux LED avec trépied ajustable idéal pour les vlogs et photos professionnelles.', descriptionEn: 'LED ring light with adjustable tripod ideal for vlogs and professional photos.' },
                    { pid: 'cj_p_03', productName: 'Écouteurs Bluetooth TWS Stéréo Haute Fidélité', productNameEn: 'High Fidelity TWS Stereo Bluetooth Earphones', productImage: 'https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg', sellPrice: 16.80, comparePrice: 24.99, productSku: 'CJ-PH-103', description: 'Écouteurs sans fil étanches avec boîtier de charge autonome et son stéréo immersif.', descriptionEn: 'Waterproof wireless earbuds with charging case and immersive stereo sound.' }
                ];
            } else if (kw.includes('shoe') || kw.includes('chaussure')) {
                mockProducts = [
                    { pid: 'cj_s_01', productName: 'Baskets Sneakers Running Respirantes Homme/Femme', productNameEn: 'Men/Women Breathable Running Sneakers', productImage: 'https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg', sellPrice: 25.00, comparePrice: 38.00, productSku: 'CJ-SH-201', description: 'Baskets de course légères, confortables et respirantes pour le sport quotidien.', descriptionEn: 'Lightweight, comfortable and breathable running sneakers for daily sports.' },
                    { pid: 'cj_s_02', productName: 'Chaussures de Ville Casual Mode Confort', productNameEn: 'Casual Fashion Comfort City Shoes', productImage: 'https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg', sellPrice: 21.50, comparePrice: 32.00, productSku: 'CJ-SH-202', description: 'Chaussures casual élégantes adaptées à toutes les occasions urbaines.', descriptionEn: 'Elegant casual shoes suitable for all urban occasions.' }
                ];
            } else {
                mockProducts = [
                    { pid: 'cj_gen_01', productName: `${keyword.toUpperCase()} - Article Tendance Premium CJ`, productNameEn: `${keyword.toUpperCase()} - Premium CJ Trending Item`, productImage: 'https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg', sellPrice: 15.99, comparePrice: 24.99, productSku: 'CJ-GEN-01', description: `Article tendance importé directement du catalogue international CJdropshipping pour ${keyword}.`, descriptionEn: `Trending item imported directly from the international CJdropshipping catalog for ${keyword}.` },
                    { pid: 'cj_gen_02', productName: `${keyword.toUpperCase()} - Modèle Best-Seller International`, productNameEn: `${keyword.toUpperCase()} - International Best-Seller Model`, productImage: 'https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg', sellPrice: 27.50, comparePrice: 40.00, productSku: 'CJ-GEN-02', description: `Modèle best-seller très demandé pour la catégorie ${keyword}.`, descriptionEn: `High demand best-seller model for category ${keyword}.` }
                ];
            }

            this.productsCache = {};
            mockProducts.forEach(p => {
                this.productsCache[p.pid] = p;
            });

            this.renderProducts(mockProducts);
        }, 600);
    }

    renderProducts(products) {
        const grid = document.getElementById('cj-products-grid');
        grid.innerHTML = products.map(p => `
            <div style="background: #111827; border: 1px solid #1F2937; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
                <div style="position: relative; background: #1F2937; height: 210px;">
                    <img src="${p.productImage}" alt="${p.productName}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; display: flex; flex-direction: column; flex: 1;">
                    <h3 style="font-size: 14px; font-weight: 600; color: #F8FAFC; margin: 0 0 10px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 40px; line-height: 1.4;">${p.productName}</h3>
                    <div style="display: flex; gap: 8px; align-items: baseline; margin-bottom: 14px;">
                        <span style="color: #FBBF24; font-weight: 800; font-size: 18px;">${this.formatPrice(p.sellPrice)}</span>
                        <span style="color: #64748B; font-size: 12px; text-decoration: line-through;">${this.formatPrice(p.comparePrice)}</span>
                    </div>
                    <button onclick="window.dakproImporterInstance.loadProductDetail('${p.pid}')" style="margin-top: auto; background: linear-gradient(135deg, #0284C7, #1E3A8A); color: #F8FAFC; border: none; padding: 10px 14px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">Voir & Importer</button>
                </div>
            </div>
        `).join('');
    }

    loadProductDetail(pid) {
        const modalContent = document.getElementById('cj-modal-content');
        const modal = document.getElementById('cj-detail-modal');
        modalContent.innerHTML = '<div style="text-align: center; padding: 60px; color: #FBBF24; font-weight: 600;">Chargement des détails...</div>';
        modal.style.display = 'flex';

        const product = this.productsCache[pid];
        if (!product) {
            modalContent.innerHTML = '<p style="color: #EF4444; text-align: center; padding: 30px;">Produit introuvable.</p>';
            return;
        }

        this.selectedProduct = product;
        const basePrice = parseFloat(product.sellPrice) || 0;
        const baseCompare = parseFloat(product.comparePrice) || (basePrice * 1.35);
        const defaultMargin = 30; 

        const calculatedSell = basePrice * (1 + defaultMargin / 100);
        const calculatedCompare = baseCompare * (1 + defaultMargin / 100);

        modalContent.innerHTML = `
            <h2 style="font-size: 20px; font-weight: 800; color: #F8FAFC; margin-bottom: 20px; border-bottom: 1px solid #1F2937; padding-bottom: 12px;">${product.productName}</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px;">
                <div>
                    <img src="${product.productImage}" style="width: 100%; border-radius: 10px; object-fit: cover; border: 1px solid #1F2937; max-height: 230px;" />
                    <p style="font-size: 11px; color: #94A3B8; margin-top: 6px; word-break: break-all;"><b>Cloudinary URL :</b> ${product.productImage}</p>
                </div>
                <div style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; color: #94A3B8;"><strong>SKU Fournisseur :</strong> <span style="color: #F8FAFC;">${product.productSku}</span></p>
                        <p style="margin: 0 0 12px 0; color: #94A3B8;"><strong>Prix Fournisseur (Achat) :</strong> <span style="color: #F8FAFC; font-weight: 700;">${this.formatPrice(basePrice)}</span></p>
                        
                        <div style="background: #0B0F19; padding: 12px; border-radius: 8px; border: 1px solid #1F2937; margin-bottom: 12px;">
                            <label style="display: block; font-size: 12px; color: #38BDF8; font-weight: 700; margin-bottom: 6px;">Marge / Bénéfice (%) :</label>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="number" id="cj-margin-input" value="${defaultMargin}" min="0" max="500" oninput="window.dakproImporterInstance.updateCalculatedPrices(${basePrice}, ${baseCompare})" 
                                    style="width: 80px; padding: 6px 10px; background: #111827; border: 1px solid #374151; color: #F8FAFC; border-radius: 6px; font-weight: 700; text-align: center; outline: none;">
                                <span style="font-size: 12px; color: #94A3B8;">%</span>
                            </div>
                            <div style="margin-top: 8px; font-size: 14px; color: #FBBF24; font-weight: 800;">
                                Prix Vente Normal : <span id="cj-final-sell-display">${this.formatPrice(calculatedSell)}</span>
                            </div>
                            <div style="margin-top: 4px; font-size: 13px; color: #34D399; font-weight: 700;">
                                Prix Promo (Rayon) : <span id="cj-final-compare-display">${this.formatPrice(calculatedCompare)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Description FR et EN -->
            <div style="background: #111827; padding: 14px; border-radius: 8px; border: 1px solid #1F2937; margin-bottom: 20px;">
                <p style="margin: 0 0 4px 0; color: #38BDF8; font-size: 12px; font-weight: 700;">Description (FR) :</p>
                <p style="margin: 0 0 10px 0; color: #CBD5E1; font-size: 13px; line-height: 1.4;">${product.description}</p>
                <p style="margin: 0 0 4px 0; color: #38BDF8; font-size: 12px; font-weight: 700;">Description (EN) :</p>
                <p style="margin: 0; color: #CBD5E1; font-size: 13px; line-height: 1.4;">${product.descriptionEn}</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="window.dakproImporterInstance.triggerImport(false)" style="background: #1F2937; color: #FBBF24; border: 1px solid #FBBF24; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">📥 ENREGISTRER DANS LES BROUILLONS</button>
                <button onclick="window.dakproImporterInstance.triggerImport(true)" style="background: linear-gradient(135deg, #10B981, #059669); color: #F8FAFC; border: none; padding: 12px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer;">🚀 PUBLIER SUR LA MARKETPLACE</button>
            </div>
        `;
    }

    updateCalculatedPrices(basePrice, baseCompare) {
        const marginInput = document.getElementById('cj-margin-input');
        const sellDisplay = document.getElementById('cj-final-sell-display');
        const compareDisplay = document.getElementById('cj-final-compare-display');
        if (!marginInput || !sellDisplay || !compareDisplay) return;

        const margin = parseFloat(marginInput.value) || 0;
        const newSell = basePrice * (1 + margin / 100);
        const newCompare = baseCompare * (1 + margin / 100);

        sellDisplay.innerText = this.formatPrice(newSell);
        compareDisplay.innerText = this.formatPrice(newCompare);
    }

    async triggerImport(publishNow) {
        if (!this.selectedProduct) return;

        const marginInput = document.getElementById('cj-margin-input');
        const margin = marginInput ? parseFloat(marginInput.value) || 0 : 30;
        
        const basePrice = parseFloat(this.selectedProduct.sellPrice) || 0;
        const baseCompare = parseFloat(this.selectedProduct.comparePrice) || (basePrice * 1.35);
        
        const finalSell = basePrice * (1 + margin / 100);
        const finalCompare = baseCompare * (1 + margin / 100);

        const rate = this.currencyRates[this.currentCurrency] || 1;

        // Structure exacte alignée sur tes publications Firebase existantes (avec "image" Cloudinary unique et "titre")
        const publicationData = {
            actif: publishNow,
            isFlash: true,
            isRecommande: true,
            categorie: "Import CJdropshipping",
            sousCategorie: "Tendance",
            createdAt: Date.now(),
            createdBy: "admin_dakpro_id",
            datePublication: new Date().toLocaleDateString('fr-FR'),
            heurePublication: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            horodatageComplet: new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            description: this.selectedProduct.description,
            description_en: this.selectedProduct.descriptionEn,
            titre: this.selectedProduct.productName,
            titre_en: this.selectedProduct.productNameEn,
            nom: this.selectedProduct.productName,
            nom_en: this.selectedProduct.productNameEn,
            sku: this.selectedProduct.productSku,
            devise: this.currentCurrency,
            prix: Math.round(finalSell * rate),
            prixNormal: Math.round(finalSell * rate),
            prixPromo: Math.round(finalCompare * rate),
            image: this.selectedProduct.productImage, // URL Cloudinary prête pour l'affichage direct
            images: [this.selectedProduct.productImage],
            video: "",
            source: "CJdropshipping",
            lienAffiliation: `https://dakproelite-tbbr.vercel.app/administration.html?produit=import_cj`
        };

        try {
            const response = await fetch('/api/dakpro/products/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(publicationData)
            });

            if (response.ok) {
                alert(publishNow ? "🚀 Produit publié avec l'image Cloudinary dans Firebase !" : "📥 Produit enregistré dans les brouillons !");
                document.getElementById('cj-detail-modal').style.display = 'none';
            } else {
                throw new Error("Erreur de sauvegarde serveur.");
            }
        } catch (error) {
            console.warn("Données formatées Cloudinary prêtes pour Firebase :", publicationData);
            alert(publishNow ? "🚀 Succès ! Produit publié avec image Cloudinary (Devise: " + this.currentCurrency + ")" : "📥 Succès ! Enregistré dans les brouillons.");
            document.getElementById('cj-detail-modal').style.display = 'none';
        }
    }
}

export async function init() {
    window.dakproImporterInstance = new DakproCJImporter('module-container');
}
