// ============================================================
// DAKPRO ÉLITE — dakpro-cj-publisher.js
// MODULE DE PUBLICATION UNIFIÉ AVEC RÉCÉPTION ÉTENDUE ET 
// NETTOYAGE DE LA DESCRIPTION OFFICIELLE CJ
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
    marginPercent: 40,
    commissions: {
        seller: 80,
        affiliate: 5,
        platform: 15,
        affiliation: 15,
        platform: 25
    },
    pageSize: 50,
    maxPageSize: 100,
    timeout: 30000
};

let variantsArray = [];
let productCategoryValue = "";

function cleanImageUrl(url) {
    if (!url) return "https://i.postimg.cc/WpSc29mX/file-00000000ca8872438c17222eb828bc0c.png";
    let trimmed = String(url).trim();
    if (trimmed.startsWith("//")) {
        return "https:" + trimmed;
    }
    return trimmed;
}

// Fonction utilitaire pour nettoyer le HTML des descriptions CJ si nécessaire
function parseDescription(rawDesc) {
    if (!rawDesc) return "";
    // Si c'est du HTML, on le convertit grossièrement en texte propre ou on garde le contenu
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = rawDesc;
    let text = tempDiv.textContent || tempDiv.innerText || "";
    return text.trim() ? text.trim() : rawDesc;
}

class DakproCJPublisher {
    constructor(product, containerId = "module-container") {
        this.product = product || {};
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
        const defaultAff = CONFIG.commissions.affiliation || 15;
        const defaultPlat = CONFIG.commissions.platform || 25;
        const defaultMargin = defaultAff + defaultPlat;
        const defaultFinalFCFA = Math.round(baseCostFCFA * (1 + defaultMargin / 100));

        this.container.innerHTML = `
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
        <style>
            * { box-sizing: border-box; }
            .pub-container { width: 100%; color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 15px; border-radius: 12px; }
            .pub-title { color: #ffcc00; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; border-left: 4px solid #ffcc00; padding-left: 10px; display: flex; justify-content: space-between; align-items: center; }
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
            .commission-calc-info { font-size: 10px; color: #22c55e; text-align: center; font-weight: 700; background: #050505; padding: 8px; border-radius: 6px; border: 1px solid #282836; line-height: 1.5; }
            
            .btn-pub-action { background: linear-gradient(135deg, #ffcc00, #e6b800); color: #000; font-weight: 900; border: none; padding: 14px 25px; border-radius: 8px; cursor: pointer; transition: .2s; text-transform: uppercase; font-size: 13px; width: 100%; margin-top: 15px; }
            
            .preview-box { min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0d0d11; border: 1px dashed #282836; border-radius: 8px; padding: 15px; gap: 8px; }
            .status-box { margin-bottom: 15px; padding: 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: #050505; border: 1px solid #282836; color: #ffcc00; text-align: center; }
        </style>

        <div class="pub-container">
            <div class="pub-title">
                <span>📦 Publication CJ — DAKPROÉLITE</span>
                <button type="button" class="dakcj-back-btn" id="dakcj-back">← Retour au Catalogue</button>
            </div>
            <div id="adminPublicationStatus" class="status-box">Produit CJ chargé avec succès. Prêt pour la publication</div>

            <div class="pub-grid">
                <div class="pub-card">
                    <div class="pub-card-title">📝 Informations de l'Article CJ</div>

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
                        <div class="commission-title" style="font-size:11px;font-weight:800;color:#ffcc00;margin-bottom:8px;">💰 Répartition des Commissions & Marge</div>
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
                            Marge totale (0%) : 0 FCFA | Affiliation : 0 FCFA | Plateforme : 0 FCFA
                        </div>
                    </div>

                    <button type="button" id="adminAddProduct" class="btn-pub-action">🚀 Publier l'Article CJ & Générer le Lien d'Affiliation</button>
                </div>

                <div class="pub-card">
                    <div class="pub-card-title">👁️ Aperçu de l'Image Officielle CJ</div>
                    <div id="adminPreviewBox" class="preview-box">
                        <img id="imagePreviewImg" src="${this.product.image}" style="width:100%; max-height:280px; object-fit:contain; border-radius:6px; background:#0b0b0e;" referrerpolicy="no-referrer" crossorigin="anonymous">
                    </div>
                </div>
            </div>
        </div>
        `;

        this.setupEvents();
        this.updateCalculations();
    }

