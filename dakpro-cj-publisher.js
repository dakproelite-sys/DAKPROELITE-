// ============================================================
// DAKPRO ÉLITE — dakpro-cj-publisher.js
// MODULE DE PUBLICATION UNIFIÉ AVEC SÉLECTEUR EXHAUSTIF, 
// COMMISSIONS CONFIGURÉES (5% AFF + 25% PLAT = 30%) & PUBLICATION EN MASSE
// ============================================================

import {
    getDatabase,
    ref,
    push,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { init as returnToCatalog } from "./dakpro-global-importer.js";

const CONFIG = {
    API: "https://cj.dakproelite.com/api/cj",
    FIREBASE_PATH: "publications",
    CLOUDINARY: {
        cloudName: "iufene3y",
        uploadPreset: "dakproelite_preset",
        folder: "dakproelite"
    },
    exchangeRate: 655,
    marginPercent: 30, // 5% affiliation + 25% plateforme
    commissions: {
        seller: 70,
        affiliate: 5,
        platform: 25,
        affiliation: 5,
        plateforme: 25
    },
    pageSize: 50,
    maxPageSize: 100,
    timeout: 30000
};

let variantsArray = [];
let productCategoryValue = "Général";

function cleanImageUrl(url) {
    if (!url) return "https://i.postimg.cc/WpSc29mX/file-00000000ca8872438c17222eb828bc0c.png";
    let trimmed = String(url).trim();
    if (trimmed.startsWith("//")) {
        return "https:" + trimmed;
    }
    return trimmed;
}

// Fonction utilitaire pour nettoyer le HTML des descriptions CJ
function parseDescription(rawDesc) {
    if (!rawDesc) return "";
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = rawDesc;
    let text = tempDiv.textContent || tempDiv.innerText || "";
    return text.trim() ? text.trim() : rawDesc;
}

class DakproCJPublisher {
    constructor(product, containerId = "module-container") {
        // Supporte soit un seul produit, soit une liste/file d'attente de produits
        let queue = [];
        if (Array.isArray(product)) {
            queue = product.slice();
        } else if (Array.isArray(window.dpeBulkQueue) && window.dpeBulkQueue.length > 0) {
            queue = window.dpeBulkQueue.slice();
            if (product && product.pid && !queue.some(item => String(item.pid) === String(product.pid))) {
                queue.unshift(product);
            }
        } else if (product && typeof product === "object") {
            queue = [product];
        } else {
            try {
                const saved = JSON.parse(localStorage.getItem("dakpro_cj_bulk_queue") || "[]");
                if (Array.isArray(saved) && saved.length > 0) queue = saved;
            } catch (e) { /* ignore */ }
        }

        this.queue = queue.length > 0 ? queue : [{}];
        this.activeIndex = 0;
        this.queuePage = 1;
        this.queuePageSize = 50; // Fenêtrage haute performance même pour des milliers d'articles

        this.product = this.queue[0] || {};
        this.product.image = cleanImageUrl(this.product.image);

        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.db = getDatabase();
        this.auth = getAuth();
        this.variants = [];

        productCategoryValue = this.product.categoryName || this.product.category || "Général";

        this.render();
        this.fetchDetailsAndVariants();
    }

    render() {
        const initialPriceUSD = Number(this.product.price || 0);
        const baseCostFCFA = Math.round(initialPriceUSD * CONFIG.exchangeRate);
        const defaultAff = CONFIG.commissions.affiliation || 5;
        const defaultPlat = CONFIG.commissions.plateforme || 25;
        const defaultMargin = defaultAff + defaultPlat;
        const defaultFinalFCFA = Math.round(baseCostFCFA * (1 + defaultMargin / 100));

        this.container.innerHTML = `
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
        <style>
            * { box-sizing: border-box; }
            .pub-container { width: 100%; color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 15px; border-radius: 12px; }
            .pub-title { color: #ffcc00; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; border-left: 4px solid #ffcc00; padding-left: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
            .dakcj-back-btn { background: #16161c; color: #ffcc00; border: 1px solid #ffcc00; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; text-transform: none; }
            .pub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
            .pub-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, .5); }
            .pub-card-title { font-size: 14px; font-weight: 900; color: #ffcc00; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #282836; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
            
            .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; }
            .form-group label { font-size: 11px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
            .form-group label i { color: #ffcc00; }
            .form-group input, .form-group select, .form-group textarea { width: 100%; background: #0d0d11; border: 1px solid #282836; color: #ffcc00; padding: 10px 12px; border-radius: 6px; font-size: 13px; outline: none; }
            .form-group textarea { resize: vertical; min-height: 120px; }

            .price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            
            .checkbox-group { display: flex; gap: 15px; margin-bottom: 15px; background: #0a0c10; padding: 10px; border-radius: 8px; border: 1px solid #282836; }
            .checkbox-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #ffcc00; font-weight: 700; cursor: pointer; }
            .checkbox-item input { width: auto; cursor: pointer; }

            .variant-box { background: #0a0c10; border: 1px dashed #ffcc00; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
            .variant-title { font-size: 11px; font-weight: 800; color: #ffcc00; margin-bottom: 10px; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; }
            .variant-list { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; max-height: 350px; overflow-y: auto; padding-right: 4px; }
            .variant-card-item { display: flex; flex-direction: column; gap: 6px; background: #13131a; padding: 10px; border-radius: 8px; border: 1px solid #282836; }
            .variant-card-top { display: flex; align-items: center; gap: 10px; }
            .variant-card-top img { width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid #ffcc00; background: #000; flex-shrink: 0; }
            .variant-card-inputs { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 6px; align-items: center; width: 100%; }
            .variant-card-inputs input { background: #050505; border: 1px solid #282836; color: #ffcc00; padding: 6px 8px; border-radius: 4px; font-size: 11px; width: 100%; }
            .btn-remove-variant { color: #ef4444; cursor: pointer; background: transparent; border: none; font-size: 16px; font-weight: 900; padding: 4px 8px; }

            .commission-box { background: #0d0d11; border: 1px solid #ffcc00; border-radius: 8px; padding: 12px; margin-top: 10px; }
            .commission-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; margin-bottom: 8px; }
            .commission-input input { width: 100%; background: #050505; border: 1px solid #333; color: #ffcc00; padding: 8px; border-radius: 6px; text-align: center; font-weight: 800; }
            .commission-calc-info { font-size: 10px; color: #22c55e; text-align: center; font-weight: 700; background: #050505; padding: 8px; border-radius: 6px; border: 1px solid #282836; line-height: 1.5; white-space: pre-line; }
            
            .btn-pub-action { background: linear-gradient(135deg, #ffcc00, #e6b800); color: #000; font-weight: 900; border: none; padding: 14px 25px; border-radius: 8px; cursor: pointer; transition: .2s; text-transform: uppercase; font-size: 13px; width: 100%; margin-top: 15px; }
            .btn-pub-all { background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff; font-weight: 900; border: 1px solid #4ade80; padding: 14px 25px; border-radius: 8px; cursor: pointer; transition: .2s; text-transform: uppercase; font-size: 13px; width: 100%; margin-top: 10px; }
            .btn-pub-all:disabled, .btn-pub-action:disabled { opacity: 0.5; cursor: not-allowed; }

            /* Espace multi-produits haute capacité */
            .bulk-queue-panel { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 16px; margin-top: 20px; }
            .bulk-queue-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
            .bulk-queue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; max-height: 520px; overflow-y: auto; padding-right: 4px; }
            .bulk-item-card { background: #0a0c10; border: 1px solid #282836; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; gap: 6px; cursor: pointer; transition: .15s; }
            .bulk-item-card.active { border-color: #ffcc00; box-shadow: 0 0 10px rgba(255, 204, 0, 0.25); }
            .bulk-item-card img { width: 100%; height: 95px; object-fit: contain; background: #050505; border-radius: 6px; }
            .bulk-item-name { font-size: 11px; font-weight: 700; color: #f5f5f7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .bulk-item-meta { font-size: 10px; color: #ffcc00; font-weight: 700; }
            .bulk-pager { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 12px; font-size: 11px; }
            .bulk-pager button { background: #0d0d11; color: #ffcc00; border: 1px solid #ffcc00; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-weight: 700; }
            .bulk-pager button:disabled { opacity: 0.4; cursor: not-allowed; }
            
            .preview-box { min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0d0d11; border: 1px dashed #282836; border-radius: 8px; padding: 15px; gap: 8px; }
            .status-box { margin-bottom: 15px; padding: 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: #050505; border: 1px solid #282836; color: #ffcc00; text-align: center; }

            /* Styles du sélecteur exhaustif intégré */
            .dpe-select-container { position: relative; width: 100%; max-width: 100%; margin: 0 0 15px 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; user-select: none; }
            .dpe-select-trigger { background-color: #0a0a0a; border: 1.5px solid #d4af37; border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; color: #ffffff; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.75); }
            .dpe-select-trigger:hover { background-color: #14120c; }
            .dpe-trigger-left { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 700; }
            .dpe-trigger-icon { font-size: 1.2rem; }
            .dpe-trigger-arrow { color: #d4af37; font-size: 0.8rem; transition: transform 0.2s ease; }
            .dpe-select-container.open .dpe-trigger-arrow { transform: rotate(180deg); }
            .dpe-select-dropdown { display: none; position: absolute; top: calc(100% + 6px); left: 0; right: 0; background-color: #0c0c0c; border: 1px solid #3d3116; border-radius: 10px; z-index: 9999; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.95); overflow: hidden; }
            .dpe-select-container.open .dpe-select-dropdown { display: block; }
            .dpe-dropdown-search-wrap { padding: 10px; background-color: #121212; border-bottom: 1px solid #241e10; display: flex; gap: 6px; }
            .dpe-dropdown-search { flex: 1; box-sizing: border-box; background-color: #050505; border: 1px solid #d4af37; color: #ffffff; padding: 8px 10px; border-radius: 6px; font-size: 0.85rem; outline: none; }
            .dpe-custom-submit-btn { background: linear-gradient(135deg, #d4af37 0%, #aa8520 100%); color: #050505; font-weight: 700; border: none; border-radius: 6px; padding: 0 12px; cursor: pointer; font-size: 0.8rem; white-space: nowrap; }
            .dpe-options-list { max-height: 300px; overflow-y: auto; padding: 6px; }
            .dpe-options-list::-webkit-scrollbar { width: 4px; }
            .dpe-options-list::-webkit-scrollbar-thumb { background: #4a3b18; border-radius: 4px; }
            .dpe-group-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #d4af37; padding: 10px 6px 4px; letter-spacing: 0.6px; grid-column: 1 / -1; border-bottom: 1px solid #1f190d; margin-top: 4px; }
            .dpe-grid-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; padding-top: 4px; }
            @media (min-width: 640px) { .dpe-grid-options { grid-template-columns: repeat(4, 1fr); } }
            .dpe-option-card { background-color: #111111; border: 1px solid #222222; border-radius: 6px; padding: 8px 6px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; cursor: pointer; transition: all 0.15s ease; }
            .dpe-option-card:hover { background-color: #1c170b; border-color: #d4af37; }
            .dpe-option-card.selected { background-color: #241d0d; border-color: #d4af37; box-shadow: 0 0 8px rgba(212, 175, 55, 0.2); }
            .dpe-opt-icon { font-size: 1.2rem; line-height: 1; }
            .dpe-opt-text { font-size: 0.68rem; font-weight: 600; color: #f0f0f0; line-height: 1.2; }
        </style>

        <div class="pub-container">
            <div class="pub-title">
                <span>📦 Publication CJ — DAKPROÉLITE</span>
                <button type="button" class="dakcj-back-btn" id="dakcj-back">← Retour au Catalogue</button>
            </div>
            <div id="adminPublicationStatus" class="status-box">Produit CJ chargé avec succès. Prêt pour la publication (${this.queue.length} article(s) en file)</div>

            <div class="pub-grid">
                <div class="pub-card">
                    <div class="pub-card-title">📝 Informations de l'Article CJ</div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-list"></i> Catégorie de l'Article</label>
                        <!-- Sélecteur Exhaustif Intégré -->
                        <div class="dpe-select-container" id="dpeCjSelectorBox">
                            <div class="dpe-select-trigger" id="dpeSelectTrigger">
                                <div class="dpe-trigger-left">
                                    <span class="dpe-trigger-icon" id="dpeSelectedIcon">🌐</span>
                                    <span id="dpeSelectedText">${productCategoryValue}</span>
                                </div>
                                <span class="dpe-trigger-arrow">▼</span>
                            </div>
                            <div class="dpe-select-dropdown" id="dpeSelectDropdown">
                                <div class="dpe-dropdown-search-wrap">
                                    <input type="text" id="dpeDropdownSearch" class="dpe-dropdown-search" placeholder="🔎 Rechercher ou saisir une catégorie...">
                                    <button type="button" id="dpeCustomSubmitBtn" class="dpe-custom-submit-btn">OK</button>
                                </div>
                                <div class="dpe-options-list" id="dpeOptionsList">
                                    <div class="dpe-grid-options" id="dpeGridContainer"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-user"></i> Nom du Vendeur / Boutique</label>
                        <input type="text" id="adminVendeurNom" value="CJdropshipping International">
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-heading"></i> Nom de l'Article</label>
                        <input type="text" id="adminProductName" value="${this.product.name || ''}">
                    </div>

                    <div class="price-grid">
                        <div class="form-group">
                            <label><i class="fa-solid fa-coins"></i> Prix Réel de Base (CJ en FCFA)</label>
                            <input type="number" id="adminBasePrice" value="${baseCostFCFA}" readonly style="color: #9ca3af; background: #050505;">
                        </div>
                        <div class="form-group">
                            <label><i class="fa-solid fa-money-bill"></i> Prix Final Calculé (FCFA)</label>
                            <input type="number" id="adminProductPrice" value="${defaultFinalFCFA}" min="0" step="0.01">
                        </div>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-tag"></i> Prix Promo (Optionnel)</label>
                        <input type="number" id="adminProductPromoPrice" placeholder="Ex: 22000" min="0" step="0.01">
                    </div>

                    <div class="checkbox-group">
                        <label class="checkbox-item">
                            <input type="checkbox" id="isFlashCheck"> 🔥 Offre Flash
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="isRecommandeCheck" checked> ⭐ Recommandé / Sponsorisé
                        </label>
                    </div>

                    <div class="variant-box">
                        <div class="variant-title">
                            <span>🎨 Variantes CJ & Photos Synchronisées</span>
                            <span id="variantCounter" style="color:#22c55e; font-size:10px;">0 variante(s)</span>
                        </div>
                        <div id="variantList" class="variant-list">
                            <div style="text-align:center; color:#777; font-size:11px; padding:10px;">Chargement automatique des variantes CJ...</div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-align-left"></i> Description Officielle de l'Article (CJ)</label>
                        <textarea id="adminProductDescription">${parseDescription(this.product.description || this.product.desc || "")}</textarea>
                    </div>

                    <div class="commission-box">
                        <div class="commission-title" style="font-size:11px;font-weight:800;color:#ffcc00;margin-bottom:8px;">💰 Répartition des Commissions & Marge (5% + 25% = 30%)</div>
                        <div class="commission-grid">
                            <div class="commission-input">
                                <label style="font-size:9px;color:#aaa;">Affiliation (%)</label>
                                <input type="number" id="adminCommissionAffiliation" value="${defaultAff}" min="0" max="100" style="color:#ffcc00;">
                            </div>
                            <div class="commission-input">
                                <label style="font-size:9px;color:#aaa;">Plateforme (%)</label>
                                <input type="number" id="adminCommissionPlateforme" value="${defaultPlat}" min="0" max="100" style="color:#3b82f6;">
                            </div>
                        </div>
                        <div id="commissionCalcDisplay" class="commission-calc-info">
                            Marge totale (30%) : 0 FCFA | Affiliation (5%) : 0 FCFA | Plateforme (25%) : 0 FCFA
                        </div>
                    </div>

                    <button type="button" id="adminAddProduct" class="btn-pub-action">🚀 Publier l'Article CJ & Générer le Lien d'Affiliation</button>
                    <button type="button" id="adminPublishAllProducts" class="btn-pub-all">⚡ Publier Tous les Produits & Variantes (${this.queue.length})</button>
                </div>

                <div class="pub-card">
                    <div class="pub-card-title">👁️ Aperçu de l'Image Officielle CJ</div>
                    <div id="adminPreviewBox" class="preview-box">
                        <img id="imagePreviewImg" src="${this.product.image}" style="width:100%; max-height:280px; object-fit:contain; border-radius:6px; background:#0b0b0e;" referrerpolicy="no-referrer" crossorigin="anonymous">
                    </div>
                </div>
            </div>

            <!-- Espace d'affichage de tous les produits importés (supporte grand volume avec pagination) -->
            <div class="bulk-queue-panel" id="dpeBulkQueuePanel">
                <div class="bulk-queue-header">
                    <div style="font-size:13px;font-weight:900;color:#ffcc00;text-transform:uppercase;">
                        📚 Produits Prêts à Publier (${this.queue.length} article(s))
                    </div>
                    <div style="font-size:11px;color:#a1a1aa;">
                        Cliquez sur un article pour inspecter/modifier ses variantes et sa description avant publication globale
                    </div>
                </div>
                <div class="bulk-queue-grid" id="dpeBulkQueueGrid"></div>
                <div class="bulk-pager">
                    <button type="button" id="dpeQueuePrev">← Précédent</button>
                    <span id="dpeQueuePageInfo">Page 1 / 1</span>
                    <button type="button" id="dpeQueueNext">Suivant →</button>
                </div>
            </div>
        </div>
        `;

        this.setupEvents();
        this.initSelectorLogic();
        this.renderQueueGrid();
        this.updateCalculations();
    }

    renderQueueGrid() {
        const grid = document.getElementById("dpeBulkQueueGrid");
        const pageInfo = document.getElementById("dpeQueuePageInfo");
        const prevBtn = document.getElementById("dpeQueuePrev");
        const nextBtn = document.getElementById("dpeQueueNext");
        if (!grid) return;

        const totalPages = Math.max(1, Math.ceil(this.queue.length / this.queuePageSize));
        if (this.queuePage > totalPages) this.queuePage = totalPages;

        const start = (this.queuePage - 1) * this.queuePageSize;
        const slice = this.queue.slice(start, start + this.queuePageSize);

        grid.innerHTML = slice.map((item, idx) => {
            const realIndex = start + idx;
            const imgSrc = cleanImageUrl(item.image || item.bigImage || item.productImage);
            const priceUsd = Number(item.price || item.sellPrice || 0);
            const isActive = realIndex === this.activeIndex;
            return `
                <div class="bulk-item-card ${isActive ? "active" : ""}" data-qidx="${realIndex}">
                    <img src="${imgSrc}" alt="${item.name || 'Article'}" loading="lazy" referrerpolicy="no-referrer">
                    <div class="bulk-item-name">${item.name || item.productNameEn || 'Article CJ'}</div>
                    <div class="bulk-item-meta">${priceUsd ? "$" + priceUsd.toFixed(2) : "FCFA"}</div>
                </div>
            `;
        }).join("");

        grid.querySelectorAll("[data-qidx]").forEach(el => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.qidx, 10);
                this.selectQueueItem(idx);
            });
        });

        if (pageInfo) pageInfo.textContent = `Page ${this.queuePage} / ${totalPages} (${this.queue.length} total)`;
        if (prevBtn) prevBtn.disabled = this.queuePage <= 1;
        if (nextBtn) nextBtn.disabled = this.queuePage >= totalPages;
    }

    selectQueueItem(index) {
        if (!this.queue[index]) return;
        this.activeIndex = index;
        this.product = { ...this.queue[index] };
        this.product.image = cleanImageUrl(this.product.image || this.product.bigImage || this.product.productImage);
        productCategoryValue = this.product.categoryName || this.product.category || productCategoryValue || "Général";

        const nameEl = document.getElementById("adminProductName");
        const descEl = document.getElementById("adminProductDescription");
        const prevImg = document.getElementById("imagePreviewImg");
        const catText = document.getElementById("dpeSelectedText");

        if (nameEl) nameEl.value = this.product.name || this.product.productNameEn || "";
        if (descEl) descEl.value = parseDescription(this.product.description || this.product.desc || "");
        if (prevImg) prevImg.src = this.product.image;
        if (catText) catText.textContent = productCategoryValue;

        variantsArray = [];
        this.renderVariantCards();
        this.updateCalculations();
        this.renderQueueGrid();
        this.fetchDetailsAndVariants();
    }

    initSelectorLogic() {
        const CJ_MASSIVE_DATA = [
            { group: "🌐 GLOBAL", icon: "🌐", label: "Tout afficher", query: "" },
            { group: "👗 MODE & HABILLEMENT", icon: "👗", label: "Habits Femme", query: "Women Clothing" },
            { group: "👗 MODE & HABILLEMENT", icon: "💃", label: "Robes & Jupes", query: "Women Dress Skirt" },
            { group: "👗 MODE & HABILLEMENT", icon: "👚", label: "Hauts & Blouses", query: "Women Blouse Crop Top" },
            { group: "👗 MODE & HABILLEMENT", icon: "👖", label: "Jeans & Pantalons", query: "Women Jeans Pants" },
            { group: "👗 MODE & HABILLEMENT", icon: "👙", label: "Lingerie & Shapewear", query: "Women Lingerie Shapewear" },
            { group: "👗 MODE & HABILLEMENT", icon: "👔", label: "Habits Homme", query: "Men Clothing" },
            { group: "👗 MODE & HABILLEMENT", icon: "👕", label: "T-Shirts & Polos", query: "Men T-Shirt Polo" },
            { group: "👗 MODE & HABILLEMENT", icon: "🧥", label: "Chemises & Costumes", query: "Men Shirt Suit Blazer" },
            { group: "👗 MODE & HABILLEMENT", icon: "🩳", label: "Pantalons & Survêtements", query: "Men Pants Tracksuit" },
            { group: "👗 MODE & HABILLEMENT", icon: "🧸", label: "Habits Enfants & Bébé", query: "Kids Baby Clothing" },
            { group: "👗 MODE & HABILLEMENT", icon: "👟", label: "Chaussures & Baskets", query: "Men Women Shoes Sneakers" },
            { group: "👗 MODE & HABILLEMENT", icon: "🥿", label: "Mocassins & Talons", query: "Loafers High Heels" },
            { group: "👗 MODE & HABILLEMENT", icon: "👜", label: "Sacs à Main & Valises", query: "Handbag Backpack Luggage" },
            { group: "👗 MODE & HABILLEMENT", icon: "⌚", label: "Montres & Bijoux", query: "Watch Jewelry Sunglasses" },
            { group: "👗 MODE & HABILLEMENT", icon: "💇‍♀️", label: "Perruques & Extensions", query: "Human Hair Wig Extensions" },
            { group: "👗 MODE & HABILLEMENT", icon: "💄", label: "Maquillage & Cosmétiques", query: "Makeup Cosmetics Beauty" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "⚡", label: "Motos Électriques", query: "Electric Motorcycle" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "🛵", label: "Scooters & Trottinettes", query: "Electric Scooter Adult" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "🔋", label: "Batteries & Chargeurs Moto", query: "Electric Motorcycle Battery Charger" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "🏍️", label: "Motos à Carburant", query: "Gasoline Motorcycle" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "🏁", label: "Motos Cross & Quads", query: "Dirt Bike ATV Quad" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "🪖", label: "Casques & Équipements Moto", query: "Motorcycle Helmet Gloves" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "🚗", label: "Voitures & Accessoires", query: "Car Accessories Auto Parts" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "🔧", label: "Pièces Détachées Auto", query: "Car Replacement Auto Parts" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "💨", label: "Échappement & Silencieux", query: "Exhaust Pipe Muffler" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "🛑", label: "Freins & Amortisseurs", query: "Brake Pads Shock Absorber" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "⚙️", label: "Moteur, Carburateur & Bougie", query: "Carburetor Spark Plug Engine" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "📻", label: "Autoradio, GPS & Caméra Recul", query: "Car Android Radio GPS Camera" },
            { group: "🏍️ MOTOS, VOITURES & PIÈCES", icon: "🛞", label: "Pneus & Jantes", query: "Car Scooter Tires Wheels" },
            { group: "📱 HIGH-TECH & INFORMATIQUE", icon: "📱", label: "Smartphones & Accessoires", query: "Smartphone Case Accessories" },
            { group: "📱 HIGH-TECH & INFORMATIQUE", icon: "🔌", label: "Chargeurs Rapides & PowerBank", query: "Fast Charger USB Cable Power Bank" },
            { group: "📱 HIGH-TECH & INFORMATIQUE", icon: "🎧", label: "Écouteurs & Casques Bluetooth", query: "Wireless Bluetooth Earbuds Headphones" },
            { group: "📱 HIGH-TECH & INFORMATIQUE", icon: "💻", label: "Ordinateurs & Tablettes", query: "Laptop Tablet Computer" },
            { group: "📱 HIGH-TECH & INFORMATIQUE", icon: "🖱️", label: "Souris, Claviers & Hubs", query: "Wireless Mouse Keyboard USB Hub" },
            { group: "📱 HIGH-TECH & INFORMATIQUE", icon: "📡", label: "Routeurs WiFi & Réseau", query: "4G WiFi Router Extender" },
            { group: "📱 HIGH-TECH & INFORMATIQUE", icon: "📹", label: "Caméras Surveillance & Sécurité", query: "WiFi Solar Security Camera" },
            { group: "📱 HIGH-TECH & INFORMATIQUE", icon: "🎮", label: "Consoles & Jeux Vidéo", query: "Video Game Console Controller" },
            { group: "📱 HIGH-TECH & INFORMATIQUE", icon: "🚁", label: "Drones & Caméras Action", query: "RC Drone Action Camera" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "☀️", label: "Panneaux & Kits Solaires", query: "Solar Panel Power System" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "💡", label: "Projecteurs & Lampes LED", query: "Solar LED Flood Light" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "🏠", label: "Maison & Électroménager", query: "Home Kitchen Appliances Air Fryer" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "🛋️", label: "Meubles & Décoration", query: "Home Furniture Decor" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "🛏️", label: "Literie & Rideaux", query: "Bedding Duvet Curtains" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "⚽", label: "Sport, Fitness & Musculation", query: "Sports Fitness Gym" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "🏕️", label: "Camping & Randonnée", query: "Camping Outdoor Tent" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "🎣", label: "Chasse & Pêche", query: "Fishing Rod Tackle" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "🧸", label: "Jouets & Poussettes Bébé", query: "Kids Toys Baby Stroller" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "🛠️", label: "Outils Électriques & BTP", query: "Power Tools Hardware Drill" },
            { group: "🏠 MAISON, SOLAIRE & OUTILLAGE", icon: "🌱", label: "Jardinage & Animaux", query: "Garden Supplies Pet Dog Cat" }
        ];

        const box = document.getElementById("dpeCjSelectorBox");
        const trigger = document.getElementById("dpeSelectTrigger");
        const searchInput = document.getElementById("dpeDropdownSearch");
        const submitBtn = document.getElementById("dpeCustomSubmitBtn");
        const gridContainer = document.getElementById("dpeGridContainer");
        const selectedIcon = document.getElementById("dpeSelectedIcon");
        const selectedText = document.getElementById("dpeSelectedText");

        if (!box || !trigger) return;

        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            box.classList.toggle("open");
            if (box.classList.contains("open") && searchInput) {
                searchInput.focus();
            }
        });

        document.addEventListener("click", (e) => {
            if (!box.contains(e.target)) {
                box.classList.remove("open");
            }
        });

        const renderGrid = (filter = "") => {
            const term = filter.toLowerCase().trim();
            if (!gridContainer) return;
            gridContainer.innerHTML = "";

            const filtered = CJ_MASSIVE_DATA.filter(item =>
                item.label.toLowerCase().includes(term) ||
                item.group.toLowerCase().includes(term) ||
                item.query.toLowerCase().includes(term)
            );

            if (term) {
                const customCard = document.createElement("div");
                customCard.className = "dpe-option-card";
                customCard.style.gridColumn = "1 / -1";
                customCard.style.backgroundColor = "#1c170b";
                customCard.style.borderColor = "#d4af37";
                customCard.innerHTML = `
                    <span class="dpe-opt-icon">🔍</span>
                    <span class="dpe-opt-text" style="color:#d4af37; font-weight:bold;">Saisir : "${filter}"</span>
                `;
                customCard.onclick = () => selectCategory("🔍", filter, filter);
                gridContainer.appendChild(customCard);
            }

            let lastGroup = "";
            filtered.forEach(item => {
                if (item.group !== lastGroup) {
                    lastGroup = item.group;
                    const grp = document.createElement("div");
                    grp.className = "dpe-group-label";
                    grp.textContent = item.group;
                    gridContainer.appendChild(grp);
                }

                const card = document.createElement("div");
                card.className = "dpe-option-card";
                card.innerHTML = `
                    <span class="dpe-opt-icon">${item.icon}</span>
                    <span class="dpe-opt-text">${item.label}</span>
                `;
                card.onclick = () => selectCategory(item.icon, item.label, item.label);
                gridContainer.appendChild(card);
            });
        };

        const selectCategory = (icon, label, apiQuery) => {
            productCategoryValue = label;
            if (selectedIcon) selectedIcon.textContent = icon;
            if (selectedText) selectedText.textContent = label;
            box.classList.remove("open");
        };

        if (searchInput) {
            searchInput.addEventListener("input", (e) => renderGrid(e.target.value));
            searchInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    const val = searchInput.value.trim();
                    if (val) selectCategory("🔍", val, val);
                }
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener("click", () => {
                const val = searchInput ? searchInput.value.trim() : "";
                if (val) selectCategory("🔍", val, val);
            });
        }

        renderGrid();
    }

    updateCalculations() {
        const rawUSD = Number(this.product.price || 0);
        const rate = CONFIG.exchangeRate;
        const baseCostFCFA = Math.round(rawUSD * rate);

        const affInput = document.getElementById("adminCommissionAffiliation");
        const platInput = document.getElementById("adminCommissionPlateforme");
        const basePriceInput = document.getElementById("adminBasePrice");
        const finalPriceInput = document.getElementById("adminProductPrice");

        const affPct = affInput ? parseFloat(affInput.value) || 0 : (CONFIG.commissions.affiliation || 5);
        const platPct = platInput ? parseFloat(platInput.value) || 0 : (CONFIG.commissions.plateforme || 25);
        const totalMarginPercent = affPct + platPct;
        
        const totalMarginFCFA = Math.round(baseCostFCFA * (totalMarginPercent / 100));
        const finalPrice = baseCostFCFA + totalMarginFCFA;

        if (basePriceInput) basePriceInput.value = baseCostFCFA;
        if (finalPriceInput) finalPriceInput.value = finalPrice;

        const affFCFA = totalMarginPercent > 0 ? Math.round(totalMarginFCFA * (affPct / totalMarginPercent)) : 0;
        const platFCFA = totalMarginPercent > 0 ? Math.round(totalMarginFCFA * (platPct / totalMarginPercent)) : 0;

        const calcDisplay = document.getElementById("commissionCalcDisplay");
        if (calcDisplay) {
            calcDisplay.textContent = `Marge totale (${totalMarginPercent}%) : ${totalMarginFCFA} FCFA\n🔹 Affiliation (${affPct}%) : ${affFCFA} FCFA\n🔹 Plateforme (${platPct}%) : ${platFCFA} FCFA`;
        }

        if (variantsArray && variantsArray.length > 0) {
            variantsArray = variantsArray.map(v => {
                const vBaseUSD = Number(v.baseUsd || this.product.price || 0);
                const vBaseFCFA = Math.round(vBaseUSD * rate);
                const vMargin = Math.round(vBaseFCFA * (totalMarginPercent / 100));
                return {
                    ...v,
                    prix: vBaseFCFA + vMargin
                };
            });
            this.renderVariantCards();
        }
    }

    setupEvents() {
        const backBtn = document.getElementById("dakcj-back");
        if (backBtn) {
            backBtn.addEventListener("click", () => returnToCatalog());
        }

        const affInput = document.getElementById("adminCommissionAffiliation");
        const platInput = document.getElementById("adminCommissionPlateforme");

        if (affInput) affInput.addEventListener("input", () => this.updateCalculations());
        if (platInput) platInput.addEventListener("input", () => this.updateCalculations());

        const pubBtn = document.getElementById("adminAddProduct");
        if (pubBtn) {
            pubBtn.addEventListener("click", () => this.saveProduct());
        }

        const pubAllBtn = document.getElementById("adminPublishAllProducts");
        if (pubAllBtn) {
            pubAllBtn.addEventListener("click", () => this.publishAllProducts());
        }

        const qPrev = document.getElementById("dpeQueuePrev");
        const qNext = document.getElementById("dpeQueueNext");
        if (qPrev) {
            qPrev.addEventListener("click", () => {
                if (this.queuePage > 1) {
                    this.queuePage--;
                    this.renderQueueGrid();
                }
            });
        }
        if (qNext) {
            qNext.addEventListener("click", () => {
                const totalPages = Math.max(1, Math.ceil(this.queue.length / this.queuePageSize));
                if (this.queuePage < totalPages) {
                    this.queuePage++;
                    this.renderQueueGrid();
                }
            });
        }
    }

    async fetchVariantsForItem(item, affPct, platPct) {
        if (!item || !item.pid) return [];
        try {
            const res = await fetch(`${CONFIG.API}?action=variants&pid=${item.pid}`);
            const json = await res.json();
            const dataObj = json?.data || json || {};
            const rawVar = dataObj.variants || dataObj.list || json.variants || json.list || (Array.isArray(json?.data) ? json.data : []);
            const rate = CONFIG.exchangeRate;
            const totalMarginPercent = affPct + platPct;
            const fallbackImg = cleanImageUrl(item.image || item.bigImage || item.productImage);

            return rawVar.map((v, i) => {
                const vImg = cleanImageUrl(v.variantImage || v.image || fallbackImg);
                const vBaseUSD = Number(v.variantPrice || v.price || item.price || 0);
                const vBaseFCFA = Math.round(vBaseUSD * rate);
                const vMargin = Math.round(vBaseFCFA * (totalMarginPercent / 100));
                return {
                    id: v.variantId || `var_${i}`,
                    baseUsd: vBaseUSD,
                    couleur: v.variantNameEn || v.variantName || `Variante ${i + 1}`,
                    prix: vBaseFCFA + vMargin,
                    stock: Number(v.variantStock || 50),
                    image: vImg
                };
            });
        } catch (e) {
            return [];
        }
    }

    async fetchDetailsAndVariants() {
        if (!this.product.pid) return;
        try {
            const res = await fetch(`${CONFIG.API}?action=variants&pid=${this.product.pid}`);
            const json = await res.json();
            const dataObj = json?.data || json || {};
            
            if (dataObj.categoryName || dataObj.category) {
                productCategoryValue = dataObj.categoryName || dataObj.category;
            } else if (this.product.categoryName || this.product.category) {
                productCategoryValue = this.product.categoryName || this.product.category;
            }

            const remoteDesc = dataObj.description || dataObj.desc || dataObj.bodyHtml || json.description || json.desc || "";
            if (remoteDesc) {
                const cleanedDesc = parseDescription(remoteDesc);
                this.product.description = cleanedDesc;
                const descEl = document.getElementById("adminProductDescription");
                if (descEl) descEl.value = cleanedDesc;
            }

            const affPct = parseFloat(document.getElementById("adminCommissionAffiliation")?.value) || (CONFIG.commissions.affiliation || 5);
            const platPct = parseFloat(document.getElementById("adminCommissionPlateforme")?.value) || (CONFIG.commissions.plateforme || 25);

            variantsArray = await this.fetchVariantsForItem(this.product, affPct, platPct);
            this.renderVariantCards();
        } catch (e) {
            console.warn("Variantes CJ partielles :", e);
        }
    }

    renderVariantCards() {
        const variantList = document.getElementById("variantList");
        const variantCounter = document.getElementById("variantCounter");
        if (!variantList) return;

        variantCounter.textContent = `${variantsArray.length} variante(s)`;
        if (variantsArray.length === 0) {
            variantList.innerHTML = `<div style="text-align:center; color:#777; font-size:11px; padding:10px;">Aucune variante CJ spécifique. Produit standard utilisé.</div>`;
            return;
        }

        variantList.innerHTML = variantsArray.map((item, index) => `
            <div class="variant-card-item" data-index="${index}">
                <div class="variant-card-top">
                    <img src="${item.image}" alt="Variante" referrerpolicy="no-referrer" crossorigin="anonymous">
                    <div class="variant-card-inputs">
                        <input type="text" class="var-name-input" value="${item.couleur}" data-index="${index}">
                        <input type="number" class="var-price-input" value="${item.prix || ''}" placeholder="Prix" data-index="${index}">
                        <input type="number" class="var-stock-input" value="${item.stock || 10}" placeholder="Stock" data-index="${index}">
                        <button type="button" class="btn-remove-variant" onclick="window.removeVariantItem(${index})">✕</button>
                    </div>
                </div>
            </div>
        `).join("");

        window.removeVariantItem = (idx) => {
            variantsArray.splice(idx, 1);
            this.renderVariantCards();
        };

        variantList.querySelectorAll(".var-name-input").forEach(inp => {
            inp.addEventListener("input", e => variantsArray[e.target.dataset.index].couleur = e.target.value);
        });
        variantList.querySelectorAll(".var-price-input").forEach(inp => {
            inp.addEventListener("input", e => variantsArray[e.target.dataset.index].prix = e.target.value ? parseFloat(e.target.value) : null);
        });
        variantList.querySelectorAll(".var-stock-input").forEach(inp => {
            inp.addEventListener("input", e => variantsArray[e.target.dataset.index].stock = e.target.value ? parseInt(e.target.value, 10) : 10);
        });
    }

    buildPayloadForItem(item, options = {}) {
        const {
            nom,
            vendeurNom,
            prixBase,
            prix,
            promoValue,
            description,
            variantes,
            image,
            categorie,
            affPct,
            platPct,
            isFlash,
            isRecommande,
            vendeurUid
        } = options;

        const margeAppliquee = affPct + platPct;
        const newRef = push(ref(this.db, CONFIG.FIREBASE_PATH));
        const prodId = newRef.key;
        const baseUrl = window.location.origin + window.location.pathname;
        const lienAffiliation = `${baseUrl}?produit=${prodId}&ref=${vendeurUid}`;

        const now = new Date();
        const dateStr = now.toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

        return {
            prodId,
            payload: {
                id: prodId,
                nom: nom,
                nom_en: nom,
                titre: nom,
                fournisseur: "CJdropshipping",
                cjPid: String(item.pid || ""),
                vendeurNom: vendeurNom,
                vendeurId: vendeurUid,
                categorie: categorie,
                sousCategorie: categorie,
                prix: prix,
                prixBase: prixBase,
                margePourcentage: margeAppliquee,
                prixPromo: promoValue,
                devise: "FCFA",
                taillesDisponibles: [],
                variantes: variantes || [],
                image: cleanImageUrl(image),
                description: description || "",
                isFlash: isFlash,
                isRecommande: isRecommande,
                lienAffiliation: lienAffiliation,
                commissions: {
                    seller: Math.max(0, 100 - margeAppliquee),
                    affiliate: affPct,
                    platform: platPct,
                    affiliation: affPct,
                    plateforme: platPct
                },
                actif: true,
                createdBy: vendeurUid,
                createdAt: serverTimestamp(),
                datePublication: dateStr,
                heurePublication: timeStr
            }
        };
    }

    async saveProduct() {
        const nomEl = document.getElementById("adminProductName");
        const vendeurEl = document.getElementById("adminVendeurNom");
        const prixEl = document.getElementById("adminProductPrice");
        const basePriceEl = document.getElementById("adminBasePrice");
        const promoEl = document.getElementById("adminProductPromoPrice");
        const descEl = document.getElementById("adminProductDescription");
        const flashEl = document.getElementById("isFlashCheck");
        const recoEl = document.getElementById("isRecommandeCheck");
        const statusBox = document.getElementById("adminPublicationStatus");
        const publishBtn = document.getElementById("adminAddProduct");
        const publishAllBtn = document.getElementById("adminPublishAllProducts");

        const nom = nomEl ? nomEl.value.trim() : "";
        const vendeurNom = vendeurEl ? vendeurEl.value.trim() || "CJdropshipping" : "CJdropshipping";
        const prix = prixEl ? parseFloat(prixEl.value) : 0;
        const prixBase = basePriceEl ? parseFloat(basePriceEl.value) : 0;
        
        const affPct = parseFloat(document.getElementById("adminCommissionAffiliation")?.value) ?? CONFIG.commissions.affiliation;
        const platPct = parseFloat(document.getElementById("adminCommissionPlateforme")?.value) ?? CONFIG.commissions.plateforme;

        const isFlash = flashEl ? flashEl.checked : false;
        const isRecommande = recoEl ? recoEl.checked : false;

        if (!nom || isNaN(prix) || prix < 0) {
            return alert("⚠️ Veuillez remplir le nom de l'article et indiquer un prix valide.");
        }

        if (publishBtn) {
            publishBtn.disabled = true;
            publishBtn.textContent = "⚡ PUBLICATION SUR FIREBASE...";
        }
        if (publishAllBtn) publishAllBtn.disabled = true;

        try {
            const currentUser = window.currentUser || this.auth.currentUser || null;
            const vendeurUid = currentUser?.uid || "admin_dakpro_id";
            const promoValue = promoEl && promoEl.value ? parseFloat(promoEl.value) : null;
            const descValue = descEl ? descEl.value.trim() : "";
            const catValue = productCategoryValue || "Général";

            const { prodId, payload } = this.buildPayloadForItem(this.product, {
                nom,
                vendeurNom,
                prixBase,
                prix,
                promoValue,
                description: descValue,
                variantes: variantsArray,
                image: this.product.image,
                categorie: catValue,
                affPct,
                platPct,
                isFlash,
                isRecommande,
                vendeurUid
            });

            await set(ref(this.db, `${CONFIG.FIREBASE_PATH}/${prodId}`), payload);
            await set(ref(this.db, `produits/${prodId}`), payload);

            if (statusBox) statusBox.textContent = "✅ PRODUIT CJ PUBLIÉ AVEC SUCCÈS !";
            alert(`🚀 PRODUIT CJ & VARIANTES PUBLIÉS AVEC SUCCÈS !\n\n🔗 Lien :\n${payload.lienAffiliation}`);
            returnToCatalog();
        } catch (err) {
            console.error(err);
            alert("❌ Erreur : " + err.message);
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.textContent = "🚀 Publier l'Article CJ & Générer le Lien d'Affiliation";
            }
            if (publishAllBtn) publishAllBtn.disabled = false;
        }
    }

    async publishAllProducts() {
        const list = Array.isArray(this.queue) && this.queue.length > 0 ? this.queue : [this.product];
        const vendeurEl = document.getElementById("adminVendeurNom");
        const flashEl = document.getElementById("isFlashCheck");
        const recoEl = document.getElementById("isRecommandeCheck");
        const statusBox = document.getElementById("adminPublicationStatus");
        const publishBtn = document.getElementById("adminAddProduct");
        const publishAllBtn = document.getElementById("adminPublishAllProducts");

        const vendeurNom = vendeurEl ? vendeurEl.value.trim() || "CJdropshipping International" : "CJdropshipping International";
        const affPct = parseFloat(document.getElementById("adminCommissionAffiliation")?.value) ?? CONFIG.commissions.affiliation;
        const platPct = parseFloat(document.getElementById("adminCommissionPlateforme")?.value) ?? CONFIG.commissions.plateforme;
        const margeAppliquee = affPct + platPct;
        const isFlash = flashEl ? flashEl.checked : false;
        const isRecommande = recoEl ? recoEl.checked : false;
        const catValue = productCategoryValue || "Général";

        if (publishBtn) publishBtn.disabled = true;
        if (publishAllBtn) {
            publishAllBtn.disabled = true;
            publishAllBtn.textContent = `⚡ PUBLICATION EN COURS (0 / ${list.length})...`;
        }

        const currentUser = window.currentUser || this.auth.currentUser || null;
        const vendeurUid = currentUser?.uid || "admin_dakpro_id";
        let publishedCount = 0;

        try {
            for (let i = 0; i < list.length; i++) {
                const item = list[i] || {};
                const itemName = (item.name || item.productNameEn || item.productName || "").trim();
                const rawUsd = Number(item.price || item.sellPrice || 0);
                const prixBase = Math.round(rawUsd * CONFIG.exchangeRate);
                const prixFinal = Math.round(prixBase * (1 + margeAppliquee / 100));

                if (!itemName || prixFinal <= 0) {
                    continue;
                }

                const itemDesc = parseDescription(item.description || item.desc || "");
                const itemImage = cleanImageUrl(item.image || item.bigImage || item.productImage);

                let itemVariants = [];
                if (i === this.activeIndex && variantsArray.length > 0) {
                    itemVariants = variantsArray;
                } else {
                    itemVariants = await this.fetchVariantsForItem(item, affPct, platPct);
                }

                const { prodId, payload } = this.buildPayloadForItem(item, {
                    nom: itemName,
                    vendeurNom,
                    prixBase,
                    prix: prixFinal,
                    promoValue: null,
                    description: itemDesc,
                    variantes: itemVariants,
                    image: itemImage,
                    categorie: item.categoryName || item.category || catValue,
                    affPct,
                    platPct,
                    isFlash,
                    isRecommande,
                    vendeurUid
                });

                await set(ref(this.db, `${CONFIG.FIREBASE_PATH}/${prodId}`), payload);
                await set(ref(this.db, `produits/${prodId}`), payload);

                publishedCount++;
                if (publishAllBtn) {
                    publishAllBtn.textContent = `⚡ PUBLICATION EN COURS (${publishedCount} / ${list.length})...`;
                }
                if (statusBox) {
                    statusBox.textContent = `Publication globale : ${publishedCount} / ${list.length} produit(s) publié(s)...`;
                }
            }

            if (statusBox) {
                statusBox.textContent = `✅ ${publishedCount} PRODUIT(S) & VARIANTES PUBLIÉS AVEC SUCCÈS !`;
            }
            alert(`🚀 ${publishedCount} produit(s), images principales et variantes ont été publiés avec succès !`);
            window.dpeBulkQueue = [];
            localStorage.removeItem("dakpro_cj_bulk_queue");
            returnToCatalog();
        } catch (err) {
            console.error(err);
            alert("❌ Erreur lors de la publication globale : " + err.message);
            if (publishBtn) publishBtn.disabled = false;
            if (publishAllBtn) {
                publishAllBtn.disabled = false;
                publishAllBtn.textContent = `⚡ Publier Tous les Produits & Variantes (${list.length})`;
            }
        }
    }
}

export function initPublisher(product, containerId = "module-container") {
    return new DakproCJPublisher(product, containerId);
}
