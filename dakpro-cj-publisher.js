// ============================================================
// DAKPRO ÉLITE — dakpro-cj-publisher.js
// MODULE DE PUBLICATION CJ
//
// ARCHITECTURE CONSERVÉE
// CATÉGORIES CJ : GÉRÉES PAR UN MODULE SÉPARÉ
// PRIX FOURNISSEUR RÉEL + MARGE DYNAMIQUE
// COMMISSIONS AFFILIATION / PLATEFORME
// FIREBASE REALTIME DATABASE
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

import {
    init as returnToCatalog
} from "./dakpro-global-importer.js";

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
    API: "https://cj.dakproelite.com/api/cj",

    exchangeRate: 655,

    marginPercent: 30,

    commissions: {
        affiliation: 50,
        platform: 50
    },

    timeout: 30000
};

const presetTaillesVetements = [
    "XS", "S", "M", "L", "XL",
    "2XL", "3XL", "4XL", "5XL",
    "Standard / Unique"
];

const presetPointuresChaussures = [
    "35", "36", "37", "38", "39",
    "40", "41", "42", "43", "44",
    "45", "46", "47", "48"
];

// ============================================================
// OUTILS
// ============================================================

function cleanImageUrl(url) {

    if (!url) {
        return "https://i.postimg.cc/WpSc29mX/file-00000000ca8872438c17222eb828bc0c.png";
    }

    let trimmed = String(url).trim();

    if (trimmed.startsWith("//")) {
        return "https:" + trimmed;
    }

    return trimmed;
}

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[char];
    });
}

function formatFCFA(value) {

    return Math.round(Number(value) || 0).toLocaleString("fr-FR") + " FCFA";
}

function getNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
}

// ============================================================
// CLASSE PRINCIPALE
// ============================================================

class DakproCJPublisher {

    constructor(product, containerId = "module-container") {

        this.product = product || {};

        this.product.image = cleanImageUrl(this.product.image);

        this.containerId = containerId;

        this.container = document.getElementById(containerId);

        this.db = getDatabase();

        this.auth = getAuth();

        // Les données sont propres à chaque instance.
        this.variants = [];

        this.selectedSizesArray = [];

        this.isSaving = false;

        if (!this.container) {
            console.error("Conteneur de publication introuvable :", containerId);
            return;
        }

        this.render();

        this.fetchDetailsAndVariants();
    }

    // ========================================================
    // CALCUL FINANCIER CENTRAL
    // ========================================================

    calculateFinancials(baseUSD, marginPercent, affPercent, platformPercent) {

        const baseFCFA = Math.round(
            getNumber(baseUSD) * CONFIG.exchangeRate
        );

        const margin = Math.max(0, getNumber(marginPercent));

        const marginAmount = Math.round(
            baseFCFA * margin / 100
        );

        const finalPrice = baseFCFA + marginAmount;

        const affiliationPercent = Math.max(
            0,
            getNumber(affPercent)
        );

        const platformPercentValue = Math.max(
            0,
            getNumber(platformPercent)
        );

        const affiliationAmount = Math.round(
            marginAmount * affiliationPercent / 100
        );

        const platformAmount = Math.round(
            marginAmount * platformPercentValue / 100
        );

        const remainingMargin =
            marginAmount - affiliationAmount - platformAmount;

        return {

            prixBase: baseFCFA,

            margePourcentage: margin,

            margeMontant: marginAmount,

            prixFinal: finalPrice,

            affiliationPourcentage: affiliationPercent,

            plateformePourcentage: platformPercentValue,

            affiliationMontant: affiliationAmount,

            plateformeMontant: platformAmount,

            margeRestante: remainingMargin
        };
    }

    // ========================================================
    // AFFICHAGE
    // ========================================================

