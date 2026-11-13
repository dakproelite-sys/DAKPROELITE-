// ======================================================
// DAKPRO ÉLITE — GLOBAL IMPORTER
// CJ DROPSHIPPING + CLOUDINARY + FIREBASE
// FICHIER : dakpro-global-importer.js
// ======================================================

import {
    getDatabase, ref, push, set, get,
    query, orderByChild, equalTo, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ================= CONFIGURATION =================

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
    timeout: 30000
};

// ================= CLASSE PRINCIPALE =================

class DakproCJImporter {

    constructor(containerId = "module-container") {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.db = getDatabase();
        this.auth = getAuth();

        this.page = 1;
        this.totalPages = 1;
        this.keyword = "";
        this.categoryId = "";

        this.categories = [];
        this.products = new Map();
        this.product = null;
        this.variants = [];
        this.inventory = null;

        this.loading = false;
        this.importing = false;
        this.searchNumber = 0;

        this.render();
        this.events();
        this.loadCategories();
    }

    // ================= INTERFACE =================

    render() {
        this.container.innerHTML = `
        <style>
        .dakcj {
            background:#050505;color:white;min-height:100vh;
            padding:15px;font-family:Arial,sans-serif;
        }
        .dakcj * {box-sizing:border-box}
        .dakcj-header {
            display:flex;justify-content:space-between;
            align-items:center;flex-wrap:wrap;gap:10px;
            border-bottom:2px solid #D4AF37;padding-bottom:15px;
        }
        .dakcj-title {color:#FFD700;font-size:21px;font-weight:bold}
        .dakcj-status {
            color:#FFD700;border:1px solid #D4AF37;
            padding:9px;border-radius:7px;font-size:10px;
        }
        .dakcj-search {
            display:grid;grid-template-columns:2fr 1fr auto;
            gap:9px;background:#111;padding:12px;
            border:1px solid #80651f;border-radius:9px;margin-top:15px;
        }
        .dakcj input,.dakcj select {
            width:100%;padding:12px;background:#080808;
            color:white;border:1px solid #555;border-radius:7px;
        }
        .dakcj button {cursor:pointer;font-weight:bold}
        .dakcj button:disabled {opacity:.5}
        .dakcj-btn {
            background:linear-gradient(135deg,#D4AF37,#FFD700);
            color:black;border:0;border-radius:7px;padding:12px;
        }
        .dakcj-info {color:#D4AF37;font-size:12px;margin:15px 0}
        .dakcj-grid {
            display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
            gap:12px;
        }
        .dakcj-card {
            background:#111;border:1px solid #554719;
            border-radius:9px;overflow:hidden;
        }
        .dakcj-card img {
            width:100%;height:150px;object-fit:contain;background:#080808;
        }
        .dakcj-card-body {padding:10px}
        .dakcj-name {font-size:12px;min-height:35px}
        .dakcj-price {color:#FFD700;font-weight:bold;margin:10px 0}
        .dakcj-view {
            width:100%;padding:10px;background:#0759bd;
            color:white;border:0;border-radius:6px;
        }
        .dakcj-pages {
            display:flex;justify-content:center;align-items:center;
            gap:15px;margin:25px 0;
        }
        .dakcj-pages button {
            padding:10px;background:#111;color:#FFD700;
            border:1px solid #D4AF37;border-radius:6px;
        }
        .dakcj-modal {
            display:none;position:fixed;inset:0;z-index:999999;
            background:#000e;align-items:center;justify-content:center;padding:10px;
        }
        .dakcj-modal-box {
            width:100%;max-width:850px;max-height:92vh;overflow:auto;
            background:#101010;border:1px solid #D4AF37;
            border-radius:12px;padding:17px;
        }
        .dakcj-close {
            float:right;background:#080808;color:#FFD700;
            border:1px solid #D4AF37;border-radius:50%;
            width:35px;height:35px;
        }
        .dakcj-detail {
            display:grid;grid-template-columns:1fr 1fr;
            gap:15px;clear:both;padding-top:15px;
        }
        .dakcj-detail img {
            width:100%;max-height:280px;object-fit:contain;
            background:#080808;border-radius:8px;
        }
        .dakcj-section {
            background:#090909;border:1px solid #554719;
            border-radius:8px;padding:12px;margin-bottom:12px;
        }
        .dakcj-section h3,.dakcj-label {color:#FFD700}
        .dakcj-label {display:block;font-size:11px;margin:10px 0 5px}
        .dakcj-result {font-size:23px;color:#FFD700;font-weight:bold}
        .dakcj-action {
            width:100%;padding:13px;border:0;
            border-radius:7px;margin-top:10px;
        }
        .dakcj-publish {
            background:linear-gradient(135deg,#D4AF37,#FFD700);color:black;
        }
        .dakcj-draft {
            background:#111;border:1px solid #D4AF37;color:#FFD700;
        }
        .dakcj-message {
            grid-column:1/-1;text-align:center;padding:25px;
            color:#ffb3b3;background:#200;border:1px dashed red;
            border-radius:8px;
        }
        @media(min-width:700px) {
            .dakcj-grid {grid-template-columns:repeat(4,minmax(0,1fr))}
        }
        @media(min-width:1200px) {
            .dakcj-grid {grid-template-columns:repeat(6,minmax(0,1fr))}
        }
        @media(max-width:650px) {
            .dakcj {padding:9px}
            .dakcj-search,.dakcj-detail {grid-template-columns:1fr}
        }
        </style>

        <section class="dakcj">
            <header class="dakcj-header">
                <div>
                    <div class="dakcj-title">
                        DAKPRO ÉLITE
                        <span style="color:#087bff">GLOBAL IMPORTER</span>
                    </div>
                    <small style="color:#aaa">Catalogue international CJ Dropshipping</small>
                </div>
                <span class="dakcj-status" id="dakcj-status">● INITIALISATION</span>
            </header>

            <div class="dakcj-search">
                <input id="dakcj-keyword" placeholder="Rechercher un produit...">
                <input id="dakcj-category" list="dakcj-categories" placeholder="Catégorie">
                <datalist id="dakcj-categories"></datalist>
                <button class="dakcj-btn" id="dakcj-search">RECHERCHER</button>
            </div>

            <div class="dakcj-info" id="dakcj-info">Prêt pour la recherche.</div>

            <div class="dakcj-grid" id="dakcj-grid">
                <div class="dakcj-message">
                    DAKPRO ÉLITE — GLOBAL IMPORTER<br><br>
                    Recherchez un produit CJ Dropshipping.
                </div>
            </div>

            <div class="dakcj-pages">
                <button id="dakcj-prev" disabled>← Précédent</button>
                <span id="dakcj-page">Page 1 / 1</span>
                <button id="dakcj-next" disabled>Suivant →</button>
            </div>

            <div class="dakcj-modal" id="dakcj-modal">
                <div class="dakcj-modal-box">
                    <button class="dakcj-close" id="dakcj-close">×</button>
                    <div id="dakcj-detail-content"></div>
                </div>
            </div>
        </section>`;
    }

