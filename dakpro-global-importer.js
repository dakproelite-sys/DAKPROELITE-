// ============================================================
// DAKPRO ÉLITE
// GLOBAL IMPORTER — PARTIE 1 : CATALOGUE & RECHERCHE CJ
// FICHIER : dakpro-global-importer.js (global importateur)
// ============================================================

import { initPublisher } from "./dakpro-cj-publisher.js";

const CONFIG = {
    API: "https://cj.dakproelite.com/api/cj",
    pageSize: 50,
    maxPageSize: 100,
    timeout: 30000
};

class DakproCJCatalog {
    constructor(containerId = "module-container") {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.id = containerId;
            document.body.appendChild(this.container);
        }

        this.initModule();
    }

    initModule() {
        this.page = 1;
        this.totalPages = 1;
        this.totalRecords = 0;
        this.keyword = "";
        this.categoryId = "";
        this.categories = [];
        this.products = new Map();
        this.loading = false;

        this.render();
        this.events();
        this.loadCategories();
    }

    render() {
        this.container.innerHTML = `
        <style>
        .dakcj { background:#0f0f13; color:white; padding:15px; border-radius:12px; border:1px solid #333; font-family:inherit; }
        .dakcj * { box-sizing:border-box; }
        .dakcj-header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding-bottom:12px; border-bottom:2px solid #D4AF37; margin-bottom:15px; }
        .dakcj-title { color:#FFD700; font-size:18px; font-weight:700; margin:0; }
        .dakcj-subtitle { color:#aaa; font-size:11px; }
        .dakcj-status { color:#FFD700; border:1px solid #D4AF37; padding:6px 10px; border-radius:6px; font-size:9px; font-weight:700; background:#1a1a1f; }
        .dakcj-search { display:grid; grid-template-columns:2fr 1fr auto; gap:8px; padding:12px; background:#16161c; border:1px solid #80651f; border-radius:8px; margin-bottom:12px; }
        .dakcj input, .dakcj select { width:100%; padding:10px; border-radius:6px; background:#0b0b0e; color:white; border:1px solid #444; font-size:12px; }
        .dakcj button { cursor:pointer; font-weight:700; }
        .dakcj button:disabled { opacity:.45; cursor:not-allowed; }
        .dakcj-btn { background:linear-gradient(135deg,#D4AF37,#FFD700); color:#050505; border:0; border-radius:6px; padding:10px 15px; font-size:12px; }
        .dakcj-toolbar { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin:10px 0; }
        .dakcj-info { color:#D4AF37; font-size:11px; margin:0; }
        .dakcj-clean-btn { background:#3a0c12; color:#ff9aa2; border:1px solid #c92a2a; border-radius:6px; padding:7px 12px; font-size:11px; transition:.2s; }
        .dakcj-clean-btn:hover:not(:disabled) { background:#5c111b; color:#fff; }
        .dakcj-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .dakcj-card { background:#16161c; border:1px solid #443a18; border-radius:8px; overflow:hidden; display:flex; flex-direction:column; transition:.2s; }
        .dakcj-card:hover { border-color:#FFD700; }
        .dakcj-card img { width:100%; height:140px; object-fit:contain; background:#0b0b0e; }
        .dakcj-card-body { padding:10px; display:flex; flex-direction:column; flex:1; justify-content:space-between; }
        .dakcj-name { font-size:11px; font-weight:600; min-height:34px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .dakcj-price { color:#FFD700; font-weight:700; font-size:13px; margin:6px 0; }
        .dakcj-actions { display:flex; flex-direction:column; gap:5px; margin-top:6px; }
        .dakcj-view { width:100%; padding:8px; background:#0759bd; color:white; border:0; border-radius:6px; font-size:11px; }
        .dakcj-view:hover { background:#096ce6; }
        .dakcj-del { width:100%; padding:7px; background:#2b0d12; color:#ff8787; border:1px solid #8b1e2b; border-radius:6px; font-size:10px; }
        .dakcj-del:hover { background:#4a121a; color:#fff; }
        .dakcj-bulk-wrap { margin-top:16px; }
        .dakcj-bulk-btn { width:100%; padding:13px 16px; background:linear-gradient(135deg,#15803d,#16a34a); color:#ffffff; border:1px solid #4ade80; border-radius:8px; font-size:12px; letter-spacing:.3px; box-shadow:0 4px 14px rgba(22,163,74,0.25); transition:.2s; }
        .dakcj-bulk-btn:hover:not(:disabled) { background:linear-gradient(135deg,#16a34a,#22c55e); }
        .dakcj-pages { display:flex; justify-content:center; align-items:center; gap:12px; margin:20px 0; }
        .dakcj-pages button { background:#16161c; color:#FFD700; border:1px solid #D4AF37; padding:8px 12px; border-radius:6px; font-size:11px; }
        .dakcj-message { grid-column:1/-1; text-align:center; padding:25px; color:#ffb3b3; border:1px dashed #ff4d4d; border-radius:8px; background:#2a0808; font-size:12px; }
        @media(min-width:700px) { .dakcj-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media(min-width:1100px) { .dakcj-grid { grid-template-columns:repeat(4,minmax(0,1fr)); } }
        @media(max-width:650px) { .dakcj-search { grid-template-columns:1fr; } }
        </style>

        <section class="dakcj" id="dakcj-main-wrapper">
            <header class="dakcj-header">
                <div>
                    <h2 class="dakcj-title">DAKPRO ÉLITE <span style="color:#087bff">GLOBAL IMPORTER</span></h2>
                    <div class="dakcj-subtitle">Catalogue international CJ Dropshipping</div>
                </div>
                <span class="dakcj-status" id="dakcj-status">● OPÉRATIONNEL</span>
            </header>

            <div class="dakcj-search">
                <input id="dakcj-keyword" type="search" placeholder="Rechercher un produit CJ...">
                <input id="dakcj-category" list="dakcj-categories" placeholder="Catégorie CJ">
                <datalist id="dakcj-categories"></datalist>
                <button class="dakcj-btn" id="dakcj-search-btn">RECHERCHER</button>
            </div>

            <div class="dakcj-toolbar">
                <div class="dakcj-info" id="dakcj-info">Saisissez un mot-clé pour lancer la recherche.</div>
                <button type="button" class="dakcj-clean-btn" id="dakcj-delete-no-price">🗑 SUPPRIMER SANS PRIX</button>
            </div>

            <div class="dakcj-grid" id="dakcj-grid">
                <div class="dakcj-message" style="color:#aaa;border-color:#D4AF37;background:#16161c">
                    DAKPRO ÉLITE — GLOBAL IMPORTER<br><br>Module prêt. Recherchez un produit pour commencer.
                </div>
            </div>

            <div class="dakcj-bulk-wrap">
                <button type="button" class="dakcj-bulk-btn" id="dakcj-view-all-publisher">
                    🚀 VOIR TOUS LES PRODUITS — IMPORTER VERS PUBLISHER
                </button>
            </div>

            <div class="dakcj-pages">
                <button id="dakcj-prev" disabled>← Précédent</button>
                <span id="dakcj-page" style="font-size:11px;">Page 1 / 1</span>
                <button id="dakcj-next" disabled>Suivant →</button>
            </div>
        </section>
        `;
    }

    async api(action, params = {}) {
        const url = new URL(CONFIG.API);
        url.searchParams.set("action", action);
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
        });
        const res = await fetch(url.toString(), { headers: { "Accept": "application/json" } });
        const json = await res.json();
        if (!res.ok || json.success === false) throw new Error(json.message || "Erreur serveur CJ");
        return json;
    }

    getData(res) { return res?.data ?? res?.resultData ?? res?.result ?? res; }

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

    events() {
        const $ = s => this.container.querySelector(s);
        const execSearch = () => {
            this.keyword = $("#dakcj-keyword").value.trim();
            this.categoryId = this.getCategoryId($("#dakcj-category").value.trim());
            this.page = 1;
            this.search();
        };

        $("#dakcj-search-btn").addEventListener("click", execSearch);
        $("#dakcj-keyword").addEventListener("keydown", e => { if (e.key === "Enter") execSearch(); });
        $("#dakcj-delete-no-price").addEventListener("click", () => this.deleteProductsWithoutPrice());
        $("#dakcj-view-all-publisher").addEventListener("click", () => this.openAllInPublisher());
        $("#dakcj-prev").addEventListener("click", () => { if (this.page > 1 && !this.loading) { this.page--; this.search(); } });
        $("#dakcj-next").addEventListener("click", () => { if (this.page < this.totalPages && !this.loading) { this.page++; this.search(); } });
    }

    renderProductsGrid() {
        const grid = this.container.querySelector("#dakcj-grid");
        const info = this.container.querySelector("#dakcj-info");
        const products = Array.from(this.products.values());

        if (!products.length) {
            grid.innerHTML = `<div class="dakcj-message">Aucun produit disponible dans la liste.</div>`;
            info.textContent = `0 produit affiché — Page ${this.page} / ${this.totalPages}`;
            return;
        }

        grid.innerHTML = products.map(p => `
            <article class="dakcj-card" data-card-pid="${p.pid}">
                <img src="${p.image || ''}" alt="${p.name}" loading="lazy" referrerpolicy="no-referrer">
                <div class="dakcj-card-body">
                    <div class="dakcj-name">${p.name}</div>
                    <div class="dakcj-price">${p.price ? "$" + p.price.toFixed(2) : "Prix indisponible"}</div>
                    <div class="dakcj-actions">
                        <button type="button" class="dakcj-view" data-pid="${p.pid}">VOIR LE PRODUIT</button>
                        <button type="button" class="dakcj-del" data-del-pid="${p.pid}">🗑 SUPPRIMER</button>
                    </div>
                </div>
            </article>
        `).join("");

        grid.querySelectorAll("[data-pid]").forEach(btn => {
            btn.addEventListener("click", () => {
                const prod = this.products.get(btn.dataset.pid);
                if (prod) {
                    window.dpeBulkQueue = Array.from(this.products.values()).filter(item => Number(item.price) > 0);
                    localStorage.setItem("dakpro_cj_bulk_queue", JSON.stringify(window.dpeBulkQueue));
                    initPublisher(prod, this.containerId);
                }
            });
        });

        grid.querySelectorAll("[data-del-pid]").forEach(btn => {
            btn.addEventListener("click", () => {
                this.deleteProduct(btn.dataset.delPid);
            });
        });

        const sansPrix = products.filter(item => !(Number(item.price) > 0)).length;
        info.textContent = `${products.length} affiché(s) (${sansPrix} sans prix) sur ${this.totalRecords.toLocaleString("fr-FR")} — Page ${this.page} / ${this.totalPages}`;
    }

    deleteProduct(pid) {
        if (!pid || !this.products.has(pid)) return;
        this.products.delete(pid);
        this.renderProductsGrid();
        this.status("● PRODUIT SUPPRIMÉ");
    }

    deleteProductsWithoutPrice() {
        const avant = this.products.size;
        for (const [pid, prod] of this.products.entries()) {
            if (!(Number(prod.price) > 0)) {
                this.products.delete(pid);
            }
        }
        const retires = avant - this.products.size;
        this.renderProductsGrid();
        this.status(`● ${retires} SANS PRIX SUPPRIMÉ(S)`);
    }

    openAllInPublisher() {
        const allProducts = Array.from(this.products.values());
        const validProducts = allProducts.filter(item => Number(item.price) > 0);
        const queue = validProducts.length ? validProducts : allProducts;

        if (!queue.length) {
            alert("Aucun produit disponible à envoyer vers le Publisher.");
            return;
        }

        window.dpeBulkQueue = queue;
        window.dpeAllCatalogProducts = allProducts;
        localStorage.setItem("dakpro_cj_bulk_queue", JSON.stringify(queue));

        document.dispatchEvent(new CustomEvent("dakpro:importAllToPublisher", {
            detail: { products: queue, allProducts, containerId: this.containerId }
        }));

        try {
            // Si initPublisher accepte un tableau ou plusieurs arguments, on lui passe la liste et l'ID du conteneur
            initPublisher(queue, this.containerId);
        } catch (err) {
            // Repli sûr si initPublisher attend un objet produit unique
            initPublisher(queue[0], this.containerId);
        }
    }

    async loadCategories() {
        try {
            const res = await this.api("categories");
            const categories = this.getList(res);
            const flattened = [];
            const visit = (list) => {
                if (!Array.isArray(list)) return;
                list.forEach(i => {
                    const id = i.categoryId || i.categoryFirstId || i.id;
                    const name = i.categoryName || i.categoryFirstName || i.name;
                    if (id && name) flattened.push({ id: String(id), name: String(name) });
                    const children = i.categoryFirstList || i.categorySecondList || i.children || i.list;
                    if (children) visit(children);
                });
            };
            visit(categories);
            this.categories = flattened;
            const unique = [...new Map(flattened.map(i => [i.id, i])).values()];
            const el = this.container.querySelector("#dakcj-categories");
            if (el) el.innerHTML = unique.map(i => `<option value="${i.name}" data-id="${i.id}"></option>`).join("");
            this.status("● CONNECTEUR CJ PRÊT");
        } catch (e) {
            console.warn("Catégories:", e);
        }
    }

    getCategoryId(val) {
        const cat = this.categories.find(i => i.name.toLowerCase() === val.toLowerCase() || i.id === val);
        return cat ? cat.id : val;
    }

    async search() {
        if (this.loading) return;
        this.loading = true;
        const grid = this.container.querySelector("#dakcj-grid");
        const info = this.container.querySelector("#dakcj-info");
        grid.innerHTML = `<div class="dakcj-message" style="color:#FFD700;border-color:#D4AF37;background:#16161c">Recherche en cours...</div>`;

        try {
            const res = await this.api("products", { keyWord: this.keyword, categoryId: this.categoryId, page: this.page, size: CONFIG.pageSize });
            const data = this.getData(res);
            const list = this.getProductList(res);
            this.totalRecords = Number(data?.totalRecords || data?.total || 0);
            this.totalPages = Math.min(Number(data?.totalPages || Math.ceil(this.totalRecords / CONFIG.pageSize) || 1), 1000);

            if (!list.length) {
                grid.innerHTML = `<div class="dakcj-message">Aucun produit trouvé.</div>`;
                info.textContent = "Aucun résultat.";
                return;
            }

            this.products.clear();
            list.forEach(item => {
                const pid = String(item.id || item.pid || item.productId || "");
                const name = item.nameEn || item.productNameEn || item.productName || item.name || "";
                if (!pid || !name) return;
                const p = {
                    pid,
                    name,
                    image: item.bigImage || item.productImage || "",
                    price: Number(item.sellPrice || item.price || item.nowPrice || 0),
                    sku: item.sku || item.productSku || "",
                    stock: Number(item.warehouseInventoryNum || item.totalInventory || 0),
                    categoryName: item.categoryName || "",
                    description: item.description || ""
                };
                this.products.set(pid, p);
            });

            this.renderProductsGrid();
            this.status("● CATALOGUE CJ CONNECTÉ");
        } catch (e) {
            grid.innerHTML = `<div class="dakcj-message">Erreur API CJ : ${e.message}</div>`;
        } finally {
            this.loading = false;
            const prev = this.container.querySelector("#dakcj-prev");
            const next = this.container.querySelector("#dakcj-next");
            const page = this.container.querySelector("#dakcj-page");
            if (page) page.textContent = `Page ${this.page} / ${this.totalPages}`;
            if (prev) prev.disabled = (this.page <= 1);
            if (next) next.disabled = (this.page >= this.totalPages);
        }
    }

    status(msg) {
        const el = this.container?.querySelector("#dakcj-status");
        if (el) el.textContent = msg;
    }
}

export function init() {
    let container = document.getElementById("module-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "module-container";
        document.body.appendChild(container);
    }
    if (!window.dakproCatalogInstance) {
        window.dakproCatalogInstance = new DakproCJCatalog("module-container");
    } else {
        window.dakproCatalogInstance.container = container;
        window.dakproCatalogInstance.render();
        window.dakproCatalogInstance.events();
    }
    return window.dakproCatalogInstance;
}

window.initDakproGlobalImporter = init;
window.initGlobalImporter = init;
window.loadDakproImporter = init;

try { init(); } catch (e) { console.warn("Auto-init:", e); }