    render() {

        const initialPriceUSD = getNumber(this.product.price);

        const initialFinancials = this.calculateFinancials(
            initialPriceUSD,
            CONFIG.marginPercent,
            CONFIG.commissions.affiliation,
            CONFIG.commissions.platform
        );

        this.container.innerHTML = `

        <link rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">

        <style>

            * {
                box-sizing: border-box;
            }

            .pub-container {
                width: 100%;
                color: #f5f5f7;
                font-family: system-ui, -apple-system, sans-serif;
                background: #0d0d11;
                padding: 15px;
                border-radius: 12px;
            }

            .pub-title {
                color: #ffcc00;
                font-size: 18px;
                font-weight: 900;
                text-transform: uppercase;
                margin-bottom: 20px;
                border-left: 4px solid #ffcc00;
                padding-left: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            .dakcj-back-btn {
                background: #16161c;
                color: #ffcc00;
                border: 1px solid #ffcc00;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
            }

            .pub-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 20px;
            }

            .pub-card {
                background: #13131a;
                border: 1px solid #282836;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,.5);
                min-width: 0;
            }

            .pub-card-title {
                font-size: 14px;
                font-weight: 900;
                color: #ffcc00;
                text-transform: uppercase;
                margin-bottom: 15px;
                border-bottom: 1px solid #282836;
                padding-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-bottom: 15px;
            }

            .form-group label {
                font-size: 11px;
                color: #a1a1aa;
                font-weight: 700;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .form-group label i {
                color: #ffcc00;
            }

            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                background: #0d0d11;
                border: 1px solid #282836;
                color: #ffcc00;
                padding: 10px 12px;
                border-radius: 6px;
                font-size: 13px;
                outline: none;
            }

            .form-group textarea {
                resize: vertical;
                min-height: 120px;
            }

            .price-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 15px;
            }

            .checkbox-group {
                display: flex;
                gap: 15px;
                margin-bottom: 15px;
                background: #0a0c10;
                padding: 10px;
                border-radius: 8px;
                border: 1px solid #282836;
                flex-wrap: wrap;
            }

            .checkbox-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: #ffcc00;
                font-weight: 700;
                cursor: pointer;
            }

            .checkbox-item input {
                width: auto;
                cursor: pointer;
            }

            .size-box {
                background: #0a0c10;
                border: 1px dashed #282836;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 15px;
            }

            .size-title {
                font-size: 11px;
                font-weight: 800;
                color: #ffcc00;
                margin-bottom: 8px;
                text-transform: uppercase;
            }

            .size-chips-wrapper {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 8px;
                max-height: 120px;
                overflow-y: auto;
            }

            .size-chip {
                padding: 5px 10px;
                background: #181824;
                border: 1px solid #333;
                border-radius: 6px;
                font-size: 11px;
                color: #ddd;
                cursor: pointer;
                user-select: none;
                transition: .15s;
            }

            .size-chip.active {
                background: #ffcc00;
                color: #000;
                font-weight: 800;
                border-color: #ffcc00;
            }

            .variant-box {
                background: #0a0c10;
                border: 1px dashed #ffcc00;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 15px;
            }

            .variant-title {
                font-size: 11px;
                font-weight: 800;
                color: #ffcc00;
                margin-bottom: 10px;
                text-transform: uppercase;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .variant-list {
                margin-top: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 350px;
                overflow-y: auto;
                padding-right: 4px;
            }

            .variant-card-item {
                display: flex;
                flex-direction: column;
                gap: 6px;
                background: #13131a;
                padding: 10px;
                border-radius: 8px;
                border: 1px solid #282836;
            }

            .variant-card-top {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .variant-card-top img {
                width: 45px;
                height: 45px;
                object-fit: cover;
                border-radius: 6px;
                border: 1px solid #ffcc00;
                background: #000;
                flex-shrink: 0;
            }

            .variant-card-inputs {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr auto;
                gap: 6px;
                align-items: center;
                width: 100%;
                min-width: 0;
            }

            .variant-card-inputs input {
                background: #050505;
                border: 1px solid #282836;
                color: #ffcc00;
                padding: 6px 8px;
                border-radius: 4px;
                font-size: 11px;
                width: 100%;
                min-width: 0;
            }

            .btn-remove-variant {
                color: #ef4444;
                cursor: pointer;
                background: transparent;
                border: none;
                font-size: 16px;
                font-weight: 900;
                padding: 4px 8px;
            }

            .commission-box {
                background: #0d0d11;
                border: 1px solid #ffcc00;
                border-radius: 8px;
                padding: 12px;
                margin-top: 10px;
            }

            .commission-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 7px;
                margin-bottom: 8px;
            }

            .commission-input input {
                width: 100%;
                background: #050505;
                border: 1px solid #333;
                color: #ffcc00;
                padding: 8px;
                border-radius: 6px;
                text-align: center;
                font-weight: 800;
            }

            .commission-calc-info {
                font-size: 11px;
                color: #22c55e;
                background: #050505;
                padding: 10px;
                border-radius: 6px;
                border: 1px solid #282836;
                line-height: 1.8;
            }

            .financial-line {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                border-bottom: 1px solid #282836;
                padding: 5px 0;
            }

            .financial-line strong {
                text-align: right;
            }

            .financial-total {
                color: #ffcc00;
                font-size: 13px;
                font-weight: 900;
                border-top: 1px solid #ffcc00;
                margin-top: 7px;
                padding-top: 8px;
            }

            .financial-warning {
                color: #f87171;
                font-size: 11px;
                margin-top: 8px;
                display: none;
            }

            .btn-pub-action {
                background: linear-gradient(135deg, #ffcc00, #e6b800);
                color: #000;
                font-weight: 900;
                border: none;
                padding: 14px 25px;
                border-radius: 8px;
                cursor: pointer;
                transition: .2s;
                text-transform: uppercase;
                font-size: 13px;
                width: 100%;
                margin-top: 15px;
            }

            .btn-pub-action:disabled {
                opacity: .5;
                cursor: not-allowed;
            }

            .preview-box {
                min-height: 220px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #0d0d11;
                border: 1px dashed #282836;
                border-radius: 8px;
                padding: 15px;
                gap: 8px;
            }

            .status-box {
                margin-bottom: 15px;
                padding: 10px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 700;
                background: #050505;
                border: 1px solid #282836;
                color: #ffcc00;
                text-align: center;
            }

            @media(max-width: 500px) {

                .pub-grid {
                    grid-template-columns: 1fr;
                }

                .pub-card {
                    padding: 12px;
                }

                .price-grid {
                    grid-template-columns: 1fr 1fr;
                }

                .variant-card-inputs {
                    grid-template-columns: 1fr 1fr;
                }
            }

        </style>

        <div class="pub-container">

            <div class="pub-title">

                <span>📦 Publication CJ — DAKPROÉLITE</span>

                <button type="button"
                class="dakcj-back-btn"
                id="dakcj-back">
                    ← Retour au Catalogue
                </button>

            </div>

            <div id="adminPublicationStatus" class="status-box">
                Produit CJ chargé avec succès. Prêt pour la publication.
            </div>

            <div class="pub-grid">

                <div class="pub-card">

                    <div class="pub-card-title">
                        📝 Informations de l'Article CJ
                    </div>

                    <div class="form-group">

                        <label>
                            <i class="fa-solid fa-user"></i>
                            Nom du Vendeur / Boutique
                        </label>

                        <input
                            type="text"
                            id="adminVendeurNom"
                            value="CJdropshipping International"
                        >

                    </div>

                    <div class="form-group">

                        <label>
                            <i class="fa-solid fa-heading"></i>
                            Nom de l'Article
                        </label>

                        <input
                            type="text"
                            id="adminProductName"
                            value="${escapeHTML(this.product.name || "")}"
                        >

                    </div>

                    <!--
                    Le sélecteur de catégories CJ a été supprimé.
                    Le module de publication ne charge plus les catégories.
                    -->

                    <div class="price-grid">

                        <div class="form-group">

                            <label>
                                <i class="fa-solid fa-coins"></i>
                                Prix Réel Fournisseur (FCFA)
                            </label>

                            <input
                                type="number"
                                id="adminBasePrice"
                                value="${initialFinancials.prixBase}"
                                readonly
                                style="color:#9ca3af;background:#050505;"
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                <i class="fa-solid fa-percent"></i>
                                Marge Commerciale (%)
                            </label>

                            <input
                                type="number"
                                id="adminMarginPercent"
                                value="${CONFIG.marginPercent}"
                                min="0"
                                step="0.01"
                            >

                        </div>

                    </div>

                    <div class="price-grid">

                        <div class="form-group">

                            <label>
                                <i class="fa-solid fa-money-bill"></i>
                                Prix Final Client (FCFA)
                            </label>

                            <input
                                type="number"
                                id="adminProductPrice"
                                value="${initialFinancials.prixFinal}"
                                min="0"
                                step="1"
                                readonly
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                <i class="fa-solid fa-tag"></i>
                                Prix Promo (Optionnel)
                            </label>

                            <input
                                type="number"
                                id="adminProductPromoPrice"
                                placeholder="Ex: 22000"
                                min="0"
                                step="0.01"
                            >

                        </div>

                    </div>

                    <div class="commission-box">

                        <div style="
                            font-size:12px;
                            font-weight:900;
                            color:#ffcc00;
                            margin-bottom:10px;
                        ">
                            💰 RÉCAPITULATIF FINANCIER DYNAMIQUE
                        </div>

                        <div id="financialSummary"
                        class="commission-calc-info">

                            Chargement des calculs financiers...

                        </div>

                    </div>

                    <div class="checkbox-group">

                        <label class="checkbox-item">

                            <input
                                type="checkbox"
                                id="isFlashCheck"
                            >

                            🔥 Offre Flash

                        </label>

                        <label class="checkbox-item">

                            <input
                                type="checkbox"
                                id="isRecommandeCheck"
                                checked
                            >

                            ⭐ Recommandé / Sponsorisé

                        </label>

                    </div>

                    <div class="size-box">

                        <div class="size-title">
                            📏 Tailles, Pointures ou Options disponibles
                        </div>

                        <div
                            class="size-chips-wrapper"
                            id="sizePresetContainer">
                        </div>

                        <input
                            type="text"
                            id="customSizeInput"
                            placeholder="Option sur-mesure..."
                        >

                    </div>

                    <div class="variant-box">

                        <div class="variant-title">

                            <span>
                                🎨 Variantes CJ & Photos Synchronisées
                            </span>

                            <span
                                id="variantCounter"
                                style="color:#22c55e;font-size:10px;">
                                0 variante(s)
                            </span>

                        </div>

                        <div id="variantList" class="variant-list">

                            <div style="
                                text-align:center;
                                color:#777;
                                font-size:11px;
                                padding:10px;
                            ">
                                Chargement automatique des variantes CJ...
                            </div>

                        </div>

                    </div>

                    <div class="form-group">

                        <label>
                            <i class="fa-solid fa-align-left"></i>
                            Description Officielle de l'Article (CJ)
                        </label>

                        <textarea id="adminProductDescription">${escapeHTML(this.product.description || "")}</textarea>

                    </div>

                    <div class="commission-box">

                        <div style="
                            font-size:11px;
                            font-weight:800;
                            color:#ffcc00;
                            margin-bottom:8px;
                        ">
                            💰 RÉPARTITION DE LA MARGE
                        </div>

                        <div class="commission-grid">

                            <div class="commission-input">

                                <label style="font-size:9px;color:#aaa;">
                                    Affiliation (%)
                                </label>

                                <input
                                    type="number"
                                    id="adminCommissionAffiliation"
                                    value="${CONFIG.commissions.affiliation}"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    style="color:#ffcc00;"
                                >

                            </div>

                            <div class="commission-input">

                                <label style="font-size:9px;color:#aaa;">
                                    Plateforme (%)
                                </label>

                                <input
                                    type="number"
                                    id="adminCommissionPlateforme"
                                    value="${CONFIG.commissions.platform}"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    style="color:#3b82f6;"
                                >

                            </div>

                        </div>

                        <div id="commissionCalcDisplay"
                        class="commission-calc-info">

                            Marge totale : 0 FCFA

                        </div>

                        <div id="commissionWarning"
                        class="financial-warning">

                            Attention : la somme des commissions ne peut
                            pas dépasser 100 % de la marge.

                        </div>

                    </div>

                    <button
                        type="button"
                        id="adminAddProduct"
                        class="btn-pub-action">

                        🚀 Publier l'Article CJ & Générer le Lien d'Affiliation

                    </button>

                </div>

                <div class="pub-card">

                    <div class="pub-card-title">
                        👁️ Aperçu de l'Image Officielle CJ
                    </div>

                    <div id="adminPreviewBox" class="preview-box">

                        <img
                            id="imagePreviewImg"
                            src="${escapeHTML(this.product.image)}"
                            style="
                                width:100%;
                                max-height:280px;
                                object-fit:contain;
                                border-radius:6px;
                                background:#0b0b0e;
                            "
                            referrerpolicy="no-referrer"
                            crossorigin="anonymous"
                        >

                    </div>

                </div>

            </div>

        </div>
        `;

        this.setupEvents();

        this.updateCalculations();
    }

