// ============================================================
// DAKPRO ÉLITE — GLOBAL CJ IMPORTER PRO
// VERSION 4.0 — CONNECTED API V2
//
// CJ DROPSHIPPING API V2
// FIREBASE REALTIME DATABASE
//
// API CONNECTEES :
// /api/search
// /api/categories
// /api/product-details
// /api/product-variants
// /api/product-inventory
// /api/product-pricing
//
// COMMISSIONS SUR LA MARGE :
// VENDEUR 80 % / AFFILIATION 5 % / DAKPRO 15 %
//
// INTERFACE : NOIR / OR METALLIQUE / BLEU BRILLANT
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

    constructor(containerId = "module-container") {

        this.container = document.getElementById(containerId);

        // Firebase déjà initialisé par l'application.
        this.db = getDatabase();
        this.auth = getAuth();

        this.currentPage = 1;
        this.totalPages = 1;
        this.totalRecords = 0;

        this.pageSize = 50;

        this.currentKeyword = "";
        this.currentCategoryId = "";

        this.productsCache = {};
        this.selectedProduct = null;

        this.currentVariants = [];
        this.currentInventory = null;

        this.loading = false;
        this.importing = false;

        this.init();
    }


    // ========================================================
    // INITIALISATION
    // ========================================================

    init() {

        if (!this.container) {
            console.error(
                "DAKPRO CJ : module-container introuvable."
            );
            return;
        }

        this.renderLayout();
        this.attachEvents();

        this.loadCategories();

    }


    // ========================================================
    // INTERFACE
    // ========================================================

    renderLayout() {

        this.container.innerHTML = `

        <style>

        @import url(
            'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap'
        );

        .dakpro-cj {
            font-family:Poppins,sans-serif;
            background:#050505;
            color:white;
            min-height:100vh;
            padding:20px;
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
            border-bottom:2px solid #D4AF37;
            padding-bottom:20px;
            margin-bottom:25px;
        }

        .cj-title {
            color:#FFD700;
            font-size:24px;
            font-weight:800;
            margin:0;
        }

        .cj-subtitle {
            color:#aaa;
            font-size:12px;
            margin-top:6px;
        }

        .cj-status {
            background:#171717;
            color:#FFD700;
            border:1px solid #D4AF37;
            padding:9px 14px;
            border-radius:8px;
            font-size:11px;
            font-weight:800;
        }

        .cj-search-box {
            display:grid;
            grid-template-columns:2fr 1fr auto;
            gap:10px;
            padding:15px;
            background:#101010;
            border:1px solid #80651f;
            border-radius:12px;
            margin-bottom:20px;
        }

        .cj-input {
            width:100%;
            min-width:0;
            padding:13px;
            background:#080808;
            color:white;
            border:1px solid #555;
            border-radius:8px;
            outline:none;
            font-family:inherit;
        }

        .cj-input:focus,
        .cj-field:focus {
            border-color:#FFD700;
        }

        .cj-button {
            border:none;
            border-radius:8px;
            padding:12px 18px;
            font-weight:800;
            cursor:pointer;
            font-family:inherit;
        }

        .cj-button:disabled {
            opacity:.5;
            cursor:not-allowed;
        }

        .cj-search-btn {
            background:linear-gradient(135deg,#D4AF37,#FFD700);
            color:#050505;
        }

        .cj-grid {
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:12px;
        }

        .cj-card {
            background:#101010;
            border:1px solid #554719;
            border-radius:12px;
            overflow:hidden;
            transition:.2s;
        }

        .cj-card:hover {
            border-color:#FFD700;
            transform:translateY(-3px);
        }

        .cj-card-image {
            height:170px;
            background:#080808;
            display:flex;
            align-items:center;
            justify-content:center;
        }

        .cj-card-image img {
            width:100%;
            height:100%;
            object-fit:contain;
        }

        .cj-card-body {
            padding:12px;
        }

        .cj-card-name {
            font-size:12px;
            font-weight:600;
            min-height:38px;
            line-height:1.5;
            overflow:hidden;
            display:-webkit-box;
            -webkit-line-clamp:2;
            -webkit-box-orient:vertical;
        }

        .cj-card-price {
            color:#FFD700;
            font-size:15px;
            font-weight:800;
            margin:10px 0 5px;
        }

        .cj-card-stock {
            color:#aaa;
            font-size:10px;
            margin-bottom:10px;
        }

        .cj-view-btn {
            width:100%;
            background:linear-gradient(135deg,#007BFF,#003B8E);
            color:white;
            border:0;
            padding:10px;
            border-radius:7px;
            font-weight:700;
            cursor:pointer;
        }

        .cj-info {
            color:#D4AF37;
            font-size:12px;
            margin:15px 0;
        }

        .cj-pagination {
            display:flex;
            justify-content:center;
            align-items:center;
            flex-wrap:wrap;
            gap:12px;
            margin:25px 0;
        }

        .cj-page-btn {
            background:#111;
            color:#FFD700;
            border:1px solid #D4AF37;
            padding:10px 17px;
            border-radius:7px;
            cursor:pointer;
        }

        .cj-page-btn:disabled {
            opacity:.35;
            cursor:not-allowed;
        }

        .cj-page-number {
            color:white;
            font-size:12px;
            font-weight:700;
        }

        .cj-modal {
            display:none;
            position:fixed;
            inset:0;
            z-index:999999;
            background:#000e;
            backdrop-filter:blur(6px);
            align-items:center;
            justify-content:center;
            padding:12px;
        }

        .cj-modal-box {
            width:100%;
            max-width:900px;
            max-height:92vh;
            overflow:auto;
            position:relative;
            background:#101010;
            border:1px solid #D4AF37;
            border-radius:14px;
            padding:22px;
        }

        .cj-close {
            position:absolute;
            right:12px;
            top:10px;
            width:35px;
            height:35px;
            border-radius:50%;
            border:1px solid #D4AF37;
            background:#080808;
            color:#FFD700;
            font-size:22px;
            cursor:pointer;
        }

        .cj-detail-title {
            color:#FFD700;
            font-size:19px;
            font-weight:800;
            padding-right:35px;
        }

        .cj-detail-grid {
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:20px;
            margin-top:20px;
        }

        .cj-detail-image {
            width:100%;
            max-height:300px;
            object-fit:contain;
            border:1px solid #554719;
            border-radius:10px;
            background:#080808;
        }

        .cj-section {
            background:#090909;
            border:1px solid #554719;
            padding:15px;
            border-radius:9px;
            margin-bottom:15px;
        }

        .cj-section-title {
            color:#FFD700;
            font-size:13px;
            font-weight:800;
            margin:0 0 12px;
        }

        .cj-label {
            display:block;
            color:#D4AF37;
            font-size:11px;
            font-weight:700;
            margin-top:12px;
        }

        .cj-field {
            width:100%;
            padding:11px;
            background:#050505;
            color:white;
            border:1px solid #554719;
            border-radius:7px;
            margin-top:6px;
            font-family:inherit;
        }

        .cj-final-price {
            padding:15px;
            background:#151208;
            border:1px solid #D4AF37;
            border-radius:9px;
            color:#FFD700;
            font-size:12px;
            font-weight:800;
        }

        .cj-final-price strong {
            display:block;
            font-size:25px;
            margin-top:7px;
        }

        .cj-calculation {
            background:#090909;
            border:1px solid #554719;
            padding:13px;
            border-radius:9px;
            margin-top:12px;
            font-size:11px;
            line-height:2;
            color:#ccc;
        }

        .cj-calculation strong {
            color:#FFD700;
        }

        .cj-commission {
            background:#090909;
            border:1px solid #554719;
            padding:13px;
            border-radius:9px;
            margin-top:12px;
        }

        .cj-commission-row {
            display:flex;
            justify-content:space-between;
            gap:10px;
            font-size:11px;
            padding:7px 0;
            border-bottom:1px solid #222;
        }

        .cj-commission-row:last-child {
            border-bottom:0;
        }

        .cj-warning {
            background:#241d08;
            border:1px solid #80651f;
            color:#e8d48b;
            padding:11px;
            border-radius:8px;
            font-size:10px;
            line-height:1.7;
            margin-top:12px;
        }

        .cj-action {
            width:100%;
            padding:13px;
            border-radius:8px;
            margin-top:10px;
            font-weight:800;
            cursor:pointer;
            font-family:inherit;
        }

        .cj-action:disabled {
            opacity:.5;
            cursor:not-allowed;
        }

        .cj-draft {
            background:#111;
            border:1px solid #D4AF37;
            color:#FFD700;
        }

        .cj-publish {
            background:linear-gradient(135deg,#D4AF37,#FFD700);
            color:#050505;
            border:0;
        }

        .cj-copy {
            background:linear-gradient(135deg,#007BFF,#003B8E);
            color:white;
            border:0;
            padding:12px;
            border-radius:8px;
            width:100%;
            margin-top:12px;
            font-weight:800;
            cursor:pointer;
        }

        .cj-message {
            padding:30px;
            text-align:center;
            background:#101010;
            border:1px dashed #D4AF37;
            border-radius:10px;
            color:#aaa;
            grid-column:1/-1;
        }

        .cj-success {
            text-align:center;
            padding:30px 10px;
        }

        .cj-success h2 {
            color:#FFD700;
        }

        .cj-variant {
            width:100%;
            padding:10px;
            background:#080808;
            color:white;
            border:1px solid #554719;
            border-radius:7px;
            margin-top:8px;
        }

        @media(min-width:700px) {
            .cj-grid {
                grid-template-columns:repeat(4,minmax(0,1fr));
            }
        }

        @media(min-width:1100px) {
            .cj-grid {
                grid-template-columns:repeat(6,minmax(0,1fr));
            }
        }

        @media(max-width:650px) {

            .dakpro-cj {
                padding:12px;
            }

            .cj-search-box {
                grid-template-columns:1fr;
            }

            .cj-detail-grid {
                grid-template-columns:1fr;
            }

            .cj-title {
                font-size:19px;
            }

            .cj-card-image {
                height:145px;
            }

            .cj-modal-box {
                padding:16px;
            }

        }

        </style>


        <div class="dakpro-cj">

            <header class="cj-header">

                <div>

                    <h2 class="cj-title">
                        DAKPRO ÉLITE
                        <span style="color:#007BFF">
                            GLOBAL IMPORTER PRO
                        </span>
                    </h2>

                    <p class="cj-subtitle">
                        Catalogue international CJ Dropshipping
                        — Importation commerciale DAKPRO ÉLITE
                    </p>

                </div>

                <span class="cj-status" id="cj-status">
                    ● CONNECTEUR EN ATTENTE
                </span>

            </header>


            <div class="cj-search-box">

                <input
                    id="cj-search-input"
                    class="cj-input"
                    type="search"
                    placeholder="Rechercher : montre, téléphone, chaussures..."
                >

                <input
                    id="cj-category-input"
                    class="cj-input"
                    type="text"
                    list="cj-category-list"
                    placeholder="ID catégorie CJ (facultatif)"
                >

                <datalist id="cj-category-list"></datalist>

                <button
                    id="cj-search-btn"
                    class="cj-button cj-search-btn"
                >
                    🔎 RECHERCHER
                </button>

            </div>


            <div id="cj-search-info" class="cj-info">
                Recherchez un produit dans le catalogue CJ.
            </div>


            <div id="cj-products-grid" class="cj-grid">

                <div class="cj-message">
                    🌐 DAKPRO ÉLITE GLOBAL IMPORTER PRO
                    <br><br>
                    Saisissez un mot-clé pour commencer.
                </div>

            </div>


            <div class="cj-pagination">

                <button id="cj-prev" class="cj-page-btn" disabled>
                    ← Précédent
                </button>

                <span id="cj-page-number" class="cj-page-number">
                    Page 0 / 0
                </span>

                <button id="cj-next" class="cj-page-btn" disabled>
                    Suivant →
                </button>

            </div>


            <div class="cj-modal" id="cj-modal">

                <div class="cj-modal-box">

                    <button class="cj-close" id="cj-close">
                        ×
                    </button>

                    <div id="cj-modal-content"></div>

                </div>

            </div>

        </div>

        `;
    }


    // ========================================================
    // APPEL API DAKPRO
    // ========================================================

    async apiRequest(path, options = {}) {

        const response = await fetch(path, {
            ...options,
            headers: {
                "Accept": "application/json",
                ...(options.body ? {
                    "Content-Type": "application/json"
                } : {}),
                ...(options.headers || {})
            }
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "Le serveur a retourné une réponse invalide."
            );
        }

        if (!response.ok || data.success === false) {

            throw new Error(
                data.message ||
                data.error ||
                data.msg ||
                `Erreur API (${response.status})`
            );

        }

        return data;
    }


    // ========================================================
    // NORMALISATION DES RÉPONSES
    // ========================================================

    extractObject(data) {

        let value = data?.data ?? data;

        if (Array.isArray(value)) {
            value = value[0] || {};
        }

        if (value?.list && Array.isArray(value.list)) {
            value = value.list[0] || {};
        }

        return value && typeof value === "object"
            ? value
            : {};
    }


    extractList(data) {

        const candidates = [
            data?.data?.list,
            data?.data?.variants,
            data?.data?.inventory,
            data?.data?.items,
            data?.data?.tree,
            data?.list,
            data?.variants,
            data?.items,
            data?.data
        ];

        for (const candidate of candidates) {

            if (Array.isArray(candidate)) {
                return candidate;
            }

        }

        return [];
    }


    // ========================================================
    // ÉVÉNEMENTS
    // ========================================================

    attachEvents() {

        const searchButton =
            this.container.querySelector("#cj-search-btn");

        const searchInput =
            this.container.querySelector("#cj-search-input");

        const categoryInput =
            this.container.querySelector("#cj-category-input");


        searchButton.addEventListener("click", () => {

            this.currentKeyword = searchInput.value.trim();

            this.currentCategoryId =
                categoryInput.value.trim();

            this.currentPage = 1;

            this.searchProducts();

        });


        searchInput.addEventListener("keydown", event => {

            if (event.key === "Enter") {
                searchButton.click();
            }

        });


        categoryInput.addEventListener("keydown", event => {

            if (event.key === "Enter") {
                searchButton.click();
            }

        });


        this.container.querySelector("#cj-prev")
            .addEventListener("click", () => {

                if (this.currentPage > 1 && !this.loading) {
                    this.currentPage--;
                    this.searchProducts();
                }

            });


        this.container.querySelector("#cj-next")
            .addEventListener("click", () => {

                if (
                    this.currentPage < this.totalPages &&
                    !this.loading
                ) {
                    this.currentPage++;
                    this.searchProducts();
                }

            });


        this.container.querySelector("#cj-close")
            .addEventListener("click", () => {
                this.closeModal();
            });


        this.container.querySelector("#cj-modal")
            .addEventListener("click", event => {

                if (event.target.id === "cj-modal") {
                    this.closeModal();
                }

            });

    }


    // ========================================================
    // CATÉGORIES CJ
    // ========================================================

    async loadCategories() {

        const list =
            this.container.querySelector("#cj-category-list");

        const status =
            this.container.querySelector("#cj-status");

        try {

            const response =
                await this.apiRequest("/api/categories");

            const categories = this.extractList(response);

            const flattened = [];

            const visit = items => {

                for (const item of items) {

                    if (!item || typeof item !== "object") {
                        continue;
                    }

                    const id =
                        item.categoryId ||
                        item.categoryFirstId ||
                        item.categorySecondId ||
                        item.id;

                    const name =
                        item.categoryName ||
                        item.categoryFirstName ||
                        item.categorySecondName ||
                        item.name;

                    if (id && name) {
                        flattened.push({
                            id: String(id),
                            name: String(name)
                        });
                    }

                    const children =
                        item.categoryFirstList ||
                        item.categorySecondList ||
                        item.children ||
                        item.list;

                    if (Array.isArray(children)) {
                        visit(children);
                    }

                }

            };

            visit(categories);

            const unique = [
                ...new Map(
                    flattened.map(item => [item.id, item])
                ).values()
            ];

            list.innerHTML = unique.map(item => `
                <option
                    value="${this.escapeHTML(item.id)}"
                >${this.escapeHTML(item.name)}</option>
            `).join("");

            if (unique.length) {
                status.textContent =
                    "● CATÉGORIES CHARGÉES";
            }

        } catch (error) {

            console.warn(
                "DAKPRO CJ catégories :",
                error.message
            );

            // Une erreur de catégories ne bloque pas
            // la recherche des produits.

        }

    }


    // ========================================================
    // TRADUCTION DES RECHERCHES
    // ========================================================

    translateKeyword(keyword) {

        const dictionary = {

            "montre": "watch",
            "montres": "watch",
            "chaussure": "shoes",
            "chaussures": "shoes",
            "téléphone": "phone",
            "telephone": "phone",
            "écouteurs": "earphones",
            "ecouteurs": "earphones",
            "sac": "bag",
            "sacs": "bag",
            "voiture": "car",
            "voitures": "car",
            "trépied": "tripod",
            "trepied": "tripod",
            "vêtement": "clothing",
            "vetement": "clothing",
            "robe": "dress",
            "robes": "dress",
            "ordinateur": "computer",
            "ordinateur portable": "laptop",
            "lunettes": "glasses",
            "bijoux": "jewelry"

        };

        const clean = keyword.toLowerCase().trim();

        return dictionary[clean] || keyword;

    }


    // ========================================================
    // RECHERCHE CJ
    // ========================================================

    async searchProducts() {

        if (this.loading) return;

        const grid =
            this.container.querySelector("#cj-products-grid");

        const info =
            this.container.querySelector("#cj-search-info");

        const status =
            this.container.querySelector("#cj-status");

        const searchButton =
            this.container.querySelector("#cj-search-btn");


        this.loading = true;

        searchButton.disabled = true;
        searchButton.textContent = "RECHERCHE...";

        this.updatePagination();

        grid.innerHTML = `
            <div class="cj-message">
                🔄 Connexion au catalogue CJ Dropshipping...
            </div>
        `;

        info.textContent = "Recherche en cours...";
        status.textContent = "● CONNEXION EN COURS";


        try {

            const keyword =
                this.translateKeyword(this.currentKeyword);

            const params = new URLSearchParams({
                keyword,
                page: String(this.currentPage),
                size: String(this.pageSize)
            });

            if (this.currentCategoryId) {
                params.set(
                    "categoryId",
                    this.currentCategoryId
                );
            }

            const data = await this.apiRequest(
                `/api/search?${params.toString()}`
            );

            const products =
                Array.isArray(data.data?.list)
                    ? data.data.list
                    : [];

            this.totalPages = Math.max(
                1,
                Number(data.data?.totalPages) || 1
            );

            this.totalRecords =
                Number(data.data?.totalRecords) || 0;

            this.productsCache = {};

            const normalized = products.map(p => {

                const pid =
                    p.pid ||
                    p.id ||
                    p.productId;

                const images = this.normalizeImages(
                    p.images || p.productImageSet || [],
                    p.productImage || p.bigImage
                );

                const price = this.parsePrice(
                    p.prixFournisseurUSD ??
                    p.supplierPrice ??
                    p.sellPrice ??
                    p.productPrice
                );

                const product = {

                    pid,

                    productName:
                        p.productName ||
                        p.nameEn ||
                        p.productNameEn ||
                        "Produit CJ",

                    productImage:
                        p.productImage ||
                        p.bigImage ||
                        images[0] ||
                        "",

                    images,

                    sellPrice: price,

                    productSku:
                        p.productSku ||
                        p.sku ||
                        "",

                    stock: this.readStock(p),

                    categoryName:
                        p.categoryName ||
                        p.oneCategoryName ||
                        "",

                    categoryId:
                        p.categoryId || "",

                    description:
                        p.description || "",

                    raw: p

                };

                if (pid) {
                    this.productsCache[String(pid)] = product;
                }

                return product;

            }).filter(product => product.pid);

            if (!normalized.length) {

                grid.innerHTML = `
                    <div class="cj-message">
                        ⚠️ Aucun produit trouvé.
                        <br><br>
                        Essayez un autre mot-clé.
                    </div>
                `;

                info.textContent =
                    "Aucun résultat pour cette recherche.";

            } else {

                this.renderProducts(normalized);

                info.textContent =
                    `${this.totalRecords.toLocaleString("fr-FR")} produits correspondants — ${normalized.length} affichés sur cette page.`;

            }

            status.textContent =
                "● CATALOGUE CJ CONNECTÉ";

        } catch (error) {

            console.error("DAKPRO CJ:", error);

            status.textContent =
                "● ERREUR DE CONNEXION";

            grid.innerHTML = `
                <div class="cj-message">

                    <strong style="color:#ff5555">
                        ⚠️ Impossible de récupérer le catalogue.
                    </strong>

                    <br><br>

                    ${this.escapeHTML(error.message)}

                    <br><br>

                    Vérifiez le déploiement Vercel et les routes API CJ.

                </div>
            `;

            info.textContent =
                "La recherche n'a pas abouti.";

        } finally {

            this.loading = false;

            searchButton.disabled = false;
            searchButton.textContent = "🔎 RECHERCHER";

            this.updatePagination();

        }

    }


    // ========================================================
    // STOCK NORMALISÉ
    // ========================================================

    readStock(product) {

        const candidates = [
            product.inventory,
            product.stock,
            product.quantity,
            product.totalInventory
        ];

        for (const value of candidates) {

            if (
                value !== null &&
                value !== undefined &&
                value !== "" &&
                Number.isFinite(Number(value))
            ) {
                return Number(value);
            }

        }

        return null;

    }


    // ========================================================
    // NETTOYAGE DES IMAGES
    // ========================================================

    normalizeImages(images, mainImage) {

        let result = [];

        if (typeof images === "string") {

            try {
                images = JSON.parse(images);
            } catch {
                images = [images];
            }

        }

        if (Array.isArray(images)) {

            result = images.map(image => {

                if (typeof image === "string") {
                    return image.trim();
                }

                if (image && typeof image === "object") {

                    return (
                        image.url ||
                        image.image ||
                        image.bigImage ||
                        image.imageUrl ||
                        ""
                    );

                }

                return "";

            }).filter(Boolean);

        }

        if (mainImage && !result.includes(mainImage)) {
            result.unshift(mainImage);
        }

        return [...new Set(result)];

    }


    // ========================================================
    // CONVERSION DES PRIX
    // ========================================================

    parsePrice(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return null;
        }

        if (typeof value === "number") {

            return Number.isFinite(value) && value > 0
                ? value
                : null;

        }

        const text = String(value)
            .trim()
            .replace(/,/g, ".");

        if (/\d\s*-\s*\d/.test(text)) {
            return null;
        }

        const match = text.match(/\d+(?:\.\d+)?/);

        if (!match) return null;

        const number = Number(match[0]);

        return Number.isFinite(number) && number > 0
            ? number
            : null;

    }


    getExchangeRate() {

        const configured =
            window.DAKPRO_CONFIG?.tauxUsdFcfa ??
            window.CJ_USD_FCFA;

        const rate = Number(configured ?? 655);

        return Number.isFinite(rate) && rate > 0
            ? rate
            : 655;

    }


    formatFCFA(value) {

        return Math.round(Number(value) || 0)
            .toLocaleString("fr-FR") + " FCFA";

    }


    // ========================================================
    // CALCUL VIA API PRODUCT-PRICING
    // ========================================================

    async calculateCommercialAPI(product, settings) {

        const response = await this.apiRequest(
            "/api/product-pricing",
            {
                method: "POST",
                body: JSON.stringify({

                    supplierPriceUSD: product.sellPrice,

                    exchangeRate: settings.rate,

                    marginPercent: settings.margin

                })
            }
        );

        const result = response.data || response.resultData;

        if (!result || typeof result !== "object") {
            throw new Error(
                "La réponse du calculateur commercial est invalide."
            );
        }

        const supplierCost = Number(
            result.coutFournisseurFCFA
        );

        const finalPrice = Number(
            result.prixPublicFCFA ??
            result.prix
        );

        const actualMargin = Number(
            result.montantMargeFCFA
        );

        if (
            !Number.isFinite(supplierCost) ||
            !Number.isFinite(finalPrice) ||
            !Number.isFinite(actualMargin)
        ) {
            throw new Error(
                "Le calculateur n'a pas retourné tous les prix nécessaires."
            );
        }

        const commissions = result.commissions || {};

        return {

            supplierCost,

            finalPrice,

            actualMargin,

            rates: {
                seller: 80,
                affiliate: 5,
                platform: 15
            },

            commissions: {

                seller: Number(
                    commissions.vendeur ??
                    Math.round(actualMargin * 0.80)
                ),

                affiliate: Number(
                    commissions.affilie ??
                    Math.round(actualMargin * 0.05)
                ),

                platform: Number(
                    commissions.dakpro ??
                    commissions.plateforme ??
                    Math.round(actualMargin * 0.15)
                )

            },

            source: "API PRODUCT PRICING"

        };

    }


    // ========================================================
    // AFFICHAGE DES PRODUITS
    // ========================================================

    renderProducts(products) {

        const grid =
            this.container.querySelector("#cj-products-grid");

        grid.innerHTML = products.map(product => {

            const image = product.productImage;

            const stockText =
                product.stock === null
                    ? "Stock non renseigné"
                    : "Stock : " + product.stock;

            const priceText =
                product.sellPrice === null
                    ? "Prix fournisseur indisponible"
                    : "$" + product.sellPrice.toFixed(2);

            return `

                <article class="cj-card">

                    <div class="cj-card-image">

                        ${
                            image
                                ? `
                                    <img
                                        src="${this.escapeHTML(image)}"
                                        alt="${this.escapeHTML(product.productName)}"
                                        loading="lazy"
                                        onerror="this.style.display='none'"
                                    >
                                `
                                : `
                                    <span style="color:#777;font-size:11px">
                                        IMAGE NON DISPONIBLE
                                    </span>
                                `
                        }

                    </div>

                    <div class="cj-card-body">

                        <div class="cj-card-name">
                            ${this.escapeHTML(product.productName)}
                        </div>

                        <div class="cj-card-price">
                            ${this.escapeHTML(priceText)}
                        </div>

                        <div class="cj-card-stock">
                            ${this.escapeHTML(stockText)}
                        </div>

                        <button
                            class="cj-view-btn"
                            data-cj-id="${this.escapeHTML(product.pid)}"
                        >
                            VOIR & IMPORTER
                        </button>

                    </div>

                </article>

            `;

        }).join("");

        grid.querySelectorAll("[data-cj-id]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    this.loadProductDetail(
                        button.dataset.cjId
                    );

                });

            });

    }


    // ========================================================
    // PAGINATION
    // ========================================================

    updatePagination() {

        const prev =
            this.container.querySelector("#cj-prev");

        const next =
            this.container.querySelector("#cj-next");

        const number =
            this.container.querySelector("#cj-page-number");

        number.textContent =
            `Page ${this.currentPage} / ${this.totalPages}`;

        prev.disabled =
            this.currentPage <= 1 || this.loading;

        next.disabled =
            this.currentPage >= this.totalPages ||
            this.loading;

    }


    // ========================================================
    // DÉTAILS PRODUIT VIA API
    // ========================================================

    async fetchProductDetails(product) {

        const params = new URLSearchParams({
            pid: String(product.pid)
        });

        const response = await this.apiRequest(
            `/api/product-details?${params.toString()}`
        );

        const details = this.extractObject(response);

        return {

            ...product,

            productName:
                details.productName ||
                details.productNameEn ||
                product.productName,

            productSku:
                details.productSku ||
                details.sku ||
                product.productSku,

            productImage:
                details.productImage ||
                details.bigImage ||
                product.productImage,

            images: this.normalizeImages(
                details.images ||
                details.productImageSet ||
                product.images,
                details.productImage ||
                details.bigImage ||
                product.productImage
            ),

            sellPrice:
                this.parsePrice(
                    details.prixFournisseurUSD ??
                    details.supplierPrice ??
                    details.sellPrice ??
                    product.sellPrice
                ),

            description:
                details.description ||
                details.productDescription ||
                product.description,

            categoryName:
                details.categoryName ||
                product.categoryName,

            categoryId:
                details.categoryId ||
                product.categoryId,

            rawDetails: details

        };

    }


    // ========================================================
    // VARIANTES VIA API
    // ========================================================

    async fetchProductVariants(product) {

        const params = new URLSearchParams({
            pid: String(product.pid)
        });

        const response = await this.apiRequest(
            `/api/product-variants?${params.toString()}`
        );

        return this.extractList(response).map(variant => ({

            vid:
                variant.vid ||
                variant.variantId ||
                variant.id ||
                "",

            sku:
                variant.variantSku ||
                variant.sku ||
                "",

            name:
                variant.variantName ||
                variant.name ||
                variant.variantKey ||
                "Variante",

            price: this.parsePrice(
                variant.sellPrice ??
                variant.variantPrice ??
                variant.price
            ),

            stock: this.readStock(variant),

            image:
                variant.variantImage ||
                variant.image ||
                variant.bigImage ||
                ""

        }));

    }


    // ========================================================
    // STOCK VIA API
    // ========================================================

    async fetchProductInventory(product, variants = []) {

        const params = new URLSearchParams({
            pid: String(product.pid)
        });

        const response = await this.apiRequest(
            `/api/product-inventory?${params.toString()}`
        );

        const items = this.extractList(response);

        const data = response.data || {};

        const directStock = this.readStock(data);

        const variantStocks = variants.map(variant => {

            const matching = items.find(item => {

                const itemVid =
                    item.vid ||
                    item.variantId ||
                    "";

                return (
                    itemVid &&
                    String(itemVid) === String(variant.vid)
                );

            });

            return {

                ...variant,

                stock: matching
                    ? this.readStock(matching)
                    : variant.stock

            };

        });

        let totalStock = directStock;

        if (totalStock === null && items.length) {

            const knownStocks = items
                .map(item => this.readStock(item))
                .filter(value => value !== null);

            if (knownStocks.length) {
                totalStock = knownStocks.reduce(
                    (sum, value) => sum + value,
                    0
                );
            }

        }

        return {

            stock: totalStock,

            verified:
                totalStock !== null ||
                items.some(item => this.readStock(item) !== null),

            items,

            variants: variantStocks,

            raw: response

        };

    }


    // ========================================================
    // CHARGEMENT COMPLET DU PRODUIT
    // ========================================================

    async loadProductDetail(pid) {

        const cached =
            this.productsCache[String(pid)];

        if (!cached) {
            alert("Produit introuvable.");
            return;
        }

        if (cached.sellPrice === null) {

            alert(
                "Le prix fournisseur CJ est indisponible. Ce produit ne peut pas être importé."
            );

            return;

        }

        const modal =
            this.container.querySelector("#cj-modal");

        const content =
            this.container.querySelector("#cj-modal-content");

        this.selectedProduct = cached;

        modal.style.display = "flex";

        content.innerHTML = `
            <div class="cj-message">
                🔄 Chargement des détails, variantes et stocks CJ...
            </div>
        `;

        try {

            const details = await this.fetchProductDetails(cached);

            if (
                details.sellPrice === null ||
                details.sellPrice <= 0
            ) {
                throw new Error(
                    "Le prix fournisseur n'est pas disponible dans les détails CJ."
                );
            }

            this.selectedProduct = details;

            let variants = [];

            try {

                variants = await this.fetchProductVariants(details);

            } catch (error) {

                console.warn(
                    "Variantes CJ indisponibles :",
                    error.message
                );

            }

            this.currentVariants = variants;

            let inventory = null;

            try {

                inventory = await this.fetchProductInventory(
                    details,
                    variants
                );

            } catch (error) {

                console.warn(
                    "Stock CJ indisponible :",
                    error.message
                );

            }

            this.currentInventory = inventory;

            if (
                inventory &&
                inventory.stock !== null
            ) {
                details.stock = inventory.stock;
            }

            if (inventory?.variants) {
                this.currentVariants = inventory.variants;
            }

            this.renderProductDetail(details);

        } catch (error) {

            console.error(
                "DAKPRO détails CJ :",
                error
            );

            content.innerHTML = `
                <div class="cj-message">
                    <strong style="color:#ff5555">
                        Impossible de charger les détails du produit.
                    </strong>
                    <br><br>
                    ${this.escapeHTML(error.message)}
                    <br><br>
                    Vérifiez les routes API du serveur.
                    <button
                        class="cj-action cj-draft"
                        id="cj-retry-detail"
                    >
                        RÉESSAYER
                    </button>
                </div>
            `;

            content.querySelector("#cj-retry-detail")
                ?.addEventListener("click", () => {
                    this.loadProductDetail(pid);
                });

        }

    }


    // ========================================================
    // AFFICHAGE DÉTAIL ET PARAMÈTRES
    // ========================================================

    renderProductDetail(product) {

        const content =
            this.container.querySelector("#cj-modal-content");

        const rate = this.getExchangeRate();

        const variantOptions = this.currentVariants.length
            ? this.currentVariants.map((variant, index) => `
                <option value="${index}">
                    ${this.escapeHTML(variant.name)}
                    ${variant.sku ? " — " + this.escapeHTML(variant.sku) : ""}
                </option>
            `).join("")
            : `<option value="">Aucune variante disponible</option>`;

        content.innerHTML = `

            <h2 class="cj-detail-title">
                ${this.escapeHTML(product.productName)}
            </h2>

            <div class="cj-detail-grid">

                <div>

                    ${
                        product.productImage
                            ? `
                                <img
                                    class="cj-detail-image"
                                    src="${this.escapeHTML(product.productImage)}"
                                    alt="${this.escapeHTML(product.productName)}"
                                >
                            `
                            : ""
                    }

                    <p style="color:#D4AF37;font-size:12px;margin-top:15px">
                        FOURNISSEUR : CJ DROPSHIPPING
                    </p>

                    <p style="font-size:12px;color:#aaa">
                        Référence :
                        ${this.escapeHTML(product.productSku)}
                    </p>

                    <p style="font-size:12px;color:#aaa">
                        Prix fournisseur :
                        <strong style="color:#FFD700">
                            $${product.sellPrice.toFixed(2)}
                        </strong>
                    </p>

                    <p style="font-size:12px;color:#aaa">
                        Stock :
                        <strong style="color:white">
                            ${
                                product.stock === null
                                    ? "Non renseigné"
                                    : product.stock
                            }
                        </strong>
                    </p>

                    <p style="font-size:11px;color:#888;line-height:1.7">
                        Catégorie :
                        ${this.escapeHTML(product.categoryName || "Non renseignée")}
                    </p>

                    ${
                        this.currentVariants.length
                            ? `
                                <label class="cj-label">
                                    VARIANTES DU PRODUIT
                                </label>

                                <select
                                    id="cj-variant-select"
                                    class="cj-variant"
                                >
                                    ${variantOptions}
                                </select>
                            `
                            : `
                                <p style="color:#aaa;font-size:11px">
                                    Aucune variante retournée par le serveur.
                                </p>
                            `
                    }

                    <div class="cj-warning">
                        ${
                            this.currentInventory?.verified
                                ? "Stock récupéré depuis le service d'inventaire."
                                : "Stock non confirmé par le service d'inventaire."
                        }
                    </div>

                </div>

                <div>

                    <div class="cj-section">

                        <h3 class="cj-section-title">
                            ⚙️ PARAMÈTRES COMMERCIAUX
                        </h3>

                        <label class="cj-label">
                            TAUX USD / FCFA
                        </label>

                        <input
                            id="cj-rate"
                            class="cj-field"
                            type="number"
                            min="1"
                            step="0.01"
                            value="${rate}"
                        >

                        <label class="cj-label">
                            MARGE COMMERCIALE (%)
                        </label>

                        <input
                            id="cj-margin"
                            class="cj-field"
                            type="number"
                            min="0"
                            max="1000"
                            step="0.01"
                            value="30"
                        >

                        <label class="cj-label">
                            RÉPARTITION VENDEUR (%)
                        </label>

                        <input
                            id="cj-seller-rate"
                            class="cj-field"
                            type="number"
                            value="80"
                            readonly
                        >

                        <label class="cj-label">
                            PART AFFILIATION (%)
                        </label>

                        <input
                            id="cj-affiliate-rate"
                            class="cj-field"
                            type="number"
                            value="5"
                            readonly
                        >

                        <label class="cj-label">
                            RÉPARTITION DAKPRO (%)
                        </label>

                        <input
                            id="cj-platform-rate"
                            class="cj-field"
                            type="number"
                            value="15"
                            readonly
                        >

                    </div>

                    <div class="cj-final-price">

                        PRIX DE VENTE DAKPRO ÉLITE

                        <strong id="cj-final-price">
                            Calcul en cours...
                        </strong>

                    </div>

                    <div class="cj-calculation" id="cj-calculation">
                        Calcul commercial en attente...
                    </div>

                    <div class="cj-commission">

                        <h3 class="cj-section-title">
                            💰 RÉPARTITION DE LA MARGE
                        </h3>

                        <div class="cj-commission-row">
                            <span>Vendeur — 80 %</span>
                            <strong id="cj-commission-seller">
                                0 FCFA
                            </strong>
                        </div>

                        <div class="cj-commission-row">
                            <span>Affiliation — 5 %</span>
                            <strong id="cj-commission-affiliate">
                                0 FCFA
                            </strong>
                        </div>

                        <div class="cj-commission-row">
                            <span>DAKPRO — 15 %</span>
                            <strong id="cj-commission-platform">
                                0 FCFA
                            </strong>
                        </div>

                    </div>

                    <div class="cj-warning">

                        ⚠️ Les frais d'expédition CJ ne sont pas encore intégrés.

                        <br><br>

                        La part d'affiliation de 5 % reste non attribuée
                        tant qu'un véritable affilié n'a pas apporté la vente.

                        <br><br>

                        Les commissions ne sont pas créditées à la publication.
                    </div>

                    <button
                        id="cj-save-draft"
                        class="cj-action cj-draft"
                    >
                        📥 ENREGISTRER EN BROUILLON
                    </button>

                    <button
                        id="cj-publish"
                        class="cj-action cj-publish"
                    >
                        🚀 PUBLIER SUR DAKPRO ÉLITE
                    </button>

                </div>

            </div>

        `;

        const update = () => {
            this.updateCommercialPreview();
        };

        [
            "#cj-rate",
            "#cj-margin"
        ].forEach(selector => {

            content.querySelector(selector)
                .addEventListener("input", update);

        });

        content.querySelector("#cj-save-draft")
            .addEventListener("click", () => {
                this.triggerImport(false);
            });

        content.querySelector("#cj-publish")
            .addEventListener("click", () => {
                this.triggerImport(true);
            });

        update();

    }


    // ========================================================
    // APERÇU DU CALCUL COMMERCIAL
    // ========================================================

    async updateCommercialPreview() {

        const content =
            this.container.querySelector("#cj-modal-content");

        if (!this.selectedProduct) return;

        const settings = this.getCommercialSettings();

        if (!settings.valid) {

            content.querySelector("#cj-final-price")
                .textContent = settings.error;

            return;

        }

        try {

            const result = await this.calculateCommercialAPI(
                this.selectedProduct,
                settings
            );

            content.querySelector("#cj-final-price")
                .textContent =
                this.formatFCFA(result.finalPrice);

            content.querySelector("#cj-calculation")
                .innerHTML = `

                    Coût fournisseur converti :
                    <strong>${this.formatFCFA(result.supplierCost)}</strong>
                    <br>

                    Marge commerciale :
                    <strong>${this.formatFCFA(result.actualMargin)}</strong>
                    <br>

                    Prix public :
                    <strong>${this.formatFCFA(result.finalPrice)}</strong>

                `;

            content.querySelector("#cj-commission-seller")
                .textContent =
                this.formatFCFA(result.commissions.seller);

            content.querySelector("#cj-commission-affiliate")
                .textContent =
                this.formatFCFA(result.commissions.affiliate);

            content.querySelector("#cj-commission-platform")
                .textContent =
                this.formatFCFA(result.commissions.platform);

        } catch (error) {

            console.error(
                "DAKPRO pricing preview:",
                error
            );

            content.querySelector("#cj-final-price")
                .textContent = "Erreur de calcul API";

            content.querySelector("#cj-calculation")
                .textContent = error.message;

        }

    }


    // ========================================================
    // PARAMÈTRES COMMERCIAUX
    // ========================================================

    getCommercialSettings() {

        const content =
            this.container.querySelector("#cj-modal-content");

        const margin = Number(
            content.querySelector("#cj-margin").value
        );

        const rate = Number(
            content.querySelector("#cj-rate").value
        );

        if (
            !Number.isFinite(margin) ||
            margin < 0 ||
            margin > 1000
        ) {
            return {
                valid: false,
                error: "Marge invalide."
            };
        }

        if (
            !Number.isFinite(rate) ||
            rate <= 0
        ) {
            return {
                valid: false,
                error: "Taux de conversion invalide."
            };
        }

        return {

            valid: true,

            margin,

            rate,

            rates: {
                seller: 80,
                affiliate: 5,
                platform: 15
            }

        };

    }


    // ========================================================
    // LIEN D'AFFILIATION
    // ========================================================

    generateAffiliateLink(productId, sellerId) {

        const configuredUrl =
            window.DAKPRO_CONFIG?.productPageUrl;

        const baseUrl = configuredUrl
            ? new URL(configuredUrl, window.location.origin)
            : new URL(
                "index.html",
                window.location.origin
            );

        baseUrl.searchParams.set(
            "produit",
            productId
        );

        // Le paramètre ref conserve la compatibilité
        // avec les liens existants.
        // Il identifie ici le vendeur créateur du lien,
        // pas un affilié ayant déjà apporté une vente.
        baseUrl.searchParams.set(
            "ref",
            sellerId
        );

        return baseUrl.toString();

    }


    // ========================================================
    // IMPORTATION FIREBASE
    // ========================================================

    async triggerImport(publishNow) {

        if (this.importing) return;

        const product = this.selectedProduct;

        if (!product) return;

        const content =
            this.container.querySelector("#cj-modal-content");

        const button = content.querySelector(
            publishNow
                ? "#cj-publish"
                : "#cj-save-draft"
        );

        this.importing = true;

        try {

            button.disabled = true;
            button.textContent = "IMPORTATION EN COURS...";

            const currentUser =
                window.currentUser ||
                this.auth.currentUser;

            if (!currentUser) {
                throw new Error(
                    "Connectez-vous avant d'importer un produit."
                );
            }

            if (
                !product.sellPrice ||
                product.sellPrice <= 0
            ) {
                throw new Error(
                    "Prix fournisseur indisponible."
                );
            }

            const settings =
                this.getCommercialSettings();

            if (!settings.valid) {
                throw new Error(settings.error);
            }

            // Dernier calcul auprès du serveur.
            const calculation =
                await this.calculateCommercialAPI(
                    product,
                    settings
                );

            const publicationRef =
                push(ref(this.db, "publications"));

            const prodId =
                publicationRef.key;

            const affiliateLink =
                this.generateAffiliateLink(
                    prodId,
                    currentUser.uid
                );

            const sellerName =
                currentUser.displayName ||
                currentUser.nom ||
                "DAKPRO ÉLITE";

            const images = this.normalizeImages(
                product.images,
                product.productImage
            );

            const variants = this.currentVariants || [];

            const payload = {

                // IDENTIFICATION

                id: prodId,

                nom: product.productName,

                titre: product.productName,

                fournisseur: "CJdropshipping",

                cjPid: String(product.pid),

                sku: product.productSku || "",


                // PRIX FOURNISSEUR

                prixFournisseurUSD:
                    product.sellPrice,

                prixFournisseurFCFA:
                    calculation.supplierCost,

                prixFournisseur:
                    calculation.supplierCost,

                deviseFournisseur: "FCFA",

                tauxConversion:
                    settings.rate,


                // PRIX PUBLIC

                prix: calculation.finalPrice,

                prixPublic: calculation.finalPrice,

                devise: "FCFA",


                // MARGE COMMERCIALE

                margeBeneficiaire:
                    settings.margin,

                margeCommerciale:
                    settings.margin,

                montantMarge:
                    calculation.actualMargin,


                // COMMISSIONS SUR LA MARGE

                commissions: {

                    baseCalcul: "MARGE_COMMERCIALE",

                    vendeur: {

                        taux: 80,

                        montant:
                            calculation.commissions.seller,

                        statut: "en_attente"

                    },

                    affiliation: {

                        taux: 5,

                        montant:
                            calculation.commissions.affiliate,

                        statut: "non_attribue",

                        affiliéId: null

                    },

                    plateforme: {

                        taux: 15,

                        montant:
                            calculation.commissions.platform

                    }

                },


                // IMAGES

                image: product.productImage || "",

                images,


                // VARIANTES

                variantes: variants.map(variant => ({

                    vid: variant.vid || "",

                    sku: variant.sku || "",

                    nom: variant.name || "",

                    prixFournisseurUSD:
                        variant.price,

                    stock: variant.stock,

                    image: variant.image || ""

                })),


                // VENDEUR

                vendeurId: currentUser.uid,

                vendeurNom: sellerName,

                createdBy: currentUser.uid,


                // AFFILIATION

                affiliateLink,

                affiliateRef: null,

                sellerReferralId: currentUser.uid,

                affiliateTracking: {

                    actif: true,

                    parametre: "ref",

                    statut: "en_attente_de_commande",

                    attributionEffective: false

                },


                // STOCK

                stock: product.stock,

                stockVerifie:
                    this.currentInventory?.verified === true,


                // CATÉGORIE

                categorie:
                    product.categoryName || "",

                cjCategoryId:
                    product.categoryId || "",


                // DESCRIPTION

                description:
                    product.description || "",


                // LIVRAISON

                livraison: {

                    fournisseur: "CJdropshipping",

                    fraisExpeditionCalcules: false,

                    fraisExpedition: null,

                    statut: "a_calculer"

                },


                // PUBLICATION

                actif: Boolean(publishNow),

                statut:
                    publishNow
                        ? "actif"
                        : "brouillon",


                // INFORMATIONS COMPTABLES

                deviseComptable: "FCFA",

                commissionsCreditees: false,

                commandeCJ: false,

                prixCalculePar:
                    "api/product-pricing.js",


                // DATES

                createdAt: serverTimestamp(),

                updatedAt: serverTimestamp()

            };


            await set(
                publicationRef,
                payload
            );


            // CONFIRMATION

            content.innerHTML = `

                <div class="cj-success">

                    <div style="font-size:48px">
                        ${publishNow ? "🚀" : "📥"}
                    </div>

                    <h2>
                        ${
                            publishNow
                                ? "PRODUIT PUBLIÉ"
                                : "BROUILLON ENREGISTRÉ"
                        }
                    </h2>

                    <p style="color:#aaa;font-size:12px;line-height:1.8">

                        ${
                            publishNow
                                ? "Le produit a été enregistré comme publication active dans Firebase."
                                : "Le produit a été enregistré dans Firebase en tant que brouillon."
                        }

                    </p>

                    <div class="cj-section" style="text-align:left">

                        <p style="font-size:11px;color:#D4AF37">
                            IDENTIFIANT DU PRODUIT
                        </p>

                        <strong style="font-size:12px;word-break:break-all">
                            ${this.escapeHTML(prodId)}
                        </strong>

                        <p style="font-size:11px;color:#D4AF37;margin-top:18px">
                            LIEN DE PARTAGE
                        </p>

                        <p style="font-size:11px;color:white;word-break:break-all">
                            ${this.escapeHTML(affiliateLink)}
                        </p>

                        <button
                            id="cj-copy-affiliate"
                            class="cj-copy"
                        >
                            📋 COPIER LE LIEN
                        </button>

                    </div>

                    <button
                        id="cj-finish"
                        class="cj-action cj-publish"
                    >
                        TERMINER
                    </button>

                </div>

            `;


            content.querySelector("#cj-copy-affiliate")
                .addEventListener("click", async () => {

                    try {

                        await navigator.clipboard.writeText(
                            affiliateLink
                        );

                        alert(
                            "Lien copié avec succès."
                        );

                    } catch {

                        alert(
                            "Copie automatique indisponible. Sélectionnez le lien pour le copier."
                        );

                    }

                });


            content.querySelector("#cj-finish")
                .addEventListener("click", () => {
                    this.closeModal();
                });


        } catch (error) {

            console.error(
                "DAKPRO IMPORT:",
                error
            );

            alert(
                "Erreur d'importation : " +
                (error.message || "Une erreur est survenue.")
            );

            button.disabled = false;

            button.textContent = publishNow
                ? "🚀 PUBLIER SUR DAKPRO ÉLITE"
                : "📥 ENREGISTRER EN BROUILLON";

        } finally {

            this.importing = false;

        }

    }


    // ========================================================
    // FERMETURE MODAL
    // ========================================================

    closeModal() {

        const modal =
            this.container.querySelector("#cj-modal");

        modal.style.display = "none";

        this.selectedProduct = null;

        this.currentVariants = [];

        this.currentInventory = null;

    }


    // ========================================================
    // SÉCURITÉ AFFICHAGE HTML
    // ========================================================

    escapeHTML(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,
            character => ({

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#39;"

            })[character]

        );

    }

}


// ============================================================
// INITIALISATION DAKPRO ÉLITE
// ============================================================

export async function init() {

    if (!document.getElementById("module-container")) {

        console.error(
            "DAKPRO : module-container introuvable."
        );

        return;

    }

    window.dakproImporterInstance =
        new DakproCJImporter(
            "module-container"
        );

}