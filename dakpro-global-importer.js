// ============================================================
// DAKPRO ÉLITE
// GLOBAL IMPORTER — VERSION DÉFINITIVE & ULTRA-STABILISÉE
//
// CJ DROPSHIPPING V2
// FIREBASE REALTIME DATABASE
// CLOUDINARY (AVEC SUIVI DE PROGRESSION)
//
// FICHIER : dakpro-global-importer.js
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


// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
    API: "https://cj.dakproelite.com/api/cj",
    FIREBASE_PATH: "publications",
    CLOUDINARY: {
        cloudName: "iufene3y",
        uploadPreset: "dakproelite_preset",
        folder: "dakproelite"
    },
    exchangeRate: 655,
    marginPercent: 30,
    commissions: {
        seller: 80,
        affiliate: 5,
        platform: 15
    },
    pageSize: 50,
    maxPageSize: 100,
    timeout: 30000
};


// ============================================================
// CLASSE PRINCIPALE
// ============================================================

class DakproCJImporter {

    constructor(containerId = "module-container") {
        this.container = document.getElementById(containerId);

        if (!this.container) {
            console.error("DAKPRO : conteneur introuvable.");
            return;
        }

        this.db = getDatabase();
        this.auth = getAuth();
        this.page = 1;
        this.totalPages = 1;
        this.totalRecords = 0;
        this.keyword = "";
        this.categoryId = "";
        this.categories = [];
        this.products = new Map();
        this.product = null;
        this.variants = [];
        this.inventory = null;
        this.loading = false;
        this.importing = false;

        this.render();
        this.events();
        this.loadCategories();
    }


    // ========================================================
    // INTERFACE (HARMONISÉE AVEC LE DESIGN ADMIN)
    // ========================================================

