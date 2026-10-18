import {
    getDatabase,
    ref,
    push,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

/* ============================================================
   DAKPRO ÉLITE — admin-publications.js
   MODULE DE PUBLICATION UNIFIÉ AVEC MULTI-COULEURS, MULTI-VARIANTES
   ET GESTION DES FLUX ANTI-DOUBLONS (PROMOS / FLASH / CATALOGUE)
============================================================ */

const CLOUDINARY_CLOUD_NAME = "iufene3y";
const CLOUDINARY_UPLOAD_PRESET = "dakproelite_preset";

/* Upload vers Cloudinary avec progression précise de 0% à 100% */
function uploadToCloudinaryWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "dakproelite");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, true);

    xhr.upload.onprogress = function(event) {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        if (onProgress) onProgress(percentComplete);
      }
    };

    xhr.onload = function() {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          if (onProgress) onProgress(100);
          resolve(data.secure_url);
        } else {
          console.warn("⚠️ Cloudinary a refusé l'upload, passage au mode secours local.");
          fallbackToBase64(file, resolve, reject, onProgress);
        }
      } catch (e) {
        fallbackToBase64(file, resolve, reject, onProgress);
      }
    };

    xhr.onerror = function() {
      console.warn("⚠️ Erreur réseau vers Cloudinary, passage au mode secours local.");
      fallbackToBase64(file, resolve, reject, onProgress);
    };

    xhr.send(formData);
  });
}

function fallbackToBase64(file, resolve, reject, onProgress) {
  const reader = new FileReader();
  reader.onprogress = function(event) {
    if (event.lengthComputable && onProgress) {
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    }
  };
  reader.onload = function(e) {
    if (onProgress) onProgress(100);
    resolve(e.target.result);
  };
  reader.onerror = function(err) {
    reject(new Error("Impossible de traiter le fichier localement."));
  };
  reader.readAsDataURL(file);
}

