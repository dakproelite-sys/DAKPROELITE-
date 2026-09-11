import { getDatabase, ref, get, set, update, push, remove, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function init() {
    const container = document.getElementById('module-container');
    const auth = getAuth();
    const db = getDatabase();
    const currentUser = auth.currentUser;
    const authorEmail = currentUser ? currentUser.email : "admin@dakpro.com";

    container.innerHTML = `
        <style>
            .config-container { display: flex; flex-direction: column; gap: 25px; color: #f5f5f7; }
            .config-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 22px; }
            .config-title { color: #ffcc00; font-size: 15px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #282836; padding-bottom: 10px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
            .cfg-group { margin-bottom: 14px; }
            .cfg-group label { display: block; font-size: 11px; color: #a1a1aa; font-weight: 700; margin-bottom: 5px; text-transform: uppercase; }
            .cfg-group input, .cfg-group select, .cfg-group textarea { width: 100%; background: #0d0d11; border: 1px solid #282836; color: #fff; padding: 10px; border-radius: 6px; font-size: 13px; outline: none; box-sizing: border-box; }
            .cfg-group input:focus, .cfg-group select:focus, .cfg-group textarea:focus { border-color: #ffcc00; }
            .btn-save { background: #ffcc00; color: #000; font-weight: 800; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.2s; }
            .btn-save:hover { background: #e6b800; }
            .btn-danger { background: #ef4444; color: #fff; font-weight: 700; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; }
            .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; }
            .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }

            /* Module Prévisualisation Bannière */
            .banner-builder { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
            .banner-preview-box { background: #0d0d11; border: 1px dashed #ffcc00; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
            .banner-preview-card { position: relative; border-radius: 8px; overflow: hidden; min-height: 140px; background: #181820; display: flex; align-items: flex-end; padding: 15px; background-size: cover; background-position: center; border: 1px solid #282836; }
            .banner-preview-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2)); z-index: 1; }
            .banner-preview-content { position: relative; z-index: 2; color: #fff; }

            /* Tables & Grilles */
            .stock-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            .stock-table th { background: #181820; color: #ffcc00; text-align: left; padding: 10px; border-bottom: 1px solid #282836; }
            .stock-table td { padding: 10px; border-bottom: 1px solid #282836; vertical-align: middle; }
            .stock-input { width: 80px !important; padding: 6px !important; text-align: center; }
            .badge-stock { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; }
            .badge-ok { background: rgba(16, 185, 129, 0.2); color: #10b981; }
            .badge-empty { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
            .banner-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; margin-top: 15px; }
            .banner-card { background: #0d0d11; border: 1px solid #282836; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
            .banner-card img { width: 100%; height: 110px; object-fit: cover; }
            .banner-card-body { padding: 12px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; }
        </style>

        <div class="config-container">

            <!-- SESSION 1 : CRÉATEUR & PRÉVISUALISATION BANNIÈRE -->
            <div class="config-card">
                <div class="config-title">
                    <span>🖼️ Session 1 : Gestionnaire de Bannière avec Aperçu en Direct</span>
                </div>
                <div class="banner-builder">
                    <form id="form-banniere">
                        <div class="cfg-group">
                            <label>Titre de la Diapositive</label>
                            <input type="text" id="ban-title" placeholder="Ex: Offre Spéciale d'Été" required>
                        </div>
                        <div class="cfg-group">
                            <label>Sous-titre / Description</label>
                            <input type="text" id="ban-subtitle" placeholder="Ex: Jusqu'à -50% sur tous les produits" required>
                        </div>
                        <div class="cfg-group">
                            <label>URL de l'image de fond</label>
                            <input type="url" id="ban-img" placeholder="https://images.unsplash.com/photo-xxx.jpg" required>
                        </div>
                        <div class="cfg-group">
                            <label>Lien du Bouton / Redirection</label>
                            <input type="text" id="ban-link" placeholder="/catalog.html" required>
                        </div>
                        <button type="submit" class="btn-save">➕ Publier la Bannière</button>
                    </form>

                    <div class="banner-preview-box">
                        <span style="font-size:11px; color:#ffcc00; font-weight:bold; text-transform:uppercase;">👁️ Prévisualisation Avant Publication</span>
                        <div class="banner-preview-card" id="banner-preview-card">
                            <div class="banner-preview-overlay"></div>
                            <div class="banner-preview-content">
                                <h4 id="prev-title" style="margin:0; font-size:15px; color:#ffcc00;">Titre de démonstration</h4>
                                <p id="prev-subtitle" style="margin:4px 0 8px 0; font-size:12px; color:#e4e4e7;">Votre sous-titre s'affichera ici...</p>
                                <span id="prev-link" style="display:inline-block; background:#ffcc00; color:#000; padding:4px 10px; font-weight:bold; font-size:10px; border-radius:4px;">Voir l'offre →</span>
                            </div>
                        </div>
                    </div>
                </div>

                <h4 style="margin-top:25px; color:#a1a1aa; font-size:12px; text-transform:uppercase;">Bannières Actives sur l'Index</h4>
                <div id="banners-container" class="banner-grid">
                    <p style="color:#a1a1aa; font-size:12px;">Chargement...</p>
                </div>
            </div>

            <!-- SESSION 2 : MODES DE PAIEMENT & CONFIGURATION RETRAIT -->
            <div class="config-card">
                <div class="config-title">
                    <span>💳 Session 2 : Modes de Paiement & Coordonnées Réception</span>
                </div>
                <form id="form-paiements">
                    <div class="grid-3">
                        <div class="cfg-group">
                            <label>Mobile Money (Orange/MTN/Wave)</label>
                            <input type="text" id="pay-momo" placeholder="Ex: +225 0700000000">
                        </div>
                        <div class="cfg-group">
                            <label>Adresse Crypto (USDT TRC20)</label>
                            <input type="text" id="pay-crypto" placeholder="Ex: TXxx...99">
                        </div>
                        <div class="cfg-group">
                            <label>IBAN / RIB Virement</label>
                            <input type="text" id="pay-iban" placeholder="Ex: FR76 0000 0000 ...">
                        </div>
                    </div>
                    <button type="submit" class="btn-save">⚡ Sauvegarder Modes de Paiement</button>
                </form>
            </div>

            <!-- SESSION 3 : GESTION DES STOCKS EN TEMPS RÉEL -->
            <div class="config-card">
                <div class="config-title">
                    <span>📦 Session 3 : Stock & Disponibilité Produits</span>
                    <button class="btn-save" id="btn-update-all-stocks">💾 Tout Enregistrer</button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="stock-table">
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Type</th>
                                <th>Prix</th>
                                <th>Stock</th>
                                <th>Statut</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="stock-table-body">
                            <tr><td colspan="6" style="text-align: center; color: #a1a1aa;">Chargement...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SESSION 4 : CONTACT SUPPORT & RÉSEAUX SOCIAUX -->
            <div class="config-card">
                <div class="config-title">
                    <span>🌐 Session 4 : Contacts Support & Réseaux Sociaux</span>
                </div>
                <form id="form-socials">
                    <div class="grid-2">
                        <div class="cfg-group">
                            <label>Numéro WhatsApp Support</label>
                            <input type="text" id="contact-wa" placeholder="Ex: +229 90000000">
                        </div>
                        <div class="cfg-group">
                            <label>Email Support</label>
                            <input type="email" id="contact-email" placeholder="support@dakpro.com">
                        </div>
                    </div>
                    <div class="grid-2">
                        <div class="cfg-group">
                            <label>Lien Groupe Telegram / Canal</label>
                            <input type="url" id="social-tg" placeholder="https://t.me/...">
                        </div>
                        <div class="cfg-group">
                            <label>Lien Page Facebook</label>
                            <input type="url" id="social-fb" placeholder="https://facebook.com/...">
                        </div>
                    </div>
                    <button type="submit" class="btn-save">⚡ Enregistrer les Contacts</button>
                </form>
            </div>

            <!-- SESSION 5 : ANNONCE FLASH & RÈGLES -->
            <div class="config-card">
                <div class="config-title">
                    <span>📢 Session 5 : Annonce Flash & Conditions</span>
                </div>
                <form id="form-annonces" style="margin-bottom:20px;">
                    <div class="cfg-group">
                        <label>Titre de l'Alerte</label>
                        <input type="text" id="ann-title" placeholder="Maintenance / Promo" required>
                    </div>
                    <div class="cfg-group">
                        <label>Contenu de l'Annonce</label>
                        <textarea id="ann-content" rows="2" required></textarea>
                    </div>
                    <div class="grid-2">
                        <div class="cfg-group">
                            <label>Type d'Alerte</label>
                            <select id="ann-type">
                                <option value="info">ℹ️ Information</option>
                                <option value="success">✅ Promotion</option>
                                <option value="warning">⚠️ Avertissement</option>
                                <option value="danger">🚨 Urgent</option>
                            </select>
                        </div>
                        <div class="cfg-group">
                            <label>Visibilité</label>
                            <select id="ann-status">
                                <option value="active">🟢 Afficher</option>
                                <option value="hidden">🔴 Masquer</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="btn-save">⚡ Publier l'Annonce</button>
                </form>

                <form id="form-regles">
                    <div class="grid-3">
                        <div class="cfg-group">
                            <label>Retrait Min. (FCFA)</label>
                            <input type="number" id="cfg-min-withdrawal-xof" min="0" required>
                        </div>
                        <div class="cfg-group">
                            <label>Retrait Min. (€)</label>
                            <input type="number" id="cfg-min-withdrawal-eur" step="0.01" min="0" required>
                        </div>
                        <div class="cfg-group">
                            <label>Délai Paiement (Heures)</label>
                            <input type="number" id="cfg-payout-delay" min="1" required>
                        </div>
                    </div>
                    <div class="cfg-group">
                        <label>CGU & Conditions d'Affiliation</label>
                        <textarea id="cfg-terms-text" rows="3" required></textarea>
                    </div>
                    <button type="submit" class="btn-save">⚡ Sauvegarder les Paramètres Financiers</button>
                </form>
            </div>

        </div>
    `;

    // -------------------------------------------------------------
    // LOGIQUE DE PRÉVISUALISATION BANNIÈRE EN TEMPS RÉEL
    // -------------------------------------------------------------
    const inputTitle = document.getElementById('ban-title');
    const inputSubtitle = document.getElementById('ban-subtitle');
    const inputImg = document.getElementById('ban-img');
    const inputLink = document.getElementById('ban-link');

    const prevTitle = document.getElementById('prev-title');
    const prevSubtitle = document.getElementById('prev-subtitle');
    const prevCard = document.getElementById('banner-preview-card');

    function updateBannerPreview() {
        prevTitle.textContent = inputTitle.value.trim() || 'Titre de démonstration';
        prevSubtitle.textContent = inputSubtitle.value.trim() || 'Votre sous-titre s\'affichera ici...';
        const imgUrl = inputImg.value.trim();
        if (imgUrl) {
            prevCard.style.backgroundImage = `url('${imgUrl}')`;
        } else {
            prevCard.style.backgroundImage = 'none';
        }
    }

    [inputTitle, inputSubtitle, inputImg, inputLink].forEach(input => {
        input.addEventListener('input', updateBannerPreview);
    });

    // Enregistrement Bannière
    document.getElementById('form-banniere').addEventListener('submit', async (e) => {
        e.preventDefault();
        const bannerData = {
            titre: inputTitle.value.trim(),
            sousTitre: inputSubtitle.value.trim(),
            imageUrl: inputImg.value.trim(),
            lien: inputLink.value.trim(),
            dateCreation: new Date().toISOString(),
            creePar: authorEmail
        };

        try {
            await push(ref(db, 'config/bannieres'), bannerData);
            alert("✅ Bannière enregistrée et publiée en direct !");
            e.target.reset();
            updateBannerPreview();
        } catch (err) {
            alert("❌ Erreur : " + err.message);
        }
    });

    // Chargement dynamique des bannières existantes
    onValue(ref(db, 'config/bannieres'), (snapshot) => {
        const bannersContainer = document.getElementById('banners-container');
        if (!snapshot.exists()) {
            bannersContainer.innerHTML = `<p style="color:#a1a1aa; font-size:12px;">Aucune bannière configurée.</p>`;
            return;
        }

        const data = snapshot.val();
        bannersContainer.innerHTML = '';

        Object.keys(data).forEach(key => {
            const b = data[key];
            const card = document.createElement('div');
            card.className = 'banner-card';
            card.innerHTML = `
                <img src="${escapeHTML(b.imageUrl)}" alt="Bannière" onerror="this.src='https://via.placeholder.com/300x120?text=Image+Invalide'">
                <div class="banner-card-body">
                    <div>
                        <strong style="font-size:12px; color:#fff;">${escapeHTML(b.titre)}</strong>
                        <p style="font-size:11px; color:#a1a1aa; margin-top:3px;">${escapeHTML(b.sousTitre)}</p>
                    </div>
                    <button class="btn-danger btn-delete-banner" data-id="${key}">🗑️ Supprimer</button>
                </div>
            `;
            bannersContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-delete-banner').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm("Supprimer cette bannière ?")) {
                    await remove(ref(db, `config/bannieres/${id}`));
                }
            });
        });
    });

    // -------------------------------------------------------------
    // ENREGISTREMENT ET CHARGEMENT MODES PAIEMENT & CONTACTS
    // -------------------------------------------------------------
    document.getElementById('form-paiements').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            momo: document.getElementById('pay-momo').value.trim(),
            crypto: document.getElementById('pay-crypto').value.trim(),
            iban: document.getElementById('pay-iban').value.trim()
        };
        await set(ref(db, 'config/paiements'), payload);
        alert("✅ Modes de paiement sauvegardés !");
    });

    document.getElementById('form-socials').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            whatsapp: document.getElementById('contact-wa').value.trim(),
            email: document.getElementById('contact-email').value.trim(),
            telegram: document.getElementById('social-tg').value.trim(),
            facebook: document.getElementById('social-fb').value.trim()
        };
        await set(ref(db, 'config/contacts'), payload);
        alert("✅ Contacts et réseaux sociaux enregistrés !");
    });

    // -------------------------------------------------------------
    // STOCKS PRODUITS (TEMPS RÉEL)
    // -------------------------------------------------------------
    onValue(ref(db, 'publications'), (snapshot) => {
        const tbody = document.getElementById('stock-table-body');
        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #a1a1aa;">Aucun produit trouvé.</td></tr>`;
            return;
        }

        const items = snapshot.val();
        tbody.innerHTML = '';

        Object.keys(items).forEach(key => {
            const p = items[key];
            const qty = typeof p.quantiteStock === 'number' ? p.quantiteStock : 10;
            const statusBadge = qty <= 0 
                ? `<span class="badge-stock badge-empty">Rupture</span>` 
                : `<span class="badge-stock badge-ok">En Stock (${qty})</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHTML(p.titre || 'Sans titre')}</strong></td>
                <td style="text-transform: uppercase; font-size: 11px; color:#ffcc00;">${escapeHTML(p.type || 'produit')}</td>
                <td>${typeof p.prixNormalEUR === 'number' ? p.prixNormalEUR.toFixed(2) : '0.00'} €</td>
                <td>
                    <input type="number" min="0" class="cfg-group stock-input" id="stock-val-${key}" value="${qty}">
                </td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-save btn-update-stock" data-id="${key}" style="padding: 5px 10px; font-size:11px;">Mettre à jour</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-update-stock').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const input = document.getElementById(`stock-val-${id}`);
                const newQty = parseInt(input.value, 10);
                if (isNaN(newQty) || newQty < 0) return alert("Quantité invalide.");

                await update(ref(db, `publications/${id}`), {
                    quantiteStock: newQty,
                    statut: newQty <= 0 ? "rupture" : "actif",
                    derniereMiseAJourStock: new Date().toISOString()
                });
                alert("✅ Stock mis à jour !");
            });
        });
    });

    document.getElementById('btn-update-all-stocks').addEventListener('click', async () => {
        const inputs = document.querySelectorAll('.stock-input');
        const updates = {};
        inputs.forEach(input => {
            const id = input.id.replace('stock-val-', '');
            const newQty = parseInt(input.value, 10) || 0;
            updates[`publications/${id}/quantiteStock`] = newQty;
            updates[`publications/${id}/statut`] = newQty <= 0 ? "rupture" : "actif";
            updates[`publications/${id}/derniereMiseAJourStock`] = new Date().toISOString();
        });
        await update(ref(db), updates);
        alert("✅ Répertoire des stocks synchronisé !");
    });

    // -------------------------------------------------------------
    // CHARGEMENT INITIAL DES DONNÉES DE CONFIGURATION
    // -------------------------------------------------------------
    const paySnap = await get(ref(db, 'config/paiements'));
    if (paySnap.exists()) {
        const d = paySnap.val();
        document.getElementById('pay-momo').value = d.momo || '';
        document.getElementById('pay-crypto').value = d.crypto || '';
        document.getElementById('pay-iban').value = d.iban || '';
    }

    const contactSnap = await get(ref(db, 'config/contacts'));
    if (contactSnap.exists()) {
        const d = contactSnap.val();
        document.getElementById('contact-wa').value = d.whatsapp || '';
        document.getElementById('contact-email').value = d.email || '';
        document.getElementById('social-tg').value = d.telegram || '';
        document.getElementById('social-fb').value = d.facebook || '';
    }

    const annSnap = await get(ref(db, 'config/annonces'));
    if (annSnap.exists()) {
        const d = annSnap.val();
        document.getElementById('ann-title').value = d.titre || '';
        document.getElementById('ann-content').value = d.contenu || '';
        document.getElementById('ann-type').value = d.type || 'info';
        document.getElementById('ann-status').value = d.statut || 'active';
    }

    const regSnap = await get(ref(db, 'config/regles'));
    if (regSnap.exists()) {
        const d = regSnap.val();
        document.getElementById('cfg-min-withdrawal-xof').value = d.minRetraitXOF || 5000;
        document.getElementById('cfg-min-withdrawal-eur').value = d.minRetraitEUR || 10;
        document.getElementById('cfg-payout-delay').value = d.delaiPaiementHeures || 24;
        document.getElementById('cfg-terms-text').value = d.reglesGenerales || '';
    }
}