    render() {
        this.container.innerHTML = `
        <style>
        .dakcj {
            background:#0f0f13;
            color:white;
            padding:15px;
            border-radius:12px;
            border:1px solid #333;
            font-family:inherit;
        }
        .dakcj * { box-sizing:border-box; }
        .dakcj-header {
            display:flex;
            justify-content:space-between;
            align-items:center;
            flex-wrap:wrap;
            gap:10px;
            padding-bottom:12px;
            border-bottom:2px solid #D4AF37;
            margin-bottom:15px;
        }
        .dakcj-title {
            color:#FFD700;
            font-size:18px;
            font-weight:700;
            margin:0;
        }
        .dakcj-subtitle {
            color:#aaa;
            font-size:11px;
        }
        .dakcj-status {
            color:#FFD700;
            border:1px solid #D4AF37;
            padding:6px 10px;
            border-radius:6px;
            font-size:9px;
            font-weight:700;
            background:#1a1a1f;
        }
        .dakcj-search {
            display:grid;
            grid-template-columns:2fr 1fr auto;
            gap:8px;
            padding:12px;
            background:#16161c;
            border:1px solid #80651f;
            border-radius:8px;
            margin-bottom:12px;
        }
        .dakcj input, .dakcj select {
            width:100%;
            padding:10px;
            border-radius:6px;
            background:#0b0b0e;
            color:white;
            border:1px solid #444;
            font-family:inherit;
            font-size:12px;
        }
        .dakcj button {
            cursor:pointer;
            font-family:inherit;
            font-weight:700;
        }
        .dakcj button:disabled {
            opacity:.45;
            cursor:not-allowed;
        }
        .dakcj-btn {
            background:linear-gradient(135deg,#D4AF37,#FFD700);
            color:#050505;
            border:0;
            border-radius:6px;
            padding:10px 15px;
            font-size:12px;
        }
        .dakcj-info {
            color:#D4AF37;
            font-size:11px;
            margin:10px 0;
        }
        .dakcj-grid {
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:10px;
        }
        .dakcj-card {
            background:#16161c;
            border:1px solid #443a18;
            border-radius:8px;
            overflow:hidden;
            transition:.2s;
        }
        .dakcj-card:hover {
            border-color:#FFD700;
        }
        .dakcj-card img {
            width:100%;
            height:140px;
            object-fit:contain;
            background:#0b0b0e;
        }
        .dakcj-card-body {
            padding:10px;
        }
        .dakcj-name {
            font-size:11px;
            font-weight:600;
            min-height:34px;
            overflow:hidden;
            display:-webkit-box;
            -webkit-line-clamp:2;
            -webkit-box-orient:vertical;
        }
        .dakcj-price {
            color:#FFD700;
            font-weight:700;
            font-size:13px;
            margin:6px 0;
        }
        .dakcj-view {
            width:100%;
            padding:8px;
            background:#0759bd;
            color:white;
            border:0;
            border-radius:6px;
            font-size:11px;
        }
        .dakcj-pages {
            display:flex;
            justify-content:center;
            align-items:center;
            gap:12px;
            margin:20px 0;
        }
        .dakcj-pages button {
            background:#16161c;
            color:#FFD700;
            border:1px solid #D4AF37;
            padding:8px 12px;
            border-radius:6px;
            font-size:11px;
        }
        .dakcj-modal {
            display:none;
            position:fixed;
            inset:0;
            z-index:999999;
            background:rgba(0,0,0,0.85);
            align-items:center;
            justify-content:center;
            padding:10px;
        }
        .dakcj-modal-box {
            background:#121217;
            border:1px solid #D4AF37;
            border-radius:10px;
            width:100%;
            max-width:800px;
            max-height:90vh;
            overflow:auto;
            padding:15px;
        }
        .dakcj-close {
            float:right;
            background:#0b0b0e;
            border:1px solid #D4AF37;
            color:#FFD700;
            border-radius:50%;
            width:30px;
            height:30px;
            font-weight:bold;
        }
        .dakcj-detail {
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:15px;
            clear:both;
            padding-top:10px;
        }
        .dakcj-detail img {
            width:100%;
            max-height:280px;
            object-fit:contain;
            background:#0b0b0e;
            border:1px solid #443a18;
            border-radius:6px;
        }
        .dakcj-section {
            background:#0b0b0e;
            border:1px solid #443a18;
            border-radius:6px;
            padding:10px;
            margin-bottom:10px;
        }
        .dakcj-section h3 {
            color:#FFD700;
            font-size:11px;
            margin:0 0 5px 0;
        }
        .dakcj-label {
            display:block;
            color:#D4AF37;
            font-size:10px;
            margin:8px 0 4px;
        }
        .dakcj-result {
            color:#FFD700;
            font-size:20px;
            font-weight:800;
        }
        .dakcj-action {
            width:100%;
            padding:11px;
            border:0;
            border-radius:6px;
            margin-top:8px;
            font-size:12px;
        }
        .dakcj-publish {
            background:linear-gradient(135deg,#D4AF37,#FFD700);
            color:#050505;
        }
        .dakcj-draft {
            background:#16161c;
            border:1px solid #D4AF37;
            color:#FFD700;
        }
        .dakcj-message {
            grid-column:1/-1;
            text-align:center;
            padding:25px;
            color:#ffb3b3;
            border:1px dashed #ff4d4d;
            border-radius:8px;
            background:#2a0808;
            font-size:12px;
        }
        @media(min-width:700px) {
            .dakcj-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
        }
        @media(min-width:1100px) {
            .dakcj-grid { grid-template-columns:repeat(4,minmax(0,1fr)); }
        }
        @media(max-width:650px) {
            .dakcj-search { grid-template-columns:1fr; }
            .dakcj-detail { grid-template-columns:1fr; }
        }
        </style>

        <section class="dakcj">
            <header class="dakcj-header">
                <div>
                    <h2 class="dakcj-title">DAKPRO ÉLITE <span style="color:#087bff">GLOBAL IMPORTER</span></h2>
                    <div class="dakcj-subtitle">Catalogue international CJ Dropshipping</div>
                </div>
                <span class="dakcj-status" id="dakcj-status">● INITIALISATION</span>
            </header>

            <div class="dakcj-search">
                <input id="dakcj-keyword" type="search" placeholder="Rechercher un produit CJ...">
                <input id="dakcj-category" list="dakcj-categories" placeholder="Catégorie CJ">
                <datalist id="dakcj-categories"></datalist>
                <button class="dakcj-btn" id="dakcj-search-btn">RECHERCHER</button>
            </div>

            <div class="dakcj-info" id="dakcj-info">Prêt pour la recherche de produits.</div>

            <div class="dakcj-grid" id="dakcj-grid">
                <div class="dakcj-message" style="color:#aaa;border-color:#D4AF37;background:#16161c">
                    DAKPRO ÉLITE — GLOBAL IMPORTER<br><br>Saisissez un mot-clé ci-dessus pour interroger CJ Dropshipping.
                </div>
            </div>

            <div class="dakcj-pages">
                <button id="dakcj-prev" disabled>← Précédent</button>
                <span id="dakcj-page" style="font-size:11px;">Page 1 / 1</span>
                <button id="dakcj-next" disabled>Suivant →</button>
            </div>

            <div class="dakcj-modal" id="dakcj-modal">
                <div class="dakcj-modal-box">
                    <button class="dakcj-close" id="dakcj-close">×</button>
                    <div id="dakcj-detail-content"></div>
                </div>
            </div>
        </section>
        `;
    }


    // ========================================================
    // COMMUNICATION AVEC LE SERVEUR CJ
    // ========================================================

    async api(action, params = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CONFIG.timeout);