/* CATALOGUE GLOBAL UNIVERSEL */
const categoriesCatalogue = [
    { name: "Téléphones et tablettes", icon: "fa-mobile-screen-button", sub: ["Smartphones", "iPhone", "Samsung", "Tecno", "Infinix", "Xiaomi", "Huawei", "Téléphones classiques", "Téléphones reconditionnés", "Tablettes Android", "iPad", "Tablettes Windows", "Liseuses électroniques", "Coques et étuis", "Films de protection", "Chargeurs", "Câbles USB", "Batteries externes", "Batteries de téléphone", "Écouteurs", "Supports de téléphone", "Cartes mémoire", "Stylets", "Pièces détachées"] },
    { name: "Informatique et ordinateurs", icon: "fa-laptop", sub: ["Ordinateurs portables", "Ordinateurs de bureau", "PC tout-en-un", "Mini-PC", "PC gaming", "Serveurs", "Stations de travail", "Chromebooks", "Écrans", "Claviers", "Souris", "Imprimantes", "Scanners", "Photocopieurs", "Onduleurs", "Disques durs", "SSD", "Clés USB", "Cartes mémoire", "Cartes graphiques", "Cartes mères", "Processeurs", "Mémoire RAM", "Boîtiers PC", "Alimentations", "Refroidissement", "Routeurs Wi-Fi", "Modems", "Switches réseau", "Câbles informatiques", "Accessoires informatiques", "Pièces détachées"] },
    { name: "Télévision et électronique", icon: "fa-tv", sub: ["Téléviseurs LED", "Téléviseurs OLED", "Téléviseurs QLED", "Smart TV", "Téléviseurs 4K et 8K", "Décodeurs TV", "Antennes TV", "Projecteurs vidéo", "Écrans de projection", "Home cinéma", "Barres de son", "Haut-parleurs", "Enceintes Bluetooth", "Amplificateurs", "Radios", "Lecteurs DVD et Blu-ray", "Casques audio", "Écouteurs sans fil", "Microphones", "Tables de mixage", "Équipements de studio", "Lecteurs multimédias", "Câbles HDMI", "Télécommandes", "Karaoké"] },
    { name: "Caméras et sécurité", icon: "fa-camera", sub: ["Caméras de surveillance", "Caméras solaires", "Caméras IP", "Caméras de recul", "Caméras sportives (Action Cam)", "Drones de surveillance", "Kits de vidéosurveillance", "Enregistreurs NVR/DVR", "Alarmes de maison", "Interphones vidéo", "Sonnettes connectées", "Accessoires caméras"] },
    { name: "Automobile et véhicules", icon: "fa-car", sub: ["Voitures neuves", "Voitures d'occasion", "SUV", "Berlines", "Pick-up", "Véhicules utilitaires", "Minibus", "Camions", "Bus", "Véhicules électriques", "Voitures hybrides", "Motos à carburant", "Motos électriques", "Scooters", "Tricycles motorisés", "Quads", "Vélos", "Vélos électriques", "Trottinettes électriques", "Pièces automobiles", "Pneus", "Jantes", "Batteries auto/moto", "Huiles moteur", "Accessoires auto et moto", "Casques de moto"] },
    { name: "Maison et décoration", icon: "fa-house", sub: ["Meubles de salon", "Canapés", "Fauteuils", "Tables basses", "Meubles TV", "Étagères", "Bibliothèques", "Armoires", "Tables à manger", "Chaises", "Lits", "Matelas", "Oreillers", "Draps", "Couvertures", "Rideaux", "Tapis", "Décoration murale", "Tableaux", "Miroirs", "Horloges murales", "Lampes décoratives", "Plantes artificielles", "Vases", "Bougies décoratives", "Cadres photo", "Objets d'art", "Rangements", "Paniers", "Organisateurs"] },
    { name: "Cuisine et ustensiles", icon: "fa-kitchen-set", sub: ["Marmites", "Casseroles", "Poêles", "Cocottes-minute", "Friteuses", "Friteuses à air chaud", "Mixeurs", "Blenders", "Batteurs électriques", "Robots de cuisine", "Hachoirs", "Presse-agrumes", "Machines à café", "Bouilloires", "Grille-pain", "Fours", "Micro-ondes", "Cuiseurs à riz", "Plaques de cuisson", "Réchauds à gaz", "Réchauds électriques", "Couteaux de cuisine", "Planches à découper", "Assiettes", "Bols", "Verres", "Tasses", "Couverts", "Boîtes alimentaires", "Gourdes", "Thermos", "Moules à pâtisserie", "Matériel de restaurant"] },
    { name: "Électroménager", icon: "fa-blender", sub: ["Réfrigérateurs", "Congélateurs", "Réfrigérateurs combinés", "Machines à laver", "Sèche-linge", "Lave-vaisselle", "Fers à repasser", "Centrales vapeur", "Aspirateurs", "Aspirateurs robots", "Nettoyeurs vapeur", "Climatiseurs", "Ventilateurs", "Rafraîchisseurs d'air", "Chauffages électriques", "Déshumidificateurs", "Purificateurs d'air", "Machines à glaçons", "Distributeurs d'eau", "Fontaines à eau", "Chauffe-eau", "Extracteurs d'air", "Pièces détachées"] },
    { name: "Mode homme", icon: "fa-person", sub: ["T-shirts", "Chemises", "Polos", "Pantalons", "Jeans", "Shorts", "Costumes", "Vestes", "Blousons", "Manteaux", "Pulls", "Sweats", "Survêtements", "Boubous", "Vêtements traditionnels", "Sous-vêtements", "Chaussettes", "Pyjamas", "Vêtements de nuit", "Vêtements de travail", "Tenues de cérémonie", "Vêtements de plage"] },
    { name: "Mode femme", icon: "fa-person-dress", sub: ["Robes", "Jupes", "Chemisiers", "T-shirts", "Tops", "Jeans", "Pantalons", "Shorts", "Combinaisons", "Ensembles", "Vestes", "Manteaux", "Pulls", "Sweats", "Pagnes", "Tissus imprimés", "Tenues africaines", "Tenues de cérémonie", "Vêtements de grossesse", "Lingerie", "Pyjamas", "Vêtements de plage", "Vêtements de sport"] },
    { name: "Chaussures", icon: "fa-shoe-prints", sub: ["Chaussures homme", "Chaussures femme", "Chaussures enfant", "Chaussures de sport", "Baskets", "Chaussures de ville", "Chaussures de cérémonie", "Chaussures de sécurité", "Chaussures de travail", "Sandales", "Claquettes", "Tongs", "Bottes", "Bottines", "Mocassins", "Escarpins", "Chaussures traditionnelles", "Chaussures de randonnée", "Chaussons"] },
    { name: "Sacs et bagages", icon: "fa-bag-shopping", sub: ["Sacs à main", "Sacs à dos", "Sacs scolaires", "Sacs professionnels", "Sacs pour ordinateurs", "Sacs de voyage", "Valises", "Sacs de sport", "Sacs de randonnée", "Sacs à langer", "Portefeuilles", "Porte-cartes", "Porte-monnaie", "Trousses", "Sacs de rangement", "Accessoires de voyage"] },
    { name: "Accessoires divers", icon: "fa-puzzle-piece", sub: ["Accessoires de mode", "Accessoires électroniques", "Accessoires auto-moto", "Accessoires de téléphone", "Bijoux", "Montres", "Lunettes", "Ceintures", "Porte-clés", "Gadgets innovants"] },
    { name: "Santé et bien-être", icon: "fa-heart-pulse", sub: ["Thermomètres", "Tensiomètres", "Oxymètres", "Pèse-personnes", "Balances de précision", "Premiers secours", "Pansements", "Compresses", "Gants médicaux", "Masques médicaux", "Fauteuils roulants", "Cannes de marche", "Déambulateurs", "Matériel de rééducation", "Équipements de massage", "Appareils de bien-être", "Matériel médical professionnel", "Produits d'hygiène", "Équipements de protection médicale"] },
    { name: "Électricité et énergie solaire", icon: "fa-solar-panel", sub: ["Panneaux solaires", "Kits solaires", "Batteries solaires", "Onduleurs solaires", "Régulateurs de charge", "Centrales électriques portables", "Générateurs électriques", "Groupes électrogènes", "Lampes solaires", "Lampadaires solaires", "Éclairage LED", "Ampoules", "Projecteurs LED", "Multiprises", "Rallonges", "Câbles électriques", "Matériel électrique"] },
    { name: "Bricolage et construction", icon: "fa-screwdriver-wrench", sub: ["Perceuses", "Visseuses", "Meuleuses", "Scies", "Marteaux", "Tournevis", "Pinces", "Postes à souder", "Compresseurs", "Échelles", "Matériel de plomberie", "Matériaux de construction", "Peintures", "Quincaillerie", "Outillage professionnel"] },
    { name: "Supermarché et alimentation", icon: "fa-basket-shopping", sub: ["Riz", "Pâtes", "Farine", "Huiles", "Sucre", "Conserves", "Lait", "Café", "Thé", "Boissons", "Jus de fruits", "Épices", "Condiments", "Produits locaux", "Alimentation générale"] },
    { name: "Cours et formations", icon: "fa-graduation-cap", sub: ["Informatique", "Programmation", "Développement web", "Marketing digital", "Commerce électronique", "Entrepreneuriat", "Comptabilité", "Langues", "Agriculture", "Couture", "Coiffure", "Esthétique", "Cuisine", "Musique", "Formation professionnelle"] },
    { name: "Services professionnels", icon: "fa-briefcase", sub: ["Réparation", "Installation solaire", "Électricité", "Plomberie", "Menuiserie", "Soudure", "Couture", "Coiffure", "Photographie", "Graphisme", "Développement web", "Marketing", "Livraison", "Déménagement", "Nettoyage"] }
];