    updateCalculations() {
        const rawUSD = Number(this.product.price || 0);
        const rate = CONFIG.exchangeRate;
        const baseCostFCFA = Math.round(rawUSD * rate);

        const affInput = document.getElementById("adminCommissionAffiliation");
        const platInput = document.getElementById("adminCommissionPlateforme");
        const basePriceInput = document.getElementById("adminBasePrice");
        const finalPriceInput = document.getElementById("adminProductPrice");

        const affPct = affInput ? parseFloat(affInput.value) || 0 : (CONFIG.commissions.affiliation || 15);
        const platPct = platInput ? parseFloat(platInput.value) || 0 : (CONFIG.commissions.platform || 25);
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

            // Recherche élargie de la description dans toutes les propriétés possibles renvoyées par CJ
            const remoteDesc = dataObj.description || dataObj.desc || dataObj.bodyHtml || json.description || json.desc || "";
            if (remoteDesc) {
                const cleanedDesc = parseDescription(remoteDesc);
                this.product.description = cleanedDesc;
                const descEl = document.getElementById("adminProductDescription");
                if (descEl) descEl.value = cleanedDesc;
            }

            const rawVar = dataObj.variants || dataObj.list || json.variants || json.list || (Array.isArray(json?.data) ? json.data : []);
            const rate = CONFIG.exchangeRate;

            const affPct = parseFloat(document.getElementById("adminCommissionAffiliation")?.value) || (CONFIG.commissions.affiliation || 15);
            const platPct = parseFloat(document.getElementById("adminCommissionPlateforme")?.value) || (CONFIG.commissions.platform || 25);
            const totalMarginPercent = affPct + platPct;

            variantsArray = rawVar.map((v, i) => {
                let vImg = cleanImageUrl(v.variantImage || v.image || this.product.image);
                const vBaseUSD = Number(v.variantPrice || v.price || this.product.price || 0);
                const vBaseFCFA = Math.round(vBaseUSD * rate);
                const vMargin = Math.round(vBaseFCFA * (totalMarginPercent / 100));
                return {
                    id: v.variantId || `var_${i}`,
                    baseUsd: vBaseUSD,
                    couleur: v.variantNameEn || v.variantName || `Variante ${i+1}`,
                    prix: vBaseFCFA + vMargin,
                    stock: Number(v.variantStock || 50),
                    image: vImg
                };
            });

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

        const nom = nomEl ? nomEl.value.trim() : "";
        const vendeurNom = vendeurEl ? vendeurEl.value.trim() || "CJdropshipping" : "CJdropshipping";
        const prix = prixEl ? parseFloat(prixEl.value) : 0;
        const prixBase = basePriceEl ? parseFloat(basePriceEl.value) : 0;
        
        const affPct = parseFloat(document.getElementById("adminCommissionAffiliation")?.value) || 0;
        const platPct = parseFloat(document.getElementById("adminCommissionPlateforme")?.value) || 0;
        const margeAppliquee = affPct + platPct;

        const isFlash = flashEl ? flashEl.checked : false;
        const isRecommande = recoEl ? recoEl.checked : false;

        if (!nom || isNaN(prix) || prix < 0) {
            return alert("⚠️ Veuillez remplir le nom de l'article et indiquer un prix valide.");
        }

        if (publishBtn) {
            publishBtn.disabled = true;
            publishBtn.textContent = "⚡ PUBLICATION SUR FIREBASE...";
        }

        try {
            let finalImage = cleanImageUrl(this.product.image);

            const currentUser = window.currentUser || this.auth.currentUser || null;
            const newRef = push(ref(this.db, CONFIG.FIREBASE_PATH));
            const prodId = newRef.key;
            const vendeurUid = currentUser?.uid || "admin_dakpro_id";

            const baseUrl = window.location.origin + window.location.pathname;
            const lienAffiliation = `${baseUrl}?produit=${prodId}&ref=${vendeurUid}`;

            const now = new Date();
            const dateStr = now.toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

            const payload = {
                id: prodId,
                nom: nom,
                nom_en: nom,
                titre: nom,
                fournisseur: "CJdropshipping",
                cjPid: String(this.product.pid || ""),
                vendeurNom: vendeurNom,
                vendeurId: vendeurUid,
                categorie: productCategoryValue,
                sousCategorie: productCategoryValue,
                prix: prix,
                prixBase: prixBase,
                margePourcentage: margeAppliquee,
                prixPromo: promoEl && promoEl.value ? parseFloat(promoEx.value) : null,
                devise: "FCFA",
                taillesDisponibles: [],
                variantes: variantsArray,
                image: finalImage,
                description: descEl ? descEl.value.trim() : "",
                isFlash: isFlash,
                isRecommande: isRecommande,
                lienAffiliation: lienAffiliation,
                commissions: {
                    seller: CONFIG.commissions.seller,
                    affiliate: CONFIG.commissions.affiliate,
                    platform: CONFIG.commissions.platform,
                    affiliation: affPct,
                    plateforme: platPct
                },
                actif: true,
                createdBy: vendeurUid,
                createdAt: serverTimestamp(),
                datePublication: dateStr,
                heurePublication: timeStr
            };

            await set(ref(this.db, `${CONFIG.FIREBASE_PATH}/${prodId}`), payload);
            await set(ref(this.db, `produits/${prodId}`), payload);

            if (statusBox) statusBox.textContent = "✅ PRODUIT CJ PUBLIÉ AVEC SUCCÈS !";
            alert(`🚀 PRODUIT CJ & VARIANTES PUBLIÉS AVEC SUCCÈS !\n\n🔗 Lien :\n${lienAffiliation}`);
            returnToCatalog();
        } catch (err) {
            console.error(err);
            alert("❌ Erreur : " + err.message);
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.textContent = "🚀 Publier l'Article CJ & Générer le Lien d'Affiliation";
            }
        }
    }
}

export function initPublisher(product, containerId = "module-container") {
    return new DakproCJPublisher(product, containerId);
}
