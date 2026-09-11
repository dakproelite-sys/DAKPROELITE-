import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export async function init() {
    const container = document.getElementById('module-container');
    const db = getDatabase();

    container.innerHTML = `
        <style>
            .pay-container { color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; }
            .pay-title { color: #ffcc00; font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.5px; }

            /* CARTES STATISTIQUES FINANCIÈRES */
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 25px; }
            .stat-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 18px; text-align: center; }
            .stat-card .num { font-size: 22px; font-weight: 800; margin-top: 6px; }
            .stat-card .lbl { font-size: 11px; color: #a1a1aa; text-transform: uppercase; font-weight: 700; }
            .col-gold { color: #ffcc00; }
            .col-green { color: #10b981; }
            .col-red { color: #ef4444; }

            /* FILTRES ET EN-TÊTE TABLEAU */
            .pay-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px; }
            .pay-filter { background: #0d0d11; border: 1px solid #282836; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; outline: none; }
            .pay-filter:focus { border-color: #ffcc00; }
            .pay-table-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 15px; overflow-x: auto; }
            table.pay-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
            table.pay-table th { background: #181820; color: #ffcc00; padding: 12px 10px; font-weight: 700; border-bottom: 1px solid #282836; text-transform: uppercase; font-size: 11px; }
            table.pay-table td { padding: 12px 10px; border-bottom: 1px solid #1c1c26; vertical-align: middle; color: #f5f5f7; }

            /* BADGES DE STATUT DAKPRO */
            .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; display: inline-block; }
            .status-attente { background: rgba(255, 204, 0, 0.15); color: #ffcc00; border: 1px solid #ffcc00; }
            .status-paye { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; }
            .status-rejete { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; }

            /* BOUTONS D'ACTION */
            .btn-pay { padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; border: none; cursor: pointer; margin-right: 5px; transition: opacity 0.2s; text-transform: uppercase; }
            .btn-pay:hover { opacity: 0.8; }
            .btn-valider { background: #ffcc00; color: #000; }
            .btn-rejeter { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
        </style>

        <div class="pay-container">
            <div class="pay-title">💳 Demandes de Retrait & Paiements</div>

            <!-- CARTE DES DEBOURS ET DEMANDES -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="lbl">En Attente de Règlement</div>
                    <div class="num col-gold" id="sum-attente">0 FCFA</div>
                </div>
                <div class="stat-card">
                    <div class="lbl">Total Payé (Validé)</div>
                    <div class="num col-green" id="sum-valide">0 FCFA</div>
                </div>
                <div class="stat-card">
                    <div class="lbl">Demandes Rejetées</div>
                    <div class="num col-red" id="sum-rejete">0 FCFA</div>
                </div>
            </div>

            <!-- SECTION PRINCIPALE DES TRANSACTIONS -->
            <div class="pay-header">
                <div class="pay-title" style="font-size: 14px; margin: 0;">📜 Registre des Demandes de Retrait</div>
                <select id="pay-status-filter" class="pay-filter">
                    <option value="all">Tous les statuts</option>
                    <option value="en_attente">En attente de paiement</option>
                    <option value="paye">Paiements Validés</option>
                    <option value="rejete">Demandes Rejetées</option>
                </select>
            </div>

            <div class="pay-table-card">
                <table class="pay-table">
                    <thead>
                        <tr>
                            <th>Bénéficiaire</th>
                            <th>Rôle</th>
                            <th>Moyen de Paiement</th>
                            <th>Coordonnées / Numéro</th>
                            <th>Montant Demandé</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="pay-list-body">
                        <tr>
                            <td colspan="7" style="text-align: center; color: #ffcc00; padding: 20px;">Chargement des paiements...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const listBody = document.getElementById('pay-list-body');
    const statusFilter = document.getElementById('pay-status-filter');
    const sumAttente = document.getElementById('sum-attente');
    const sumValide = document.getElementById('sum-valide');
    const sumRejete = document.getElementById('sum-rejete');

    let allPayoutsData = {};

    // Écoute en temps réel du nœud `retraits/` dans Realtime Database
    const retraitsRef = ref(db, 'retraits');
    onValue(retraitsRef, (snapshot) => {
        if (snapshot.exists()) {
            allPayoutsData = snapshot.val();
            renderPayouts();
        } else {
            listBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #a1a1aa; padding: 20px;">Aucune demande de retrait enregistrée.</td></tr>`;
            sumAttente.innerText = '0 FCFA';
            sumValide.innerText = '0 FCFA';
            sumRejete.innerText = '0 FCFA';
        }
    });

    function renderPayouts() {
        const filterVal = statusFilter.value;
        let html = '';

        let totalPending = 0;
        let totalPaid = 0;
        let totalRejected = 0;

        Object.keys(allPayoutsData).forEach((payoutId) => {
            const item = allPayoutsData[payoutId];
            const statut = item.statut || 'en_attente';
            const montant = parseFloat(item.montant || 0);
            const dev = item.devise || 'FCFA';

            if (statut === 'en_attente') totalPending += montant;
            else if (statut === 'paye' || statut === 'valide') totalPaid += montant;
            else if (statut === 'rejete') totalRejected += montant;

            if (filterVal !== 'all' && statut !== filterVal) return;

            let badgeClass = 'status-attente';
            let badgeText = '⏳ En Attente';

            if (statut === 'paye' || statut === 'valide') {
                badgeClass = 'status-paye';
                badgeText = '✅ Payé';
            } else if (statut === 'rejete') {
                badgeClass = 'status-rejete';
                badgeText = '❌ Rejeté';
            }

            html += `
                <tr>
                    <td><strong style="color: #fff;">${item.nomUtilisateur || item.email || 'Utilisateur'}</strong></td>
                    <td><span style="color: #a1a1aa; text-transform: uppercase; font-size: 11px;">${item.role || 'Partenaire'}</span></td>
                    <td><strong style="color: #ffcc00;">${item.moyenPaiement || 'Mobile Money'}</strong></td>
                    <td><span style="color: #fff;">${item.numeroPaiement || item.telephone || 'N/A'}</span></td>
                    <td><strong style="color: #ffcc00;">${montant.toLocaleString()} ${dev}</strong></td>
                    <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
                    <td>
                        ${statut === 'en_attente' ? `
                            <button class="btn-pay btn-valider" onclick="updatePayoutStatus('${payoutId}', 'paye')">Payer</button>
                            <button class="btn-pay btn-rejeter" onclick="updatePayoutStatus('${payoutId}', 'rejete')">Rejeter</button>
                        ` : '<span style="color: #a1a1aa; font-size: 11px;">Terminé</span>'}
                    </td>
                </tr>
            `;
        });

        sumAttente.innerText = `${totalPending.toLocaleString()} FCFA`;
        sumValide.innerText = `${totalPaid.toLocaleString()} FCFA`;
        sumRejete.innerText = `${totalRejected.toLocaleString()} FCFA`;

        listBody.innerHTML = html || `<tr><td colspan="7" style="text-align: center; color: #a1a1aa; padding: 20px;">Aucune transaction ne correspond à ce filtre.</td></tr>`;
    }

    statusFilter.addEventListener('change', renderPayouts);

    // Mettre à jour le statut du paiement
    window.updatePayoutStatus = async (payoutId, newStatus) => {
        const actionText = newStatus === 'paye' ? 'VALIDER et MARQUER PAYÉ' : 'REJETER';
        if (confirm(`Voulez-vous vraiment ${actionText} cette demande de retrait ?`)) {
            try {
                await update(ref(db, `retraits/${payoutId}`), {
                    statut: newStatus,
                    processedAt: new Date().toISOString()
                });
                alert(`✅ Transaction mise à jour : ${newStatus.toUpperCase()}`);
            } catch (err) {
                alert("❌ Erreur lors du traitement : " + err.message);
            }
        }
    };
}
