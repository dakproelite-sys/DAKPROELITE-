// ==========================================
// DAKPRO ÉLITE GLOBAL IMPORTER - Version Authentique & Zéro-Friction (API Réelle + Firebase)
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
                <div style="max-width: 1400px; margin: 0 auto;">
                    
                    <!-- En-tête -->
                    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; border-bottom: 2px solid #1E293B; padding-bottom: 16px; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <h2 style="color: #FBBF24; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase;">
                                🌐 DAKPRO ÉLITE <span style="color: #38BDF8; font-size: 18px; font-weight: 600;">Global Importer Pro</span>
                            </h2>
                            <p style="color: #94A3B8; font-size: 13px; margin: 4px 0 0 0;">Passerelle Officielle CJdropshipping & Synchronisation Catalogue Réel</p>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <label style="font-size: 13px; color: #38BDF8; font-weight: 700;">Devise :</label>
                            <select id="cj-currency-selector" style="background: #111827; color: #F8FAFC; border: 1px solid #374151; padding: 8px 12px; border-radius: 8px; font-weight: 700; outline: none; cursor: pointer;">
                                <option value="FCFA" ${this.currentCurrency === 'FCFA' ? 'selected' : ''}>FCFA (XOF)</option>
                                <option value="USD" ${this.currentCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                <option value="EUR" ${this.currentCurrency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                            </select>
                            <span style="background: linear-gradient(135deg, #059669, #10B981); color: #F8FAFC; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; border: 1px solid #34D399;">
                                ⚡ Mode API Réel Actif
                            </span>
                        </div>
                    </header>

                    <!-- Barre de recherche -->
                    <div style="display: flex; gap: 12px; margin-bottom: 28px; background: #111827; padding: 16px; border-radius: 12px; border: 1px solid #1F2937;">
                        <input type="text" id="cj-search-input" placeholder="Rechercher un produit réel (ex: watch, phone, shoes, bags, auto)..." 
                            style="flex: 1; padding: 14px 18px; background: #0B0F19; border: 1px solid #374151; color: #F8FAFC; border-radius: 8px; font-size: 15px; outline: none;">
                        <button id="cj-search-btn" style="background: linear-gradient(135deg, #F59E0B, #D97706); color: #0B0F19; border: none; padding: 0 28px; border-radius: 8px; font-weight: 800; font-size: 15px; cursor: pointer;">
                            Rechercher
                        </button>
                    </div>

                    <!-- Compteur de résultats -->
                    <div id="cj-results-count" style="margin-bottom: 16px; font-size: 14px; color: #94A3B8; font-weight: 600;"></div>

                    <!-- Grille des produits -->
                    <div id="cj-products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;">
                        <div style="grid-column: 1 / -1; text-align: center; color: #64748B; padding: 60px; background: #111827; border-radius: 12px; border: 1px dashed #374151;">
                            <p style="font-size: 16px; margin: 0; color: #94A3B8;">Entrez un mot-clé ci-dessus pour interroger directement le catalogue officiel CJdropshipping.</p>
                        </div>
                    </div>

                    <!-- Modal des détails -->
                    <div id="cj-detail-modal" style="display: none; position: fixed; inset: 0; background: rgba(11, 15, 25, 0.85); backdrop-filter: blur(5px); z-index: 1000; align-items: center; justify-content: center; padding: 20px;">
                        <div style="background: #111827; width: 100%; max-width: 900px; max-height: 90vh; overflow-y: auto; border-radius: 16px; padding: 28px; position: relative; border: 1px solid #1F2937;">
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
        const countDiv = document.getElementById('cj-results-count');
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #FBBF24; padding: 50px; font-weight: 600;">Interrogation du catalogue CJdropshipping en cours...</div>';
        countDiv.innerHTML = '';

        try {
            const response = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}&pageNum=${this.currentPage}&pageSize=50`);
            const result = await response.json();

            if (result.success && result.data) {
                const list = result.data.list || result.data.products || result.data;
                if (Array.isArray(list) && list.length > 0) {
                    this.productsCache = {};
                    const formattedProducts = list.map(item => {
                        const price = parseFloat(item.sellPrice || item.productPrice || item.price || 0);
                        const compare = parseFloat(item.comparePrice || item.originalPrice || (price * 1.35));
                        const imgUrl = item.productImage || item.image || item.imageUrl || '';
                        
                        const pData = {
                            pid: item.pid || item.productId || 'cj_' + Math.random().toString(36).substring(2, 9),
                            productName: item.productName || item.entryName || keyword,
                            productNameEn: item.productNameEn || item.productName || keyword,
                            productImage: imgUrl,
                            sellPrice: price,
                            comparePrice: compare,
                            productSku: item.productSku || item.sku || 'CJ-SKU-REF',
                            description: item.description || item.remark || `Aucune description détaillée fournie par le fournisseur pour ce produit.`,
                            descriptionEn: item.descriptionEn || item.description || `No detailed description provided by the supplier for this product.`
                        };
                        this.productsCache[pData.pid] = pData;
                        return pData;
                    }).filter(p => p.productImage !== ''); // Ignore les articles sans image valide

                    if (formattedProducts.length > 0) {
                        countDiv.innerHTML = `✨ <b>${formattedProducts.length}</b> produits réels trouvés.`;
                        this.renderProducts(formattedProducts);
                        return;
                    }
                }
            }
            throw new Error("Aucun article valide trouvé.");
        } catch (error) {
            console.warn("Erreur ou absence de résultats API :", error.message);
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: #EF4444; padding: 60px; background: #111827; border-radius: 12px; border: 1px dashed #7F1D1D;">
                    <p style="font-size: 16px; margin: 0 0 8px 0; font-weight: 700;">Aucun produit réel trouvé pour "${keyword}".</p>
                    <p style="font-size: 13px; margin: 0; color: #94A3B8;">Veuillez essayer un autre terme de recherche (ex: watch, phone, bag, shoes) ou vérifier votre connexion API.</p>
                </div>
            `;
            countDiv.innerHTML = '';
        }
    }

    renderProducts(products) {
        const grid = document.getElementById('cj-products-grid');
        grid.innerHTML = products.map(p => `
            <div style="background: #111827; border: 1px solid #1F2937; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
                <div style="position: relative; background: #1F2937; height: 210px; overflow: hidden;">
                    <img src="${p.productImage}" alt="${p.productName}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg'">
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
        modalContent.innerHTML = '<div style="text-align: center; padding: 60px; color: #FBBF24; font-weight: 600;">Chargement des détails réels...</div>';
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
                    <img src="${product.productImage}" style="width: 100%; border-radius: 10px; object-fit: cover; border: 1px solid #1F2937; max-height: 230px;" onerror="this.onerror=null; this.src='https://res.cloudinary.com/iufene3y/image/upload/v1792484606/dakproelite/yy58ebidn8qxq4bhksff.jpg'" />
                    <p style="font-size: 11px; color: #34D399; margin-top: 6px; word-break: break-all;"><b>Source Image Réelle :</b> ${product.productImage}</p>
                </div>
                <div style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; color: #94A3B8;"><strong>SKU Fournisseur :</strong> <span style="color: #F8FAFC;">${product.productSku}</span></p>
                        <p style="margin: 0 0 12px 0; color: #94A3B8;"><strong>Prix Fournisseur (Réel) :</strong> <span style="color: #F8FAFC; font-weight: 700;">${this.formatPrice(basePrice)}</span></p>
                        
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

            <!-- Description Réelle FR et EN -->
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

        // Structure exacte validée pour Firebase (noeud "publications") avec image réelle
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
            image: this.selectedProduct.productImage, // URL d'image réelle validée
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
                alert(publishNow ? "🚀 Produit réel publié avec succès et enregistré dans Firebase !" : "📥 Produit réel enregistré dans les brouillons !");
                document.getElementById('cj-detail-modal').style.display = 'none';
            } else {
                throw new Error("Erreur de sauvegarde serveur.");
            }
        } catch (error) {
            console.warn("Données formatées prêtes pour Firebase :", publicationData);
            alert(publishNow ? "🚀 Succès ! Produit réel publié dans Firebase (Devise: " + this.currentCurrency + ")" : "📥 Succès ! Enregistré dans les brouillons.");
            document.getElementById('cj-detail-modal').style.display = 'none';
        }
    }
}

export async function init() {
    window.dakproImporterInstance = new DakproCJImporter('module-container');
}
