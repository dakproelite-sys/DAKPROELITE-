import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export async function init() {
    const container = document.getElementById('module-container');
    const db = getDatabase();

    // Structure HTML du tableau de bord complet
    container.innerHTML = `
        <style>
            .dash-header { text-align: center; margin-bottom: 25px; }
            .dash-header h2 { color: #ffcc00; font-size: 20px; font-weight: 800; text-transform: uppercase; }
            .dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 25px; }
            .dash-card { background: #181820; border: 1px solid #282836; border-radius: 12px; padding: 18px; text-align: center; }
            .dash-card h3 { color: #a1a1aa; font-size: 13px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; }
            .dash-card .val { font-size: 22px; font-weight: 800; color: #ffffff; }
            .dash-card .val.highlight { color: #ffcc00; }
            .dash-card .val.green { color: #10b981; }
            .dash-card .val.blue { color: #3b82f6; }
            .dash-section-title { color: #ffcc00; font-size: 15px; font-weight: 700; margin: 20px 0 12px 0; border-bottom: 1px solid #282836; padding-bottom: 6px; }
        </style>

        <div class="dash-header">
            <h2>📊 Vue Générale & Métriques Financières</h2>
        </div>

        <!-- SECTION 1 : STATISTIQUES FINANCIÈRES -->
        <div class="dash-section-title">💰 Finances & Revenus Globaux</div>
        <div class="dash-grid">
            <div class="dash-card">
                <h3>Total Ventes</h3>
                <div class="val green" id="stat-total-sales">0 FCFA</div>
            </div>
            <div class="dash-card">
                <h3>Gains Plateforme</h3>
                <div class="val highlight" id="stat-platform-earnings">0 FCFA</div>
            </div>
            <div class="dash-card">
                <h3>Gains Affiliation</h3>
                <div class="val blue" id="stat-affiliate-earnings">0 FCFA</div>
            </div>
            <div class="dash-card">
                <h3>Total Retraits Validés</h3>
                <div class="val" id="stat-withdrawals-total">0 FCFA</div>
            </div>
        </div>

        <!-- SECTION 2 : COMPTES ET RÔLES -->
        <div class="dash-section-title">👥 Utilisateurs & Profils</div>
        <div class="dash-grid">
            <div class="dash-card">
                <h3>Total Utilisateurs</h3>
                <div class="val" id="stat-users">0</div>
            </div>
            <div class="dash-card">
                <h3>Vendeurs Actifs</h3>
                <div class="val" id="stat-sellers">0</div>
            </div>
            <div class="dash-card">
                <h3>Livreurs Inscrits</h3>
                <div class="val" id="stat-couriers">0</div>
            </div>
            <div class="dash-card">
                <h3>Architectes</h3>
                <div class="val" id="stat-architects">0</div>
            </div>
        </div>

        <!-- SECTION 3 : ACTIVITÉ & DOCUMENTS -->
        <div class="dash-section-title">📦 Activité & Validation Documents</div>
        <div class="dash-grid">
            <div class="dash-card">
                <h3>Total Produits</h3>
                <div class="val" id="stat-products">0</div>
            </div>
            <div class="dash-card">
                <h3>Total Commandes</h3>
                <div class="val" id="stat-orders">0</div>
            </div>
            <div class="dash-card">
                <h3>Docs Vendeurs</h3>
                <div class="val" id="stat-docs-sellers">0</div>
            </div>
            <div class="dash-card">
                <h3>Docs Livreurs</h3>
                <div class="val" id="stat-docs-couriers">0</div>
            </div>
        </div>
    `;

    // Formatage monétaire FCFA
    const formatFCFA = (montant) => new Intl.NumberFormat('fr-FR').format(montant) + " FCFA";

    try {
        // 1. Récupération et analyse des Utilisateurs / Rôles
        const usersSnap = await get(ref(db, 'users'));
        if (usersSnap.exists()) {
            const usersData = usersSnap.val();
            const userList = Object.values(usersData);

            document.getElementById('stat-users').innerText = userList.length;
            document.getElementById('stat-sellers').innerText = userList.filter(u => (u.role || '').toLowerCase() === 'vendeur').length;
            document.getElementById('stat-couriers').innerText = userList.filter(u => (u.role || '').toLowerCase() === 'livreur').length;
            document.getElementById('stat-architects').innerText = userList.filter(u => (u.role || '').toLowerCase() === 'architecte').length;
        }

        // 2. Analyse des Commandes et Calcul des Ventes / Gains
        const ordersSnap = await get(ref(db, 'commandes'));
        if (ordersSnap.exists()) {
            const orders = Object.values(ordersSnap.val());
            document.getElementById('stat-orders').innerText = orders.length;

            let totalVentes = 0;
            let gainsPlateforme = 0;

            orders.forEach(order => {
                const montant = parseFloat(order.montantTotal || order.total || 0);
                totalVentes += montant;
                // Calcul de la commission plateforme (ex: 5% ou valeur de la commande)
                gainsPlateforme += parseFloat(order.commissionPlateforme || (montant * 0.05));
            });

            document.getElementById('stat-total-sales').innerText = formatFCFA(totalVentes);
            document.getElementById('stat-platform-earnings').innerText = formatFCFA(gainsPlateforme);
        }

        // 3. Calcul des Commissions d'Affiliation
        const affSnap = await get(ref(db, 'commissions'));
        if (affSnap.exists()) {
            const commissions = Object.values(affSnap.val());
            const totalAff = commissions.reduce((acc, curr) => acc + parseFloat(curr.montant || 0), 0);
            document.getElementById('stat-affiliate-earnings').innerText = formatFCFA(totalAff);
        }

        // 4. Calcul des Retraits Validés
        const retraitsSnap = await get(ref(db, 'retraits'));
        if (retraitsSnap.exists()) {
            const retraits = Object.values(retraitsSnap.val());
            const totalRetraits = retraits
                .filter(r => (r.statut || '').toLowerCase() === 'valide' || (r.statut || '').toLowerCase() === 'paye')
                .reduce((acc, curr) => acc + parseFloat(curr.montant || 0), 0);
            document.getElementById('stat-withdrawals-total').innerText = formatFCFA(totalRetraits);
        }

        // 5. Total Produits
        const productsSnap = await get(ref(db, 'produits'));
        if (productsSnap.exists()) {
            document.getElementById('stat-products').innerText = Object.keys(productsSnap.val()).length;
        }

        // 6. Documents Vendeurs & Livreurs
        const docsVendeursSnap = await get(ref(db, 'documents_vendeurs'));
        if (docsVendeursSnap.exists()) {
            document.getElementById('stat-docs-sellers').innerText = Object.keys(docsVendeursSnap.val()).length;
        }

        const docsLivreursSnap = await get(ref(db, 'documents_livreurs'));
        if (docsLivreursSnap.exists()) {
            document.getElementById('stat-docs-couriers').innerText = Object.keys(docsLivreursSnap.val()).length;
        }

    } catch (error) {
        console.error("Erreur de synchronisation Realtime Database :", error);
    }
}
