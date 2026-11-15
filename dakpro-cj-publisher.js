// ============================================================
// DAKPRO ÉLITE
// GLOBAL IMPORTER — PARTIE 2 : PUBLICATION CATALOGUE CJ
// FICHIER : dakpro-cj-publisher.js
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

    timeout: 30000

};


class DakproCJPublisher {

    constructor(product, containerId = "module-container") {

        this.product = product;

        this.containerId = containerId;

        this.container = document.getElementById(containerId);

        this.db = getDatabase();

        this.auth = getAuth();

        this.variants = [];

        this.importing = false;

        this.render();

        this.fetchDetailsAndVariants();

    }


    render() {

        this.container.innerHTML = `

        <style>

        .dakcj-pub {
            background:#0f0f13;
            color:white;
            padding:15px;
            border-radius:12px;
            border:1px solid #333;
            font-family:inherit;
        }

        .dakcj-pub * {
            box-sizing:border-box;
        }

        .dakcj-header {
            display:flex;
            justify-content:space-between;
            align-items:center;
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

        .dakcj-back-btn {
            background:#16161c;
            color:#FFD700;
            border:1px solid #D4AF37;
            padding:6px 12px;
            border-radius:6px;
            cursor:pointer;
            font-size:11px;
        }

        .dakcj-preview-image-wrapper {
            width:100%;
            background:#0b0b0e;
            border:1px solid #443a18;
            border-radius:8px;
            padding:10px;
            text-align:center;
            margin-bottom:12px;
        }

        .dakcj-preview-image-wrapper img {
            width:100%;
            max-height:280px;
            object-fit:contain;
            border-radius:6px;
            background:#0b0b0e;
        }

        .dakcj-section {
            background:#0b0b0e;
            border:1px solid #443a18;
            border-radius:8px;
            padding:12px;
            margin-bottom:12px;
        }

        .dakcj-section h3 {
            color:#FFD700;
            font-size:12px;
            margin:0 0 8px 0;
            border-bottom:1px solid #333;
            padding-bottom:5px;
        }

        .dakcj-label {
            display:block;
            color:#D4AF37;
            font-size:11px;
            margin:8px 0 4px;
            font-weight:600;
        }

        .dakcj-pub input,
        .dakcj-pub select {
            width:100%;
            padding:10px;
            border-radius:6px;
            background:#16161c;
            color:white;
            border:1px solid #444;
            font-size:12px;
        }

        .dakcj-result {
            color:#FFD700;
            font-size:22px;
            font-weight:800;
            text-align:center;
        }

        .dakcj-action {
            width:100%;
            padding:12px;
            border:0;
            border-radius:6px;
            margin-top:8px;
            font-size:13px;
            font-weight:700;
            cursor:pointer;
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

        </style>


        <section class="dakcj-pub">

            <header class="dakcj-header">

                <h2 class="dakcj-title">
                    PUBLICATION PRODUIT CJ
                </h2>

                <button
                    class="dakcj-back-btn"
                    id="dakcj-back">

                    ← Retour au Catalogue

                </button>

            </header>


            <h2 style="color:#FFD700;font-size:15px;margin-bottom:10px;">

                ${this.product.name}

            </h2>


            <div class="dakcj-preview-image-wrapper">

                <img
                    id="dakcj-det-img"
                    src="${this.product.image || ''}"
                    alt="${this.product.name}"
                    referrerpolicy="no-referrer"
                >

                <div
                    id="dakcj-det-price"
                    style="color:#FFD700;font-size:14px;font-weight:700;margin-top:8px;">

                    Prix fournisseur :
                    ${this.product.price
                        ? "$" + this.product.price
                        : "Indisponible"}

                </div>


                <div
                    id="dakcj-det-status"
                    style="color:#D4AF37;font-size:11px;margin-top:6px;">

                    Chargement des détails et variantes...

                </div>

            </div>


            <div class="dakcj-section">

                <h3>DESCRIPTION</h3>

                <div
                    id="dakcj-det-desc"
                    style="font-size:11px;color:#ccc;max-height:140px;overflow-y:auto;white-space:pre-line;">

                    ${this.product.description || "Aucune description"}

                </div>

            </div>


            <div class="dakcj-section">

                <h3>
                    VARIANTES
                    (<span id="dakcj-vcount">0</span>)
                </h3>

                <label class="dakcj-label">

                    Sélectionner une variante

                </label>

                <select id="dakcj-variant">

                    <option value="">
                        Produit standard
                    </option>

                </select>

            </div>


            <div class="dakcj-section">

                <h3>
                    PARAMÈTRES COMMERCIAUX & PRIX PUBLIC
                </h3>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">

                    <div>

                        <label class="dakcj-label">
                            TAUX USD / FCFA
                        </label>

                        <input
                            id="dakcj-rate"
                            type="number"
                            value="${CONFIG.exchangeRate}"
                        >

                    </div>


                    <div>

                        <label class="dakcj-label">
                            MARGE (%)
                        </label>

                        <input
                            id="dakcj-margin"
                            type="number"
                            value="${CONFIG.marginPercent}"
                        >

                    </div>

                </div>


                <div style="margin-top:12px;background:#050507;padding:12px;border-radius:6px;border:1px solid #443a18;">

                    <div style="font-size:10px;color:#D4AF37;text-align:center;margin-bottom:4px;">

                        PRIX FINAL (FCFA)

                    </div>

                    <div
                        class="dakcj-result"
                        id="dakcj-price">

                        Calcul...

                    </div>

                    <div
                        id="dakcj-cost"
                        style="font-size:10px;color:#aaa;margin-top:8px;">

                    </div>

                </div>

            </div>


            <button
                id="dakcj-publish-btn"
                class="dakcj-action dakcj-publish">

                PUBLIER SUR DAKPRO ÉLITE

            </button>


            <button
                id="dakcj-draft-btn"
                class="dakcj-action dakcj-draft">

                ENREGISTRER EN BROUILLON

            </button>

        </section>

        `;


        this.events();

    }