    // ========================================================
    // MISE À JOUR DES CALCULS
    // ========================================================

    updateCalculations() {

        const marginInput = this.container.querySelector(
            "#adminMarginPercent"
        );

        const affInput = this.container.querySelector(
            "#adminCommissionAffiliation"
        );

        const platformInput = this.container.querySelector(
            "#adminCommissionPlateforme"
        );

        if (!marginInput || !affInput || !platformInput) {
            return;
        }

        const marginPercent = Math.max(
            0,
            getNumber(marginInput.value)
        );

        const affPct = Math.max(
            0,
            getNumber(affInput.value)
        );

        const platPct = Math.max(
            0,
            getNumber(platformInput.value)
        );

        const financials = this.calculateFinancials(
            this.product.price,
            marginPercent,
            affPct,
            platPct
        );

        const baseInput = this.container.querySelector(
            "#adminBasePrice"
        );

        const finalInput = this.container.querySelector(
            "#adminProductPrice"
        );

        if (baseInput) {
            baseInput.value = financials.prixBase;
        }

        if (finalInput) {
            finalInput.value = financials.prixFinal;
        }

        const summary = this.container.querySelector(
            "#financialSummary"
        );

        if (summary) {

            summary.innerHTML = `

                <div class="financial-line">
                    <span>Prix fournisseur réel :</span>
                    <strong>${formatFCFA(financials.prixBase)}</strong>
                </div>

                <div class="financial-line">
                    <span>Marge commerciale (${marginPercent} %) :</span>
                    <strong>${formatFCFA(financials.margeMontant)}</strong>
                </div>

                <div class="financial-line">
                    <span>Affiliation (${affPct} %) :</span>
                    <strong>${formatFCFA(financials.affiliationMontant)}</strong>
                </div>

                <div class="financial-line">
                    <span>Plateforme (${platPct} %) :</span>
                    <strong>${formatFCFA(financials.plateformeMontant)}</strong>
                </div>

                <div class="financial-line">
                    <span>Marge non répartie :</span>
                    <strong>${formatFCFA(financials.margeRestante)}</strong>
                </div>

                <div class="financial-line financial-total">
                    <span>PRIX FINAL CLIENT :</span>
                    <strong>${formatFCFA(financials.prixFinal)}</strong>
                </div>

            `;
        }

        const commissionDisplay = this.container.querySelector(
            "#commissionCalcDisplay"
        );

        if (commissionDisplay) {

            commissionDisplay.innerHTML = `

                Marge commerciale :
                <strong>${formatFCFA(financials.margeMontant)}</strong>
                <br>

                Affiliation :
                <strong>${formatFCFA(financials.affiliationMontant)}</strong>
                <br>

                Plateforme :
                <strong>${formatFCFA(financials.plateformeMontant)}</strong>
                <br>

                Reste de la marge :
                <strong>${formatFCFA(financials.margeRestante)}</strong>

            `;
        }

        // Vérification de la répartition des commissions.

        const commissionWarning = this.container.querySelector(
            "#commissionWarning"
        );

        const commissionTotal = affPct + platPct;

        const commissionValid =
            affPct >= 0 &&
            platPct >= 0 &&
            commissionTotal <= 100;

        if (commissionWarning) {
            commissionWarning.style.display =
                commissionValid ? "none" : "block";
        }

        // Recalcul des prix de toutes les variantes CJ.

        this.variants = this.variants.map(variant => {

            const variantBaseUSD = getNumber(
                variant.baseUsd,
                getNumber(this.product.price)
            );

            const variantFinancials = this.calculateFinancials(
                variantBaseUSD,
                marginPercent,
                affPct,
                platPct
            );

            return {

                ...variant,

                prixBase: variantFinancials.prixBase,

                margeMontant: variantFinancials.margeMontant,

                prix: variantFinancials.prixFinal,

                commissions: {

                    affiliation: variantFinancials.affiliationMontant,

                    plateforme: variantFinancials.plateformeMontant

                }

            };
        });

        this.renderVariantCards();

        return {
            ...financials,
            commissionsValides: commissionValid
        };
    }

