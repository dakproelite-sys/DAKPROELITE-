// ============================================================
// DAKPRO ÉLITE
// AUTHENTIFICATION CENTRALE
// Firebase Authentication + Realtime Database
// ============================================================

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    ref,
    get,
    set,
    update,
    onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import {
    auth,
    db
} from "./firebase-config.js";


// ============================================================
// RÔLES OFFICIELS DAKPRO ÉLITE
// ============================================================

const ROLES = {
    ACHETEUR: "acheteur",
    VENDEUR: "vendeur",
    LIVREUR: "livreur",
    ADMIN: "admin",
    SUPER_ADMIN: "super_admin"
};


// ============================================================
// UTILISATEUR ACTUEL
// ============================================================

let currentUserData = null;


// ============================================================
// INSCRIPTION
// ============================================================

async function inscrireUtilisateur({
    email,
    password,
    nom,
    telephone = "",
    role = ROLES.ACHETEUR
}) {

    if (!email || !password || !nom) {
        throw new Error("Veuillez remplir les informations obligatoires.");
    }

    if (!Object.values(ROLES).includes(role)) {
        throw new Error("Rôle utilisateur invalide.");
    }

    try {

        const credential = await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password
        );

        const user = credential.user;

        // Nom Firebase Authentication
        await updateProfile(user, {
            displayName: nom.trim()
        });

        // Structure utilisateur Realtime Database
        const userData = {
            uid: user.uid,
            nom: nom.trim(),
            email: email.trim().toLowerCase(),
            telephone: telephone.trim(),
            role: role,

            statut: "actif",

            photo: "",

            dateCreation: Date.now(),
            derniereConnexion: Date.now(),

            emailVerifie: false,

            // Sécurité : ne jamais stocker le mot de passe
            compteBloque: false,

            // Données marketplace
            vendeur: {
                actif: role === ROLES.VENDEUR
            },

            livreur: {
                actif: role === ROLES.LIVREUR
            },

            portefeuille: {
                solde: 0
            }
        };

        await set(
            ref(db, `users/${user.uid}`),
            userData
        );

        currentUserData = userData;

        console.log("✅ Utilisateur créé :", user.uid);

        return {
            success: true,
            user,
            data: userData
        };

    } catch (error) {

        console.error(
            "❌ Erreur inscription :",
            error
        );

        throw convertirErreurFirebase(error);
    }
}


// ============================================================
// CONNEXION
// ============================================================

async function connecterUtilisateur(email, password) {

    if (!email || !password) {
        throw new Error("Email et mot de passe obligatoires.");
    }

    try {

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

        const user = credential.user;

        // Mise à jour de la dernière connexion
        await update(
            ref(db, `users/${user.uid}`),
            {
                derniereConnexion: Date.now()
            }
        );

        const snapshot =
            await get(ref(db, `users/${user.uid}`));

        currentUserData = snapshot.exists()
            ? snapshot.val()
            : null;

        if (
            currentUserData &&
            currentUserData.compteBloque === true
        ) {

            await signOut(auth);

            throw new Error(
                "Votre compte est temporairement bloqué."
            );
        }

        console.log("✅ Connexion réussie :", user.uid);

        return {
            success: true,
            user,
            data: currentUserData
        };

    } catch (error) {

        console.error(
            "❌ Erreur connexion :",
            error
        );

        throw convertirErreurFirebase(error);
    }
}


// ============================================================
// DÉCONNEXION
// ============================================================

async function deconnecterUtilisateur() {

    try {

        await signOut(auth);

        currentUserData = null;

        console.log("✅ Utilisateur déconnecté.");

        return {
            success: true
        };

    } catch (error) {

        console.error(
            "❌ Erreur déconnexion :",
            error
        );

        throw convertirErreurFirebase(error);
    }
}


// ============================================================
// SURVEILLER L'ÉTAT DE CONNEXION
// ============================================================

function surveillerAuthentification(callback) {

    return onAuthStateChanged(
        auth,
        async (user) => {

            if (!user) {

                currentUserData = null;

                if (typeof callback === "function") {
                    callback(null, null);
                }

                return;
            }

            try {

                const snapshot =
                    await get(
                        ref(db, `users/${user.uid}`)
                    );

                if (snapshot.exists()) {

                    currentUserData =
                        snapshot.val();

                } else {

                    currentUserData = {
                        uid: user.uid,
                        nom: user.displayName || "",
                        email: user.email || "",
                        role: ROLES.ACHETEUR
                    };
                }

                if (typeof callback === "function") {

                    callback(
                        user,
                        currentUserData
                    );
                }

            } catch (error) {

                console.error(
                    "Erreur récupération utilisateur :",
                    error
                );

                if (typeof callback === "function") {
                    callback(user, null);
                }
            }
        }
    );
}


// ============================================================
// RÉCUPÉRER L'UTILISATEUR ACTUEL
// ============================================================

function getUtilisateurActuel() {

    return auth.currentUser;
}


// ============================================================
// RÉCUPÉRER LES DONNÉES DE L'UTILISATEUR
// ============================================================

async function getDonneesUtilisateur(uid = null) {

    const user = auth.currentUser;

    const userId = uid || (user ? user.uid : null);

    if (!userId) {
        return null;
    }

    try {

        const snapshot =
            await get(
                ref(db, `users/${userId}`)
            );

        if (!snapshot.exists()) {
            return null;
        }

        currentUserData = snapshot.val();

        return currentUserData;

    } catch (error) {

        console.error(
            "Erreur récupération profil :",
            error
        );

        return null;
    }
}


// ============================================================
// VÉRIFIER UN RÔLE
// ============================================================

async function verifierRole(roleRecherche) {

    const data =
        await getDonneesUtilisateur();

    if (!data) {
        return false;
    }

    return data.role === roleRecherche;
}