    events() {

        this.container.querySelector("#dakcj-back")
            .addEventListener("click", () => returnToCatalog());


        this.container.querySelector("#dakcj-rate")
            .addEventListener("input", () => this.calcPrice());


        this.container.querySelector("#dakcj-margin")
            .addEventListener("input", () => this.calcPrice());


        this.container.querySelector("#dakcj-variant")
            .addEventListener("change", e => {

                const idx = e.target.value;

                const imgEl = this.container.querySelector(
                    "#dakcj-det-img"
                );

                if (idx !== "") {

                    const v = this.variants[Number(idx)];

                    if (v && (v.variantImage || v.image)) {

                        imgEl.src = v.variantImage || v.image;

                    }

                } else if (this.product.image) {

                    imgEl.src = this.product.image;

                }

                this.calcPrice();

            });


        this.container.querySelector("#dakcj-publish-btn")
            .addEventListener("click", () => this.saveProduct(true));


        this.container.querySelector("#dakcj-draft-btn")
            .addEventListener("click", () => this.saveProduct(false));

    }



    async fetchDetailsAndVariants() {

        try {

            const [detailRes, variantRes] = await Promise.allSettled([

                fetch(
                    `${CONFIG.API}?action=detail&pid=${encodeURIComponent(this.product.pid)}`
                ).then(r => r.json()),

                fetch(
                    `${CONFIG.API}?action=variants&pid=${encodeURIComponent(this.product.pid)}`
                ).then(r => r.json())

            ]);


            if (
                detailRes.status === "fulfilled" &&
                detailRes.value?.data
            ) {

                const d = detailRes.value.data;

                this.product.description =
                    d.description ||
                    d.productDescription ||
                    this.product.description;


                if (d.productImage || d.bigImage) {

                    this.product.image =
                        d.productImage || d.bigImage;

                    this.container.querySelector(
                        "#dakcj-det-img"
                    ).src = this.product.image;

                }


                this.container.querySelector(
                    "#dakcj-det-desc"
                ).textContent = this.cleanDesc(
                    this.product.description
                );


                const detPrice = Number(
                    d.sellPrice ||
                    d.price ||
                    d.nowPrice ||
                    0
                );


                if (detPrice > 0) {

                    this.product.price = detPrice;

                    this.container.querySelector(
                        "#dakcj-det-price"
                    ).textContent =
                        `Prix fournisseur : $${detPrice}`;

                }

            }



            if (
                variantRes.status === "fulfilled" &&
                variantRes.value?.data
            ) {

                const rawVar = variantRes.value.data;

                this.variants = Array.isArray(rawVar)
                    ? rawVar
                    : (rawVar.list || rawVar.variants || []);


                const select = this.container.querySelector(
                    "#dakcj-variant"
                );


                select.innerHTML = `

                    <option value="">
                        Produit standard
                    </option>

                ` + this.variants.map((v, i) => `

                    <option value="${i}">

                        ${v.variantNameEn ||
                          v.variantName ||
                          v.name ||
                          "Variante " + (i + 1)}

                    </option>

                `).join("");


                this.container.querySelector(
                    "#dakcj-vcount"
                ).textContent = this.variants.length;

            }



            this.container.querySelector(
                "#dakcj-det-status"
            ).textContent = "";


            this.calcPrice();


        } catch (e) {

            this.container.querySelector(
                "#dakcj-det-status"
            ).textContent = "Détails partiels chargés.";

            this.calcPrice();

        }

    }



