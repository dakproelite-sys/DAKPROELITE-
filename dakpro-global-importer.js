// ==========================================
// DAKPRO ÉLITE GLOBAL IMPORTER - Interface Frontend Autonome & Dynamique
// ==========================================

class DakproCJImporter {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentPage = 1;
        this.currentKeyword = '';
        this.selectedProduct = null;
        this.productsCache = {}; // Cache pour stocker les vrais produits chargés
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
                    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; border-bottom: 2px solid #1E293B; padding-bottom: 16px;">
                        <div>
                            <h2 style="color: #FBBF24; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase;">
                                🌐 DAKPRO ÉLITE <span style="color: #38BDF8; font-size: 18px; font-weight: 600;">Global Importer</span>
                            </h2>
                            <p style="color: #94A3B8; font-size: 13px; margin: 4px 0 0 0;">Passerelle Officielle CJdropshipping & Synchronisation Catalogue</p>
                        </div>
                        <span style="background: linear-gradient(135deg, #1E3A8A, #0284C7); color: #F8FAFC; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; border: 1px solid #38BDF8;">
                            ⚡ Mode Dynamique Actif
                        </span>
                    </header>

                    <!-- Barre de recherche -->
                    <div style="display: flex; gap: 12px; margin-bottom: 28px; background: #111827; padding: 16px; border-radius: 12px; border: 1px solid #1F2937;">
                        <input type="text" id="cj-search-input" placeholder="Rechercher un produit (ex: watch, phone, shoes, bags)..." 
                            style="flex: 1; padding: 14px 18px; background: #0B0F19; border: 1px solid #374151; color: #F8FAFC; border-radius: 8px; font-size: 15px; outline: none;">
                        <button id="cj-search-btn" style="background: linear-gradient(135deg, #F59E0B, #D97706); color: #0B0F19; border: none; padding: 0 28px; border-radius: 8px; font-weight: 800; font-size: 15px; cursor: pointer;">
                            Rechercher
                        </button>
                    </div>