        try {
            const url = new URL(CONFIG.API);
            url.searchParams.set("action", action);

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    url.searchParams.set(
                        key,
                        typeof value === "object" ? JSON.stringify(value) : String(value)
                    );
                }
            });

            const response = await fetch(url.toString(), {
                method: "GET",
                mode: "cors",
                headers: { "Accept": "application/json" },
                signal: controller.signal
            });

            const text = await response.text();
            let result;

            try {
                result = JSON.parse(text);
            } catch {
                throw new Error("Réponse JSON invalide du serveur CJ.");
            }

            if (!response.ok || result.success === false) {
                let message = result.message || result.error || `Erreur HTTP ${response.status}`;
                if (typeof message === "object") message = JSON.stringify(message);
                throw new Error(message);
            }

            return result;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("Le serveur CJ met trop de temps à répondre.");
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }


    // ========================================================
    // EXTRACTION DES DONNÉES & PARSING ROBUSTE
    // ========================================================

    getData(response) {
        return response?.data ?? response?.resultData ?? response?.result ?? response;
    }

    getProductList(response) {
        const data = this.getData(response);
        if (!data) return [];
        if (Array.isArray(data.productList)) return data.productList;
        if (Array.isArray(data.content)) {
            const products = data.content.flatMap(item => Array.isArray(item?.productList) ? item.productList : []);
            if (products.length) return products;
        }
        if (Array.isArray(data.list)) return data.list;
        if (Array.isArray(data.items)) return data.items;
        return [];
    }

    getList(response) {
        const data = this.getData(response);
        if (Array.isArray(data)) return data;
        return [data?.list, data?.variants, data?.items, data?.content, data?.tree].find(Array.isArray) || [];
    }

    getObject(response) {
        let data = this.getData(response);
        if (Array.isArray(data)) data = data[0] || {};
        if (data?.list && Array.isArray(data.list)) data = data.list[0] || {};
        return data && typeof data === "object" ? data : {};
    }

    extractPrice(item) {
        if (!item) return null;
        const raw = [
            item.sellPrice,
            item.nowPrice,
            item.discountPrice,
            item.productPrice,
            item.price,
            item.supplierPrice,
            item.variantSellPrice,
            item.variantPrice
        ];
        for (const val of raw) {
            const num = this.number(val);
            if (num !== null && num > 0) return num;
        }
        return null;
    }


    // ========================================================
    // ÉVÉNEMENTS
    // ========================================================

    events() {
        const $ = selector => this.container.querySelector(selector);

        const executeSearch = () => {
            this.keyword = $("#dakcj-keyword").value.trim();
            this.categoryId = this.getCategoryId($("#dakcj-category").value.trim());
            this.page = 1;
            this.search();
        };

        $("#dakcj-search-btn").addEventListener("click", executeSearch);

        $("#dakcj-keyword").addEventListener("keydown", event => {
            if (event.key === "Enter") executeSearch();
        });

        $("#dakcj-prev").addEventListener("click", () => {
            if (this.page > 1 && !this.loading) {
                this.page--;
                this.search();
            }
        });

        $("#dakcj-next").addEventListener("click", () => {
            if (this.page < this.totalPages && !this.loading) {
                this.page++;
                this.search();
            }
        });

        $("#dakcj-close").addEventListener("click", () => this.close());

        $("#dakcj-modal").addEventListener("click", event => {
            if (event.target.id === "dakcj-modal") this.close();
        });
    }


    // ========================================================
    // CATÉGORIES CJ
    // ========================================================

    async loadCategories() {
        try {
            const response = await this.api("categories");
            const categories = this.getList(response);
            const flattened = [];

            const visit = (list, parent = "") => {
                list.forEach(item => {
                    if (!item || typeof item !== "object") return;
                    const id = item.categoryId || item.categoryFirstId || item.categorySecondId || item.id;
                    const name = item.categoryName || item.categoryFirstName || item.categorySecondName || item.name;

                    if (id && name) {
                        flattened.push({ id: String(id), name: String(name), parent });
                    }

                    const children = item.categoryFirstList || item.categorySecondList || item.children || item.list;
                    if (Array.isArray(children)) visit(children, name || parent);
                });
            };

            visit(categories);
            this.categories = flattened;

            const unique = [...new Map(flattened.map(item => [item.id, item])).values()];
            const element = this.container.querySelector("#dakcj-categories");

            element.innerHTML = unique.map(item => `
                <option value="${this.escape(item.name)}" data-id="${this.escape(item.id)}"></option>
            `).join("");

            this.status("● CONNECTEUR CJ PRÊT");
        } catch (error) {
            console.warn("CJ catégories :", error.message);
            this.status("● ERREUR CATÉGORIES");
        }
    }

    getCategoryId(value) {
        const category = this.categories.find(
            item => item.name.toLowerCase() === value.toLowerCase() || item.id === value
        );
        return category ? category.id : value;
    }


    // ========================================================
    // RECHERCHE DU CATALOGUE (RENFORCÉ 1 : VALIDITÉ DES PRODUITS)
    // ========================================================

    async search() {
        if (this.loading) return;
        this.loading = true;

        const grid = this.container.querySelector("#dakcj-grid");
        const info = this.container.querySelector("#dakcj-info");

        grid.innerHTML = `
            <div class="dakcj-message" style="color:#FFD700;border-color:#D4AF37;background:#16161c">
                Recherche du catalogue CJ en cours...
            </div>
        `;
        this.status("● RECHERCHE EN COURS");

        try {
            const response = await this.api("products", {
                keyWord: this.keyword,
                categoryId: this.categoryId,
                page: this.page,
                size: Math.min(CONFIG.pageSize, CONFIG.maxPageSize),
                features: ["enable_description", "enable_category"]
            });

            const data = this.getData(response);
            const list = this.getProductList(response);

            this.totalRecords = Number(data?.totalRecords ?? data?.total ?? 0);
            this.totalPages = Math.min(
                Number(data?.totalPages ?? Math.ceil(this.totalRecords / CONFIG.pageSize) ?? 1) || 1,
                1000
            );

            if (!list.length) {
                grid.innerHTML = `
                    <div class="dakcj-message">
                        Aucun produit trouvé.<br><br>Essayez un autre mot-clé.
                    </div>
                `;
                info.textContent = "Aucun résultat.";
                return;
            }

            this.products.clear();

            const products = list.map(item => {
                const pid = String(item.id || item.pid || item.productId || "");
                const name = item.nameEn || item.productNameEn || item.productName || item.name || "";
                if (!pid || !name) return null; // Renforcement : ignore les éléments corrompus

                const images = this.images(item.productImageSet || item.images, item.bigImage || item.productImage);

                const product = {
                    pid,
                    name,
                    image: item.bigImage || item.productImage || images[0] || "",
                    images,
                    sku: item.sku || item.productSku || "",
                    price: this.extractPrice(item),
                    stock: this.stock({ stock: item.warehouseInventoryNum, inventory: item.totalVerifiedInventory, quantity: item.totalInventory }),
                    categoryId: item.categoryId || "",
                    categoryName: item.threeCategoryName || item.categoryName || "",
                    description: item.description || item.productDescription || "",
                    raw: item
                };

                this.products.set(pid, product);
                return product;
            }).filter(Boolean);

            if (!products.length) {
                grid.innerHTML = `<div class="dakcj-message">Aucun produit valide exploitable dans cette page.</div>`;
                return;
            }

            this.renderProducts(products);

            info.textContent = `${this.totalRecords.toLocaleString("fr-FR")} produits disponibles — Page ${this.page} / ${this.totalPages}`;
            this.status("● CATALOGUE CJ CONNECTÉ");

        } catch (error) {
            console.error(error);
            grid.innerHTML = `
                <div class="dakcj-message">
                    ERREUR API CJ<br><br>${this.escape(error.message)}
                </div>
            `;
            info.textContent = "Recherche impossible.";
            this.status("● ERREUR API");
        } finally {
            this.loading = false;
            this.pagination();
        }
    }


    // ========================================================
    // AFFICHAGE DU CATALOGUE
    // ========================================================

    renderProducts(products) {
        const grid = this.container.querySelector("#dakcj-grid");

        if (!products.length) {
            grid.innerHTML = `<div class="dakcj-message">Aucun produit valide.</div>`;
            return;
        }

        grid.innerHTML = products.map(product => `
            <article class="dakcj-card">
                ${product.image
                    ? `<img src="${this.escape(product.image)}" alt="${this.escape(product.name)}" loading="lazy" referrerpolicy="no-referrer">`
                    : `<div style="height:140px;text-align:center;padding:50px 5px;color:#888;font-size:11px;">Image indisponible</div>`
                }
                <div class="dakcj-card-body">
                    <div class="dakcj-name">${this.escape(product.name)}</div>
                    <div class="dakcj-price">${product.price !== null ? "$" + product.price.toFixed(2) : "Prix indisponible"}</div>
                    <button class="dakcj-view" data-pid="${this.escape(product.pid)}">VOIR LE PRODUIT</button>
                </div>
            </article>
        `).join("");

        grid.querySelectorAll("[data-pid]").forEach(button => {
            button.addEventListener("click", () => this.openProduct(button.dataset.pid));
        });
    }


    // ========================================================
    // DÉTAILS PRODUIT ET VARIANTES (AVEC GRAND APERÇU IMMÉDIAT)
    // ========================================================

    async openProduct(pid) {
        const product = this.products.get(String(pid));
        if (!product) return;

        this.product = product;
        const modal = this.container.querySelector("#dakcj-modal");
        const content = this.container.querySelector("#dakcj-detail-content");

        modal.style.display = "flex";
        
        // Grand aperçu instantané avec l'image cliquée et le prix
        content.innerHTML = `
            <h2 style="color:#FFD700;font-size:16px;margin-top:0;">${this.escape(product.name)}</h2>
            <div class="dakcj-detail">
                <div>
                    ${product.image ? `<img src="${this.escape(product.image)}" alt="${this.escape(product.name)}" referrerpolicy="no-referrer">` : ""}
                    <p style="color:#aaa;font-size:10px;margin:8px 0 4px;">FOURNISSEUR : CJ DROPSHIPPING</p>
                    <p style="color:#FFD700;font-size:13px;margin:0 0 8px;">Prix fournisseur : ${product.price !== null ? "$" + product.price : "Indisponible"}</p>
                    <p style="font-size:10px;color:#aaa;margin:0 0 10px;">SKU : ${this.escape(product.sku)}</p>
                    <p style="color:#D4AF37;font-size:11px;margin:10px 0;">Chargement des détails et variantes depuis CJ...</p>
                </div>
            </div>
        `;

        try {
            const results = await Promise.allSettled([
                this.api("detail", { pid: product.pid }),
                this.api("variants", { pid: product.pid })
            ]);

            if (results[0].status === "fulfilled") {
                const details = this.getObject(results[0].value);
                product.name = details.productNameEn || details.nameEn || details.productName || product.name;
                product.description = details.description || details.productDescription || product.description;
                product.sku = details.productSku || details.sku || product.sku;
                product.image = details.productImage || details.bigImage || product.image;
                product.images = this.images(details.productImageSet || details.images, product.image);
                
                const detailPrice = this.extractPrice(details);
                if (detailPrice !== null) {
                    product.price = detailPrice;
                }
            }

            this.variants = results[1].status === "fulfilled" ? this.getList(results[1].value) : [];
            this.inventory = null;
            this.renderDetail();

        } catch (error) {
            console.warn("Détails CJ partiels :", error.message);
            this.renderDetail();
        }
    }


    // ========================================================
    // INTERFACE DES DÉTAILS COMPLÈTE (RENFORCÉ 2 : ÉCOUTEURS DYNAMIQUES)
    // ========================================================

    renderDetail() {
        const content = this.container.querySelector("#dakcj-detail-content");
        if (!content) return;

        const variants = this.variants.map((item, index) => `
            <option value="${index}">
                ${this.escape(item.variantNameEn || item.variantName || item.name || item.variantSku || "Variante " + (index + 1))}
            </option>
        `).join("");

        const cleanDesc = this.cleanHtmlDescription(this.product.description);

        content.innerHTML = `
            <h2 style="color:#FFD700;font-size:16px;margin-top:0;">${this.escape(this.product.name)}</h2>
            <div class="dakcj-detail">
                <div>
                    ${this.product.image ? `<img src="${this.escape(this.product.image)}" alt="${this.escape(this.product.name)}" referrerpolicy="no-referrer">` : ""}
                    <p style="color:#aaa;font-size:10px;margin:8px 0 4px;">FOURNISSEUR : CJ DROPSHIPPING</p>
                    <p style="color:#FFD700;font-size:13px;margin:0 0 8px;">Prix fournisseur : ${this.product.price !== null ? "$" + this.product.price : "Indisponible"}</p>
                    <p style="font-size:10px;color:#aaa;margin:0 0 10px;">SKU : ${this.escape(this.product.sku)}</p>

                    <label class="dakcj-label">VARIANTES (${this.variants.length})</label>
                    <select id="dakcj-variant">
                        <option value="">Produit standard</option>
                        ${variants}
                    </select>

                    <div class="dakcj-section" style="margin-top:10px;">
                        <h3>DESCRIPTION ORIGINALE CJ</h3>
                        <div style="font-size:11px;color:#ccc;max-height:160px;overflow-y:auto;margin:0;line-height:1.5;white-space:pre-line;">${this.escape(cleanDesc)}</div>
                    </div>
                </div>

                <div>
                    <div class="dakcj-section">
                        <h3>PARAMÈTRES COMMERCIAUX</h3>
                        <label class="dakcj-label">TAUX USD / FCFA</label>
                        <input id="dakcj-rate" type="number" min="1" value="${CONFIG.exchangeRate}">
                        <label class="dakcj-label">MARGE COMMERCIALE (%)</label>
                        <input id="dakcj-margin" type="number" min="0" max="1000" value="${CONFIG.marginPercent}">
                    </div>

                    <div class="dakcj-section">
                        <h3>PRIX PUBLIC</h3>
                        <div class="dakcj-result" id="dakcj-price">Calcul...</div>
                        <div id="dakcj-cost" style="font-size:10px;color:#aaa;margin-top:8px"></div>
                    </div>

                    <button id="dakcj-draft" class="dakcj-action dakcj-draft">ENREGISTRER EN BROUILLON</button>
                    <button id="dakcj-publish" class="dakcj-action dakcj-publish">PUBLIER SUR DAKPRO ÉLITE</button>
                </div>
            </div>
        `;

        const rateInput = content.querySelector("#dakcj-rate");
        const marginInput = content.querySelector("#dakcj-margin");
        const variantSelect = content.querySelector("#dakcj-variant");
        const draftBtn = content.querySelector("#dakcj-draft");
        const publishBtn = content.querySelector("#dakcj-publish");

        if (rateInput) rateInput.addEventListener("input", () => this.previewPrice());
        if (marginInput) marginInput.addEventListener("input", () => this.previewPrice());
        
        // Renforcement dynamique sur le changement de variante
        if (variantSelect) {
            variantSelect.addEventListener("change", () => {
                this.previewPrice();
            });
        }

        if (draftBtn) draftBtn.addEventListener("click", () => this.publish(false));
        if (publishBtn) publishBtn.addEventListener("click", () => this.publish(true));

        this.previewPrice();
    }


    // ========================================================
    // CALCUL & APERÇU DES PRIX (ROBUSTE)
    // ========================================================

    calculatePrice() {
        const rateEl = this.container.querySelector("#dakcj-rate");
        const marginEl = this.container.querySelector("#dakcj-margin");
        const variantEl = this.container.querySelector("#dakcj-variant");

        const rate = Number(rateEl ? rateEl.value : CONFIG.exchangeRate);
        const margin = Number(marginEl ? marginEl.value : CONFIG.marginPercent);
        const variantIndex = variantEl ? variantEl.value : "";
        const selectedVariant = variantIndex !== "" ? this.variants[Number(variantIndex)] : null;

        const supplierPrice = this.number(
            selectedVariant?.variantSellPrice ?? 
            selectedVariant?.sellPrice ?? 
            selectedVariant?.variantPrice ?? 
            selectedVariant?.price ?? 
            this.product?.price
        );

        if (!Number.isFinite(rate) || rate <= 0) throw new Error("Taux de conversion invalide.");
        if (!Number.isFinite(margin) || margin < 0 || margin > 1000) throw new Error("Marge commerciale invalide.");
        if (supplierPrice === null || supplierPrice <= 0) throw new Error("Prix fournisseur CJ indisponible.");

        const supplierCost = supplierPrice * rate;
        const marginFCFA = supplierCost * margin / 100;
        const finalPrice = supplierCost + marginFCFA;

        return {
            supplierPrice,
            supplierCost: Math.round(supplierCost),
            marginFCFA: Math.round(marginFCFA),
            finalPrice: Math.round(finalPrice),
            rate,
            margin,
            selectedVariant,
            commissions: {
                seller: Math.round(marginFCFA * CONFIG.commissions.seller / 100),
                affiliate: Math.round(marginFCFA * CONFIG.commissions.affiliate / 100),
                platform: Math.round(marginFCFA * CONFIG.commissions.platform / 100)
            }
        };
    }

    previewPrice() {
        try {
            const result = this.calculatePrice();
            const priceEl = this.container.querySelector("#dakcj-price");
            const costEl = this.container.querySelector("#dakcj-cost");

            if (priceEl) priceEl.textContent = this.fcfa(result.finalPrice);
            if (costEl) {
                costEl.innerHTML = `
                    Coût fournisseur : <strong>${this.fcfa(result.supplierCost)}</strong><br>
                    Marge commerciale : <strong>${this.fcfa(result.marginFCFA)}</strong><br><br>
                    Vendeur 80 % : <strong>${this.fcfa(result.commissions.seller)}</strong><br>
                    Affiliation 5 % : <strong>${this.fcfa(result.commissions.affiliate)}</strong><br>
                    DAKPRO 15 % : <strong>${this.fcfa(result.commissions.platform)}</strong>
                `;
            }
        } catch (error) {
            const priceEl = this.container.querySelector("#dakcj-price");
            const costEl = this.container.querySelector("#dakcj-cost");
            if (priceEl) priceEl.textContent = "Calcul indisponible";
            if (costEl) costEl.textContent = error.message;
        }
    }


    // ========================================================
    // CLOUDINARY (AVEC SUIVI DE PROGRESSION XHR)
    // ========================================================

    async uploadRemoteToCloudinary(remoteUrl) {
        if (!remoteUrl) return "";
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", remoteUrl);
            formData.append("upload_preset", CONFIG.CLOUDINARY.uploadPreset);
            formData.append("folder", CONFIG.CLOUDINARY.folder);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY.cloudName}/auto/upload`, true);

            xhr.onload = function() {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
                        resolve(data.secure_url);
                    } else {
                        reject(new Error(data.error?.message || "Échec du téléversement Cloudinary."));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            xhr.onerror = function() {
                reject(new Error("Erreur de connexion à Cloudinary."));
            };

            xhr.send(formData);
        });
    }

    async transferProductMedia() {
        const sourceImages = [...new Set([this.product.image, ...(this.product.images || [])].filter(Boolean))];
        const cloudImages = [];

        for (const imageUrl of sourceImages) {
            try {
                const cloudUrl = await this.uploadRemoteToCloudinary(imageUrl);
                cloudImages.push(cloudUrl);
            } catch (error) {
                console.warn("Image conservée depuis CJ :", error.message);
                cloudImages.push(imageUrl);
            }
        }
        return { image: cloudImages[0] || "", images: cloudImages };
    }


    // ========================================================
    // PUBLICATION FIREBASE (DOUBLE ENREGISTREMENT SÉCURISÉ)
    // ========================================================

    async publish(publishNow) {
        if (this.importing) return;
        const currentUser = window.currentUser || this.auth.currentUser;

        if (!currentUser) {
            alert("Connectez-vous avant d'importer un produit.");
            return;
        }

        this.importing = true;
        const draftButton = this.container.querySelector("#dakcj-draft");
        const publishButton = this.container.querySelector("#dakcj-publish");

        [draftButton, publishButton].forEach(btn => {
            if (btn) { btn.disabled = true; btn.textContent = "IMPORTATION EN COURS..."; }
        });

        try {
            const calculation = this.calculatePrice();
            const media = await this.transferProductMedia();
            const selectedVariant = calculation.selectedVariant;

            const publicationRef = push(ref(this.db, CONFIG.FIREBASE_PATH));
            const productId = publicationRef.key;

            if (!productId) throw new Error("Impossible de créer l'identifiant du produit.");

            const affiliateLink = new URL(
                window.DAKPRO_CONFIG?.productPageUrl || "index.html",
                window.location.origin
            );
            affiliateLink.searchParams.set("produit", productId);
            affiliateLink.searchParams.set("ref", currentUser.uid);

            const payload = {
                id: productId,
                nom: this.product.name,
                titre: this.product.name,
                fournisseur: "CJdropshipping",
                cjPid: String(this.product.pid),
                sku: selectedVariant?.variantSku || selectedVariant?.sku || this.product.sku || "",
                prixFournisseurUSD: calculation.supplierPrice,
                prixFournisseurFCFA: calculation.supplierCost,
                tauxConversion: calculation.rate,
                prix: calculation.finalPrice,
                prixPublic: calculation.finalPrice,
                devise: "FCFA",
                margeBeneficiaire: calculation.margin,
                montantMarge: calculation.marginFCFA,
                commissions: {
                    baseCalcul: "MARGE_COMMERCIALE",
                    vendeur: { taux: 80, montant: calculation.commissions.seller, statut: "en_attente" },
                    affiliation: { taux: 5, montant: calculation.commissions.affiliate, statut: "non_attribue", affilieId: null },
                    plateforme: { taux: 15, montant: calculation.commissions.platform }
                },
                image: media.image,
                images: media.images,
                imageSourceCJ: this.product.image,
                variantes: this.variants.map(v => ({
                    vid: String(v.vid || v.variantId || ""),
                    sku: v.variantSku || v.sku || "",
                    nom: v.variantNameEn || v.variantName || v.name || "",
                    image: v.variantImage || v.image || "",
                    prix: this.number(v.variantSellPrice ?? v.sellPrice ?? v.variantPrice),
                    poids: v.variantWeight ?? null,
                    longueur: v.variantLength ?? null,
                    largeur: v.variantWidth ?? null,
                    hauteur: v.variantHeight ?? null
                })),
                varianteSelectionnee: selectedVariant ? {
                    vid: String(selectedVariant.vid || selectedVariant.variantId || ""),
                    sku: selectedVariant.variantSku || selectedVariant.sku || "",
                    nom: selectedVariant.variantNameEn || selectedVariant.variantName || selectedVariant.name || ""
                } : null,
                vendeurId: currentUser.uid,
                vendeurNom: currentUser.displayName || currentUser.nom || "DAKPRO ÉLITE",
                createdBy: currentUser.uid,
                lienAffiliation: affiliateLink.toString(),
                affiliateLink: affiliateLink.toString(),
                stock: this.product.stock ?? null,
                categorie: this.product.categoryName || "",
                description: this.cleanHtmlDescription(this.product.description),
                actif: Boolean(publishNow),
                statut: publishNow ? "actif" : "brouillon",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await set(ref(this.db, `publications/${productId}`), payload);
            await set(ref(this.db, `produits/${productId}`), payload).catch(() => {});

            this.showSuccess(productId, affiliateLink.toString(), publishNow);

        } catch (error) {
            console.error("DAKPRO IMPORT ERROR:", error);
            alert("Erreur d'importation : " + error.message);

            [draftButton, publishButton].forEach((btn, index) => {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = index === 0 ? "ENREGISTRER EN BROUILLON" : "PUBLIER SUR DAKPRO ÉLITE";
                }
            });
        } finally {
            this.importing = false;
        }
    }


    // ========================================================
    // CONFIRMATION DE SUCCÈS
    // ========================================================

    showSuccess(productId, link, published) {
        const content = this.container.querySelector("#dakcj-detail-content");

        content.innerHTML = `
            <div style="text-align:center;padding:15px 5px">
                <div style="font-size:35px">${published ? "🚀" : "📥"}</div>
                <h2 style="color:#FFD700;font-size:15px;">${published ? "PRODUIT PUBLIÉ" : "BROUILLON ENREGISTRÉ"}</h2>
                <div class="dakcj-section" style="text-align:left">
                    <p style="color:#D4AF37;font-size:10px;margin:0 0 3px;">IDENTIFIANT DU PRODUIT</p>
                    <strong style="word-break:break-all;font-size:11px;">${this.escape(productId)}</strong>
                    <p style="color:#D4AF37;font-size:10px;margin:10px 0 3px;">LIEN DU PRODUIT</p>
                    <p style="font-size:10px;word-break:break-all;margin:0;">${this.escape(link)}</p>
                    <button id="dakcj-copy" class="dakcj-action dakcj-publish" style="margin-top:10px;">COPIER LE LIEN</button>
                </div>
                <button id="dakcj-finish" class="dakcj-action dakcj-draft">TERMINER</button>
            </div>
        `;

        content.querySelector("#dakcj-copy").addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(link);
                alert("Lien copié avec succès.");
            } catch {
                alert("Copie impossible sur cet appareil.");
            }
        });

        content.querySelector("#dakcj-finish").addEventListener("click", () => this.close());
    }


    // ========================================================
    // UTILITAIRES DE NETTOYAGE & SÉCURITÉ
    // ========================================================

    cleanHtmlDescription(html) {
        if (!html) return "Aucune description disponible.";
        return String(html)
            .replace(/<img[^>]*>/gi, "")
            .replace(/<\/p>/gi, "\n")
            .replace(/<\/div>/gi, "\n")
            .replace(/<br\s*[\/]?>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n\s*\n/g, "\n")
            .trim();
    }

    images(value, mainImage) {
        let list = [];
        if (typeof value === "string") {
            try { 
                const parsed = JSON.parse(value);
                value = Array.isArray(parsed) ? parsed : [value];
            } catch { 
                value = value.includes(",") ? value.split(",").map(s => s.trim()) : [value];
            }
        }
        if (Array.isArray(value)) {
            list = value.map(item => typeof item === "string" ? item : item?.url || item?.image || item?.imageUrl || item?.bigImage || "").filter(Boolean);
        }
        if (mainImage) list.unshift(mainImage);
        return [...new Set(list)].map(img => img.startsWith("//") ? "https:" + img : img);
    }

    number(value) {
        if (value === null || value === undefined || value === "") return null;
        if (typeof value === "object") {
            value = value.sellPrice || value.productPrice || value.price || value.supplierPrice || value.variantSellPrice || value.variantPrice || 0;
        }
        const result = Number(String(value).replace(",", ".").replace(/[^\d.]/g, ""));
        return Number.isFinite(result) && result > 0 ? result : null;
    }

    stock(product) {
        for (const value of [product?.stock, product?.inventory, product?.quantity, product?.totalInventory]) {
            if (value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))) {
                return Number(value);
            }
        }
        return null;
    }

    fcfa(value) {
        return Math.round(Number(value) || 0).toLocaleString("fr-FR") + " FCFA";
    }

    escape(value) {
        return String(value ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[c]);
    }

    status(message) {
        const element = this.container.querySelector("#dakcj-status");
        if (element) element.textContent = message;
    }

    pagination() {
        const prev = this.container.querySelector("#dakcj-prev");
        const next = this.container.querySelector("#dakcj-next");
        const page = this.container.querySelector("#dakcj-page");

        if (page) page.textContent = `Page ${this.page} / ${this.totalPages}`;
        if (prev) prev.disabled = (this.loading || this.page <= 1);
        if (next) next.disabled = (this.loading || this.page >= this.totalPages);
    }

    close() {
        const modal = this.container.querySelector("#dakcj-modal");
        if (modal) modal.style.display = "none";
        this.product = null;
        this.variants = [];
        this.inventory = null;
    }
}


// ========================================================
// INITIALISATION EXPORTÉE POUR LE ROUTEUR ADMIN
// ========================================================

export function init() {
    const container = document.getElementById("module-container");
    if (!container) {
        setTimeout(() => init(), 100);
        return null;
    }

    if (window.dakproImporterInstance) {
        window.dakproImporterInstance.container = container;
        window.dakproImporterInstance.render();
        window.dakproImporterInstance.events();
        return window.dakproImporterInstance;
    }

    window.dakproImporterInstance = new DakproCJImporter("module-container");
    return window.dakproImporterInstance;
}

try {
    init();
} catch (e) {
    console.warn("DAKPRO Auto-init différé :", e);
}