// ============================================================
// VÉRIFIER ADMINISTRATEUR
// ============================================================

async function estAdministrateur() {

    const data =
        await getDonneesUtilisateur();

    if (!data) {
        return false;
    }

    return (
        data.role === ROLES.ADMIN ||
        data.role === ROLES.SUPER_ADMIN ||
        data.isAdmin === true
    );
}


// ============================================================
// VÉRIFIER VENDEUR
// ============================================================

async function estVendeur() {

    return await verifierRole(
        ROLES.VENDEUR
    );
}


// ============================================================
// VÉRIFIER LIVREUR
// ============================================================

async function estLivreur() {

    return await verifierRole(
        ROLES.LIVREUR
    );
}


// ============================================================
// VÉRIFIER ACHETEUR
// ============================================================

async function estAcheteur() {

    return await verifierRole(
        ROLES.ACHETEUR
    );
}


// ============================================================
// REDIRECTION SELON LE RÔLE
// ============================================================

async function redirigerSelonRole() {

    const data =
        await getDonneesUtilisateur();

    if (!data) {
        return;
    }

    switch (data.role) {

        case ROLES.SUPER_ADMIN:
        case ROLES.ADMIN:

            window.location.href =
                "admin/dashboard.html";

            break;

        case ROLES.VENDEUR:

            window.location.href =
                "vendeur/dashboard.html";

            break;

        case ROLES.LIVREUR:

            window.location.href =
                "livreur/dashboard.html";

            break;

        case ROLES.ACHETEUR:
        default:

            window.location.href =
                "compte.html";

            break;
    }
}


// ============================================================
// PROTECTION DES PAGES
// ============================================================

async function protegerPage(roleAutorise = null) {

    const user = auth.currentUser;

    if (!user) {

        window.location.href =
            "../compte.html";

        return false;
    }

    const data =
        await getDonneesUtilisateur();

    if (!data) {

        await signOut(auth);

        window.location.href =
            "../compte.html";

        return false;
    }

    if (data.compteBloque === true) {

        await signOut(auth);

        alert(
            "Votre compte est actuellement bloqué."
        );

        window.location.href =
            "../compte.html";

        return false;
    }

    if (roleAutorise) {

        const rolesAutorises =
            Array.isArray(roleAutorise)
                ? roleAutorise
                : [roleAutorise];

        if (!rolesAutorises.includes(data.role)) {

            alert(
                "Accès refusé : vous n'avez pas les autorisations nécessaires."
            );

            window.location.href =
                "../index.html";

            return false;
        }
    }

    return true;
}


// ============================================================
// MODIFICATION DU PROFIL
// ============================================================

async function modifierProfil(uid, nouvellesDonnees) {

    const user = auth.currentUser;

    if (!user) {
        throw new Error(
            "Vous devez être connecté."
        );
    }

    if (uid !== user.uid) {

        const admin =
            await estAdministrateur();

        if (!admin) {
            throw new Error(
                "Vous n'avez pas l'autorisation de modifier ce profil."
            );
        }
    }

    // Ne jamais permettre de modifier le rôle
    // par cette fonction.
    const donneesAutorisees = {
        nom: nouvellesDonnees.nom || "",
        telephone: nouvellesDonnees.telephone || "",
        photo: nouvellesDonnees.photo || ""
    };

    await update(
        ref(db, `users/${uid}`),
        donneesAutorisees
    );

    currentUserData = {
        ...(currentUserData || {}),
        ...donneesAutorisees
    };

    return true;
}


// ============================================================
// ÉCOUTE TEMPS RÉEL DU PROFIL
// ============================================================

function ecouterProfil(uid, callback) {

    if (!uid) {
        return null;
    }

    return onValue(
        ref(db, `users/${uid}`),
        (snapshot) => {

            const data =
                snapshot.exists()
                    ? snapshot.val()
                    : null;

            currentUserData = data;

            if (typeof callback === "function") {
                callback(data);
            }
        }
    );
}


// ============================================================
// CONVERSION DES ERREURS FIREBASE
// ============================================================

function convertirErreurFirebase(error) {

    const code = error?.code || "";

    const erreurs = {

        "auth/email-already-in-use":
            "Cette adresse email est déjà utilisée.",

        "auth/invalid-email":
            "L'adresse email n'est pas valide.",

        "auth/weak-password":
            "Le mot de passe est trop faible.",

        "auth/user-not-found":
            "Aucun compte ne correspond à cet email.",

        "auth/wrong-password":
            "Mot de passe incorrect.",

        "auth/invalid-credential":
            "Email ou mot de passe incorrect.",

        "auth/too-many-requests":
            "Trop de tentatives. Veuillez réessayer plus tard.",

        "auth/network-request-failed":
            "Problème de connexion Internet.",

        "auth/user-disabled":
            "Ce compte a été désactivé."
    };

    return new Error(
        erreurs[code] ||
        error?.message ||
        "Une erreur est survenue."
    );
}


// ============================================================
// API GLOBALE DAKPRO
// ============================================================

window.DAKPRO_AUTH = {

    ROLES,

    inscrireUtilisateur,

    connecterUtilisateur,

    deconnecterUtilisateur,

    surveillerAuthentification,

    getUtilisateurActuel,

    getDonneesUtilisateur,

    verifierRole,

    estAdministrateur,

    estVendeur,

    estLivreur,

    estAcheteur,

    redirigerSelonRole,

    protegerPage,

    modifierProfil,

    ecouterProfil
};


console.log(
    "✅ DAKPRO ÉLITE : auth.js chargé"
);
console.log(
    "✅ Gestion acheteur / vendeur / livreur / admin prête"
);