import {
    getDatabase,
    ref,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

/* ============================================================
   MODULE ADMINISTRATEUR : GESTION CATALOGUE & ANALYTICS PRODUITS
   Fichier : admin-produits.js
============================================================ */

export async function init() {
    const container = document.getElementById('module-container');
    if (!container) return;

    const db = getDatabase();

    // 1. Structure HTML & Style CSS
    container.innerHTML = `
        <style>
            .prd-container { color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 20px; border-radius: 12px; }
            .prd-title { color: #ffcc00; font-size: 20px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.5px; border-left: 4px solid #ffcc00; padding-left: 10px; }
            
            /* KPIs & ANALYTICS */
            .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px; }
            .kpi-card { background: #13131a; border: 1px solid #282836; border-radius: 10px; padding: 15px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
            .kpi-card-highlight { border-color: #ffcc00; box-shadow: 0 0 12px rgba(255, 204, 0, 0.15); }
            .kpi-val { font-size: 24px; font-weight: 900; color: #ffcc00; margin-top: 5px; }
            .kpi-lbl { font-size: 11px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

            /* CONTROLES, FILTRES & ACTIONS GLOBALES */
            .prd-header { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; background: #13131a; padding: 15px; border-radius: 10px; border: 1px solid #282836; }
            .prd-controls { display: flex; gap: 10px; flex-wrap: wrap; width: 100%; justify-content: space-between; align-items: center; }
            .prd-input, .prd-select, .prd-textarea { background: #0d0d11; border: 1px solid #282836; color: #fff; padding: 10px 14px; border-radius: 6px; font-size: 13px; outline: none; }
            .prd-input:focus, .prd-select:focus, .prd-textarea:focus { border-color: #ffcc00; }

            .prd-bulk-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid #282836; }
            .prd-cat-tools { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

            .btn-danger-all { background: #b91c1c; color: #fff; border: 1px solid #f87171; padding: 9px 14px; border-radius: 6px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s ease; }
            .btn-danger-all:hover { background: #dc2626; }
            .btn-cat-del { background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid #f59e0b; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; }
            .btn-cat-del:hover { background: #f59e0b; color: #000; }
            
            /* TABLEAU DU CATALOGUE */
            .prd-table-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 15px; overflow-x: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
            table.prd-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
            table.prd-table th { background: #0d0d11; color: #ffcc00; padding: 12px 10px; font-weight: 800; border-bottom: 2px solid #282836; text-transform: uppercase; font-size: 11px; }
            table.prd-table td { padding: 12px 10px; border-bottom: 1px solid #1c1c26; vertical-align: middle; color: #f5f5f7; }
            table.prd-table tr:hover { background: rgba(255, 204, 0, 0.02); }
            
            .prd-thumb { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; background: #20202c; border: 1px solid #282836; }
            .cat-pill { display: inline-block; background: #1e1b2e; color: #fde047; border: 1px solid #4b4470; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
            .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; display: inline-block; }
            .status-actif { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }
            .status-masque { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
            .status-rupture { background: rgba(255, 204, 0, 0.2); color: #ffcc00; border: 1px solid #ffcc00; }
            
            .btn-act { padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; margin-right: 4px; margin-bottom: 4px; transition: all 0.2s ease; }
            .btn-act:hover { opacity: 0.85; transform: translateY(-1px); }
            .btn-edit { background: #eab308; color: #000; }
            .btn-toggle { background: #3b82f6; color: #fff; }
            .btn-del-pub { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid #a855f7; }
            .btn-del-pub:hover { background: #9333ea; color: #fff; }
            .btn-del { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
            .btn-del:hover { background: #ef4444; color: #fff; }

            /* MODALE D'ÉDITION DIRECTE */
            .prd-modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); z-index: 99999; align-items: center; justify-content: center; padding: 15px; }
            .prd-modal-backdrop.open { display: flex; }
            .prd-modal-card { background: #13131a; border: 1px solid #ffcc00; border-radius: 12px; width: 100%; max-width: 520px; padding: 20px; max-height: 90vh; overflow-y: auto; }
            .prd-modal-title { font-size: 16px; font-weight: 900; color: #ffcc00; margin-bottom: 14px; }
            .prd-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
            .prd-field label { font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; }
            .prd-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px; }
            .btn-save-edit { background: #16a34a; color: #fff; border: none; padding: 9px 16px; border-radius: 6px; font-weight: 800; cursor: pointer; }
            .btn-cancel-edit { background: #27272a; color: #f5f5f7; border: 1px solid #3f3f46; padding: 9px 14px; border-radius: 6px; font-weight: 700; cursor: pointer; }
        </style>

        <div class="prd-container">
            <div class="prd-title">📦 Inventaire & Performance du Catalogue (Temps Réel)</div>

            <!-- DASHBOARD ANALYTIQUE -->
            <div class="kpi-grid">
                <div class="kpi-card kpi-card-highlight">
                    <div class="kpi-lbl">Total Produits Publiés</div>
                    <div class="kpi-val" id="stat-total-published">0</div>
                </div>
                <div class="kpi-card kpi-card-highlight">
                    <div class="kpi-lbl">Total Unités Vendues</div>
                    <div class="kpi-val" id="stat-total-sold" style="color: #10b981;">0</div>
                </div>
                <div class="kpi-card kpi-card-highlight">
                    <div class="kpi-lbl">Produits en Rupture</div>
                    <div class="kpi-val" id="stat-out-stock" style="color: #ff5252;">0</div>
                </div>
                <div class="kpi-card kpi-card-highlight">
                    <div class="kpi-lbl">Produits Masqués / Inactifs</div>
                    <div class="kpi-val" id="stat-hidden-prods" style="color: #a1a1aa;">0</div>
                </div>
            </div>

            <!-- RECHERCHE, CATÉGORIES, FILTRES & SUPPRESSION GLOBALE -->
            <div class="prd-header">
                <div class="prd-controls">
                    <input type="text" id="prd-search" class="prd-input" style="flex: 1; min-width: 200px;" placeholder="🔍 Rechercher par nom, description, catégorie ou ID...">
                    <select id="prd-category-filter" class="prd-select">
                        <option value="all">Toutes les catégories</option>
                    </select>
                    <select id="prd-status-filter" class="prd-select">
                        <option value="all">Tous les statuts</option>
                        <option value="actif">En vente (Actifs)</option>
                        <option value="rupture">En rupture de stock</option>
                        <option value="masque">Masqués / Inactifs</option>
                    </select>
                </div>

                <div class="prd-bulk-bar">
                    <div class="prd-cat-tools">
                        <select id="prd-category-manage-select" class="prd-select">
                            <option value="">-- Choisir une catégorie --</option>
                        </select>
                        <button type="button" id="prd-delete-category-btn" class="btn-cat-del">🏷️ Supprimer la catégorie sélectionnée</button>
                    </div>
                    <button type="button" id="prd-delete-all-produits-btn" class="btn-danger-all">🗑️ Effacer TOUT le dossier /produits</button>
                </div>
            </div>

            <!-- TABLEAU DU CATALOGUE -->
            <div class="prd-table-card">
                <table class="prd-table">
                    <thead>
                        <tr>
                            <th>Aperçu</th>
                            <th>Produit</th>
                            <th>Catégorie</th>
                            <th>Prix</th>
                            <th>Vendeur / Boutique</th>
                            <th>Stock</th>
                            <th>Vendus</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="prd-list-body">
                        <tr>
                            <td colspan="9" style="text-align: center; color: #ffcc00; padding: 20px;">Chargement en temps réel du catalogue...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- MODALE DE MODIFICATION DIRECTE -->
        <div class="prd-modal-backdrop" id="prd-edit-modal">
            <div class="prd-modal-card">
                <div class="prd-modal-title">✏️ Modifier le Produit dans Firebase</div>
                <input type="hidden" id="prd-edit-id">

                <div class="prd-field">
                    <label>Nom du produit</label>
                    <input type="text" id="prd-edit-nom" class="prd-input">
                </div>

                <div class="prd-field">
                    <label>Catégorie</label>
                    <input type="text" id="prd-edit-categorie" class="prd-input" list="prd-edit-cat-datalist">
                    <datalist id="prd-edit-cat-datalist"></datalist>
                </div>

                <div class="prd-field">
                    <label>Prix (FCFA)</label>
                    <input type="number" id="prd-edit-prix" class="prd-input" step="0.01">
                </div>

                <div class="prd-field">
                    <label>Prix Promo (Optionnel)</label>
                    <input type="number" id="prd-edit-promo" class="prd-input" step="0.01">
                </div>

                <div class="prd-field">
                    <label>Stock</label>
                    <input type="number" id="prd-edit-stock" class="prd-input">
                </div>

                <div class="prd-field">
                    <label>Description</label>
                    <textarea id="prd-edit-description" class="prd-textarea" rows="4"></textarea>
                </div>

                <div class="prd-modal-actions">
                    <button type="button" id="prd-cancel-edit" class="btn-cancel-edit">Annuler</button>
                    <button type="button" id="prd-save-edit" class="btn-save-edit">💾 Enregistrer dans la base</button>
                </div>
            </div>
        </div>
    `;

    const listBody = document.getElementById('prd-list-body');
    const searchInput = document.getElementById('prd-search');
    const categoryFilter = document.getElementById('prd-category-filter');
    const categoryManageSelect = document.getElementById('prd-category-manage-select');
    const statusFilter = document.getElementById('prd-status-filter');
    const deleteCategoryBtn = document.getElementById('prd-delete-category-btn');
    const deleteAllProduitsBtn = document.getElementById('prd-delete-all-produits-btn');

    const editModal = document.getElementById('prd-edit-modal');
    const editIdInput = document.getElementById('prd-edit-id');
    const editNomInput = document.getElementById('prd-edit-nom');
    const editCatInput = document.getElementById('prd-edit-categorie');
    const editCatDatalist = document.getElementById('prd-edit-cat-datalist');
    const editPrixInput = document.getElementById('prd-edit-prix');
    const editPromoInput = document.getElementById('prd-edit-promo');
    const editStockInput = document.getElementById('prd-edit-stock');
    const editDescInput = document.getElementById('prd-edit-description');
    const cancelEditBtn = document.getElementById('prd-cancel-edit');
    const saveEditBtn = document.getElementById('prd-save-edit');

    let productsData = {};
    let publicationsData = {};
    let allProductsData = {};

    function getItemCategory(item) {
        return String(item.categorie || item.sousCategorie || item.categoryName || item.category || 'Général').trim() || 'Général';
    }

    function syncCategorySelectors(data) {
        const categoriesSet = new Set();
        Object.values(data).forEach(item => {
            categoriesSet.add(getItemCategory(item));
        });
        const sortedCats = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, 'fr'));

        const currentFilterVal = categoryFilter.value;
        categoryFilter.innerHTML = `<option value="all">Toutes les catégories (${sortedCats.length})</option>` +
            sortedCats.map(cat => `<option value="${escapeAttr(cat)}">${escapeHtml(cat)}</option>`).join('');
        if ([...categoryFilter.options].some(o => o.value === currentFilterVal)) {
            categoryFilter.value = currentFilterVal;
        }

        const currentManageVal = categoryManageSelect.value;
        categoryManageSelect.innerHTML = `<option value="">-- Choisir une catégorie --</option>` +
            sortedCats.map(cat => `<option value="${escapeAttr(cat)}">${escapeHtml(cat)}</option>`).join('');
        if ([...categoryManageSelect.options].some(o => o.value === currentManageVal)) {
            categoryManageSelect.value = currentManageVal;
        }

        if (editCatDatalist) {
            editCatDatalist.innerHTML = sortedCats.map(cat => `<option value="${escapeAttr(cat)}"></option>`).join('');
        }
    }

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escapeAttr(str) {
        return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    const mergeData = () => {
        allProductsData = { ...publicationsData, ...productsData };
        syncCategorySelectors(allProductsData);
        updateStatistics(allProductsData);
        renderProducts();
    };

    // Écoute Realtime sur /produits
    onValue(ref(db, 'produits'), (snapshot) => {
        productsData = snapshot.exists() ? snapshot.val() : {};
        mergeData();
    });

    // Écoute Realtime sur /publications
    onValue(ref(db, 'publications'), (snapshot) => {
        publicationsData = snapshot.exists() ? snapshot.val() : {};
        mergeData();
    });

    // Fonction d'évaluation standardisée du statut effectif
    function getEffectiveStatus(item) {
        const rawStatus = String(item.statut || '').toLowerCase();
        const stock = item.stock !== undefined && item.stock !== null ? parseInt(item.stock, 10) : null;
        const isInactive = rawStatus === 'masque' || rawStatus === 'inactif' || item.actif === false;

        if (isInactive) return 'masque';
        if (rawStatus === 'rupture' || (stock !== null && stock <= 0)) return 'rupture';
        return 'actif';
    }

    // Calcul synchrone des KPIs
    function updateStatistics(data) {
        const prods = Object.values(data);
        let totalSold = 0;
        let outOfStockCount = 0;
        let hiddenCount = 0;

        prods.forEach(item => {
            totalSold += parseInt(item.nombreVentes || item.quantiteVendue || item.vendus || 0, 10);

            const status = getEffectiveStatus(item);
            if (status === 'rupture') outOfStockCount++;
            if (status === 'masque') hiddenCount++;
        });

        document.getElementById('stat-total-published').innerText = prods.length;
        document.getElementById('stat-total-sold').innerText = totalSold.toLocaleString();
        document.getElementById('stat-out-stock').innerText = outOfStockCount;
        document.getElementById('stat-hidden-prods').innerText = hiddenCount;
    }

    // Génération du tableau avec filtrage cohérent
    function renderProducts() {
        const query = searchInput.value.toLowerCase().trim();
        const catVal = categoryFilter.value;
        const filterVal = statusFilter.value;
        let html = '';

        const keys = Object.keys(allProductsData);

        if (keys.length === 0) {
            listBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #a1a1aa; padding: 20px;">Aucun produit trouvé dans Firebase.</td></tr>`;
            return;
        }

        keys.forEach((prodId) => {
            const item = allProductsData[prodId] || {};
            const name = item.nom || item.titre || item.name || 'Produit sans titre';
            const description = item.description || '';
            const category = getItemCategory(item);
            const effectiveStatus = getEffectiveStatus(item);

            const stock = item.stock !== undefined ? item.stock : 'N/A';
            const vendus = item.nombreVentes || item.quantiteVendue || item.vendus || 0;
            const prix = item.prixPromo || item.prix || item.price || 0;
            const devise = item.devise || 'FCFA';

            let img = item.image || item.imageUrl || item.mediaUrl || '';
            if (!img && Array.isArray(item.images) && item.images.length > 0) {
                img = item.images[0];
            }
            if (!img) img = 'https://via.placeholder.com/80?text=Sans+Image';

            const matchSearch = name.toLowerCase().includes(query) ||
                prodId.toLowerCase().includes(query) ||
                description.toLowerCase().includes(query) ||
                category.toLowerCase().includes(query);

            if (query && !matchSearch) return;
            if (catVal !== 'all' && category !== catVal) return;
            if (filterVal !== 'all' && effectiveStatus !== filterVal) return;

            let badgeClass = 'status-actif';
            let badgeText = '✅ En vente';
            if (effectiveStatus === 'masque') {
                badgeClass = 'status-masque';
                badgeText = '🚫 Masqué';
            } else if (effectiveStatus === 'rupture') {
                badgeClass = 'status-rupture';
                badgeText = '⚠️ Rupture';
            }

            const hasPub = Boolean(publicationsData[prodId]);

            html += `
                <tr>
                    <td><img src="${escapeAttr(img)}" class="prd-thumb" onerror="this.src='https://via.placeholder.com/80?text=Erreur'" alt="Aperçu"></td>
                    <td>
                        <strong style="color: #fff; font-size: 14px;">${escapeHtml(name)}</strong>
                        <div style="font-size: 10px; color: #a1a1aa;">ID: ${escapeHtml(prodId)}</div>
                    </td>
                    <td><span class="cat-pill">${escapeHtml(category)}</span></td>
                    <td><strong style="color: #ffcc00;">${parseFloat(prix || 0).toLocaleString()} ${escapeHtml(devise)}</strong></td>
                    <td><span style="color: #a1a1aa;">${escapeHtml(item.vendeurNom || item.boutique || 'Admin / DAKPRO')}</span></td>
                    <td><strong>${escapeHtml(stock)}</strong></td>
                    <td><strong style="color: #10b981;">${escapeHtml(vendus)}</strong></td>
                    <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
                    <td>
                        <button class="btn-act btn-edit" data-action="edit" data-id="${escapeAttr(prodId)}">✏️ Modifier</button>
                        <button class="btn-act btn-toggle" data-action="toggle" data-id="${escapeAttr(prodId)}" data-status="${effectiveStatus}">
                            ${effectiveStatus === 'masque' ? 'Activer' : 'Masquer'}
                        </button>
                        ${hasPub ? `<button class="btn-act btn-del-pub" data-action="delete-pub" data-id="${escapeAttr(prodId)}" title="Supprimer uniquement de /publications">🗑️ Pub.</button>` : ''}
                        <button class="btn-act btn-del" data-action="delete" data-id="${escapeAttr(prodId)}" title="Supprimer définitivement">Supprimer</button>
                    </td>
                </tr>
            `;
        });

        listBody.innerHTML = html || `<tr><td colspan="9" style="text-align: center; color: #a1a1aa; padding: 20px;">Aucun produit ne correspond à vos filtres.</td></tr>`;
    }

    searchInput.addEventListener('input', renderProducts);
    categoryFilter.addEventListener('change', renderProducts);
    statusFilter.addEventListener('change', renderProducts);

    // SUPPRESSION COMPLÈTE DU DOSSIER /produits
    deleteAllProduitsBtn.addEventListener('click', async () => {
        const countProduits = Object.keys(productsData).length;
        if (countProduits === 0) {
            return alert("ℹ️ Le dossier /produits est déjà vide.");
        }

        const firstConfirm = confirm(
            `⚠️ ATTENTION — EFFACEMENT COMPLET DE /produits :\n\n` +
            `Vous allez supprimer définitivement les ${countProduits} produit(s) qui se trouvent dans le dossier "produits".\n` +
            `Voulez-vous continuer ?`
        );
        if (!firstConfirm) return;

        const secondConfirm = confirm(
            `🚨 DERNIÈRE CONFIRMATION :\n\n` +
            `Confirmez-vous l'effacement total de tout le contenu de "produits" dans Firebase Realtime Database ?`
        );
        if (!secondConfirm) return;

        try {
            await update(ref(db), { produits: null });
            alert("✅ Tous les produits du dossier /produits ont été supprimés définitivement.");
        } catch (err) {
            alert("❌ Erreur lors de l'effacement de /produits : " + err.message);
        }
    });

    // SUPPRESSION D'UNE CATÉGORIE UNE À UNE
    deleteCategoryBtn.addEventListener('click', async () => {
        const selectedCat = categoryManageSelect.value;
        if (!selectedCat) {
            return alert("⚠️ Veuillez d'abord sélectionner une catégorie à supprimer.");
        }

        const matchingIds = Object.keys(allProductsData).filter(
            id => getItemCategory(allProductsData[id] || {}) === selectedCat
        );

        if (!confirm(
            `⚠️ Supprimer la catégorie "${selectedCat}" ?\n\n` +
            `Cela supprimera ${matchingIds.length} produit(s) rattaché(s) à cette catégorie dans la base.`
        )) {
            return;
        }

        const updates = {};
        matchingIds.forEach(prodId => {
            if (productsData[prodId]) updates[`produits/${prodId}`] = null;
            if (publicationsData[prodId]) updates[`publications/${prodId}`] = null;
        });

        try {
            await update(ref(db), updates);
            if (categoryFilter.value === selectedCat) categoryFilter.value = 'all';
            categoryManageSelect.value = '';
            alert(`✅ Catégorie "${selectedCat}" et ses ${matchingIds.length} produit(s) supprimés.`);
        } catch (err) {
            alert("❌ Erreur lors de la suppression de la catégorie : " + err.message);
        }
    });

    // OUVERTURE / FERMETURE / ENREGISTREMENT DE LA MODALE D'ÉDITION
    function openEditModal(prodId) {
        const item = allProductsData[prodId];
        if (!item) return;

        editIdInput.value = prodId;
        editNomInput.value = item.nom || item.titre || item.name || '';
        editCatInput.value = getItemCategory(item);
        editPrixInput.value = item.prix ?? item.price ?? 0;
        editPromoInput.value = item.prixPromo ?? '';
        editStockInput.value = item.stock ?? '';
        editDescInput.value = item.description || '';

        editModal.classList.add('open');
    }

    function closeEditModal() {
        editModal.classList.remove('open');
    }

    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });

    saveEditBtn.addEventListener('click', async () => {
        const prodId = editIdInput.value;
        if (!prodId) return;

        const nom = editNomInput.value.trim();
        const categorie = editCatInput.value.trim() || 'Général';
        const prix = parseFloat(editPrixInput.value);
        const promoRaw = editPromoInput.value;
        const prixPromo = promoRaw !== '' ? parseFloat(promoRaw) : null;
        const stockRaw = editStockInput.value;
        const stock = stockRaw !== '' ? parseInt(stockRaw, 10) : null;
        const description = editDescInput.value;

        if (!nom || isNaN(prix) || prix < 0) {
            return alert("⚠️ Veuillez saisir un nom valide et un prix positif.");
        }

        const updates = {};
        const applyFields = (basePath) => {
            updates[`${basePath}/${prodId}/nom`] = nom;
            updates[`${basePath}/${prodId}/titre`] = nom;
            updates[`${basePath}/${prodId}/categorie`] = categorie;
            updates[`${basePath}/${prodId}/sousCategorie`] = categorie;
            updates[`${basePath}/${prodId}/prix`] = prix;
            updates[`${basePath}/${prodId}/prixPromo`] = prixPromo;
            updates[`${basePath}/${prodId}/description`] = description;
            if (stock !== null && !isNaN(stock)) {
                updates[`${basePath}/${prodId}/stock`] = stock;
            }
        };

        if (productsData[prodId]) applyFields('produits');
        if (publicationsData[prodId]) applyFields('publications');

        if (Object.keys(updates).length === 0) {
            applyFields('produits');
        }

        try {
            await update(ref(db), updates);
            closeEditModal();
            alert("✅ Produit modifié directement dans Firebase.");
        } catch (err) {
            alert("❌ Erreur lors de la modification : " + err.message);
        }
    });

    // GESTION DES ACTIONS PAR LIGNE (MODIFIER, MASQUER, SUPPRIMER PUB, SUPPRIMER)
    listBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const action = target.getAttribute('data-action');
        const prodId = target.getAttribute('data-id');

        if (action === 'edit') {
            openEditModal(prodId);
        }

        else if (action === 'toggle') {
            const currentStatus = target.getAttribute('data-status');
            const newStatus = currentStatus === 'masque' ? 'actif' : 'masque';
            const isActive = (newStatus === 'actif');

            const updates = {};
            if (productsData[prodId]) {
                updates[`produits/${prodId}/statut`] = newStatus;
                updates[`produits/${prodId}/actif`] = isActive;
            }
            if (publicationsData[prodId]) {
                updates[`publications/${prodId}/statut`] = newStatus;
                updates[`publications/${prodId}/actif`] = isActive;
            }

            try {
                await update(ref(db), updates);
            } catch (err) {
                alert("❌ Erreur de modification : " + err.message);
            }
        }

        else if (action === 'delete-pub') {
            if (!publicationsData[prodId]) return;
            if (confirm(`⚠️ Supprimer l'entrée "${prodId}" uniquement dans "publications" ?`)) {
                try {
                    await update(ref(db), { [`publications/${prodId}`]: null });
                } catch (err) {
                    alert("❌ Erreur lors de la suppression dans publications : " + err.message);
                }
            }
        }

        else if (action === 'delete') {
            if (confirm(`⚠️ Confirmation de suppression définitive :\n\nVoulez-vous supprimer le produit ID "${prodId}" de Firebase Realtime Database ?\nIl disparaîtra immédiatement du site client et de l'administration.`)) {

                const updates = {};
                if (productsData[prodId]) updates[`produits/${prodId}`] = null;
                if (publicationsData[prodId]) updates[`publications/${prodId}`] = null;

                try {
                    await update(ref(db), updates);
                } catch (err) {
                    alert("❌ Erreur lors de la suppression : " + err.message);
                }
            }
        }
    });
}
