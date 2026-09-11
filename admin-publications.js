/* ============================================================
   DAKPRO ÉLITE — admin-publications.js
   MODULE ADMINISTRATION
   PUBLICATION DES PRODUITS / FORMATIONS / SERVICES

   FIREBASE :
   - Firebase Realtime Database
   - Firebase Authentication
   - window.currentUser
   - window.currentUserIsAdmin

   DATABASE :
   /publications

   COMMISSIONS :
   - Vendeur
   - Affiliation
   - Plateforme
   - TOTAL = 100 %

   DEVISES :
   - FCFA
   - EUR
   - USD

   CATÉGORIE :
   - SAISIE LIBRE
============================================================ */

import {
    getDatabase,
    ref,
    push,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";


/* ============================================================
   FONCTION PRINCIPALE
============================================================ */

export async function init() {

    const container =
        document.getElementById("module-container");

    if (!container) {

        console.warn(
            "DAKPRO ÉLITE : #module-container introuvable."
        );

        return;
    }


    /* ========================================================
       FIREBASE
    ======================================================== */

    const db = getDatabase();


    /* ========================================================
       UTILISATEUR CONNECTÉ
    ======================================================== */

    const currentUser =
        window.currentUser || null;


    /*
       IMPORTANT :
       On ne considère PAS automatiquement l'utilisateur
       comme administrateur.

       La page principale doit définir :
       window.currentUserIsAdmin = true / false
    */

    const currentUserIsAdmin =
        window.currentUserIsAdmin === true;


    /* ========================================================
       INTERFACE
    ======================================================== */

    container.innerHTML = `

        <style>

            * {
                box-sizing:border-box;
            }


            .pub-container {

                width:100%;

                color:#f5f5f7;

                font-family:
                    system-ui,
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    sans-serif;

                background:#0d0d11;

                padding:10px;

                border-radius:12px;

            }


            .pub-title {

                color:#ffcc00;

                font-size:18px;

                font-weight:900;

                text-transform:uppercase;

                margin-bottom:20px;

                letter-spacing:.5px;

                border-left:
                    4px solid #ffcc00;

                padding-left:10px;

            }


            .pub-grid {

                display:grid;

                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(
                            320px,
                            1fr
                        )
                    );

                gap:20px;

            }


            .pub-card {

                background:#13131a;

                border:
                    1px solid #282836;

                border-radius:12px;

                padding:20px;

                box-shadow:
                    0 4px 20px
                    rgba(
                        0,
                        0,
                        0,
                        .5
                    );

            }


            .pub-card-title {

                font-size:14px;

                font-weight:900;

                color:#ffcc00;

                text-transform:uppercase;

                margin-bottom:15px;

                border-bottom:
                    1px solid #282836;

                padding-bottom:10px;

            }


            .form-group {

                display:flex;

                flex-direction:column;

                gap:6px;

                margin-bottom:15px;

            }


            .form-group label {

                font-size:11px;

                color:#a1a1aa;

                font-weight:700;

                text-transform:uppercase;

            }


            .form-group input,

            .form-group select,

            .form-group textarea {

                width:100%;

                background:#0d0d11;

                border:
                    1px solid #282836;

                color:#ffcc00;

                padding:
                    10px
                    12px;

                border-radius:6px;

                font-size:13px;

                outline:none;

            }


            .form-group textarea {

                resize:vertical;

                min-height:110px;

            }


            .form-group input:focus,

            .form-group select:focus,

            .form-group textarea:focus {

                border-color:#ffcc00;

                box-shadow:
                    0 0 8px
                    rgba(
                        255,
                        204,
                        0,
                        .25
                    );

            }


            .price-grid {

                display:grid;

                grid-template-columns:
                    1fr 1fr;

                gap:10px;

            }


            .pub-date-box {

                display:grid;

                grid-template-columns:
                    1fr 1fr;

                gap:10px;

                margin-bottom:15px;

            }


            .pub-date-item {

                background:#0d0d11;

                border:
                    1px solid #282836;

                border-radius:8px;

                padding:10px;

            }


            .pub-date-label {

                display:block;

                color:#888;

                font-size:9px;

                font-weight:700;

                text-transform:uppercase;

                margin-bottom:5px;

            }


            .pub-date-value {

                color:#ffcc00;

                font-size:12px;

                font-weight:800;

            }


            .commission-box {

                background:#0d0d11;

                border:
                    1px solid #ffcc00;

                border-radius:8px;

                padding:12px;

                margin-top:10px;

            }


            .commission-title {

                color:#ffcc00;

                font-size:12px;

                font-weight:900;

                margin-bottom:10px;

            }


            .commission-grid {

                display:grid;

                grid-template-columns:
                    repeat(
                        3,
                        1fr
                    );

                gap:7px;

            }


            .commission-input {

                min-width:0;

            }


            .commission-input label {

                display:block;

                font-size:9px;

                color:#aaa;

                font-weight:700;

                margin-bottom:5px;

            }


            .commission-input input {

                width:100%;

                background:#050505;

                border:
                    1px solid #333;

                color:#ffcc00;

                padding:9px 5px;

                border-radius:6px;

                text-align:center;

                font-weight:800;

                outline:none;

            }


            .commission-input input:focus {

                border-color:#ffcc00;

            }


            .commission-total {

                text-align:center;

                font-size:12px;

                font-weight:900;

                margin-top:10px;

                padding:7px;

                border-radius:6px;

                background:#050505;

            }


            .commission-example {

                text-align:center;

                font-size:10px;

                line-height:1.5;

                color:#aaa;

                margin-top:7px;

            }


            .commission-summary {

                margin-top:10px;

                padding:10px;

                background:#050505;

                border:
                    1px solid #282836;

                border-radius:7px;

                font-size:10px;

                line-height:1.8;

            }


            .commission-summary strong {

                color:#ffcc00;

            }


            .btn-pub-action {

                background:
                    linear-gradient(
                        135deg,
                        #ffcc00,
                        #e6b800
                    );

                color:#000;

                font-weight:900;

                border:none;

                padding:
                    14px
                    25px;

                border-radius:8px;

                cursor:pointer;

                transition:.2s;

                text-transform:uppercase;

                font-size:13px;

                width:100%;

                margin-top:15px;

            }


            .btn-pub-action:hover {

                background:
                    linear-gradient(
                        135deg,
                        #ffe57f,
                        #ffcc00
                    );

                box-shadow:
                    0 4px 15px
                    rgba(
                        255,
                        204,
                        0,
                        .3
                    );

            }


            .btn-pub-action:disabled {

                opacity:.6;

                cursor:not-allowed;

                box-shadow:none;

            }


            .preview-box {

                min-height:300px;

                display:flex;

                align-items:center;

                justify-content:center;

                background:#0d0d11;

                border:
                    1px dashed #282836;

                border-radius:8px;

                padding:15px;

            }


            .preview-card {

                width:100%;

                max-width:450px;

                background:#151515;

                border:
                    1px solid #ffcc00;

                border-radius:10px;

                padding:12px;

                color:#fff;

            }


            .preview-image {

                width:100%;

                height:180px;

                object-fit:contain;

                border-radius:7px;

                margin-bottom:10px;

                background:#080b10;

            }


            .preview-name {

                font-size:15px;

                font-weight:900;

                color:#ffcc00;

            }


            .preview-price {

                font-size:18px;

                font-weight:900;

                margin:6px 0;

            }


            .preview-old-price {

                font-size:11px;

                text-decoration:line-through;

                color:#888;

                margin-left:5px;

            }


            .preview-description {

                font-size:11px;

                color:#aaa;

                line-height:1.5;

                margin-top:8px;

                white-space:pre-wrap;

            }


            .preview-commission {

                margin-top:10px;

                padding:8px;

                background:#080808;

                border-radius:7px;

                font-size:9px;

                line-height:1.7;

            }


            .status-box {

                margin-bottom:15px;

                padding:10px;

                border-radius:8px;

                font-size:11px;

                font-weight:700;

                background:#050505;

                border:1px solid #282836;

            }


            .status-ok {

                color:#22c55e;

                border-color:#22c55e;

            }


            .status-error {

                color:#ef4444;

                border-color:#ef4444;

            }


            @media(max-width:600px) {

                .pub-card {

                    padding:14px;

                }

                .pub-grid {

                    grid-template-columns:1fr;

                }

                .price-grid {

                    grid-template-columns:1fr;

                }

                .commission-grid {

                    grid-template-columns:
                        1fr 1fr 1fr;

                    gap:4px;

                }

                .pub-date-box {

                    grid-template-columns:1fr;

                }

            }

        </style>


        <div class="pub-container">


            <div class="pub-title">

                📦 Publication de Produits & Formations

            </div>


            <div
                id="adminPublicationStatus"
                class="status-box"
            >
                Vérification de la session administrateur...
            </div>


            <div class="pub-grid">


                <!-- =================================================
                     FORMULAIRE
                ================================================== -->

                <div class="pub-card">


                    <div class="pub-card-title">

                        📝 Détails de la Publication

                    </div>


                    <!-- DATE / HEURE -->

                    <div class="pub-date-box">


                        <div class="pub-date-item">

                            <span class="pub-date-label">
                                📅 Date
                            </span>

                            <span
                                id="adminPublicationDate"
                                class="pub-date-value"
                            >
                                --
                            </span>

                        </div>


                        <div class="pub-date-item">

                            <span class="pub-date-label">
                                🕐 Heure
                            </span>

                            <span
                                id="adminPublicationTime"
                                class="pub-date-value"
                            >
                                --
                            </span>

                        </div>

                    </div>


                    <!-- NOM -->

                    <div class="form-group">

                        <label>
                            Nom du Produit / Formation
                        </label>

                        <input
                            type="text"
                            id="adminProductName"
                            placeholder="Ex : DAKJUBILE TONIC VITAL"
                            autocomplete="off"
                        >

                    </div>


                    <!-- CATÉGORIE LIBRE -->

                    <div class="form-group">

                        <label>
                            Catégorie
                        </label>

                        <input
                            type="text"
                            id="adminProductCategory"
                            placeholder="Ex : Santé, Formation, Mode, Électronique..."
                            autocomplete="off"
                        >

                    </div>


                    <!-- PRIX -->

                    <div class="price-grid">


                        <div class="form-group">

                            <label>
                                Prix Normal
                            </label>

                            <input
                                type="number"
                                id="adminProductPrice"
                                placeholder="10000"
                                min="0"
                                step="0.01"
                                inputmode="decimal"
                            >

                        </div>


                        <div class="form-group">

                            <label>
                                Prix Promo
                                (Optionnel)
                            </label>

                            <input
                                type="number"
                                id="adminProductPromoPrice"
                                placeholder="7500"
                                min="0"
                                step="0.01"
                                inputmode="decimal"
                            >

                        </div>

                    </div>


                    <!-- DEVISE -->

                    <div class="form-group">

                        <label>
                            Devise
                        </label>

                        <select
                            id="adminProductCurrency"
                        >

                            <option value="FCFA">
                                FCFA — Franc CFA
                            </option>

                            <option value="EUR">
                                EUR — Euro (€)
                            </option>

                            <option value="USD">
                                USD — Dollar ($)
                            </option>

                        </select>

                    </div>


                    <!-- IMAGE -->

                    <div class="form-group">

                        <label>
                            Lien de l'Image
                        </label>

                        <input
                            type="url"
                            id="adminProductImage"
                            placeholder="https://exemple.com/image.png"
                        >

                    </div>


                    <!-- VIDEO -->

                    <div class="form-group">

                        <label>
                            Lien Vidéo Démo
                            (Optionnel)
                        </label>

                        <input
                            type="url"
                            id="adminProductVideo"
                            placeholder="https://exemple.com/video.mp4"
                        >

                    </div>


                    <!-- DOCUMENT -->

                    <div class="form-group">

                        <label>
                            Lien Document / Support
                            (Optionnel)
                        </label>

                        <input
                            type="url"
                            id="adminProductDocument"
                            placeholder="https://exemple.com/document.pdf"
                        >

                    </div>


                    <!-- DESCRIPTION -->

                    <div class="form-group">

                        <label>
                            Description Complète
                        </label>

                        <textarea
                            id="adminProductDescription"
                            placeholder="Détails, avantages, informations..."
                        ></textarea>

                    </div>


                    <!-- COMMISSIONS -->

                    <div class="commission-box">


                        <div class="commission-title">

                            💰 Répartition des Commissions

                        </div>


                        <div class="commission-grid">


                            <div class="commission-input">

                                <label>
                                    Vendeur (%)
                                </label>

                                <input
                                    type="number"
                                    id="adminCommissionProduit"
                                    value="60"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                >

                            </div>


                            <div class="commission-input">

                                <label>
                                    Affiliation (%)
                                </label>

                                <input
                                    type="number"
                                    id="adminCommissionAffiliation"
                                    value="20"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                >

                            </div>


                            <div class="commission-input">

                                <label>
                                    Plateforme (%)
                                </label>

                                <input
                                    type="number"
                                    id="adminCommissionPlateforme"
                                    value="20"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                >

                            </div>

                        </div>


                        <div
                            id="adminCommissionTotal"
                            class="commission-total"
                        >
                            Total : 100.00 %
                        </div>


                        <div
                            id="adminCommissionExample"
                            class="commission-example"
                        >
                            Sur 0 FCFA → Vendeur : 0 FCFA |
                            Affiliation : 0 FCFA |
                            Plateforme : 0 FCFA
                        </div>


                        <div
                            id="adminCommissionSummary"
                            class="commission-summary"
                        >
                            Prix normal :
                            <strong>0 FCFA</strong>

                            <br>

                            Prix réellement vendu :
                            <strong>0 FCFA</strong>

                            <br>

                            Vendeur :
                            <strong>0 FCFA</strong>

                            <br>

                            Affiliation :
                            <strong>0 FCFA</strong>

                            <br>

                            Plateforme :
                            <strong>0 FCFA</strong>

                            <br>

                            Total :
                            <strong>0 FCFA</strong>
                        </div>

                    </div>


                    <button
                        type="button"
                        id="adminAddProduct"
                        class="btn-pub-action"
                    >
                        🚀 Publier sur la Plateforme
                    </button>


                </div>


                <!-- =================================================
                     APERÇU
                ================================================== -->

                <div class="pub-card">


                    <div class="pub-card-title">

                        👁️ Aperçu de la Fiche

                    </div>


                    <div
                        id="adminPreviewBox"
                        class="preview-box"
                    >

                        <span
                            style="
                                color:#666;
                                font-size:12px;
                                text-align:center;
                            "
                        >
                            Saisissez les informations
                            pour générer l'aperçu...
                        </span>

                    </div>


                </div>


            </div>

        </div>

    `;


    /* ========================================================
       OUTILS
    ======================================================== */

    const getValue = (id) => {

        return (
            document
                .getElementById(id)
                ?.value
                ?.trim() || ""
        );

    };


    const getNumber = (
        id,
        defaultValue = 0
    ) => {

        const raw =
            getValue(id);

        if (raw === "") {
            return defaultValue;
        }

        const value =
            Number(raw);

        return Number.isFinite(value)
            ? value
            : defaultValue;

    };


    /* ========================================================
       FORMATAGE DES NOMBRES
    ======================================================== */

    function formatNumber(amount) {

        const number =
            Number(amount);

        if (!Number.isFinite(number)) {
            return "0";
        }

        return number.toLocaleString(
            "fr-FR",
            {
                minimumFractionDigits:
                    Number.isInteger(number)
                        ? 0
                        : 2,

                maximumFractionDigits:2
            }
        );

    }


    /* ========================================================
       FORMATAGE DEVISE
    ======================================================== */

    function formatPrice(
        amount,
        currency = null
    ) {

        const selectedCurrency =
            currency ||
            getValue(
                "adminProductCurrency"
            ) ||
            "FCFA";


        const number =
            Number(amount);


        if (!Number.isFinite(number)) {
            return `0 ${selectedCurrency}`;
        }


        switch (
            selectedCurrency
        ) {

            case "EUR":

                return (
                    formatNumber(number) +
                    " €"
                );


            case "USD":

                return (
                    "$" +
                    formatNumber(number)
                );


            case "FCFA":

            default:

                return (
                    formatNumber(number) +
                    " FCFA"
                );

        }

    }


    /* ========================================================
       ÉCHAPPEMENT HTML
    ======================================================== */

    function escapeHTML(value) {

        return String(
            value ?? ""
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

    }


    /* ========================================================
       DATE
    ======================================================== */

    function formatDate(date) {

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                day:"2-digit",
                month:"2-digit",
                year:"numeric"
            }
        ).format(date);

    }


    /* ========================================================
       HEURE
    ======================================================== */

    function formatTime(date) {

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                hour:"2-digit",
                minute:"2-digit",
                second:"2-digit",
                hour12:false
            }
        ).format(date);

    }


    /* ========================================================
       HORLOGE
    ======================================================== */

    function updatePublicationClock() {

        const now =
            new Date();


        const dateElement =
            document.getElementById(
                "adminPublicationDate"
            );


        const timeElement =
            document.getElementById(
                "adminPublicationTime"
            );


        if (dateElement) {

            dateElement.textContent =
                formatDate(now);

        }


        if (timeElement) {

            timeElement.textContent =
                formatTime(now);

        }

    }


    updatePublicationClock();


    /*
       Si le module est rechargé,
       on nettoie l'ancien timer.
    */

    if (
        window.dakproPublicationClock
    ) {

        clearInterval(
            window.dakproPublicationClock
        );

    }


    window.dakproPublicationClock =
        setInterval(
            updatePublicationClock,
            1000
        );


    /* ========================================================
       COMMISSIONS
    ======================================================== */

    function getCommissions() {

        const vendeur =
            getNumber(
                "adminCommissionProduit",
                60
            );


        const affiliation =
            getNumber(
                "adminCommissionAffiliation",
                20
            );


        const plateforme =
            getNumber(
                "adminCommissionPlateforme",
                20
            );


        const total =
            vendeur +
            affiliation +
            plateforme;


        return {

            vendeur,

            affiliation,

            plateforme,

            total

        };

    }


    /* ========================================================
       PRIX EFFECTIF
    ======================================================== */

    function getEffectivePrice() {

        const prixNormal =
            getNumber(
                "adminProductPrice",
                0
            );


        const promoText =
            getValue(
                "adminProductPromoPrice"
            );


        if (promoText !== "") {

            const promo =
                Number(
                    promoText
                );


            if (
                Number.isFinite(promo) &&
                promo >= 0 &&
                promo < prixNormal
            ) {

                return promo;

            }

        }


        return prixNormal;

    }


    /* ========================================================
       CALCUL COMMISSIONS
    ======================================================== */

    function calculateCommissions() {

        const commissions =
            getCommissions();


        const prixNormal =
            getNumber(
                "adminProductPrice",
                0
            );


        const prixVente =
            getEffectivePrice();


        const montantVendeur =
            prixVente *
            commissions.vendeur /
            100;


        const montantAffiliation =
            prixVente *
            commissions.affiliation /
            100;


        const montantPlateforme =
            prixVente *
            commissions.plateforme /
            100;


        return {

            prixNormal,

            prixVente,

            vendeur:
                commissions.vendeur,

            affiliation:
                commissions.affiliation,

            plateforme:
                commissions.plateforme,

            total:
                commissions.total,

            montantVendeur,

            montantAffiliation,

            montantPlateforme,

            montantTotal:
                montantVendeur +
                montantAffiliation +
                montantPlateforme

        };

    }


    /* ========================================================
       MISE À JOUR COMMISSIONS
    ======================================================== */

    function updateCommissions() {

        const values =
            calculateCommissions();


        const currency =
            getValue(
                "adminProductCurrency"
            ) ||
            "FCFA";


        const totalElement =
            document.getElementById(
                "adminCommissionTotal"
            );


        const exampleElement =
            document.getElementById(
                "adminCommissionExample"
            );


        const summaryElement =
            document.getElementById(
                "adminCommissionSummary"
            );


        const valid =
            Math.abs(
                values.total - 100
            ) < 0.001;


        /* TOTAL */

        if (totalElement) {

            totalElement.textContent =
                `Total : ${formatNumber(values.total)} %`;


            totalElement.style.color =
                valid
                    ? "#22c55e"
                    : "#ef4444";

        }


        /* EXEMPLE */

        if (exampleElement) {

            exampleElement.textContent =

                `Sur ${formatPrice(
                    values.prixVente,
                    currency
                )} → ` +

                `Vendeur : ${formatPrice(
                    values.montantVendeur,
                    currency
                )} | ` +

                `Affiliation : ${formatPrice(
                    values.montantAffiliation,
                    currency
                )} | ` +

                `Plateforme : ${formatPrice(
                    values.montantPlateforme,
                    currency
                )}`;

        }


        /* RÉSUMÉ */

        if (summaryElement) {

            summaryElement.innerHTML = `

                Prix normal :
                <strong>
                    ${escapeHTML(
                        formatPrice(
                            values.prixNormal,
                            currency
                        )
                    )}
                </strong>

                <br>

                Prix réellement vendu :
                <strong>
                    ${escapeHTML(
                        formatPrice(
                            values.prixVente,
                            currency
                        )
                    )}
                </strong>

                <br>

                Vendeur (${values.vendeur}%):
                <strong>
                    ${escapeHTML(
                        formatPrice(
                            values.montantVendeur,
                            currency
                        )
                    )}
                </strong>

                <br>

                Affiliation (${values.affiliation}%):
                <strong>
                    ${escapeHTML(
                        formatPrice(
                            values.montantAffiliation,
                            currency
                        )
                    )}
                </strong>

                <br>

                Plateforme (${values.plateforme}%):
                <strong>
                    ${escapeHTML(
                        formatPrice(
                            values.montantPlateforme,
                            currency
                        )
                    )}
                </strong>

                <br>

                Total :
                <strong>
                    ${escapeHTML(
                        formatPrice(
                            values.montantTotal,
                            currency
                        )
                    )}
                </strong>

            `;

        }

    }


    /* ========================================================
       APERÇU
    ======================================================== */

    function renderPreview() {

        const previewBox =
            document.getElementById(
                "adminPreviewBox"
            );


        if (!previewBox) {
            return;
        }


        const name =
            getValue(
                "adminProductName"
            ) ||
            "Nom du produit";


        const category =
            getValue(
                "adminProductCategory"
            ) ||
            "Catégorie";


        const price =
            getNumber(
                "adminProductPrice",
                0
            );


        const promoText =
            getValue(
                "adminProductPromoPrice"
            );


        const promoPrice =
            promoText !== ""
                ? Number(
                    promoText
                )
                : null;


        const currency =
            getValue(
                "adminProductCurrency"
            ) ||
            "FCFA";


        const image =
            getValue(
                "adminProductImage"
            );


        const video =
            getValue(
                "adminProductVideo"
            );


        const documentUrl =
            getValue(
                "adminProductDocument"
            );


        const description =
            getValue(
                "adminProductDescription"
            );


        const commissions =
            calculateCommissions();


        const hasData =

            getValue(
                "adminProductName"
            ) ||

            price > 0 ||

            image;


        if (!hasData) {

            previewBox.innerHTML = `

                <span
                    style="
                        color:#666;
                        font-size:12px;
                        text-align:center;
                    "
                >
                    Saisissez les informations
                    pour générer l'aperçu...
                </span>

            `;

            return;

        }


        /* ====================================================
           MÉDIAS
        ==================================================== */

        let mediaHTML = "";


        if (image) {

            mediaHTML += `

                <img
                    class="preview-image"
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(name)}"
                    onerror="
                        this.style.display='none';
                    "
                >

            `;

        }


        if (video) {

            mediaHTML += `

                <video
                    src="${escapeHTML(video)}"
                    controls
                    style="
                        width:100%;
                        max-height:180px;
                        object-fit:contain;
                        background:#080b10;
                        border-radius:7px;
                        margin-bottom:10px;
                    "
                ></video>

            `;

        }


        /* ====================================================
           PRIX
        ==================================================== */

        let priceHTML = "";


        if (
            promoPrice !== null &&
            Number.isFinite(promoPrice) &&
            promoPrice >= 0 &&
            promoPrice < price
        ) {

            priceHTML = `

                ${escapeHTML(
                    formatPrice(
                        promoPrice,
                        currency
                    )
                )}

                <span class="preview-old-price">

                    ${escapeHTML(
                        formatPrice(
                            price,
                            currency
                        )
                    )}

                </span>

            `;

        } else {

            priceHTML = `

                ${escapeHTML(
                    formatPrice(
                        price,
                        currency
                    )
                )}

            `;

        }


        /* ====================================================
           DOCUMENT
        ==================================================== */

        const documentHTML =
            documentUrl
                ? `

                    <div
                        style="
                            margin-top:8px;
                            font-size:9px;
                            color:#aaa;
                        "
                    >
                        📄 Support disponible
                    </div>

                  `
                : "";


        /* ====================================================
           APERÇU
        ==================================================== */

        previewBox.innerHTML = `

            <div class="preview-card">


                ${mediaHTML}


                <div
                    style="
                        font-size:9px;
                        color:#888;
                        text-transform:uppercase;
                        margin-bottom:4px;
                    "
                >
                    ${escapeHTML(category)}
                </div>


                <div class="preview-name">

                    ${escapeHTML(name)}

                </div>


                <div class="preview-price">

                    ${priceHTML}

                </div>


                ${
                    description
                        ? `

                            <div
                                class="preview-description"
                            >
                                ${escapeHTML(
                                    description
                                )}
                            </div>

                          `
                        : ""
                }


                ${documentHTML}


                <div class="preview-commission">

                    <strong
                        style="color:#ffcc00;"
                    >
                        💰 Répartition
                    </strong>

                    <br>

                    Vendeur :
                    ${formatNumber(
                        commissions.vendeur
                    )}%

                    <br>

                    Affiliation :
                    ${formatNumber(
                        commissions.affiliation
                    )}%

                    <br>

                    Plateforme :
                    ${formatNumber(
                        commissions.plateforme
                    )}%

                    <br>

                    Total :

                    <span
                        style="
                            color:
                            ${
                                Math.abs(
                                    commissions.total -
                                    100
                                ) < 0.001
                                    ? "#22c55e"
                                    : "#ef4444"
                            };

                            font-weight:900;
                        "
                    >
                        ${formatNumber(
                            commissions.total
                        )}%
                    </span>

                </div>


            </div>

        `;

    }


    /* ========================================================
       CHAMPS À SURVEILLER
    ======================================================== */

    const trackedInputs = [

        "adminProductName",

        "adminProductCategory",

        "adminProductPrice",

        "adminProductPromoPrice",

        "adminProductCurrency",

        "adminProductImage",

        "adminProductVideo",

        "adminProductDocument",

        "adminProductDescription",

        "adminCommissionProduit",

        "adminCommissionAffiliation",

        "adminCommissionPlateforme"

    ];


    trackedInputs.forEach(
        id => {

            const input =
                document.getElementById(
                    id
                );


            if (!input) {
                return;
            }


            input.addEventListener(
                "input",
                () => {

                    updateCommissions();

                    renderPreview();

                }
            );


            input.addEventListener(
                "change",
                () => {

                    updateCommissions();

                    renderPreview();

                }
            );

        }
    );


    /* ========================================================
       STATUT ADMIN
    ======================================================== */

    const statusBox =
        document.getElementById(
            "adminPublicationStatus"
        );


    if (statusBox) {

        if (
            currentUserIsAdmin &&
            currentUser?.uid
        ) {

            statusBox.className =
                "status-box status-ok";

            statusBox.textContent =
                `✅ Administrateur connecté : ${
                    currentUser.email ||
                    currentUser.uid
                }`;

        } else {

            statusBox.className =
                "status-box status-error";

            statusBox.textContent =
                "⛔ Session administrateur non détectée. Vérifie Firebase Authentication et window.currentUser.";

        }

    }


    /* ========================================================
       BOUTON PUBLICATION
    ======================================================== */

    const publishButton =
        document.getElementById(
            "adminAddProduct"
        );


    if (publishButton) {

        publishButton.addEventListener(
            "click",
            async () => {


                /* =============================================
                   DOUBLE CLIC
                ============================================== */

                if (
                    publishButton.disabled
                ) {

                    return;

                }


                /* =============================================
                   ADMIN
                ============================================== */

                if (
                    !currentUserIsAdmin
                ) {

                    alert(
                        "⛔ Accès administrateur requis.\n\nUtilisateur non reconnu comme administrateur."
                    );

                    return;

                }


                /* =============================================
                   UTILISATEUR
                ============================================== */

                if (
                    !currentUser ||
                    !currentUser.uid
                ) {

                    alert(

                        "⚠️ Utilisateur administrateur non identifié.\n\n" +

                        "Vérifie que Firebase Authentication est connecté " +

                        "et que window.currentUser est défini avant le chargement du module."

                    );

                    return;

                }


                /* =============================================
                   NOM
                ============================================== */

                const nom =
                    getValue(
                        "adminProductName"
                    );


                if (!nom) {

                    alert(
                        "⚠️ Veuillez renseigner le nom du produit."
                    );

                    return;

                }


                /* =============================================
                   CATÉGORIE
                ============================================== */

                const categorie =
                    getValue(
                        "adminProductCategory"
                    );


                if (!categorie) {

                    alert(
                        "⚠️ Veuillez renseigner la catégorie."
                    );

                    return;

                }


                /* =============================================
                   PRIX
                ============================================== */

                const prix =
                    getNumber(
                        "adminProductPrice",
                        -1
                    );


                if (
                    !Number.isFinite(prix) ||
                    prix < 0
                ) {

                    alert(
                        "⚠️ Veuillez renseigner un prix valide."
                    );

                    return;

                }


                /* =============================================
                   PRIX PROMO
                ============================================== */

                const promoText =
                    getValue(
                        "adminProductPromoPrice"
                    );


                let prixPromo =
                    null;


                if (
                    promoText !== ""
                ) {

                    prixPromo =
                        Number(
                            promoText
                        );


                    if (
                        !Number.isFinite(
                            prixPromo
                        ) ||
                        prixPromo < 0
                    ) {

                        alert(
                            "⚠️ Le prix promotionnel est invalide."
                        );

                        return;

                    }


                    if (
                        prixPromo >= prix
                    ) {

                        alert(

                            "⚠️ Le prix promotionnel doit être inférieur au prix normal."

                        );

                        return;

                    }

                }


                /* =============================================
                   DEVISE
                ============================================== */

                const devise =
                    getValue(
                        "adminProductCurrency"
                    ) ||
                    "FCFA";


                /* =============================================
                   COMMISSIONS
                ============================================== */

                const commissions =
                    calculateCommissions();


                if (
                    commissions.vendeur < 0 ||
                    commissions.affiliation < 0 ||
                    commissions.plateforme < 0
                ) {

                    alert(
                        "⚠️ Les commissions ne peuvent pas être négatives."
                    );

                    return;

                }


                if (
                    commissions.vendeur > 100 ||
                    commissions.affiliation > 100 ||
                    commissions.plateforme > 100
                ) {

                    alert(
                        "⚠️ Une commission ne peut pas dépasser 100 %."
                    );

                    return;

                }


                if (
                    Math.abs(
                        commissions.total -
                        100
                    ) > 0.001
                ) {

                    alert(

                        "⚠️ La somme des commissions doit être exactement de 100 %.\n\n" +

                        `Vendeur : ${commissions.vendeur}%\n` +

                        `Affiliation : ${commissions.affiliation}%\n` +

                        `Plateforme : ${commissions.plateforme}%\n\n` +

                        `Total actuel : ${formatNumber(
                            commissions.total
                        )}%`

                    );

                    return;

                }


                /* =============================================
                   DATE / HEURE
                ============================================== */

                const now =
                    new Date();


                const clientTimestamp =
                    now.getTime();


                const datePublication =
                    formatDate(
                        now
                    );


                const heurePublication =
                    formatTime(
                        now
                    );


                const prixVente =
                    prixPromo !== null
                        ? prixPromo
                        : prix;


                /* =============================================
                   CALCUL FINAL
                ============================================== */

                const montantVendeur =
                    Number(
                        (
                            prixVente *
                            commissions.vendeur /
                            100
                        ).toFixed(2)
                    );


                const montantAffiliation =
                    Number(
                        (
                            prixVente *
                            commissions.affiliation /
                            100
                        ).toFixed(2)
                    );


                const montantPlateforme =
                    Number(
                        (
                            prixVente *
                            commissions.plateforme /
                            100
                        ).toFixed(2)
                    );


                const montantTotal =
                    Number(
                        (
                            montantVendeur +
                            montantAffiliation +
                            montantPlateforme
                        ).toFixed(2)
                    );


                /* =============================================
                   BOUTON
                ============================================== */

                publishButton.disabled =
                    true;


                publishButton.textContent =
                    "⏳ Publication en cours...";


                try {


                    /* =========================================
                       RÉFÉRENCE FIREBASE
                    ========================================== */

                    const newRef =
                        push(
                            ref(
                                db,
                                "publications"
                            )
                        );


                    /* =========================================
                       PAYLOAD
                    ========================================== */

                    const payload = {

                        /* IDENTIFICATION */

                        id:
                            newRef.key,

                        nom,

                        categorie,


                        /* PRIX */

                        prix,

                        prixPromo,

                        prixVente,

                        devise,


                        /* MÉDIAS */

                        image:
                            getValue(
                                "adminProductImage"
                            ),

                        video:
                            getValue(
                                "adminProductVideo"
                            ),

                        document:
                            getValue(
                                "adminProductDocument"
                            ),


                        /* DESCRIPTION */

                        description:
                            getValue(
                                "adminProductDescription"
                            ),


                        /* ÉTAT */

                        actif:true,

                        boost:false,


                        /* DATE CLIENT */

                        clientCreatedAt:
                            clientTimestamp,

                        clientPublishedAt:
                            clientTimestamp,

                        datePublication,

                        heurePublication,

                        datePublicationISO:
                            now.toISOString(),


                        /* DATE SERVEUR FIREBASE */

                        createdAt:
                            serverTimestamp(),

                        publishedAt:
                            serverTimestamp(),


                        /* CRÉATEUR */

                        createdBy:
                            currentUser.uid,

                        createdByEmail:
                            currentUser.email ||
                            "",

                        createdByName:
                            currentUser.displayName ||
                            "",


                        /* COMMISSIONS % */

                        commissionProduit:
                            commissions.vendeur,

                        commissionVendeur:
                            commissions.vendeur,

                        commissionAffiliation:
                            commissions.affiliation,

                        commissionPlateforme:
                            commissions.plateforme,

                        commissionTotal:
                            100,


                        /* COMMISSIONS MONTANTS */

                        montantProduit:
                            montantVendeur,

                        montantVendeur,

                        montantAffiliation,

                        montantPlateforme,

                        montantTotal,


                        /* BASE DE CALCUL */

                        commissionBase:
                            prixVente,

                        currency:
                            devise,


                        /* STATISTIQUES INITIALES */

                        vues:0,

                        clics:0,

                        commandes:0,

                        nombreAvis:0,

                        note:0,


                        /* STOCK */

                        stock:
                            999


                    };


                    /* =========================================
                       ENREGISTREMENT
                    ========================================== */

                    await set(
                        newRef,
                        payload
                    );


                    /* =========================================
                       SUCCÈS
                    ========================================== */

                    alert(

                        "✅ PRODUIT PUBLIÉ AVEC SUCCÈS !\n\n" +

                        `Produit : ${nom}\n` +

                        `Catégorie : ${categorie}\n\n` +

                        `Prix : ${formatPrice(
                            prix,
                            devise
                        )}\n` +

                        (
                            prixPromo !== null
                                ? `Prix promo : ${formatPrice(
                                    prixPromo,
                                    devise
                                )}\n`
                                : ""
                        ) +

                        `\nVendeur : ${formatPrice(
                            montantVendeur,
                            devise
                        )}\n` +

                        `Affiliation : ${formatPrice(
                            montantAffiliation,
                            devise
                        )}\n` +

                        `Plateforme : ${formatPrice(
                            montantPlateforme,
                            devise
                        )}\n\n` +

                        `Total : ${formatPrice(
                            montantTotal,
                            devise
                        )}\n\n` +

                        `📅 Date : ${datePublication}\n` +

                        `🕐 Heure : ${heurePublication}`

                    );


                    /* =========================================
                       RÉINITIALISATION
                    ========================================== */

                    const resetFields = [

                        "adminProductName",

                        "adminProductCategory",

                        "adminProductPrice",

                        "adminProductPromoPrice",

                        "adminProductImage",

                        "adminProductVideo",

                        "adminProductDocument",

                        "adminProductDescription"

                    ];


                    resetFields.forEach(
                        id => {

                            const element =
                                document.getElementById(
                                    id
                                );


                            if (element) {

                                element.value =
                                    "";

                            }

                        }
                    );


                    /* =========================================
                       COMMISSIONS PAR DÉFAUT
                    ========================================== */

                    document
                        .getElementById(
                            "adminCommissionProduit"
                        )
                        .value =
                        "60";


                    document
                        .getElementById(
                            "adminCommissionAffiliation"
                        )
                        .value =
                        "20";


                    document
                        .getElementById(
                            "adminCommissionPlateforme"
                        )
                        .value =
                        "20";


                    /* =========================================
                       DEVISE PAR DÉFAUT
                    ========================================== */

                    document
                        .getElementById(
                            "adminProductCurrency"
                        )
                        .value =
                        "FCFA";


                    updateCommissions();

                    renderPreview();


                } catch (error) {

                    console.error(
                        "DAKPRO ÉLITE — erreur publication :",
                        error
                    );


                    alert(

                        "❌ ERREUR LORS DE LA PUBLICATION.\n\n" +

                        (
                            error?.message ||
                            "Erreur inconnue."
                        )

                    );

                } finally {

                    publishButton.disabled =
                        false;


                    publishButton.textContent =
                        "🚀 Publier sur la Plateforme";

                }

            }
        );

    }


    /* ========================================================
       PREMIER AFFICHAGE
    ======================================================== */

    updatePublicationClock();

    updateCommissions();

    renderPreview();


    /* ========================================================
       FIN
    ======================================================== */

    container.dataset.publicationModuleLoaded =
        "true";


    console.log(
        "✅ DAKPRO ÉLITE — admin-publications.js initialisé."
    );

}