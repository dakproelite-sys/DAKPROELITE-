import { getDatabase, ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* ============================================================
   MODULE CONFIGURATION GLOBALE & PAIEMENTS — DAKPROELITE
============================================================ */
export async function init() {
    const container = document.getElementById('module-container');
    if (!container) return;

    const db = getDatabase();
    const auth = getAuth();

    // 1. Inject UI CSS & Structure
    container.innerHTML = `
        <style>
            .cfg-container { color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 15px; border-radius: 12px; }
            .cfg-title { color: #ffcc00; font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.5px; border-left: 4px solid #ffcc00; padding-left: 10px; }
            
            .cfg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
            .cfg-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: space-between; }
            .cfg-card-highlight { border: 1px solid #ffcc00; box-shadow: 0 0 15px rgba(255, 204, 0, 0.15); margin-bottom: 20px; }
            .cfg-card-title { font-size: 13px; font-weight: 800; color: #ffcc00; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #282836; padding-bottom: 8px; }
            
            .form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
            .form-group label { font-size: 10px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
            .form-group input, .form-group select { background: #0d0d11; border: 1px solid #282836; color: #ffcc00; padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; outline: none; transition: all 0.2s; }
            .form-group input:focus, .form-group select:focus { border-color: #ffcc00; box-shadow: 0 0 8px rgba(255, 204, 0, 0.3); }
            
            .switch-group { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #1c1c26; margin-bottom: 8px; }
            .switch-label { font-size: 11px; font-weight: 700; color: #f5f5f7; }
            .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #282836; transition: .3s; border-radius: 20px; }
            .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #fff; transition: .3s; border-radius: 50%; }
            input:checked + .slider { background-color: #ffcc00; }
            input:checked + .slider:before { transform: translateX(20px); background-color: #000; }

            .btn-pub-section { background: linear-gradient(135deg, #ffcc00, #e6b800); color: #000; font-weight: 900; border: none; padding: 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s; text-transform: uppercase; font-size: 11px; margin-top: 10px; width: 100%; letter-spacing: 0.5px; }
            .btn-pub-section:hover { background: linear-gradient(135deg, #ffe57f, #ffcc00); transform: translateY(-1px); }
            
            .btn-role-action { background: #ffcc00; color: #000; font-weight: 800; border: none; padding: 9px; border-radius: 6px; cursor: pointer; font-size: 11px; text-transform: uppercase; width: 100%; }
            .btn-login-as { background: rgba(255, 204, 0, 0.15); color: #ffcc00; border: 1px solid #ffcc00; font-weight: 700; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; text-transform: uppercase; width: 100%; margin-top: 5px; }
            .section-separator { width: 100%; height: 1px; background: #282836; margin: 20px 0; }
        </style>

        <div class="cfg-container">
            <div class="cfg-title">⚙️ CONFIGURATION SYSTÈME & PASSERELLES DAKPROELITE</div>

            <!-- SECTION : CRÉATION DIRECTE DE COMPTE -->
            <div class="cfg-card cfg-card-highlight">
                <div class="cfg-card-title">
                    <span>➕ Créer un Nouveau Compte (Livreur / Vendeur / Admin)</span>
                    <span style="font-size: 9px; background: rgba(255, 204, 0, 0.2); padding: 2px 6px; border-radius: 4px;">AUTH & REALTIME DB</span>
                </div>
                <form id="form-create-account" style="background: #0d0d11; border: 1px solid #282836; border-radius: 8px; padding: 12px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                        <div class="form-group">
                            <label>Nom Complet</label>
                            <input type="text" id="new-user-name" placeholder="Ex: Jean Kouassi" required>
                        </div>
                        <div class="form-group">
                            <label>Adresse Email</label>
                            <input type="email" id="new-user-email" placeholder="contact@dakpro.com" required>
                        </div>
                        <div class="form-group">
                            <label>Mot de passe</label>
                            <input type="password" id="new-user-pass" placeholder="••••••••" required minlength="6">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 5px;">
                        <div class="form-group">
                            <label>Rôle Attribué</label>
                            <select id="new-user-role">
                                <option value="livreur">🛵 Livreur Officiel</option>
                                <option value="vendeur">🏪 Vendeur / Partenaire</option>
                                <option value="client">👤 Client Ordinaire</option>
                                <option value="admin">👑 Administrateur DAKPROELITE</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Téléphone</label>
                            <input type="text" id="new-user-phone" placeholder="+22900000000">
                        </div>
                    </div>
                    <button type="submit" class="btn-pub-section">✨ Créer & Enregistrer le Compte</button>
                </form>
            </div>

            <!-- SECTION MODIFICATION DES ROLES EXISTANTS -->
            <div class="cfg-card cfg-card-highlight">
                <div class="cfg-card-title">
                    <span>🔄 Gestion des Rôles Utilisateurs</span>
                </div>
                <div style="background: #0d0d11; border: 1px solid #282836; border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                    <div class="form-group">
                        <label>Sélectionner un compte dans la base</label>
                        <select id="role-user-select">
                            <option value="">Chargement de la liste...</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                        <div class="form-group">
                            <label>Rôle Système</label>
                            <select id="role-target-select">
                                <option value="livreur">🛵 Livreur Officiel</option>
                                <option value="vendeur">🏪 Vendeur / Partenaire</option>
                                <option value="client">👤 Client Ordinaire</option>
                                <option value="admin">👑 Administrateur DAKPROELITE</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Statut Compte</label>
                            <select id="role-status-select">
                                <option value="actif">✅ Actif / Validé</option>
                                <option value="suspendu">🚫 Suspendu</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;">
                    <button type="button" id="btn-assign-role" class="btn-role-action">⚡ Appliquer les Modifications</button>
                    <button type="button" id="btn-login-as-role" class="btn-login-as">🔑 Basculer sur ce Profil</button>
                </div>
            </div>

            <div class="section-separator"></div>
            <div class="cfg-title">💳 PASSERELLES DE PAIEMENT DE L'APPLICATION</div>

            <!-- PASSERELLES DE PAIEMENT INDIVIDUELLES -->
            <div class="cfg-grid">
                
                <!-- MOOV MONEY -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">📱 Moov Money</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Moov</span>
                            <label class="switch"><input type="checkbox" id="moov-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand / Compte</label>
                            <input type="text" id="moov-nom" placeholder="Ex: DAKPROELITE MOOV">
                        </div>
                        <div class="form-group">
                            <label>Numéro Marchand / Téléphone</label>
                            <input type="text" id="moov-numero" placeholder="Ex: +22995000000">
                        </div>
                        <div class="form-group">
                            <label>Code USSD / Syntaxe</label>
                            <input type="text" id="moov-ussd" value="*855*4*1*{NUMERO}*{MONTANT}#">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-moov" class="btn-pub-section">💾 Sauvegarder Moov</button>
                </div>

                <!-- MTN MOBILE MONEY -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">📱 MTN Mobile Money</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer MTN</span>
                            <label class="switch"><input type="checkbox" id="mtn-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand / Compte</label>
                            <input type="text" id="mtn-nom" placeholder="Ex: DAKPROELITE MTN">
                        </div>
                        <div class="form-group">
                            <label>Numéro Marchand / Téléphone</label>
                            <input type="text" id="mtn-numero" placeholder="Ex: +22961000000">
                        </div>
                        <div class="form-group">
                            <label>Code USSD / Syntaxe</label>
                            <input type="text" id="mtn-ussd" value="*139*8*{NUMERO}*{MONTANT}#">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-mtn" class="btn-pub-section">💾 Sauvegarder MTN</button>
                </div>

                <!-- WAVE MOBILE MONEY -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🌊 Wave Mobile Money</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Wave</span>
                            <label class="switch"><input type="checkbox" id="wave-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand</label>
                            <input type="text" id="wave-nom" placeholder="Ex: DAKPROELITE WAVE">
                        </div>
                        <div class="form-group">
                            <label>Numéro Associé</label>
                            <input type="text" id="wave-numero" placeholder="Ex: +22997000000">
                        </div>
                        <div class="form-group">
                            <label>Lien Paiement / QR URL</label>
                            <input type="text" id="wave-link" placeholder="https://wave.com/pay/...">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-wave" class="btn-pub-section">💾 Sauvegarder Wave</button>
                </div>

                <!-- CELTIIS CASH -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🔵 Celtiis Cash</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Celtiis</span>
                            <label class="switch"><input type="checkbox" id="celtiis-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand</label>
                            <input type="text" id="celtiis-nom" placeholder="Ex: DAKPROELITE CELTIIS">
                        </div>
                        <div class="form-group">
                            <label>Numéro Marchand / Téléphone</label>
                            <input type="text" id="celtiis-numero" placeholder="Ex: +22940000000">
                        </div>
                        <div class="form-group">
                            <label>Code USSD / Syntaxe</label>
                            <input type="text" id="celtiis-ussd" value="*880*3*{NUMERO}*{MONTANT}#">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-celtiis" class="btn-pub-section">💾 Sauvegarder Celtiis</button>
                </div>

                <!-- CARTE BANCAIRE -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">💳 Carte Bancaire (Visa / Mastercard)</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Cartes</span>
                            <label class="switch"><input type="checkbox" id="card-active"><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Fournisseur (Stripe, FedaPay, Kkiapay)</label>
                            <input type="text" id="card-provider" placeholder="Ex: FedaPay / Stripe">
                        </div>
                        <div class="form-group">
                            <label>Clé Publique API</label>
                            <input type="text" id="card-public-key" placeholder="pk_live_xxxxxxxxx">
                        </div>
                        <div class="form-group">
                            <label>URL de Callback / Redirect</label>
                            <input type="text" id="card-redirect-url" placeholder="https://dakproelite.com/success">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-card" class="btn-pub-section">💾 Sauvegarder Carte</button>
                </div>

                <!-- VIREMENT / INTERNATIONAL -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🌍 Virement & International (PayPal / Wise)</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer International</span>
                            <label class="switch"><input type="checkbox" id="intl-active"><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Email PayPal / Wise</label>
                            <input type="email" id="intl-email" placeholder="finance@dakproelite.com">
                        </div>
                        <div class="form-group">
                            <label>Lien Direct de Paiement</label>
                            <input type="text" id="intl-link" placeholder="https://paypal.me/dakproelite">
                        </div>
                        <div class="form-group">
                            <label>RIB / IBAN Bank</label>
                            <input type="text" id="intl-iban" placeholder="BJ66 0000 0000 0000 0000">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-intl" class="btn-pub-section">💾 Sauvegarder International</button>
                </div>

            </div>

            <div class="section-separator"></div>

            <!-- PARAMÈTRES GÉNÉRAUX & TARIFICATION -->
            <div class="cfg-grid">
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🌐 Identification Plateforme</div>
                        <div class="form-group">
                            <label>Nom de l'application</label>
                            <input type="text" id="cfg-app-name" value="DAKPROELITE">
                        </div>
                        <div class="form-group">
                            <label>Devise Principale</label>
                            <select id="cfg-currency">
                                <option value="FCFA">FCFA (XOF / XAF)</option>
                                <option value="EUR">Euro (€)</option>
                                <option value="USD">Dollar ($)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Email Support</label>
                            <input type="email" id="cfg-support-email" value="contact@dakproelite.com">
                        </div>
                        <div class="form-group">
                            <label>WhatsApp Support</label>
                            <input type="text" id="cfg-support-phone" value="+22900000000">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-identity" class="btn-pub-section">📢 Publier Identité</button>
                </div>

                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">📦 Configuration Livraisons</div>
                        <div class="form-group">
                            <label>Tarif de base (FCFA)</label>
                            <input type="number" id="cfg-delivery-base" value="1000">
                        </div>
                        <div class="form-group">
                            <label>Prix / KM Supplémentaire (FCFA)</label>
                            <input type="number" id="cfg-delivery-km" value="200">
                        </div>
                        <div class="form-group">
                            <label>Rétribution Livreur (%)</label>
                            <input type="number" id="cfg-delivery-driver-share" value="80">
                        </div>
                        <div class="form-group">
                            <label>Rayon Max (KM)</label>
                            <input type="number" id="cfg-delivery-max-radius" value="30">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-delivery" class="btn-pub-section">📢 Publier Livraisons</button>
                </div>

                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">💰 Tarifs & Commissions</div>
                        <div class="form-group">
                            <label>Frais Plateforme DAKPROELITE (FCFA)</label>
                            <input type="number" id="cfg-price-platform" value="500">
                        </div>
                        <div class="form-group">
                            <label>Commission Affiliation (FCFA)</label>
                            <input type="number" id="cfg-price-affiliation" value="1000">
                        </div>
                        <div class="form-group">
                            <label>Prix Référence Produit (FCFA)</label>
                            <input type="number" id="cfg-price-product" value="5000">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-pricing" class="btn-pub-section">📢 Publier Tarification</button>
                </div>
            </div>

            <div class="section-separator"></div>

            <!-- MAINTENANCE SÉPARÉE PAR RÔLE -->
            <div class="cfg-card">
                <div>
                    <div class="cfg-card-title">🚧 Contrôle Maintenance & Accès System</div>
                    <div class="switch-group">
                        <span class="switch-label" style="color:#ff4d4d;">🚨 Maintenance Globale</span>
                        <label class="switch"><input type="checkbox" id="sys-maint-global"><span class="slider"></span></label>
                    </div>
                    <div class="switch-group">
                        <span class="switch-label">🛒 Maintenance Espace Client</span>
                        <label class="switch"><input type="checkbox" id="sys-maint-acheteur"><span class="slider"></span></label>
                    </div>
                    <div class="switch-group">
                        <span class="switch-label">🏪 Maintenance Espace Vendeur</span>
                        <label class="switch"><input type="checkbox" id="sys-maint-vendeur"><span class="slider"></span></label>
                    </div>
                    <div class="switch-group">
                        <span class="switch-label">🛵 Maintenance Espace Livreur</span>
                        <label class="switch"><input type="checkbox" id="sys-maint-livreur"><span class="slider"></span></label>
                    </div>
                </div>
                <button type="button" id="btn-pub-system" class="btn-pub-section">📢 Publier États Maintenance</button>
            </div>
        </div>
    `;

    // Éléments DOM
    const userSelect = document.getElementById('role-user-select');

    // 2. Écoute dynamique Realtime DB pour la liste des utilisateurs (supporte les nœuds 'utilisateurs' et 'users')
    onValue(ref(db, 'utilisateurs'), (snapshot) => {
        if (!snapshot.exists()) {
            // Backup sur le nœud 'users' si 'utilisateurs' n'est pas rempli
            get(ref(db, 'users')).then(snapUsers => populateUserSelect(snapUsers));
        } else {
            populateUserSelect(snapshot);
        }
    });

    function populateUserSelect(snapshot) {
        userSelect.innerHTML = '<option value="">-- Sélectionner un utilisateur --</option>';
        if (snapshot.exists()) {
            const users = snapshot.val();
            Object.keys(users).forEach((uid) => {
                const u = users[uid];
                const nom = u.nomComplet || u.nom || u.email || uid;
                const roleActuel = u.role ? u.role.toUpperCase() : 'CLIENT';
                userSelect.innerHTML += `<option value="${uid}">${nom} (${u.email || 'Pas d\'email'}) - [${roleActuel}]</option>`;
            });
        }
    }

    // 3. Charger et Pré-remplir TOUTES les configurations depuis `configuration/`
    onValue(ref(db, 'configuration'), (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();

        // 🎯 Chargement des passerelles de paiements
        const p = data.paiements || data.paiement || {};
        
        if (p.moov) {
            document.getElementById('moov-active').checked = !!p.moov.actif;
            if (p.moov.nom_marchand) document.getElementById('moov-nom').value = p.moov.nom_marchand;
            if (p.moov.numero_marchand) document.getElementById('moov-numero').value = p.moov.numero_marchand;
            if (p.moov.code_ussd) document.getElementById('moov-ussd').value = p.moov.code_ussd;
        }
        if (p.mtn) {
            document.getElementById('mtn-active').checked = !!p.mtn.actif;
            if (p.mtn.nom_marchand) document.getElementById('mtn-nom').value = p.mtn.nom_marchand;
            if (p.mtn.numero_marchand) document.getElementById('mtn-numero').value = p.mtn.numero_marchand;
            if (p.mtn.code_ussd) document.getElementById('mtn-ussd').value = p.mtn.code_ussd;
        }
        if (p.wave) {
            document.getElementById('wave-active').checked = !!p.wave.actif;
            if (p.wave.nom_marchand) document.getElementById('wave-nom').value = p.wave.nom_marchand;
            if (p.wave.numero_marchand) document.getElementById('wave-numero').value = p.wave.numero_marchand;
            if (p.wave.lien_paiement) document.getElementById('wave-link').value = p.wave.lien_paiement;
        }
        if (p.celtiis) {
            document.getElementById('celtiis-active').checked = !!p.celtiis.actif;
            if (p.celtiis.nom_marchand) document.getElementById('celtiis-nom').value = p.celtiis.nom_marchand;
            if (p.celtiis.numero_marchand) document.getElementById('celtiis-numero').value = p.celtiis.numero_marchand;
            if (p.celtiis.code_ussd) document.getElementById('celtiis-ussd').value = p.celtiis.code_ussd;
        }
        if (p.carte_bancaire) {
            document.getElementById('card-active').checked = !!p.carte_bancaire.actif;
            if (p.carte_bancaire.fournisseur) document.getElementById('card-provider').value = p.carte_bancaire.fournisseur;
            if (p.carte_bancaire.cle_publique) document.getElementById('card-public-key').value = p.carte_bancaire.cle_publique;
            if (p.carte_bancaire.url_redirect) document.getElementById('card-redirect-url').value = p.carte_bancaire.url_redirect;
        }
        if (p.international) {
            document.getElementById('intl-active').checked = !!p.international.actif;
            if (p.international.email) document.getElementById('intl-email').value = p.international.email;
            if (p.international.lien_direct) document.getElementById('intl-link').value = p.international.lien_direct;
            if (p.international.iban) document.getElementById('intl-iban').value = p.international.iban;
        }

        // Chargement Informations Générales & Tarifs
        if (data.generale) {
            if (data.generale.appName) document.getElementById('cfg-app-name').value = data.generale.appName;
            if (data.generale.currency) document.getElementById('cfg-currency').value = data.generale.currency;
            if (data.generale.supportEmail) document.getElementById('cfg-support-email').value = data.generale.supportEmail;
            if (data.generale.supportPhone) document.getElementById('cfg-support-phone').value = data.generale.supportPhone;

            if (data.generale.delivery) {
                if (data.generale.delivery.basePrice) document.getElementById('cfg-delivery-base').value = data.generale.delivery.basePrice;
                if (data.generale.delivery.pricePerKm) document.getElementById('cfg-delivery-km').value = data.generale.delivery.pricePerKm;
                if (data.generale.delivery.driverShare) document.getElementById('cfg-delivery-driver-share').value = data.generale.delivery.driverShare;
                if (data.generale.delivery.maxRadius) document.getElementById('cfg-delivery-max-radius').value = data.generale.delivery.maxRadius;
            }

            if (data.generale.pricing) {
                if (data.generale.pricing.platformFee !== undefined) document.getElementById('cfg-price-platform').value = data.generale.pricing.platformFee;
                if (data.generale.pricing.affiliationPrice !== undefined) document.getElementById('cfg-price-affiliation').value = data.generale.pricing.affiliationPrice;
                if (data.generale.pricing.productPrice !== undefined) document.getElementById('cfg-price-product').value = data.generale.pricing.productPrice;
            }

            if (data.generale.system && data.generale.system.maintenance) {
                document.getElementById('sys-maint-global').checked = !!data.generale.system.maintenance.global;
                document.getElementById('sys-maint-acheteur').checked = !!data.generale.system.maintenance.acheteur;
                document.getElementById('sys-maint-vendeur').checked = !!data.generale.system.maintenance.vendeur;
                document.getElementById('sys-maint-livreur').checked = !!data.generale.system.maintenance.livreur;
            }
        }
    });

    // ============================================================
    // ÉCRITURE DIRECTE DANS LE NŒUD "configuration" PAR UN UPDATE GLOBAL
    // ============================================================
    async function savePaymentGateway(key, payload) {
        try {
            const updates = {};
            // On écrit dans les deux nœuds pour éviter toute rupture de compatibilité
            updates[`configuration/paiements/${key}`] = payload;
            updates[`configuration/paiement/${key}`] = payload;
            
            await update(ref(db), updates);
            alert(`✅ Passerelle ${key.toUpperCase()} enregistrée avec succès dans Firebase !`);
        } catch (err) {
            console.error(err);
            alert(`❌ Erreur d'enregistrement (${key}) : ` + err.message);
        }
    }

    // Boutons de sauvegarde Passerelles
    document.getElementById('btn-pub-moov').addEventListener('click', () => {
        savePaymentGateway('moov', {
            actif: document.getElementById('moov-active').checked,
            nom_marchand: document.getElementById('moov-nom').value.trim(),
            numero_marchand: document.getElementById('moov-numero').value.trim(),
            code_ussd: document.getElementById('moov-ussd').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('btn-pub-mtn').addEventListener('click', () => {
        savePaymentGateway('mtn', {
            actif: document.getElementById('mtn-active').checked,
            nom_marchand: document.getElementById('mtn-nom').value.trim(),
            numero_marchand: document.getElementById('mtn-numero').value.trim(),
            code_ussd: document.getElementById('mtn-ussd').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('btn-pub-wave').addEventListener('click', () => {
        savePaymentGateway('wave', {
            actif: document.getElementById('wave-active').checked,
            nom_marchand: document.getElementById('wave-nom').value.trim(),
            numero_marchand: document.getElementById('wave-numero').value.trim(),
            lien_paiement: document.getElementById('wave-link').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('btn-pub-celtiis').addEventListener('click', () => {
        savePaymentGateway('celtiis', {
            actif: document.getElementById('celtiis-active').checked,
            nom_marchand: document.getElementById('celtiis-nom').value.trim(),
            numero_marchand: document.getElementById('celtiis-numero').value.trim(),
            code_ussd: document.getElementById('celtiis-ussd').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('btn-pub-card').addEventListener('click', () => {
        savePaymentGateway('carte_bancaire', {
            actif: document.getElementById('card-active').checked,
            fournisseur: document.getElementById('card-provider').value.trim(),
            cle_publique: document.getElementById('card-public-key').value.trim(),
            url_redirect: document.getElementById('card-redirect-url').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('btn-pub-intl').addEventListener('click', () => {
        savePaymentGateway('international', {
            actif: document.getElementById('intl-active').checked,
            email: document.getElementById('intl-email').value.trim(),
            lien_direct: document.getElementById('intl-link').value.trim(),
            iban: document.getElementById('intl-iban').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    // ============================================================
    // AUTRES MODULES DE CONFIGURATION
    // ============================================================

    // Création de compte Authentication & Realtime DB
    document.getElementById('form-create-account').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nom = document.getElementById('new-user-name').value.trim();
        const email = document.getElementById('new-user-email').value.trim();
        const password = document.getElementById('new-user-pass').value;
        const role = document.getElementById('new-user-role').value;
        const phone = document.getElementById('new-user-phone').value.trim();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            const userPayload = {
                uid: uid,
                nomComplet: nom,
                email: email,
                telephone: phone,
                role: role,
                statut: 'actif',
                createdAt: new Date().toISOString()
            };

            const updates = {};
            updates[`utilisateurs/${uid}`] = userPayload;
            updates[`users/${uid}`] = userPayload;

            if (role === 'livreur') {
                updates[`livreurs/${uid}`] = {
                    uid: uid,
                    nom: nom,
                    email: email,
                    telephone: phone,
                    disponible: true,
                    statutCompte: 'valide',
                    updatedAt: new Date().toISOString()
                };
            }

            await update(ref(db), updates);
            alert(`✅ Compte créé ! UID: ${uid}`);
            document.getElementById('form-create-account').reset();
        } catch (err) {
            alert("❌ Erreur de création : " + err.message);
        }
    });

    // Modification Rôle
    document.getElementById('btn-assign-role').addEventListener('click', async () => {
        const selectedUid = userSelect.value;
        if (!selectedUid) return alert("⚠️ Veuillez choisir un utilisateur.");

        const newRole = document.getElementById('role-target-select').value;
        const newStatus = document.getElementById('role-status-select').value;

        try {
            const updates = {};
            updates[`utilisateurs/${selectedUid}/role`] = newRole;
            updates[`utilisateurs/${selectedUid}/statut`] = newStatus;
            updates[`users/${selectedUid}/role`] = newRole;
            updates[`users/${selectedUid}/statut`] = newStatus;

            await update(ref(db), updates);
            alert(`✅ Rôle mis à jour (${newRole.toUpperCase()}) !`);
        } catch (err) {
            alert("❌ Erreur : " + err.message);
        }
    });

    // Session Switcher
    document.getElementById('btn-login-as-role').addEventListener('click', async () => {
        const selectedUid = userSelect.value;
        if (!selectedUid) return alert("⚠️ Veuillez sélectionner un utilisateur.");
        const userSnap = await get(ref(db, `utilisateurs/${selectedUid}`));
        if (userSnap.exists()) {
            sessionStorage.setItem('activeRoleSession', JSON.stringify({ uid: selectedUid, role: userSnap.val().role || 'client' }));
            alert(`🔑 Session configurée pour cet utilisateur.`);
        }
    });

    // Identité
    document.getElementById('btn-pub-identity').addEventListener('click', async () => {
        try {
            await update(ref(db, 'configuration/generale'), {
                appName: document.getElementById('cfg-app-name').value,
                currency: document.getElementById('cfg-currency').value,
                supportEmail: document.getElementById('cfg-support-email').value,
                supportPhone: document.getElementById('cfg-support-phone').value,
                updatedAt: new Date().toISOString()
            });
            alert("✅ Identité enregistrée !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // Livraisons
    document.getElementById('btn-pub-delivery').addEventListener('click', async () => {
        try {
            await update(ref(db, 'configuration/generale/delivery'), {
                basePrice: parseFloat(document.getElementById('cfg-delivery-base').value) || 0,
                pricePerKm: parseFloat(document.getElementById('cfg-delivery-km').value) || 0,
                driverShare: parseFloat(document.getElementById('cfg-delivery-driver-share').value) || 0,
                maxRadius: parseFloat(document.getElementById('cfg-delivery-max-radius').value) || 0
            });
            alert("✅ Paramètres de livraison enregistrés !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // Tarifs & Commissions
    document.getElementById('btn-pub-pricing').addEventListener('click', async () => {
        try {
            await update(ref(db, 'configuration/generale/pricing'), {
                platformFee: parseFloat(document.getElementById('cfg-price-platform').value) || 0,
                affiliationPrice: parseFloat(document.getElementById('cfg-price-affiliation').value) || 0,
                productPrice: parseFloat(document.getElementById('cfg-price-product').value) || 0,
                updatedAt: new Date().toISOString()
            });
            alert("✅ Commissions et Tarification enregistrées !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // System Maintenance
    document.getElementById('btn-pub-system').addEventListener('click', async () => {
        try {
            await update(ref(db, 'configuration/generale/system/maintenance'), {
                global: document.getElementById('sys-maint-global').checked,
                acheteur: document.getElementById('sys-maint-acheteur').checked,
                vendeur: document.getElementById('sys-maint-vendeur').checked,
                livreur: document.getElementById('sys-maint-livreur').checked,
                updatedAt: new Date().toISOString()
            });
            alert("✅ États de maintenance enregistrés !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });
}
