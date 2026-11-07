// ============================================================
// DAKPRO ÉLITE — GLOBAL CJ DROPSHIPPING IMPORTER
// Catalogue CJ Authentique — Firebase — Multi-devises / Multi-langues
// CHARTE : NOIR / OR MÉTALLIQUE / JAUNE OR / BLEU BRILLANT
// ============================================================

import {
    getDatabase,
    ref,
    push,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


class DakproCJImporter {

    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentPage = 1;
        this.currentKeyword = '';
        this.selectedProduct = null;
        this.productsCache = {};
        this.db = getDatabase();
        this.initUI();
    }

    // ========================================================
    // INITIALISATION
    // ========================================================

    initUI() {
        if (!this.container) return;
        this.renderLayout();
        this.attachEvents();
    }

    // ========================================================
    // INTERFACE DAKPRO ÉLITE
    // ========================================================

    renderLayout() {

        this.container.innerHTML = `

        <style>

        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        .dakpro-cj {
            font-family:'Poppins',sans-serif;
            background:#050505;
            color:#fff;
            min-height:100vh;
            padding:24px;
        }

        .dakpro-cj * {
            box-sizing:border-box;
        }

        .cj-header {
            display:flex;
            justify-content:space-between;
            align-items:center;
            flex-wrap:wrap;
            gap:15px;
            padding-bottom:20px;
            margin-bottom:25px;
            border-bottom:2px solid #D4AF37;
        }

        .cj-title {
            color:#FFD700;
            font-size:25px;
            font-weight:800;
            margin:0;
        }

        .cj-subtitle {
            color:#aaa;
            font-size:12px;
            margin-top:5px;
        }

        .cj-status {
            background:linear-gradient(135deg,#D4AF37,#FFD700);
            color:#050505;
            padding:9px 15px;
            border-radius:8px;
            font-size:12px;
            font-weight:800;
        }

        .cj-search-box {
            display:flex;
            gap:10px;
            flex-wrap:wrap;
            background:#101010;
            border:1px solid #D4AF37;
            padding:15px;
            border-radius:12px;
            margin-bottom:25px;
        }

        .cj-search-box input {
            flex:1;
            min-width:180px;
            padding:14px;
            border:1px solid #555;
            background:#080808;
            color:white;
            border-radius:8px;
            outline:none;
            font-family:inherit;
        }

        .cj-search-box input:focus {
            border-color:#FFD700;
            box-shadow:0 0 8px #D4AF3755;
        }

        .cj-btn-search {
            background:linear-gradient(135deg,#D4AF37,#FFD700);
            color:#050505;
            border:none;
            border-radius:8px;
            padding:12px 25px;
            font-weight:800;
            cursor:pointer;
        }

        .cj-grid {
            display:grid;
            grid-template-columns:repeat(auto-fill,minmax(230px,1fr));
            gap:20px;
        }

        .cj-card {
            background:#101010;
            border:1px solid #554719;
            border-radius:12px;
            overflow:hidden;
            transition:.25s;
        }

        .cj-card:hover {
            border-color:#FFD700;
            transform:translateY(-4px);
            box-shadow:0 5px 20px #D4AF3730;
        }

        .cj-card-image {
            height:210px;
            background:#080808;
        }

        .cj-card-image img {
            width:100%;
            height:100%;
            object-fit:cover;
        }

        .cj-card-body {
            padding:15px;
        }

        .cj-card-name {
            font-size:13px;
            font-weight:600;
            min-height:42px;
            color:#fff;
            overflow:hidden;
            display:-webkit-box;
            -webkit-line-clamp:2;
            -webkit-box-orient:vertical;
        }

        .cj-card-price {
            color:#FFD700;
            font-size:19px;
            font-weight:800;
            margin:12px 0;
        }

        .cj-btn-view {
            width:100%;
            padding:11px;
            border:1px solid #007BFF;
            background:linear-gradient(135deg,#007BFF,#003B8E);
            color:white;
            border-radius:8px;
            font-weight:700;
            cursor:pointer;
        }

        .cj-modal {
            display:none;
            position:fixed;
            inset:0;
            background:#000e;
            backdrop-filter:blur(6px);
            z-index:99999;
            align-items:center;
            justify-content:center;
            padding:15px;
        }

        .cj-modal-box {
            background:#101010;
            border:1px solid #D4AF37;
            border-radius:15px;
            width:100%;
            max-width:900px;
            max-height:90vh;
            overflow:auto;
            padding:25px;
            position:relative;
        }

        .cj-modal-title {
            color:#FFD700;
            font-size:20px;
            font-weight:800;
            padding-right:35px;
        }

        .cj-detail-grid {
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(230px,1fr));
            gap:22px;
            margin-top:20px;
        }

        .cj-detail-image {
            width:100%;
            border-radius:10px;
            border:1px solid #D4AF37;
            max-height:280px;
            object-fit:cover;
        }

        .cj-field {
            width:100%;
            padding:11px;
            background:#080808;
            border:1px solid #554719;
            border-radius:7px;
            color:white;
            margin:7px 0 15px;
            font-family:inherit;
        }

        .cj-field:focus {
            outline:none;
            border-color:#FFD700;
            box-shadow:0 0 7px #D4AF3740;
        }

        .cj-label {
            color:#FFD700;
            font-size:12px;
            font-weight:700;
        }

        .cj-section {
            border:1px solid #554719;
            background:#090909;
            border-radius:10px;
            padding:15px;
            margin-top:18px;
        }

        .cj-section-title {
            color:#FFD700;
            font-size:14px;
            font-weight:800;
            margin:0 0 12px;
        }

        .cj-final-price {
            color:#FFD700;
            font-size:21px;
            font-weight:800;
            margin:15px 0;
            padding:15px;
            background:#151208;
            border:1px solid #D4AF37;
            border-radius:9px;
        }

        .cj-calculation-line {
            display:flex;
            justify-content:space-between;
            gap:10px;
            padding:7px 0;
            border-bottom:1px solid #282828;
            font-size:12px;
            color:#bbb;
        }

        .cj-calculation-line strong {
            color:#fff;
        }

        .cj-commission-grid {
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
            gap:12px;
        }

        .cj-commission-card {
            background:#111;
            border:1px solid #554719;
            border-radius:8px;
            padding:12px;
        }

        .cj-commission-card label {
            display:block;
            color:#D4AF37;
            font-size:11px;
            font-weight:700;
        }

        .cj-commission-card input {
            width:100%;
            padding:10px;
            margin-top:8px;
            background:#050505;
            color:#FFD700;
            border:1px solid #554719;
            border-radius:6px;
            font-size:17px;
            font-weight:800;
        }

        .cj-commission-amount {
            color:#fff;
            font-size:12px;
            margin-top:8px;
        }

        .cj-total-commission {
            margin-top:13px;
            padding:12px;
            border-radius:8px;
            background:#111;
            color:#FFD700;
            font-weight:800;
            font-size:13px;
        }

        .cj-validation {
            margin-top:10px;
            font-size:12px;
            font-weight:700;
        }

        .cj-valid {
            color:#22c55e;
        }

        .cj-invalid {
            color:#ff5252;
        }

        .cj-action {
            width:100%;
            padding:13px;
            border-radius:8px;
            font-weight:800;
            cursor:pointer;
            margin-top:9px;
            font-family:inherit;
        }

        .cj-draft {
            background:#111;
            color:#FFD700;
            border:1px solid #D4AF37;
        }

        .cj-publish {
            background:linear-gradient(135deg,#D4AF37,#FFD700);
            color:#050505;
            border:none;
        }

        .cj-action:disabled {
            opacity:.5;
            cursor:wait;
        }

        .cj-close {
            position:absolute;
            right:15px;
            top:12px;
            width:35px;
            height:35px;
            border:1px solid #D4AF37;
            border-radius:50%;
            background:#080808;
            color:#FFD700;
            font-size:21px;
            cursor:pointer;
        }

        @media(max-width:600px) {
            .dakpro-cj {padding:12px;}
            .cj-title {font-size:20px;}
            .cj-modal-box {padding:17px;}
        }

        </style>


        <div class="dakpro-cj">

            <div style="max-width:1250px;margin:auto;">

                <header class="cj-header">

                    <div>
                        <h2 class="cj-title">
                            🌐 DAKPRO ÉLITE
                            <span style="color:#007BFF;font-size:16px;">
                                GLOBAL IMPORTER
                            </span>
                        </h2>

                        <p class="cj-subtitle">
                            Passerelle CJdropshipping — Importation et publication du catalogue authentique
                        </p>
                    </div>

                    <span class="cj-status">
                        ⚡ API CJ ACTIVE
                    </span>

                </header>


                <div class="cj-search-box">

                    <input
                        type="text"
                        id="cj-search-input"
                        placeholder="Rechercher un produit réel (ex: watch, phone, shoes, bag)..."
                    >

                    <button
                        id="cj-search-btn"
                        class="cj-btn-search"
                    >
                        🔎 RECHERCHER
                    </button>

                </div>


                <div id="cj-search-info"
                    style="color:#D4AF37;font-size:12px;margin-bottom:15px;">
                </div>


                <div id="cj-products-grid" class="cj-grid">

                    <div style="
                        grid-column:1/-1;
                        padding:50px;
                        text-align:center;
                        background:#101010;
                        border:1px dashed #D4AF37;
                        border-radius:12px;
                        color:#aaa;
                    ">
                        Entrez un mot-clé précis pour interroger les produits réels de CJdropshipping.
                    </div>

                </div>


                <div class="cj-modal" id="cj-detail-modal">

                    <div class="cj-modal-box">

                        <button
                            class="cj-close"
                            id="cj-close-modal"
                        >
                            ×
                        </button>

                        <div id="cj-modal-content"></div>

                    </div>

                </div>

            </div>

        </div>

        `;
    }

    // ========================================================
    // ÉVÉNEMENTS
    // ========================================================

    attachEvents() {

        const searchBtn = document.getElementById('cj-search-btn');
        const searchInput = document.getElementById('cj-search-input');

        searchBtn.addEventListener('click', () => {

            this.currentKeyword = searchInput.value.trim();
            this.currentPage = 1;

            if (this.currentKeyword) {
                this.searchProducts(this.currentKeyword);
            }

        });

        searchInput.addEventListener('keypress', e => {

            if (e.key === 'Enter') {

                this.currentKeyword = searchInput.value.trim();
                this.currentPage = 1;

                if (this.currentKeyword) {
                    this.searchProducts(this.currentKeyword);
                }

            }

        });

        document.getElementById('cj-close-modal')
            .addEventListener('click', () => {

                document.getElementById('cj-detail-modal')
                    .style.display = 'none';

            });

    }

    // ========================================================
    // RECHERCHE DIRECTE DU CATALOGUE CJ AUTHENTIQUE
    // ========================================================

    async searchProducts(keyword) {

        const grid = document.getElementById('cj-products-grid');
        const info = document.getElementById('cj-search-info');

        grid.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:50px;
                color:#FFD700;
            ">
                Interrogation des serveurs CJdropshipping pour "${this.escapeHTML(keyword)}" en cours...
            </div>
        `;

        info.innerText = '';

        try {
            const response = await fetch(
                `/api/search?keyword=${encodeURIComponent(keyword)}&page=${this.currentPage}`
            );

            if (!response.ok) {
                throw new Error("Impossible de joindre la passerelle API CJdropshipping.");
            }

            const result = await response.json();
            const products = result.products || result.data?.products || result.data?.content || result.data || [];

            if (!Array.isArray(products) || products.length === 0) {
                grid.innerHTML = `
                    <div style="
                        grid-column:1/-1;
                        padding:45px;
                        text-align:center;
                        background:#101010;
                        border:1px solid #D4AF37;
                        border-radius:12px;
                        color:#FFD700;
                    ">
                        Aucun produit réel trouvé pour "<b>${this.escapeHTML(keyword)}</b>". Essayez un autre terme en anglais (ex: watch, phone, shoes).
                    </div>
                `;
                return;
            }

            this.productsCache = {};

            const normalized = products.map(p => {
                const rawImg = p.productImage || p.bigImage || p.image || p.productImageUrl || '';
                const product = {
                    ...p,
                    pid: p.pid || p.productId || p.id,
                    productName: p.productName || p.name || p.nameEn || p.title || keyword,
                    productImage: rawImg,
                    sellPrice: p.sellPrice ?? p.price ?? p.nowPrice ?? 0,
                    productSku: p.productSku || p.sku || p.spu || '',
                    categoryName: p.categoryName || p.category || keyword,
                    description: p.description || p.descriptionEn || `Description officielle CJdropshipping pour ${keyword}.`,
                    stock: p.stock ?? p.inventory ?? 500,
                    raw: p
                };

                if (product.pid && product.productImage) {
                    this.productsCache[product.pid] = product;
                }
                return product;
            }).filter(p => p.pid && p.productImage);

            if (!normalized.length) {
                grid.innerHTML = `
                    <div style="
                        grid-column:1/-1;
                        padding:45px;
                        text-align:center;
                        color:#FFD700;
                    ">
                        Produits trouvés mais sans images valides exploitables.
                    </div>
                `;
                return;
            }

            this.renderProducts(normalized);
            info.innerText = `${normalized.length} produits authentiques trouvés — Catalogue CJdropshipping`;

        } catch (error) {
            console.error("DAKPRO CJ SEARCH:", error);
            grid.innerHTML = `
                <div style="
                    grid-column:1/-1;
                    padding:35px;
                    text-align:center;
                    background:#101010;
                    border:1px solid #D4AF37;
                    border-radius:12px;
                    color:#FFD700;
                ">
                    Erreur de connexion à l'API CJ : ${this.escapeHTML(error.message)}
                </div>
            `;
        }
    }

    // ========================================================
    // PROTECTION AFFICHAGE TEXTE
    // ========================================================

    escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&':'&amp;',
            '<':'&lt;',
            '>':'&gt;',
            '"':'&quot;',
            "'":'&#39;'
        })[char]);
    }

    // ========================================================
    // FORMATAGE PRIX SELON LA DEVISE CHOISIE
    // ========================================================

    formatPrice(value, currency) {
        const num = Number(value) || 0;
        switch(currency) {
            case 'USD':
                return '$' + num.toFixed(2);
            case 'EUR':
                return '€' + num.toFixed(2);
            case 'NGN':
                return '₦' + Math.round(num).toLocaleString('en-US');
            case 'FCFA':
            default:
                return Math.round(num).toLocaleString('fr-FR') + ' FCFA';
        }
    }

    // ========================================================
    // AFFICHAGE PRODUITS
    // ========================================================

    renderProducts(products) {
        const grid = document.getElementById('cj-products-grid');

        grid.innerHTML = products.map(p => `
            <div class="cj-card">
                <div class="cj-card-image">
                    <img
                        src="${this.escapeHTML(p.productImage)}"
                        alt="${this.escapeHTML(p.productName)}"
                        loading="lazy"
                        onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'"
                    >
                </div>
                <div class="cj-card-body">
                    <div class="cj-card-name" title="${this.escapeHTML(p.productName)}">
                        ${this.escapeHTML(p.productName)}
                    </div>
                    <div class="cj-card-price">
                        $${this.escapeHTML(p.sellPrice)}
                    </div>
                    <button
                        class="cj-btn-view"
                        data-cj-id="${this.escapeHTML(p.pid)}"
                    >
                        VOIR & IMPORTER
                    </button>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('[data-cj-id]').forEach(button => {
            button.addEventListener('click', () => {
                this.loadProductDetail(button.dataset.cjId);
            });
        });
    }

    // ========================================================
    // DÉTAILS PRODUIT (AVEC MULTI-LANGUES ET MULTI-DEVISES)
    // ========================================================

    loadProductDetail(pid) {
        const product = this.productsCache[pid];
        const modal = document.getElementById('cj-detail-modal');
        const content = document.getElementById('cj-modal-content');

        if (!product) {
            alert("Produit introuvable.");
            return;
        }

        this.selectedProduct = product;
        const basePriceUSD = Number(product.sellPrice);

        if (!Number.isFinite(basePriceUSD) || basePriceUSD <= 0) {
            alert("Prix fournisseur invalide.");
            return;
        }

        const configuredRate = Number(
            window.DAKPRO_CONFIG?.tauxUsdFcfa ||
            window.CJ_USD_FCFA ||
            655
        );

        modal.style.display = 'flex';

        content.innerHTML = `
            <button class="cj-close" id="cj-close-modal-inner">×</button>
            <h2 class="cj-modal-title">
                ${this.escapeHTML(product.productName)}
            </h2>

            <div class="cj-detail-grid">
                <div>
                    <img
                        class="cj-detail-image"
                        src="${this.escapeHTML(product.productImage)}"
                        alt="${this.escapeHTML(product.productName)}"
                        onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'"
                    />
                    <p style="color:#D4AF37;font-size:12px;margin-top:12px;">
                        FOURNISSEUR : CJ DROPSHIPPING
                    </p>
                    <p style="color:#aaa;font-size:12px;">
                        SKU : <strong style="color:white;">${this.escapeHTML(product.productSku)}</strong>
                    </p>
                    <p style="color:#aaa;font-size:13px;">
                        Prix fournisseur : <strong style="color:#FFD700;">$${basePriceUSD.toFixed(2)}</strong>
                    </p>
                </div>

                <div>
                    <div class="cj-section">
                        <h3 class="cj-section-title">⚙️ PARAMÈTRES DE PRIX & LOCALISATION</h3>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                            <div>
                                <label class="cj-label">LANGUE DE PUBLICATION</label>
                                id="cj-lang-select" class="cj-field">
                                    <option value="fr" selected>Français (FR)</option>
                                    <option value="en">English (EN)</option>
                                    <option value="es">Español (ES)</option>
                                    <option value="zh">中文 (ZH)</option>
                                </select>
                            </div>
                            <div>
                                <label class="cj-label">DEVISE DE PUBLICATION</label>
                                <select id="cj-currency-select" class="cj-field">
                                    <option value="FCFA" selected>Franc CFA (FCFA)</option>
                                    <option value="USD">Dollar Américain ($)</option>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="NGN">Naira Nigérian (₦)</option>
                                </select>
                            </div>
                        </div>

                        <label class="cj-label">TAUX DE CONVERSION USD / FCFA</label>
                        <input
                            type="number"
                            id="cj-usd-rate"
                            class="cj-field"
                            min="0.01"
                            step="0.01"
                            value="${configuredRate > 0 ? configuredRate : 655}"
                            placeholder="655"
                        >

                        <label class="cj-label">MARGE BÉNÉFICIAIRE PERSONNALISÉE (%) [Ex: 30 %, 40 %, 100 %]</label>
                        <input
                            type="number"
                            id="cj-margin-input"
                            class="cj-field"
                            value="30"
                            min="0"
                            max="1000"
                            step="0.01"
                        >
                    </div>

                    <div class="cj-section">
                        <h3 class="cj-section-title">💰 RÉPARTITION DES COMMISSIONS (Sur le Prix Final)</h3>
                        <div class="cj-commission-grid">
                            <div class="cj-commission-card">
                                <label>VENDEUR (%)</label>
                                <input type="number" id="cj-commission-vendeur" min="0" max="100" step="0.01" value="80">
                                <div class="cj-commission-amount" id="cj-montant-vendeur">0 FCFA</div>
                            </div>
                            <div class="cj-commission-card">
                                <label>AFFILIATION (%)</label>
                                <input type="number" id="cj-commission-affiliation" min="0" max="100" step="0.01" value="5">
                                <div class="cj-commission-amount" id="cj-montant-affiliation">0 FCFA</div>
                            </div>
                            <div class="cj-commission-card">
                                <label>PLATEFORME (%)</label>
                                <input type="number" id="cj-commission-plateforme" min="0" max="100" step="0.01" value="15">
                                <div class="cj-commission-amount" id="cj-montant-plateforme">0 FCFA</div>
                            </div>
                        </div>
                        <div class="cj-total-commission">
                            TOTAL DES COMMISSIONS : <span id="cj-total-commission">100</span> %
                        </div>
                        <div id="cj-commission-validation" class="cj-validation cj-valid">
                            ✓ Répartition valide : 100 %
                        </div>
                    </div>

                    <div class="cj-final-price">
                        PRIX DE VENTE FINAL (Avec Marge) :
                        <div id="cj-final-price-display" style="font-size:26px;margin-top:8px;">À calculer</div>
                    </div>

                    <div class="cj-section">
                        <h3 class="cj-section-title">📊 RÉCAPITULATIF AUTOMATIQUE</h3>
                        <div class="cj-calculation-line">
                            <span>Prix fournisseur converti</span>
                            <strong id="cj-purchase-price">—</strong>
                        </div>
                        <div class="cj-calculation-line">
                            <span>Marge bénéficiaire</span>
                            <strong id="cj-margin-amount">—</strong>
                        </div>
                        <div class="cj-calculation-line">
                            <span>Prix final de vente</span>
                            <strong id="cj-summary-price">—</strong>
                        </div>
                    </div>

                    <button id="cj-save-draft" class="cj-action cj-draft">📥 ENREGISTRER EN BROUILLON</button>
                    <button id="cj-publish-now" class="cj-action cj-publish">🚀 PUBLIER SUR DAKPRO ÉLITE</button>
                </div>
            </div>
        `;

        document.getElementById('cj-close-modal-inner').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        const update = () => this.updateCalculatedPrice(basePriceUSD);

        [
            'cj-margin-input',
            'cj-usd-rate',
            'cj-currency-select',
            'cj-commission-vendeur',
            'cj-commission-affiliation',
            'cj-commission-plateforme'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', update);
            if (el && el.tagName === 'SELECT') el.addEventListener('change', update);
        });

        document.getElementById('cj-save-draft').addEventListener('click', () => this.triggerImport(false));
        document.getElementById('cj-publish-now').addEventListener('click', () => this.triggerImport(true));

        update();
    }

    // ========================================================
    // VALIDATION DES COMMISSIONS
    // ========================================================

    validateCommissions() {
        const vendeur = Number(document.getElementById('cj-commission-vendeur')?.value);
        const affiliation = Number(document.getElementById('cj-commission-affiliation')?.value);
        const plateforme = Number(document.getElementById('cj-commission-plateforme')?.value);

        const values = [vendeur, affiliation, plateforme];
        if (values.some(v => !Number.isFinite(v) || v < 0 || v > 100)) {
            throw new Error("Chaque commission doit être comprise entre 0 et 100 %.");
        }

        const total = Math.round((vendeur + affiliation + plateforme) * 100) / 100;
        if (total !== 100) {
            throw new Error(`Les commissions doivent totaliser 100 %. Total actuel : ${total} %.`);
        }

        return { vendeur, affiliation, plateforme };
    }

    // ========================================================
    // CALCUL AUTOMATIQUE PRIX + COMMISSIONS & DEVISES
    // ========================================================

    updateCalculatedPrice(basePriceUSD) {
        const marginInput = document.getElementById('cj-margin-input');
        const rateInput = document.getElementById('cj-usd-rate');
        const currencySelect = document.getElementById('cj-currency-select');
        const display = document.getElementById('cj-final-price-display');

        if (!marginInput || !rateInput || !display) return;

        const margin = Number(marginInput.value);
        const rateUSDToFCFA = Number(rateInput.value);
        const currency = currencySelect ? currencySelect.value : 'FCFA';

        const vendeur = Number(document.getElementById('cj-commission-vendeur')?.value);
        const affiliation = Number(document.getElementById('cj-commission-affiliation')?.value);
        const plateforme = Number(document.getElementById('cj-commission-plateforme')?.value);

        const total = Math.round((vendeur + affiliation + plateforme) * 100) / 100;
        const totalElement = document.getElementById('cj-total-commission');
        const validation = document.getElementById('cj-commission-validation');

        if (totalElement) totalElement.innerText = Number.isFinite(total) ? total : 'Invalide';

        const commissionsValides = [vendeur, affiliation, plateforme].every(v => Number.isFinite(v) && v >= 0 && v <= 100) && total === 100;

        if (validation) {
            validation.className = commissionsValides ? 'cj-validation cj-valid' : 'cj-validation cj-invalid';
            validation.innerText = commissionsValides ? '✓ Répartition valide : 100 %' : '⚠️ Les commissions doivent totaliser exactement 100 %.';
        }

        const rateValide = Number.isFinite(rateUSDToFCFA) && rateUSDToFCFA > 0;
        const marginValide = Number.isFinite(margin) && margin >= 0 && margin <= 1000;

        if (!rateValide || !marginValide) {
            display.innerText = !rateValide ? 'Saisir le taux USD/FCFA' : 'Marge invalide';
            return;
        }

        // Base de calcul en FCFA
        const prixAchatFCFA = Math.round(basePriceUSD * rateUSDToFCFA);
        const montantMargeFCFA = Math.round(prixAchatFCFA * margin / 100);
        const prixFinalFCFA = prixAchatFCFA + montantMargeFCFA;

        // Facteur de conversion selon la devise choisie
        let conversionFactor = 1;
        if (currency === 'USD') conversionFactor = 1 / rateUSDToFCFA;
        else if (currency === 'EUR') conversionFactor = 0.001525; // Taux indicatif EUR/FCFA (~655)
        else if (currency === 'NGN') conversionFactor = 1.65; // Taux indicatif NGN/FCFA

        const prixAchatDisplay = prixAchatFCFA * conversionFactor;
        const montantMargeDisplay = montantMargeFCFA * conversionFactor;
        const prixFinalDisplay = prixFinalFCFA * conversionFactor;

        display.innerText = this.formatPrice(prixFinalDisplay, currency);
        document.getElementById('cj-purchase-price').innerText = this.formatPrice(prixAchatDisplay, currency);
        document.getElementById('cj-margin-amount').innerText = this.formatPrice(montantMargeDisplay, currency);
        document.getElementById('cj-summary-price').innerText = this.formatPrice(prixFinalDisplay, currency);

        document.getElementById('cj-montant-vendeur').innerText = this.formatPrice(prixFinalDisplay * vendeur / 100, currency);
        document.getElementById('cj-montant-affiliation').innerText = this.formatPrice(prixFinalDisplay * affiliation / 100, currency);
        document.getElementById('cj-montant-plateforme').innerText = this.formatPrice(prixFinalDisplay * plateforme / 100, currency);
    }

    // ========================================================
    // PUBLICATION FIREBASE
    // ========================================================

    async triggerImport(publishNow) {
        if (!this.selectedProduct) {
            alert("Aucun produit sélectionné.");
            return;
        }

        const button = document.getElementById(publishNow ? 'cj-publish-now' : 'cj-save-draft');
        const originalText = button?.innerText;

        try {
            if (button) {
                button.disabled = true;
                button.innerText = "IMPORTATION EN COURS...";
            }

            const product = this.selectedProduct;
            const margin = Number(document.getElementById('cj-margin-input')?.value);
            const rate = Number(document.getElementById('cj-usd-rate')?.value);
            const currency = document.getElementById('cj-currency-select')?.value || 'FCFA';
            const lang = document.getElementById('cj-lang-select')?.value || 'fr';

            if (!Number.isFinite(margin) || margin < 0 || margin > 1000) {
                throw new Error("La marge doit être comprise entre 0 et 1 000 %.");
            }

            if (!Number.isFinite(rate) || rate <= 0) {
                throw new Error("Configure un taux USD/FCFA valide.");
            }

            const commissions = this.validateCommissions();
            const basePriceUSD = Number(product.sellPrice);

            if (!Number.isFinite(basePriceUSD) || basePriceUSD <= 0) {
                throw new Error("Prix fournisseur CJ invalide.");
            }

            if (!product.productImage) {
                throw new Error("Image du produit introuvable.");
            }

            const auth = getAuth();
            const currentUser = window.currentUser || auth.currentUser;

            if (!currentUser) {
                throw new Error("Connecte-toi à ton compte administrateur.");
            }

            const vendeurId = currentUser.uid;
            const vendeurNom = currentUser.displayName || currentUser.nom || "DAKPRO ÉLITE";

            const prixAchatFCFA = Math.round(basePriceUSD * rate);
            const montantMargeFCFA = Math.round(prixAchatFCFA * margin / 100);
            const prixFinalFCFA = prixAchatFCFA + montantMargeFCFA;

            let conversionFactor = 1;
            if (currency === 'USD') conversionFactor = 1 / rate;
            else if (currency === 'EUR') conversionFactor = 0.001525;
            else if (currency === 'NGN') conversionFactor = 1.65;

            const prixFinalExport = Math.round(prixFinalFCFA * conversionFactor * 100) / 100;

            const publicationRef = push(ref(this.db, 'publications'));
            const prodId = publicationRef.key;

            if (!prodId) {
                throw new Error("Identifiant de publication impossible à générer.");
            }

            const now = new Date();
            const datePublication = now.toLocaleDateString('fr-FR', { timeZone: 'Africa/Porto-Novo' });
            const heurePublication = now.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Porto-Novo', hour: '2-digit', minute: '2-digit', hour12: false });
            const lienAffiliation = `${window.location.origin}/index.html?produit=${prodId}&ref=${vendeurId}`;

            const payload = {
                id: prodId,
                nom: product.productName,
                titre: product.productName,
                nom_en: product.productName,
                description: product.description || product.productName,
                description_en: product.description || product.productName,
                langue: lang,
                categorie: product.categoryName || "Importation CJ",
                sousCategorie: product.categoryName || "Importation CJ",
                prix: prixFinalExport,
                prixPromo: null,
                devise: currency,
                image: product.productImage,
                images: [product.productImage],
                video: "",
                document: "",
                catalogLink: "",
                vendeurId,
                vendeurNom,
                createdBy: vendeurId,
                commissions: {
                    vendeur: commissions.vendeur,
                    affiliation: commissions.affiliation,
                    plateforme: commissions.plateforme
                },
                lienAffiliation,
                actif: Boolean(publishNow),
                statut: publishNow ? "actif" : "brouillon",
                stock: Number(product.stock) || 500,
                fournisseur: "CJdropshipping",
                cjPid: product.pid,
                sku: product.productSku || "",
                typeImportation: "CJ_DROPSHIPPING",
                prixFournisseurUSD: basePriceUSD,
                comptabilité: {
                    prixAchat: Math.round(prixAchatFCFA * conversionFactor * 100) / 100,
                    prixVente: prixFinalExport,
                    montantMarge: Math.round(montantMargeFCFA * conversionFactor * 100) / 100,
                    devise: currency,
                    fournisseur: "CJdropshipping",
                    fournisseurPrixUSD: basePriceUSD,
                    tauxConversion: rate,
                    margePourcentage: margin
                },
                variantes: product.raw?.variants || product.variants || {},
                isFlash: false,
                isRecommande: false,
                createdAt: serverTimestamp(),
                datePublication,
                heurePublication
            };

            await set(publicationRef, payload);

            alert(publishNow ? "🚀 Produit publié avec succès sur DAKPRO ÉLITE !" : "📥 Produit enregistré dans les brouillons !");
            document.getElementById('cj-detail-modal').style.display = 'none';
            this.selectedProduct = null;

        } catch (error) {
            console.error("DAKPRO CJ IMPORT:", error);
            alert("Échec de l'importation : " + (error.message || "Erreur inconnue."));
        } finally {
            if (button) {
                button.disabled = false;
                button.innerText = originalText || "PUBLIER SUR DAKPRO ÉLITE";
            }
        }
    }
}


// ============================================================
// INITIALISATION
// ============================================================

export async function init() {
    window.dakproImporterInstance = new DakproCJImporter('module-container');
}
