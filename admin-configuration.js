/* ============================================================
   FICHIER : admin-configuration.js
   APPLICATION : DAKPROELITE
   DESCRIPTION : Module de configuration générale, gestion des
                 comptes/rôles et passerelles de paiement complets.
============================================================ */

import { getDatabase, ref, onValue, set, get, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/**
 * Initialisation du module Admin Configuration
 */
export async function init() {
    const container = document.getElementById('module-container');
    if (!container) return;

    const db = getDatabase();
    const auth = getAuth();

    // 1. Structure HTML / UI optimisée du panneau de configuration
    container.innerHTML = `
        <style>
            .cfg-container { color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 15px; border-radius: 12px; }
            .cfg-title { color: #ffcc00; font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.5px; border-left: 4px solid #ffcc00; padding-left: 10px; }
            .cfg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 15px; }
            .cfg-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: space-between; }
            .cfg-card-highlight { border: 1px solid #ffcc00; box-shadow: 0 0 15px rgba(255, 204, 0, 0.15); margin-bottom: 20px; }
            .cfg-card-title { font-size: 13px; font-weight: 800; color: #ffcc00; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #282836; padding-bottom: 8px; }
            
            .form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
            .form-group label { font-size: 10px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
            .form-group input, .form-group select, .form-group textarea { background: #0d0d11; border: 1px solid #282836; color: #ffcc00; padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; outline: none; transition: all 0.2s; }
            .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #ffcc00; box-shadow: 0 0 8px rgba(255, 204, 0, 0.3); }
            
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
            .section-separator { width: 100%; height: 1px; background: #282836; margin: 20px 0; }
        </style>

        <div class="cfg-container">
            <div class="cfg-title">⚙️ CONFIGURATION SYSTÈME & PASSERELLES DAKPROELITE</div>

            <!-- CRÉATION COMPTE -->
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

            <!-- GESTION ROLES -->
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
                <button type="button" id="btn-assign-role" class="btn-role-action">⚡ Appliquer les Modifications</button>
            </div>

            <div class="section-separator"></div>
            <div class="cfg-title">💳 FORMULAIRES DES PASSERELLES DE PAIEMENT</div>

            <!-- PASSERELLES DE PAIEMENT -->
            <div class="cfg-grid">
                
                <!-- MOOV MONEY -->
                <form id="form-moov" class="cfg-card">
                    <div>
                        <div class="cfg-card-title">📱 Moov Money</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Moov</span>
                            <label class="switch"><input type="checkbox" id="moov-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand</label>
                            <input type="text" id="moov-nom" value="JUBILE LALO" placeholder="Ex: JUBILE LALO" required>
                        </div>
                        <div class="form-group">
                            <label>Numéro Marchand / Code ID</label>
                            <input type="text" id="moov-numero" value="342612" placeholder="Ex: 342612" required>
                        </div>
                        <div class="form-group">
                            <label>Syntaxe USSD / Instructions</label>
                            <input type="text" id="moov-ussd" value="*855*4*1*342612*{MONTANT}#" required>
                        </div>
                    </div>
                    <button type="submit" class="btn-pub-section">🚀 Publier Moov dans Firebase</button>
                </form>

                <!-- MTN MOBILE MONEY -->
                <form id="form-mtn" class="cfg-card">
                    <div>
                        <div class="cfg-card-title">📱 MTN Mobile Money</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer MTN</span>
                            <label class="switch"><input type="checkbox" id="mtn-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand</label>
                            <input type="text" id="mtn-nom" placeholder="Ex: DAKPROELITE MTN" required>
                        </div>
                        <div class="form-group">
                            <label>Numéro Marchand / Téléphone</label>
                            <input type="text" id="mtn-numero" placeholder="Ex: 00000000" required>
                        </div>
                        <div class="form-group">
                            <label>Syntaxe USSD / Instructions</label>
                            <input type="text" id="mtn-ussd" value="*139*8*{NUMERO}*{MONTANT}#" required>
                        </div>
                    </div>
                    <button type="submit" class="btn-pub-section">🚀 Publier MTN dans Firebase</button>
                </form>

                <!-- WAVE MOBILE MONEY -->
                <form id="form-wave" class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🌊 Wave Mobile Money</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Wave</span>
                            <label class="switch"><input type="checkbox" id="wave-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand</label>
                            <input type="text" id="wave-nom" placeholder="Ex: DAKPROELITE WAVE" required>
                        </div>
                        <div class="form-group">
                            <label>Numéro Associé</label>
                            <input type="text" id="wave-numero" placeholder="Ex: +22997000000" required>
                        </div>
                        <div class="form-group">
                            <label>Lien Paiement / QR URL</label>
                            <input type="text" id="wave-link" placeholder="https://pay.wave.com/m/...">
                        </div>
                    </div>
                    <button type="submit" class="btn-pub-section">🚀 Publier Wave dans Firebase</button>
                </form>

                <!-- CELTIIS CASH -->
                <form id="form-celtiis" class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🔵 Celtiis Cash</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Celtiis</span>
                            <label class="switch"><input type="checkbox" id="celtiis-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand</label>
                            <input type="text" id="celtiis-nom" placeholder="Ex: DAKPROELITE CELTIIS" required>
                        </div>
                        <div class="form-group">
                            <label>Numéro Marchand / Téléphone</label>
                            <input type="text" id="celtiis-numero" placeholder="Ex: 40000000" required>
                        </div>
                        <div class="form-group">
                            <label>Syntaxe USSD / Instructions</label>
                            <input type="text" id="celtiis-ussd" value="*880*3*{NUMERO}*{MONTANT}#" required>
                        </div>
                    </div>
                    <button type="submit" class="btn-pub-section">🚀 Publier Celtiis dans Firebase</button>
                </form>

                <!-- ORANGE MONEY -->
                <form id="form-orange" class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🍊 Orange Money</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Orange</span>
                            <label class="switch"><input type="checkbox" id="orange-active" checked><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom du Marchand</label>
                            <input type="text" id="orange-nom" placeholder="Ex: DAKPROELITE ORANGE" required>
                        </div>
                        <div class="form-group">
                            <label>Numéro Marchand / Téléphone</label>
                            <input type="text" id="orange-numero" placeholder="Ex: 00000000" required>
                        </div>
                        <div class="form-group">
                            <label>Syntaxe USSD / Instructions</label>
                            <input type="text" id="orange-ussd" value="#144*4*1*{NUMERO}*{MONTANT}#" required>
                        </div>
                    </div>
                    <button type="submit" class="btn-pub-section">🚀 Publier Orange dans Firebase</button>
                </form>

                <!-- CARTE BANCAIRE -->
                <form id="form-card" class="cfg-card">
                    <div>
                        <div class="cfg-card-title">💳 Carte Bancaire (API)</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Cartes</span>
                            <label class="switch"><input type="checkbox" id="card-active"><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Fournisseur (Stripe / FedaPay / Kkiapay)</label>
                            <input type="text" id="card-provider" placeholder="Ex: FedaPay">
                        </div>
                        <div class="form-group">
                            <label>Clé Publique API</label>
                            <input type="text" id="card-public-key" placeholder="pk_live_xxxxxxxxx">
                        </div>
                        <div class="form-group">
                            <label>URL de Callback</label>
                            <input type="text" id="card-redirect-url" placeholder="https://dakproelite.com/callback">
                        </div>
                    </div>
                    <button type="submit" class="btn-pub-section">🚀 Publier Carte dans Firebase</button>
                </form>

                <!-- COMPTE BANCAIRE / VIREMENT -->
                <form id="form-bank" class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🏛️ Virement / RIB Bancaire</div>
                        <div class="switch-group">
                            <span class="switch-label">Activer Virement</span>
                            <label class="switch"><input type="checkbox" id="bank-active"><span class="slider"></span></label>
                        </div>
                        <div class="form-group">
                            <label>Nom de la Banque</label>
                            <input type="text" id="bank-name" placeholder="Ex: BOA / Ecobank / UBA" required>
                        </div>
                        <div class="form-group">
                            <label>Titulaire du Compte</label>
                            <input type="text" id="bank-holder" placeholder="Ex: DAKPROELITE SARL" required>
                        </div>
                        <div class="form-group">
                            <label>Numéro de Compte / IBAN / RIB</label>
                            <input type="text" id="bank-iban" placeholder="BJ660 01001 0000000000 00" required>
                        </div>
                    </div>
                    <button type="submit" class="btn-pub-section">🚀 Publier RIB dans Firebase</button>
                </form>

            </div>

            <div class="section-separator"></div>

            <!-- PARAMÈTRES GÉNÉRAUX -->
            <div class="cfg-grid">
                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🌐 Identité Plateforme</div>
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
                    </div>
                    <button type="button" id="btn-pub-identity" class="btn-pub-section">📢 Publier Identité</button>
                </div>

                <div class="cfg-card">
                    <div>
                        <div class="cfg-card-title">🚧 Contrôle Maintenance</div>
                        <div class="switch-group">
                            <span class="switch-label" style="color:#ff4d4d;">🚨 Maintenance Globale</span>
                            <label class="switch"><input type="checkbox" id="sys-maint-global"><span class="slider"></span></label>
                        </div>
                        <div class="switch-group">
                            <span class="switch-label">🛒 Maintenance Acheteurs</span>
                            <label class="switch"><input type="checkbox" id="sys-maint-acheteur"><span class="slider"></span></label>
                        </div>
                    </div>
                    <button type="button" id="btn-pub-system" class="btn-pub-section">📢 Publier Maintenance</button>
                </div>
            </div>
        </div>
    `;

    // 2. Chargement dynamique des utilisateurs
    const userSelect = document.getElementById('role-user-select');
    onValue(ref(db, 'utilisateurs'), (snapshot) => {
        if (!snapshot.exists()) {
            get(ref(db, 'users')).then(snapUsers => populateUserSelect(snapUsers));
        } else {
            populateUserSelect(snapshot);
        }
    });

    function populateUserSelect(snapshot) {
        if (!userSelect) return;
        userSelect.innerHTML = '<option value="">-- Sélectionner un utilisateur --</option>';
        if (snapshot.exists()) {
            const users = snapshot.val();
            Object.keys(users).forEach((uid) => {
                const u = users[uid];
                const nom = u.nomComplet || u.nom || u.email || uid;
                const roleActuel = u.role ? u.role.toUpperCase() : 'CLIENT';
                userSelect.innerHTML += `<option value="${uid}">${nom} (${u.email || 'Sans email'}) - [${roleActuel}]</option>`;
            });
        }
    }

    // 3. Charger et pré-remplir la configuration existante
    onValue(ref(db, 'configuration'), (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
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
        if (p.orange) {
            document.getElementById('orange-active').checked = !!p.orange.actif;
            if (p.orange.nom_marchand) document.getElementById('orange-nom').value = p.orange.nom_marchand;
            if (p.orange.numero_marchand) document.getElementById('orange-numero').value = p.orange.numero_marchand;
            if (p.orange.code_ussd) document.getElementById('orange-ussd').value = p.orange.code_ussd;
        }
        if (p.carte_bancaire) {
            document.getElementById('card-active').checked = !!p.carte_bancaire.actif;
            if (p.carte_bancaire.fournisseur) document.getElementById('card-provider').value = p.carte_bancaire.fournisseur;
            if (p.carte_bancaire.cle_publique) document.getElementById('card-public-key').value = p.carte_bancaire.cle_publique;
            if (p.carte_bancaire.url_redirect) document.getElementById('card-redirect-url').value = p.carte_bancaire.url_redirect;
        }
        if (p.virement_bancaire) {
            document.getElementById('bank-active').checked = !!p.virement_bancaire.actif;
            if (p.virement_bancaire.nom_banque) document.getElementById('bank-name').value = p.virement_bancaire.nom_banque;
            if (p.virement_bancaire.titulaire) document.getElementById('bank-holder').value = p.virement_bancaire.titulaire;
            if (p.virement_bancaire.iban) document.getElementById('bank-iban').value = p.virement_bancaire.iban;
        }
    });

    // 4. Écriture directe et simultanée dans Firebase sur tous les chemins possibles
    async function publishPaymentToFirebase(key, dataObject) {
        try {
            const updates = {};
            // Synchronisation instantanée sur tous les nœuds lus par les acheteurs
            updates[`configuration/paiements/${key}`] = dataObject;
            updates[`configuration/paiement/${key}`] = dataObject;
            updates[`paiements/${key}`] = dataObject;
            updates[`paiement/${key}`] = dataObject;

            await update(ref(db), updates);
            alert(`✅ Passerelle ${key.toUpperCase()} enregistrée avec succès dans la base de données !`);
        } catch (err) {
            console.error("Erreur Firebase:", err);
            alert(`❌ Erreur d'enregistrement : ${err.message}`);
        }
    }

    // ÉCOUTEURS DES FORMULAIRES DE PAIEMENT
    document.getElementById('form-moov').addEventListener('submit', (e) => {
        e.preventDefault();
        publishPaymentToFirebase('moov', {
            actif: document.getElementById('moov-active').checked,
            nom_marchand: document.getElementById('moov-nom').value.trim(),
            numero_marchand: document.getElementById('moov-numero').value.trim(),
            code_ussd: document.getElementById('moov-ussd').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('form-mtn').addEventListener('submit', (e) => {
        e.preventDefault();
        publishPaymentToFirebase('mtn', {
            actif: document.getElementById('mtn-active').checked,
            nom_marchand: document.getElementById('mtn-nom').value.trim(),
            numero_marchand: document.getElementById('mtn-numero').value.trim(),
            code_ussd: document.getElementById('mtn-ussd').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('form-wave').addEventListener('submit', (e) => {
        e.preventDefault();
        publishPaymentToFirebase('wave', {
            actif: document.getElementById('wave-active').checked,
            nom_marchand: document.getElementById('wave-nom').value.trim(),
            numero_marchand: document.getElementById('wave-numero').value.trim(),
            lien_paiement: document.getElementById('wave-link').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('form-celtiis').addEventListener('submit', (e) => {
        e.preventDefault();
        publishPaymentToFirebase('celtiis', {
            actif: document.getElementById('celtiis-active').checked,
            nom_marchand: document.getElementById('celtiis-nom').value.trim(),
            numero_marchand: document.getElementById('celtiis-numero').value.trim(),
            code_ussd: document.getElementById('celtiis-ussd').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('form-orange').addEventListener('submit', (e) => {
        e.preventDefault();
        publishPaymentToFirebase('orange', {
            actif: document.getElementById('orange-active').checked,
            nom_marchand: document.getElementById('orange-nom').value.trim(),
            numero_marchand: document.getElementById('orange-numero').value.trim(),
            code_ussd: document.getElementById('orange-ussd').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('form-card').addEventListener('submit', (e) => {
        e.preventDefault();
        publishPaymentToFirebase('carte_bancaire', {
            actif: document.getElementById('card-active').checked,
            fournisseur: document.getElementById('card-provider').value.trim(),
            cle_publique: document.getElementById('card-public-key').value.trim(),
            url_redirect: document.getElementById('card-redirect-url').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    document.getElementById('form-bank').addEventListener('submit', (e) => {
        e.preventDefault();
        publishPaymentToFirebase('virement_bancaire', {
            actif: document.getElementById('bank-active').checked,
            nom_banque: document.getElementById('bank-name').value.trim(),
            titulaire: document.getElementById('bank-holder').value.trim(),
            iban: document.getElementById('bank-iban').value.trim(),
            updatedAt: new Date().toISOString()
        });
    });

    // 5. Enregistrement des données globales (Identité et System)
    document.getElementById('btn-pub-identity').addEventListener('click', async () => {
        const updates = {};
        const appName = document.getElementById('cfg-app-name').value.trim();
        const currency = document.getElementById('cfg-currency').value;

        updates['configuration/identite/nom'] = appName;
        updates['configuration/identite/devise'] = currency;
        
        try {
            await update(ref(db), updates);
            alert("✅ Identité mise à jour !");
        } catch (err) {
            alert("❌ Erreur : " + err.message);
        }
    });

    document.getElementById('btn-pub-system').addEventListener('click', async () => {
        const updates = {};
        updates['configuration/maintenance/globale'] = document.getElementById('sys-maint-global').checked;
        updates['configuration/maintenance/acheteurs'] = document.getElementById('sys-maint-acheteur').checked;

        try {
            await update(ref(db), updates);
            alert("✅ Statut de maintenance mis à jour !");
        } catch (err) {
            alert("❌ Erreur : " + err.message);
        }
    });

    // 6. Création de comptes utilisateurs
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
            const userPayload = { uid, nomComplet: nom, email, telephone: phone, role, statut: 'actif', createdAt: new Date().toISOString() };
            
            await set(ref(db, `utilisateurs/${uid}`), userPayload);
            await set(ref(db, `users/${uid}`), userPayload);
            alert(`✅ Compte créé avec succès ! UID: ${uid}`);
            document.getElementById('form-create-account').reset();
        } catch (err) {
            alert("❌ Erreur de création : " + err.message);
        }
    });

    // 7. Modification des rôles
    document.getElementById('btn-assign-role').addEventListener('click', async () => {
        const uid = userSelect.value;
        if (!uid) return alert("❌ Veuillez sélectionner un utilisateur.");

        const targetRole = document.getElementById('role-target-select').value;
        const targetStatus = document.getElementById('role-status-select').value;

        try {
            const updates = {};
            updates[`utilisateurs/${uid}/role`] = targetRole;
            updates[`utilisateurs/${uid}/statut`] = targetStatus;
            updates[`users/${uid}/role`] = targetRole;
            updates[`users/${uid}/statut`] = targetStatus;

            await update(ref(db), updates);
            alert(`✅ Rôle mis à jour avec succès : ${targetRole.toUpperCase()}`);
        } catch (err) {
            alert("❌ Erreur : " + err.message);
        }
    });
}