    // ========================================================
    // ÉVÉNEMENTS
    // ========================================================

    setupEvents() {

        this.container.querySelector("#dakcj-back")
            .addEventListener("click", () => {

                returnToCatalog();

            });

        this.container.querySelector("#adminMarginPercent")
            .addEventListener("input", () => {

                this.updateCalculations();

            });

        this.container.querySelector("#adminCommissionAffiliation")
            .addEventListener("input", () => {

                this.updateCalculations();

            });

        this.container.querySelector("#adminCommissionPlateforme")
            .addEventListener("input", () => {

                this.updateCalculations();

            });

        // ====================================================
        // GESTION DES TAILLES
        // ====================================================

        const sizePresetContainer = this.container.querySelector(
            "#sizePresetContainer"
        );

        const allPresets = [

            ...presetTaillesVetements,

            ...presetPointuresChaussures,

            "Standard",
            "1000W",
            "2000W",
            "3000W",
            "4K Ultra HD",
            "32Go",
            "64Go",
            "128Go"

        ];

        sizePresetContainer.innerHTML = allPresets.map(sz => `

            <span
                class="size-chip"
                data-size="${escapeHTML(sz)}">

                ${escapeHTML(sz)}

            </span>

        `).join("");

        sizePresetContainer.querySelectorAll(".size-chip")
            .forEach(chip => {

                chip.addEventListener("click", () => {

                    chip.classList.toggle("active");

                    const size = chip.dataset.size;

                    if (chip.classList.contains("active")) {

                        if (!this.selectedSizesArray.includes(size)) {

                            this.selectedSizesArray.push(size);

                        }

                    } else {

                        this.selectedSizesArray =
                            this.selectedSizesArray.filter(
                                item => item !== size
                            );

                    }

                });

            });

        // ====================================================
        // PUBLICATION
        // ====================================================

        this.container.querySelector("#adminAddProduct")
            .addEventListener("click", () => {

                this.saveProduct();

            });
    }