    // ================= API CJ =================

    async api(action, params = {}) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CONFIG.timeout);

        try {
            const url = new URL(CONFIG.API);
            url.searchParams.set("action", action);

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    url.searchParams.set(key, String(value));
                }
            });

            const response = await fetch(url, {
                method: "GET",
                headers: { Accept: "application/json" },
                signal: controller.signal
            });

            const text = await response.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Réponse API invalide.");
            }

            if (!response.ok || data.success === false) {
                throw new Error(data.message || data.error || "Erreur API CJ.");
            }

            return data;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("Délai de connexion dépassé.");
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    getData(response) {
        return response?.data ?? response?.resultData ??
               response?.result ?? response;
    }

    getList(response) {
        const data = this.getData(response);
        if (Array.isArray(data)) return data;

        const candidates = [
            data?.list,
            data?.variants,
            data?.items,
            data?.tree,
            data?.content?.list,
            data?.content?.productList,
            data?.productList,
            data?.content
        ];

        return candidates.find(Array.isArray) || [];
    }

    getProductList(response) {
        return this.getList(response);
    }

    getObject(response) {
        let data = this.getData(response);
        if (Array.isArray(data)) data = data[0] || {};
        if (Array.isArray(data?.list)) data = data.list[0] || {};
        return data && typeof data === "object" ? data : {};
    }

    // ================= ÉVÉNEMENTS =================

    events() {
        const $ = id => this.container.querySelector("#" + id);

        $("dakcj-search").onclick = () => {
            this.keyword = $("dakcj-keyword").value.trim();
            this.categoryId = this.getCategoryId($("dakcj-category").value.trim());
            this.page = 1;
            this.search();
        };

        $("dakcj-keyword").onkeydown = e => {
            if (e.key === "Enter") $("dakcj-search").click();
        };

        $("dakcj-prev").onclick = () => {
            if (this.page > 1 && !this.loading) {
                this.page--;
                this.search();
            }
        };

        $("dakcj-next").onclick = () => {
            if (this.page < this.totalPages && !this.loading) {
                this.page++;
                this.search();
            }
        };

        $("dakcj-close").onclick = () => this.close();

        $("dakcj-modal").onclick = e => {
            if (e.target.id === "dakcj-modal") this.close();
        };
    }

    // ================= CATÉGORIES =================

    async loadCategories() {
        try {
            const list = this.getList(await this.api("categories"));
            const flattened = [];

            const visit = items => items.forEach(item => {
                if (!item || typeof item !== "object") return;

                const id = item.categoryId || item.categoryFirstId ||
                           item.categorySecondId || item.id;
                const name = item.categoryName || item.categoryFirstName ||
                             item.categorySecondName || item.name;

                if (id && name) flattened.push({
                    id: String(id), name: String(name)
                });

                const children = item.categoryFirstList ||
                    item.categorySecondList || item.children || item.list;

                if (Array.isArray(children)) visit(children);
            });

            visit(list);
            this.categories = flattened;

            const unique = [...new Map(
                flattened.map(item => [item.id, item])
            ).values()];

            this.container.querySelector("#dakcj-categories").innerHTML =
                unique.map(item =>
                    `<option value="${this.escape(item.name)}"></option>`
                ).join("");

            this.status("● CONNECTEUR CJ PRÊT");
        } catch (error) {
            this.status("● ERREUR CATÉGORIES");
            console.warn(error);
        }
    }

    getCategoryId(value) {
        const item = this.categories.find(c =>
            c.name.toLowerCase() === value.toLowerCase() || c.id === value
        );
        return item ? item.id : value;
    }

    // ================= RECHERCHE =================

    async search() {
        if (this.loading) return;

        this.loading = true;
        const requestNumber = ++this.searchNumber;

        const grid = this.container.querySelector("#dakcj-grid");
        const info = this.container.querySelector("#dakcj-info");

        grid.innerHTML = `<div class="dakcj-message">Recherche en cours...</div>`;
        this.status("● RECHERCHE EN COURS");

        try {
            const response = await this.api("products", {
                keyWord: this.keyword,
                categoryId: this.categoryId,
                page: this.page,
                size: CONFIG.pageSize
            });

            if (requestNumber !== this.searchNumber) return;

            const data = this.getData(response);
            const list = this.getProductList(response);

            this.totalRecords = Number(data?.totalRecords ?? data?.total ?? 0);
            this.totalPages = Number(
                data?.totalPages ||
                Math.ceil(this.totalRecords / CONFIG.pageSize) || 1
            );

            if (!list.length) {
                grid.innerHTML = `<div class="dakcj-message">Aucun produit trouvé.</div>`;
                info.textContent = "Aucun résultat.";
                return;
            }

            this.products.clear();

            const products = list.map(item => {
                const pid = String(item.pid || item.productId || item.id || "");
                const images = this.images(
                    item.productImageSet || item.images,
                    item.productImage || item.bigImage
                );

                const product = {
                    pid,
                    name: item.productNameEn || item.productName ||
                          item.nameEn || item.name || "Produit CJ",
                    image: item.productImage || item.bigImage || images[0] || "",
                    images,
                    sku: item.productSku || item.sku || "",
                    price: this.number(
                        item.sellPrice ?? item.productPrice ?? item.supplierPrice
                    ),
                    stock: this.stock(item),
                    categoryId: item.categoryId || "",
                    categoryName: item.categoryName || "",
                    description: item.description || ""
                };

                if (pid) this.products.set(pid, product);
                return product;
            }).filter(p => p.pid);

            this.renderProducts(products);

            info.textContent =
                `${this.totalRecords.toLocaleString("fr-FR")} produits — Page ${this.page} / ${this.totalPages}`;

            this.status("● CATALOGUE CJ CONNECTÉ");
        } catch (error) {
            if (requestNumber !== this.searchNumber) return;

            grid.innerHTML = `
                <div class="dakcj-message">
                    ERREUR API CJ<br><br>${this.escape(error.message)}
                </div>`;
            info.textContent = "Recherche impossible.";
            this.status("● ERREUR API");
        } finally {
            if (requestNumber === this.searchNumber) {
                this.loading = false;
                this.pagination();
            }
        }
    }

    // ================= AFFICHAGE =================

    renderProducts(products) {
        const grid = this.container.querySelector("#dakcj-grid");

        if (!products.length) {
            grid.innerHTML = `<div class="dakcj-message">Aucun produit valide.</div>`;
            return;
        }

        grid.innerHTML = products.map(p => `
            <article class="dakcj-card">
                ${p.image
                    ? `<img src="${this.escape(p.image)}" loading="lazy" alt="">`
                    : `<div style="height:150px;text-align:center;padding:55px">Image indisponible</div>`
                }
                <div class="dakcj-card-body">
                    <div class="dakcj-name">${this.escape(p.name)}</div>
                    <div class="dakcj-price">
                        ${p.price !== null ? "$" + p.price.toFixed(2) : "Prix indisponible"}
                    </div>
                    <button class="dakcj-view" data-pid="${this.escape(p.pid)}">
                        VOIR LE PRODUIT
                    </button>
                </div>
            </article>
        `).join("");

        grid.querySelectorAll("[data-pid]").forEach(button => {
            button.onclick = () => this.openProduct(button.dataset.pid);
        });
    }

    // ================= DÉTAILS =================

    async openProduct(pid) {
        const product = this.products.get(String(pid));
        if (!product) return;

        this.product = product;
        this.variants = [];
        this.inventory = null;

        const modal = this.container.querySelector("#dakcj-modal");
        const content = this.container.querySelector("#dakcj-detail-content");

        modal.style.display = "flex";
        content.innerHTML = `<div class="dakcj-message">Chargement du produit...</div>`;

        try {
            const results = await Promise.allSettled([
                this.api("detail", { pid: product.pid }),
                this.api("variants", { pid: product.pid })
            ]);

            if (this.product !== product) return;

            if (results[0].status === "fulfilled") {
                const d = this.getObject(results[0].value);

                product.name = d.productNameEn || d.productName || product.name;
                product.description = d.description || d.productDescription || product.description;
                product.sku = d.productSku || product.sku;
                product.image = d.productImage || d.bigImage || product.image;
                product.images = this.images(d.productImageSet || d.images, product.image);
                product.price = this.number(
                    d.sellPrice ?? d.supplierPrice ?? d.productPrice ?? product.price
                );
            }

            this.variants = results[1].status === "fulfilled"
                ? this.getList(results[1].value) : [];

            await this.updateVariant("");
            this.renderDetail();
        } catch (error) {
            content.innerHTML = `<div class="dakcj-message">${this.escape(error.message)}</div>`;
        }
    }

    async updateVariant(index) {
        const variant = index !== "" ? this.variants[Number(index)] : null;

        this.selectedVariant = variant || null;
        this.selectedPrice = variant
            ? this.number(
                variant.variantSellPrice ??
                variant.sellPrice ??
                variant.variantPrice ??
                variant.variantSugSellPrice
            ) || this.product.price
            : this.product.price;

        this.inventory = null;

        const vid = variant?.vid || variant?.variantId;

        if (vid) {
            try {
                const result = await this.api("stock", { vid: String(vid) });
                this.inventory = this.getObject(result);
            } catch (error) {
                console.warn("Stock indisponible :", error.message);
            }
        }

        this.previewPrice();
    }

    renderDetail() {
        const content = this.container.querySelector("#dakcj-detail-content");

        const variants = this.variants.map((v, i) => `
            <option value="${i}">
                ${this.escape(v.variantName || v.name || v.variantSku || "Variante " + (i + 1))}
            </option>
        `).join("");

        content.innerHTML = `
            <h2 style="color:#FFD700">${this.escape(this.product.name)}</h2>

            <div class="dakcj-detail">
                <div>
                    ${this.product.image
                        ? `<img src="${this.escape(this.product.image)}" alt="">` : ""}
                    <p style="color:#aaa;font-size:11px">FOURNISSEUR : CJ DROPSHIPPING</p>

                    <p style="color:#FFD700">
                        Prix fournisseur : <span id="dakcj-supplier-price"></span>
                    </p>

                    <label class="dakcj-label">VARIANTES</label>
                    <select id="dakcj-variant">
                        <option value="">Produit standard</option>${variants}
                    </select>

                    <p id="dakcj-stock" style="color:#aaa;font-size:12px"></p>

                    <div class="dakcj-section">
                        <h3>DESCRIPTION</h3>
                        <p style="font-size:12px;color:#ccc">
                            ${this.escape(this.product.description)}
                        </p>
                    </div>
                </div>

                <div>
                    <div class="dakcj-section">
                        <h3>PARAMÈTRES COMMERCIAUX</h3>

                        <label class="dakcj-label">TAUX USD / FCFA</label>
                        <input id="dakcj-rate" type="number" min="1" value="${CONFIG.exchangeRate}">

                        <label class="dakcj-label">MARGE (%)</label>
                        <input id="dakcj-margin" type="number" min="0" max="1000" value="${CONFIG.marginPercent}">

                        <label class="dakcj-label">TRANSPORT (FCFA)</label>
                        <input id="dakcj-shipping" type="number" min="0" value="0">

                        <label class="dakcj-label">DOUANE (FCFA)</label>
                        <input id="dakcj-customs" type="number" min="0" value="0">

                        <label class="dakcj-label">AUTRES FRAIS (FCFA)</label>
                        <input id="dakcj-other" type="number" min="0" value="0">
                    </div>

                    <div class="dakcj-section">
                        <h3>RÉPARTITION DE LA MARGE (%)</h3>

                        <label class="dakcj-label">VENDEUR</label>
                        <input id="dakcj-seller" type="number" min="0" max="100" value="${CONFIG.commissions.seller}">

                        <label class="dakcj-label">AFFILIÉ</label>
                        <input id="dakcj-affiliate" type="number" min="0" max="100" value="${CONFIG.commissions.affiliate}">

                        <label class="dakcj-label">DAKPRO</label>
                        <input id="dakcj-platform" type="number" min="0" max="100" value="${CONFIG.commissions.platform}">
                    </div>

                    <div class="dakcj-section">
                        <h3>PRIX PUBLIC</h3>
                        <div class="dakcj-result" id="dakcj-price">Calcul...</div>
                        <div id="dakcj-cost" style="font-size:12px;color:#aaa"></div>
                    </div>

                    <button id="dakcj-draft" class="dakcj-action dakcj-draft">
                        ENREGISTRER EN BROUILLON
                    </button>

                    <button id="dakcj-publish" class="dakcj-action dakcj-publish">
                        PUBLIER SUR DAKPRO ÉLITE
                    </button>
                </div>
            </div>
        `;

        const $ = id => content.querySelector("#" + id);

        $("dakcj-variant").onchange = async e => {
            $("dakcj-stock").textContent = "Vérification du stock...";
            await this.updateVariant(e.target.value);
        };

        [
            "dakcj-rate", "dakcj-margin", "dakcj-shipping",
            "dakcj-customs", "dakcj-other", "dakcj-seller",
            "dakcj-affiliate", "dakcj-platform"
        ].forEach(id => {
            $(id).oninput = () => this.previewPrice();
        });

        $("dakcj-draft").onclick = () => this.publish(false);
        $("dakcj-publish").onclick = () => this.publish(true);

        this.previewPrice();
    }

    // ================= CALCUL DES PRIX =================

    calculatePrice() {
        const value = id => Number(
            this.container.querySelector("#" + id).value
        );

        const rate = value("dakcj-rate");
        const margin = value("dakcj-margin");
        const shipping = value("dakcj-shipping");
        const customs = value("dakcj-customs");
        const other = value("dakcj-other");

        const seller = value("dakcj-seller");
        const affiliate = value("dakcj-affiliate");
        const platform = value("dakcj-platform");

        if (!Number.isFinite(rate) || rate <= 0)
            throw new Error("Taux de conversion invalide.");

        if (!Number.isFinite(margin) || margin < 0 || margin > 1000)
            throw new Error("Marge invalide.");

        if ([shipping, customs, other].some(v => !Number.isFinite(v) || v < 0))
            throw new Error("Frais supplémentaires invalides.");

        if ([seller, affiliate, platform].some(v =>
            !Number.isFinite(v) || v < 0 || v > 100
        )) throw new Error("Pourcentage de commission invalide.");

        if (seller + affiliate + platform !== 100)
            throw new Error("Les commissions doivent totaliser exactement 100 %.");

        const supplierPrice = this.selectedPrice ?? this.product.price;

        if (!supplierPrice || supplierPrice <= 0)
            throw new Error("Prix fournisseur indisponible.");

        const supplierCost = supplierPrice * rate;
        const extraCosts = shipping + customs + other;
        const baseCost = supplierCost + extraCosts;
        const marginFCFA = baseCost * margin / 100;
        const finalPrice = baseCost + marginFCFA;

        return {
            supplierPrice,
            supplierCost: Math.round(supplierCost),
            extraCosts: Math.round(extraCosts),
            baseCost: Math.round(baseCost),
            marginFCFA: Math.round(marginFCFA),
            finalPrice: Math.round(finalPrice),
            rate,
            margin,
            shipping,
            customs,
            other,
            commissions: {
                seller: Math.round(marginFCFA * seller / 100),
                affiliate: Math.round(marginFCFA * affiliate / 100),
                platform: Math.round(marginFCFA * platform / 100)
            },
            rates: { seller, affiliate, platform }
        };
    }

    previewPrice() {
        try {
            const r = this.calculatePrice();
            const $ = id => this.container.querySelector("#" + id);

            $("dakcj-price").textContent = this.fcfa(r.finalPrice);
            $("dakcj-supplier-price").textContent =
                "$" + r.supplierPrice.toFixed(2);

            $("dakcj-stock").textContent = this.inventory
                ? "Stock disponible : " + (
                    this.inventory.totalInventory ??
                    this.inventory.stock ??
                    this.inventory.inventory ??
                    "Information reçue"
                )
                : "Stock : non vérifié";

            $("dakcj-cost").innerHTML = `
                Coût fournisseur : <b>${this.fcfa(r.supplierCost)}</b><br>
                Frais supplémentaires : <b>${this.fcfa(r.extraCosts)}</b><br>
                Marge : <b>${this.fcfa(r.marginFCFA)}</b><br><br>
                Vendeur ${r.rates.seller}% : ${this.fcfa(r.commissions.seller)}<br>
                Affilié ${r.rates.affiliate}% : ${this.fcfa(r.commissions.affiliate)}<br>
                DAKPRO ${r.rates.platform}% : ${this.fcfa(r.commissions.platform)}
            `;
        } catch (error) {
            const price = this.container.querySelector("#dakcj-price");
            const cost = this.container.querySelector("#dakcj-cost");
            if (price) price.textContent = "Calcul indisponible";
            if (cost) cost.textContent = error.message;
        }
    }

    // ================= CLOUDINARY =================

    async uploadRemoteToCloudinary(url) {
        if (!url) return "";

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CONFIG.timeout);

        try {
            const form = new FormData();
            form.append("file", url);
            form.append("upload_preset", CONFIG.CLOUDINARY.uploadPreset);
            form.append("folder", CONFIG.CLOUDINARY.folder);

            const endpoint =
                `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY.cloudName}/image/upload`;

            const response = await fetch(endpoint, {
                method: "POST",
                body: form,
                signal: controller.signal
            });

            const data = await response.json();

            if (!response.ok || !data.secure_url) {
                throw new Error(data.error?.message || "Échec Cloudinary.");
            }

            return data.secure_url;
        } finally {
            clearTimeout(timer);
        }
    }

    async transferProductMedia() {
        const sources = [...new Set([
            this.product.image,
            ...(this.product.images || [])
        ].filter(Boolean))];

        const images = [];

        for (const url of sources.slice(0, 8)) {
            try {
                images.push(await this.uploadRemoteToCloudinary(url));
            } catch (error) {
                console.warn("Image CJ conservée :", error.message);
                images.push(url);
            }
        }

        return { image: images[0] || "", images };
    }

    // ================= PUBLICATION FIREBASE =================

    async publish(publishNow) {
        if (this.importing) return;

        const user = window.currentUser || this.auth.currentUser;

        if (!user) {
            alert("Connectez-vous avant d'importer un produit.");
            return;
        }

        this.importing = true;

        const buttons = [
            this.container.querySelector("#dakcj-draft"),
            this.container.querySelector("#dakcj-publish")
        ];

        buttons.forEach(b => {
            if (b) {
                b.disabled = true;
                b.textContent = "IMPORTATION...";
            }
        });

        try {
            const calculation = this.calculatePrice();

            // Vérification des doublons CJ
            const duplicateQuery = query(
                ref(this.db, CONFIG.FIREBASE_PATH),
                orderByChild("cjPid"),
                equalTo(String(this.product.pid))
            );

            const duplicate = await get(duplicateQuery);

            if (duplicate.exists()) {
                throw new Error("Ce produit CJ existe déjà dans publications.");
            }

            const media = await this.transferProductMedia();
            const variant = this.selectedVariant;

            const productRef = push(ref(this.db, CONFIG.FIREBASE_PATH));
            const productId = productRef.key;

            if (!productId) throw new Error("Identifiant Firebase indisponible.");

            const affiliateLink = new URL(
                window.DAKPRO_CONFIG?.productPageUrl || "index.html",
                window.location.origin
            );

            affiliateLink.searchParams.set("produit", productId);
            affiliateLink.searchParams.set("ref", user.uid);

            const payload = {
                id: productId,
                nom: this.product.name,
                titre: this.product.name,

                fournisseur: "CJdropshipping",
                cjPid: String(this.product.pid),

                sku: variant?.variantSku || variant?.sku || this.product.sku || "",
                vid: String(variant?.vid || variant?.variantId || ""),

                prixFournisseurUSD: calculation.supplierPrice,
                prixFournisseurFCFA: calculation.supplierCost,
                tauxConversion: calculation.rate,

                fraisTransport: calculation.shipping,
                fraisDouane: calculation.customs,
                autresFrais: calculation.other,

                prix: calculation.finalPrice,
                prixPublic: calculation.finalPrice,
                devise: "FCFA",

                margeBeneficiaire: calculation.margin,
                montantMarge: calculation.marginFCFA,

                commissions: {
                    baseCalcul: "MARGE_COMMERCIALE",
                    vendeur: {
                        taux: calculation.rates.seller,
                        montant: calculation.commissions.seller,
                        statut: "en_attente"
                    },
                    affiliation: {
                        taux: calculation.rates.affiliate,
                        montant: calculation.commissions.affiliate,
                        statut: "non_attribue",
                        affilieId: null
                    },
                    plateforme: {
                        taux: calculation.rates.platform,
                        montant: calculation.commissions.platform
                    }
                },

                image: media.image,
                images: media.images,
                imageSourceCJ: this.product.image,

                variantes: this.variants.map(v => ({
                    vid: String(v.vid || v.variantId || ""),
                    sku: v.variantSku || v.sku || "",
                    nom: v.variantName || v.name || "",
                    image: v.variantImage || v.image || "",
                    prix: this.number(
                        v.variantSellPrice ?? v.sellPrice ?? v.variantPrice
                    )
                })),

                varianteSelectionnee: variant ? {
                    vid: String(variant.vid || variant.variantId || ""),
                    sku: variant.variantSku || variant.sku || "",
                    nom: variant.variantName || variant.name || ""
                } : null,

                vendeurId: user.uid,
                vendeurNom: user.displayName || user.nom || "DAKPRO ÉLITE",
                createdBy: user.uid,

                affiliateLink: affiliateLink.toString(),
                stock: this.stock(this.inventory) ?? this.product.stock ?? null,

                categorie: this.product.categoryName || "",
                description: this.product.description || "",

                actif: Boolean(publishNow),
                statut: publishNow ? "actif" : "brouillon",

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await set(productRef, payload);

            this.showSuccess(productId, affiliateLink.toString(), publishNow);

        } catch (error) {
            console.error("DAKPRO IMPORT :", error);
            alert("Erreur d'importation : " + error.message);

            buttons.forEach((b, i) => {
                if (b) {
                    b.disabled = false;
                    b.textContent = i === 0
                        ? "ENREGISTRER EN BROUILLON"
                        : "PUBLIER SUR DAKPRO ÉLITE";
                }
            });
        } finally {
            this.importing = false;
        }
    }

    // ================= CONFIRMATION =================

    showSuccess(id, link, published) {
        const content = this.container.querySelector("#dakcj-detail-content");

        content.innerHTML = `
            <div style="text-align:center;padding:25px 5px">
                <div style="font-size:40px">${published ? "🚀" : "📥"}</div>
                <h2 style="color:#FFD700">
                    ${published ? "PRODUIT PUBLIÉ" : "BROUILLON ENREGISTRÉ"}
                </h2>
                <div class="dakcj-section">
                    <p style="color:#D4AF37">IDENTIFIANT DU PRODUIT</p>
                    <strong style="word-break:break-all">${this.escape(id)}</strong>
                    <p style="color:#D4AF37;margin-top:15px">LIEN DU PRODUIT</p>
                    <p style="word-break:break-all">${this.escape(link)}</p>
                    <button id="dakcj-copy" class="dakcj-action dakcj-publish">
                        COPIER LE LIEN
                    </button>
                </div>
                <button id="dakcj-finish" class="dakcj-action dakcj-draft">
                    TERMINER
                </button>
            </div>`;

        content.querySelector("#dakcj-copy").onclick = async () => {
            try {
                await navigator.clipboard.writeText(link);
                alert("Lien copié.");
            } catch {
                alert("Copie impossible sur cet appareil.");
            }
        };

        content.querySelector("#dakcj-finish").onclick = () => this.close();
    }

    // ================= UTILITAIRES =================

    images(value, mainImage) {
        if (typeof value === "string") {
            try { value = JSON.parse(value); }
            catch { value = [value]; }
        }

        const list = Array.isArray(value)
            ? value.map(item => typeof item === "string" ? item :
                item?.url || item?.image || item?.imageUrl || item?.bigImage || "")
            : [];

        if (mainImage) list.unshift(mainImage);
        return [...new Set(list.filter(Boolean))];
    }

    number(value) {
        if (value === null || value === undefined || value === "") return null;
        const n = Number(String(value).replace(",", ".").replace(/[^\d.]/g, ""));
        return Number.isFinite(n) && n > 0 ? n : null;
    }

    stock(product) {
        if (!product) return null;

        for (const value of [
            product.stock,
            product.inventory,
            product.quantity,
            product.totalInventory
        ]) {
            if (value !== null && value !== undefined &&
                value !== "" && Number.isFinite(Number(value))) {
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
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[c]);
    }

    status(message) {
        const el = this.container.querySelector("#dakcj-status");
        if (el) el.textContent = message;
    }

    pagination() {
        const $ = id => this.container.querySelector("#" + id);

        $("dakcj-page").textContent =
            `Page ${this.page} / ${this.totalPages}`;

        $("dakcj-prev").disabled = this.loading || this.page <= 1;
        $("dakcj-next").disabled = this.loading || this.page >= this.totalPages;
    }

    close() {
        const modal = this.container.querySelector("#dakcj-modal");
        if (modal) modal.style.display = "none";

        this.product = null;
        this.variants = [];
        this.inventory = null;
        this.selectedVariant = null;
    }
}

// ================= INITIALISATION =================

export function init() {
    const container = document.getElementById("module-container");

    if (!container) {
        console.error("DAKPRO : module-container introuvable.");
        return null;
    }

    window.dakproImporterInstance =
        new DakproCJImporter("module-container");

    return window.dakproImporterInstance;
}