// ============================================================
// DAKPRO ÉLITE
// GLOBAL IMPORTER — VERSION RENFORCÉE
//
// CJ DROPSHIPPING V2
// FIREBASE REALTIME DATABASE
// CLOUDINARY
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

        this.searchController = null;

        this.render();

        this.events();

        this.loadCategories();

    }


    // ========================================================
    // INTERFACE
    // ========================================================

    render() {

        this.container.innerHTML = `

        <style>

        @import url(
        'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap'
        );

        .dakcj {
            background:#050505;
            color:white;
            min-height:100vh;
            padding:18px;
            font-family:Poppins,sans-serif;
        }

        .dakcj * {
            box-sizing:border-box;
        }

        .dakcj-header {
            display:flex;
            justify-content:space-between;
            align-items:center;
            flex-wrap:wrap;
            gap:12px;
            padding-bottom:18px;
            border-bottom:2px solid #D4AF37;
            margin-bottom:20px;
        }

        .dakcj-title {
            color:#FFD700;
            font-size:22px;
            font-weight:800;
            margin:0;
        }

        .dakcj-subtitle {
            color:#aaa;
            font-size:11px;
        }

        .dakcj-status {
            color:#FFD700;
            border:1px solid #D4AF37;
            padding:9px 12px;
            border-radius:8px;
            font-size:10px;
            font-weight:800;
        }

        .dakcj-search {
            display:grid;
            grid-template-columns:2fr 1fr auto;
            gap:10px;
            padding:14px;
            background:#111;
            border:1px solid #80651f;
            border-radius:10px;
        }

        .dakcj input,
        .dakcj select {
            width:100%;
            padding:12px;
            border-radius:7px;
            background:#080808;
            color:white;
            border:1px solid #555;
            font-family:inherit;
        }

        .dakcj button {
            cursor:pointer;
            font-family:inherit;
            font-weight:800;
        }

        .dakcj button:disabled {
            opacity:.45;
            cursor:not-allowed;
        }

        .dakcj-btn {
            background:linear-gradient(
                135deg,#D4AF37,#FFD700
            );
            color:#050505;
            border:0;
            border-radius:7px;
            padding:12px 17px;
        }

        .dakcj-info {
            color:#D4AF37;
            font-size:11px;
            margin:15px 0;
        }

        .dakcj-grid {
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:12px;
        }

        .dakcj-card {
            background:#111;
            border:1px solid #554719;
            border-radius:10px;
            overflow:hidden;
            transition:.25s;
        }

        .dakcj-card:hover {
            border-color:#FFD700;
            transform:translateY(-3px);
        }

        .dakcj-card img {
            width:100%;
            height:160px;
            object-fit:contain;
            background:#080808;
        }

        .dakcj-card-body {
            padding:11px;
        }

        .dakcj-name {
            font-size:11px;
            font-weight:600;
            min-height:38px;
        }

        .dakcj-price {
            color:#FFD700;
            font-weight:800;
            font-size:14px;
            margin:9px 0;
        }

        .dakcj-view {
            width:100%;
            padding:10px;
            background:#0759bd;
            color:white;
            border:0;
            border-radius:7px;
        }

        .dakcj-pages {
            display:flex;
            justify-content:center;
            align-items:center;
            gap:15px;
            margin:25px 0;
        }

        .dakcj-pages button {
            background:#111;
            color:#FFD700;
            border:1px solid #D4AF37;
            padding:10px 15px;
            border-radius:7px;
        }

        .dakcj-modal {
            display:none;
            position:fixed;
            inset:0;
            z-index:999999;
            background:#000e;
            align-items:center;
            justify-content:center;
            padding:12px;
        }

        .dakcj-modal-box {
            background:#101010;
            border:1px solid #D4AF37;
            border-radius:12px;
            width:100%;
            max-width:850px;
            max-height:92vh;
            overflow:auto;
            padding:20px;
        }

        .dakcj-close {
            float:right;
            background:#080808;
            border:1px solid #D4AF37;
            color:#FFD700;
            border-radius:50%;
            width:34px;
            height:34px;
        }

        .dakcj-detail {
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:20px;
            clear:both;
            padding-top:15px;
        }

        .dakcj-detail img {
            width:100%;
            max-height:300px;
            object-fit:contain;
            background:#080808;
            border:1px solid #554719;
            border-radius:8px;
        }

        .dakcj-section {
            background:#090909;
            border:1px solid #554719;
            border-radius:8px;
            padding:13px;
            margin-bottom:12px;
        }

        .dakcj-section h3 {
            color:#FFD700;
            font-size:12px;
        }

        .dakcj-label {
            display:block;
            color:#D4AF37;
            font-size:10px;
            margin:12px 0 5px;
        }

        .dakcj-result {
            color:#FFD700;
            font-size:23px;
            font-weight:800;
        }

        .dakcj-action {
            width:100%;
            padding:13px;
            border:0;
            border-radius:7px;
            margin-top:10px;
        }

        .dakcj-publish {
            background:linear-gradient(
                135deg,#D4AF37,#FFD700
            );
            color:#050505;
        }

        .dakcj-draft {
            background:#111;
            border:1px solid #D4AF37;
            color:#FFD700;
        }

        .dakcj-message {
            grid-column:1/-1;
            text-align:center;
            padding:30px;
            color:#ffb3b3;
            border:1px dashed #ff4d4d;
            border-radius:10px;
            background:#200;
        }

        .dakcj-video {
            width:100%;
            max-height:220px;
            margin-top:10px;
            background:#000;
        }

        @media(min-width:700px) {

            .dakcj-grid {
                grid-template-columns:repeat(4,minmax(0,1fr));
            }

        }

        @media(min-width:1200px) {

            .dakcj-grid {
                grid-template-columns:repeat(6,minmax(0,1fr));
            }

        }

        @media(max-width:650px) {

            .dakcj {
                padding:10px;
            }

            .dakcj-search {
                grid-template-columns:1fr;
            }

            .dakcj-detail {
                grid-template-columns:1fr;
            }

        }

        </style>


        <section class="dakcj">

            <header class="dakcj-header">

                <div>

                    <h2 class="dakcj-title">

                        DAKPRO ÉLITE

                        <span style="color:#087bff">
                            GLOBAL IMPORTER
                        </span>

                    </h2>

                    <div class="dakcj-subtitle">

                        Catalogue international CJ Dropshipping

                    </div>

                </div>

                <span class="dakcj-status" id="dakcj-status">

                    ● INITIALISATION

                </span>

            </header>


            <div class="dakcj-search">

                <input
                    id="dakcj-keyword"
                    type="search"
                    placeholder="Rechercher un produit CJ..."
                >

                <input
                    id="dakcj-category"
                    list="dakcj-categories"
                    placeholder="Catégorie CJ"
                >

                <datalist id="dakcj-categories"></datalist>

                <button
                    class="dakcj-btn"
                    id="dakcj-search"
                >

                    RECHERCHER

                </button>

            </div>


            <div class="dakcj-info" id="dakcj-info">

                Prêt pour la recherche de produits.

            </div>


            <div class="dakcj-grid" id="dakcj-grid">

                <div class="dakcj-message"
                     style="color:#aaa;border-color:#D4AF37;background:#111">

                    DAKPRO ÉLITE — GLOBAL IMPORTER

                    <br><br>

                    Saisissez un mot-clé pour interroger CJ Dropshipping.

                </div>

            </div>


            <div class="dakcj-pages">

                <button id="dakcj-prev" disabled>

                    ← Précédent

                </button>

                <span id="dakcj-page">

                    Page 1 / 1

                </span>

                <button id="dakcj-next" disabled>

                    Suivant →

                </button>

            </div>


            <div class="dakcj-modal" id="dakcj-modal">

                <div class="dakcj-modal-box">

                    <button
                        class="dakcj-close"
                        id="dakcj-close"
                    >

                        ×

                    </button>

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

        const timeout = setTimeout(
            () => controller.abort(),
            CONFIG.timeout
        );

        try {

            const url = new URL(CONFIG.API);

            url.searchParams.set("action", action);

            Object.entries(params).forEach(([key, value]) => {

                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {

                    url.searchParams.set(
                        key,
                        typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)
                    );

                }

            });


            const response = await fetch(url.toString(), {

                method: "GET",

                mode: "cors",

                headers: {

                    "Accept": "application/json"

                },

                signal: controller.signal

            });


            const text = await response.text();

            let result;

            try {

                result = JSON.parse(text);

            } catch {

                throw new Error(
                    "Réponse JSON invalide du serveur CJ."
                );

            }


            if (!response.ok || result.success === false) {

                let message =
                    result.message ||
                    result.error ||
                    `Erreur HTTP ${response.status}`;

                if (typeof message === "object") {

                    message = JSON.stringify(message);

                }

                throw new Error(message);

            }

            return result;

        } catch (error) {

            if (error.name === "AbortError") {

                throw new Error(
                    "Le serveur CJ met trop de temps à répondre."
                );

            }

            throw error;

        } finally {

            clearTimeout(timeout);

        }

    }


    // ========================================================
    // EXTRACTION DES DONNÉES
    // ========================================================

    getData(response) {

        return (
            response?.data ??
            response?.resultData ??
            response?.result ??
            response
        );

    }


    getProductList(response) {

        const data = this.getData(response);

        if (!data) return [];

        if (Array.isArray(data.productList)) {

            return data.productList;

        }

        if (Array.isArray(data.content)) {

            const products = data.content.flatMap(item => {

                if (Array.isArray(item?.productList)) {

                    return item.productList;

                }

                return [];

            });

            if (products.length) return products;

        }

        if (Array.isArray(data.list)) {

            return data.list;

        }

        if (Array.isArray(data.items)) {

            return data.items;

        }

        return [];

    }


    getList(response) {

        const data = this.getData(response);

        if (Array.isArray(data)) return data;

        const candidates = [

            data?.list,

            data?.variants,

            data?.items,

            data?.content,

            data?.tree

        ];

        return candidates.find(Array.isArray) || [];

    }


    getObject(response) {

        let data = this.getData(response);

        if (Array.isArray(data)) {

            data = data[0] || {};

        }

        if (data?.list && Array.isArray(data.list)) {

            data = data.list[0] || {};

        }

        return data && typeof data === "object"
            ? data
            : {};

    }


    // ========================================================
    // ÉVÉNEMENTS
    // ========================================================

    events() {

        const $ = selector =>
            this.container.querySelector(selector);


        $("#dakcj-search").addEventListener(
            "click",
            () => {

                this.keyword = $(
                    "#dakcj-keyword"
                ).value.trim();

                this.categoryId = this.getCategoryId(
                    $("#dakcj-category").value.trim()
                );

                this.page = 1;

                this.search();

            }
        );


        $("#dakcj-keyword").addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    $("#dakcj-search").click();

                }

            }
        );


        $("#dakcj-prev").addEventListener(
            "click",
            () => {

                if (this.page > 1 && !this.loading) {

                    this.page--;

                    this.search();

                }

            }
        );


        $("#dakcj-next").addEventListener(
            "click",
            () => {

                if (
                    this.page < this.totalPages &&
                    !this.loading
                ) {

                    this.page++;

                    this.search();

                }

            }
        );


        $("#dakcj-close").addEventListener(
            "click",
            () => this.close()
        );


        $("#dakcj-modal").addEventListener(
            "click",
            event => {

                if (event.target.id === "dakcj-modal") {

                    this.close();

                }

            }
        );

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

                    if (!item || typeof item !== "object") {
                        return;
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

                            name: String(name),

                            parent

                        });

                    }


                    const children =
                        item.categoryFirstList ||
                        item.categorySecondList ||
                        item.children ||
                        item.list;


                    if (Array.isArray(children)) {

                        visit(children, name || parent);

                    }

                });

            };


            visit(categories);

            this.categories = flattened;


            const unique = [
                ...new Map(
                    flattened.map(item => [
                        item.id,
                        item
                    ])
                ).values()
            ];


            const element = this.container.querySelector(
                "#dakcj-categories"
            );


            element.innerHTML = unique.map(item => `

                <option
                    value="${this.escape(item.name)}"
                    data-id="${this.escape(item.id)}"
                ></option>

            `).join("");


            this.status("● CONNECTEUR CJ PRÊT");

        } catch (error) {

            console.warn(
                "CJ catégories :",
                error.message
            );

            this.status("● ERREUR CATÉGORIES");

        }

    }


    getCategoryId(value) {

        const category = this.categories.find(
            item =>
                item.name.toLowerCase() === value.toLowerCase() ||
                item.id === value
        );

        return category ? category.id : value;

    }


    // ========================================================
    // RECHERCHE DU CATALOGUE
    // ========================================================

    async search() {

        if (this.loading) return;

        this.loading = true;


        const grid = this.container.querySelector(
            "#dakcj-grid"
        );

        const info = this.container.querySelector(
            "#dakcj-info"
        );


        grid.innerHTML = `

            <div class="dakcj-message"
                 style="color:#FFD700;border-color:#D4AF37;background:#111">

                Recherche du catalogue CJ en cours...

            </div>

        `;


        this.status("● RECHERCHE EN COURS");


        try {

            const response = await this.api("products", {

                keyWord: this.keyword,

                categoryId: this.categoryId,

                page: this.page,

                size: Math.min(
                    CONFIG.pageSize,
                    CONFIG.maxPageSize
                ),

                features: [
                    "enable_description",
                    "enable_category"
                ]

            });


            const data = this.getData(response);

            const list = this.getProductList(response);


            this.totalRecords = Number(
                data?.totalRecords ??
                data?.total ??
                0
            );


            this.totalPages = Math.min(

                Number(
                    data?.totalPages ??
                    Math.ceil(
                        this.totalRecords / CONFIG.pageSize
                    ) ??
                    1
                ) || 1,

                1000

            );


            if (!list.length) {

                grid.innerHTML = `

                    <div class="dakcj-message">

                        Aucun produit trouvé.

                        <br><br>

                        Essayez un autre mot-clé.

                    </div>

                `;

                info.textContent = "Aucun résultat.";

                return;

            }


            this.products.clear();


            const products = list.map(item => {

                const pid = String(

                    item.id ||
                    item.pid ||
                    item.productId ||
                    ""

                );


                const images = this.images(

                    item.productImageSet ||
                    item.images,

                    item.bigImage ||
                    item.productImage

                );


                const product = {

                    pid,

                    name:

                        item.nameEn ||
                        item.productNameEn ||
                        item.productName ||
                        item.name ||
                        "Produit CJ",


                    image:

                        item.bigImage ||
                        item.productImage ||
                        images[0] ||
                        "",


                    images,


                    sku:

                        item.sku ||
                        item.productSku ||
                        "",


                    price: this.number(

                        item.sellPrice ??
                        item.nowPrice ??
                        item.discountPrice ??
                        item.productPrice

                    ),


                    stock: this.stock({

                        stock: item.warehouseInventoryNum,

                        inventory: item.totalVerifiedInventory,

                        quantity: item.totalInventory

                    }),


                    categoryId:
                        item.categoryId || "",


                    categoryName:

                        item.threeCategoryName ||
                        item.categoryName ||
                        "",


                    description:
                        item.description || "",


                    raw: item

                };


                if (pid) {

                    this.products.set(pid, product);

                }


                return product;

            }).filter(product => product.pid);


            this.renderProducts(products);


            info.textContent =

                `${this.totalRecords.toLocaleString("fr-FR")}` +

                ` produits disponibles — Page ${this.page}` +

                ` / ${this.totalPages}`;


            this.status("● CATALOGUE CJ CONNECTÉ");


        } catch (error) {

            console.error(error);


            grid.innerHTML = `

                <div class="dakcj-message">

                    ERREUR API CJ

                    <br><br>

                    ${this.escape(error.message)}

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

        const grid = this.container.querySelector(
            "#dakcj-grid"
        );


        if (!products.length) {

            grid.innerHTML = `

                <div class="dakcj-message">

                    Aucun produit valide.

                </div>

            `;

            return;

        }


        grid.innerHTML = products.map(product => `

            <article class="dakcj-card">

                ${
                    product.image

                    ? `

                    <img

                        src="${this.escape(product.image)}"

                        alt="${this.escape(product.name)}"

                        loading="lazy"

                        referrerpolicy="no-referrer"

                    >

                    `

                    : `

                    <div style="height:160px;text-align:center;padding:60px 5px;color:#888">

                        Image indisponible

                    </div>

                    `
                }


                <div class="dakcj-card-body">

                    <div class="dakcj-name">

                        ${this.escape(product.name)}

                    </div>


                    <div class="dakcj-price">

                        ${
                            product.price !== null

                            ? "$" + product.price.toFixed(2)

                            : "Prix indisponible"
                        }

                    </div>


                    <button

                        class="dakcj-view"

                        data-pid="${this.escape(product.pid)}"

                    >

                        VOIR LE PRODUIT

                    </button>

                </div>

            </article>

        `).join("");


        grid.querySelectorAll("[data-pid]").forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    this.openProduct(button.dataset.pid);

                }
            );

        });

    }


    // ========================================================
    // DÉTAILS PRODUIT ET VARIANTES
    // ========================================================

    async openProduct(pid) {

        const product = this.products.get(String(pid));

        if (!product) return;


        this.product = product;


        const modal = this.container.querySelector(
            "#dakcj-modal"
        );

        const content = this.container.querySelector(
            "#dakcj-detail-content"
        );


        modal.style.display = "flex";


        content.innerHTML = `

            <div class="dakcj-message"
                 style="color:#FFD700;border-color:#D4AF37;background:#111">

                Chargement des informations du produit...

            </div>

        `;


        try {

            const results = await Promise.allSettled([

                this.api("detail", {
                    pid: product.pid
                }),

                this.api("variants", {
                    pid: product.pid
                })

            ]);


            if (results[0].status === "fulfilled") {

                const details = this.getObject(
                    results[0].value
                );


                product.name =

                    details.productNameEn ||
                    details.nameEn ||
                    details.productName ||
                    product.name;


                product.description =

                    details.description ||
                    details.productDescription ||
                    product.description;


                product.sku =

                    details.productSku ||
                    details.sku ||
                    product.sku;


                product.image =

                    details.productImage ||
                    details.bigImage ||
                    product.image;


                product.images = this.images(

                    details.productImageSet ||
                    details.images,

                    product.image

                );


                product.price = this.number(

                    details.sellPrice ??
                    details.nowPrice ??
                    details.supplierPrice ??
                    details.productPrice ??
                    product.price

                );

            }


            this.variants =

                results[1].status === "fulfilled"

                ? this.getList(results[1].value)

                : [];


            this.inventory = null;


            this.renderDetail();


        } catch (error) {

            content.innerHTML = `

                <div class="dakcj-message">

                    Erreur :

                    ${this.escape(error.message)}

                </div>

            `;

        }

    }


    // ========================================================
    // INTERFACE DES DÉTAILS
    // ========================================================

    renderDetail() {

        const content = this.container.querySelector(
            "#dakcj-detail-content"
        );


        const variants = this.variants.map(
            (item, index) => `

                <option value="${index}">

                    ${this.escape(

                        item.variantNameEn ||

                        item.variantName ||

                        item.name ||

                        item.variantSku ||

                        "Variante " + (index + 1)

                    )}

                </option>

            `
        ).join("");


        content.innerHTML = `

            <h2 style="color:#FFD700;font-size:18px">

                ${this.escape(this.product.name)}

            </h2>


            <div class="dakcj-detail">

                <div>


                    ${
                        this.product.image

                        ? `

                        <img

                            src="${this.escape(this.product.image)}"

                            alt="${this.escape(this.product.name)}"

                        >

                        `

                        : ""

                    }


                    <p style="color:#aaa;font-size:11px">

                        FOURNISSEUR : CJ DROPSHIPPING

                    </p>


                    <p style="color:#FFD700;font-size:13px">

                        Prix fournisseur :

                        ${
                            this.product.price !== null

                            ? "$" + this.product.price

                            : "Indisponible"
                        }

                    </p>


                    <p style="font-size:11px;color:#aaa">

                        SKU :

                        ${this.escape(this.product.sku)}

                    </p>


                    <label class="dakcj-label">

                        VARIANTES

                    </label>


                    <select id="dakcj-variant">

                        <option value="">

                            Produit standard

                        </option>

                        ${variants}

                    </select>


                    <div class="dakcj-section">

                        <h3>DESCRIPTION</h3>

                        <p style="font-size:11px;color:#ccc">

                            ${this.escape(this.product.description)}

                        </p>

                    </div>

                </div>


                <div>

                    <div class="dakcj-section">

                        <h3>PARAMÈTRES COMMERCIAUX</h3>


                        <label class="dakcj-label">

                            TAUX USD / FCFA

                        </label>


                        <input

                            id="dakcj-rate"

                            type="number"

                            min="1"

                            value="${CONFIG.exchangeRate}"

                        >


                        <label class="dakcj-label">

                            MARGE COMMERCIALE (%)

                        </label>


                        <input

                            id="dakcj-margin"

                            type="number"

                            min="0"

                            max="1000"

                            value="${CONFIG.marginPercent}"

                        >

                    </div>


                    <div class="dakcj-section">

                        <h3>PRIX PUBLIC</h3>


                        <div

                            class="dakcj-result"

                            id="dakcj-price"

                        >

                            Calcul...

                        </div>


                        <div

                            id="dakcj-cost"

                            style="font-size:11px;color:#aaa;margin-top:10px"

                        ></div>

                    </div>


                    <button

                        id="dakcj-draft"

                        class="dakcj-action dakcj-draft"

                    >

                        ENREGISTRER EN BROUILLON

                    </button>


                    <button

                        id="dakcj-publish"

                        class="dakcj-action dakcj-publish"

                    >

                        PUBLIER SUR DAKPRO ÉLITE

                    </button>

                </div>

            </div>

        `;


        content.querySelector(
            "#dakcj-rate"
        ).addEventListener(
            "input",
            () => this.previewPrice()
        );


        content.querySelector(
            "#dakcj-margin"
        ).addEventListener(
            "input",
            () => this.previewPrice()
        );


        content.querySelector(
            "#dakcj-variant"
        ).addEventListener(
            "change",
            () => this.previewPrice()
        );


        content.querySelector(
            "#dakcj-draft"
        ).addEventListener(
            "click",
            () => this.publish(false)
        );


        content.querySelector(
            "#dakcj-publish"
        ).addEventListener(
            "click",
            () => this.publish(true)
        );


        this.previewPrice();

    }


    // ========================================================
    // CALCUL DES PRIX
    // ========================================================

    calculatePrice() {

        const rate = Number(

            this.container.querySelector(
                "#dakcj-rate"
            ).value

        );


        const margin = Number(

            this.container.querySelector(
                "#dakcj-margin"
            ).value

        );


        const variantIndex = this.container.querySelector(
            "#dakcj-variant"
        ).value;


        const selectedVariant =

            variantIndex !== ""

            ? this.variants[Number(variantIndex)]

            : null;


        const supplierPrice = this.number(

            selectedVariant?.variantSellPrice ??

            selectedVariant?.sellPrice ??

            selectedVariant?.variantPrice ??

            this.product.price

        );


        if (!Number.isFinite(rate) || rate <= 0) {

            throw new Error("Taux de conversion invalide.");

        }


        if (
            !Number.isFinite(margin) ||
            margin < 0 ||
            margin > 1000
        ) {

            throw new Error("Marge commerciale invalide.");

        }


        if (supplierPrice === null || supplierPrice <= 0) {

            throw new Error(
                "Prix fournisseur CJ indisponible."
            );

        }


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

                seller: Math.round(
                    marginFCFA *
                    CONFIG.commissions.seller / 100
                ),

                affiliate: Math.round(
                    marginFCFA *
                    CONFIG.commissions.affiliate / 100
                ),

                platform: Math.round(
                    marginFCFA *
                    CONFIG.commissions.platform / 100
                )

            }

        };

    }


    // ========================================================
    // APERÇU DU PRIX
    // ========================================================

    previewPrice() {

        try {

            const result = this.calculatePrice();


            this.container.querySelector(
                "#dakcj-price"
            ).textContent = this.fcfa(
                result.finalPrice
            );


            this.container.querySelector(
                "#dakcj-cost"
            ).innerHTML = `

                Coût fournisseur :

                <strong>

                    ${this.fcfa(result.supplierCost)}

                </strong>

                <br>


                Marge commerciale :

                <strong>

                    ${this.fcfa(result.marginFCFA)}

                </strong>

                <br><br>


                Vendeur 80 % :

                <strong>

                    ${this.fcfa(result.commissions.seller)}

                </strong>

                <br>


                Affiliation 5 % :

                <strong>

                    ${this.fcfa(result.commissions.affiliate)}

                </strong>

                <br>


                DAKPRO 15 % :

                <strong>

                    ${this.fcfa(result.commissions.platform)}

                </strong>

            `;


        } catch (error) {

            this.container.querySelector(
                "#dakcj-price"
            ).textContent = "Calcul indisponible";


            this.container.querySelector(
                "#dakcj-cost"
            ).textContent = error.message;

        }

    }


    // ========================================================
    // CLOUDINARY
    // ========================================================

    async uploadRemoteToCloudinary(remoteUrl) {

        if (!remoteUrl) return "";


        const endpoint =

            `https://api.cloudinary.com/v1_1/` +

            `${CONFIG.CLOUDINARY.cloudName}/image/upload`;


        const form = new FormData();


        form.append("file", remoteUrl);

        form.append(
            "upload_preset",
            CONFIG.CLOUDINARY.uploadPreset
        );

        form.append(
            "folder",
            CONFIG.CLOUDINARY.folder
        );


        const response = await fetch(endpoint, {

            method: "POST",

            body: form

        });


        const data = await response.json();


        if (!response.ok || !data.secure_url) {

            throw new Error(

                data.error?.message ||

                "Transfert Cloudinary impossible."

            );

        }


        return data.secure_url;

    }


    // ========================================================
    // TRANSFERT DES IMAGES
    // ========================================================

    async transferProductMedia() {

        const sourceImages = [

            ...new Set([

                this.product.image,

                ...(this.product.images || [])

            ].filter(Boolean))

        ];


        const cloudImages = [];


        for (const imageUrl of sourceImages) {

            try {

                const cloudUrl = await this.uploadRemoteToCloudinary(
                    imageUrl
                );

                cloudImages.push(cloudUrl);

            } catch (error) {

                console.warn(
                    "Image Cloudinary :",
                    error.message
                );

                // On conserve la source CJ comme solution
                // de secours, sans prétendre qu'elle est
                // hébergée sur Cloudinary.

                cloudImages.push(imageUrl);

            }

        }


        return {

            image: cloudImages[0] || "",

            images: cloudImages

        };

    }


    // ========================================================
    // PUBLICATION FIREBASE
    // ========================================================

    async publish(publishNow) {

        if (this.importing) return;


        const currentUser =

            window.currentUser ||

            this.auth.currentUser;


        if (!currentUser) {

            alert(
                "Connectez-vous avant d'importer un produit."
            );

            return;

        }


        this.importing = true;


        const draftButton = this.container.querySelector(
            "#dakcj-draft"
        );


        const publishButton = this.container.querySelector(
            "#dakcj-publish"
        );


        [draftButton, publishButton].forEach(button => {

            if (button) {

                button.disabled = true;

                button.textContent = "IMPORTATION EN COURS...";

            }

        });


        try {

            const calculation = this.calculatePrice();


            const media = await this.transferProductMedia();


            const selectedVariant =
                calculation.selectedVariant;


            const publicationRef = push(

                ref(
                    this.db,
                    CONFIG.FIREBASE_PATH
                )

            );


            const productId = publicationRef.key;


            if (!productId) {

                throw new Error(
                    "Impossible de créer l'identifiant du produit."
                );

            }


            // IMPORTANT :
            // On conserve les identifiants DAKPRO Firebase.
            // Le pid CJ reste dans cjPid.

            const affiliateLink = new URL(

                window.DAKPRO_CONFIG?.productPageUrl ||

                "index.html",

                window.location.origin

            );


            affiliateLink.searchParams.set(
                "produit",
                productId
            );


            affiliateLink.searchParams.set(
                "ref",
                currentUser.uid
            );


            const payload = {

                id: productId,

                nom: this.product.name,

                titre: this.product.name,

                fournisseur: "CJdropshipping",

                cjPid: String(this.product.pid),

                sku:

                    selectedVariant?.variantSku ||

                    selectedVariant?.sku ||

                    this.product.sku ||

                    "",


                prixFournisseurUSD:
                    calculation.supplierPrice,


                prixFournisseurFCFA:
                    calculation.supplierCost,


                tauxConversion:
                    calculation.rate,


                prix:
                    calculation.finalPrice,


                prixPublic:
                    calculation.finalPrice,


                devise: "FCFA",


                margeBeneficiaire:
                    calculation.margin,


                montantMarge:
                    calculation.marginFCFA,


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

                        affilieId: null

                    },


                    plateforme: {

                        taux: 15,

                        montant:
                            calculation.commissions.platform

                    }

                },


                image: media.image,

                images: media.images,


                imageSourceCJ:
                    this.product.image,


                variantes: this.variants.map(v => ({

                    vid: String(
                        v.vid ||
                        v.variantId ||
                        ""
                    ),

                    sku:
                        v.variantSku ||
                        v.sku ||
                        "",

                    nom:

                        v.variantNameEn ||

                        v.variantName ||

                        v.name ||

                        "",

                    image:
                        v.variantImage ||
                        v.image ||
                        "",

                    prix: this.number(
                        v.variantSellPrice ??
                        v.sellPrice ??
                        v.variantPrice
                    ),

                    poids:
                        v.variantWeight ?? null,

                    longueur:
                        v.variantLength ?? null,

                    largeur:
                        v.variantWidth ?? null,

                    hauteur:
                        v.variantHeight ?? null

                })),


                varianteSelectionnee:

                    selectedVariant

                    ? {

                        vid: String(
                            selectedVariant.vid ||
                            selectedVariant.variantId ||
                            ""
                        ),

                        sku:
                            selectedVariant.variantSku ||
                            selectedVariant.sku ||
                            "",

                        nom:

                            selectedVariant.variantNameEn ||

                            selectedVariant.variantName ||

                            selectedVariant.name ||

                            ""

                    }

                    : null,


                vendeurId:
                    currentUser.uid,


                vendeurNom:

                    currentUser.displayName ||

                    currentUser.nom ||

                    "DAKPRO ÉLITE",


                createdBy:
                    currentUser.uid,


                affiliateLink:
                    affiliateLink.toString(),


                stock:
                    this.product.stock ?? null,


                categorie:
                    this.product.categoryName || "",


                description:
                    this.product.description || "",


                actif:
                    Boolean(publishNow),


                statut:

                    publishNow

                    ? "actif"

                    : "brouillon",


                createdAt:
                    serverTimestamp(),


                updatedAt:
                    serverTimestamp()

            };


            await set(publicationRef, payload);


            this.showSuccess(

                productId,

                affiliateLink.toString(),

                publishNow

            );


        } catch (error) {

            console.error(
                "DAKPRO IMPORT ERROR:",
                error
            );


            alert(
                "Erreur d'importation : " +
                error.message
            );


            [draftButton, publishButton].forEach(
                (button, index) => {

                    if (button) {

                        button.disabled = false;


                        button.textContent =

                            index === 0

                            ? "ENREGISTRER EN BROUILLON"

                            : "PUBLIER SUR DAKPRO ÉLITE";

                    }

                }
            );


        } finally {

            this.importing = false;

        }

    }


    // ========================================================
    // CONFIRMATION
    // ========================================================

    showSuccess(productId, link, published) {

        const content = this.container.querySelector(
            "#dakcj-detail-content"
        );


        content.innerHTML = `

            <div style="text-align:center;padding:25px 5px">


                <div style="font-size:45px">

                    ${published ? "🚀" : "📥"}

                </div>


                <h2 style="color:#FFD700">

                    ${
                        published

                        ? "PRODUIT PUBLIÉ"

                        : "BROUILLON ENREGISTRÉ"
                    }

                </h2>


                <div class="dakcj-section"
                     style="text-align:left">


                    <p style="color:#D4AF37;font-size:11px">

                        IDENTIFIANT DU PRODUIT

                    </p>


                    <strong style="word-break:break-all">

                        ${this.escape(productId)}

                    </strong>


                    <p style="color:#D4AF37;font-size:11px;margin-top:18px">

                        LIEN DU PRODUIT

                    </p>


                    <p style="font-size:11px;word-break:break-all">

                        ${this.escape(link)}

                    </p>


                    <button

                        id="dakcj-copy"

                        class="dakcj-action dakcj-publish"

                    >

                        COPIER LE LIEN

                    </button>


                </div>


                <button

                    id="dakcj-finish"

                    class="dakcj-action dakcj-draft"

                >

                    TERMINER

                </button>


            </div>

        `;


        content.querySelector(
            "#dakcj-copy"
        ).addEventListener(
            "click",
            async () => {

                try {

                    await navigator.clipboard.writeText(link);

                    alert("Lien copié avec succès.");

                } catch {

                    alert("Copie impossible sur cet appareil.");

                }

            }
        );


        content.querySelector(
            "#dakcj-finish"
        ).addEventListener(
            "click",
            () => this.close()
        );

    }


    // ========================================================
    // UTILITAIRES
    // ========================================================

    images(value, mainImage) {

        let list = [];


        if (typeof value === "string") {

            try {

                value = JSON.parse(value);

            } catch {

                value = [value];

            }

        }


        if (Array.isArray(value)) {

            list = value.map(item =>

                typeof item === "string"

                    ? item

                    : item?.url ||

                      item?.image ||

                      item?.imageUrl ||

                      item?.bigImage ||

                      ""

            ).filter(Boolean);

        }


        if (mainImage) {

            list.unshift(mainImage);

        }


        return [...new Set(list)];

    }


    number(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return null;

        }


        const result = Number(

            String(value)

                .replace(",", ".")

                .replace(/[^\d.]/g, "")

        );


        return Number.isFinite(result) && result > 0

            ? result

            : null;

    }


    stock(product) {

        for (const value of [

            product?.stock,

            product?.inventory,

            product?.quantity,

            product?.totalInventory

        ]) {

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


    fcfa(value) {

        return Math.round(
            Number(value) || 0
        ).toLocaleString("fr-FR") + " FCFA";

    }


    escape(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,
            c => ({

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#39;"

            })[c]
        );

    }


    status(message) {

        const element = this.container.querySelector(
            "#dakcj-status"
        );

        if (element) {

            element.textContent = message;

        }

    }


    pagination() {

        const prev = this.container.querySelector(
            "#dakcj-prev"
        );

        const next = this.container.querySelector(
            "#dakcj-next"
        );

        const page = this.container.querySelector(
            "#dakcj-page"
        );


        if (page) {

            page.textContent =

                `Page ${this.page} / ${this.totalPages}`;

        }


        if (prev) {

            prev.disabled =

                this.loading ||

                this.page <= 1;

        }


        if (next) {

            next.disabled =

                this.loading ||

                this.page >= this.totalPages;

        }

    }


    close() {

        const modal = this.container.querySelector(
            "#dakcj-modal"
        );


        if (modal) {

            modal.style.display = "none";

        }


        this.product = null;

        this.variants = [];

        this.inventory = null;

    }

}


// ============================================================
// INITIALISATION
// ============================================================

export function init() {

    const container = document.getElementById(
        "module-container"
    );


    if (!container) {

        console.error(
            "DAKPRO : module-container introuvable."
        );

        return null;

    }


    if (window.dakproImporterInstance) {

        return window.dakproImporterInstance;

    }


    window.dakproImporterInstance =

        new DakproCJImporter(
            "module-container"
        );


    return window.dakproImporterInstance;

}


// ============================================================
// FIN DU MODULE
// DAKPRO ÉLITE GLOBAL IMPORTER
// ============================================================