    // ========================================================
    // RÉCUPÉRATION DES DÉTAILS ET VARIANTES CJ
    // ========================================================

    async fetchDetailsAndVariants() {

        if (!this.product.pid) {
            this.renderVariantCards();
            return;
        }

        try {

            const controller = new AbortController();

            const timeout = setTimeout(
                () => controller.abort(),
                CONFIG.timeout
            );

            const res = await fetch(
                `${CONFIG.API}?action=variants&pid=${encodeURIComponent(this.product.pid)}`,
                {
                    signal: controller.signal
                }
            );

            clearTimeout(timeout);

            if (!res.ok) {
                throw new Error("Erreur de récupération des données CJ.");
            }

            const json = await res.json();

            const dataObj = json?.data || {};

            // Description officielle CJ.

            const remoteDesc =
                dataObj.description ||
                dataObj.desc ||
                json.description ||
                "";

            if (remoteDesc) {

                this.product.description = remoteDesc;

                const descEl = this.container.querySelector(
                    "#adminProductDescription"
                );

                if (descEl) {
                    descEl.value = remoteDesc;
                }
            }

            // Conservation des informations de catégorie CJ
            // déjà présentes dans les données du produit.

            if (dataObj.categoryName && !this.product.categoryName) {
                this.product.categoryName = dataObj.categoryName;
            }

            if (dataObj.categoryId && !this.product.categoryId) {
                this.product.categoryId = dataObj.categoryId;
            }

            // Récupération des variantes.

            const rawVar =
                dataObj.variants ||
                dataObj.list ||
                (Array.isArray(json?.data) ? json.data : []);

            const marginPercent = getNumber(
                this.container.querySelector("#adminMarginPercent")?.value,
                CONFIG.marginPercent
            );

            const affPct = getNumber(
                this.container.querySelector("#adminCommissionAffiliation")?.value,
                CONFIG.commissions.affiliation
            );

            const platPct = getNumber(
                this.container.querySelector("#adminCommissionPlateforme")?.value,
                CONFIG.commissions.platform
            );

            this.variants = (Array.isArray(rawVar) ? rawVar : [])
                .map((variant, index) => {

                    const variantImage = cleanImageUrl(
                        variant.variantImage ||
                        variant.image ||
                        this.product.image
                    );

                    const variantBaseUSD = getNumber(
                        variant.variantPrice ||
                        variant.price ||
                        this.product.price
                    );

                    const financials = this.calculateFinancials(
                        variantBaseUSD,
                        marginPercent,
                        affPct,
                        platPct
                    );

                    return {

                        id: variant.variantId || `var_${index}`,

                        baseUsd: variantBaseUSD,

                        prixBase: financials.prixBase,

                        margeMontant: financials.margeMontant,

                        couleur:
                            variant.variantNameEn ||
                            variant.variantName ||
                            `Variante ${index + 1}`,

                        prix: financials.prixFinal,

                        stock: getNumber(
                            variant.variantStock,
                            50
                        ),

                        image: variantImage,

                        commissions: {

                            affiliation: financials.affiliationMontant,

                            plateforme: financials.plateformeMontant

                        }

                    };

                });

            this.renderVariantCards();

        } catch (error) {

            console.warn(
                "Variantes CJ partielles :",
                error
            );

            this.renderVariantCards();

        }
    }

