import { getDatabase, ref, onValue, set, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* ============================================================
   MODULE CONFIGURATION GLOBALE & CREATION DE COMPTES — DAKPROELITE
============================================================ */
export async function init() {
    const container = document.getElementById('module-container');
    if (!container) return;

    const db = getDatabase();
    const auth = getAuth();

    // 1. Structure HTML / UI Modulaire Élite
    container.innerHTML = `
        <style>
            .cfg-container { color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 15px; border-radius: 12px; }
            .cfg-title { color: #ffcc00; font-size: 20px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.5px; border-left: 4px solid #ffcc00; padding-left: 10px; }
            
            .cfg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
            .cfg-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: space-between; }
            .cfg-card-highlight { border: 1px solid #ffcc00; box-shadow: 0 0 15px rgba(255, 204, 0, 0.15); margin-bottom: 25px; }
            .cfg-card-title { font-size: 14px; font-weight: 800; color: #ffcc00; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #282836; padding-bottom: 10px; }
            
            .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
            .form-group label { font-size: 11px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
            .form-group input, .form-group select { background: #0d0d11; border: 1px solid #282836; color: #ffcc00; padding: 10px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; outline: none; transition: all 0.2s; }
            .form-group input:focus, .form-group select:focus { border-color: #ffcc00; box-shadow: 0 0 8px rgba(255, 204, 0, 0.3); }
            
            .switch-group { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #1c1c26; margin-bottom: 10px; }
            .switch-label { font-size: 12px; font-weight: 700; color: #f5f5f7; }
            .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #282836; transition: .3s; border-radius: 22px; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: #fff; transition: .3s; border-radius: 50%; }
            input:checked + .slider { background-color: #ffcc00; }
            input:checked + .slider:before { transform: translateX(22px); background-color: #000; }

            .btn-pub-section { background: linear-gradient(135deg, #ffcc00, #e6b800); color: #000; font-weight: 900; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; transition: all 0.2s; text-transform: uppercase; font-size: 11px; margin-top: 15px; width: 100%; letter-spacing: 0.5px; }
            .btn-pub-section:hover { background: linear-gradient(135deg, #ffe57f, #ffcc00); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255, 204, 0, 0.2); }
            
            .btn-role-action { background: #ffcc00; color: #000; font-weight: 800; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 11px; text-transform: uppercase; width: 100%; }
            .btn-login-as { background: rgba(255, 204, 0, 0.15); color: #ffcc00; border: 1px solid #ffcc00; font-weight: 700; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; text-transform: uppercase; width: 100%; margin-top: 5px; }
            .section-separator { width: 100%; height: 1px; background: #282836; margin: 25px 0; }
        </style>

        <div class="cfg-container">
            <div class="cfg-title">⚙️ Configuration Système & Gestion des Comptes</div>

            <!-- SECTION : CRÉATION DIRECTE DE COMPTE -->
            <div class="cfg-card cfg-card-highlight">
                <div class="cfg-card-title">
                    <span>➕ Créer un Nouveau Compte (Livreur / Vendeur / Admin)</span>
                    <span style="font-size: 10px; background: rgba(255, 204, 0, 0.2); padding: 3px 8px; border-radius: 4px;">AUTHENTICATION & REALTIME DB</span>
                </div>
                <form id="form-create-account" style="background: #0d0d11; border: 1px solid #282836; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                        <div class="form-group">
                            <label>Nom complet du livreur / utilisateur</label>
                            <input type="text" id="new-user-name" placeholder="Ex: Jean Kouassi" required>
                        </div>
                        <div class="form-group">
                            <label>Adresse Email</label>
                            <input type="email" id="new-user-email" placeholder="livreur@dakpro.com" required>
                        </div>
                        <div class="form-group">
                            <label>Mot de passe initial</label>
                            <input type="password" id="new-user-pass" placeholder="••••••••" required minlength="6">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 5px;">
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
                            <label>Numéro de Téléphone (Optionnel)</label>
                            <input type="text" id="new-user-phone" placeholder="+22900000000">
                        </div>
                    </div>
                    <button type="submit" class="btn-pub-section" style="margin-top: 10px;">✨ Inscrire & Attribuer le Rôle Immédiatement</button>
                </form>
            </div>

            <!-- SECTION MODIFICATION DES ROLES EXISTANTS -->
            <div class="cfg-card cfg-card-highlight">
                <div class="cfg-card-title">
                    <span>🔄 Modification de Rôle pour Utilisateur Existant</span>
                    <span style="font-size: 10px; background: rgba(255, 204, 0, 0.2); padding: 3px 8px; border-radius: 4px;">SYNCHRO TEMPS RÉEL</span>
                </div>
                <div style="background: #0d0d11; border: 1px solid #282836; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                    <div class="form-group">
                        <label>Sélectionner un compte dans la base</label>
                        <select id="role-user-select">
                            <option value="">Chargement du registre...</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;">
                        <div class="form-group">
                            <label>Nouveau Rôle Système</label>
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
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                    <button type="button" id="btn-assign-role" class="btn-role-action">⚡ Mettre à Jour le Rôle</button>
                    <button type="button" id="btn-login-as-role" class="btn-login-as">🔑 Basculer sur cet Espace</button>
                </div>
            </div>

            <!-- CONFIGURATION PLATEFORME & LIVRAISONS -->
            <div class="cfg-grid">
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🌐 Identification Plateforme</div>
                        <div class="form-group">
                            <label>Nom Officiel de l'application</label>
                            <input type="text" id="cfg-app-name" value="DAKPROELITE">
                        </div>
                        <div class="form-group">
                            <label>Devise Système</label>
                            <select id="cfg-currency">
                                <option value="FCFA">FCFA (XOF / XAF)</option>
                                <option value="EUR">Euro (€)</option>
                                <option value="USD">Dollar ($)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Email Support Client</label>
                            <input type="email" id="cfg-support-email" value="contact@dakproelite.com">
                        </div>
                        <div class="form-group">
                            <label>WhatsApp Support Direct</label>
                            <input type="text" id="cfg-support-phone" value="+22900000000">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-identity" class="btn-pub-section">📢 Publier l'Identification</button>
                </div>

                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">📦 Tarifs & Livraisons</div>
                        <div class="form-group">
                            <label>Prise en charge de base (FCFA)</label>
                            <input type="number" id="cfg-delivery-base" value="1000">
                        </div>
                        <div class="form-group">
                            <label>Frais par KM supplémentaire (FCFA)</label>
                            <input type="number" id="cfg-delivery-km" value="200">
                        </div>
                        <div class="form-group">
                            <label>Part Rétribuée au Livreur (%)</label>
                            <input type="number" id="cfg-delivery-driver-share" value="80" min="0" max="100">
                        </div>
                        <div class="form-group">
                            <label>Rayon maximal de livraison (KM)</label>
                            <input type="number" id="cfg-delivery-max-radius" value="30">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-delivery" class="btn-pub-section">📢 Publier Paramètres Livraison</button>
                </div>

                <!-- SECTION : CONFIGURATION DES PRIX & COMMISSIONS DAKPROELITE -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">💰 Tarification, Affiliation & Commissions</div>
                        <div class="form-group">
                            <label>Prix / Frais Plateforme DAKPROELITE (FCFA ou %)</label>
                            <input type="number" id="cfg-price-platform" value="500">
                        </div>
                        <div class="form-group">
                            <label>Prix / Taux Affiliation (FCFA ou %)</label>
                            <input type="number" id="cfg-price-affiliation" value="1000">
                        </div>
                        <div class="form-group">
                            <label>Prix de Référence Produit (FCFA)</label>
                            <input type="number" id="cfg-price-product" value="5000">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-pricing" class="btn-pub-section">📢 Publier Configuration des Prix</button>
                </div>
            </div>

            <div class="section-separator"></div>

            <!-- CONTROLE & MAINTENANCE SÉPARÉE PAR RÔLE -->
            <div class="cfg-card" style="margin-bottom: 25px;">
                <div>
                    <div class="cfg-card-title">🚧 Maintenance Ciblée & Sécurité Système</div>
                    
                    <div class="switch-group">
                        <span class="switch-label" style="color: #ff4d4d; font-weight: 800;">🚨 Maintenance Globale (Toute l'application)</span>
                        <label class="switch"><input type="checkbox" id="sys-maint-global"><span class="slider"></span></label>
                    </div>
                    <div class="switch-group">
                        <span class="switch-label">🛒 Maintenance Espace Acheteur / Client</span>
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
                    
                    <div class="section-separator" style="margin: 15px 0;"></div>

                    <div class="switch-group">
                        <span class="switch-label">Autoriser Nouvelles Inscriptions</span>
                        <label class="switch"><input type="checkbox" id="sys-registrations" checked><span class="slider"></span></label>
                    </div>
                    <div class="switch-group">
                        <span class="switch-label">Auto-validation Inscriptions Livreurs</span>
                        <label class="switch"><input type="checkbox" id="sys-auto-drivers"><span class="slider"></span></label>
                    </div>
                    <div class="form-group" style="margin-top: 10px;">
                        <label>Version Minimale App Mobile</label>
                        <input type="text" id="sys-min-version" value="1.0.0">
                    </div>
                </div>
                <button type="button" id="btn-pub-system" class="btn-pub-section">📢 Publier Maintenance & Sécurité</button>
            </div>

            <div class="section-separator"></div>
            <div class="cfg-title">💳 PASSERELLES DE PAIEMENT INDIVIDUELLES</div>

            <!-- PASSERELLES PAIEMENT SEPAREES -->
            <div class="cfg-grid">
                
                <!-- MOOV MONEY -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">📱 Moov Money</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Moov Money</span>
                            <label class="switch"><input type="checkbox" id="moov-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand</label>
                            <input type="text" id="moov-nom" placeholder="Ex: DAKPROELITE MOOV">
                        </div>
                        <div class="form-group">
                            <label>Numéro / Code Marchand</label>
                            <input type="text" id="moov-numero" placeholder="Ex: 342612">
                        </div>
                        <div class="form-group">
                            <label>Code USSD Template</label>
                            <input type="text" id="moov-ussd" value="*855*4*1*{NUMERO}*{MONTANT}#">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-moov" class="btn-pub-section">📢 Publier Moov Money</button>
                </div>

                <!-- MTN MOBILE MONEY -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">📱 MTN Mobile Money</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer MTN Money</span>
                            <label class="switch"><input type="checkbox" id="mtn-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand</label>
                            <input type="text" id="mtn-nom" placeholder="Ex: DAKPROELITE STORE">
                        </div>
                        <div class="form-group">
                            <label>Numéro / Code Marchand</label>
                            <input type="text" id="mtn-numero" placeholder="Ex: 123456">
                        </div>
                        <div class="form-group">
                            <label>Code USSD Template</label>
                            <input type="text" id="mtn-ussd" value="*139*8*{NUMERO}*{MONTANT}#">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-mtn" class="btn-pub-section">📢 Publier MTN Money</button>
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
                            <label>Nom / Compte Marchand</label>
                            <input type="text" id="wave-nom" placeholder="Ex: DAKPROELITE OFFICIAL">
                        </div>
                        <div class="form-group">
                            <label>Numéro de Téléphone associé</label>
                            <input type="text" id="wave-numero" placeholder="Ex: +22900000000">
                        </div>
                        <div class="form-group">
                            <label>Lien Paiement / QR Code URL (Optionnel)</label>
                            <input type="text" id="wave-link" placeholder="https://wave.com/pay/...">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-wave" class="btn-pub-section">📢 Publier Wave Money</button>
                </div>

                <!-- CELTIIS CASH -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🔵 Celtiis Cash</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Celtiis Cash</span>
                            <label class="switch"><input type="checkbox" id="celtiis-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand</label>
                            <input type="text" id="celtiis-nom" placeholder="Ex: DAKPROELITE BENIN">
                        </div>
                        <div class="form-group">
                            <label>Code Marchand / Numéro</label>
                            <input type="text" id="celtiis-numero" placeholder="Ex: 65000000">
                        </div>
                        <div class="form-group">
                            <label>Code USSD Template</label>
                            <input type="text" id="celtiis-ussd" value="*880*3*{NUMERO}*{MONTANT}#">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-celtiis" class="btn-pub-section">📢 Publier Celtiis Cash</button>
                </div>

                <!-- CARTES BANCAIRES INTERNATIONALES -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">💳 Carte Bancaire (Visa / Mastercard)</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Cartes Bancaires</span>
                            <label class="switch"><input type="checkbox" id="card-active"><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Fournisseur (ex: Stripe, FedaPay, Kkiapay)</label>
                            <input type="text" id="card-provider" placeholder="Ex: Stripe / FedaPay">
                        </div>
                        <div class="form-group">
                            <label>Clé Publique / Public API Key</label>
                            <input type="text" id="card-public-key" placeholder="pk_live_xxxxxxxxx">
                        </div>
                        <div class="form-group">
                            <label>URL de Redirection Callback</label>
                            <input type="text" id="card-redirect-url" placeholder="https://dakproelite.com/checkout/success">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-card" class="btn-pub-section">📢 Publier Cartes Bancaires</button>
                </div>

                <!-- AUTRES / COMPTE INTERNATIONAL (PayPal / Wise) -->
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🌍 Paiement International (PayPal / Wise)</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Paiement International</span>
                            <label class="switch"><input type="checkbox" id="intl-active"><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Email PayPal / Wise</label>
                            <input type="email" id="intl-email" placeholder="paiement@dakproelite.com">
                        </div>
                        <div class="form-group">
                            <label>Lien de paiement direct (ex: paypal.me)</label>
                            <input type="text" id="intl-link" placeholder="https://paypal.me/dakproelite">
                        </div>
                        <div class="form-group">
                            <label>IBAN / RIB pour Virement</label>
                            <input type="text" id="intl-iban" placeholder="FR76 0000 0000 0000 0000">
                        </div>
                    </div>
                    <button type="button" id="btn-pub-intl" class="btn-pub-section">📢 Publier International</button>
                </div>

            </div>
        </div>
    `;

    // Éléments DOM Registre
    const userSelect = document.getElementById('role-user-select');
    const roleTargetSelect = document.getElementById('role-target-select');
    const roleStatusSelect = document.getElementById('role-status-select');

    // 2. Écoute dynamique Realtime DB pour la liste des utilisateurs
    const usersRef = ref(db, 'utilisateurs');
    onValue(usersRef, (snapshot) => {
        userSelect.innerHTML = '<option value="">-- Sélectionner un utilisateur --</option>';
        if (snapshot.exists()) {
            const users = snapshot.val();
            Object.keys(users).forEach((uid) => {
                const u = users[uid];
                const nom = u.nomComplet || u.nom || u.email || uid;
                const roleActuel = u.role ? u.role.toUpperCase() : 'CLIENT';
                userSelect.innerHTML += `<option value="${uid}">${nom} (${u.email || 'Sans Email'}) - [${roleActuel}]</option>`;
            });
        }
    });

    // 3. Charger les configurations existantes depuis la Realtime Database
    const configRef = ref(db, 'configuration');
    onValue(configRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();

            // Identité
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

                if (data.generale.system) {
                    document.getElementById('sys-registrations').checked = !!data.generale.system.allowRegistrations;
                    document.getElementById('sys-auto-drivers').checked = !!data.generale.system.autoApproveDrivers;
                    if (data.generale.system.minVersion) document.getElementById('sys-min-version').value = data.generale.system.minVersion;
                    
                    // Maintenance par rôle
                    if (data.generale.system.maintenance) {
                        document.getElementById('sys-maint-global').checked = !!data.generale.system.maintenance.global;
                        document.getElementById('sys-maint-acheteur').checked = !!data.generale.system.maintenance.acheteur;
                        document.getElementById('sys-maint-vendeur').checked = !!data.generale.system.maintenance.vendeur;
                        document.getElementById('sys-maint-livreur').checked = !!data.generale.system.maintenance.livreur;
                    }
                }

                if (data.generale.pricing) {
                    if (data.generale.pricing.platformFee !== undefined) document.getElementById('cfg-price-platform').value = data.generale.pricing.platformFee;
                    if (data.generale.pricing.affiliationPrice !== undefined) document.getElementById('cfg-price-affiliation').value = data.generale.pricing.affiliationPrice;
                    if (data.generale.pricing.productPrice !== undefined) document.getElementById('cfg-price-product').value = data.generale.pricing.productPrice;
                }
            }

            // Chargement des modes de paiement
            if (data.paiement) {
                if (data.paiement.moov) {
                    document.getElementById('moov-active').checked = !!data.paiement.moov.actif;
                    document.getElementById('moov-nom').value = data.paiement.moov.nom_marchand || '';
                    document.getElementById('moov-numero').value = data.paiement.moov.numero_marchand || '';
                    document.getElementById('moov-ussd').value = data.paiement.moov.code_ussd_template || '*855*4*1*{NUMERO}*{MONTANT}#';
                }
                if (data.paiement.mtn) {
                    document.getElementById('mtn-active').checked = !!data.paiement.mtn.actif;
                    document.getElementById('mtn-nom').value = data.paiement.mtn.nom_marchand || '';
                    document.getElementById('mtn-numero').value = data.paiement.mtn.numero_marchand || '';
                    document.getElementById('mtn-ussd').value = data.paiement.mtn.code_ussd_template || '*139*8*{NUMERO}*{MONTANT}#';
                }
                if (data.paiement.wave) {
                    document.getElementById('wave-active').checked = !!data.paiement.wave.actif;
                    document.getElementById('wave-nom').value = data.paiement.wave.nom_marchand || '';
                    document.getElementById('wave-numero').value = data.paiement.wave.numero_marchand || '';
                    document.getElementById('wave-link').value = data.paiement.wave.lien_paiement || '';
                }
                if (data.paiement.celtiis) {
                    document.getElementById('celtiis-active').checked = !!data.paiement.celtiis.actif;
                    document.getElementById('celtiis-nom').value = data.paiement.celtiis.nom_marchand || '';
                    document.getElementById('celtiis-numero').value = data.paiement.celtiis.numero_marchand || '';
                    document.getElementById('celtiis-ussd').value = data.paiement.celtiis.code_ussd_template || '*880*3*{NUMERO}*{MONTANT}#';
                }
                if (data.paiement.carte_bancaire) {
                    document.getElementById('card-active').checked = !!data.paiement.carte_bancaire.actif;
                    document.getElementById('card-provider').value = data.paiement.carte_bancaire.fournisseur || '';
                    document.getElementById('card-public-key').value = data.paiement.carte_bancaire.cle_publique || '';
                    document.getElementById('card-redirect-url').value = data.paiement.carte_bancaire.url_redirect || '';
                }
                if (data.paiement.international) {
                    document.getElementById('intl-active').checked = !!data.paiement.international.actif;
                    document.getElementById('intl-email').value = data.paiement.international.email || '';
                    document.getElementById('intl-link').value = data.paiement.international.lien_direct || '';
                    document.getElementById('intl-iban').value = data.paiement.international.iban || '';
                }
            }
        }
    });

    // ============================================================
    // CRÉATION DE COMPTE AUTHENTICATION & REALTIME DB
    // ============================================================
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const updates = {};
            updates[`utilisateurs/${uid}`] = userPayload;

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

            alert(`✅ Compte créé avec succès ! UID: ${uid} - Rôle: ${role.toUpperCase()}`);
            document.getElementById('form-create-account').reset();
        } catch (err) {
            alert("❌ Erreur lors de la création du compte : " + err.message);
        }
    });

    // ============================================================
    // PUBLICATION CONFIGURATION DES PRIX (PLATEFORME / AFFILIATION / PRODUIT)
    // ============================================================
    document.getElementById('btn-pub-pricing').addEventListener('click', async () => {
        try {
            await update(ref(db, 'configuration/generale/pricing'), {
                platformFee: parseFloat(document.getElementById('cfg-price-platform').value) || 0,
                affiliationPrice: parseFloat(document.getElementById('cfg-price-affiliation').value) || 0,
                productPrice: parseFloat(document.getElementById('cfg-price-product').value) || 0,
                updatedAt: new Date().toISOString()
            });
            await update(ref(db, 'configuration/generale'), { updatedAt: new Date().toISOString() });
            alert("✅ Tarification et commissions publiées dans Firebase !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // ============================================================
    // PUBLICATIONS INDIVIDUELLES DES METHODES DE PAIEMENT
    // ============================================================

    // 1. Publier Moov Money
    document.getElementById('btn-pub-moov').addEventListener('click', async () => {
        try {
            await set(ref(db, 'configuration/paiement/moov'), {
                actif: document.getElementById('moov-active').checked,
                nom_marchand: document.getElementById('moov-nom').value.trim(),
                numero_marchand: document.getElementById('moov-numero').value.trim(),
                code_ussd_template: document.getElementById('moov-ussd').value.trim(),
                updatedAt: new Date().toISOString()
            });
            alert("✅ Configuration MOOV MONEY publiée dans Firebase avec succès !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // 2. Publier MTN Mobile Money
    document.getElementById('btn-pub-mtn').addEventListener('click', async () => {
        try {
            await set(ref(db, 'configuration/paiement/mtn'), {
                actif: document.getElementById('mtn-active').checked,
                nom_marchand: document.getElementById('mtn-nom').value.trim(),
                numero_marchand: document.getElementById('mtn-numero').value.trim(),
                code_ussd_template: document.getElementById('mtn-ussd').value.trim(),
                updatedAt: new Date().toISOString()
            });
            alert("✅ Configuration MTN MONEY publiée dans Firebase avec succès !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // 3. Publier Wave Mobile Money
    document.getElementById('btn-pub-wave').addEventListener('click', async () => {
        try {
            await set(ref(db, 'configuration/paiement/wave'), {
                actif: document.getElementById('wave-active').checked,
                nom_marchand: document.getElementById('wave-nom').value.trim(),
                numero_marchand: document.getElementById('wave-numero').value.trim(),
                lien_paiement: document.getElementById('wave-link').value.trim(),
                updatedAt: new Date().toISOString()
            });
            alert("✅ Configuration WAVE publiée dans Firebase avec succès !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // 4. Publier Celtiis Cash
    document.getElementById('btn-pub-celtiis').addEventListener('click', async () => {
        try {
            await set(ref(db, 'configuration/paiement/celtiis'), {
                actif: document.getElementById('celtiis-active').checked,
                nom_marchand: document.getElementById('celtiis-nom').value.trim(),
                numero_marchand: document.getElementById('celtiis-numero').value.trim(),
                code_ussd_template: document.getElementById('celtiis-ussd').value.trim(),
                updatedAt: new Date().toISOString()
            });
            alert("✅ Configuration CELTIIS CASH publiée dans Firebase avec succès !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // 5. Publier Carte Bancaire International
    document.getElementById('btn-pub-card').addEventListener('click', async () => {
        try {
            await set(ref(db, 'configuration/paiement/carte_bancaire'), {
                actif: document.getElementById('card-active').checked,
                fournisseur: document.getElementById('card-provider').value.trim(),
                cle_publique: document.getElementById('card-public-key').value.trim(),
                url_redirect: document.getElementById('card-redirect-url').value.trim(),
                updatedAt: new Date().toISOString()
            });
            alert("✅ Configuration CARTE BANCAIRE publiée dans Firebase avec succès !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // 6. Publier International (PayPal / Wise)
    document.getElementById('btn-pub-intl').addEventListener('click', async () => {
        try {
            await set(ref(db, 'configuration/paiement/intl'), {
                actif: document.getElementById('intl-active').checked,
                email: document.getElementById('intl-email').value.trim(),
                lien_direct: document.getElementById('intl-link').value.trim(),
                iban: document.getElementById('intl-iban').value.trim(),
                updatedAt: new Date().toISOString()
            });
            alert("✅ Configuration PAIEMENT INTERNATIONAL publiée dans Firebase avec succès !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // ============================================================
    // GESTION DES ROLES & AUTRES CONFIGURATIONS
    // ============================================================

    // Mise à jour de rôle
    document.getElementById('btn-assign-role').addEventListener('click', async () => {
        const selectedUid = userSelect.value;
        const newRole = roleTargetSelect.value;
        const newStatus = roleStatusSelect.value;

        if (!selectedUid) return alert("⚠️ Veuillez choisir un utilisateur.");

        try {
            await update(ref(db, `utilisateurs/${selectedUid}`), {
                role: newRole,
                statut: newStatus,
                updatedAt: new Date().toISOString()
            });

            if (newRole === 'livreur') {
                const userSnap = await get(ref(db, `utilisateurs/${selectedUid}`));
                const uData = userSnap.val() || {};
                await update(ref(db, `livreurs/${selectedUid}`), {
                    uid: selectedUid,
                    nom: uData.nomComplet || uData.nom || 'Livreur DAKPROELITE',
                    email: uData.email || '',
                    statutCompte: newStatus === 'actif' ? 'valide' : 'suspendu',
                    updatedAt: new Date().toISOString()
                });
            }

            alert(`✅ Rôle "${newRole.toUpperCase()}" mis à jour avec succès !`);
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // Basculement de Session
    document.getElementById('btn-login-as-role').addEventListener('click', async () => {
        const selectedUid = userSelect.value;
        if (!selectedUid) return alert("⚠️ Veuillez sélectionner un utilisateur.");
        const userSnap = await get(ref(db, `utilisateurs/${selectedUid}`));
        if (userSnap.exists()) {
            const uData = userSnap.val();
            sessionStorage.setItem('activeRoleSession', JSON.stringify({ uid: selectedUid, role: uData.role || 'livreur' }));
            alert(`🔑 Session active configurée pour : ${uData.nomComplet || selectedUid}`);
        }
    });

    // Identification Plateforme
    document.getElementById('btn-pub-identity').addEventListener('click', async () => {
        try {
            await update(ref(db, 'configuration/generale'), {
                appName: document.getElementById('cfg-app-name').value,
                currency: document.getElementById('cfg-currency').value,
                supportEmail: document.getElementById('cfg-support-email').value,
                supportPhone: document.getElementById('cfg-support-phone').value,
                updatedAt: new Date().toISOString()
            });
            alert("✅ Identification publiée avec succès !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // Tarifs & Livraisons
    document.getElementById('btn-pub-delivery').addEventListener('click', async () => {
        try {
            await update(ref(db, 'configuration/generale/delivery'), {
                basePrice: parseFloat(document.getElementById('cfg-delivery-base').value),
                pricePerKm: parseFloat(document.getElementById('cfg-delivery-km').value),
                driverShare: parseFloat(document.getElementById('cfg-delivery-driver-share').value),
                maxRadius: parseFloat(document.getElementById('cfg-delivery-max-radius').value)
            });
            await update(ref(db, 'configuration/generale'), { updatedAt: new Date().toISOString() });
            alert("✅ Tarifs & Livraisons publiés avec succès !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });

    // Sécurité & Maintenance Ciblée par Rôle
    document.getElementById('btn-pub-system').addEventListener('click', async () => {
        try {
            await update(ref(db, 'configuration/generale/system'), {
                maintenance: {
                    global: document.getElementById('sys-maint-global').checked,
                    acheteur: document.getElementById('sys-maint-acheteur').checked,
                    vendeur: document.getElementById('sys-maint-vendeur').checked,
                    livreur: document.getElementById('sys-maint-livreur').checked
                },
                allowRegistrations: document.getElementById('sys-registrations').checked,
                autoApproveDrivers: document.getElementById('sys-auto-drivers').checked,
                minVersion: document.getElementById('sys-min-version').value
            });
            await update(ref(db, 'configuration/generale'), { updatedAt: new Date().toISOString() });
            alert("✅ Sécurité & Maintenance par rôle publiées avec succès !");
        } catch (err) { alert("❌ Erreur : " + err.message); }
    });
}