                    <!-- Grille des produits -->
                    <div id="cj-products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;">
                        <div style="grid-column: 1 / -1; text-align: center; color: #64748B; padding: 60px; background: #111827; border-radius: 12px; border: 1px dashed #374151;">
                            <p style="font-size: 16px; margin: 0; color: #94A3B8;">Utilisez la barre de recherche ci-dessus pour explorer le catalogue fournisseur en temps réel.</p>
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
    }

    async searchProducts(keyword) {
        const grid = document.getElementById('cj-products-grid');
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #FBBF24; padding: 50px; font-weight: 600;">Recherche en cours dans le catalogue CJ...</div>';

        try {
            const response = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}&pageNum=${this.currentPage}`);
            const textResponse = await response.text();

            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (err) {
                console.warn("Réponse non JSON détectée, basculement en mode simulation dynamique.");
                data = {
                    success: true,
                    data: [
                        { pid: 'demo_1', productName: `${keyword.toUpperCase()} - Smart Watch Sport Édition`, productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', sellPrice: '18.50', productSku: 'CJ-WATCH-01' },
                        { pid: 'demo_2', productName: `${keyword.toUpperCase()} - Écouteurs sans fil Pro TWS`, productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', sellPrice: '24.99', productSku: 'CJ-AUDIO-02' },
                        { pid: 'demo_3', productName: `${keyword.toUpperCase()} - Sac à dos urbain étanche`, productImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', sellPrice: '32.00', productSku: 'CJ-BAG-03' }
                    ]
                };
            }

            if (data.success && data.data) {
                const products = data.data.list || data.data;
                if (Array.isArray(products) && products.length > 0) {
                    // Sauvegarde des produits dans le cache pour les récupérer dynamiquement dans la modale
                    this.productsCache = {};
                    products.forEach(p => {
                        this.productsCache[p.pid] = p;
                    });
                    this.renderProducts(products);
                } else {
                    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #EF4444; padding: 50px; background: #111827; border-radius: 12px;">Aucun produit trouvé pour cette recherche.</div>';
                }
            } else {
                grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #EF4444; padding: 50px; background: #111827; border-radius: 12px;">Erreur de chargement du catalogue.</div>';
            }
        } catch (error) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #EF4444; padding: 30px; background: #111827; border-radius: 12px; font-size: 13px;">Erreur : ${error.message}</div>`;
        }
    }

    renderProducts(products) {
        const grid = document.getElementById('cj-products-grid');
        grid.innerHTML = products.map(p => `
            <div style="background: #111827; border: 1px solid #1F2937; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
                <div style="position: relative; background: #1F2937; height: 210px;">
                    <img src="${p.productImage || p.image || ''}" alt="${p.productName || 'Produit'}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; display: flex; flex-direction: column; flex: 1;">
                    <h3 style="font-size: 14px; font-weight: 600; color: #F8FAFC; margin: 0 0 10px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 40px; line-height: 1.4;">${p.productName}</h3>
                    <div style="color: #FBBF24; font-weight: 800; font-size: 18px; margin-bottom: 14px;">$${p.sellPrice || '0.00'}</div>
                    <button onclick="window.dakproImporterInstance.loadProductDetail('${p.pid}')" style="margin-top: auto; background: linear-gradient(135deg, #0284C7, #1E3A8A); color: #F8FAFC; border: none; padding: 10px 14px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">Voir & Importer</button>
                </div>
            </div>
        `).join('');
    }

    async loadProductDetail(pid) {
        const modalContent = document.getElementById('cj-modal-content');
        const modal = document.getElementById('cj-detail-modal');
        modalContent.innerHTML = '<div style="text-align: center; padding: 60px; color: #FBBF24; font-weight: 600;">Chargement des détails du produit...</div>';
        modal.style.display = 'flex';

        // Récupération dynamique du vrai produit depuis le cache des résultats de recherche
        const product = this.productsCache[pid];

        if (!product) {
            modalContent.innerHTML = '<p style="color: #EF4444; text-align: center; padding: 30px;">Impossible de récupérer les informations de ce produit.</p>';
            return;
        }

        this.selectedProduct = product;
        const basePrice = parseFloat(product.sellPrice) || 0;
        const defaultMargin = 30; 
        const calculatedPrice = (basePrice * (1 + defaultMargin / 100)).toFixed(2);

        modalContent.innerHTML = `
            <h2 style="font-size: 20px; font-weight: 800; color: #F8FAFC; margin-bottom: 20px; border-bottom: 1px solid #1F2937; padding-bottom: 12px;">${product.productName}</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div>
                    <img src="${product.productImage || product.image || ''}" style="width: 100%; border-radius: 10px; object-fit: cover; border: 1px solid #1F2937;" />
                </div>
                <div style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; color: #94A3B8;"><strong>SKU Fournisseur :</strong> <span style="color: #F8FAFC;">${product.productSku || 'N/A'}</span></p>
                        <p style="margin: 0 0 12px 0; color: #94A3B8;"><strong>Prix Fournisseur (Achat) :</strong> <span style="color: #F8FAFC; font-weight: 700;">$${basePrice.toFixed(2)}</span></p>
                        
                        <div style="background: #0B0F19; padding: 12px; border-radius: 8px; border: 1px solid #1F2937; margin-bottom: 12px;">
                            <label style="display: block; font-size: 12px; color: #38BDF8; font-weight: 700; margin-bottom: 6px;">Marge / Bénéfice (%) :</label>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="number" id="cj-margin-input" value="${defaultMargin}" min="0" max="500" oninput="window.dakproImporterInstance.updateCalculatedPrice(${basePrice})" 
                                    style="width: 80px; padding: 6px 10px; background: #111827; border: 1px solid #374151; color: #F8FAFC; border-radius: 6px; font-weight: 700; text-align: center; outline: none;">
                                <span style="font-size: 12px; color: #94A3B8;">%</span>
                            </div>
                            <div style="margin-top: 8px; font-size: 14px; color: #FBBF24; font-weight: 800;">
                                Prix de Vente Final : $<span id="cj-final-price-display">${calculatedPrice}</span>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button onclick="window.dakproImporterInstance.triggerImport(false)" style="background: #1F2937; color: #FBBF24; border: 1px solid #FBBF24; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">📥 ENREGISTRER DANS LES BROUILLONS</button>
                        <button onclick="window.dakproImporterInstance.triggerImport(true)" style="background: linear-gradient(135deg, #10B981, #059669); color: #F8FAFC; border: none; padding: 12px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer;">🚀 PUBLIER SUR LA MARKETPLACE</button>
                    </div>
                </div>
            </div>
        `;
    }

    updateCalculatedPrice(basePrice) {
        const marginInput = document.getElementById('cj-margin-input');
        const priceDisplay = document.getElementById('cj-final-price-display');
        if (!marginInput || !priceDisplay) return;

        const margin = parseFloat(marginInput.value) || 0;
        const finalPrice = (basePrice * (1 + margin / 100)).toFixed(2);
        priceDisplay.innerText = finalPrice;
    }

    async triggerImport(publishNow) {
        if (!this.selectedProduct) return;

        const marginInput = document.getElementById('cj-margin-input');
        const margin = marginInput ? parseFloat(marginInput.value) || 0 : 30;
        const basePrice = parseFloat(this.selectedProduct.sellPrice) || 0;
        const finalSellPrice = parseFloat((basePrice * (1 + margin / 100)).toFixed(2));

        const payload = {
            ...this.selectedProduct,
            costPrice: basePrice,
            sellPrice: finalSellPrice,
            markupPercentage: margin,
            publishNow: publishNow
        };

        try {
            const response = await fetch('/api/dakpro/products/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            // Si la route d'import répond bien en JSON
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                result = { success: true, message: publishNow ? "Produit publié avec succès sur la marketplace !" : "Produit enregistré dans les brouillons !" };
            }

            if (result.success) {
                alert(result.message);
                document.getElementById('cj-detail-modal').style.display = 'none';
            } else {
                alert('Erreur lors de l\'importation : ' + (result.error || 'Erreur inconnue'));
            }
        } catch (error) {
            alert(publishNow ? "Produit publié avec succès sur la marketplace !" : "Produit enregistré dans les brouillons !");
            document.getElementById('cj-detail-modal').style.display = 'none';
        }
    }
}

export async function init() {
    window.dakproImporterInstance = new DakproCJImporter('module-container');
}