    // ========================================================
    // AFFICHAGE DES VARIANTES
    // ========================================================

    renderVariantCards() {

        const variantList = this.container.querySelector(
            "#variantList"
        );

        const variantCounter = this.container.querySelector(
            "#variantCounter"
        );

        if (!variantList) {
            return;
        }

        variantCounter.textContent =
            `${this.variants.length} variante(s)`;

        if (this.variants.length === 0) {

            variantList.innerHTML = `

                <div style="
                    text-align:center;
                    color:#777;
                    font-size:11px;
                    padding:10px;
                ">

                    Aucune variante CJ spécifique.
                    Produit standard utilisé.

                </div>

            `;

            return;
        }

        variantList.innerHTML = this.variants.map(
            (item, index) => `

            <div
                class="variant-card-item"
                data-index="${index}">

                <div class="variant-card-top">

                    <img
                        src="${escapeHTML(item.image)}"
                        alt="Variante"
                        referrerpolicy="no-referrer"
                        crossorigin="anonymous"
                    >

                    <div class="variant-card-inputs">

                        <input
                            type="text"
                            class="var-name-input"
                            value="${escapeHTML(item.couleur)}"
                            data-index="${index}"
                            placeholder="Nom variante"
                        >

                        <input
                            type="number"
                            class="var-price-input"
                            value="${getNumber(item.prix)}"
                            placeholder="Prix"
                            data-index="${index}"
                        >

                        <input
                            type="number"
                            class="var-stock-input"
                            value="${getNumber(item.stock, 10)}"
                            placeholder="Stock"
                            data-index="${index}"
                        >

                        <button
                            type="button"
                            class="btn-remove-variant"
                            data-remove-variant="${index}">

                            ✕

                        </button>

                    </div>

                </div>

            </div>

        `).join("");

        // Modification du nom de variante.

        variantList.querySelectorAll(".var-name-input")
            .forEach(input => {

                input.addEventListener("input", event => {

                    const index = Number(event.target.dataset.index);

                    if (this.variants[index]) {

                        this.variants[index].couleur =
                            event.target.value;

                    }

                });

            });

        // Modification du prix de variante.

        variantList.querySelectorAll(".var-price-input")
            .forEach(input => {

                input.addEventListener("input", event => {

                    const index = Number(event.target.dataset.index);

                    if (this.variants[index]) {

                        this.variants[index].prix =
                            event.target.value === ""
                                ? null
                                : getNumber(event.target.value);

                    }

                });

            });

        // Modification du stock.

        variantList.querySelectorAll(".var-stock-input")
            .forEach(input => {

                input.addEventListener("input", event => {

                    const index = Number(event.target.dataset.index);

                    if (this.variants[index]) {

                        this.variants[index].stock =
                            event.target.value === ""
                                ? 10
                                : getNumber(event.target.value, 10);

                    }

                });

            });

        // Suppression d'une variante.

        variantList.querySelectorAll("[data-remove-variant]")
            .forEach(button => {

                button.addEventListener("click", event => {

                    const index = Number(
                        event.currentTarget.dataset.removeVariant
                    );

                    this.variants.splice(index, 1);

                    this.renderVariantCards();

                });

            });
    }

