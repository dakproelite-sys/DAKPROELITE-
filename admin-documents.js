import { 
    getDatabase, 
    ref, 
    get, 
    update, 
    remove, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

/* ============================================================
   DAKPRO ÉLITE — admin-documents.js
   MODULE ADMINISTRATION : AUDIT ET VALIDATION DES DOCUMENTS
============================================================ */

export async function init() {
    const container = document.getElementById('module-container');
    if (!container) {
        console.warn("DAKPRO ÉLITE : #module-container introuvable.");
        return;
    }

    const db = getDatabase();
    let currentTab = "vendeurs"; // "vendeurs" ou "livreurs"
    let currentStatusFilter = "all"; // "all", "pending", "valid", "rejected"
    let currentTimeFilter = "all";   // "all", "day", "week", "month", "year", "archive"
    let rawDocuments = {};

    // 1. Interface Utilisateur (HTML + CSS)
    container.innerHTML = `
        <style>
            * { box-sizing: border-box; }
            .doc-container { color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 15px; border-radius: 12px; }
            .doc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #282836; padding-bottom: 12px; flex-wrap: wrap; gap: 10px; }
            .doc-title { color: #ffcc00; font-size: 20px; font-weight: 800; text-transform: uppercase; }

            /* Onglets Vendeurs / Livreurs */
            .tabs-role { display: flex; gap: 10px; background: #13131a; padding: 4px; border-radius: 8px; border: 1px solid #282836; }
            .tab-btn { padding: 8px 16px; border: none; border-radius: 6px; background: transparent; color: #a1a1aa; font-size: 11px; font-weight: 800; cursor: pointer; text-transform: uppercase; transition: all 0.2s; }
            .tab-btn.active { background: #ffcc00; color: #000; box-shadow: 0 0 10px rgba(255,204,0,0.3); }

            /* Métriques */
            .doc-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 20px; }
            .stat-box { background: #13131a; border: 1px solid #282836; border-radius: 10px; padding: 12px; text-align: center; cursor: pointer; transition: 0.2s; }
            .stat-box:hover { border-color: #ffcc00; }
            .stat-box .num { font-size: 22px; font-weight: 900; margin-top: 4px; }
            .stat-box .lbl { font-size: 10px; color: #a1a1aa; text-transform: uppercase; font-weight: 700; }
            .c-valid { color: #22c55e; }
            .c-pending { color: #ffcc00; }
            .c-rejected { color: #ef4444; }

            /* Filtres Temporels */
            .time-filters { display: flex; gap: 8px; margin-bottom: 15px; overflow-x: auto; padding-bottom: 5px; }
            .filter-btn { background: #13131a; border: 1px solid #282836; color: #a1a1aa; padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; cursor: pointer; white-space: nowrap; }
            .filter-btn.active { border-color: #ffcc00; color: #ffcc00; background: rgba(255,204,0,0.1); }

            /* Grille de cartes */
            .doc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 15px; }
            .doc-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; }
            .doc-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
            .doc-user-name { font-size: 14px; font-weight: 800; color: #fff; }
            .doc-type { font-size: 11px; color: #ffcc00; text-transform: uppercase; font-weight: 700; margin-top: 4px; }
            
            .doc-preview { width: 100%; height: 160px; background: #0d0d11; border-radius: 8px; border: 1px solid #282836; display: flex; align-items: center; justify-content: center; overflow: hidden; margin: 10px 0; }
            .doc-preview img { width: 100%; height: 100%; object-fit: contain; }
            .doc-preview a { color: #ffcc00; text-decoration: underline; font-size: 12px; font-weight: bold; }

            .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; }
            .st-pending { background: rgba(255,204,0,0.2); color: #ffcc00; border: 1px solid #ffcc00; }
            .st-valid { background: rgba(34,197,94,0.2); color: #22c55e; border: 1px solid #22c55e; }
            .st-rejected { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid #ef4444; }

            .actions-group { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 12px; }
            .btn-act { padding: 8px 5px; border: none; border-radius: 6px; font-size: 10px; font-weight: 800; cursor: pointer; text-transform: uppercase; transition: all 0.2s; }
            .btn-validate { background: #22c55e; color: #000; }
            .btn-validate:hover { background: #16a34a; }
            .btn-reject { background: #ef4444; color: #fff; }
            .btn-reject:hover { background: #dc2626; }
            .btn-delete { background: #282836; color: #ef4444; border: 1px solid #ef4444; }
            .btn-delete:hover { background: #ef4444; color: #fff; }
        </style>

        <div class="doc-container">
            <div class="doc-header">
                <div class="doc-title">📁 Documents Administratifs</div>
                <div class="tabs-role">
                    <button class="tab-btn active" id="tabVendeurs">🏬 Vendeurs</button>
                    <button class="tab-btn" id="tabLivreurs">🛵 Livreurs</button>
                </div>
            </div>

            <div class="doc-stats">
                <div class="stat-box" id="statAll">
                    <div class="lbl">Total Soumis</div>
                    <div class="num" id="cntTotalDocs">0</div>
                </div>
                <div class="stat-box" id="statPending">
                    <div class="lbl">En Attente</div>
                    <div class="num c-pending" id="cntPendingDocs">0</div>
                </div>
                <div class="stat-box" id="statValid">
                    <div class="lbl">Validés</div>
                    <div class="num c-valid" id="cntValidDocs">0</div>
                </div>
                <div class="stat-box" id="statRejected">
                    <div class="lbl">Rejetés / Refusés</div>
                    <div class="num c-rejected" id="cntRejectedDocs">0</div>
                </div>
            </div>

            <div class="time-filters">
                <button class="filter-btn active" data-filter="all">Tous les temps</button>
                <button class="filter-btn" data-filter="day">Aujourd'hui</button>
                <button class="filter-btn" data-filter="week">Cette Semaine</button>
                <button class="filter-btn" data-filter="month">Ce Mois-ci</button>
                <button class="filter-btn" data-filter="year">Cette Année</button>
                <button class="filter-btn" data-filter="archive">📁 Anciennes Années</button>
            </div>

            <div class="doc-grid" id="documentsGridContainer">
                <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:#666;">Chargement des documents...</div>
            </div>
        </div>
    `;

    // 2. Vérification des filtres temporels
    function checkDatePeriod(timestamp, filter) {
        if (!timestamp || filter === "all") return true;
        const docDate = new Date(timestamp);
        const now = new Date();

        const isSameDay = docDate.toDateString() === now.toDateString();
        const firstDayWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        firstDayWeek.setHours(0,0,0,0);
        const isSameWeek = docDate >= firstDayWeek;

        const isSameMonth = docDate.getMonth() === new Date().getMonth() && docDate.getFullYear() === new Date().getFullYear();
        const isSameYear = docDate.getFullYear() === new Date().getFullYear();
        const isArchive = docDate.getFullYear() < new Date().getFullYear();

        if (filter === "day") return isSameDay;
        if (filter === "week") return isSameWeek;
        if (filter === "month") return isSameMonth;
        if (filter === "year") return isSameYear;
        if (filter === "archive") return isArchive;

        return true;
    }

    // 3. Chargement depuis Realtime Database (`/documents`)
    async function loadDocuments() {
        try {
            const docRef = ref(db, 'documents');
            const snapshot = await get(docRef);

            if (snapshot.exists()) {
                rawDocuments = snapshot.val();
            } else {
                rawDocuments = {};
            }

            renderInterface();
        } catch (err) {
            console.error("Erreur de chargement des documents :", err);
            document.getElementById('documentsGridContainer').innerHTML = `
                <div style="color:#ef4444; text-align:center; grid-column: 1 / -1; padding:20px;">
                    ❌ Erreur lors de la connexion à la base de données.
                </div>
            `;
        }
    }

    // 4. Rendu dynamique
    function renderInterface() {
        const grid = document.getElementById('documentsGridContainer');
        grid.innerHTML = "";

        let total = 0, pending = 0, valid = 0, rejected = 0;
        const docKeys = Object.keys(rawDocuments);

        docKeys.forEach(id => {
            const doc = rawDocuments[id];
            
            // Validation du rôle (Vendeur vs Livreur)
            const userRole = (doc.userRole || doc.role || "vendeur").toLowerCase();
            const isLivreur = userRole.includes("livreur") || userRole.includes("driver");
            const isVendeur = userRole.includes("vendeur") || userRole.includes("seller");
            
            const targetRoleMatch = currentTab === "vendeurs" ? isVendeur : isLivreur;
            if (!targetRoleMatch) return;

            // Filtre temporel
            if (!checkDatePeriod(doc.createdAt || doc.timestamp, currentTimeFilter)) return;

            // Compteurs globaux pour le filtre sélectionné
            const status = (doc.status || "en_attente").toLowerCase();
            const isValide = status === "valide" || status === "validé";
            const isRefuse = status === "refuse" || status === "rejeté" || status === "refusé";

            total++;
            if (isValide) valid++;
            else if (isRefuse) rejected++;
            else pending++;

            // Filtre de statut (Tous / En attente / Validés / Refusés)
            if (currentStatusFilter === "pending" && (isValide || isRefuse)) return;
            if (currentStatusFilter === "valid" && !isValide) return;
            if (currentStatusFilter === "rejected" && !isRefuse) return;

            // Rendu de la carte
            const statusText = isValide ? "Validé" : (isRefuse ? "Refusé" : "En Attente");
            const badgeClass = isValide ? "st-valid" : (isRefuse ? "st-rejected" : "st-pending");
            const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Date inconnue";

            const card = document.createElement('div');
            card.className = "doc-card";
            card.innerHTML = `
                <div>
                    <div class="doc-card-header">
                        <div>
                            <div class="doc-user-name">${doc.userName || doc.nom || "Utilisateur Inconnu"}</div>
                            <div style="font-size:10px; color:#a1a1aa;">UID: ${doc.userId || id}</div>
                        </div>
                        <span class="status-badge ${badgeClass}">${statusText}</span>
                    </div>

                    <div class="doc-type">📄 ${doc.documentType || "Pièce d'identité / Document officiel"}</div>
                    
                    <div class="doc-preview">
                        ${doc.fileUrl && doc.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) 
                            ? `<img src="${doc.fileUrl}" alt="Document" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                               <a href="${doc.fileUrl}" target="_blank" style="display:none;">📄 Voir le Document</a>` 
                            : `<a href="${doc.fileUrl || '#'}" target="_blank">🔗 Ouvrir le Document Soumis</a>`
                        }
                    </div>

                    <div style="font-size:10px; color:#a1a1aa; margin-top:5px;">
                        <span>Soumis le : <b>${dateStr}</b></span>
                    </div>
                    ${doc.rejectionReason ? `<div style="font-size:10px; color:#ef4444; margin-top:6px; background:rgba(239,68,68,0.1); padding:6px; border-radius:4px;"><b>Motif du refus :</b> ${doc.rejectionReason}</div>` : ''}
                </div>

                <div class="actions-group">
                    <button class="btn-act btn-validate" data-id="${id}">✅ Valider</button>
                    <button class="btn-act btn-reject" data-id="${id}">❌ Refuser</button>
                    <button class="btn-act btn-delete" data-id="${id}">🗑️ Suppr.</button>
                </div>
            `;

            // Actions
            card.querySelector('.btn-validate').addEventListener('click', () => updateDocStatus(id, "valide"));
            card.querySelector('.btn-reject').addEventListener('click', () => updateDocStatus(id, "refuse"));
            card.querySelector('.btn-delete').addEventListener('click', () => deleteDoc(id));

            grid.appendChild(card);
        });

        // Mise à jour des compteurs UI
        document.getElementById('cntTotalDocs').textContent = total;
        document.getElementById('cntPendingDocs').textContent = pending;
        document.getElementById('cntValidDocs').textContent = valid;
        document.getElementById('cntRejectedDocs').textContent = rejected;

        if (grid.children.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:40px; color:#666;">Aucun document ne correspond aux filtres sélectionnés.</div>`;
        }
    }

    // 5. Mise à jour de statut (Realtime Database `/documents`)
    async function updateDocStatus(id, newStatus) {
        let rejectionReason = "";
        
        if (newStatus === "refuse") {
            rejectionReason = prompt("Veuillez indiquer la raison du refus du document :");
            if (rejectionReason === null) return;
        }

        try {
            const updates = {};
            updates[`documents/${id}/status`] = newStatus;
            updates[`documents/${id}/updatedAt`] = serverTimestamp();
            if (rejectionReason) {
                updates[`documents/${id}/rejectionReason`] = rejectionReason;
            }

            await update(ref(db), updates);
            alert(`✅ Statut du document mis à jour (${newStatus === "valide" ? "Validé" : "Refusé"}).`);
            await loadDocuments();
        } catch (e) {
            alert("❌ Erreur de mise à jour : " + e.message);
        }
    }

    // 6. Suppression
    async function deleteDoc(id) {
        if (!confirm("⚠️ Confirmez-vous la suppression définitive de ce document de Realtime Database ?")) return;

        try {
            await remove(ref(db, `documents/${id}`));
            alert("🗑️ Document supprimé avec succès.");
            await loadDocuments();
        } catch (e) {
            alert("❌ Erreur lors de la suppression : " + e.message);
        }
    }

    // 7. Écouteurs d'événements
    document.getElementById('tabVendeurs').addEventListener('click', (e) => {
        document.getElementById('tabLivreurs').classList.remove('active');
        e.target.classList.add('active');
        currentTab = "vendeurs";
        renderInterface();
    });

    document.getElementById('tabLivreurs').addEventListener('click', (e) => {
        document.getElementById('tabVendeurs').classList.remove('active');
        e.target.classList.add('active');
        currentTab = "livreurs";
        renderInterface();
    });

    document.getElementById('statAll').addEventListener('click', () => { currentStatusFilter = "all"; renderInterface(); });
    document.getElementById('statPending').addEventListener('click', () => { currentStatusFilter = "pending"; renderInterface(); });
    document.getElementById('statValid').addEventListener('click', () => { currentStatusFilter = "valid"; renderInterface(); });
    document.getElementById('statRejected').addEventListener('click', () => { currentStatusFilter = "rejected"; renderInterface(); });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTimeFilter = e.target.dataset.filter;
            renderInterface();
        });
    });

    // Chargement initial
    await loadDocuments();
}
