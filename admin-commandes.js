import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export async function init() {
    const container = document.getElementById('module-container');
    const db = getDatabase();

    container.innerHTML = `
        <style>
            .cmd-container { color: #f5f5f7; }
            .cmd-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
            .cmd-title { color: #ffcc00; font-size: 18px; font-weight: 800; text-transform: uppercase; }
            .cmd-filter { background: #0d0d11; border: 1px solid #282836; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; outline: none; }
            .cmd-table-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 15px; overflow-x: auto; }
            table.cmd-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
            table.cmd-table th { background: #181820; color: #ffcc00; padding: 12px 10px; font-weight: 700; border-bottom: 1px solid #282836; text-transform: uppercase; font-size: 11px; }
            table.cmd-table td { padding: 12px 10px; border-bottom: 1px solid #1c1c26; vertical-align: middle; }
            .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; display: inline-block; }
            .status-livre { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }
            .status-encours { background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid #3b82f6; }
            .status-attente { background: rgba(255, 204, 0, 0.2); color: #ffcc00; border: 1px solid #ffcc00; }
            .status-annule { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
            .select-status { background: #0d0d11; border: 1px solid #282836; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; outline: none; }
            .select-status:focus { border-color: #ffcc00; }
        </style>

        <div class="cmd-container">
            <div class="cmd-header">
                <div class="cmd-title">🛒 Suivi des Commandes & Paniers</div>
                <div>
                    <select id="cmd-status-filter" class="cmd-filter">
                        <option value="all">Tous les statuts</option>
                        <option value="en_attente">En attente</option>
                        <option value="en_cours">En cours de livraison</option>
                        <option value="livre">Livrées</option>
                        <option value="annule">Annulées</option>
                    </select>
                </div>
            </div>

            <div class="cmd-table-card">
                <table class="cmd-table">
                    <thead>
                        <tr>
                            <th>N° Commande</th>
                            <th>Client / Contact</th>
                            <th>Montant Total</th>
                            <th>Mode Paiement</th>
                            <th>Date</th>
                            <th>Statut</th>
                            <th>Action Statut</th>
                        </tr>
                    </thead>
                    <tbody id="cmd-list-body">
                        <tr>
                            <td colspan="7" style="text-align: center; color: #ffcc00; padding: 20px;">Chargement des commandes...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const listBody = document.getElementById('cmd-list-body');
    const statusFilter = document.getElementById('cmd-status-filter');
    let allOrdersData = {};

    // Écoute en temps réel du nœud `commandes/`
    const ordersRef = ref(db, 'commandes');
    onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
            allOrdersData = snapshot.val();
            renderOrders();
        } else {
            listBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #a1a1aa; padding: 20px;">Aucune commande trouvée.</td></tr>`;
        }
    });

    function renderOrders() {
        const filterVal = statusFilter.value;
        let html = '';

        Object.keys(allOrdersData).forEach((cmdId) => {
            const cmd = allOrdersData[cmdId];
            const statut = (cmd.statut || 'en_attente').toLowerCase();
            const montant = cmd.montantTotal || cmd.total || 0;
            const devise = cmd.devise || 'FCFA';

            if (filterVal !== 'all' && statut !== filterVal) {
                return;
            }

            let badgeClass = 'status-attente';
            let badgeText = '⏳ En attente';

            if (statut === 'livre' || statut === 'livrée') {
                badgeClass = 'status-livre';
                badgeText = '✅ Livrée';
            } else if (statut === 'en_cours' || statut === 'expédiée') {
                badgeClass = 'status-encours';
                badgeText = '🚚 En cours';
            } else if (statut === 'annule' || statut === 'annulée') {
                badgeClass = 'status-annule';
                badgeText = '❌ Annulée';
            }

            html += `
                <tr>
                    <td><strong style="color: #ffcc00; font-size: 12px;">#${cmdId.slice(-8)}</strong></td>
                    <td>
                        <div><strong>${cmd.clientNom || cmd.emailClient || 'Client Anonyme'}</strong></div>
                        <div style="font-size: 10px; color: #a1a1aa;">📞 ${cmd.telephone || 'Non renseigné'}</div>
                    </td>
                    <td><strong style="color: #10b981;">${parseFloat(montant).toLocaleString()} ${devise}</strong></td>
                    <td><span style="color: #a1a1aa;">${cmd.moyenPaiement || 'Mobile Money / Card'}</span></td>
                    <td style="font-size: 11px; color: #a1a1aa;">${cmd.dateCommande ? new Date(cmd.dateCommande).toLocaleDateString() : 'N/A'}</td>
                    <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
                    <td>
                        <select class="select-status" onchange="updateOrderStatus('${cmdId}', this.value)">
                            <option value="">Modifier...</option>
                            <option value="en_attente">En attente</option>
                            <option value="en_cours">En cours</option>
                            <option value="livre">Livrée</option>
                            <option value="annule">Annulée</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        listBody.innerHTML = html || `<tr><td colspan="7" style="text-align: center; color: #a1a1aa; padding: 20px;">Aucune commande ne correspond à ce filtre.</td></tr>`;
    }

    statusFilter.addEventListener('change', renderOrders);

    // Modifier le statut de la commande
    window.updateOrderStatus = async (cmdId, newStatus) => {
        if (!newStatus) return;
        try {
            await update(ref(db, `commandes/${cmdId}`), {
                statut: newStatus,
                updatedAt: new Date().toISOString()
            });
            alert(`✅ Statut de la commande mis à jour : ${newStatus.toUpperCase()}`);
        } catch (err) {
            alert("❌ Erreur de mise à jour : " + err.message);
        }
    };
}