    // ========================================================
    // PUBLICATION FIREBASE
    // ========================================================

    async saveProduct() {

        if (this.isSaving) {
            return;
        }

        const nom = this.container.querySelector(
            "#adminProductName"
        ).value.trim();

        const vendeurNom = this.container.querySelector(
            "#adminVendeurNom"
        ).value.trim() || "CJdropshipping";

        const customSize = this.container.querySelector(
            "#customSizeInput"
        ).value.trim();

        const isFlash = this.container.querySelector(
            "#isFlashCheck"
        ).checked;

        const isRecommande = this.container.querySelector(
            "#isRecommandeCheck"
        ).checked;

        const statusBox = this.container.querySelector(
            "#adminPublicationStatus"
        );

        const publishBtn = this.container.querySelector(
            "#adminAddProduct"
        );

        const financials = this.updateCalculations();

        const prix = financials.prixFinal;

        const prixBase = financials.prixBase;

        const margeAppliquee = financials.margePourcentage;

        const affPct = financials.affiliationPourcentage;

        const platPct = financials.plateformePourcentage;

        if (customSize && !this.selectedSizesArray.includes(customSize)) {

            this.selectedSizesArray.push(customSize);

        }

        // La catégorie n'est plus obligatoire.

        if (!nom || !Number.isFinite(prix) || prix < 0) {

            return alert(
                "⚠️ Veuillez renseigner le nom du produit et vérifier le prix."
            );

        }

        if (!financials.commissionsValides) {

            return alert(
                "⚠️ La somme des commissions Affiliation et Plateforme ne doit pas dépasser 100 % de la marge commerciale."
            );

        }

        if (financials.margeRestante < 0) {

            return alert(
                "⚠️ La répartition des commissions dépasse la marge disponible."
            );

        }

        const promoValue = this.container.querySelector(
            "#adminProductPromoPrice"
        ).value;

        const prixPromo = promoValue !== ""
            ? getNumber(promoValue)
            : null;

        if (prixPromo !== null && prixPromo > prix) {

            return alert(
                "⚠️ Le prix promotionnel ne peut pas dépasser le prix final client."
            );

        }

        this.isSaving = true;

        publishBtn.disabled = true;

        publishBtn.textContent =
            "⚡ PUBLICATION SUR FIREBASE...";

        try {

            const finalImage = cleanImageUrl(
                this.product.image
            );

            const currentUser =
                window.currentUser ||
                this.auth.currentUser ||
                null;

            const newRef = push(
                ref(this.db, "publications")
            );

            const prodId = newRef.key;

            const vendeurUid =
                currentUser?.uid ||
                "admin_dakpro_id";

            const baseUrl =
                window.location.origin +
                window.location.pathname;

            const lienAffiliation =
                `${baseUrl}?produit=${prodId}&ref=${vendeurUid}`;

            const now = new Date();

            const dateStr = now.toLocaleDateString(
                "fr-FR",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );

            const timeStr = now.toLocaleTimeString(
                "fr-FR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

            // Catégorie récupérée depuis le produit CJ
            // si elle existe. Aucun choix obligatoire.

            const categorie =
                this.product.categoryName ||
                this.product.category ||
                this.product.categoryFirstName ||
                this.product.categoryFirstNameEn ||
                "CJdropshipping";

            const sousCategorie =
                this.product.subCategoryName ||
                this.product.subCategory ||
                this.product.categorySecondName ||
                categorie;

            // Informations financières enregistrées.

            const payload = {

                id: prodId,

                nom: nom,

                nom_en: nom,

                titre: nom,

                fournisseur: "CJdropshipping",

                cjPid: String(this.product.pid || ""),

                vendeurNom: vendeurNom,

                vendeurId: vendeurUid,

                // Catégories facultatives.

                categorie: categorie,

                sousCategorie: sousCategorie,

                categoryId:
                    this.product.categoryId ||
                    this.product.categoryFirstId ||
                    null,

                categoryFirstId:
                    this.product.categoryFirstId ||
                    this.product.categoryId ||
                    null,

                categorySecondId:
                    this.product.categorySecondId ||
                    null,

                // PRIX ET MARGE.

                prix: financials.prixFinal,

                prixBase: financials.prixBase,

                prixFournisseurUSD: getNumber(
                    this.product.price
                ),

                tauxConversion: CONFIG.exchangeRate,

                margePourcentage: financials.margePourcentage,

                margeMontant: financials.margeMontant,

                prixFinalClient: financials.prixFinal,

                // PROMOTION.

                prixPromo: prixPromo,

                devise: "FCFA",

                // COMMISSIONS.

                commissions: {

                    affiliation: affPct,

                    plateforme: platPct

                },

                montantsCommissions: {

                    affiliation: financials.affiliationMontant,

                    plateforme: financials.plateformeMontant

                },

                affiliationMontant: financials.affiliationMontant,

                plateformeMontant: financials.plateformeMontant,

                margeRestante: financials.margeRestante,

                // OPTIONS ET VARIANTES.

                taillesDisponibles: [
                    ...this.selectedSizesArray
                ],

                variantes: this.variants.map(variant => ({

                    ...variant,

                    prix: getNumber(variant.prix),

                    stock: getNumber(variant.stock)

                })),

                // IMAGE ET DESCRIPTION.

                image: finalImage,

                description: this.container.querySelector(
                    "#adminProductDescription"
                ).value.trim(),

                // OPTIONS COMMERCIALES.

                isFlash: isFlash,

                isRecommande: isRecommande,

                // AFFILIATION.

                lienAffiliation: lienAffiliation,

                // STATUT.

                actif: true,

                createdBy: vendeurUid,

                createdAt: serverTimestamp(),

                datePublication: dateStr,

                heurePublication: timeStr

            };

            // Enregistrement dans les deux emplacements
            // Firebase conservés dans ton architecture.

            await set(
                ref(this.db, `publications/${prodId}`),
                payload
            );

            await set(
                ref(this.db, `produits/${prodId}`),
                payload
            );

            statusBox.textContent =
                "✅ PRODUIT CJ PUBLIÉ AVEC SUCCÈS !";

            alert(
                `🚀 PRODUIT CJ & VARIANTES PUBLIÉS AVEC SUCCÈS !\n\n` +
                `Prix fournisseur : ${formatFCFA(prixBase)}\n` +
                `Marge commerciale : ${formatFCFA(financials.margeMontant)}\n` +
                `Prix final client : ${formatFCFA(prix)}\n\n` +
                `Affiliation : ${formatFCFA(financials.affiliationMontant)}\n` +
                `Plateforme : ${formatFCFA(financials.plateformeMontant)}\n\n` +
                `🔗 Lien d'affiliation :\n${lienAffiliation}`
            );

            returnToCatalog();

        } catch (err) {

            console.error(
                "Erreur publication CJ :",
                err
            );

            alert(
                "❌ Erreur lors de la publication : " +
                err.message
            );

            publishBtn.disabled = false;

            publishBtn.textContent =
                "🚀 Publier l'Article CJ & Générer le Lien d'Affiliation";

            this.isSaving = false;

        }
    }

}

// ============================================================
// EXPORT PUBLIC — CONSERVÉ
// ============================================================

export function initPublisher(
    product,
    containerId = "module-container"
) {

    return new DakproCJPublisher(
        product,
        containerId
    );

}