    calcPrice() {

        const rate = Number(
            this.container.querySelector("#dakcj-rate").value
        ) || CONFIG.exchangeRate;


        const margin = Number(
            this.container.querySelector("#dakcj-margin").value
        ) || CONFIG.marginPercent;


        const vIdx = this.container.querySelector(
            "#dakcj-variant"
        ).value;


        const selVar = vIdx !== ""
            ? this.variants[Number(vIdx)]
            : null;


        const sp = Number(
            selVar?.variantSellPrice ||
            selVar?.sellPrice ||
            selVar?.price ||
            this.product.price ||
            0
        );


        const cost = sp * rate;

        const marginVal = cost * margin / 100;

        const final = cost + marginVal;


        this.container.querySelector(
            "#dakcj-price"
        ).textContent =
            Math.round(final).toLocaleString("fr-FR") + " FCFA";


        this.container.querySelector(
            "#dakcj-cost"
        ).innerHTML = `

            Coût fournisseur :

            <strong>
                ${Math.round(cost).toLocaleString("fr-FR")} FCFA
            </strong>

            |

            Marge :

            <strong>
                ${Math.round(marginVal).toLocaleString("fr-FR")} FCFA
            </strong>

            <br>

            Vendeur (80%) :

            <strong>
                ${Math.round(marginVal * 0.8).toLocaleString("fr-FR")} FCFA
            </strong>

            |

            Plateforme :

            <strong>
                ${Math.round(marginVal * 0.15).toLocaleString("fr-FR")} FCFA
            </strong>

        `;


        return {
            sp,
            cost,
            marginVal,
            final,
            rate,
            margin,
            selVar
        };

    }



    async uploadCloudinary(url) {

        if (!url) return "";

        const fd = new FormData();

        fd.append("file", url);

        fd.append(
            "upload_preset",
            CONFIG.CLOUDINARY.uploadPreset
        );

        fd.append(
            "folder",
            CONFIG.CLOUDINARY.folder
        );


        const res = await fetch(

            `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY.cloudName}/auto/upload`,

            {
                method: "POST",
                body: fd
            }

        );


        const json = await res.json();

        return json.secure_url || url;

    }



    async saveProduct(published) {

        if (this.importing) return;


        const user = window.currentUser || this.auth.currentUser;


        if (!user) {

            alert("Connectez-vous d'abord.");

            return;

        }


        this.importing = true;


        const btn = this.container.querySelector(
            "#dakcj-publish-btn"
        );


        btn.disabled = true;

        btn.textContent = "IMPORTATION EN COURS...";


        try {

            const calc = this.calcPrice();


            const cloudImg = await this.uploadCloudinary(
                this.product.image
            );


            const refId = push(
                ref(this.db, CONFIG.FIREBASE_PATH)
            ).key;


            const link =
                `${window.location.origin}/index.html?produit=${refId}&ref=${user.uid}`;


            const payload = {

                id: refId,

                nom: this.product.name,

                fournisseur: "CJdropshipping",

                cjPid: String(this.product.pid),

                sku:
                    calc.selVar?.variantSku ||
                    this.product.sku ||
                    "",

                prixFournisseurUSD: calc.sp,

                prixFournisseurFCFA: Math.round(calc.cost),

                prix: Math.round(calc.final),

                devise: "FCFA",

                margeBeneficiaire: calc.margin,

                montantMarge: Math.round(calc.marginVal),

                image: cloudImg,

                vendeurId: user.uid,

                lienAffiliation: link,

                description: this.cleanDesc(
                    this.product.description
                ),

                actif: published,

                statut: published
                    ? "actif"
                    : "brouillon",

                createdAt: serverTimestamp()

            };


            await set(
                ref(this.db, `publications/${refId}`),
                payload
            );


            await set(
                ref(this.db, `produits/${refId}`),
                payload
            ).catch(() => {});


            this.container.innerHTML = `

                <div style="text-align:center;padding:30px">

                    <h2 style="color:#FFD700;">

                        ${published
                            ? "🚀 PRODUIT PUBLIÉ"
                            : "📥 BROUILLON ENREGISTRÉ"}

                    </h2>


                    <p style="font-size:11px;word-break:break-all;margin:15px 0;">

                        ID : ${refId}

                    </p>


                    <button
                        class="dakcj-action dakcj-publish"
                        id="dakcj-done">

                        RETOUR AU CATALOGUE

                    </button>

                </div>

            `;


            this.container.querySelector(
                "#dakcj-done"
            ).addEventListener(
                "click",
                () => returnToCatalog()
            );


        } catch (e) {

            alert("Erreur: " + e.message);

            btn.disabled = false;

            btn.textContent = "PUBLIER SUR DAKPRO ÉLITE";

        } finally {

            this.importing = false;

        }

    }



    cleanDesc(html) {

        if (!html) return "";

        return html.replace(/<[^>]+>/g, "").trim();

    }

}



export function initPublisher(product, containerId) {

    return new DakproCJPublisher(product, containerId);

}