const presetTaillesVetements = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "Standard / Unique"];
const presetPointuresChaussures = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"];

let selectedSizesArray = [];
let variantsArray = [];

export async function init() {
    const container = document.getElementById("module-container");
    if (!container) return;

    const db = getDatabase();
    const currentUser = window.currentUser || null;

    container.innerHTML = `
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
        <style>
            * { box-sizing: border-box; }
            .pub-container { width: 100%; color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 15px; border-radius: 12px; }
            .pub-title { color: #ffcc00; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; border-left: 4px solid #ffcc00; padding-left: 10px; }
            .pub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
            .pub-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, .5); }
            .pub-card-title { font-size: 14px; font-weight: 900; color: #ffcc00; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #282836; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
            
            .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; }
            .form-group label { font-size: 11px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
            .form-group label i { color: #ffcc00; }
            .form-group input, .form-group select, .form-group textarea { width: 100%; background: #0d0d11; border: 1px solid #282836; color: #ffcc00; padding: 10px 12px; border-radius: 6px; font-size: 13px; outline: none; }
            .form-group textarea { resize: vertical; min-height: 90px; }

            .price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            
            .checkbox-group { display: flex; gap: 15px; margin-bottom: 15px; background: #0a0c10; padding: 10px; border-radius: 8px; border: 1px solid #282836; }
            .checkbox-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #ffcc00; font-weight: 700; cursor: pointer; }
            .checkbox-item input { width: auto; cursor: pointer; }

            .size-box { background: #0a0c10; border: 1px dashed #282836; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
            .size-title { font-size: 11px; font-weight: 800; color: #ffcc00; margin-bottom: 8px; text-transform: uppercase; }
            .size-chips-wrapper { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; max-height: 120px; overflow-y: auto; }
            .size-chip { padding: 5px 10px; background: #181824; border: 1px solid #333; border-radius: 6px; font-size: 11px; color: #ddd; cursor: pointer; user-select: none; transition: .15s; }
            .size-chip.active { background: #ffcc00; color: #000; font-weight: 800; border-color: #ffcc00; }

            .variant-box { background: #0a0c10; border: 1px dashed #ffcc00; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
            .variant-title { font-size: 11px; font-weight: 800; color: #ffcc00; margin-bottom: 10px; text-transform: uppercase; }
            .variant-input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
            .btn-add-variant { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; font-weight: 800; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 11px; text-transform: uppercase; width: 100%; margin-top: 4px; }
            .variant-list { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
            .variant-item { display: flex; align-items: center; justify-content: space-between; background: #13131a; padding: 8px 12px; border-radius: 6px; border: 1px solid #282836; font-size: 11px; }
            .variant-item img { width: 32px; height: 32px; object-fit: cover; border-radius: 4px; border: 1px solid #ffcc00; }
            .btn-remove-variant { color: #ef4444; cursor: pointer; background: transparent; border: none; font-size: 14px; font-weight: 900; }

            .commission-box { background: #0d0d11; border: 1px solid #ffcc00; border-radius: 8px; padding: 12px; margin-top: 10px; }
            .commission-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
            .commission-input input { width: 100%; background: #050505; border: 1px solid #333; color: #ffcc00; padding: 8px; border-radius: 6px; text-align: center; font-weight: 800; }
            
            .btn-pub-action { background: linear-gradient(135deg, #ffcc00, #e6b800); color: #000; font-weight: 900; border: none; padding: 14px 25px; border-radius: 8px; cursor: pointer; transition: .2s; text-transform: uppercase; font-size: 13px; width: 100%; margin-top: 15px; }
            
            .preview-box { min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0d0d11; border: 1px dashed #282836; border-radius: 8px; padding: 15px; gap: 8px; }
            .preview-canvas { width: 100%; max-width: 300px; height: 180px; object-fit: cover; border-radius: 7px; background: #080b10; border: 1px solid #ffcc00; display: none; }
            .preview-video { width: 100%; max-width: 300px; height: 180px; object-fit: cover; border-radius: 7px; background: #000; border: 1px solid #ffcc00; display: none; }
            
            .status-box { margin-bottom: 15px; padding: 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: #050505; border: 1px solid #282836; color: #ffcc00; text-align: center; }
        </style>

        <div class="pub-container">
            <div class="pub-title">📦 Publication Universelle DAKPROÉLITE</div>
            <div id="adminPublicationStatus" class="status-box">Prêt pour la publication</div>

            <div class="pub-grid">
                <div class="pub-card">
                    <div class="pub-card-title">📝 Informations de l'Article / Produit</div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-user"></i> Nom du Vendeur / Boutique</label>
                        <input type="text" id="adminVendeurNom" placeholder="Ex: Boutique Officielle">
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-heading"></i> Nom de l'Article (Français)</label>
                        <input type="text" id="adminProductName" placeholder="Ex : Moto Électrique / Caméra Solaire...">
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-language"></i> Nom de l'Article (Anglais - Optionnel)</label>
                        <input type="text" id="adminProductNameEn" placeholder="Ex : Electric Motorcycle">
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-magnifying-glass"></i> Catégorie Principale (${categoriesCatalogue.length} Univers)</label>
                        <input type="text" id="categorySearchInput" placeholder="Rechercher une catégorie..." style="margin-bottom:6px;">
                        <select id="adminProductCategory" size="5" style="height: 120px;"></select>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-tags"></i> Sous-catégorie Spécifique</label>
                        <input type="text" id="subCategorySearchInput" placeholder="Rechercher une sous-catégorie..." style="margin-bottom:6px;" disabled>
                        <select id="adminProductSubCategory" size="4" style="height: 100px;">
                            <option value="">-- Choisissez d'abord une catégorie --</option>
                        </select>
                    </div>

                    <div class="price-grid">
                        <div class="form-group">
                            <label><i class="fa-solid fa-money-bill"></i> Prix Principal</label>
                            <input type="number" id="adminProductPrice" placeholder="250000" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label><i class="fa-solid fa-tag"></i> Prix Promo (Optionnel)</label>
                            <input type="number" id="adminProductPromoPrice" placeholder="220000" min="0" step="0.01">
                        </div>
                    </div>

                    <!-- OPTIONS D'AFFICHAGE EXCLUSIF POUR ÉVITER LES DOUBLONS SUR ACCUEIL -->
                    <div class="checkbox-group">
                        <label class="checkbox-item">
                            <input type="checkbox" id="isFlashCheck"> 🔥 Offre Flash
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="isRecommandeCheck"> ⭐ Recommandé / Sponsorisé
                        </label>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-coins"></i> Devise</label>
                        <select id="adminProductCurrency">
                            <option value="FCFA">FCFA — Franc CFA (XOF/XAF)</option>
                            <option value="EUR">EUR — Euro (€)</option>
                            <option value="USD">USD — Dollar ($)</option>
                            <option value="NGN">NGN — Naira Nigérian (₦)</option>
                            <option value="CNY">CNY — Yuan Chinois (¥)</option>
                        </select>
                    </div>

                    <div class="size-box">
                        <div class="size-title">📏 Tailles, Pointures ou Options disponibles</div>
                        <div class="size-chips-wrapper" id="sizePresetContainer"></div>
                        <input type="text" id="customSizeInput" placeholder="Option sur-mesure (ex: 2000W)...">
                    </div>

                    <!-- GESTION VARIANTES MULTI-COULEURS -->
                    <div class="variant-box">
                        <div class="variant-title">🎨 Variantes / Couleurs / Modèles (Photo par couleur)</div>
                        <div class="variant-input-grid">
                            <input type="text" id="variantColorName" placeholder="Couleur/Modèle (ex: Rouge, Noir)">
                            <input type="number" id="variantColorPrice" placeholder="Prix spécifique">
                        </div>
                        <div class="variant-input-grid">
                            <input type="text" id="variantColorSize" placeholder="Option liée (ex: XL)">
                            <input type="number" id="variantColorStock" placeholder="Stock">
                        </div>
                        <div class="form-group" style="margin-bottom: 6px;">
                            <label>Photo de cette couleur/variante</label>
                            <input type="file" id="variantColorFile" accept="image/*">
                        </div>
                        <button type="button" id="btnAddVariant" class="btn-add-variant">+ Ajouter cette variante couleur</button>
                        <div id="variantList" class="variant-list"></div>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-folder-open"></i> Photo Principale / Vidéo</label>
                        <input type="file" id="adminUniversalFile" accept="image/*,video/*">
                        <small style="color: #ffcc00; font-size: 10px; margin-top: 4px;">Upload instantané avec suivi de progression 0% - 100%</small>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-align-left"></i> Description (Français)</label>
                        <textarea id="adminProductDescription" placeholder="Description complète..."></textarea>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-globe"></i> Description (Anglais)</label>
                        <textarea id="adminProductDescriptionEn" placeholder="Full description in English..."></textarea>
                    </div>

                    <div class="commission-box">
                        <div class="commission-title">💰 Commissions Réparties</div>
                        <div class="commission-grid">
                            <div class="commission-input">
                                <label>Vendeur (%)</label>
                                <input type="number" id="adminCommissionProduit" value="80" min="0" max="100" style="color:#22c55e;">
                            </div>
                            <div class="commission-input">
                                <label>Affiliation (%)</label>
                                <input type="number" id="adminCommissionAffiliation" value="5" min="0" max="100" style="color:#ffcc00;">
                            </div>
                            <div class="commission-input">
                                <label>Plateforme (%)</label>
                                <input type="number" id="adminCommissionPlateforme" value="15" min="0" max="100" style="color:#3b82f6;">
                            </div>
                        </div>
                    </div>

                    <button type="button" id="adminAddProduct" class="btn-pub-action">🚀 Publier l'Article</button>
                </div>

                <div class="pub-card">
                    <div class="pub-card-title">👁️ Aperçu du Média</div>
                    <div id="adminPreviewBox" class="preview-box">
                        <canvas id="imageCanvas" class="preview-canvas"></canvas>
                        <video id="videoPreview" class="preview-video" controls playsinline></video>
                        <span id="previewText" style="color:#666; font-size:12px;">Sélectionnez un fichier...</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const sizePresetContainer = document.getElementById("sizePresetContainer");
    const allPresets = [...presetTaillesVetements, ...presetPointuresChaussures, "Standard", "1000W", "2000W", "3000W", "4K Ultra HD", "16Go", "32Go", "64Go", "128Go"];
    sizePresetContainer.innerHTML = allPresets.map(size => `<span class="size-chip" data-size="${size}">${size}</span>`).join("");

    sizePresetContainer.querySelectorAll(".size-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            chip.classList.toggle("active");
            const sz = chip.dataset.size;
            if (chip.classList.contains("active")) {
                if (!selectedSizesArray.includes(sz)) selectedSizesArray.push(sz);
            } else {
                selectedSizesArray = selectedSizesArray.filter(item => item !== sz);
            }
        });
    });

    const btnAddVariant = document.getElementById("btnAddVariant");
    const variantList = document.getElementById("variantList");
    const statusBox = document.getElementById("adminPublicationStatus");

    btnAddVariant.addEventListener("click", async () => {
        const colorName = document.getElementById("variantColorName").value.trim();
        const colorPrice = document.getElementById("variantColorPrice").value.trim();
        const colorSize = document.getElementById("variantColorSize").value.trim();
        const colorStock = document.getElementById("variantColorStock").value.trim();
        const colorFile = document.getElementById("variantColorFile").files[0];

        if (!colorName) return alert("⚠️ Indiquez au moins le nom de la variante couleur.");

        let uploadedVarUrl = "";
        if (colorFile) {
            btnAddVariant.disabled = true;
            try {
                uploadedVarUrl = await uploadToCloudinaryWithProgress(colorFile, (percent) => {
                    btnAddVariant.textContent = `⏳ Envoi variante couleur : ${percent}%`;
                });
            } catch (err) {
                console.warn(err);
            } finally {
                btnAddVariant.disabled = false;
                btnAddVariant.textContent = "+ Ajouter cette variante couleur";
            }
        }

        variantsArray.push({
            couleur: colorName,
            prix: colorPrice ? parseFloat(colorPrice) : null,
            taille: colorSize || null,
            stock: colorStock ? parseInt(colorStock, 10) : 10,
            image: uploadedVarUrl
        });

        renderVariantList();
        document.getElementById("variantColorName").value = "";
        document.getElementById("variantColorPrice").value = "";
        document.getElementById("variantColorSize").value = "";
        document.getElementById("variantColorStock").value = "";
        document.getElementById("variantColorFile").value = "";
    });

    function renderVariantList() {
        variantList.innerHTML = variantsArray.map((item, index) => `
            <div class="variant-item">
                <div style="display:flex; align-items:center; gap:10px;">
                    ${item.image ? `<img src="${item.image}">` : '🎨'}
                    <div>
                        <strong>${item.couleur}</strong> 
                        ${item.taille ? `<span style="color:#a1a1aa;"> | Option: ${item.taille}</span>` : ''}
                        ${item.prix ? `<span style="color:#22c55e;"> | ${item.prix} FCFA</span>` : ''}
                    </div>
                </div>
                <button type="button" class="btn-remove-variant" onclick="window.removeVariant(${index})">✕</button>
            </div>
        `).join("");
    }

    window.removeVariant = function(index) {
        variantsArray.splice(index, 1);
        renderVariantList();
    };

    const catSelect = document.getElementById("adminProductCategory");
    const subCatSelect = document.getElementById("adminProductSubCategory");
    const categorySearchInput = document.getElementById("categorySearchInput");
    const subCategorySearchInput = document.getElementById("subCategorySearchInput");
    let currentSubList = [];

    function renderCategories(filter = "") {
        catSelect.innerHTML = '<option value="">-- Choisissez une catégorie --</option>';
        const q = filter.toLowerCase();
        categoriesCatalogue.forEach(cat => {
            if (cat.name.toLowerCase().includes(q)) {
                const opt = document.createElement("option");
                opt.value = cat.name;
                opt.textContent = `📁 ${cat.name}`;
                catSelect.appendChild(opt);
            }
        });
    }

    renderCategories();

    categorySearchInput.addEventListener("input", (e) => {
        renderCategories(e.target.value);
    });

    catSelect.addEventListener("change", () => {
        const found = categoriesCatalogue.find(c => c.name === catSelect.value);
        if (found && found.sub) {
            currentSubList = found.sub;
            subCategorySearchInput.disabled = false;
            renderSubCategories();
        } else {
            subCategorySearchInput.disabled = true;
            subCatSelect.innerHTML = '<option value="">-- Choisissez d\'abord une catégorie --</option>';
        }
    });

    function renderSubCategories(filter = "") {
        subCatSelect.innerHTML = '<option value="">-- Choisissez une sous-catégorie --</option>';
        const q = filter.toLowerCase();
        currentSubList.forEach(s => {
            if (s.toLowerCase().includes(q)) {
                const opt = document.createElement("option");
                opt.value = s;
                opt.textContent = `🏷️ ${s}`;
                subCatSelect.appendChild(opt);
            }
        });
    }

    subCategorySearchInput.addEventListener("input", (e) => {
        renderSubCategories(e.target.value);
    });

    const universalFileInput = document.getElementById("adminUniversalFile");
    const canvas = document.getElementById("imageCanvas");
    const videoPreview = document.getElementById("videoPreview");
    const previewText = document.getElementById("previewText");

    universalFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        canvas.style.display = "none";
        videoPreview.style.display = "none";
        previewText.style.display = "none";

        const tempUrl = URL.createObjectURL(file);
        if (file.type.startsWith("image/")) {
            const img = new Image();
            img.onload = function() {
                const ctx = canvas.getContext("2d");
                canvas.width = 600;
                canvas.height = 400;
                ctx.fillStyle = "#080b10";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                let ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
                ctx.drawImage(img, 0, 0, img.width, img.height, (canvas.width - img.width * ratio) / 2, (canvas.height - img.height * ratio) / 2, img.width * ratio, img.height * ratio);
                canvas.style.display = "block";
            };
            img.src = tempUrl;
        } else if (file.type.startsWith("video/")) {
            videoPreview.src = tempUrl;
            videoPreview.style.display = "block";
        }
    });

    const publishBtn = document.getElementById("adminAddProduct");
    publishBtn.addEventListener("click", async () => {
        const nom = document.getElementById("adminProductName").value.trim();
        const nomEn = document.getElementById("adminProductNameEn").value.trim();
        const vendeurNom = document.getElementById("adminVendeurNom").value.trim() || "Boutique Officielle DAKPRO";
        const categorie = catSelect.value;
        const sousCategorie = subCatSelect.value;
        const prix = parseFloat(document.getElementById("adminProductPrice").value);
        const customSize = document.getElementById("customSizeInput").value.trim();

        const isFlash = document.getElementById("isFlashCheck").checked;
        const isRecommande = document.getElementById("isRecommandeCheck").checked;

        if (customSize && !selectedSizesArray.includes(customSize)) {
            selectedSizesArray.push(customSize);
        }

        if (!nom || !categorie || isNaN(prix) || prix < 0) {
            return alert("⚠️ Veuillez remplir le nom, choisir une catégorie et indiquer un prix valide.");
        }

        publishBtn.disabled = true;

        try {
            let mainImageUrl = "";
            let mainVideoUrl = "";
            const universalFile = universalFileInput.files[0];

            if (universalFile) {
                const uploadedUrl = await uploadToCloudinaryWithProgress(universalFile, (percent) => {
                    publishBtn.textContent = `⏳ TELEVERSEMENT : ${percent}%`;
                    statusBox.textContent = `⏳ Envoi du média vers Cloudinary : ${percent}%`;
                });

                if (universalFile.type.startsWith("video/")) {
                    mainVideoUrl = uploadedUrl;
                } else {
                    mainImageUrl = uploadedUrl;
                }
            }

            publishBtn.textContent = "⚡ PUBLICATION EN COURS (100%)...";
            statusBox.textContent = "⚡ Enregistrement instantané dans la base de données...";

            const newRef = push(ref(db, "publications"));
            const prodId = newRef.key;
            const vendeurUid = currentUser?.uid || "admin_dakpro_id";

            const payload = {
                id: prodId,
                nom: nom,
                nom_en: nomEn || nom,
                titre: nom,
                vendeurNom: vendeurNom,
                vendeurId: vendeurUid,
                categorie: categorie,
                sousCategorie: sousCategorie || "",
                prix: prix,
                prixPromo: document.getElementById("adminProductPromoPrice").value ? parseFloat(document.getElementById("adminProductPromoPrice").value) : null,
                devise: document.getElementById("adminProductCurrency").value || "FCFA",
                taillesDisponibles: selectedSizesArray,
                variantes: variantsArray,
                image: mainImageUrl || (variantsArray[0]?.image || "https://i.postimg.cc/WpSc29mX/file-00000000ca8872438c17222eb828bc0c.png"),
                video: mainVideoUrl,
                description: document.getElementById("adminProductDescription").value.trim(),
                description_en: document.getElementById("adminProductDescriptionEn").value.trim(),
                isFlash: isFlash,
                isRecommande: isRecommande,
                commissions: {
                    vendeur: parseFloat(document.getElementById("adminCommissionProduit").value) || 80,
                    affiliation: parseFloat(document.getElementById("adminCommissionAffiliation").value) || 5,
                    plateforme: parseFloat(document.getElementById("adminCommissionPlateforme").value) || 15
                },
                actif: true,
                createdBy: vendeurUid,
                createdAt: serverTimestamp(),
                datePublication: new Date().toLocaleDateString("fr-FR")
            };

            await set(ref(db, `publications/${prodId}`), payload);
            await set(ref(db, `produits/${prodId}`), payload);

            statusBox.textContent = "✅ PUBLICATION RÉUSSIE À 100% !";
            alert("✅ ARTICLE PUBLIÉ AVEC SUCCÈS SUR DAKPROÉLITE !");
            location.reload();
        } catch (err) {
            console.error(err);
            alert("❌ Erreur de publication : " + err.message);
            statusBox.textContent = "❌ Erreur de publication rencontrée.";
        } finally {
            publishBtn.disabled = false;
            publishBtn.textContent = "🚀 Publier l'Article";
        }
    });
}
