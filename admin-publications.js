import {
    getDatabase,
    ref,
    push,
    update,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

/* ============================================================
   DAKPRO ÉLITE — admin-publications.js
   MODULE DE PUBLICATION UNIFIÉ (PUBLICATIONS & PRODUITS)
============================================================ */

export async function init() {
    const container = document.getElementById("module-container");
    if (!container) {
        console.warn("DAKPRO ÉLITE : #module-container introuvable.");
        return;
    }

    const db = getDatabase();
    const currentUser = window.currentUser || null;
    const currentUserIsAdmin = window.currentUserIsAdmin === true;

    container.innerHTML = `
        <style>
            * { box-sizing: border-box; }
            .pub-container { width: 100%; color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 15px; border-radius: 12px; }
            .pub-title { color: #ffcc00; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; letter-spacing: .5px; border-left: 4px solid #ffcc00; padding-left: 10px; }
            .pub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
            .pub-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, .5); }
            .pub-card-title { font-size: 14px; font-weight: 900; color: #ffcc00; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #282836; padding-bottom: 10px; }
            
            .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; }
            .form-group label { font-size: 11px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; }
            .form-group input, .form-group select, .form-group textarea { width: 100%; background: #0d0d11; border: 1px solid #282836; color: #ffcc00; padding: 10px 12px; border-radius: 6px; font-size: 13px; outline: none; }
            .form-group textarea { resize: vertical; min-height: 80px; }
            .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #ffcc00; box-shadow: 0 0 8px rgba(255, 204, 0, .25); }

            .price-grid, .pub-date-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            .pub-date-item { background: #0d0d11; border: 1px solid #282836; border-radius: 8px; padding: 10px; }
            .pub-date-label { display: block; color: #888; font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
            .pub-date-value { color: #ffcc00; font-size: 12px; font-weight: 800; }

            .commission-box { background: #0d0d11; border: 1px solid #ffcc00; border-radius: 8px; padding: 12px; margin-top: 10px; }
            .commission-title { color: #ffcc00; font-size: 12px; font-weight: 900; margin-bottom: 10px; }
            .commission-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
            .commission-input input { width: 100%; background: #050505; border: 1px solid #333; color: #ffcc00; padding: 8px; border-radius: 6px; text-align: center; font-weight: 800; }
            
            .btn-pub-action { background: linear-gradient(135deg, #ffcc00, #e6b800); color: #000; font-weight: 900; border: none; padding: 14px 25px; border-radius: 8px; cursor: pointer; transition: .2s; text-transform: uppercase; font-size: 13px; width: 100%; margin-top: 15px; }
            .btn-pub-action:hover { background: linear-gradient(135deg, #ffe57f, #ffcc00); box-shadow: 0 4px 15px rgba(255, 204, 0, .3); }
            
            .preview-box { min-height: 250px; display: flex; align-items: flex-start; justify-content: center; background: #0d0d11; border: 1px dashed #282836; border-radius: 8px; padding: 15px; }
            .preview-card { width: 100%; max-width: 450px; background: #151515; border: 1px solid #ffcc00; border-radius: 10px; padding: 15px; color: #fff; }
            .preview-image-container { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 10px; scrollbar-color: #ffcc00 #0d0d11; }
            .preview-image { min-width: 140px; width: 100%; height: 180px; object-fit: contain; border-radius: 7px; background: #080b10; border: 1px solid #282836; }
            
            .status-box { margin-bottom: 15px; padding: 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: #050505; border: 1px solid #282836; }
            .status-ok { color: #22c55e; border-color: #22c55e; }
            .status-error { color: #ef4444; border-color: #ef4444; }
            .badge-count { background: #ffcc00; color: #000; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 10px; margin-left: 5px; }
        </style>

        <div class="pub-container">
            <div class="pub-title">📦 Publication de Produits & Formations</div>
            <div id="adminPublicationStatus" class="status-box">Vérification de la session administrateur...</div>

            <div class="pub-grid">
                <!-- FORMULAIRE -->
                <div class="pub-card">
                    <div class="pub-card-title">📝 Détails de la Publication</div>

                    <div class="pub-date-box">
                        <div class="pub-date-item">
                            <span class="pub-date-label">📅 Date</span>
                            <span id="adminPublicationDate" class="pub-date-value">--</span>
                        </div>
                        <div class="pub-date-item">
                            <span class="pub-date-label">🕐 Heure</span>
                            <span id="adminPublicationTime" class="pub-date-value">--</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Nom du Produit / Formation</label>
                        <input type="text" id="adminProductName" placeholder="Ex : DAKJUBILE TONIC VITAL">
                    </div>

                    <!-- ESPACE CATÉGORIE DU PRODUIT -->
                    <div class="form-group">
                        <label>Catégorie du Produit</label>
                        <input type="text" id="adminProductCategory" list="categoriesList" placeholder="Saisissez ou choisissez une catégorie (Ex: Santé, Formation...)">
                        <datalist id="categoriesList">
                            <option value="Santé & Bien-être">
                            <option value="Formations & Cours">
                            <option value="Électronique & High-Tech">
                            <option value="Mode & Habillement">
                            <option value="Services Digitaux">
                        </datalist>
                    </div>

                    <div class="price-grid">
                        <div class="form-group">
                            <label>Prix Normal</label>
                            <input type="number" id="adminProductPrice" placeholder="10000" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Prix Promo (Optionnel)</label>
                            <input type="number" id="adminProductPromoPrice" placeholder="7500" min="0" step="0.01">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Devise</label>
                        <select id="adminProductCurrency">
                            <option value="FCFA">FCFA — Franc CFA</option>
                            <option value="EUR">EUR — Euro (€)</option>
                            <option value="USD">USD — Dollar ($)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Lien(s) de(s) Image(s) <span style="color:#888; text-transform:none;">(Collez une ou plusieurs URLs séparées par une virgule ou retour à la ligne)</span></label>
                        <textarea id="adminProductImage" placeholder="https://exemple.com/image1.png, https://exemple.com/image2.png"></textarea>
                    </div>

                    <div class="form-group">
                        <label>Lien Vidéo Démo (Optionnel) <span style="color:#888; text-transform:none;">(Multi-liens acceptés)</span></label>
                        <textarea id="adminProductVideo" style="min-height:50px;" placeholder="https://exemple.com/video1.mp4"></textarea>
                    </div>

                    <div class="form-group">
                        <label>Lien Document / Support (Optionnel) <span style="color:#888; text-transform:none;">(Multi-liens acceptés)</span></label>
                        <textarea id="adminProductDocument" style="min-height:50px;" placeholder="https://exemple.com/document.pdf"></textarea>
                    </div>

                    <div class="form-group">
                        <label>Description Complète</label>
                        <textarea id="adminProductDescription" placeholder="Détails, avantages, informations..."></textarea>
                    </div>

                    <!-- COMMISSIONS -->
                    <div class="commission-box">
                        <div class="commission-title">💰 Répartition des Commissions (Modifiables)</div>
                        <div class="commission-grid">
                            <div class="commission-input">
                                <label>Vendeur (%)</label>
                                <input type="number" id="adminCommissionProduit" value="80" min="0" max="100">
                            </div>
                            <div class="commission-input">
                                <label>Affiliation (%)</label>
                                <input type="number" id="adminCommissionAffiliation" value="5" min="0" max="100">
                            </div>
                            <div class="commission-input">
                                <label>Plateforme (%)</label>
                                <input type="number" id="adminCommissionPlateforme" value="15" min="0" max="100">
                            </div>
                        </div>
                        <div id="adminCommissionTotal" style="text-align:center; font-size:12px; font-weight:900; margin-top:10px;">Total : 100.00 %</div>
                    </div>

                    <button type="button" id="adminAddProduct" class="btn-pub-action">🚀 Publier sur la Plateforme</button>
                </div>

                <!-- APERÇU -->
                <div class="pub-card">
                    <div class="pub-card-title">👁️ Aperçu de la Fiche</div>
                    <div id="adminPreviewBox" class="preview-box">
                        <span style="color:#666; font-size:12px; text-align:center;">Saisissez les informations pour générer l'aperçu...</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const getValue = (id) => document.getElementById(id)?.value?.trim() || "";
    const getNumber = (id, def = 0) => {
        const val = Number(getValue(id));
        return Number.isFinite(val) ? val : def;
    };
    const getUrlArray = (id) => {
        const raw = getValue(id);
        if (!raw) return [];
        return raw.split(/[\n,]+/).map(url => url.trim()).filter(url => url.length > 0);
    };

    function updateClock() {
        const now = new Date();
        const dateEl = document.getElementById("adminPublicationDate");
        const timeEl = document.getElementById("adminPublicationTime");
        if (dateEl) dateEl.textContent = new Intl.DateTimeFormat("fr-FR").format(now);
        if (timeEl) timeEl.textContent = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
    }
    setInterval(updateClock, 1000);
    updateClock();

    const statusBox = document.getElementById("adminPublicationStatus");
    if (statusBox) {
        if (currentUserIsAdmin && currentUser?.uid) {
            statusBox.className = "status-box status-ok";
            statusBox.textContent = `✅ Administrateur connecté : ${currentUser.email || currentUser.uid}`;
        } else {
            statusBox.className = "status-box status-error";
            statusBox.textContent = "⛔ Session administrateur non détectée. Assurez-vous d'être connecté en Admin.";
        }
    }

    const updateCommissionTotal = () => {
        const v = getNumber("adminCommissionProduit");
        const a = getNumber("adminCommissionAffiliation");
        const p = getNumber("adminCommissionPlateforme");
        const total = v + a + p;
        const commEl = document.getElementById("adminCommissionTotal");
        if (commEl) {
            commEl.textContent = `Total : ${total.toFixed(2)} %`;
            commEl.style.color = Math.abs(total - 100) < 0.01 ? "#22c55e" : "#ef4444";
        }
    };
    ["adminCommissionProduit", "adminCommissionAffiliation", "adminCommissionPlateforme"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", updateCommissionTotal);
    });
    updateCommissionTotal();

    function updatePreview() {
        const previewBox = document.getElementById("adminPreviewBox");
        if (!previewBox) return;

        const nom = getValue("adminProductName");
        const categorie = getValue("adminProductCategory");
        const prix = getValue("adminProductPrice");
        const prixPromo = getValue("adminProductPromoPrice");
        const devise = getValue("adminProductCurrency") || "FCFA";
        const description = getValue("adminProductDescription");
        const images = getUrlArray("adminProductImage");
        const videos = getUrlArray("adminProductVideo");
        const docs = getUrlArray("adminProductDocument");

        if (!nom && !prix && images.length === 0) {
            previewBox.innerHTML = `<span style="color:#666; font-size:12px; text-align:center;">Saisissez les informations pour générer l'aperçu...</span>`;
            return;
        }

        let imagesHTML = images.length > 0
            ? `<div class="preview-image-container">
                ${images.map(img => `<img src="${img}" class="preview-image" onerror="this.src='https://via.placeholder.com/300x180?text=Image+Invalide'">`).join("")}
               </div>`
            : `<div style="width:100%; height:120px; background:#080b10; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#555; font-size:12px; margin-bottom:10px;">Aucune image</div>`;

        previewBox.innerHTML = `
            <div class="preview-card">
                ${imagesHTML}
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <span style="font-size:11px; font-weight:800; background:#282836; color:#ffcc00; padding:3px 8px; border-radius:4px;">${categorie || "GÉNÉRAL"}</span>
                    ${images.length > 1 ? `<span class="badge-count">🖼️ ${images.length} images</span>` : ""}
                </div>
                <h3 style="font-size:15px; font-weight:900; color:#fff; margin:5px 0;">${nom || "Nom du produit"}</h3>
                <div style="font-size:16px; font-weight:900; color:#ffcc00; margin-bottom:8px;">
                    ${prixPromo ? `<span style="text-decoration:line-through; color:#777; font-size:13px; margin-right:8px;">${prix}${devise}</span>${prixPromo}${devise}` : `${prix \vert{}\vert{} '0'}${devise}`}
                </div>
                <p style="font-size:12px; color:#aaa; line-height:1.4; white-space:pre-line; max-height:80px; overflow-y:auto;">${description || "Aucune description fournie."}</p>
                
                <div style="margin-top:10px; font-size:11px; color:#888; display:flex; gap:10px; border-top:1px solid #282836; padding-top:8px;">
                    ${videos.length > 0 ? `<span>🎬 ${videos.length} vidéo(s)</span>` : ""}
                    ${docs.length > 0 ? `<span>📄 ${docs.length} doc(s)</span>` : ""}
                </div>
            </div>
        `;
    }

    const fieldsToWatch = [
        "adminProductName", "adminProductCategory", "adminProductPrice", 
        "adminProductPromoPrice", "adminProductCurrency", "adminProductImage", 
        "adminProductVideo", "adminProductDocument", "adminProductDescription",
        "adminCommissionProduit", "adminCommissionAffiliation", "adminCommissionPlateforme"
    ];
    fieldsToWatch.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", updatePreview);
            el.addEventListener("change", updatePreview);
        }
    });

    const publishBtn = document.getElementById("adminAddProduct");
    if (publishBtn) {
        publishBtn.addEventListener("click", async () => {
            const nom = getValue("adminProductName");
            const categorie = getValue("adminProductCategory");
            const prix = getNumber("adminProductPrice", -1);
            
            const commVendeur = getNumber("adminCommissionProduit", 80);
            const commAffiliation = getNumber("adminCommissionAffiliation", 5);
            const commPlateforme = getNumber("adminCommissionPlateforme", 15);

            if (!nom) return alert("⚠️ Veuillez entrer le nom du produit.");
            if (!categorie) return alert("⚠️ Veuillez préciser la catégorie.");
            if (prix < 0) return alert("⚠️ Veuillez indiquer un prix valide.");

            if (Math.abs((commVendeur + commAffiliation + commPlateforme) - 100) > 0.01) {
                return alert("⚠️ Le total des commissions doit obligatoirement être égal à 100 %.");
            }

            publishBtn.disabled = true;
            publishBtn.textContent = "⏳ Enregistrement dans Realtime Database...";

            try {
                const newRef = push(ref(db, "publications"));
                const prodId = newRef.key;

                const images = getUrlArray("adminProductImage");
                const videos = getUrlArray("adminProductVideo");
                const docs = getUrlArray("adminProductDocument");

                const payload = {
                    id: prodId,
                    nom: nom,
                    titre: nom,
                    categorie: categorie,
                    prix: prix,
                    prixPromo: getValue("adminProductPromoPrice") ? getNumber("adminProductPromoPrice") : null,
                    devise: getValue("adminProductCurrency") || "FCFA",
                    image: images[0] || "",
                    video: videos[0] || "",
                    document: docs[0] || "",
                    images: images,
                    videos: videos,
                    documents: docs,
                    description: getValue("adminProductDescription"),
                    
                    // Structure double (Ife + objet) pour garantir la rétrocompatibilité
                    commissionVendeur: commVendeur,
                    commissionAffiliation: commAffiliation,
                    commissionPlateforme: commPlateforme,
                    commissions: {
                        vendeurPct: commVendeur,
                        affiliationPct: commAffiliation,
                        plateformePct: commPlateforme
                    },
                    
                    statut: "actif",
                    actif: true,
                    stock: 999,
                    createdBy: currentUser?.uid || "admin",
                    vendeurNom: currentUser?.displayName || "Admin / DAKPRO",
                    createdAt: serverTimestamp(),
                    datePublication: new Date().toLocaleDateString("fr-FR")
                };

                // ÉCRITURE ATOMIQUE ET SIMULTANÉE SOUS /publications ET /produits
                const updates = {};
                updates[`publications/${prodId}`] = payload;
                updates[`produits/${prodId}`] = payload;

                await update(ref(db), updates);

                alert("✅ PRODUIT PUBLIÉ ET ENREGISTRÉ AVEC SUCCÈS DANS LA BASE DE DONNÉES !");

                fieldsToWatch.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = "";
                });
                
                document.getElementById("adminCommissionProduit").value = "80";
                document.getElementById("adminCommissionAffiliation").value = "5";
                document.getElementById("adminCommissionPlateforme").value = "15";
                updateCommissionTotal();
                updatePreview();

            } catch (err) {
                console.error("Erreur de publication :", err);
                alert("❌ Erreur lors de l'enregistrement : " + err.message);
            } finally {
                publishBtn.disabled = false;
                publishBtn.textContent = "🚀 Publier sur la Plateforme";
            }
        });
    }
}
